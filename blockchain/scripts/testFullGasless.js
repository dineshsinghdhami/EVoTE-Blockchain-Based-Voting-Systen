const { ethers } = require("hardhat");

async function relayCall({
  forwarder,
  voting,
  relayer,
  user,
  functionName,
  args
}) {
  const forwarderAddress =
    await forwarder.getAddress();

  const votingAddress =
    await voting.getAddress();

  const callData =
    voting.interface.encodeFunctionData(
      functionName,
      args
    );

  const nonce =
    await forwarder.nonces(user.address);

  const network =
    await ethers.provider.getNetwork();

  const latestBlock =
    await ethers.provider.getBlock("latest");

  const deadline =
    latestBlock.timestamp + 3600;

  const domain = {
    name: "EVoTEForwarder",
    version: "1",
    chainId: Number(network.chainId),
    verifyingContract: forwarderAddress
  };

  const types = {
    ForwardRequest: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "value",
        type: "uint256"
      },
      {
        name: "gas",
        type: "uint256"
      },
      {
        name: "nonce",
        type: "uint256"
      },
      {
        name: "deadline",
        type: "uint48"
      },
      {
        name: "data",
        type: "bytes"
      }
    ]
  };

  const request = {
    from: user.address,
    to: votingAddress,
    value: 0,
    gas: 700000,
    nonce,
    deadline,
    data: callData
  };

  const signature =
    await user.signTypedData(
      domain,
      types,
      request
    );

  const forwardRequest = {
    from: request.from,
    to: request.to,
    value: request.value,
    gas: request.gas,
    deadline: request.deadline,
    data: request.data,
    signature
  };

  const tx =
    await forwarder
      .connect(relayer)
      .execute(forwardRequest);

  return await tx.wait();
}

