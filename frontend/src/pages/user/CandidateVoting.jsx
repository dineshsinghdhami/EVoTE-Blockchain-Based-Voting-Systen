import { API_URL } from "../../config";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import UserBreadcrumb from "./UserBreadcrumb";
import { useVoting } from "../../context/VotingContext";

function getVoteTxStorageKey(
  wallet,
  institutionId,
  organizationId,
  postId,
  candidateId
) {
  if (!wallet) {
    return null;
  }

  return [
    "evote_vote_tx",
    wallet.toLowerCase(),
    institutionId,
    organizationId,
    postId,
    candidateId,
  ].join("_");
}

function CandidateVoting() {
  const navigate = useNavigate();
  const { instId, orgId, postId } = useParams();
  const {
  getContract,
  setMessage,
  account,
  user,
  walletMismatch,
} = useVoting();

  const [institutionName, setInstitutionName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [post, setPost] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [userVoteCount, setUserVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [confirmCandidate, setConfirmCandidate] = useState(null);
  const [votingCandidateId, setVotingCandidateId] = useState(null);

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, orgId, postId, account]);

  async function loadCandidates() {
  setLoading(true);

  try {
    const contract = await getContract();

    if (!contract) {
      setLoading(false);
      return;
    }

    // -----------------------------------------------------
    // INSTITUTION
    // -----------------------------------------------------

    const institutionData =
      await contract.institutions(
        Number(instId)
      );

    setInstitutionName(
      institutionData.name
    );

    // -----------------------------------------------------
    // ORGANIZATION
    //
    // New contract:
    // 0 = id
    // 1 = name
    // 2 = exists
    // 3 = postCount
    // -----------------------------------------------------

    const organizationData =
      await contract.getOrganization(
        Number(instId),
        Number(orgId)
      );

    setOrganizationName(
      organizationData.name ||
        organizationData[1]
    );

    // -----------------------------------------------------
    // POST
    // -----------------------------------------------------

    const postData =
      await contract.getPost(
        Number(instId),
        Number(orgId),
        Number(postId)
      );

    const loadedPost = {
      id: Number(postData.id),

      title: String(
        postData.title || ""
      ),

      active: Boolean(
        postData.active
      ),

      seatLimit: Number(
        postData.seatCount
      ),

      maxCandidateCount: Number(
        postData.maxCandidateCount
      ),

      candidateCount: Number(
        postData.candidateCount
      ),

      candidateRegistrationStart:
        Number(
          postData.candidateRegistrationStart
        ),

      candidateRegistrationEnd:
        Number(
          postData.candidateRegistrationEnd
        ),

      startDate: Number(
        postData.votingStart
      ),

      endDate: Number(
        postData.votingEnd
      ),
    };

    setPost(loadedPost);

    // -----------------------------------------------------
    // CANDIDATES
    // -----------------------------------------------------

    const temp = [];

    for (
      let i = 1;
      i <= loadedPost.candidateCount;
      i++
    ) {
      const candidate =
        await contract.getCandidate(
          Number(instId),
          Number(orgId),
          Number(postId),
          i
        );

      let alreadyVoted = false;

      if (account) {
        alreadyVoted =
          await contract.hasVotedCandidate(
            Number(instId),
            Number(orgId),
            Number(postId),
            account,
            i
          );
      }

      let voteTxHash = null;

      // ---------------------------------------------------
      // LOAD SAVED VOTE TRANSACTION HASH
      // ---------------------------------------------------

      if (alreadyVoted && user?.id) {
        try {
          const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("token");

          const voteRecordRes =
            await axios.get(
              `${API_URL}/vote-record/${user.id}/${Number(instId)}/${Number(postId)}/${i}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          if (voteRecordRes.data?.found) {
            voteTxHash =
              voteRecordRes.data.tx_hash;
          }
        } catch (voteRecordError) {
          console.log(
            "Vote transaction hash not available from backend:",
            voteRecordError
          );
        }
      }

      if (!voteTxHash && alreadyVoted && account) {
        const storageKey =
          getVoteTxStorageKey(
            account,
            Number(instId),
            Number(orgId),
            Number(postId),
            i
          );

        if (storageKey) {
          voteTxHash =
            localStorage.getItem(
              storageKey
            );
        }
      }

      temp.push({
        id: Number(candidate.id),

        wallet:
          candidate.wallet,

        name:
          String(
            candidate.name || ""
          ),

        voteCount: 0,

        exists:
          Boolean(
            candidate.exists
          ),

        alreadyVoted,
        voteTxHash,
      });
    }

    // -----------------------------------------------------
    // OPTIONAL PROFILE INFORMATION
    // -----------------------------------------------------

    let profiles = [];

    try {
      const profileRes =
        await axios.get(
          `${API_URL}/candidate-profiles/${instId}/${postId}`
        );

      profiles = Array.isArray(
        profileRes.data
      )
        ? profileRes.data
        : [];
    } catch (profileError) {
      console.log(
        "Candidate profiles not available:",
        profileError
      );

      profiles = [];
    }

    const finalCandidates =
      temp.map((candidate) => {
        const profile =
          profiles.find((p) => {
            if (
              !p.wallet_address ||
              !candidate.wallet
            ) {
              return false;
            }

            return (
              p.wallet_address.toLowerCase() ===
              candidate.wallet.toLowerCase()
            );
          });

        return {
          ...candidate,

          // Reuse the normal EVoTE user's profile picture.
          photo:
            profile?.photo || "",
        };
      });

    // -----------------------------------------------------
    // CURRENT USER VOTE COUNT
    // -----------------------------------------------------

    let countVotes = 0;

    if (account) {
      countVotes = Number(
        await contract.userVoteCount(
          Number(instId),
          Number(orgId),
          Number(postId),
          account
        )
      );
    }

    setUserVoteCount(
      countVotes
    );

    setCandidates(
      finalCandidates
    );

  } catch (err) {
    console.error(
      "Failed to load voting candidates:",
      err
    );

    setCandidates([]);

    setMessage(
      err?.message ||
        "Failed to load candidates"
    );
  }

  setLoading(false);
}

  function askForVoteConfirmation(candidate) {
        if (walletMismatch) {
      setMessage(
        "Wrong MetaMask wallet connected. Please switch to your registered wallet."
      );
      return;
    }
    if (votingCandidateId !== null) {
      return;
    }

    /*
      Extra frontend protection.

      Even if a button somehow stays active,
      do not allow confirmation when the limit
      has already been reached.
    */
    if (post && userVoteCount >= post.seatLimit) {
      setMessage(
        `Vote limit reached. You have already used ${userVoteCount}/${post.seatLimit} votes.`
      );
      return;
    }

    if (candidate.alreadyVoted) {
      setMessage(`You already voted for ${candidate.name}.`);
      return;
    }

    setConfirmCandidate(candidate);
  }

  function cancelVote() {
    if (votingCandidateId !== null) {
      return;
    }

    setConfirmCandidate(null);
  }

  async function checkVoteAfterError(candidateId, candidateName) {
    /*
      Sometimes the HTTP request can report a network error
      after the blockchain transaction was already accepted.

      We check the blockchain before telling the user
      that voting failed.
    */

    try {
      // Give the blockchain/RPC a moment to update
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const contract = await getContract();

      if (!contract || !account) {
        return false;
      }

      const alreadyVoted = await contract.hasVotedCandidate(
        Number(instId),
        Number(orgId),
        Number(postId),
        account,
        Number(candidateId)
      );

      const chainVoteCount = Number(
        await contract.userVoteCount(
          Number(instId),
          Number(orgId),
          Number(postId),
          account
        )
      );

      if (alreadyVoted) {
        /*
          The transaction actually succeeded even though
          Axios reported an error.
        */

        setCandidates((previousCandidates) =>
          previousCandidates.map((candidate) =>
            candidate.id === candidateId
              ? {
                  ...candidate,
                  alreadyVoted: true,
                }
              : candidate
          )
        );

        setUserVoteCount((previousCount) =>
          Math.max(previousCount, chainVoteCount)
        );

        if (post && chainVoteCount >= post.seatLimit) {
          setMessage(
            `Voted to ${candidateName} successfully. Vote limit reached (${chainVoteCount}/${post.seatLimit}).`
          );
        } else {
          setMessage(`Voted to ${candidateName} successfully.`);
        }

        return true;
      }

      /*
        The candidate was not voted for, but the blockchain
        says the user already reached the quota.
      */

      if (post && chainVoteCount >= post.seatLimit) {
        setUserVoteCount(chainVoteCount);

        setMessage(
          `Vote limit reached. You have already used ${chainVoteCount}/${post.seatLimit} votes.`
        );

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async function confirmVote() {
  if (!confirmCandidate) {
    return;
  }

  if (walletMismatch) {
    setConfirmCandidate(null);

    setMessage(
      "Wrong MetaMask wallet connected. Please switch to your registered wallet."
    );

    return;
  }

  const candidateId =
    Number(confirmCandidate.id);

  const candidateName =
    String(confirmCandidate.name || "");

  // -----------------------------------------------------
  // FINAL LOCAL CHECKS
  // -----------------------------------------------------

  if (
    post &&
    userVoteCount >= post.seatLimit
  ) {
    setConfirmCandidate(null);

    setMessage(
      `Vote limit reached. You have already used ${userVoteCount}/${post.seatLimit} votes.`
    );

    return;
  }

  if (confirmCandidate.alreadyVoted) {
    setConfirmCandidate(null);

    setMessage(
      `You already voted for ${candidateName}.`
    );

    return;
  }

  setConfirmCandidate(null);
  setVotingCandidateId(candidateId);

  try {
    // ---------------------------------------------------
    // 1. CHECK METAMASK
    // ---------------------------------------------------

    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed."
      );
    }

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    const signer =
      await provider.getSigner();

    const signerAddress =
      await signer.getAddress();

    // ---------------------------------------------------
    // 2. VERIFY CORRECT VOTER WALLET
    // ---------------------------------------------------

    if (
      !account ||
      signerAddress.toLowerCase() !==
        account.toLowerCase()
    ) {
      throw new Error(
        "Please switch MetaMask to your connected voter wallet."
      );
    }

    setMessage(
      "Preparing gasless vote..."
    );

    // ---------------------------------------------------
    // 3. PREPARE GASLESS VOTE
    // ---------------------------------------------------

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Login token not found. Please log in again."
      );
    }

    // ---------------------------------------------------
// 3. LOAD SESSION WALLET
// ---------------------------------------------------

const sessionPrivateKey =
  localStorage.getItem(
    "evote_session_private_key"
  );

if (!sessionPrivateKey) {
  throw new Error(
    "Voting session not found. Please register/login again."
  );
}

const sessionWallet =
  new ethers.Wallet(
    sessionPrivateKey
  );

setMessage(
  "Preparing secure vote..."
);

// ---------------------------------------------------
// 4. GET CURRENT VOTE NONCE
// ---------------------------------------------------

const nonceRes =
  await axios.get(
    `${API_URL}/vote/nonce/${signerAddress}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

const voteNonce =
  Number(nonceRes.data.nonce);

// ---------------------------------------------------
// 5. CREATE EXACT MESSAGE EXPECTED BY CONTRACT
// ---------------------------------------------------

const network =
  await provider.getNetwork();

const contract =
  await getContract();

if (!contract) {
  throw new Error(
    "Voting contract is not available."
  );
}

const contractAddress =
  await contract.getAddress();

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
      "uint256",
    ],
    [
      contractAddress,
      network.chainId,
      signerAddress,
      Number(instId),
      Number(orgId),
      Number(postId),
      Number(candidateId),
      voteNonce,
    ]
  );

// ---------------------------------------------------
// 6. SESSION WALLET SIGNS SILENTLY
//
// NO METAMASK POPUP HERE
// ---------------------------------------------------

const signature =
  await sessionWallet.signMessage(
    ethers.getBytes(messageHash)
  );

setMessage(
  "Submitting vote..."
);

// ---------------------------------------------------
// 7. BACKEND RELAYER SENDS TRANSACTION
// ---------------------------------------------------

const relayRes =
  await axios.post(
    `${API_URL}/vote/session-relay`,
    {
      voter_address:
        signerAddress,

      institution_id:
        Number(instId),

      organization_id:
        Number(orgId),

      post_id:
        Number(postId),

      candidate_id:
        Number(candidateId),

      nonce:
        voteNonce,

      signature:
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

if (txHash) {
  const storageKey =
    getVoteTxStorageKey(
      signerAddress,
      Number(instId),
      Number(orgId),
      Number(postId),
      Number(candidateId)
    );

  if (storageKey) {
    localStorage.setItem(
      storageKey,
      txHash
    );
  }
}

    // ---------------------------------------------------
    // 6. OPTIONAL DATABASE VOTE RECORD
    // ---------------------------------------------------

    if (user?.id && txHash) {
  try {
    await axios.post(
        `${API_URL}/save-vote/${user.id}`,
        {
          institution_id:
            Number(instId),

          election_id:
            Number(postId),

          candidate_id:
            Number(candidateId),

          tx_hash:
            txHash,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  } catch (saveError) {
    console.log(
      "Blockchain vote succeeded, but database vote history save failed:",
      saveError
    );
  }
}

    // ---------------------------------------------------
    // 7. UPDATE SCREEN IMMEDIATELY
    // ---------------------------------------------------

    setCandidates(
      (previousCandidates) =>
        previousCandidates.map(
          (candidate) =>
            Number(candidate.id) ===
            candidateId
              ? {
                  ...candidate,

                  alreadyVoted: true,
                  voteTxHash: txHash,
                }
              : candidate
        )
    );

    const newVoteCount =
      Number(userVoteCount) + 1;

    setUserVoteCount(
      newVoteCount
    );

    // ---------------------------------------------------
    // 8. SUCCESS MESSAGE
    // ---------------------------------------------------

    if (
      post &&
      newVoteCount >= post.seatLimit
    ) {
      setMessage(
        `Vote submitted successfully for ${candidateName}. Vote limit reached (${newVoteCount}/${post.seatLimit}).`
      );
    } else {
      setMessage(
        `Vote submitted successfully for ${candidateName}.`
      );
    }

  } catch (err) {
    console.error(
      "Gasless vote error:",
      err
    );

    const handled =
      await checkVoteAfterError(
        candidateId,
        candidateName
      );

    if (!handled) {
      setMessage(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to submit the vote. Please try again."
      );
    }

  } finally {
    setVotingCandidateId(null);
  }
}

  const now = Math.floor(Date.now() / 1000);

  const postStarted = post && now >= post.startDate;
  const postEnded = post && now > post.endDate;

  return (
    <section className="user-panel">
      <UserBreadcrumb
  items={[
    {
      label: institutionName || "Institution",
      to: `/user/vote/${instId}`,
    },
    {
      label: organizationName || "Organization",
      to: `/user/vote/${instId}/${orgId}`,
    },
    {
      label: post?.title || "Post",
    },
  ]}
/>
      <div className="section-heading row">
        <div>
          <h2>{post?.title || "Post"}</h2>

          {post && (
            <p>
              You can vote for {post.seatLimit} candidate(s). Used:{" "}
              {userVoteCount}/{post.seatLimit}
            </p>
          )}
        </div>

        <button
          className="small-btn"
          onClick={() =>
            navigate(`/user/vote/${instId}/${orgId}`)
          }
          disabled={votingCandidateId !== null}
        >
          Back
        </button>
      </div>

      <div className="candidate-grid">
        {loading ? (
          <div className="empty-box">
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <div className="empty-box">
            No candidates found.
          </div>
        ) : (
          candidates.map((c) => (
            <div className="candidate-card" key={c.id}>
              <span className="candidate-number">
                Candidate #{c.id}
              </span>

              {c.photo ? (
                <img
                  src={`${API_URL}/${c.photo}`}
                  alt={c.name}
                  className="candidate-profile-photo"
                />
              ) : (
                <div className="candidate-avatar-big">
                  {c.name?.charAt(0)}
                </div>
              )}

              <h3>{c.name}</h3>

              {!postStarted ? (
                <button
                  className="primary-action vote-btn-space"
                  disabled
                >
                  Voting Not Started
                </button>
              ) : postEnded ? (
                <button
                  className="primary-action vote-btn-space"
                  disabled
                >
                  Voting Closed
                </button>
              ) : walletMismatch ? (
  <button
    className="primary-action vote-btn-space"
    disabled
  >
    Wrong Wallet
  </button>
) : c.alreadyVoted ? (
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <button
                    className="primary-action vote-btn-space"
                    disabled
                    style={{
                      width: "100%",
                    }}
                  >
                    Already Voted
                  </button>

                  {c.voteTxHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${c.voteTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(56, 189, 248, 0.45)",
                        background: "rgba(14, 165, 233, 0.10)",
                        color: "#38bdf8",
                        textAlign: "center",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: "700",
                      }}
                    >
                      View on Sepolia ↗
                    </a>
                  )}
                </div>
              ) : post &&
                userVoteCount >= post.seatLimit ? (
                <button
                  className="primary-action vote-btn-space"
                  disabled
                >
                  Vote Limit Reached
                </button>
              ) : (
                <button
                  className="primary-action vote-btn-space"
                  onClick={() =>
                    askForVoteConfirmation(c)
                  }
                  disabled={votingCandidateId !== null}
                >
                  {votingCandidateId === c.id ? (
                    <span className="vote-loading-content">
                      <span className="vote-spinner"></span>
                      Submitting Vote...
                    </span>
                  ) : (
                    "Vote"
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {confirmCandidate && (
  <div
    className="vote-modal-overlay"
    onClick={cancelVote}
  >
    <div
      className="vote-modal-box"
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Confirm Your Vote</h3>

      <p>
        <strong>Position:</strong>{" "}
        {post?.title || "Election Position"}
      </p>

      <p>
        <strong>Candidate:</strong>{" "}
        {confirmCandidate.name}
      </p>

      <p>
        <strong>Wallet:</strong>{" "}
        {account
          ? `${account.slice(0, 6)}...${account.slice(-4)}`
          : "Not connected"}
      </p>

      <p>
        This is a gasless blockchain vote. Your vote will be submitted securely without another MetaMask confirmation.
      </p>

      <div className="vote-modal-actions">
        <button
          className="vote-modal-confirm"
          onClick={confirmVote}
          disabled={votingCandidateId !== null}
        >
          Confirm Vote
        </button>

        <button
          className="vote-modal-cancel"
          onClick={cancelVote}
          disabled={votingCandidateId !== null}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}

export default CandidateVoting;