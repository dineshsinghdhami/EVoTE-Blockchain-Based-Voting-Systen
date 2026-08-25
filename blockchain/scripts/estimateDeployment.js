const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("======================================");
  console.log("EVOTE FINAL DEPLOYMENT ESTIMATE");
  console.log("======================================");

  console.log("Wallet:", deployer.address);

  const balance =
    await ethers.provider.getBalance(
      deployer.address
    );

  console.log(
    "Current Balance:",
    ethers.formatEther(balance),
    "Sepolia ETH"
  );

  // --------------------------------------------
  // FORWARDER ESTIMATE
  // --------------------------------------------

  const Forwarder =
    await ethers.getContractFactory(
      "EVoTEForwarder"
    );

  const forwarderTx =
    await Forwarder.getDeployTransaction();

  const forwarderGas =
    await ethers.provider.estimateGas({
      from: deployer.address,
      data: forwarderTx.data
    });

  // --------------------------------------------
  // TEMPORARY FORWARDER ADDRESS
  //
  // For estimating Voting deployment bytecode,
  // any valid non-zero address can be used here.
  // --------------------------------------------

  const temporaryForwarder =
    "0x0000000000000000000000000000000000000001";

  const Voting =
    await ethers.getContractFactory(
      "Voting"
    );

  const votingTx =
    await Voting.getDeployTransaction(
      "EVoTE SuperAdmin",
      631152000,
      temporaryForwarder
    );

  const votingGas =
    await ethers.provider.estimateGas({
      from: deployer.address,
      data: votingTx.data
    });

  // --------------------------------------------
  // GAS PRICE
  // --------------------------------------------

  const feeData =
    await ethers.provider.getFeeData();

  const gasPrice =
    feeData.gasPrice ??
    feeData.maxFeePerGas;

  const forwarderCost =
    forwarderGas * gasPrice;

  const votingCost =
    votingGas * gasPrice;

  const totalCost =
    forwarderCost + votingCost;

  console.log("");
  console.log("Forwarder Gas:");
  console.log(
    forwarderGas.toString()
  );

  console.log(
    "Estimated Forwarder Cost:",
    ethers.formatEther(
      forwarderCost
    ),
    "Sepolia ETH"
  );

  console.log("");
  console.log("Voting Gas:");
  console.log(
    votingGas.toString()
  );

  console.log(
    "Estimated Voting Cost:",
    ethers.formatEther(
      votingCost
    ),
    "Sepolia ETH"
  );

  console.log("");
  console.log(
    "Gas Price:",
    ethers.formatUnits(
      gasPrice,
      "gwei"
    ),
    "gwei"
  );

  console.log("");
  console.log(
    "Estimated TOTAL Deployment Cost:",
    ethers.formatEther(
      totalCost
    ),
    "Sepolia ETH"
  );

  const remaining =
    balance > totalCost
      ? balance - totalCost
      : 0n;

  console.log(
    "Estimated Remaining Balance:",
    ethers.formatEther(
      remaining
    ),
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