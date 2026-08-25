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

      const nonceResponse = await fetch(
        `${API_URL}/auth/metamask/nonce`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: wallet,
          }),
        }
      );

      const nonceData = await nonceResponse.json();

      if (!nonceResponse.ok) {
        throw new Error(
          nonceData.detail ||
            "Could not prepare MetaMask login."
        );
      }

      // --------------------------------------------------
      // 4. SIGN LOGIN MESSAGE
      //
      // No blockchain transaction.
      // No gas fee.
      // --------------------------------------------------

      setStatus("Please sign the login message in MetaMask...");

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [
          nonceData.message,
          wallet,
        ],
      });

      // --------------------------------------------------
      // 5. VERIFY SIGNATURE
      // --------------------------------------------------

      setStatus("Verifying wallet...");

      const verifyResponse = await fetch(
        `${API_URL}/auth/metamask/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: wallet,
            signature,
          }),
        }
      );

      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          result.detail ||
            "MetaMask verification failed."
        );
      }

      // --------------------------------------------------
      // 6. NEW WALLET → REGISTER
      // --------------------------------------------------

      if (!result.registered) {
        localStorage.setItem(
          "registration_wallet",
          wallet
        );

        navigate("/register");
        return;
      }

      // --------------------------------------------------
      // 7. SAVE LOGIN SESSION
      // --------------------------------------------------

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
        JSON.stringify(result.user)
      );

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
        setError(
          err?.message ||
            "MetaMask login failed."
        );
      }
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
          maxWidth: "410px",
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
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
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
              color: "#d1d5db",
              fontSize: "14px",
            }}
          >
            Secure Blockchain Voting
          </p>
        </div>

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
          Login securely using your MetaMask wallet.
          No username or password is required.
        </div>

        {error && (
          <div
            style={{
              background:
                "rgba(239,68,68,0.15)",

              border:
                "1px solid rgba(239,68,68,0.3)",

              color: "#fca5a5",
              padding: "11px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

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

        <button
          type="button"
          onClick={loginWithMetaMask}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",

            border: "none",
            borderRadius: "9px",

            background:
              "linear-gradient(135deg,#f97316,#f59e0b)",

            color: "white",
            fontSize: "15px",
            fontWeight: "700",

            cursor:
              loading
                ? "not-allowed"
                : "pointer",

            opacity:
              loading
                ? 0.7
                : 1,
          }}
        >
          {loading
            ? "Please wait..."
            : "Login with MetaMask"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "22px",
            color: "#d1d5db",
            fontSize: "14px",
          }}
        >
          First time using EVoTE?
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/register")
          }
          style={{
            width: "100%",
            padding: "11px",

            background:
              "transparent",

            border:
              "1px solid rgba(255,255,255,0.3)",

            borderRadius: "9px",

            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Register with MetaMask
        </button>

        <p
          style={{
            marginTop: "18px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          Signing a login message does not cost gas.
        </p>
      </div>
    </div>
  );
}

export default Login;