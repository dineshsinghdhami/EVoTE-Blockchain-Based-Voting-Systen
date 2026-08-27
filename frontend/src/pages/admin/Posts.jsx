import { useState } from "react";
import {
  FiExternalLink,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";


// ============================================================
// TRANSACTION HASH HELPERS
// ============================================================

function normalizeTxHash(txHash) {
  if (!txHash) {
    return "";
  }

  const hash =
    String(txHash).trim();

  if (hash.startsWith("0x")) {
    return hash;
  }

  return `0x${hash}`;
}


function shortTxHash(txHash) {
  const hash =
    normalizeTxHash(txHash);

  if (!hash) {
    return "N/A";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}


// ============================================================
// POST LOADING SKELETON
// ============================================================

function PostLoadingCard() {
  return (
    <div style={postLoadingCardStyle}>
      <div
        className="post-page-skeleton"
        style={postLoadingTitleStyle}
      />

      <div style={postLoadingGridStyle}>
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item}>
            <div
              className="post-page-skeleton"
              style={postLoadingLabelStyle}
            />

            <div
              className="post-page-skeleton"
              style={{
                ...postLoadingValueStyle,
                width:
                  item === 1
                    ? "55%"
                    : item === 2
                    ? "70%"
                    : item === 3
                    ? "62%"
                    : "88%",
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="post-page-skeleton"
        style={postLoadingLinkStyle}
      />
    </div>
  );
}


// ============================================================
// POSTS PAGE
// ============================================================

function Posts() {
  const {
    selectedInstitutionId,
    selectedOrganizationId,

    institutions,
    organizations,

    posts,
    postsLoading,

    postTitle,
    setPostTitle,

    seatLimit,
    setSeatLimit,

    maxCandidateCount,
    setMaxCandidateCount,

    minCandidateAge,
    setMinCandidateAge,

    maxCandidateAge,
    setMaxCandidateAge,

    candidateRegistrationStart,
    setCandidateRegistrationStart,

    candidateRegistrationEnd,
    setCandidateRegistrationEnd,

    postStartDate,
    setPostStartDate,

    postEndDate,
    setPostEndDate,

    createPost,
    loadPosts,

    transactions,

    isSyncing,
    message,

    confirmBox,
    closeConfirm,
  } = useAdmin();


  // ==========================================================
  // LOCAL UI STATE
  // ==========================================================

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    successResult,
    setSuccessResult,
  ] = useState(null);


  // ==========================================================
  // SELECTED CONTEXT
  // ==========================================================

  const selectedInstitution =
    institutions.find(
      (item) =>
        Number(item.id) ===
        Number(selectedInstitutionId)
    );

  const selectedOrganization =
    organizations.find(
      (item) =>
        Number(item.id) ===
        Number(selectedOrganizationId)
    );


  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate =
    (timestamp) => {
      if (!timestamp) {
        return "-";
      }

      return new Date(
        Number(timestamp) * 1000
      ).toLocaleString();
    };


  // ==========================================================
  // CREATE POST
  // ==========================================================

  const handleCreatePost =
    async () => {
      setFormError("");

      // Keep validation inside this form instead of
      // showing simple form mistakes in the global banner.
      if (!postTitle.trim()) {
        setFormError(
          "Please enter election/post title."
        );
        return;
      }

      if (
        !seatLimit ||
        Number(seatLimit) <= 0
      ) {
        setFormError(
          "Please enter a valid number of seats."
        );
        return;
      }

      if (
        !maxCandidateCount ||
        Number(maxCandidateCount) <
          Number(seatLimit)
      ) {
        setFormError(
          "Maximum candidates must be equal to or greater than the number of seats."
        );
        return;
      }

      if (
        !minCandidateAge ||
        !maxCandidateAge
      ) {
        setFormError(
          "Please enter both minimum and maximum candidate age."
        );
        return;
      }

      if (
        Number(maxCandidateAge) <
        Number(minCandidateAge)
      ) {
        setFormError(
          "Maximum candidate age must be greater than or equal to minimum candidate age."
        );
        return;
      }

      if (
        !candidateRegistrationStart ||
        !candidateRegistrationEnd
      ) {
        setFormError(
          "Please select candidate registration start and end time."
        );
        return;
      }

      if (
        !postStartDate ||
        !postEndDate
      ) {
        setFormError(
          "Please select voting start and end time."
        );
        return;
      }

      const candidateStart =
        new Date(
          candidateRegistrationStart
        ).getTime();

      const candidateEnd =
        new Date(
          candidateRegistrationEnd
        ).getTime();

      const votingStart =
        new Date(
          postStartDate
        ).getTime();

      const votingEnd =
        new Date(
          postEndDate
        ).getTime();

      if (
        candidateEnd <=
        candidateStart
      ) {
        setFormError(
          "Candidate registration end must be after its start."
        );
        return;
      }

      if (
        votingStart <=
        candidateEnd
      ) {
        setFormError(
          "Voting must start after candidate registration ends."
        );
        return;
      }

      if (
        votingEnd <=
        votingStart
      ) {
        setFormError(
          "Voting end must be after voting start."
        );
        return;
      }

      const result =
        await createPost();

      if (result?.success) {
        setFormError("");

        setSuccessResult({
          title:
            result.title,

          institutionName:
            result.institutionName,

          organizationName:
            result.organizationName,

          txHash:
            result.txHash,
        });
      } else if (
        result?.error
      ) {
        setFormError(
          result.error
        );
      }
    };


  // ==========================================================
  // CLEAR FORM ERROR WHEN USER EDITS
  // ==========================================================

  const clearError =
    () => {
      if (formError) {
        setFormError("");
      }
    };


  // ==========================================================
  // REFRESH POSTS
  // ==========================================================

  const handleRefreshPosts =
    async () => {
      try {
        setIsRefreshing(true);

        await loadPosts(
          selectedInstitutionId,
          selectedOrganizationId
        );
      } finally {
        setIsRefreshing(false);
      }
    };


  // ==========================================================
  // FIND CREATE-POST TRANSACTION
  // ==========================================================

  const getPostTransaction =
    (title) => {
      if (!title) {
        return null;
      }

      const targetTitle =
        String(title)
          .trim()
          .toLowerCase();

      const institutionName =
        String(
          selectedInstitution?.name || ""
        )
          .trim()
          .toLowerCase();

      const organizationName =
        String(
          selectedOrganization?.name || ""
        )
          .trim()
          .toLowerCase();

      return transactions.find(
        (tx) => {
          const action =
            String(
              tx.action || ""
            )
              .trim()
              .toLowerCase();

          const isCreatePost =
            action.includes(
              "create election"
            ) ||
            action.includes(
              "create post"
            );

          if (
            !isCreatePost ||
            !action.includes(
              targetTitle
            ) ||
            !tx.tx_hash
          ) {
            return false;
          }

          // When the action contains context, make the
          // match more specific.
          if (
            institutionName &&
            action.includes(
              institutionName
            ) &&
            organizationName &&
            action.includes(
              organizationName
            )
          ) {
            return true;
          }

          return true;
        }
      );
    };


  // ==========================================================
  // SUCCESS ETHERSCAN
  // ==========================================================

  const normalizedHash =
    successResult?.txHash
      ? normalizeTxHash(
          successResult.txHash
        )
      : "";

  const etherscanUrl =
    normalizedHash
      ? `https://sepolia.etherscan.io/tx/${normalizedHash}`
      : "";


  // ==========================================================
  // REQUIRE INSTITUTION + ORGANIZATION
  // ==========================================================

  if (
    !selectedInstitutionId ||
    !selectedOrganizationId
  ) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>
          Election Posts
        </h2>

        <p style={mutedStyle}>
          Select an institution and organization from the selector above first.
        </p>
      </section>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        paddingBottom: "30px",
      }}
    >
      <style>
        {`
          .post-page-skeleton {
            position: relative;
            overflow: hidden;
            background: #303030;
            border-radius: 5px;
          }

          .post-page-skeleton::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.05),
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.05),
              transparent
            );
            animation: postPageSkeletonShimmer 1.25s infinite;
          }

          @keyframes postPageSkeletonShimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
      <section style={panelStyle}>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <h2 style={titleStyle}>
            Election Posts
          </h2>

          <p style={mutedStyle}>
            Create election posts with seat limits, candidate limits,
            age eligibility, candidate registration period, and voting period.
          </p>
        </div>


        {/* ===================================================
            CURRENT SELECTION
        =================================================== */}

        <div style={contextBoxStyle}>

          <div>
            <span style={smallLabelStyle}>
              Institution
            </span>

            <strong
              style={
                contextValueStyle
              }
            >
              {selectedInstitution?.name ||
                `Institution ${selectedInstitutionId}`}
            </strong>
          </div>

          <div
            style={
              contextArrowStyle
            }
          >
            →
          </div>

          <div>
            <span style={smallLabelStyle}>
              Organization
            </span>

            <strong
              style={
                contextValueStyle
              }
            >
              {selectedOrganization?.name ||
                `Organization ${selectedOrganizationId}`}
            </strong>
          </div>

        </div>


        {/* ===================================================
            CREATE FORM
        =================================================== */}

        <div style={formCardStyle}>

          <h3
            style={
              sectionTitleStyle
            }
          >
            Create New Election Post
          </h3>


          <div style={gridStyle}>

            {/* TITLE */}

            <Field
              label="Post / Election Title"
            >
              <input
                type="text"
                placeholder="Example: President"
                value={postTitle}
                onChange={(e) => {
                  setPostTitle(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* SEATS */}

            <Field
              label="Number of Seats"
            >
              <input
                type="number"
                min="1"
                placeholder="Example: 1"
                value={seatLimit}
                onChange={(e) => {
                  setSeatLimit(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />

              <small
                style={helpStyle}
              >
                Example: President = 1, Committee Member = 3
              </small>
            </Field>


            {/* MAX CANDIDATES */}

            <Field
              label="Maximum Candidates"
            >
              <input
                type="number"
                min="1"
                placeholder="Example: 5"
                value={
                  maxCandidateCount
                }
                onChange={(e) => {
                  setMaxCandidateCount(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />

              <small
                style={helpStyle}
              >
                Candidate registration closes automatically at this limit.
              </small>
            </Field>


            {/* MIN AGE */}

            <Field
              label="Minimum Candidate Age"
            >
              <input
                type="number"
                min="1"
                placeholder="Example: 18"
                value={
                  minCandidateAge
                }
                onChange={(e) => {
                  setMinCandidateAge(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* MAX AGE */}

            <Field
              label="Maximum Candidate Age"
            >
              <input
                type="number"
                min="1"
                placeholder="Example: 35"
                value={
                  maxCandidateAge
                }
                onChange={(e) => {
                  setMaxCandidateAge(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* REGISTRATION START */}

            <Field
              label="Candidate Registration Start"
            >
              <input
                type="datetime-local"
                value={
                  candidateRegistrationStart
                }
                onChange={(e) => {
                  setCandidateRegistrationStart(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* REGISTRATION END */}

            <Field
              label="Candidate Registration End"
            >
              <input
                type="datetime-local"
                value={
                  candidateRegistrationEnd
                }
                onChange={(e) => {
                  setCandidateRegistrationEnd(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* VOTING START */}

            <Field
              label="Voting Start"
            >
              <input
                type="datetime-local"
                value={
                  postStartDate
                }
                onChange={(e) => {
                  setPostStartDate(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>


            {/* VOTING END */}

            <Field
              label="Voting End"
            >
              <input
                type="datetime-local"
                value={
                  postEndDate
                }
                onChange={(e) => {
                  setPostEndDate(
                    e.target.value
                  );
                  clearError();
                }}
                disabled={isSyncing}
                style={inputStyle}
              />
            </Field>

          </div>


          {/* LOCAL VALIDATION */}

          {formError && (
            <div
              style={
                formErrorStyle
              }
            >
              {formError}
            </div>
          )}


          {/* CREATE BUTTON */}

          <button
            type="button"
            onClick={
              handleCreatePost
            }
            disabled={
              isSyncing
            }
            style={{
              ...primaryButtonStyle,

              opacity:
                isSyncing
                  ? 0.65
                  : 1,

              cursor:
                isSyncing
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSyncing
  ? "Creating..."
  : "Create Election Post"}
          </button>

        </div>


        {/* ===================================================
            EXISTING POSTS
        =================================================== */}

        <div style={formCardStyle}>

          <div
            style={
              headerRowStyle
            }
          >
            <h3
              style={
                sectionTitleStyle
              }
            >
              Existing Election Posts
            </h3>

            <button
              type="button"
              onClick={
                handleRefreshPosts
              }
              disabled={
                isRefreshing ||
                isSyncing ||
                postsLoading
              }
              style={{
                ...secondaryButtonStyle,

                opacity:
                  isRefreshing ||
                  isSyncing ||
                  postsLoading
                    ? 0.65
                    : 1,

                cursor:
                  isRefreshing ||
                  isSyncing ||
                  postsLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isRefreshing
                ? "Refreshing Posts..."
                : postsLoading
                ? "Loading Posts..."
                : "Refresh Posts"}
            </button>

          </div>


          {postsLoading ||
          isRefreshing ? (

            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {[1, 2, 3].map(
                (item) => (
                  <PostLoadingCard
                    key={item}
                  />
                )
              )}
            </div>

          ) : posts.length === 0 ? (

            <div
              style={
                emptyStyle
              }
            >
              No election posts found.
            </div>

          ) : (

            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {posts.map(
                (post) => {
                  const tx =
                    getPostTransaction(
                      post.title
                    );

                  const txHash =
                    normalizeTxHash(
                      tx?.tx_hash
                    );

                  const postEtherscanUrl =
                    txHash
                      ? `https://sepolia.etherscan.io/tx/${txHash}`
                      : "";

                  return (
                    <div
                      key={post.id}
                      style={
                        postCardStyle
                      }
                    >
                      <div>

                        <div
                          style={
                            postTitleStyle
                          }
                        >
                          {post.id}.{" "}
                          {post.title}
                        </div>


                        <div
                          style={
                            infoGridStyle
                          }
                        >
                          <Info
                            label="Seats"
                            value={
                              post.seatLimit
                            }
                          />

                          <Info
                            label="Candidates"
                            value={`${post.candidateCount} / ${post.maxCandidateCount}`}
                          />

                          <Info
                            label="Candidate Age"
                            value={`${post.minCandidateAge} - ${post.maxCandidateAge}`}
                          />

                          <Info
                            label="Registration"
                            value={`${formatDate(
                              post.candidateRegistrationStart
                            )} → ${formatDate(
                              post.candidateRegistrationEnd
                            )}`}
                          />

                          <Info
                            label="Voting"
                            value={`${formatDate(
                              post.startDate
                            )} → ${formatDate(
                              post.endDate
                            )}`}
                          />
                        </div>


                        {postEtherscanUrl && (
                          <a
                            href={
                              postEtherscanUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={
                              postEtherscanLinkStyle
                            }
                          >
                            <FiExternalLink />

                            View on Sepolia Etherscan
                          </a>
                        )}

                      </div>
                    </div>
                  );
                }
              )}
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          CONFIRM POPUP
      ===================================================== */}

      {confirmBox &&
        confirmBox.title ===
          "Create Post" && (

        <div style={overlayStyle}>

          <div
            style={
              confirmModalStyle
            }
          >
            <h3
              style={{
                margin:
                  "0 0 10px",

                color:
                  "#f8fafc",
              }}
            >
              Confirm Election Post
            </h3>

            <p
              style={{
                color:
                  "#cbd5e1",

                lineHeight:
                  "1.55",

                marginBottom:
                  "18px",

                fontSize:
                  "14px",
              }}
            >
              {confirmBox.message}
            </p>

            <div
              style={
                modalActionsStyle
              }
            >
              <button
                type="button"
                onClick={() =>
                  closeConfirm(
                    false
                  )
                }
                style={
                  cancelButtonStyle
                }
              >
                Cancel
              </button>

              <button
  type="button"
  autoFocus

  onClick={() =>
    closeConfirm(
      true
    )
  }

  style={
    confirmButtonStyle
  }
>
  {confirmBox.confirmText ||
    "Create"}
</button>
            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          SMALL SUCCESS POPUP
      ===================================================== */}

      {successResult && (

        <div style={overlayStyle}>

          <div
            style={
              successModalStyle
            }
          >

            <button
              type="button"
              onClick={() =>
                setSuccessResult(
                  null
                )
              }
              style={
                closeButtonStyle
              }
              aria-label="Close"
            >
              <FiX />
            </button>


            <div
              style={
                successIconStyle
              }
            >
              <FiCheckCircle />
            </div>


            <h2
              style={{
                margin:
                  "0 0 5px",

                color:
                  "#f8fafc",

                textAlign:
                  "center",

                fontSize:
                  "17px",
              }}
            >
              Election Post Created Successfully
            </h2>


            <p
              style={{
                textAlign:
                  "center",

                color:
                  "#94a3b8",

                fontSize:
                  "11px",

                lineHeight:
                  "1.45",

                margin:
                  "0 0 13px",
              }}
            >
              Confirmed on Ethereum Sepolia.
            </p>


            <ResultRow
              label="Election"
              value={
                successResult.title
              }
            />

            <ResultRow
              label="Institution"
              value={
                successResult.institutionName ||
                "N/A"
              }
            />

            <ResultRow
              label="Organization"
              value={
                successResult.organizationName ||
                "N/A"
              }
            />

            <ResultRow
              label="Network"
              value="Ethereum Sepolia"
              valueColor="#38bdf8"
            />

            <ResultRow
              label="Tx Hash"
              value={
                shortTxHash(
                  successResult.txHash
                )
              }
              title={
                normalizedHash
              }
              valueColor="#22c55e"
              mono
            />


            {etherscanUrl && (
              <a
                href={
                  etherscanUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                style={
                  etherscanButtonStyle
                }
              >
                <FiExternalLink />

                View on Sepolia Etherscan
              </a>
            )}


            <button
  type="button"
  autoFocus

  onClick={() =>
    setSuccessResult(
      null
    )
  }

  style={
    doneButtonStyle
  }
>
  Done
</button>

          </div>

        </div>
      )}

    </div>
  );
}


