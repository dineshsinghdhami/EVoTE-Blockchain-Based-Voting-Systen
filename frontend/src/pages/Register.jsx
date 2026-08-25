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
    message.includes("network") ||
    message.includes("chain")
  ) {
    return "Please make sure MetaMask is connected to the Ethereum Sepolia network.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  ) {
    return "Unable to connect to the EVoTE server. Please check that the backend is running.";
  }

  return "Something went wrong while completing registration. Please try again.";
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

  const [wallet, setWallet] = useState(
    localStorage.getItem("registration_wallet") || ""
  );

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
  });

  const [otp, setOtp] = useState("");

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
        "Sending verification OTP..."
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
        "OTP sent to your email."
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
  // 3. VERIFY EMAIL OTP
  // ========================================================

  const verifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (!otp) {
        throw new Error(
          "Enter the OTP from your email."
        );
      }

      setStatus("Verifying OTP...");

      const response = await fetch(
        `${API_URL}/auth/metamask/register/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "OTP verification failed."
        );
      }

      setStatus(
        "Email verified successfully."
      );

      setStep(4);

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "OTP verification failed."
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",

        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.68), rgba(0,0,0,0.68)), url('/blockchain-bg.webp')",

        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "32px",

          background:
            "rgba(255,255,255,0.08)",

          backdropFilter: "blur(15px)",
          WebkitBackdropFilter:
            "blur(15px)",

          border:
            "1px solid rgba(255,255,255,0.2)",

          borderRadius: "18px",

          boxShadow:
            "0 8px 32px rgba(0,0,0,0.35)",

          color: "white",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "800",
            }}
          >
            EVoTE ⬢
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: "4px",
              color: "#d1d5db",
              fontSize: "14px",
            }}
          >
            Secure Blockchain Voting
          </p>

          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: "12px",
            }}
          >
            Create your voter account securely
          </p>
        </div>

        {/* STEP INDICATOR */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "7px",
            marginBottom: "22px",
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={{
                width: item === step ? "34px" : "24px",
                height: "5px",
                borderRadius: "20px",

                background:
                  item <= step
                    ? "#f97316"
                    : "rgba(255,255,255,0.2)",

                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* WALLET */}

        {wallet && (
          <div
            style={{
              background:
                "rgba(37,99,235,0.12)",

              border:
                "1px solid rgba(96,165,250,0.25)",

              borderRadius: "10px",

              padding: "12px",
              marginBottom: "16px",

              color: "#bfdbfe",

              fontSize: "12px",
              lineHeight: "1.5",

              wordBreak: "break-all",
            }}
          >
            <strong>Connected Wallet</strong>

            <br />

            {wallet}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#fecaca",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(239,68,68,0.2)",
                color: "#fca5a5",
                fontWeight: "800",
                fontSize: "16px",
              }}
            >
              !
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "#fee2e2",
                  fontWeight: "700",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                Registration could not be completed
              </div>

              <div
                style={{
                  color: "#fca5a5",
                  fontSize: "13px",
                  lineHeight: "1.55",
                }}
              >
                {error}
              </div>
            </div>
          </div>
        )}

        {/* STATUS */}

        {status && !error && (
          <div
            style={{
              background:
                "rgba(34,197,94,0.12)",

              border:
                "1px solid rgba(34,197,94,0.25)",

              color: "#bbf7d0",

              padding: "11px",

              borderRadius: "8px",

              marginBottom: "15px",

              fontSize: "14px",
            }}
          >
            {status}
          </div>
        )}

        {/* ============================== */}
        {/* STEP 1 - CONNECT WALLET */}
        {/* ============================== */}

        {step === 1 && (
          <>
            <div
              style={{
                background:
                  "rgba(37,99,235,0.12)",

                border:
                  "1px solid rgba(96,165,250,0.25)",

                borderRadius: "10px",

                padding: "14px",

                marginBottom: "20px",

                color: "#bfdbfe",

                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              Connect and verify your MetaMask
              wallet to begin your secure EVoTE
              registration.
            </div>

            <button
              type="button"
              onClick={connectWallet}
              disabled={loading}
              style={{
                ...buttonStyle,

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Please wait..."
                : "Register with MetaMask"}
            </button>
          </>
        )}

        {/* ============================== */}
        {/* STEP 2 - PERSONAL DETAILS */}
        {/* ============================== */}

        {step === 2 && (
          <form onSubmit={startRegistration}>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 5px 0",
                  fontSize: "17px",
                }}
              >
                Personal Information
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                Enter your details to continue.
              </p>
            </div>

            <label style={labelStyle}>
              Full Name
            </label>

            <input
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>
              Email Address
            </label>

            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>
              Phone Number
            </label>

            <input
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>
              Date of Birth
            </label>

            <input
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Sending OTP..."
                : "Continue"}
            </button>
          </form>
        )}

        {/* ============================== */}
        {/* STEP 3 - EMAIL OTP */}
        {/* ============================== */}

        {step === 3 && (
          <form onSubmit={verifyOtp}>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 7px 0",
                  fontSize: "17px",
                }}
              >
                Verify Your Email
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#d1d5db",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                Enter the verification code sent
                to
              </p>

              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#bfdbfe",
                  fontSize: "13px",
                  fontWeight: "600",
                  wordBreak: "break-all",
                }}
              >
                {form.email}
              </p>
            </div>

            <label style={labelStyle}>
              Verification Code
            </label>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value)
              }
              style={{
                ...inputStyle,
                textAlign: "center",
                letterSpacing: "4px",
                fontWeight: "700",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Verifying..."
                : "Verify Email"}
            </button>
          </form>
        )}

        {/* ============================== */}
        {/* STEP 4 - COMPLETE */}
        {/* ============================== */}

        {step === 4 && (
          <>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 7px 0",
                  fontSize: "17px",
                }}
              >
                Complete Registration
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                Your email has been verified.
              </p>
            </div>

            <div
              style={{
                background:
                  "rgba(37,99,235,0.12)",

                border:
                  "1px solid rgba(96,165,250,0.25)",

                padding: "14px",

                borderRadius: "10px",

                color: "#bfdbfe",

                fontSize: "13px",
                lineHeight: "1.7",

                marginBottom: "18px",
              }}
            >
              ✓ Email verified successfully.
              <br />
              ✓ No Sepolia ETH is required.
              <br />
              ✓ EVoTE sponsors the blockchain
              transaction.
            </div>

            <button
              type="button"
              onClick={
                completeGaslessRegistration
              }
              disabled={loading}
              style={{
                ...buttonStyle,

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Registering..."
                : "Complete Registration"}
            </button>
          </>
        )}

        {/* BACK TO LOGIN */}

        <p
          style={{
            textAlign: "center",
            marginTop: "21px",
            marginBottom: "10px",
            color: "#d1d5db",
            fontSize: "14px",
          }}
        >
          Already registered?
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/login")
          }
          style={{
            width: "100%",

            padding: "11px",

            background: "transparent",

            border:
              "1px solid rgba(255,255,255,0.3)",

            borderRadius: "9px",

            color: "white",

            fontWeight: "600",

            cursor: "pointer",
          }}
        >
          Back to Login
        </button>

        <p
          style={{
            marginTop: "18px",
            marginBottom: 0,

            textAlign: "center",

            color: "#9ca3af",

            fontSize: "12px",

            lineHeight: "1.5",
          }}
        >
          Wallet signatures are secure and do not
          expose your private key.
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",

  color: "#d1d5db",

  fontSize: "13px",

  fontWeight: "500",

  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",

  boxSizing: "border-box",

  padding: "12px",

  marginBottom: "15px",

  borderRadius: "9px",

  border:
    "1px solid rgba(255,255,255,0.25)",

  background:
    "rgba(15,23,42,0.55)",

  color: "white",

  outline: "none",

  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",

  padding: "13px",

  border: "none",

  borderRadius: "9px",

  background:
    "linear-gradient(135deg,#f97316,#f59e0b)",

  color: "white",

  fontSize: "15px",

  fontWeight: "700",

  cursor: "pointer",
};

export default Register;