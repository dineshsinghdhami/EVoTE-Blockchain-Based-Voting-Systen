import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL")
RELAYER_PRIVATE_KEY = os.getenv("RELAYER_PRIVATE_KEY")

FORWARDER_CONTRACT_ADDRESS = os.getenv(
    "FORWARDER_CONTRACT_ADDRESS"
)

VOTING_CONTRACT_ADDRESS = os.getenv(
    "VOTING_CONTRACT_ADDRESS"
)


if not SEPOLIA_RPC_URL:
    raise Exception(
        "SEPOLIA_RPC_URL is missing in backend/.env"
    )

if not RELAYER_PRIVATE_KEY:
    raise Exception(
        "RELAYER_PRIVATE_KEY is missing in backend/.env"
    )

if not FORWARDER_CONTRACT_ADDRESS:
    raise Exception(
        "FORWARDER_CONTRACT_ADDRESS is missing in backend/.env"
    )

if not VOTING_CONTRACT_ADDRESS:
    raise Exception(
        "VOTING_CONTRACT_ADDRESS is missing in backend/.env"
    )


# ============================================================
# CONNECT TO ETHEREUM SEPOLIA
# ============================================================

w3 = Web3(
    Web3.HTTPProvider(
        SEPOLIA_RPC_URL,
        request_kwargs={
            "timeout": 3
        }
    )
)

try:
    BLOCKCHAIN_CONNECTED = w3.is_connected()
except Exception:
    BLOCKCHAIN_CONNECTED = False


if BLOCKCHAIN_CONNECTED:
    print(
        "✅ Connected to Ethereum Sepolia"
    )
else:
    print(
        "⚠️ Ethereum Sepolia is unavailable."
    )
    print(
        "⚠️ Backend will continue in OFFLINE mode."
    )
    print(
        "⚠️ Blockchain operations require internet."
    )


def require_blockchain_connection():
    """
    Prevent blockchain operations when Sepolia
    cannot be reached, without crashing FastAPI.
    """
    try:
        if not w3.is_connected():
            raise Exception(
                "Blockchain network is unavailable. "
                "Please connect to the internet "
                "and try again."
            )
    except Exception as exc:
        if (
            "Blockchain network is unavailable"
            in str(exc)
        ):
            raise

        raise Exception(
            "Blockchain network is unavailable. "
            "Please connect to the internet "
            "and try again."
        )


# ============================================================
# RELAYER ACCOUNT
# ============================================================

relayer_account = w3.eth.account.from_key(
    RELAYER_PRIVATE_KEY
)

RELAYER_ADDRESS = relayer_account.address


# ============================================================
# LOAD ABIs
# ============================================================

BLOCKCHAIN_DIR = BASE_DIR.parent / "blockchain"

VOTING_ARTIFACT = (
    BLOCKCHAIN_DIR
    / "artifacts"
    / "contracts"
    / "Voting.sol"
    / "Voting.json"
)

FORWARDER_ARTIFACT = (
    BLOCKCHAIN_DIR
    / "artifacts"
    / "contracts"
    / "EVoTEForwarder.sol"
    / "EVoTEForwarder.json"
)


if not VOTING_ARTIFACT.exists():
    raise Exception(
        f"Voting artifact not found: {VOTING_ARTIFACT}"
    )

if not FORWARDER_ARTIFACT.exists():
    raise Exception(
        f"Forwarder artifact not found: {FORWARDER_ARTIFACT}"
    )


with open(
    VOTING_ARTIFACT,
    "r",
    encoding="utf-8"
) as file:
    voting_json = json.load(file)


with open(
    FORWARDER_ARTIFACT,
    "r",
    encoding="utf-8"
) as file:
    forwarder_json = json.load(file)


# ============================================================
# CONTRACT INSTANCES
# ============================================================

voting_contract = w3.eth.contract(
    address=Web3.to_checksum_address(
        VOTING_CONTRACT_ADDRESS
    ),
    abi=voting_json["abi"]
)


forwarder_contract = w3.eth.contract(
    address=Web3.to_checksum_address(
        FORWARDER_CONTRACT_ADDRESS
    ),
    abi=forwarder_json["abi"]
)