// ============================================================
// SMALL COMPONENTS
// ============================================================

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>

      {children}
    </div>
  );
}


function Info({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={
          smallLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          color:
            "#e2e8f0",

          fontSize:
            "13px",

          lineHeight:
            "1.5",

          wordBreak:
            "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}


function ResultRow({
  label,
  value,
  title,
  valueColor = "#ffffff",
  mono = false,
}) {
  return (
    <div
      style={
        resultInfoBoxStyle
      }
    >
      <span
        style={
          resultLabelStyle
        }
      >
        {label}
      </span>

      <strong
        title={title}
        style={{
          color:
            valueColor,

          fontSize:
            "11px",

          fontFamily:
            mono
              ? "monospace"
              : "inherit",

          textAlign:
            "right",

          wordBreak:
            "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const panelStyle = {
  background: "#1f1f1f",
  border: "1px solid #343434",
  borderRadius: "14px",
  padding: "22px",
  color: "#f8fafc",
};


const titleStyle = {
  margin: "0 0 8px",
  fontSize: "30px",
  fontWeight: "800",
  color: "#f8fafc",
};


const mutedStyle = {
  margin: 0,
  color: "#94a3b8",
  lineHeight: "1.6",
};


const contextBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  padding: "16px",
  marginBottom: "20px",
  borderRadius: "10px",
  border: "1px solid #343434",
  background: "#242424",
};


const contextArrowStyle = {
  color: "#22d3ee",
  fontWeight: "800",
};


const contextValueStyle = {
  display: "block",
  marginTop: "4px",
  color: "#f8fafc",
};


const formCardStyle = {
  background: "#242424",
  border: "1px solid #363636",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "18px",
};


const sectionTitleStyle = {
  margin: "0 0 18px",
  color: "#f8fafc",
  fontSize: "20px",
};


const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};


const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#e2e8f0",
};


const smallLabelStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};


const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  border: "1px solid #475569",
  borderRadius: "8px",
  background: "#171717",
  color: "#f8fafc",
  outline: "none",
  colorScheme: "dark",
};


const helpStyle = {
  display: "block",
  marginTop: "6px",
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "1.4",
};


const formErrorStyle = {
  marginTop: "16px",
  marginBottom: "-5px",

  padding: "10px 12px",

  borderRadius: "8px",

  border:
    "1px solid rgba(248,113,113,0.35)",

  background:
    "rgba(239,68,68,0.10)",

  color:
    "#fca5a5",

  fontSize: "13px",
  fontWeight: "600",
};


const primaryButtonStyle = {
  marginTop: "22px",
  minWidth: "210px",
  padding: "12px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#1688a5",
  color: "#ffffff",
  fontWeight: "800",
};


const secondaryButtonStyle = {
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #475569",
  background: "#2a2a2a",
  color: "#f8fafc",
  fontWeight: "700",
};


const headerRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  flexWrap: "wrap",
};


