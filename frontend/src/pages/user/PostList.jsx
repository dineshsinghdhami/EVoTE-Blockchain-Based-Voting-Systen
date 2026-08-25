import { API_URL } from "../../config";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserBreadcrumb from "./UserBreadcrumb";
import axios from "axios";
import { useVoting } from "../../context/VotingContext";

function PostList({ mode }) {
  const navigate = useNavigate();
  const { instId, orgId } = useParams();

  const {
    getContract,
    setMessage,
    account,
    user,
  } = useVoting();

  const [institutionName, setInstitutionName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState({});

  // Selected post waiting for confirmation
  const [confirmPost, setConfirmPost] = useState(null);

  useEffect(() => {
    loadPosts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, orgId, account]);

  // =====================================================
  // LOAD POSTS
  // =====================================================

  async function loadPosts() {
    setLoading(true);

    try {
      const contract = await getContract();

      if (!contract) {
        setLoading(false);
        return;
      }

      const institutionData = await contract.institutions(
        Number(instId)
      );

      setInstitutionName(institutionData.name);

      const org = await contract.getOrganization(
        Number(instId),
        Number(orgId)
      );

      // NEW Sepolia Organization struct:
      // 0 = id
      // 1 = name
      // 2 = exists
      // 3 = postCount
      setOrganizationName(org[1]);

      const count = Number(org[3]);
      const temp = [];

      for (let i = 1; i <= count; i++) {
        const p = await contract.getPost(
          Number(instId),
          Number(orgId),
          i
        );

        // NEW Sepolia Post fields.
        // We use named properties because the new contract has
        // more fields than the old Ganache version.
        temp.push({
          id: Number(p.id),
          title: p.title,
          active: p.active,

          seatLimit: Number(p.seatCount),
          maxCandidateCount: Number(p.maxCandidateCount),
          candidateCount: Number(p.candidateCount),

          minCandidateAge: Number(p.minCandidateAge),
          maxCandidateAge: Number(p.maxCandidateAge),

          candidateRegistrationStart: Number(
            p.candidateRegistrationStart
          ),

          candidateRegistrationEnd: Number(
            p.candidateRegistrationEnd
          ),

          startDate: Number(p.votingStart),
          endDate: Number(p.votingEnd),

          // Keep compatibility if the deployed contract still
          // exposes candidate request count.
          requestCount:
            p.requestCount !== undefined
              ? Number(p.requestCount)
              : 0,
        });
      }

      setPosts(temp);

      // Check request status where the deployed contract
      // exposes candidate-request records.
      const statuses = {};

      for (const post of temp) {
        statuses[post.id] =
          await checkCandidateRequestStatus(post);
      }

      setStatusMap(statuses);

      setMessage("");
    } catch (err) {
      console.error("Failed to load posts:", err);
      setMessage("Failed to load posts");
    }

    setLoading(false);
  }

  // =====================================================
  // CHECK CANDIDATE REQUEST STATUS
  // =====================================================

  async function checkCandidateRequestStatus(post) {
  try {
    if (!user?.id) {
      return "none";
    }

    const token =
  localStorage.getItem("access_token") ||
  localStorage.getItem("token");

const statusRes = await axios.get(
  `${API_URL}/candidate-request-status/${user.id}/${instId}/${orgId}/${post.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    return String(statusRes.data?.status || "none")
      .trim()
      .toLowerCase();
  } catch (err) {
    console.error(
      "Candidate request status check failed:",
      err
    );

    return "none";
  }
}

  // =====================================================
  // ACTUALLY SEND REQUEST
  // =====================================================

  async function requestCandidate(post) {
  if (!user?.id) {
    setMessage("User information is missing.");
    return;
  }

  setMessage("Submitting candidate request...");

  try {
    const token =
  localStorage.getItem("access_token") ||
  localStorage.getItem("token");

if (!token) {
  setMessage(
    "Login token not found. Please log in again."
  );
  return;
}

const res = await axios.post(
  `${API_URL}/request-candidate/${user.id}`,
  {
    institution_id: Number(instId),
    organization_id: Number(orgId),
    election_id: Number(post.id),
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    setStatusMap((prev) => ({
      ...prev,
      [post.id]: "pending",
    }));

    setConfirmPost(null);

    setMessage(
      res.data.message ||
        "Candidate request submitted successfully."
    );
  } catch (err) {
    console.error(
      "Candidate request failed:",
      err
    );

    setMessage(
      err?.response?.data?.detail ||
        err?.message ||
        "Failed to submit candidate request"
    );
  }
}

  // =====================================================
  // REQUEST BUTTON CLICK
  // =====================================================

  async function handleRequestClick(post) {
  const userAge = calculateUserAge();

  if (userAge === null) {
    setMessage(
      "Your date of birth is not available. Please refresh or update your profile."
    );
    return;
  }

  if (
    userAge < post.minCandidateAge ||
    userAge > post.maxCandidateAge
  ) {
    setMessage(
      `Age restriction: You are ${userAge} years old. ` +
      `This election only accepts candidates aged ` +
      `${post.minCandidateAge} to ${post.maxCandidateAge}. ` +
      `You are not eligible to become a candidate for this post.`
    );

    setConfirmPost(null);
    return;
  }

  const status =
    statusMap[post.id] ||
    (await checkCandidateRequestStatus(post));

  setStatusMap((prev) => ({
    ...prev,
    [post.id]: status,
  }));

  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "registered"
  ) {
    return;
  }

  setConfirmPost(post);
}

  // =====================================================
  // TIME HELPERS
  // =====================================================

  const now = Math.floor(Date.now() / 1000);

  function getCandidateRegistrationState(post) {
    if (
      post.candidateRegistrationStart > 0 &&
      now < post.candidateRegistrationStart
    ) {
      return "not-started";
    }

    if (
      post.candidateRegistrationEnd > 0 &&
      now > post.candidateRegistrationEnd
    ) {
      return "closed";
    }

    if (
      post.maxCandidateCount > 0 &&
      post.candidateCount >= post.maxCandidateCount
    ) {
      return "full";
    }

    return "open";
  }

  function getVotingState(post) {
    if (now < post.startDate) {
      return "upcoming";
    }

    if (now > post.endDate) {
      return "ended";
    }

    return "active";
  }

  function formatDate(timestamp) {
    if (!timestamp) return "-";

    return new Date(
      Number(timestamp) * 1000
    ).toLocaleString();
  }

  function calculateUserAge() {
  if (!user?.date_of_birth) {
    return null;
  }

  const birthDate = new Date(
    user.date_of_birth
  );

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
}

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="user-panel">
      <style>{`
        .candidate-request-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        .candidate-request-modal {
          width: 100%;
          max-width: 410px;
          padding: 22px;
          border-radius: 14px;
          border: 1px solid #475569;
          background: #202020;
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.58);
          animation: candidateRequestModalIn 0.18s ease-out;
        }

        .candidate-request-modal h3 {
          margin: 0 0 10px;
          color: #f8fafc;
          font-size: 18px;
          font-weight: 800;
        }

        .candidate-request-modal p {
          margin: 0;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
        }

        .candidate-request-modal p + p {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 12px;
        }

        .candidate-request-modal-name {
          color: #ffffff;
          font-weight: 800;
        }

        .candidate-request-modal-post {
          color: #22d3ee;
          font-weight: 800;
        }

        .candidate-request-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .candidate-request-modal-cancel,
        .candidate-request-modal-confirm {
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .candidate-request-modal-cancel {
          border: 1px solid #475569;
          background: #2d2d2d;
          color: #f8fafc;
        }

        .candidate-request-modal-confirm {
          border: none;
          background: #1688a5;
          color: #ffffff;
        }

        .candidate-request-modal-confirm:hover {
          background: #1b97b6;
        }

        .candidate-request-modal-cancel:hover {
          background: #343434;
        }

        @keyframes candidateRequestModalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 520px) {
          .candidate-request-modal {
            max-width: none;
            padding: 18px;
          }

          .candidate-request-modal-actions {
            flex-direction: column-reverse;
          }

          .candidate-request-modal-cancel,
          .candidate-request-modal-confirm {
            width: 100%;
          }
        }
      `}</style>
      <UserBreadcrumb
        items={[
          {
            label:
              institutionName || "Institution",
            to: `/user/${mode}/${instId}`,
          },
          {
            label:
              organizationName || "Organization",
          },
        ]}
      />

      <div className="section-heading row">
        <div>
          <h2>
            {organizationName || "Organization"}
          </h2>

          <p>
            {mode === "vote"
              ? "Select a post to view candidates."
              : mode === "results"
              ? "Select a post and check the result graph."
              : "Select a post and send your candidate request."}
          </p>
        </div>

        <button
          className="small-btn"
          onClick={() =>
            navigate(
              `/user/${mode}/${instId}`
            )
          }
        >
          Back
        </button>
      </div>

      <div className="election-list">
        {loading ? (
          <div className="empty-box">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-box">
            No posts found.
          </div>
        ) : mode === "vote" ? (
          // =============================================
          // VOTE MODE
          // =============================================
          posts.map((post) => {
            const votingState =
              getVotingState(post);

            return (
              <button
                key={post.id}
                className="election-card"
                disabled={
                  votingState !== "active"
                }
                onClick={() =>
                  navigate(
                    `/user/vote/${instId}/${orgId}/${post.id}`
                  )
                }
              >
                <div className="election-card-row">
                  <div>
                    <h3>{post.title}</h3>

                    <p>
                      {post.candidateCount} /{" "}
                      {post.maxCandidateCount} candidates
                    </p>

                    <p>
                      Vote limit / seats:{" "}
                      {post.seatLimit}
                    </p>
                  </div>

                  <div className="election-card-meta">
                    <span
                      className={
                        votingState === "active"
                          ? "status-badge active"
                          : "status-badge closed"
                      }
                    >
                      {votingState === "active"
                        ? "Active"
                        : votingState ===
                          "upcoming"
                        ? "Upcoming"
                        : "Ended"}
                    </span>

                    <p className="election-card-date">
                      Start:{" "}
                      {formatDate(
                        post.startDate
                      )}
                    </p>

                    <p className="election-card-date">
                      End:{" "}
                      {formatDate(
                        post.endDate
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        ) : mode === "results" ? (
          // =============================================
          // RESULTS MODE
          // =============================================
          posts.map((post) => {
            const votingState =
              getVotingState(post);

            return (
              <div
                className="request-election-card"
                key={post.id}
              >
                <div>
                  <h3>{post.title}</h3>

                  <p>
                    {post.candidateCount} candidates
                  </p>

                  <p>
                    Voting End:{" "}
                    {formatDate(post.endDate)}
                  </p>
                </div>

                <button
                  className="primary-action"
                  disabled={
                    votingState !== "ended"
                  }
                  onClick={() =>
                    navigate(
                      `/user/results/${instId}/${orgId}/${post.id}`
                    )
                  }
                >
                  {votingState === "ended"
                    ? "Check Result"
                    : "Result After Voting Ends"}
                </button>
              </div>
            );
          })
        ) : (
          // =============================================
          // REQUEST CANDIDATE MODE
          // Keep original:
          // User Request -> Admin Approve/Reject
          // =============================================
          posts.map((post) => {
            const registrationState =
              getCandidateRegistrationState(
                post
              );

            return (
              <div key={post.id}>
                <div className="request-election-card">
                  <div>
                    <h3>{post.title}</h3>

                    <p>
                      Candidates:{" "}
                      {post.candidateCount} /{" "}
                      {post.maxCandidateCount}
                    </p>

                    <p>
                      Seat Limit:{" "}
                      {post.seatLimit}
                    </p>

                    <p>
                      Candidate Age:{" "}
                      {post.minCandidateAge} -{" "}
                      {post.maxCandidateAge}
                    </p>

                    <p>
                      Registration Start:{" "}
                      {formatDate(
                        post.candidateRegistrationStart
                      )}
                    </p>

                    <p>
                      Registration End:{" "}
                      {formatDate(
                        post.candidateRegistrationEnd
                      )}
                    </p>
                  </div>

                  {/* BUTTON / STATUS */}

                  {registrationState ===
                  "not-started" ? (
                    <button
                      className="primary-action"
                      disabled
                    >
                      Registration Not Started
                    </button>
                  ) : registrationState ===
                    "closed" ? (
                    <button
                      className="primary-action"
                      disabled
                    >
                      Candidate Registration Closed
                    </button>
                  ) : registrationState ===
                    "full" ? (
                    <button
                      className="primary-action"
                      disabled
                    >
                      Candidate Limit Reached
                    </button>
                  ) : statusMap[post.id] ===
  "registered" ? (
  <button
    className="primary-action"
    disabled
  >
    ✓ You Are a Candidate
  </button>
) : statusMap[post.id] ===
  "approved" ? (
  <button
    className="primary-action"
    onClick={() =>
      navigate(
        `/user/complete-candidate/${instId}/${orgId}/${post.id}`
      )
    }
  >
    Complete Candidate Registration
  </button>
) : statusMap[post.id] ===
  "pending" ? (
                    <button
                      className="primary-action"
                      disabled
                    >
                      Request Already Sent
                    </button>
                  ) : statusMap[post.id] ===
                    "rejected" ? (
                    <button
                      className="primary-action"
                      disabled
                    >
                      Request Rejected
                    </button>
                  ) : (
                    <button
                      className="primary-action"
                      onClick={() =>
                        handleRequestClick(
                          post
                        )
                      }
                    >
                      Request Candidate
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================
          CANDIDATE REQUEST CONFIRMATION POPUP
      ===================================================== */}

      {confirmPost && (
        <div
          className="candidate-request-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmPost(null);
            }
          }}
        >
          <div
            className="candidate-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-request-modal-title"
          >
            <h3 id="candidate-request-modal-title">
              Confirm Candidate Request
            </h3>

            <p>
              Do you want to request candidate registration as{" "}
              <span className="candidate-request-modal-name">
                "{user?.full_name || "Candidate"}"
              </span>{" "}
              for{" "}
              <span className="candidate-request-modal-post">
                {confirmPost.title}
              </span>
              ?
            </p>

            <p>
              Your request will be reviewed by the admin before you can
              complete candidate registration.
            </p>

            <div className="candidate-request-modal-actions">
              <button
                type="button"
                className="candidate-request-modal-cancel"
                onClick={() => setConfirmPost(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="candidate-request-modal-confirm"
                onClick={() => requestCandidate(confirmPost)}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PostList;