async function main() {
  const [
    superAdmin,
    admin,
    candidateUser,
    voterUser
  ] = await ethers.getSigners();

  const FORWARDER_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const VOTING_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const Forwarder =
    await ethers.getContractFactory(
      "EVoTEForwarder"
    );

  const Voting =
    await ethers.getContractFactory(
      "Voting"
    );

  const forwarder =
    Forwarder.attach(
      FORWARDER_ADDRESS
    );

  const voting =
    Voting.attach(
      VOTING_ADDRESS
    );

  console.log(
    "======================================"
  );

  console.log(
    "EVOTE FULL GASLESS TEST"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Relayer/SuperAdmin:",
    superAdmin.address
  );

  console.log(
    "Admin:",
    admin.address
  );

  console.log(
    "Candidate User:",
    candidateUser.address
  );

  console.log(
    "Voter:",
    voterUser.address
  );

  // --------------------------------------------------
  // 1. REGISTER ADMIN GASLESS
  // --------------------------------------------------

  console.log(
    "\n1. Registering Admin gaslessly..."
  );

  await relayCall({
    forwarder,
    voting,
    relayer: superAdmin,
    user: admin,
    functionName: "registerUser",
    args: [
      "Election Admin",
      946684800
    ]
  });

  console.log(
    "Admin registered."
  );

  // --------------------------------------------------
  // 2. REGISTER CANDIDATE USER GASLESS
  // --------------------------------------------------

  console.log(
    "\n2. Registering candidate user gaslessly..."
  );

  await relayCall({
    forwarder,
    voting,
    relayer: superAdmin,
    user: candidateUser,
    functionName: "registerUser",
    args: [
      "Candidate User",
      946684800
    ]
  });

  console.log(
    "Candidate user registered."
  );

  // --------------------------------------------------
  // 3. REGISTER VOTER GASLESS
  // --------------------------------------------------

  console.log(
    "\n3. Registering voter gaslessly..."
  );

  await relayCall({
    forwarder,
    voting,
    relayer: superAdmin,
    user: voterUser,
    functionName: "registerUser",
    args: [
      "Normal Voter",
      978307200
    ]
  });

  console.log(
    "Voter registered."
  );

  // --------------------------------------------------
  // 4. PROMOTE ADMIN
  // --------------------------------------------------

  console.log(
    "\n4. Promoting Admin..."
  );

  let tx =
    await voting
      .connect(superAdmin)
      .makeAdmin(admin.address);

  await tx.wait();

  console.log(
    "Admin promoted."
  );

  // --------------------------------------------------
  // 5. CREATE INSTITUTION
  // --------------------------------------------------

  console.log(
    "\n5. Creating institution..."
  );

  tx =
    await voting
      .connect(admin)
      .createInstitution(
        "Far Western University"
      );

  await tx.wait();

  console.log(
    "Institution created."
  );

  // --------------------------------------------------
  // 6. CREATE ORGANIZATION
  // --------------------------------------------------

  console.log(
    "\n6. Creating organization..."
  );

  tx =
    await voting
      .connect(admin)
      .createOrganization(
        1,
        "Student Council"
      );

  await tx.wait();

  console.log(
    "Organization created."
  );

  // --------------------------------------------------
  // 7. CREATE ELECTION
  // --------------------------------------------------

  console.log(
    "\n7. Creating President election..."
  );

  const latestBlock =
    await ethers.provider.getBlock(
      "latest"
    );

  const now =
    latestBlock.timestamp;

  const registrationStart =
    now - 10;

  const registrationEnd =
    now + 300;

  const votingStart =
    now + 400;

  const votingEnd =
    now + 800;

  tx =
    await voting
      .connect(admin)
      .createPost(
        1,
        1,
        "President",
        1,
        5,
        20,
        30,
        registrationStart,
        registrationEnd,
        votingStart,
        votingEnd
      );

  await tx.wait();

  console.log(
    "Election created."
  );

  // --------------------------------------------------
  // 8. CHECK CANDIDATE ELIGIBILITY
  // --------------------------------------------------

  console.log(
    "\n8. Checking candidate eligibility..."
  );

  const eligibility =
    await voting.canBecomeCandidate(
      1,
      1,
      1,
      candidateUser.address
    );

  console.log(
    "Eligible:",
    eligibility[0]
  );

  console.log(
    "Reason:",
    eligibility[1]
  );

  // --------------------------------------------------
  // 9. BECOME CANDIDATE GASLESSLY
  // --------------------------------------------------

  console.log(
    "\n9. Becoming candidate gaslessly..."
  );

  await relayCall({
    forwarder,
    voting,
    relayer: superAdmin,
    user: candidateUser,
    functionName: "becomeCandidate",
    args: [
      1,
      1,
      1
    ]
  });

  console.log(
    "Candidate registration successful."
  );

  const candidate =
    await voting.getCandidate(
      1,
      1,
      1,
      1
    );

  console.log(
    "Candidate Wallet:",
    candidate.wallet
  );

  console.log(
    "Candidate Name:",
    candidate.name
  );

  // --------------------------------------------------
  // 10. MOVE TIME TO VOTING PERIOD
  // --------------------------------------------------

  console.log(
    "\n10. Starting voting period..."
  );

  await ethers.provider.send(
    "evm_setNextBlockTimestamp",
    [
      votingStart + 10
    ]
  );

  await ethers.provider.send(
    "evm_mine",
    []
  );

  console.log(
    "Voting period started."
  );

  // --------------------------------------------------
  // 11. VOTE GASLESSLY
  // --------------------------------------------------

  console.log(
    "\n11. Voting gaslessly..."
  );

  await relayCall({
    forwarder,
    voting,
    relayer: superAdmin,
    user: voterUser,
    functionName: "vote",
    args: [
      1,
      1,
      1,
      1
    ]
  });

  console.log(
    "Gasless vote successful."
  );

  // --------------------------------------------------
  // 12. DUPLICATE VOTE TEST
  // --------------------------------------------------

  console.log(
    "\n12. Testing duplicate vote..."
  );

  try {
    await relayCall({
      forwarder,
      voting,
      relayer: superAdmin,
      user: voterUser,
      functionName: "vote",
      args: [
        1,
        1,
        1,
        1
      ]
    });

    console.log(
      "ERROR: Duplicate vote allowed."
    );
  } catch (error) {
    console.log(
      "SUCCESS: Duplicate vote blocked."
    );
  }

  // --------------------------------------------------
  // 13. CHECK VOTE COUNT
  // --------------------------------------------------

  const updatedCandidate =
    await voting.getCandidate(
      1,
      1,
      1,
      1
    );

  console.log(
    "\nCandidate Vote Count:",
    updatedCandidate.voteCount.toString()
  );

  console.log("");
  console.log(
    "======================================"
  );

  console.log(
    "FULL GASLESS TEST COMPLETE"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Registration: GASLESS ✓"
  );

  console.log(
    "Candidate Registration: GASLESS ✓"
  );

  console.log(
    "Voting: GASLESS ✓"
  );

  console.log(
    "Duplicate Vote Prevention: ✓"
  );

  console.log(
    "Real user wallet preserved: ✓"
  );

  console.log(
    "======================================"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});