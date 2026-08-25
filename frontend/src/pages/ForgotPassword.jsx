import { API_URL } from "../config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
    padding: "10px 14px",
    margin: "5px 0",
    height: "44px",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
  };

  const goToLogin = () => {
    setLeaving(true);
    setTimeout(() => {
      navigate("/login");
    }, 350);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email");
      return;
    }

    try {
      setMessage("");
      setLoading(true);

      await axios.post(`${API_URL}/forgot-password`, {
        email: email,
      });

      navigate("/verify-otp", {
        state: {
          email: email,
          mode: "forgot",
        },
      });
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Failed to send OTP");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/blockchain-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>
        {`
          input::placeholder {
            color: rgba(255,255,255,0.55);
          }

          .forgot-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes forgotFadeIn {
            from {
              opacity: 0;
              transform: translateY(25px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes forgotFadeOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-25px) scale(0.96);
            }
          }
        `}
      </style>

      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "28px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          color: "white",
          animation: leaving
            ? "forgotFadeOut 0.35s ease forwards"
            : "forgotFadeIn 0.45s ease forwards",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "800",
              color: "#ffffff",
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
            Forgot Password
          </p>
        </div>

        {message && (
          <p
            style={{
              background: "rgba(34,197,94,0.2)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#bbf7d0",
              padding: "10px",
              borderRadius: "10px",
              fontSize: "14px",
              marginBottom: "15px",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "15px",
              border: "none",
              borderRadius: "8px",
              background: "linear-gradient(135deg,#2563eb,#3b82f6)",
              color: "white",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading && <span className="forgot-spinner"></span>}
            {loading ? "Sending OTP..." : "Submit"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#d1d5db",
            fontSize: "14px",
          }}
        >
          Remember your password?{" "}
          <span
            onClick={goToLogin}
            style={{
              color: "#93c5fd",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;