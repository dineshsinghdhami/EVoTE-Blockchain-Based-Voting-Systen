const { ethers } = require("hardhat");

async function main() {
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();

  console.log("======================================");
  console.log("SEPOLIA CONNECTION TEST");
  console.log("======================================");
  console.log("Chain ID:", network.chainId.toString());
  console.log("Latest Block:", blockNumber);
  console.log("RPC connection successful.");
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});