const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("======================================");
  console.log("EVoTE DEPLOYMENT");
  console.log("======================================");
  console.log("Deployer:", deployer.address);

  // -------------------------------------------------------
  // 1. DEPLOY FORWARDER
  // -------------------------------------------------------

  console.log("\nDeploying EVoTEForwarder...");

  const Forwarder = await ethers.getContractFactory(
    "EVoTEForwarder"
  );

  const forwarder = await Forwarder.deploy();

  await forwarder.waitForDeployment();

  const forwarderAddress =
    await forwarder.getAddress();

  console.log(
    "Forwarder Address:",
    forwarderAddress
  );

  // -------------------------------------------------------
  // 2. SUPERADMIN DETAILS
  // -------------------------------------------------------

  const superAdminName = "EVoTE SuperAdmin";

  const superAdminDateOfBirth =
    631152000; // 1 January 1990

  // -------------------------------------------------------
  // 3. DEPLOY VOTING CONTRACT
  // -------------------------------------------------------

  console.log("\nDeploying Voting contract...");

  const Voting =
    await ethers.getContractFactory("Voting");

  const voting = await Voting.deploy(
    superAdminName,
    superAdminDateOfBirth,
    forwarderAddress
  );

  await voting.waitForDeployment();

  const votingAddress =
    await voting.getAddress();

  console.log("\n======================================");
  console.log("EVoTE DEPLOYMENT COMPLETE");
  console.log("======================================");
  console.log(
    "Forwarder Contract:",
    forwarderAddress
  );
  console.log(
    "Voting Contract:",
    votingAddress
  );
  console.log(
    "SuperAdmin Wallet:",
    deployer.address
  );
  console.log(
    "SuperAdmin Name:",
    superAdminName
  );

  const network =
    await ethers.provider.getNetwork();

  console.log(
    "Chain ID:",
    network.chainId.toString()
  );

  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});