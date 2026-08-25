const { ethers } = require("hardhat");

async function main() {
  const [relayer, user] = await ethers.getSigners();

  // Addresses from our latest local deployment
  const FORWARDER_ADDRESS =
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  const VOTING_ADDRESS =
    "0x0165878A594ca255338adfa4d48449f69242Eb8F";

  console.log("======================================");
  console.log("EVOTE GASLESS REGISTRATION TEST");
  console.log("======================================");

  console.log("Relayer:", relayer.address);
  console.log("Actual User:", user.address);

  // -------------------------------------------------------
  // CONNECT TO CONTRACTS
  // -------------------------------------------------------

  const Forwarder =
    await ethers.getContractFactory("EVoTEForwarder");

  const forwarder =
    Forwarder.attach(FORWARDER_ADDRESS);

  const Voting =
    await ethers.getContractFactory("Voting");

  const voting =
    Voting.attach(VOTING_ADDRESS);

  // -------------------------------------------------------
  // CREATE registerUser() CALL DATA
  // -------------------------------------------------------

  const userName = "Gasless User";

  // 1 January 2000
  const dateOfBirth = 946684800;

  const callData =
    voting.interface.encodeFunctionData(
      "registerUser",
      [
        userName,
        dateOfBirth
      ]
    );

  // -------------------------------------------------------
  // GET FORWARDER NONCE
  // -------------------------------------------------------

  const nonce =
    await forwarder.nonces(user.address);

  const network =
    await ethers.provider.getNetwork();

  // -------------------------------------------------------
  // EIP-712 DOMAIN
  // -------------------------------------------------------

  const domain = {
    name: "EVoTEForwarder",
    version: "1",
    chainId: Number(network.chainId),
    verifyingContract: FORWARDER_ADDRESS
  };

  // -------------------------------------------------------
  // FORWARD REQUEST TYPE
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // CREATE REQUEST
  // -------------------------------------------------------

  const latestBlock =
    await ethers.provider.getBlock("latest");

  const deadline =
    latestBlock.timestamp + 3600;

  const request = {
    from: user.address,
    to: VOTING_ADDRESS,
    value: 0,
    gas: 500000,
    nonce: nonce,
    deadline: deadline,
    data: callData
  };

  // -------------------------------------------------------
  // USER SIGNS
  //
  // IMPORTANT:
  // User signs only.
  // User does NOT send a blockchain transaction.
  // -------------------------------------------------------

  console.log("\nUser signing registration request...");

  const signature =
    await user.signTypedData(
      domain,
      types,
      request
    );

  console.log("Signature created.");

  // -------------------------------------------------------
  // RELAYER SUBMITS TRANSACTION
  //
  // RELAYER pays the gas.
  // -------------------------------------------------------

  console.log(
    "\nRelayer submitting signed request..."
  );

  const forwardRequest = {
    from: request.from,
    to: request.to,
    value: request.value,
    gas: request.gas,
    deadline: request.deadline,
    data: request.data,
    signature: signature
  };

  const tx =
    await forwarder
      .connect(relayer)
      .execute(forwardRequest);

  const receipt =
    await tx.wait();

  console.log(
    "Transaction mined:",
    receipt.hash
  );

  // -------------------------------------------------------
  // VERIFY USER ON VOTING CONTRACT
  // -------------------------------------------------------

  console.log(
    "\nChecking blockchain registration..."
  );

  const registeredUser =
    await voting.users(user.address);

  console.log(
    "Registered Wallet:",
    registeredUser.wallet
  );

  console.log(
    "Full Name:",
    registeredUser.fullName
  );

  console.log(
    "Registered:",
    registeredUser.registered
  );

  console.log(
    "Active:",
    registeredUser.active
  );

  // -------------------------------------------------------
  // FINAL CHECK
  // -------------------------------------------------------

  if (
    registeredUser.wallet.toLowerCase() ===
      user.address.toLowerCase() &&
    registeredUser.registered === true
  ) {
    console.log("");
    console.log("======================================");
    console.log("SUCCESS!");
    console.log("GASLESS REGISTRATION WORKS");
    console.log("======================================");
    console.log(
      "Voting.sol recognized the REAL user:"
    );
    console.log(user.address);

    console.log("");
    console.log(
      "The relayer submitted and paid for the transaction."
    );
  } else {
    console.log("");
    console.log("TEST FAILED.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});