# Keep this alias temporarily because your existing
# main.py may still refer to "contract".
contract = voting_contract


# ============================================================
# GENERAL RELAYER TRANSACTION SENDER
# ============================================================

def send_relayer_transaction(
    function_call,
    value=0
):
    require_blockchain_connection()

    nonce = w3.eth.get_transaction_count(
        RELAYER_ADDRESS,
        "pending"
    )

    latest_block = w3.eth.get_block(
        "latest"
    )

    base_fee = latest_block.get(
        "baseFeePerGas",
        w3.to_wei(1, "gwei")
    )

    priority_fee = w3.to_wei(
        0.001,
        "gwei"
    )

    max_fee = (
        base_fee * 2
        + priority_fee
    )

    estimated_gas = function_call.estimate_gas({
        "from": RELAYER_ADDRESS,
        "value": value
    })

    gas_limit = int(
        estimated_gas * 1.20
    )

    tx = function_call.build_transaction({
        "from": RELAYER_ADDRESS,
        "nonce": nonce,
        "chainId": 11155111,
        "gas": gas_limit,
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": priority_fee,
        "value": value
    })

    signed_tx = (
        w3.eth.account.sign_transaction(
            tx,
            private_key=RELAYER_PRIVATE_KEY
        )
    )

    tx_hash = (
        w3.eth.send_raw_transaction(
            signed_tx.raw_transaction
        )
    )

    receipt = (
        w3.eth.wait_for_transaction_receipt(
            tx_hash,
            timeout=180
        )
    )

    return {
        "tx_hash": tx_hash.hex(),
        "from_address": RELAYER_ADDRESS,
        "status": (
            "success"
            if receipt.status == 1
            else "failed"
        ),
        "block_number": receipt.blockNumber
    }


# ============================================================
# NETWORK INFORMATION
# ============================================================

def get_blockchain_status():
    try:
        connected = w3.is_connected()
    except Exception:
        connected = False

    if not connected:
        return {
            "connected": False,
            "chain_id": None,
            "network": "Ethereum Sepolia",
            "relayer_address": RELAYER_ADDRESS,
            "relayer_balance_eth": None,
            "voting_contract":
                VOTING_CONTRACT_ADDRESS,
            "forwarder_contract":
                FORWARDER_CONTRACT_ADDRESS,
            "message":
                "Sepolia is unavailable. "
                "Backend is running in offline mode."
        }

    balance_wei = w3.eth.get_balance(
        RELAYER_ADDRESS
    )

    return {
        "connected": True,
        "chain_id": w3.eth.chain_id,
        "network": "Ethereum Sepolia",
        "relayer_address": RELAYER_ADDRESS,
        "relayer_balance_eth": str(
            w3.from_wei(
                balance_wei,
                "ether"
            )
        ),
        "voting_contract":
            VOTING_CONTRACT_ADDRESS,
        "forwarder_contract":
            FORWARDER_CONTRACT_ADDRESS
    }


# ============================================================
# READ FUNCTIONS
# ============================================================

def get_superadmin_address():
    return (
        voting_contract
        .functions
        .superAdmin()
        .call()
    )


