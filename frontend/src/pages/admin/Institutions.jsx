import { useEffect, useState } from "react";
import {
  FiFilter,
  FiExternalLink,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";

import { useAdmin } from "../../context/AdminContext";

// ============================================================
// NORMALIZE ETHEREUM TRANSACTION HASH
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


// ============================================================
// SHORTEN TRANSACTION HASH
// ============================================================

function shortTxHash(txHash) {
  const hash =
    normalizeTxHash(txHash);

  if (!hash) {
    return "N/A";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}


// ============================================================
// INSTITUTIONS PAGE
// ============================================================

function Institutions() {
  const {
    institutionName,
    setInstitutionName,

    createInstitution,

    institutions,
    institutionsLoading,
    loadInstitutions,
    transactions,

    isSyncing,
    message,

    confirmBox,
    closeConfirm,
  } = useAdmin();


  const [sortOrder, setSortOrder] =
    useState("all");

  const [showFilter, setShowFilter] =
    useState(false);

  const [
    successResult,
    setSuccessResult,
  ] = useState(null);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  // ==========================================================
  // KEYBOARD SUPPORT FOR CONFIRMATION MODAL
  // Enter = Create, Escape = Cancel
  // ==========================================================

  useEffect(() => {
    if (
      !confirmBox ||
      confirmBox.title !==
        "Create Institution"
    ) {
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeConfirm(true);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        closeConfirm(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [confirmBox, closeConfirm]);


  // ==========================================================
  // SORT INSTITUTIONS
  // ==========================================================

  const sortedInstitutions = [
    ...institutions,
  ].sort((a, b) => {
    if (sortOrder === "newest") {
      return (
        Number(b.id) -
        Number(a.id)
      );
    }

    if (sortOrder === "oldest") {
      return (
        Number(a.id) -
        Number(b.id)
      );
    }

    return 0;
  });


  // ==========================================================
  // CREATE INSTITUTION
  // ==========================================================

  const handleCreateInstitution =
    async () => {
      setFormError("");

      if (
        !institutionName.trim()
      ) {
        setFormError(
          "Please enter institution name."
        );

        return;
      }

      const result =
        await createInstitution();

      if (
        result?.success
      ) {
        setFormError("");

        setSuccessResult({
          name:
            result.name,

          txHash:
            result.txHash,
        });
      }
    };


  // ==========================================================
  // REFRESH INSTITUTIONS
  // ==========================================================

  const handleRefreshInstitutions =
    async () => {
      try {
        setIsRefreshing(true);

        await loadInstitutions();
      } finally {
        setIsRefreshing(false);
      }
    };


  // ==========================================================
  // FIND CREATE-INSTITUTION TRANSACTION
  // ==========================================================

  const getInstitutionTransaction = (name) => {
    if (!name) {
      return null;
    }

    const targetName =
      String(name)
        .trim()
        .toLowerCase();

    return transactions.find((tx) => {
      const action =
        String(tx.action || "")
          .trim()
          .toLowerCase();

      return (
        action.includes("create institution") &&
        action.includes(targetName) &&
        tx.tx_hash
      );
    });
  };


  // ==========================================================
  // ETHERSCAN
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
  // UI
  // ==========================================================

  return (
    <section className="panel">

      {/* =====================================================
          CREATE INSTITUTION
      ===================================================== */}

      <h3>Create Institution</h3>

      <input
        placeholder="Example: NAST"

        value={
          institutionName
        }

        onChange={(e) => {
          setInstitutionName(
            e.target.value
          );

          if (formError) {
            setFormError("");
          }
        }}

        disabled={
          isSyncing
        }
      />

      {formError && (
        <div
          style={{
            marginTop: "-3px",
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            border:
              "1px solid rgba(248,113,113,0.35)",
            background:
              "rgba(239,68,68,0.10)",
            color: "#fca5a5",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {formError}
        </div>
      )}

      <button
        className="primary-btn"

        onClick={
          handleCreateInstitution
        }

        disabled={
          isSyncing
        }
      >
        {isSyncing
          ? String(message)
              .toLowerCase()
              .includes("synchronizing")
            ? "Synchronizing..."
            : "Creating..."
          : "Create Institution"}
      </button>


      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      {confirmBox &&
        confirmBox.title ===
          "Create Institution" && (

        <div style={overlayStyle}>

          <div style={modalStyle}>

            <h3
              style={{
                margin:
                  "0 0 12px",

                color:
                  "#f8fafc",
              }}
            >
              Confirm Institution
            </h3>

            <p
              style={{
                color:
                  "#cbd5e1",

                lineHeight:
                  "1.6",

                marginBottom:
                  "22px",
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
          SUCCESS BLOCKCHAIN MODAL
      ===================================================== */}

      {successResult && (

        <div style={overlayStyle}>

          <div
            style={
              successModalStyle
            }
          >

            {/* CLOSE */}

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
            >
              <FiX />
            </button>


            {/* SUCCESS ICON */}

            <div
              style={
                successIconStyle
              }
            >
              <FiCheckCircle />
            </div>


            {/* TITLE */}

            <h2
              style={{
                margin:
                  "0 0 8px",

                color:
                  "#f8fafc",

                textAlign:
                  "center",

                fontSize:
                  "17px",
              }}
            >
              Institution Created Successfully
            </h2>


            {/* DESCRIPTION */}

            <p
              style={{
                textAlign:
                  "center",

                color:
                  "#94a3b8",

                fontSize:
                  "11px",

                lineHeight:
                  "1.6",

                margin:
                  "0 0 13px",
              }}
            >
              The institution was successfully
              recorded through the EVoTE
              blockchain system.
            </p>


            {/* INSTITUTION NAME */}

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
                Institution
              </span>

              <strong
                style={{
                  color:
                    "#ffffff",

                  fontSize:
                    "11px",
                }}
              >
                {successResult.name}
              </strong>
            </div>


            {/* NETWORK */}

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
                Network
              </span>

              <strong
                style={{
                  color:
                    "#38bdf8",
                }}
              >
                Ethereum Sepolia
              </strong>
            </div>


            {/* TRANSACTION HASH */}

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
                Transaction Hash
              </span>

              <strong
                title={
                  normalizedHash
                }

                style={{
                  color:
                    "#22c55e",

                  fontFamily:
                    "monospace",

                  fontSize:
                    "13px",
                }}
              >
                {shortTxHash(
                  successResult.txHash
                )}
              </strong>
            </div>


            {/* ETHERSCAN BUTTON */}

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


            {/* DONE */}

            <button
              type="button"

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


      <div
        className="section-line"
      />


      {/* =====================================================
          ALL INSTITUTIONS
      ===================================================== */}

      <div className="election-header">

        <h3>
          All Institutions
        </h3>

        <div className="filter-box">

          <button
            className="filter-btn"

            onClick={() =>
              setShowFilter(
                !showFilter
              )
            }
          >
            <FiFilter />

            Filter
          </button>


          {showFilter && (

            <div className="filter-menu">

              <button
                className={
                  sortOrder === "all"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setSortOrder(
                    "all"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                All
              </button>


              <button
                className={
                  sortOrder ===
                  "newest"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setSortOrder(
                    "newest"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                Newest
              </button>


              <button
                className={
                  sortOrder ===
                  "oldest"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setSortOrder(
                    "oldest"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                Oldest
              </button>

            </div>
          )}

        </div>

      </div>


      {/* =====================================================
          REFRESH
      ===================================================== */}

      <button
        className="secondary-btn"

        onClick={
          handleRefreshInstitutions
        }

        disabled={
          isRefreshing ||
          isSyncing
        }
      >
        {isRefreshing
          ? "Refreshing Institutions..."
          : "Refresh Institutions"}
      </button>


      {/* =====================================================
          INSTITUTION LIST
      ===================================================== */}

      {institutionsLoading ||
      isRefreshing ? (

        <div className="institution-loading-list">

          {[1, 2, 3].map(
            (item) => (

              <div
                className="institution-loading-card"
                key={item}
              >

                <div className="institution-loading-left">

                  <div className="institution-skeleton institution-skeleton-title" />

                  <div className="institution-skeleton institution-skeleton-count" />

                  <div className="institution-skeleton institution-skeleton-link" />

                </div>

                <div className="institution-skeleton institution-skeleton-pill" />

              </div>

            )
          )}

        </div>

      ) : sortedInstitutions.length ===
        0 ? (

        <p className="muted">
          No institutions found.
        </p>

      ) : (

        sortedInstitutions.map(
          (institution) => {
            const tx =
              getInstitutionTransaction(
                institution.name
              );

            const txHash =
              normalizeTxHash(
                tx?.tx_hash
              );

            const institutionEtherscanUrl =
              txHash
                ? `https://sepolia.etherscan.io/tx/${txHash}`
                : "";

            return (
              <div
                className="row-card"

                key={
                  institution.id
                }
              >
                <div>

                  <b>
                    {institution.id}.{" "}
                    {institution.name}
                  </b>

                  <p>
                    {
                      institution.organizationCount
                    }{" "}
                    organizations
                  </p>

                  {institutionEtherscanUrl && (
                    <a
                      href={
                        institutionEtherscanUrl
                      }

                      target="_blank"

                      rel="noopener noreferrer"

                      style={{
                        display:
                          "inline-flex",

                        alignItems:
                          "center",

                        gap:
                          "6px",

                        marginTop:
                          "6px",

                        color:
                          "#38bdf8",

                        fontSize:
                          "12px",

                        fontWeight:
                          "700",

                        textDecoration:
                          "none",
                      }}
                    >
                      <FiExternalLink />

                      View on Sepolia Etherscan
                    </a>
                  )}

                </div>

                <span className="pill green">
                  Institution
                </span>

              </div>
            );
          }
        )
      )}

    </section>
  );
}


// ============================================================
// STYLES
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
    "rgba(0, 0, 0, 0.76)",

  backdropFilter:
    "blur(4px)",
};


const modalStyle = {
  width: "100%",
  maxWidth: "460px",

  padding: "24px",

  borderRadius: "12px",

  border:
    "1px solid #475569",

  background:
    "#202020",

  boxShadow:
    "0 20px 70px rgba(0, 0, 0, 0.5)",
};


const successModalStyle = {
  position: "relative",

  width: "100%",
  maxWidth: "350px",

  padding: "18px",

  borderRadius: "14px",

  border:
    "1px solid rgba(34,197,94,0.28)",

  background: "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.58)",
};


const closeButtonStyle = {
  position: "absolute",

  top: "9px",
  right: "9px",

  width: "28px",
  height: "28px",

  borderRadius:
    "50%",

  border:
    "1px solid rgba(255,255,255,0.12)",

  background:
    "rgba(255,255,255,0.06)",

  color:
    "#cbd5e1",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  cursor:
    "pointer",

  fontSize: "14px",
};


const successIconStyle = {
  width: "44px",

  height: "44px",

  margin: "0 auto 10px",

  borderRadius:
    "50%",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  background:
    "rgba(34,197,94,0.13)",

  border:
    "1px solid rgba(34,197,94,0.35)",

  color:
    "#22c55e",

  fontSize: "22px",
};


const resultInfoBoxStyle = {
  display:
    "flex",

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
  color:
    "#94a3b8",

  fontSize: "10px",

  textTransform:
    "uppercase",

  letterSpacing:
    "0.5px",
};


const etherscanButtonStyle = {
  width:
    "100%",

  boxSizing:
    "border-box",

  marginTop: "11px",

  padding: "9px 12px",

  display:
    "flex",

  justifyContent:
    "center",

  alignItems:
    "center",

  gap:
    "8px",

  borderRadius:
    "9px",

  border:
    "1px solid rgba(56,189,248,0.35)",

  background:
    "rgba(56,189,248,0.10)",

  color:
    "#38bdf8",

  fontWeight:
    "700",

  fontSize: "12px",

  textDecoration:
    "none",
};


const doneButtonStyle = {
  width:
    "100%",

  marginTop: "7px",

  padding: "9px 12px",

  border:
    "none",

  borderRadius:
    "9px",

  background:
    "#1688a5",

  color:
    "#ffffff",

  fontWeight:
    "800",

  fontSize: "12px",

  cursor:
    "pointer",
};


const modalActionsStyle = {
  display:
    "flex",

  justifyContent:
    "flex-end",

  gap:
    "10px",
};


const cancelButtonStyle = {
  padding:
    "10px 16px",

  borderRadius:
    "8px",

  border:
    "1px solid #475569",

  background:
    "#2d2d2d",

  color:
    "#f8fafc",

  fontWeight:
    "700",

  cursor:
    "pointer",
};


const confirmButtonStyle = {
  padding:
    "10px 16px",

  borderRadius:
    "8px",

  border:
    "none",

  background:
    "#1688a5",

  color:
    "#ffffff",

  fontWeight:
    "800",

  cursor:
    "pointer",
};


export default Institutions;