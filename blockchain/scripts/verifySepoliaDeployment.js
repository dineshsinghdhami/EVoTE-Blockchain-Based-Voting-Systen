const { ethers } = require("hardhat");

async function main() {
  const votingAddress =
    process.env.VOTING_CONTRACT_ADDRESS;

  const forwarderAddress =
    process.env.FORWARDER_CONTRACT_ADDRESS;

  const Voting =
    await ethers.getContractFactory("Voting");

  const voting =
    Voting.attach(votingAddress);

  const network =
    await ethers.provider.getNetwork();

  const superAdmin =
    await voting.superAdmin();

  const isTrustedForwarder =
    await voting.isTrustedForwarder(
      forwarderAddress
    );

  const balance =
    await ethers.provider.getBalance(
      superAdmin
    );

  console.log("======================================");
  console.log("EVOTE SEPOLIA DEPLOYMENT CHECK");
  console.log("======================================");

  console.log(
    "Chain ID:",
    network.chainId.toString()
  );

  console.log(
    "Voting Contract:",
    votingAddress
  );

  console.log(
    "Forwarder Contract:",
    forwarderAddress
  );

  console.log(
    "SuperAdmin:",
    superAdmin
  );

  console.log(
    "Trusted Forwarder:",
    isTrustedForwarder
  );

  console.log(
    "SuperAdmin Balance:",
    ethers.formatEther(balance),
    "Sepolia ETH"
  );

  console.log("======================================");
  console.log("NO ETH WAS SPENT.");
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});