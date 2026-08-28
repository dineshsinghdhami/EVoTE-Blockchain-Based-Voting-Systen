import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { API_URL } from "../config";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
function getOrCreateSessionWallet() {
  const savedPrivateKey = localStorage.getItem(
    "evote_session_private_key"
  );

  if (savedPrivateKey) {
    return new ethers.Wallet(savedPrivateKey);
  }

  const sessionWallet = ethers.Wallet.createRandom();

  localStorage.setItem(
    "evote_session_private_key",
    sessionWallet.privateKey
  );

  localStorage.setItem(
    "evote_session_address",
    sessionWallet.address
  );

  return sessionWallet;
}

const getFriendlyErrorMessage = (error) => {
  const message = String(
    error?.message || error || ""
  ).toLowerCase();

  if (
    message.includes("invalid signer") ||
    message.includes("erc2771forwarderinvalidsigner") ||
    message.includes("0xc845a056")
  ) {
    return "Wallet signature verification failed. Please reconnect MetaMask and try again.";
  }

  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    error?.code === 4001
  ) {
    return "You cancelled the MetaMask request. Please try again when ready.";
  }

  if (
    message.includes("deadline") ||
    message.includes("expired")
  ) {
    return "The blockchain request expired. Please try again.";
  }

  if (
    message.includes("insufficient funds")
  ) {
    return "The transaction wallet does not have enough Sepolia ETH.";
  }

  if (
    message.includes("already registered")
  ) {
    return "This wallet is already registered. Please go to Login.";
  }

  if (
  message.includes("wrong network") ||
  message.includes("wrong chain") ||
  message.includes("chain id") ||
  message.includes("chainid") ||
  message.includes("did not switch to ethereum sepolia")
) {
  return "Please make sure MetaMask is connected to the Ethereum Sepolia network.";
}

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  ) {
    return "Unable to connect to the EVoTE server. Please check that the backend is running.";
  }

  return (
  error?.message ||
  "Something went wrong while completing registration. Please try again."
);
};

