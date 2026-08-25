// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Voting is ERC2771Context {
    // =========================================================
    // ROLES
    // =========================================================

    enum Role {
        None,
        Voter,
        Admin,
        SuperAdmin
    }

    address public superAdmin;

    // =========================================================
    // USER
    // =========================================================

    struct User {
        address wallet;
        string fullName;
        uint256 dateOfBirth;
        Role role;
        bool registered;
        bool active;
    }

    mapping(address => User) public users;
    address[] public registeredUsers;

    // =========================================================
// SESSION KEY
// =========================================================

// One temporary browser/session wallet authorized by each voter.
// The private key for this address is NOT the MetaMask private key.
mapping(address => address) public sessionKeys;

// Nonce used to prevent replaying an old signed vote.
mapping(address => uint256) public voteNonces;

// Nonce used to prevent replaying
// an old candidate-registration signature.
mapping(address => uint256)
    public candidateNonces;

    // =========================================================
    // INSTITUTION
    // =========================================================

    struct Institution {
        uint256 id;
        string name;
        bool exists;
        uint256 organizationCount;
    }

    uint256 public institutionCount;

    mapping(uint256 => Institution) public institutions;
    mapping(bytes32 => bool) public institutionNameExists;

    // =========================================================
    // ORGANIZATION
    // =========================================================

    struct Organization {
        uint256 id;
        string name;
        bool exists;
        uint256 postCount;
    }

    mapping(uint256 => mapping(uint256 => Organization))
        public organizations;

    mapping(uint256 => mapping(bytes32 => bool))
        public organizationNameExists;

    // =========================================================
    // ELECTION / POST
    // =========================================================

    struct Post {
        uint256 id;
        string title;
        bool active;

        // Number of winners.
        uint256 seatCount;

        // Maximum number of candidates allowed.
        uint256 maxCandidateCount;

        uint256 candidateCount;

        uint256 minCandidateAge;
        uint256 maxCandidateAge;

        uint256 candidateRegistrationStart;
        uint256 candidateRegistrationEnd;

        uint256 votingStart;
        uint256 votingEnd;
    }

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(uint256 => Post)
            )
    ) public posts;

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(bytes32 => bool)
            )
    ) public postNameExists;

    // =========================================================
    // CANDIDATE
    // =========================================================

    struct Candidate {
        uint256 id;
        address wallet;
        string name;
        uint256 voteCount;
        bool exists;
    }

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(
                        uint256 =>
                            mapping(uint256 => Candidate)
                    )
            )
    ) public candidates;

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(
                        uint256 =>
                            mapping(address => bool)
                    )
            )
    ) public isCandidate;

    // =========================================================
    // VOTING
    // =========================================================

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(
                        uint256 =>
                            mapping(address => uint256)
                    )
            )
    ) public userVoteCount;

    mapping(
        uint256 =>
            mapping(
                uint256 =>
                    mapping(
                        uint256 =>
                            mapping(
                                address =>
                                    mapping(uint256 => bool)
                            )
                    )
            )
    ) public hasVotedCandidate;

    // =========================================================
    // EVENTS
    // =========================================================

    event UserRegistered(
        address indexed wallet,
        string fullName,
        uint256 dateOfBirth,
        uint256 time
    );

    event UserRoleChanged(
        address indexed wallet,
        Role newRole,
        uint256 time
    );

    event UserStatusChanged(
        address indexed wallet,
        bool active,
        uint256 time
    );

    event InstitutionCreated(
        uint256 indexed institutionId,
        string name,
        address indexed createdBy,
        uint256 time
    );

    event OrganizationCreated(
        uint256 indexed institutionId,
        uint256 indexed organizationId,
        string name,
        address createdBy,
        uint256 time
    );

    event PostCreated(
        uint256 indexed institutionId,
        uint256 indexed organizationId,
        uint256 indexed postId,
        string title,
        uint256 time
    );

    event CandidateRegistered(
        uint256 indexed institutionId,
        uint256 indexed organizationId,
        uint256 indexed postId,
        uint256 candidateId,
        address candidateWallet,
        string candidateName,
        uint256 time
    );

    event VoteCast(
        uint256 indexed institutionId,
        uint256 indexed organizationId,
        uint256 indexed postId,
        address voter,
        uint256 candidateId,
        uint256 time
    );

    event SessionKeyAuthorized(
    address indexed voter,
    address indexed sessionKey,
    uint256 time
);

