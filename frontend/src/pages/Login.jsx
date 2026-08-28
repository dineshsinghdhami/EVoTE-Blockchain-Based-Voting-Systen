import { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithMetaMask = async () => {
    setError("");
    setStatus("");
    setLoading(true);

    try {
      // --------------------------------------------------
      // 1. CHECK METAMASK
      // --------------------------------------------------

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask first."
        );
      }

      // --------------------------------------------------
      // 2. CONNECT WALLET
      // --------------------------------------------------

      setStatus("Connecting MetaMask...");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No MetaMask account selected.");
      }

      const wallet = accounts[0];

      // --------------------------------------------------
      // 3. REQUEST LOGIN NONCE
      // --------------------------------------------------

      setStatus("Preparing secure login...");

      const nonceResponse = await fetch(`${API_URL}/auth/metamask/nonce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: wallet,
        }),
      });

      const nonceData = await nonceResponse.json();

      if (!nonceResponse.ok) {
        throw new Error(
          nonceData.detail || "Could not prepare MetaMask login."
        );
      }

      // --------------------------------------------------
      // 4. SIGN LOGIN MESSAGE
      // --------------------------------------------------

      setStatus("Please sign the login message in MetaMask...");

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [nonceData.message, wallet],
      });

      // --------------------------------------------------
      // 5. VERIFY SIGNATURE
      // --------------------------------------------------

      setStatus("Verifying wallet...");

      const verifyResponse = await fetch(`${API_URL}/auth/metamask/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: wallet,
          signature,
        }),
      });

      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          result.detail || "MetaMask verification failed."
        );
      }

      // --------------------------------------------------
      // 6. NEW WALLET → REGISTER
      // --------------------------------------------------

      if (!result.registered) {
        localStorage.setItem("registration_wallet", wallet);

        navigate("/register");
        return;
      }

      // --------------------------------------------------
      // 7. SAVE LOGIN SESSION
      // --------------------------------------------------

      localStorage.setItem("token", result.access_token);
      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));

      // --------------------------------------------------
      // 8. ROLE REDIRECT
      // --------------------------------------------------

      const role = result.user.role;

      setStatus("Login successful.");

      if (role === "superadmin") {
        window.location.href = "/admin";
      } else if (role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/user";
      }
    } catch (err) {
      console.error(err);

      if (err?.code === 4001) {
        setError("MetaMask request was cancelled.");
      } else {
        setError(err?.message || "MetaMask login failed.");
      }
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

          .login-page {
            min-height: 100vh;
            min-height: 100dvh;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

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

          .login-card {
            width: 100%;
            max-width: 350px;

            padding: 24px;

            background: rgba(24, 24, 24, 0.88);

            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);

            border: 1px solid rgba(255, 255, 255, 0.14);

            border-radius: 14px;

            box-shadow:
              0 18px 45px rgba(0, 0, 0, 0.5);

            color: white;
          }

          .login-header {
            text-align: center;
            margin-bottom: 20px;
          }

          .login-title {
            margin: 0;

            font-size: 27px;
            line-height: 1.1;

            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .login-subtitle {
            margin: 7px 0 0;

            color: #b8bec8;

            font-size: 13px;
            line-height: 1.4;
          }

          .login-info {
            padding: 11px 12px;
            margin-bottom: 14px;

            background: rgba(37, 99, 235, 0.1);

            border:
              1px solid rgba(96, 165, 250, 0.22);

            border-radius: 8px;

            color: #bfdbfe;

            font-size: 12.5px;
            line-height: 1.55;
          }

          .message-box {
            padding: 9px 11px;
            margin-bottom: 12px;

            border-radius: 7px;

            font-size: 12.5px;
            line-height: 1.45;

            word-break: break-word;
          }

          .error-box {
            background: rgba(239, 68, 68, 0.12);

            border:
              1px solid rgba(239, 68, 68, 0.28);

            color: #fca5a5;
          }

          .status-box {
            background: rgba(34, 197, 94, 0.1);

            border:
              1px solid rgba(34, 197, 94, 0.24);

            color: #bbf7d0;
          }

          .login-button {
            width: 100%;
            min-height: 42px;

            padding: 10px 14px;

            border: none;
            border-radius: 8px;

            background:
              linear-gradient(
                135deg,
                #f97316 0%,
                #f59e0b 100%
              );

            color: white;

            font-size: 14px;
            font-weight: 700;

            cursor: pointer;

            box-shadow:
              0 5px 16px rgba(249, 115, 22, 0.18);

            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              opacity 0.2s ease;
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-1px);

            box-shadow:
              0 7px 20px rgba(249, 115, 22, 0.28);
          }

          .login-button:disabled {
            cursor: not-allowed;
            opacity: 0.7;
          }

          .divider {
            display: flex;
            align-items: center;

            gap: 10px;

            margin: 17px 0 13px;
          }

          .divider-line {
            flex: 1;

            height: 1px;

            background:
              rgba(255, 255, 255, 0.1);
          }

          .divider-text {
            color: #8f96a3;

            font-size: 10px;
            font-weight: 600;

            letter-spacing: 0.7px;
          }

          .register-text {
            margin: 0 0 10px;

            text-align: center;

            color: #c4c7ce;

            font-size: 12.5px;
          }

          .register-button {
            width: 100%;
            min-height: 40px;

            padding: 9px 14px;

            background:
              rgba(255, 255, 255, 0.025);

            border:
              1px solid rgba(255, 255, 255, 0.2);

            border-radius: 8px;

            color: #f3f4f6;

            font-size: 13.5px;
            font-weight: 600;

            cursor: pointer;

            transition:
              background 0.2s ease,
              border-color 0.2s ease;
          }

          .register-button:hover {
            background:
              rgba(255, 255, 255, 0.07);

            border-color:
              rgba(255, 255, 255, 0.32);
          }

          .login-footer {
            margin: 14px 0 0;

            text-align: center;

            color: #858c98;

            font-size: 11px;
            line-height: 1.4;
          }

          /* ------------------------------------------
             TABLET / SMALLER LAPTOP
          ------------------------------------------ */

          @media (max-width: 768px) {
            .login-page {
              padding: 18px;
            }

            .login-card {
              max-width: 340px;
              padding: 22px;
            }

            .login-title {
              font-size: 25px;
            }
          }

          /* ------------------------------------------
             MOBILE
          ------------------------------------------ */

          @media (max-width: 480px) {
            .login-page {
              padding: 14px;

              align-items: center;
            }

            .login-card {
              max-width: 100%;

              padding: 20px;

              border-radius: 12px;
            }

            .login-header {
              margin-bottom: 17px;
            }

            .login-title {
              font-size: 24px;
            }

            .login-subtitle {
              margin-top: 5px;
              font-size: 12px;
            }

            .login-info {
              padding: 10px 11px;

              margin-bottom: 12px;

              font-size: 12px;

              line-height: 1.5;
            }

            .message-box {
              padding: 8px 10px;

              margin-bottom: 10px;

              font-size: 12px;
            }

            .login-button {
              min-height: 40px;

              font-size: 13.5px;
            }

            .divider {
              margin: 14px 0 11px;
            }

            .register-text {
              margin-bottom: 9px;

              font-size: 12px;
            }

            .register-button {
              min-height: 39px;

              font-size: 13px;
            }

            .login-footer {
              margin-top: 12px;

              font-size: 10.5px;
            }
          }

          /* ------------------------------------------
             VERY SMALL PHONES
          ------------------------------------------ */

          @media (max-width: 360px) {
            .login-page {
              padding: 10px;
            }

            .login-card {
              padding: 17px;

              border-radius: 11px;
            }

            .login-header {
              margin-bottom: 15px;
            }

            .login-title {
              font-size: 22px;
            }

            .login-subtitle {
              font-size: 11.5px;
            }

            .login-info {
              padding: 9px 10px;

              font-size: 11.5px;
            }

            .login-button {
              min-height: 39px;

              padding: 8px 10px;

              font-size: 13px;
            }

            .register-button {
              min-height: 38px;

              padding: 8px 10px;

              font-size: 12.5px;
            }
          }

          /* ------------------------------------------
             SHORT MOBILE SCREENS
          ------------------------------------------ */

          @media (max-height: 600px) {
            .login-page {
              align-items: flex-start;

              padding-top: 14px;
              padding-bottom: 14px;
            }

            .login-card {
              padding-top: 18px;
              padding-bottom: 18px;
            }

            .login-header {
              margin-bottom: 14px;
            }

            .login-info {
              margin-bottom: 11px;
            }

            .divider {
              margin-top: 12px;
              margin-bottom: 10px;
            }

            .login-footer {
              margin-top: 10px;
            }
          }
        `}
      </style>

      <div className="login-page">
        <div className="login-card">
          {/* HEADER */}

          <div className="login-header">
            <h1 className="login-title">
              EVoTE ⬢
            </h1>

            <p className="login-subtitle">
              Secure Blockchain Voting
            </p>
          </div>

          {/* INFORMATION */}

          <div className="login-info">
            Login securely using your MetaMask wallet.
            No username or password is required.
          </div>

          {/* ERROR */}

          {error && (
            <div className="message-box error-box">
              {error}
            </div>
          )}

          {/* STATUS */}

          {status && !error && (
            <div className="message-box status-box">
              {status}
            </div>
          )}

          {/* LOGIN */}

          <button
            type="button"
            className="login-button"
            onClick={loginWithMetaMask}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : "Login with MetaMask"}
          </button>

          {/* DIVIDER */}

          <div className="divider">
            <div className="divider-line" />

            <span className="divider-text">
              OR
            </span>

            <div className="divider-line" />
          </div>

          {/* REGISTER */}

          <p className="register-text">
            First time using EVoTE?
          </p>

          <button
            type="button"
            className="register-button"
            onClick={() => navigate("/register")}
          >
            Register with MetaMask
          </button>         
        </div>
      </div>
    </>
  );
}

export default Login;