const emptyStyle = {
  padding: "26px",
  border: "1px dashed #475569",
  borderRadius: "9px",
  color: "#94a3b8",
};


const postCardStyle = {
  padding: "18px",
  border: "1px solid #3b3b3b",
  borderRadius: "10px",
  background: "#1b1b1b",
};


const postTitleStyle = {
  fontSize: "17px",
  fontWeight: "800",
  color: "#f8fafc",
  marginBottom: "14px",
};


const infoGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
};


const postEtherscanLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",

  marginTop: "15px",

  color: "#38bdf8",

  fontSize: "12px",
  fontWeight: "700",

  textDecoration: "none",
};


// ============================================================
// POST LOADING STYLES
// ============================================================

const postLoadingCardStyle = {
  padding: "18px",
  border: "1px solid #3b3b3b",
  borderRadius: "10px",
  background: "#1b1b1b",
};

const postLoadingTitleStyle = {
  width: "180px",
  maxWidth: "55%",
  height: "17px",
  marginBottom: "18px",
};

const postLoadingGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
};

const postLoadingLabelStyle = {
  width: "72px",
  height: "8px",
  marginBottom: "8px",
};

const postLoadingValueStyle = {
  height: "11px",
};

const postLoadingLinkStyle = {
  width: "165px",
  height: "10px",
  marginTop: "17px",
};