event SessionKeyRevoked(
    address indexed voter,
    address indexed sessionKey,
    uint256 time
);

    // =========================================================
    // MODIFIERS
    // =========================================================

    modifier onlySuperAdmin() {
        require(
            _msgSender() == superAdmin,
            "Only SuperAdmin can do this"
        );
        _;
    }

    modifier onlyAdminOrSuperAdmin() {
        address sender = _msgSender();

        require(
            users[sender].role == Role.Admin ||
                users[sender].role == Role.SuperAdmin,
            "Only Admin or SuperAdmin can do this"
        );

        require(
            users[sender].active,
            "Account is inactive"
        );

        _;
    }

    modifier onlyRegisteredActiveUser() {
        address sender = _msgSender();

        require(
            users[sender].registered,
            "User is not registered"
        );

        require(
            users[sender].active,
            "Account is inactive"
        );

        _;
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor(
        string memory _superAdminName,
        uint256 _superAdminDateOfBirth,
        address _trustedForwarder
    )
        ERC2771Context(_trustedForwarder)
    {
        superAdmin = msg.sender;

        users[msg.sender] = User({
            wallet: msg.sender,
            fullName: _superAdminName,
            dateOfBirth: _superAdminDateOfBirth,
            role: Role.SuperAdmin,
            registered: true,
            active: true
        });

        registeredUsers.push(msg.sender);

        emit UserRegistered(
            msg.sender,
            _superAdminName,
            _superAdminDateOfBirth,
            block.timestamp
        );

        emit UserRoleChanged(
            msg.sender,
            Role.SuperAdmin,
            block.timestamp
        );
    }

    // =========================================================
    // SELF REGISTRATION
    // =========================================================

    function registerUser(
    string memory _fullName,
    uint256 _dateOfBirth,
    address _sessionKey
) public {
        address sender = _msgSender();

        require(
            sender != address(0),
            "Invalid wallet address"
        );

        require(
            !users[sender].registered,
            "User already registered"
        );

        require(
            bytes(_fullName).length > 0,
            "Full name is required"
        );

        require(
            _dateOfBirth > 0,
            "Date of birth is required"
        );

        require(
            _dateOfBirth < block.timestamp,
            "Invalid date of birth"
        );

        require(
    _sessionKey != address(0),
    "Invalid session key"
);

        users[sender] = User({
            wallet: sender,
            fullName: _fullName,
            dateOfBirth: _dateOfBirth,
            role: Role.Voter,
            registered: true,
            active: true
        });

        registeredUsers.push(sender);

        sessionKeys[sender] = _sessionKey;

        emit UserRegistered(
            sender,
            _fullName,
            _dateOfBirth,
            block.timestamp
        );

        emit SessionKeyAuthorized(
    sender,
    _sessionKey,
    block.timestamp
);
}

function revokeSessionKey() public onlyRegisteredActiveUser {
    address sender = _msgSender();

    address oldSessionKey = sessionKeys[sender];

    require(
        oldSessionKey != address(0),
        "No session key authorized"
    );

    sessionKeys[sender] = address(0);

    emit SessionKeyRevoked(
        sender,
        oldSessionKey,
        block.timestamp
    );
}

// =========================================================
// SUPERADMIN USER MANAGEMENT
// =========================================================

    function makeAdmin(
        address _wallet
    ) public onlySuperAdmin {
        require(
            users[_wallet].registered,
            "User not registered"
        );

        require(
            _wallet != superAdmin,
            "Cannot modify SuperAdmin role"
        );

        users[_wallet].role = Role.Admin;

        emit UserRoleChanged(
            _wallet,
            Role.Admin,
            block.timestamp
        );
    }

    function removeAdmin(
        address _wallet
    ) public onlySuperAdmin {
        require(
            users[_wallet].registered,
            "User not registered"
        );

        require(
            _wallet != superAdmin,
            "Cannot modify SuperAdmin role"
        );

        users[_wallet].role = Role.Voter;

        emit UserRoleChanged(
            _wallet,
            Role.Voter,
            block.timestamp
        );
    }

    function setUserActiveStatus(
        address _wallet,
        bool _active
    ) public onlySuperAdmin {
        require(
            users[_wallet].registered,
            "User not registered"
        );

        require(
            _wallet != superAdmin,
            "Cannot disable SuperAdmin"
        );

        users[_wallet].active = _active;

        emit UserStatusChanged(
            _wallet,
            _active,
            block.timestamp
        );
    }

    // =========================================================
    // CREATE INSTITUTION
    // =========================================================

    function createInstitution(
        string memory _name
    ) public onlyAdminOrSuperAdmin {
        require(
            bytes(_name).length > 0,
            "Institution name required"
        );

        bytes32 nameHash =
            keccak256(bytes(_name));

        require(
            !institutionNameExists[nameHash],
            "Institution already exists"
        );

        institutionCount++;

        institutions[institutionCount] =
            Institution({
                id: institutionCount,
                name: _name,
                exists: true,
                organizationCount: 0
            });

        institutionNameExists[nameHash] = true;

        emit InstitutionCreated(
            institutionCount,
            _name,
            _msgSender(),
            block.timestamp
        );
    }

    // =========================================================
    // CREATE ORGANIZATION
    // =========================================================

    function createOrganization(
        uint256 _institutionId,
        string memory _name
    ) public onlyAdminOrSuperAdmin {
        require(
            institutions[_institutionId].exists,
            "Institution not found"
        );

        require(
            bytes(_name).length > 0,
            "Organization name required"
        );

        bytes32 nameHash =
            keccak256(bytes(_name));

        require(
            !organizationNameExists[
                _institutionId
            ][nameHash],
            "Organization already exists"
        );

        institutions[
            _institutionId
        ].organizationCount++;

        uint256 organizationId =
            institutions[
                _institutionId
            ].organizationCount;

        organizations[
            _institutionId
        ][organizationId] = Organization({
            id: organizationId,
            name: _name,
            exists: true,
            postCount: 0
        });

        organizationNameExists[
            _institutionId
        ][nameHash] = true;

        emit OrganizationCreated(
            _institutionId,
            organizationId,
            _name,
            _msgSender(),
            block.timestamp
        );
    }

    // =========================================================
    // CREATE ELECTION / POST
    // =========================================================

    function createPost(
        uint256 _institutionId,
        uint256 _organizationId,
        string memory _title,
        uint256 _seatCount,
        uint256 _maxCandidateCount,
        uint256 _minCandidateAge,
        uint256 _maxCandidateAge,
        uint256 _candidateRegistrationStart,
        uint256 _candidateRegistrationEnd,
        uint256 _votingStart,
        uint256 _votingEnd
    ) public onlyAdminOrSuperAdmin {
        require(
            institutions[_institutionId].exists,
            "Institution not found"
        );

        require(
            organizations[
                _institutionId
            ][_organizationId].exists,
            "Organization not found"
        );

        require(
            bytes(_title).length > 0,
            "Post title required"
        );

        require(
            _seatCount > 0,
            "Seat count must be greater than 0"
        );

        require(
            _maxCandidateCount >= _seatCount,
            "Candidate limit must be >= seat count"
        );

        require(
            _minCandidateAge > 0,
            "Minimum age must be greater than 0"
        );

        require(
            _maxCandidateAge >= _minCandidateAge,
            "Maximum age must be >= minimum age"
        );

        require(
            _candidateRegistrationEnd >
                _candidateRegistrationStart,
            "Invalid candidate registration period"
        );

        require(
            _votingStart >
                _candidateRegistrationEnd,
            "Voting must start after candidate registration ends"
        );

        require(
            _votingEnd > _votingStart,
            "Voting end must be after voting start"
        );

        bytes32 titleHash =
            keccak256(bytes(_title));

        require(
            !postNameExists[
                _institutionId
            ][_organizationId][titleHash],
            "Post already exists"
        );

        organizations[
            _institutionId
        ][_organizationId].postCount++;

        uint256 postId =
            organizations[
                _institutionId
            ][_organizationId].postCount;

        posts[
            _institutionId
        ][_organizationId][postId] = Post({
            id: postId,
            title: _title,
            active: true,
            seatCount: _seatCount,
            maxCandidateCount: _maxCandidateCount,
            candidateCount: 0,
            minCandidateAge: _minCandidateAge,
            maxCandidateAge: _maxCandidateAge,
            candidateRegistrationStart:
                _candidateRegistrationStart,
            candidateRegistrationEnd:
                _candidateRegistrationEnd,
            votingStart: _votingStart,
            votingEnd: _votingEnd
        });

        postNameExists[
            _institutionId
        ][_organizationId][titleHash] = true;

        emit PostCreated(
            _institutionId,
            _organizationId,
            postId,
            _title,
            block.timestamp
        );
    }

    // =========================================================
    // AGE CALCULATION
    // =========================================================

    function calculateAge(
        uint256 _dateOfBirth
    ) public view returns (uint256) {
        require(
            _dateOfBirth > 0 &&
                _dateOfBirth < block.timestamp,
            "Invalid date of birth"
        );

        return
            (block.timestamp - _dateOfBirth) /
            31556952;
    }

    // =========================================================
    // CANDIDATE ELIGIBILITY
    // =========================================================

    function canBecomeCandidate(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId,
        address _wallet
    )
        public
        view
        returns (
            bool eligible,
            string memory reason
        )
    {
        if (!users[_wallet].registered) {
            return (
                false,
                "User is not registered"
            );
        }

        if (!users[_wallet].active) {
            return (
                false,
                "User account is inactive"
            );
        }

        Post memory post =
            posts[
                _institutionId
            ][_organizationId][_postId];

        if (!post.active) {
            return (
                false,
                "Post is not active"
            );
        }

        if (
            block.timestamp <
            post.candidateRegistrationStart
        ) {
            return (
                false,
                "Candidate registration has not started"
            );
        }

        if (
            block.timestamp >
            post.candidateRegistrationEnd
        ) {
            return (
                false,
                "Candidate registration has ended"
            );
        }

        if (
            isCandidate[
                _institutionId
            ][_organizationId][_postId][_wallet]
        ) {
            return (
                false,
                "Already registered as candidate"
            );
        }

        if (
            post.candidateCount >=
            post.maxCandidateCount
        ) {
            return (
                false,
                "Candidate limit reached"
            );
        }

        uint256 age =
            calculateAge(
                users[_wallet].dateOfBirth
            );

        if (
            age <
            post.minCandidateAge
        ) {
            return (
                false,
                "Below minimum candidate age"
            );
        }

        if (
            age >
            post.maxCandidateAge
        ) {
            return (
                false,
                "Above maximum candidate age"
            );
        }

        return (
            true,
            "Eligible"
        );
    }

    // =========================================================
    // SELF-REGISTER AS CANDIDATE
    // =========================================================

    function becomeCandidate(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId
    ) public onlyRegisteredActiveUser {
        address sender = _msgSender();

        (
            bool eligible,
            string memory reason
        ) = canBecomeCandidate(
                _institutionId,
                _organizationId,
                _postId,
                sender
            );

        require(
            eligible,
            reason
        );

        Post storage post =
            posts[
                _institutionId
            ][_organizationId][_postId];

        post.candidateCount++;

        uint256 candidateId =
            post.candidateCount;

        candidates[
            _institutionId
        ][_organizationId][_postId][
            candidateId
        ] = Candidate({
            id: candidateId,
            wallet: sender,
            name: users[sender].fullName,
            voteCount: 0,
            exists: true
        });

        isCandidate[
            _institutionId
        ][_organizationId][_postId][
            sender
        ] = true;

        emit CandidateRegistered(
            _institutionId,
            _organizationId,
            _postId,
            candidateId,
            sender,
            users[sender].fullName,
            block.timestamp
        );
    }

    // =========================================================
// SESSION KEY CANDIDATE REGISTRATION
// =========================================================

function becomeCandidateWithSessionKey(
    address _voter,
    uint256 _institutionId,
    uint256 _organizationId,
    uint256 _postId,
    uint256 _nonce,
    bytes memory _signature
) public {
    require(
        users[_voter].registered,
        "User is not registered"
    );

    require(
        users[_voter].active,
        "Account is inactive"
    );

    require(
        sessionKeys[_voter] != address(0),
        "No session key authorized"
    );

    require(
        _nonce == candidateNonces[_voter],
        "Invalid candidate nonce"
    );

    // -----------------------------------------------------
    // CREATE THE EXACT MESSAGE THE SESSION WALLET SIGNED
    // -----------------------------------------------------

    bytes32 messageHash = keccak256(
        abi.encodePacked(
            address(this),
            block.chainid,
            _voter,
            _institutionId,
            _organizationId,
            _postId,
            _nonce
        )
    );

    bytes32 ethSignedMessageHash =
        MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

    address recoveredSigner =
        ECDSA.recover(
            ethSignedMessageHash,
            _signature
        );

    require(
        recoveredSigner == sessionKeys[_voter],
        "Invalid session signature"
    );

    // -----------------------------------------------------
    // CHECK CANDIDATE ELIGIBILITY
    // -----------------------------------------------------

    (
        bool eligible,
        string memory reason
    ) = canBecomeCandidate(
        _institutionId,
        _organizationId,
        _postId,
        _voter
    );

    require(
        eligible,
        reason
    );

    // -----------------------------------------------------
    // USE NONCE
    // -----------------------------------------------------

    candidateNonces[_voter]++;

    // -----------------------------------------------------
    // REGISTER CANDIDATE
    // -----------------------------------------------------

    Post storage post =
        posts[
            _institutionId
        ][_organizationId][_postId];

    post.candidateCount++;

    uint256 candidateId =
        post.candidateCount;

    candidates[
        _institutionId
    ][_organizationId][_postId][
        candidateId
    ] = Candidate({
        id: candidateId,
        wallet: _voter,
        name: users[_voter].fullName,
        voteCount: 0,
        exists: true
    });

    isCandidate[
        _institutionId
    ][_organizationId][_postId][
        _voter
    ] = true;

    emit CandidateRegistered(
        _institutionId,
        _organizationId,
        _postId,
        candidateId,
        _voter,
        users[_voter].fullName,
        block.timestamp
    );
}

    // =========================================================
    // VOTE
    // =========================================================

    function vote(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId,
        uint256 _candidateId
    ) public onlyRegisteredActiveUser {
        address sender = _msgSender();

        Post storage post =
            posts[
                _institutionId
            ][_organizationId][_postId];

        require(
            post.active,
            "Post is not active"
        );

        require(
            block.timestamp >= post.votingStart,
            "Voting has not started"
        );

        require(
            block.timestamp <= post.votingEnd,
            "Voting has ended"
        );

        require(
            candidates[
                _institutionId
            ][_organizationId][_postId][
                _candidateId
            ].exists,
            "Invalid candidate"
        );

        require(
            !hasVotedCandidate[
                _institutionId
            ][_organizationId][_postId][
                sender
            ][_candidateId],
            "Already voted for this candidate"
        );

        require(
            userVoteCount[
                _institutionId
            ][_organizationId][_postId][
                sender
            ] < post.seatCount,
            "Vote limit reached"
        );

        hasVotedCandidate[
            _institutionId
        ][_organizationId][_postId][
            sender
        ][_candidateId] = true;

        userVoteCount[
            _institutionId
        ][_organizationId][_postId][
            sender
        ]++;

        candidates[
            _institutionId
        ][_organizationId][_postId][
            _candidateId
        ].voteCount++;

        emit VoteCast(
            _institutionId,
            _organizationId,
            _postId,
            sender,
            _candidateId,
            block.timestamp
        );
    }

    function voteWithSessionKey(
    address _voter,
    uint256 _institutionId,
    uint256 _organizationId,
    uint256 _postId,
    uint256 _candidateId,
    uint256 _nonce,
    bytes memory _signature
) public {
    require(
        users[_voter].registered,
        "User is not registered"
    );

    require(
        users[_voter].active,
        "Account is inactive"
    );

    require(
        sessionKeys[_voter] != address(0),
        "No session key authorized"
    );

    require(
        _nonce == voteNonces[_voter],
        "Invalid vote nonce"
    );

    bytes32 messageHash = keccak256(
        abi.encodePacked(
            address(this),
            block.chainid,
            _voter,
            _institutionId,
            _organizationId,
            _postId,
            _candidateId,
            _nonce
        )
    );

    bytes32 ethSignedMessageHash =
    MessageHashUtils.toEthSignedMessageHash(messageHash);

    address recoveredSigner =
        ECDSA.recover(
            ethSignedMessageHash,
            _signature
        );

    require(
        recoveredSigner == sessionKeys[_voter],
        "Invalid session signature"
    );

    Post storage post =
        posts[
            _institutionId
        ][_organizationId][_postId];

    require(
        post.active,
        "Post is not active"
    );

    require(
        block.timestamp >= post.votingStart,
        "Voting has not started"
    );

    require(
        block.timestamp <= post.votingEnd,
        "Voting has ended"
    );

    require(
        candidates[
            _institutionId
        ][_organizationId][_postId][
            _candidateId
        ].exists,
        "Invalid candidate"
    );

    require(
        !hasVotedCandidate[
            _institutionId
        ][_organizationId][_postId][
            _voter
        ][_candidateId],
        "Already voted for this candidate"
    );

    require(
        userVoteCount[
            _institutionId
        ][_organizationId][_postId][
            _voter
        ] < post.seatCount,
        "Vote limit reached"
    );

    voteNonces[_voter]++;

    hasVotedCandidate[
        _institutionId
    ][_organizationId][_postId][
        _voter
    ][_candidateId] = true;

    userVoteCount[
        _institutionId
    ][_organizationId][_postId][
        _voter
    ]++;

    candidates[
        _institutionId
    ][_organizationId][_postId][
        _candidateId
    ].voteCount++;

    emit VoteCast(
        _institutionId,
        _organizationId,
        _postId,
        _voter,
        _candidateId,
        block.timestamp
    );
}

    // =========================================================
    // RESULTS
    // =========================================================

    function areResultsAvailable(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId
    ) public view returns (bool) {
        Post memory post =
            posts[
                _institutionId
            ][_organizationId][_postId];

        return (
            post.active &&
            block.timestamp > post.votingEnd
        );
    }

    function getCandidateResult(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId,
        uint256 _candidateId
    )
        public
        view
        returns (
            uint256 id,
            address wallet,
            string memory name,
            uint256 voteCount
        )
    {
        require(
            areResultsAvailable(
                _institutionId,
                _organizationId,
                _postId
            ),
            "Results are not available yet"
        );

        Candidate memory candidate =
            candidates[
                _institutionId
            ][_organizationId][_postId][
                _candidateId
            ];

        require(
            candidate.exists,
            "Candidate not found"
        );

        return (
            candidate.id,
            candidate.wallet,
            candidate.name,
            candidate.voteCount
        );
    }

    // =========================================================
    // READ FUNCTIONS
    // =========================================================

    function getRegisteredUserCount()
        public
        view
        returns (uint256)
    {
        return registeredUsers.length;
    }

    function getRegisteredUserAddress(
        uint256 _index
    ) public view returns (address) {
        require(
            _index < registeredUsers.length,
            "Invalid index"
        );

        return registeredUsers[_index];
    }

    function getOrganization(
        uint256 _institutionId,
        uint256 _organizationId
    )
        public
        view
        returns (
            uint256,
            string memory,
            bool,
            uint256
        )
    {
        Organization memory organization =
            organizations[
                _institutionId
            ][_organizationId];

        return (
            organization.id,
            organization.name,
            organization.exists,
            organization.postCount
        );
    }

    function getPost(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId
    ) public view returns (Post memory) {
        return
            posts[
                _institutionId
            ][_organizationId][_postId];
    }

    function getCandidate(
        uint256 _institutionId,
        uint256 _organizationId,
        uint256 _postId,
        uint256 _candidateId
    ) public view returns (Candidate memory) {
        return
            candidates[
                _institutionId
            ][_organizationId][_postId][
                _candidateId
            ];
    }
}