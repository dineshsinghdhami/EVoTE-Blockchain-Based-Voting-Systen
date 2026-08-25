const { ethers } = require("hardhat");

async function main() {
  const [wallet] = await ethers.getSigners();

  if (!wallet) {
    throw new Error(
      "No wallet found. Check SEPOLIA_PRIVATE_KEY in blockchain/.env"
    );
  }

  const network = await ethers.provider.getNetwork();

  const balance = await ethers.provider.getBalance(
    wallet.address
  );

  console.log("======================================");
  console.log("EVOTE SEPOLIA WALLET CHECK");
  console.log("======================================");
  console.log("Network Chain ID:", network.chainId.toString());
  console.log("Wallet Address:", wallet.address);
  console.log(
    "Balance:",
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