// ============================================================
// MODALS
// ============================================================

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  padding: "20px",

  background:
    "rgba(0,0,0,0.72)",

  backdropFilter:
    "blur(3px)",
};


const confirmModalStyle = {
  width: "100%",
  maxWidth: "390px",

  padding: "20px",

  borderRadius: "12px",

  border:
    "1px solid #475569",

  background:
    "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.55)",
};


const successModalStyle = {
  position: "relative",

  width: "100%",
  maxWidth: "360px",

  padding: "18px",

  borderRadius: "14px",

  border:
    "1px solid rgba(34,197,94,0.30)",

  background:
    "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.58)",
};


const closeButtonStyle = {
  position: "absolute",

  top: "9px",
  right: "9px",

  width: "28px",
  height: "28px",

  borderRadius: "50%",

  border:
    "1px solid rgba(255,255,255,0.12)",

  background:
    "rgba(255,255,255,0.06)",

  color:
    "#cbd5e1",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  cursor: "pointer",

  fontSize: "14px",
};


const successIconStyle = {
  width: "44px",
  height: "44px",

  margin:
    "0 auto 10px",

  borderRadius: "50%",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background:
    "rgba(34,197,94,0.13)",

  border:
    "1px solid rgba(34,197,94,0.35)",

  color:
    "#22c55e",

  fontSize: "22px",
};


