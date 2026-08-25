const { ethers } = require("hardhat");

async function main() {
  const [superAdmin, user1, user2, user3] = await ethers.getSigners();

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const Voting = await ethers.getContractFactory("Voting");
  const voting = Voting.attach(contractAddress);

  console.log("======================================");
  console.log("EVoTE LOCAL CONTRACT TEST");
  console.log("======================================");

  console.log("\nSuperAdmin:", superAdmin.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("User3:", user3.address);

  // -------------------------------------------------------
  // 1. REGISTER USERS
  // -------------------------------------------------------

  console.log("\n1. Registering users...");

  const dobUser1 = 946684800; // 1 Jan 2000
  const dobUser2 = 978307200; // 1 Jan 2001
  const dobUser3 = 1104537600; // 1 Jan 2005

  let tx = await voting.registerUser(
    user1.address,
    "User One",
    dobUser1
  );
  await tx.wait();

  tx = await voting.registerUser(
    user2.address,
    "User Two",
    dobUser2
  );
  await tx.wait();

  tx = await voting.registerUser(
    user3.address,
    "User Three",
    dobUser3
  );
  await tx.wait();

  console.log("Users registered successfully.");

  // -------------------------------------------------------
  // 2. PROMOTE USER1 TO ADMIN
  // -------------------------------------------------------

  console.log("\n2. Promoting User1 to Admin...");

  tx = await voting.connect(superAdmin).makeAdmin(user1.address);
  await tx.wait();

  console.log("User1 promoted to Admin.");

  // -------------------------------------------------------
  // 3. CREATE INSTITUTION
  // -------------------------------------------------------

  console.log("\n3. Creating institution...");

  tx = await voting
    .connect(user1)
    .createInstitution("Far Western University");

  await tx.wait();

  console.log("Institution created.");

  // -------------------------------------------------------
  // 4. CREATE ORGANIZATION
  // -------------------------------------------------------

  console.log("\n4. Creating organization...");

  tx = await voting
    .connect(user1)
    .createOrganization(
      1,
      "Student Council"
    );

  await tx.wait();

  console.log("Organization created.");

  // -------------------------------------------------------
  // 5. CREATE POST / ELECTION
  // -------------------------------------------------------

  console.log("\n5. Creating election post...");

  const latestBlock = await ethers.provider.getBlock("latest");
  const now = latestBlock.timestamp;

  const candidateRegistrationStart = now - 10;
  const candidateRegistrationEnd = now + 300;

  const votingStart = now + 400;
  const votingEnd = now + 800;

  tx = await voting
    .connect(user1)
    .createPost(
      1,
      1,
      "President",
      1,      // seatCount
      2,      // maxCandidateCount
      20,     // minCandidateAge
      30,     // maxCandidateAge
      candidateRegistrationStart,
      candidateRegistrationEnd,
      votingStart,
      votingEnd
    );

  await tx.wait();

  console.log("President election created.");

  // -------------------------------------------------------
  // 6. CHECK CANDIDATE ELIGIBILITY
  // -------------------------------------------------------

  console.log("\n6. Checking candidate eligibility...");

  const eligibilityUser2 =
    await voting.canBecomeCandidate(
      1,
      1,
      1,
      user2.address
    );

  console.log(
    "User2 eligible:",
    eligibilityUser2[0],
    "| Reason:",
    eligibilityUser2[1]
  );

  const eligibilityUser3 =
    await voting.canBecomeCandidate(
      1,
      1,
      1,
      user3.address
    );

  console.log(
    "User3 eligible:",
    eligibilityUser3[0],
    "| Reason:",
    eligibilityUser3[1]
  );

  // -------------------------------------------------------
  // 7. USER2 BECOMES CANDIDATE
  // -------------------------------------------------------

  console.log("\n7. User2 becoming candidate...");

  tx = await voting
    .connect(user2)
    .becomeCandidate(
      1,
      1,
      1
    );

  await tx.wait();

  console.log("User2 is now a candidate.");

  // -------------------------------------------------------
  // 8. ADMIN USER1 BECOMES CANDIDATE
  // -------------------------------------------------------

  console.log("\n8. User1 becoming candidate...");

  const eligibilityUser1 =
    await voting.canBecomeCandidate(
      1,
      1,
      1,
      user1.address
    );

  console.log(
    "User1 eligible:",
    eligibilityUser1[0],
    "| Reason:",
    eligibilityUser1[1]
  );

  if (eligibilityUser1[0]) {
    tx = await voting
      .connect(user1)
      .becomeCandidate(
        1,
        1,
        1
      );

    await tx.wait();

    console.log("User1 is now a candidate.");
  }

  // -------------------------------------------------------
  // 9. CHECK CANDIDATE LIMIT
  // -------------------------------------------------------

  console.log("\n9. Checking candidate limit...");

  const post = await voting.getPost(
    1,
    1,
    1
  );

  console.log(
    "Candidate Count:",
    post.candidateCount.toString()
  );

  console.log(
    "Maximum Candidate Count:",
    post.maxCandidateCount.toString()
  );

  // -------------------------------------------------------
  // 10. MOVE BLOCKCHAIN TIME TO VOTING PERIOD
  // -------------------------------------------------------

  console.log("\n10. Moving local blockchain time forward...");

  await ethers.provider.send(
    "evm_setNextBlockTimestamp",
    [votingStart + 10]
  );

  await ethers.provider.send(
    "evm_mine",
    []
  );

  console.log("Voting period started.");

  // -------------------------------------------------------
  // 11. USER3 VOTES
  // -------------------------------------------------------

  console.log("\n11. User3 voting for Candidate 1...");

  tx = await voting
    .connect(user3)
    .vote(
      1,
      1,
      1,
      1
    );

  await tx.wait();

  console.log("Vote cast successfully.");

  // -------------------------------------------------------
  // 12. TEST DUPLICATE VOTE
  // -------------------------------------------------------

  console.log("\n12. Testing duplicate vote prevention...");

  try {
    tx = await voting
      .connect(user3)
      .vote(
        1,
        1,
        1,
        1
      );

    await tx.wait();

    console.log("ERROR: Duplicate vote was allowed.");
  } catch (error) {
    console.log(
      "SUCCESS: Duplicate vote blocked."
    );
  }

  // -------------------------------------------------------
  // 13. TEST SEAT / VOTE LIMIT
  // -------------------------------------------------------

  console.log("\n13. Testing vote limit...");

  try {
    tx = await voting
      .connect(user3)
      .vote(
        1,
        1,
        1,
        2
      );

    await tx.wait();

    console.log("ERROR: Vote limit failed.");
  } catch (error) {
    console.log(
      "SUCCESS: Vote limit correctly enforced."
    );
  }

  // -------------------------------------------------------
  // 14. MOVE TIME AFTER ELECTION END
  // -------------------------------------------------------

  console.log("\n14. Moving time after election end...");

  await ethers.provider.send(
    "evm_setNextBlockTimestamp",
    [votingEnd + 10]
  );

  await ethers.provider.send(
    "evm_mine",
    []
  );

  // -------------------------------------------------------
  // 15. CHECK RESULTS
  // -------------------------------------------------------

  console.log("\n15. Checking results...");

  const available =
    await voting.areResultsAvailable(
      1,
      1,
      1
    );

  console.log(
    "Results Available:",
    available
  );

  const result =
    await voting.getCandidateResult(
      1,
      1,
      1,
      1
    );

  console.log(
    "Candidate:",
    result[2]
  );

  console.log(
    "Vote Count:",
    result[3].toString()
  );

  console.log("\n======================================");
  console.log("LOCAL TEST FINISHED");
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});