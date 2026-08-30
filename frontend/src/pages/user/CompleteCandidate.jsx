import { API_URL } from "../../config";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { CONTRACT_ADDRESS } from "../../contract/contract";

function CompleteCandidate() {
  const navigate = useNavigate();

  const {
    instId,
    orgId,
    postId,
  } = useParams();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [wallet, setWallet] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("user")
    );

    setUser(storedUser);

    if (storedUser?.wallet_address) {
      setWallet(storedUser.wallet_address);
    }
  }, []);

  async function completeCandidateRegistration() {
    try {
      setLoading(true);
      setMessage(
        "Preparing secure candidate registration..."
      );

      // -------------------------------------------------
      // 1. CHECK LOGGED-IN WALLET
      // -------------------------------------------------

      if (!wallet) {
        throw new Error(
          "Registered voter wallet was not found. Please log in again."
        );
      }

      // -------------------------------------------------
      // 2. LOAD LOGIN TOKEN
      // -------------------------------------------------

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Login token not found. Please log in again."
        );
      }

      // -------------------------------------------------
      // 3. LOAD SESSION PRIVATE KEY
      //
      // This is the temporary browser/session wallet
      // created during voter registration.
      // It is NOT the MetaMask private key.
      // -------------------------------------------------

      const sessionPrivateKey =
        localStorage.getItem(
          "evote_session_private_key"
        );

      if (!sessionPrivateKey) {
        throw new Error(
          "Secure voting session key was not found. Please register or sign in again using this browser."
        );
      }

      const sessionWallet =
        new ethers.Wallet(
          sessionPrivateKey
        );
        // -------------------------------------------------
// 4. VERIFY CURRENT SESSION KEY ON BLOCKCHAIN
// -------------------------------------------------

if (!window.ethereum) {
  throw new Error(
    "MetaMask provider was not found."
  );
}

const provider =
  new ethers.BrowserProvider(
    window.ethereum
  );

const contract =
  new ethers.Contract(
    CONTRACT_ADDRESS,
    [
      "function sessionKeys(address) view returns (address)"
    ],
    provider
  );

const authorizedSessionKey =
  await contract.sessionKeys(
    wallet
  );

console.log(
  "Browser session address:",
  sessionWallet.address
);

console.log(
  "On-chain session address:",
  authorizedSessionKey
);

console.log(
  "Voter wallet:",
  wallet
);

if (
  String(authorizedSessionKey)
    .toLowerCase() !==
  String(sessionWallet.address)
    .toLowerCase()
) {
  throw new Error(
    "Your browser voting session is no longer authorized. Please log out and sign in again to create a new secure session."
  );
}


      // -------------------------------------------------
      // 4. GET CURRENT CANDIDATE NONCE
      // -------------------------------------------------

      setMessage(
        "Getting candidate registration nonce..."
      );

      const nonceRes =
        await axios.get(
          `${API_URL}/candidate/nonce/${wallet}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const nonce =
        Number(
          nonceRes.data?.nonce
        );

      if (
        nonceRes.data?.nonce === undefined ||
        Number.isNaN(nonce)
      ) {
        throw new Error(
          "Could not get candidate registration nonce."
        );
      }

      // -------------------------------------------------
      // 5. CREATE EXACT MESSAGE EXPECTED BY Voting.sol
      //
      // Solidity:
      // keccak256(
      //   abi.encodePacked(
      //     address(this),
      //     block.chainid,
      //     voter,
      //     institutionId,
      //     organizationId,
      //     postId,
      //     nonce
      //   )
      // )
      // -------------------------------------------------

      const messageHash =
        ethers.solidityPackedKeccak256(
          [
            "address",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "uint256",
            "uint256",
          ],
          [
            CONTRACT_ADDRESS,
            11155111,
            wallet,
            Number(instId),
            Number(orgId),
            Number(postId),
            nonce,
          ]
        );

      // -------------------------------------------------
      // 6. SIGN SILENTLY WITH SESSION WALLET
      //
      // No MetaMask popup is opened here.
      // -------------------------------------------------

      setMessage(
        "Authorizing candidate registration..."
      );

      const signature =
        await sessionWallet.signMessage(
          ethers.getBytes(
            messageHash
          )
        );

      // -------------------------------------------------
      // 7. SEND TO BACKEND RELAYER
      // -------------------------------------------------

      setMessage(
        "Submitting candidate registration to Sepolia..."
      );

      const relayRes =
        await axios.post(
          `${API_URL}/candidate/session-relay`,
          {
            voter_address:
              wallet,

            institution_id:
              Number(instId),

            organization_id:
              Number(orgId),

            post_id:
              Number(postId),

            nonce,

            signature,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const txHash =
        relayRes.data?.tx_hash;

      setMessage(
        txHash
          ? `Candidate registration successful. Tx: ${txHash}`
          : "Candidate registration successful."
      );

      setTimeout(() => {
        navigate("/user");
      }, 2500);
    } catch (err) {
      console.error(
        "Candidate registration error:",
        err
      );

      const errorMessage =
  err?.response?.data?.detail ||
  err?.message ||
  "Candidate registration failed.";

if (
  String(errorMessage).includes(
    "Invalid session signature"
  )
) {
  setMessage(
    "Your secure voting session is no longer valid. Please log out and sign in again."
  );
} else {
  setMessage(
    errorMessage
  );
}
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="user-panel">
      <div className="section-heading">
        <h2>
          Complete Candidate Registration
        </h2>

        <p>
          Your candidate request has been
          approved by the admin.
        </p>
      </div>

      <div
        className="request-election-card"
        style={{
          maxWidth: "650px",
          marginTop: "20px",
        }}
      >
        <div>
          <h3>
            Candidate Registration
          </h3>

          <p>
            <strong>Name:</strong>{" "}
            {user?.full_name ||
              "Voter"}
          </p>

          <p>
            <strong>Wallet:</strong>{" "}
            <span className="hash-text">
              {wallet ||
                "Not available"}
            </span>
          </p>

          <p>
            <strong>
              Institution ID:
            </strong>{" "}
            {instId}
          </p>

          <p>
            <strong>
              Organization ID:
            </strong>{" "}
            {orgId}
          </p>

          <p>
            <strong>
              Election / Post ID:
            </strong>{" "}
            {postId}
          </p>

          <p
            style={{
              marginTop: "16px",
              color: "#94a3b8",
            }}
          >
            Candidate registration is
            submitted securely using your
            authorized browser session.
            MetaMask confirmation is not
            required.
          </p>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginTop: "18px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#17343b",
            border:
              "1px solid #155e75",
            color: "#67e8f9",
            maxWidth: "650px",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <button
          className="primary-action"
          disabled={loading}
          onClick={
            completeCandidateRegistration
          }
        >
          {loading
            ? "Processing..."
            : "Complete Registration"}
        </button>

        <button
          className="secondary-btn"
          disabled={loading}
          onClick={() =>
            navigate(-1)
          }
        >
          Back
        </button>
      </div>
    </section>
  );
}

export default CompleteCandidate;