const resultInfoBoxStyle = {
  display: "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",

  gap: "10px",

  padding: "8px 10px",

  marginBottom: "7px",

  background:
    "rgba(255,255,255,0.035)",

  border:
    "1px solid rgba(255,255,255,0.08)",

  borderRadius: "8px",
};


const resultLabelStyle = {
  color: "#94a3b8",

  fontSize: "10px",

  textTransform:
    "uppercase",

  letterSpacing:
    "0.5px",
};


const etherscanButtonStyle = {
  width: "100%",
  boxSizing: "border-box",

  marginTop: "11px",

  padding: "9px 12px",

  display: "flex",

  justifyContent:
    "center",

  alignItems:
    "center",

  gap: "7px",

  borderRadius: "8px",

  border:
    "1px solid rgba(56,189,248,0.35)",

  background:
    "rgba(56,189,248,0.10)",

  color: "#38bdf8",

  fontWeight: "700",
  fontSize: "12px",

  textDecoration: "none",
};


const doneButtonStyle = {
  width: "100%",

  marginTop: "7px",

  padding: "9px 12px",

  border: "none",

  borderRadius: "8px",

  background: "#1688a5",

  color: "#ffffff",

  fontWeight: "800",
  fontSize: "12px",

  cursor: "pointer",
};


const modalActionsStyle = {
  display: "flex",

  justifyContent:
    "flex-end",

  gap: "9px",
};


const cancelButtonStyle = {
  padding: "9px 14px",

  borderRadius: "8px",

  border:
    "1px solid #475569",

  background:
    "#2d2d2d",

  color: "#f8fafc",

  fontWeight: "700",

  cursor: "pointer",
};


const confirmButtonStyle = {
  padding: "9px 14px",

  borderRadius: "8px",

  border: "none",

  background: "#1688a5",

  color: "#ffffff",

  fontWeight: "800",

  cursor: "pointer",
};


export default Posts;