import { API_URL } from "../config";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const mode = location.state?.mode || "register";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setVerifying(true);

    try {
      if (mode === "register") {
        await axios.post(`${API_URL}/verify-register-otp`, {
          email,
          otp,
        });

        setMessage("Email verified successfully");
        setTimeout(() => navigate("/login"), 1000);
      } else {
        await axios.post(`${API_URL}/reset-password`, {
          email,
          otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });

        setMessage("Password reset successfully");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "OTP verification failed");
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const url =
        mode === "register"
          ? `${API_URL}/resend-register-otp`
          : `${API_URL}/resend-reset-otp`;

      await axios.post(url, { email });

      setMessage("OTP resent successfully. Please check your email.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setResending(false);
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
          "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/blockchain-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>
        {`
          input::placeholder {
            color: rgba(255,255,255,0.55);
          }

          .otp-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: otpSpin 0.8s linear infinite;
          }

          @keyframes otpSpin {
            to {
              transform: rotate(360deg);
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
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "18px",
          color: "white",
        }}
      >
        <h1 style={{ textAlign: "center", margin: 0 }}>
          {mode === "register" ? "Verify Email" : "Reset Password"}
        </h1>

        <p style={{ textAlign: "center", color: "#d1d5db" }}>
          OTP sent to {email}
        </p>

        {message && <p style={{ color: "#86efac" }}>{message}</p>}
        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

        <form onSubmit={verifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={verifying}
            style={inputStyle}
          />

          {mode === "forgot" && (
            <>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={verifying}
                style={inputStyle}
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={verifying}
                style={inputStyle}
              />
            </>
          )}

          <button
            type="submit"
            disabled={verifying}
            style={{
              ...buttonStyle,
              cursor: verifying ? "not-allowed" : "pointer",
              opacity: verifying ? 0.85 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {verifying && <span className="otp-spinner"></span>}
            {verifying
              ? mode === "register"
                ? "Verifying..."
                : "Resetting..."
              : mode === "register"
              ? "Verify Email"
              : "Reset Password"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", color: "#d1d5db" }}>
          Didn't receive OTP?
        </p>

        <button
          onClick={resendOtp}
          disabled={resending || verifying}
          style={{
            ...resendButtonStyle,
            cursor: resending || verifying ? "not-allowed" : "pointer",
            opacity: resending || verifying ? 0.85 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {resending && <span className="otp-spinner"></span>}
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.25)",
  padding: "12px 14px",
  margin: "8px 0",
  borderRadius: "8px",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  marginTop: "15px",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  background: "linear-gradient(135deg,#2563eb,#3b82f6)",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};

const resendButtonStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};

export default VerifyOtp;