const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const currentChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (currentChainId === SEPOLIA_CHAIN_ID) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Ethereum Sepolia",
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } else {
      throw switchError;
    }
  }

  const activeChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (activeChainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      "MetaMask did not switch to Ethereum Sepolia. Please approve the network switch in MetaMask."
    );
  }
};

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [wallet, setWallet] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
  });

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ========================================================
  // FORM INPUT
  // ========================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ========================================================
  // 1. CONNECT + VERIFY WALLET
  // ========================================================

  const connectWallet = async () => {
    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed."
        );
      }

      setStatus("Connecting MetaMask...");

      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });

      setStatus("Switching MetaMask to Ethereum Sepolia...");
      await switchToSepolia();

      const selectedWallet = accounts[0];

      setWallet(selectedWallet);

      // Request authentication nonce
      const nonceResponse = await fetch(
        `${API_URL}/auth/metamask/nonce`,
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

      const nonceData =
        await nonceResponse.json();

      if (!nonceResponse.ok) {
        throw new Error(
          nonceData.detail ||
            "Could not prepare wallet verification."
        );
      }

      setStatus(
        "Please sign the verification message..."
      );

      const signature =
        await window.ethereum.request({
          method: "personal_sign",
          params: [
            nonceData.message,
            selectedWallet,
          ],
        });

      const verifyResponse = await fetch(
        `${API_URL}/auth/metamask/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: selectedWallet,
            signature,
          }),
        }
      );

      const verifyData =
        await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.detail ||
            "Wallet verification failed."
        );
      }
      

      // Already registered → send to login/dashboard
      if (verifyData.registered) {
        if (verifyData.access_token) {
          localStorage.setItem(
            "token",
            verifyData.access_token
          );

          localStorage.setItem(
            "access_token",
            verifyData.access_token
          );

          localStorage.setItem(
            "user",
            JSON.stringify(
              verifyData.user
            )
          );
        }

        const role =
          verifyData.user?.role;

        if (
  role === "superadmin" ||
  role === "admin"
) {
  window.location.href = "/admin";
} else {
  window.location.href = "/user";
}

        return;
      }

      localStorage.setItem(
        "registration_wallet",
        selectedWallet
      );

      setStatus(
        "Wallet verified successfully."
      );

      setStep(2);

    } catch (err) {
      console.error(err);

      if (err?.code === 4001) {
        setError(
          "MetaMask request was cancelled."
        );
      } else {
        setError(
          err?.message ||
            "Wallet connection failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 2. SEND REGISTRATION OTP
  // ========================================================

  const startRegistration = async (e) => {
    e.preventDefault();

    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (!wallet) {
        throw new Error(
          "Please connect MetaMask first."
        );
      }

      if (
        !form.full_name ||
        !form.email ||
        !form.phone ||
        !form.date_of_birth
      ) {
        throw new Error(
          "Please fill all fields."
        );
      }

      setStatus(
  "Saving registration details..."
);

      const response = await fetch(
        `${API_URL}/auth/metamask/register/start`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            wallet_address: wallet,

            // Backend schema currently expects
            // this field. It is not used here.
            signature: "wallet-verified",

            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            date_of_birth:
              form.date_of_birth,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not start registration."
        );
      }

      setStatus(
  "Details saved successfully."
);

setStep(3);

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  
  // ========================================================
  // 4. GASLESS BLOCKCHAIN REGISTRATION
  // ========================================================

  const completeGaslessRegistration =
    async () => {
      setError("");
      setStatus("");
      setLoading(true);

      try {
        if (!window.ethereum) {
          throw new Error(
            "MetaMask is not installed."
          );
        }

        setStatus("Switching MetaMask to Ethereum Sepolia...");
        await switchToSepolia();

        const accounts =
          await window.ethereum.request({
            method: "eth_requestAccounts",
          });

        const selectedWallet =
          accounts[0];

        if (
          selectedWallet.toLowerCase() !==
          wallet.toLowerCase()
        ) {
          throw new Error(
            "Please switch MetaMask back to the wallet used for registration."
          );
        }

        // ----------------------------------------------
        // Prepare blockchain request
        // ----------------------------------------------

        setStatus(
          "Preparing gasless blockchain registration..."
        );

        const sessionWallet =
  getOrCreateSessionWallet();

const prepareResponse =
  await fetch(
    `${API_URL}/auth/metamask/register/prepare-blockchain`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        wallet_address:
          selectedWallet,

        session_key:
          sessionWallet.address,
      }),
    }
  );

        const prepared =
          await prepareResponse.json();

        if (!prepareResponse.ok) {
          throw new Error(
            prepared.detail ||
              "Could not prepare blockchain registration."
          );
        }

        // ----------------------------------------------
        // EIP-712 typed signature
        // ----------------------------------------------

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

          primaryType:
            prepared.primaryType,

          message:
            prepared.message,
        };

        setStatus(
          "Please sign the gasless registration in MetaMask..."
        );

        const signature =
          await window.ethereum.request({
            method:
              "eth_signTypedData_v4",

            params: [
              selectedWallet,
              JSON.stringify(
                typedData
              ),
            ],
          });

        // ----------------------------------------------
        // Send signed request to relayer
        // ----------------------------------------------

        setStatus(
          "Registering on Ethereum Sepolia..."
        );

        const relayResponse =
          await fetch(
            `${API_URL}/auth/metamask/register/relay`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
  from_address:
    prepared.message.from,

  to_address:
    prepared.message.to,

  value: Number(
    prepared.message.value
  ),

  gas: Number(
    prepared.message.gas
  ),

  deadline: Number(
    prepared.message.deadline
  ),

  data:
    prepared.message.data,

  signature,

  session_key:
    sessionWallet.address,
}),
            }
          );

        const result =
          await relayResponse.json();

        if (!relayResponse.ok) {
          throw new Error(
            result.detail ||
              "Gasless blockchain registration failed."
          );
        }

        // ----------------------------------------------
        // Save session
        // ----------------------------------------------

        localStorage.setItem(
          "token",
          result.access_token
        );

        localStorage.setItem(
          "access_token",
          result.access_token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            result.user
          )
        );

        localStorage.removeItem(
          "registration_wallet"
        );

        setStatus(
          "Registration completed successfully."
        );

        setTimeout(() => {
          window.location.href =
            "/user";
        }, 700);

      } catch (err) {
        console.error("Registration error:", err);

        setError(
          getFriendlyErrorMessage(err)
        );
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <style>
          {`
            * {
              box-sizing: border-box;
            }

            html,
            body,
            #root {
              margin: 0;
              min-height: 100%;
            }

            .register-page {
              min-height: 100vh;
              min-height: 100dvh;

              display: flex;
              align-items: center;
              justify-content: center;

              padding: 18px;

              background-image:
                linear-gradient(
                  rgba(0, 0, 0, 0.74),
                  rgba(0, 0, 0, 0.74)
                ),
                url("/blockchain-bg.webp");

              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
            }

            .register-card {
              width: 100%;
              max-width: 370px;

              padding: 22px;

              background: rgba(24, 24, 24, 0.88);

              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);

              border: 1px solid rgba(255, 255, 255, 0.14);
              border-radius: 14px;

              box-shadow: 0 18px 45px rgba(0, 0, 0, 0.5);

              color: white;
            }

            .register-header {
              text-align: center;
              margin-bottom: 15px;
            }

            .register-title {
              margin: 0;

              font-size: 25px;
              line-height: 1.1;

              font-weight: 800;
              letter-spacing: 0.5px;
            }

            .register-subtitle {
              margin: 6px 0 2px;

              color: #b8bec8;

              font-size: 12.5px;
              line-height: 1.35;
            }

            .register-caption {
              margin: 0;

              color: #858c98;

              font-size: 11px;
              line-height: 1.35;
            }

            .step-indicator {
              display: flex;
              justify-content: center;
              align-items: center;

              gap: 6px;

              margin-bottom: 14px;
            }

            .step-bar {
              height: 4px;

              border-radius: 999px;

              transition: all 0.25s ease;
            }

            .wallet-box,
            .info-box,
            .complete-box,
            .status-box,
            .error-box {
              border-radius: 8px;
            }

            .wallet-box {
              padding: 9px 10px;
              margin-bottom: 11px;

              background: rgba(37, 99, 235, 0.1);

              border: 1px solid rgba(96, 165, 250, 0.2);

              color: #bfdbfe;

              font-size: 11px;
              line-height: 1.45;

              word-break: break-all;
            }

            .wallet-label {
              display: block;

              margin-bottom: 2px;

              font-size: 11.5px;
              font-weight: 700;
            }

            .error-box {
              display: flex;
              align-items: flex-start;

              gap: 9px;

              padding: 10px;
              margin-bottom: 11px;

              background: rgba(239, 68, 68, 0.12);

              border: 1px solid rgba(248, 113, 113, 0.3);

              color: #fecaca;
            }

            .error-icon {
              flex-shrink: 0;

              width: 22px;
              height: 22px;

              display: flex;
              align-items: center;
              justify-content: center;

              border-radius: 50%;

              background: rgba(239, 68, 68, 0.2);

              color: #fca5a5;

              font-size: 13px;
              font-weight: 800;
            }

            .error-title {
              margin-bottom: 2px;

              color: #fee2e2;

              font-size: 12px;
              font-weight: 700;
            }

            .error-message {
              color: #fca5a5;

              font-size: 11.5px;
              line-height: 1.45;

              word-break: break-word;
            }

            .status-box {
              padding: 9px 10px;
              margin-bottom: 11px;

              background: rgba(34, 197, 94, 0.1);

              border: 1px solid rgba(34, 197, 94, 0.22);

              color: #bbf7d0;

              font-size: 11.5px;
              line-height: 1.45;
            }

            .info-box,
            .complete-box {
              padding: 10px 11px;
              margin-bottom: 13px;

              background: rgba(37, 99, 235, 0.1);

              border: 1px solid rgba(96, 165, 250, 0.2);

              color: #bfdbfe;

              font-size: 11.8px;
              line-height: 1.5;
            }

            .step-heading {
              margin-bottom: 12px;
            }

            .step-title {
              margin: 0 0 3px;

              font-size: 15px;
              line-height: 1.3;
              font-weight: 700;
            }

            .step-description {
              margin: 0;

              color: #8f96a3;

              font-size: 11.5px;
              line-height: 1.4;
            }

            .form-group {
              margin-bottom: 10px;
            }

            .form-label {
              display: block;

              margin-bottom: 5px;

              color: #d1d5db;

              font-size: 11.5px;
              font-weight: 500;
            }

            .form-input {
              width: 100%;
              height: 38px;

              padding: 0 11px;

              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 8px;

              background: rgba(15, 23, 42, 0.55);

              color: white;

              outline: none;

              font-size: 12px;

              transition:
                border-color 0.2s ease,
                box-shadow 0.2s ease,
                background 0.2s ease;
            }

            .form-input::placeholder {
              color: #6f7682;
            }

            .form-input:focus {
              border-color: rgba(249, 115, 22, 0.7);

              box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);

              background: rgba(15, 23, 42, 0.72);
            }

            .primary-button,
            .secondary-button {
              width: 100%;

              min-height: 40px;

              padding: 9px 12px;

              border-radius: 8px;

              font-size: 13px;
              font-weight: 700;

              cursor: pointer;

              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease,
                background 0.2s ease,
                border-color 0.2s ease,
                opacity 0.2s ease;
            }

            .primary-button {
              border: none;

              background:
                linear-gradient(
                  135deg,
                  #f97316 0%,
                  #f59e0b 100%
                );

              color: white;

              box-shadow:
                0 5px 16px rgba(249, 115, 22, 0.17);
            }

            .primary-button:hover:not(:disabled) {
              transform: translateY(-1px);

              box-shadow:
                0 7px 20px rgba(249, 115, 22, 0.26);
            }

            .primary-button:disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }

            .secondary-button {
              border: 1px solid rgba(255, 255, 255, 0.2);

              background: rgba(255, 255, 255, 0.025);

              color: #f3f4f6;
            }

            .secondary-button:hover {
              background: rgba(255, 255, 255, 0.07);

              border-color: rgba(255, 255, 255, 0.32);
            }

            .divider {
              display: flex;
              align-items: center;

              gap: 10px;

              margin: 14px 0 11px;
            }

            .divider-line {
              flex: 1;
              height: 1px;

              background: rgba(255, 255, 255, 0.1);
            }

            .divider-text {
              color: #8f96a3;

              font-size: 10px;
              font-weight: 600;

              letter-spacing: 0.7px;
            }

            .login-section {
              margin-top: 0;
            }

            .login-prompt {
              margin: 0 0 8px;

              text-align: center;

              color: #c4c7ce;

              font-size: 11.5px;
            }

            .register-footer {
              margin: 11px 0 0;

              text-align: center;

              color: #777f8b;

              font-size: 10px;
              line-height: 1.4;
            }

            @media (max-width: 768px) {
              .register-page {
                padding: 16px;
              }

              .register-card {
                max-width: 360px;
                padding: 20px;
              }
            }

            @media (max-width: 480px) {
              .register-page {
                padding: 12px;
              }

              .register-card {
                max-width: 100%;

                padding: 18px;

                border-radius: 12px;
              }

              .register-header {
                margin-bottom: 13px;
              }

              .register-title {
                font-size: 23px;
              }

              .register-subtitle {
                font-size: 12px;
              }

              .step-indicator {
                margin-bottom: 12px;
              }

              .form-input {
                height: 37px;
              }

              .primary-button,
              .secondary-button {
                min-height: 39px;

                font-size: 12.5px;
              }
            }

            @media (max-width: 360px) {
              .register-page {
                padding: 9px;
              }

              .register-card {
                padding: 15px;
              }

              .register-title {
                font-size: 22px;
              }

              .register-caption {
                font-size: 10.5px;
              }

              .info-box,
              .complete-box,
              .wallet-box {
                padding: 8px 9px;

                font-size: 11px;
              }

              .form-group {
                margin-bottom: 9px;
              }

              .form-input {
                height: 36px;

                font-size: 11.5px;
              }
            }

            @media (max-height: 650px) {
              .register-page {
                align-items: flex-start;

                padding-top: 10px;
                padding-bottom: 10px;
              }

              .register-card {
                padding-top: 16px;
                padding-bottom: 16px;
              }

              .register-header {
                margin-bottom: 11px;
              }

              .step-indicator {
                margin-bottom: 10px;
              }

              .login-section {
                margin-top: 11px;
              }

              .register-footer {
                margin-top: 9px;
              }
            }
          `}
        </style>

        <div className="register-page">
          <div className="register-card">
            {/* HEADER */}
            <div className="register-header">
              <h1 className="register-title">
                EVoTE ⬢
              </h1>

              <p className="register-subtitle">
                Secure Blockchain Voting
              </p>

              <p className="register-caption">
                Create your voter account securely
              </p>
            </div>

            {/* STEP INDICATOR */}
            <div className="step-indicator">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="step-bar"
                  style={{
                    width: item === step ? "30px" : "21px",
                    background:
                      item <= step
                        ? "#f97316"
                        : "rgba(255,255,255,0.18)",
                  }}
                />
              ))}
            </div>

            {/* WALLET */}
            {wallet && (
              <div className="wallet-box">
                <span className="wallet-label">
                  Connected Wallet
                </span>
                {wallet}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="error-box">
                <div className="error-icon">
                  !
                </div>

                <div style={{ minWidth: 0 }}>
                  <div className="error-title">
                    Registration could not be completed
                  </div>

                  <div className="error-message">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* STATUS */}
            {status && !error && (
              <div className="status-box">
                {status}
              </div>
            )}

            {/* STEP 1 - CONNECT WALLET */}
            {step === 1 && (
              <>
                <div className="info-box">
                  Connect and verify your MetaMask wallet to begin your secure
                  EVoTE registration.
                </div>

                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={loading}
                  className="primary-button"
                >
                  {loading
                    ? "Please wait..."
                    : "Register with MetaMask"}
                </button>
              </>
            )}

            {/* STEP 2 - PERSONAL DETAILS */}
            {step === 2 && (
              <form onSubmit={startRegistration}>
                <div className="step-heading">
                  <h3 className="step-title">
                    Personal Information
                  </h3>

                  <p className="step-description">
                    Enter your details to continue.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Full Name
                  </label>

                  <input
                    name="full_name"
                    placeholder="Enter your full name"
                    value={form.full_name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email Address
                  </label>

                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number
                  </label>

                  <input
                    name="phone"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Date of Birth
                  </label>

                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button"
                >
                  {loading
                    ? "Saving..."
                    : "Continue"}
                </button>
              </form>
            )}

            {/* STEP 3 - COMPLETE */}
            {step === 3 && (
              <>
                <div className="step-heading">
                  <h3 className="step-title">
                    Complete Registration
                  </h3>

                  <p className="step-description">
                    Confirm your registration with MetaMask.
                  </p>
                </div>

                <div className="complete-box">
                  ✓ Registration details are ready.
                  <br />
                  ✓ Confirm the registration with MetaMask.
                  <br />
                  ✓ No Sepolia ETH is required.
                  <br />
                  ✓ EVoTE sponsors the blockchain transaction.
                </div>

                <button
                  type="button"
                  onClick={completeGaslessRegistration}
                  disabled={loading}
                  className="primary-button"
                >
                  {loading
                    ? "Registering..."
                    : "Complete Registration"}
                </button>
              </>
            )}

            {/* DIVIDER */}
            <div className="divider">
              <div className="divider-line" />

              <span className="divider-text">
                OR
              </span>

              <div className="divider-line" />
            </div>

            {/* BACK TO LOGIN */}
            <div className="login-section">
              <p className="login-prompt">
                Already registered?
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="secondary-button"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
}

export default Register;