def get_user_blockchain(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    result = (
        voting_contract
        .functions
        .users(wallet)
        .call()
    )

    return {
        "wallet": result[0],
        "full_name": result[1],
        "date_of_birth": result[2],
        "role": result[3],
        "registered": result[4],
        "active": result[5]
    }

def get_institution_name(
    institution_id: int
):
    institution = (
        voting_contract
        .functions
        .institutions(
            int(institution_id)
        )
        .call()
    )

    return institution[1]

def get_organization_name(
    institution_id: int,
    organization_id: int
):
    organization = (
        voting_contract
        .functions
        .getOrganization(
            int(institution_id),
            int(organization_id)
        )
        .call()
    )

    return organization[1]

def can_become_candidate_blockchain(
    institution_id: int,
    organization_id: int,
    post_id: int,
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    result = (
        voting_contract
        .functions
        .canBecomeCandidate(
            institution_id,
            organization_id,
            post_id,
            wallet
        )
        .call()
    )

    return {
        "eligible": result[0],
        "reason": result[1]
    }


def get_post_blockchain(
    institution_id: int,
    organization_id: int,
    post_id: int
):
    result = (
        voting_contract
        .functions
        .getPost(
            institution_id,
            organization_id,
            post_id
        )
        .call()
    )

    return result


def get_candidate_blockchain(
    institution_id: int,
    organization_id: int,
    post_id: int,
    candidate_id: int
):
    result = (
        voting_contract
        .functions
        .getCandidate(
            institution_id,
            organization_id,
            post_id,
            candidate_id
        )
        .call()
    )

    return result


def results_available_blockchain(
    institution_id: int,
    organization_id: int,
    post_id: int
):
    return (
        voting_contract
        .functions
        .areResultsAvailable(
            institution_id,
            organization_id,
            post_id
        )
        .call()
    )


# ============================================================
# DIRECT ADMIN / SUPERADMIN TRANSACTIONS
# ============================================================
#
# These are temporarily sent by the relayer wallet.
#
# Because your current relayer wallet is also the
# deployed SuperAdmin wallet, SuperAdmin operations
# work directly.
#
# Later we will connect Admin MetaMask signatures
# through the Forwarder too.
# ============================================================

def create_institution_blockchain(
    name: str,
    full_name=None,
    email=None
):
    return send_relayer_transaction(
        voting_contract
        .functions
        .createInstitution(
            name
        )
    )


def create_organization_blockchain(
    institution_id: int,
    name: str,
    full_name=None,
    email=None
):
    return send_relayer_transaction(
        voting_contract
        .functions
        .createOrganization(
            institution_id,
            name
        )
    )


def create_post_blockchain(
    institution_id: int,
    organization_id: int,
    title: str,
    seat_limit: int,
    start_date: int,
    end_date: int,
    full_name=None,
    email=None,
    max_candidate_count=None,
    min_candidate_age=18,
    max_candidate_age=100,
    candidate_registration_start=None,
    candidate_registration_end=None
):
    if max_candidate_count is None:
        max_candidate_count = (
            seat_limit * 5
        )

    if candidate_registration_start is None:
        candidate_registration_start = (
            start_date - 7200
        )

    if candidate_registration_end is None:
        candidate_registration_end = (
            start_date - 3600
        )

    return send_relayer_transaction(
        voting_contract
        .functions
        .createPost(
            institution_id,
            organization_id,
            title,
            seat_limit,
            max_candidate_count,
            min_candidate_age,
            max_candidate_age,
            candidate_registration_start,
            candidate_registration_end,
            start_date,
            end_date
        )
    )


def make_admin_blockchain(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return send_relayer_transaction(
        voting_contract
        .functions
        .makeAdmin(
            wallet
        )
    )


def remove_admin_blockchain(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return send_relayer_transaction(
        voting_contract
        .functions
        .removeAdmin(
            wallet
        )
    )


def set_user_active_blockchain(
    wallet_address: str,
    active: bool
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return send_relayer_transaction(
        voting_contract
        .functions
        .setUserActiveStatus(
            wallet,
            active
        )
    )


# ============================================================
# GASLESS FORWARDER HELPERS
# ============================================================

def get_forwarder_nonce(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return (
        forwarder_contract
        .functions
        .nonces(wallet)
        .call()
    )

def get_vote_nonce(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return (
        voting_contract
        .functions
        .voteNonces(wallet)
        .call()
    )

def encode_register_user(
    full_name: str,
    date_of_birth: int,
    session_key: str
):
    session_key_address = Web3.to_checksum_address(
        session_key
    )

    return voting_contract.encode_abi(
        abi_element_identifier=
            "registerUser",
        args=[
            full_name,
            date_of_birth,
            session_key_address
        ]
    )


def encode_become_candidate(
    institution_id: int,
    organization_id: int,
    post_id: int
):
    
    return voting_contract.encode_abi(
        abi_element_identifier=
            "becomeCandidate",
        args=[
            institution_id,
            organization_id,
            post_id
        ]
    )

def encode_vote(
    institution_id: int,
    organization_id: int,
    post_id: int,
    candidate_id: int
):
    
    return voting_contract.encode_abi(
        abi_element_identifier=
            "vote",
        args=[
            institution_id,
            organization_id,
            post_id,
            candidate_id
        ]
    )
def encode_vote_with_session_key(
    voter_address: str,
    institution_id: int,
    organization_id: int,
    post_id: int,
    candidate_id: int,
    nonce: int,
    signature: str
):
    voter = Web3.to_checksum_address(
        voter_address
    )

    return voting_contract.encode_abi(
        abi_element_identifier=
            "voteWithSessionKey",
        args=[
            voter,
            institution_id,
            organization_id,
            post_id,
            candidate_id,
            nonce,
            signature
        ]
    )

def submit_session_vote(
    voter_address: str,
    institution_id: int,
    organization_id: int,
    post_id: int,
    candidate_id: int,
    nonce: int,
    signature: str
):
    voter = Web3.to_checksum_address(
        voter_address
    )

    function_call = (
        voting_contract
        .functions
        .voteWithSessionKey(
            voter,
            institution_id,
            organization_id,
            post_id,
            candidate_id,
            nonce,
            signature
        )
    )

    return send_relayer_transaction(
        function_call
    )

# ============================================================
# SESSION KEY CANDIDATE REGISTRATION HELPERS
# ============================================================

def get_candidate_nonce(
    wallet_address: str
):
    wallet = Web3.to_checksum_address(
        wallet_address
    )

    return (
        voting_contract
        .functions
        .candidateNonces(wallet)
        .call()
    )


def encode_candidate_with_session_key(
    voter_address: str,
    institution_id: int,
    organization_id: int,
    post_id: int,
    nonce: int,
    signature: str
):
    voter = Web3.to_checksum_address(
        voter_address
    )

    return voting_contract.encode_abi(
        abi_element_identifier=
            "becomeCandidateWithSessionKey",
        args=[
            voter,
            institution_id,
            organization_id,
            post_id,
            nonce,
            signature
        ]
    )


def submit_session_candidate(
    voter_address: str,
    institution_id: int,
    organization_id: int,
    post_id: int,
    nonce: int,
    signature: str
):
    voter = Web3.to_checksum_address(
        voter_address
    )

    function_call = (
        voting_contract
        .functions
        .becomeCandidateWithSessionKey(
            voter,
            int(institution_id),
            int(organization_id),
            int(post_id),
            int(nonce),
            signature
        )
    )

    return send_relayer_transaction(
        function_call
    )

def relay_signed_request(
    from_address: str,
    to_address: str,
    value: int,
    gas: int,
    deadline: int,
    data: str,
    signature: str
):
    sender = Web3.to_checksum_address(
        from_address
    )

    target = Web3.to_checksum_address(
        to_address
    )

    request = (
        sender,
        target,
        value,
        gas,
        deadline,
        data,
        signature
    )

    function_call = (
        forwarder_contract
        .functions
        .execute(
            request
        )
    )

    return send_relayer_transaction(
        function_call
    )


# ============================================================
# TEMPORARY LEGACY COMPATIBILITY
# ============================================================
#
# Your old main.py still imports these names.
# We keep them temporarily so FastAPI does not crash
# while we update main.py in the next steps.
# ============================================================

def add_candidate_blockchain(*args, **kwargs):
    raise Exception(
        "Manual candidate creation has been removed. "
        "Users must become candidates themselves."
    )


def approve_candidate_request_blockchain(
    *args,
    **kwargs
):
    raise Exception(
        "Candidate approval has been removed. "
        "Eligible users become candidates automatically."
    )


def reject_candidate_request_blockchain(
    *args,
    **kwargs
):
    raise Exception(
        "Candidate rejection has been removed."
    )


def request_candidate_blockchain(
    *args,
    **kwargs
):
    raise Exception(
        "Old candidate request flow has been removed. "
        "Use gasless becomeCandidate instead."
    )


def vote_blockchain(
    *args,
    **kwargs
):
    raise Exception(
        "Old direct voting flow has been removed. "
        "Use a signed gasless vote request."
    )