import { API_URL } from "./config";
import { useState } from "react";

function MetaMaskTest() {
  const [status, setStatus] = useState("Ready");
  const [wallet, setWallet] = useState("");

  const registerGaslessly = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
      }

      setStatus("Connecting MetaMask...");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const selectedWallet = accounts[0];

      setWallet(selectedWallet);

      setStatus("Preparing gasless registration...");

      const prepareResponse = await fetch(
        `${API_URL}/auth/metamask/register/prepare-blockchain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: selectedWallet,
          }),
        }
      );

      const prepared = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(
          prepared.detail ||
            "Could not prepare blockchain registration"
        );
      }

      setStatus(
        "Please sign the gasless registration in MetaMask..."
      );

      const typedData = {
  domain: prepared.domain,

  types: {
    EIP712Domain: [
      {
        name: "name",
        type: "string",
      },
      {
        name: "version",
        type: "string",
      },
      {
        name: "chainId",
        type: "uint256",
      },
      {
        name: "verifyingContract",
        type: "address",
      },
    ],

    ...prepared.types,
  },

  primaryType: prepared.primaryType,
  message: prepared.message,
};

      const signature = await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [
          selectedWallet,
          JSON.stringify(typedData),
        ],
      });

      setStatus(
        "Signature created. Sending to EVoTE relayer..."
      );

      const relayResponse = await fetch(
        `${API_URL}/auth/metamask/register/relay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_address: prepared.message.from,
            to_address: prepared.message.to,
            value: Number(prepared.message.value),
            gas: Number(prepared.message.gas),
            deadline: Number(prepared.message.deadline),
            data: prepared.message.data,
            signature: signature,
          }),
        }
      );

      const relayResult = await relayResponse.json();

      if (!relayResponse.ok) {
        throw new Error(
          relayResult.detail ||
            "Gasless registration failed"
        );
      }

      console.log(
        "Gasless registration result:",
        relayResult
      );

      localStorage.setItem(
        "access_token",
        relayResult.access_token
      );

      setStatus(
        `SUCCESS ✓ Registered gaslessly. TX: ${relayResult.transaction.tx_hash}`
      );
    } catch (error) {
      console.error(error);

      setStatus(
        `ERROR: ${error.message}`
      );
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>EVoTE Gasless Registration Test</h1>

      <p>
        <strong>Wallet:</strong>{" "}
        {wallet || "Not connected"}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {status}
      </p>

      <button
        onClick={registerGaslessly}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
        }}
      >
        Register Gaslessly with MetaMask
      </button>
    </div>
  );
}

export default MetaMaskTest;