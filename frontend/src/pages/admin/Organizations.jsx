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

  const hash = String(txHash).trim();

  if (hash.startsWith("0x")) {
    return hash;
  }

  return `0x${hash}`;
}


function shortTxHash(txHash) {
  const hash = normalizeTxHash(txHash);

  if (!hash) {
    return "N/A";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}


// ============================================================
// ORGANIZATIONS PAGE
// ============================================================

function Organizations() {
  const {
    selectedInstitutionId,
    setSelectedInstitutionId,

    institutions,
    institutionsLoading,

    organizations,
    organizationsLoading,

    organizationName,
    setOrganizationName,

    createOrganization,
    loadOrganizations,

    transactions,

    isSyncing,
    message,

    confirmBox,
    closeConfirm,
  } = useAdmin();


  const [
    successResult,
    setSuccessResult,
  ] = useState(null);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");


  // ==========================================================
  // SELECTED INSTITUTION
  // ==========================================================

  const selectedInstitution =
    institutions.find(
      (inst) =>
        Number(inst.id) ===
        Number(selectedInstitutionId)
    );

  const selectedInstitutionName =
    selectedInstitution?.name || "";


  // ==========================================================
  // SELECT INSTITUTION
  // ==========================================================

  const handleSelectInstitution =
    async (institutionId) => {
      const id = String(
        institutionId
      );

      setFormError("");

      setSelectedInstitutionId(id);

      await loadOrganizations(id);
    };


  // ==========================================================
  // CREATE ORGANIZATION
  // ==========================================================

  const handleCreateOrganization =
    async () => {
      setFormError("");

      if (
        !organizationName.trim()
      ) {
        setFormError(
          "Please enter organization name."
        );

        return;
      }

      const result =
        await createOrganization();

      if (result?.success) {
        setFormError("");

        setSuccessResult({
          name:
            result.name,

          institutionName:
            result.institutionName ||
            selectedInstitutionName,

          txHash:
            result.txHash,
        });
      }
    };


  // ==========================================================
  // REFRESH ORGANIZATIONS
  // ==========================================================

  const handleRefreshOrganizations =
    async () => {
      if (!selectedInstitutionId) {
        return;
      }

      try {
        setIsRefreshing(true);

        await loadOrganizations(
          selectedInstitutionId
        );
      } finally {
        setIsRefreshing(false);
      }
    };


  // ==========================================================
  // FIND ORGANIZATION CREATE TRANSACTION
  // ==========================================================

  const getOrganizationTransaction =
    (name) => {
      if (!name) {
        return null;
      }

      const targetName =
        String(name)
          .trim()
          .toLowerCase();

      const targetInstitution =
        String(
          selectedInstitutionName || ""
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

          const hasOrganization =
            action.includes(
              "create organization"
            ) &&
            action.includes(
              targetName
            );

          if (!hasOrganization) {
            return false;
          }

          if (
            targetInstitution &&
            action.includes(
              targetInstitution
            )
          ) {
            return Boolean(
              tx.tx_hash
            );
          }

          return Boolean(
            tx.tx_hash
          );
        }
      );
    };


  // ==========================================================
  // SUCCESS ETHERSCAN URL
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
          CHOOSE INSTITUTION
      ===================================================== */}

      <div
        style={{
          marginBottom: "26px",
        }}
      >
        <h3
          style={{
            marginBottom: "6px",
          }}
        >
          Select Institution
        </h3>

        <p
          className="muted"
          style={{
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Choose an institution to create or view its organizations.
        </p>


        {/* INSTITUTION LOADING */}

        {institutionsLoading ? (

          <div className="organization-institution-loading-grid">

            {[1, 2, 3].map(
              (item) => (

                <div
                  className="organization-institution-loading-card"
                  key={item}
                >

                  <div>
                    <div className="organization-skeleton organization-skeleton-name" />

                    <div className="organization-skeleton organization-skeleton-count" />
                  </div>

                  <div className="organization-skeleton organization-skeleton-choose" />

                </div>

              )
            )}

          </div>

        ) : institutions.length === 0 ? (

          <p className="muted">
            No institutions found. Create an institution first.
          </p>

        ) : (

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap: "12px",
            }}
          >

            {institutions.map(
              (institution) => {
                const isSelected =
                  Number(
                    selectedInstitutionId
                  ) ===
                  Number(
                    institution.id
                  );

                return (

                  <button
                    type="button"

                    key={
                      institution.id
                    }

                    onClick={() =>
                      handleSelectInstitution(
                        institution.id
                      )
                    }

                    disabled={
                      organizationsLoading ||
                      isSyncing
                    }

                    style={{
                      width:
                        "100%",

                      textAlign:
                        "left",

                      padding:
                        "15px 16px",

                      borderRadius:
                        "11px",

                      border:
                        isSelected
                          ? "1px solid #22d3ee"
                          : "1px solid rgba(255,255,255,0.12)",

                      background:
                        isSelected
                          ? "rgba(8,145,178,0.14)"
                          : "rgba(255,255,255,0.035)",

                      color:
                        "#ffffff",

                      cursor:
                        organizationsLoading ||
                        isSyncing
                          ? "not-allowed"
                          : "pointer",

                      opacity:
                        organizationsLoading
                          ? 0.7
                          : 1,

                      transition:
                        "all 0.18s ease",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap:
                          "12px",
                      }}
                    >

                      <div>

                        <div
                          style={{
                            fontWeight:
                              "800",

                            fontSize:
                              "15px",

                            marginBottom:
                              "5px",
                          }}
                        >
                          {institution.id}.{" "}
                          {institution.name}
                        </div>

                        <div
                          style={{
                            color:
                              "#94a3b8",

                            fontSize:
                              "12px",
                          }}
                        >
                          {Number(
                            institution.organizationCount ||
                              0
                          )}{" "}
                          organizations
                        </div>

                      </div>


                      <span
                        style={{
                          flexShrink:
                            0,

                          padding:
                            "5px 9px",

                          borderRadius:
                            "999px",

                          background:
                            isSelected
                              ? "rgba(34,211,238,0.15)"
                              : "rgba(34,197,94,0.12)",

                          border:
                            isSelected
                              ? "1px solid rgba(34,211,238,0.35)"
                              : "1px solid rgba(34,197,94,0.28)",

                          color:
                            isSelected
                              ? "#67e8f9"
                              : "#4ade80",

                          fontSize:
                            "11px",

                          fontWeight:
                            "700",
                        }}
                      >
                        {isSelected
                          ? organizationsLoading
                            ? "Loading..."
                            : "Selected"
                          : "Choose"}
                      </span>

                    </div>

                  </button>

                );
              }
            )}

          </div>

        )}

      </div>


      <div className="section-line" />


      {/* =====================================================
          NOTHING SELECTED
      ===================================================== */}

      {!selectedInstitutionId ? (

        <div
          style={{
            padding: "22px 0 8px",
          }}
        >
          <h3>
            Create Organization
          </h3>

          <p className="muted">
            Select an institution above to create or view its organizations.
          </p>
        </div>

      ) : (

        <>

          {/* =====================================================
              CREATE ORGANIZATION
          ===================================================== */}

          <h3>
            Create Organization Inside Institution
          </h3>


          {selectedInstitutionName && (

            <p
              className="muted"
              style={{
                marginTop: "-4px",
                marginBottom: "14px",
              }}
            >
              Selected Institution:{" "}

              <strong
                style={{
                  color: "#ffffff",
                }}
              >
                {selectedInstitutionName}
              </strong>
            </p>

          )}


          <input
            placeholder="Example: Red Cross Society"

            value={
              organizationName
            }

            onChange={(e) => {
              setOrganizationName(
                e.target.value
              );

              if (formError) {
                setFormError("");
              }
            }}

            disabled={
              isSyncing ||
              organizationsLoading
            }
          />


          {formError && (

            <div
              style={{
                marginTop:
                  "-3px",

                marginBottom:
                  "12px",

                padding:
                  "10px 12px",

                borderRadius:
                  "8px",

                border:
                  "1px solid rgba(248,113,113,0.35)",

                background:
                  "rgba(239,68,68,0.10)",

                color:
                  "#fca5a5",

                fontSize:
                  "13px",

                fontWeight:
                  "600",
              }}
            >
              {formError}
            </div>

          )}


          <button
            className="primary-btn"

            onClick={
              handleCreateOrganization
            }

            disabled={
              isSyncing ||
              organizationsLoading
            }
          >
            {isSyncing
              ? String(message)
                  .toLowerCase()
                  .includes(
                    "synchronizing"
                  )
                ? "Synchronizing..."
                : "Creating..."
              : "Create Organization"}
          </button>


          {/* =====================================================
              CONFIRMATION MODAL
          ===================================================== */}

          {confirmBox &&
            confirmBox.title ===
              "Create Organization" && (

            <div style={overlayStyle}>

              <div style={confirmModalStyle}>

                <h3
                  style={{
                    margin:
                      "0 0 10px",

                    color:
                      "#f8fafc",
                  }}
                >
                  Confirm Organization
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
              SUCCESS POPUP
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

                  aria-label="Close"
                >
                  <FiX />
                </button>


                {/* ICON */}

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
                      "0 0 5px",

                    color:
                      "#f8fafc",

                    textAlign:
                      "center",

                    fontSize:
                      "17px",
                  }}
                >
                  Organization Created Successfully
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


                {/* ORGANIZATION */}

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
                    Organization
                  </span>

                  <strong
                    style={{
                      color:
                        "#ffffff",

                      fontSize:
                        "13px",
                    }}
                  >
                    {successResult.name}
                  </strong>
                </div>


                {/* INSTITUTION */}

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
                        "12px",
                    }}
                  >
                    {successResult.institutionName ||
                      "N/A"}
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

                      fontSize:
                        "12px",
                    }}
                  >
                    Ethereum Sepolia
                  </strong>
                </div>


                {/* HASH */}

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
                    Tx Hash
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
                        "11px",
                    }}
                  >
                    {shortTxHash(
                      successResult.txHash
                    )}
                  </strong>
                </div>


                {/* ETHERSCAN */}

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


          <div className="section-line" />


          {/* =====================================================
              ORGANIZATION LIST
          ===================================================== */}

          <h3>
            Organizations in Selected Institution
          </h3>


          <button
            className="secondary-btn"

            onClick={
              handleRefreshOrganizations
            }

            disabled={
              isRefreshing ||
              isSyncing ||
              organizationsLoading
            }
          >
            {isRefreshing
              ? "Refreshing Organizations..."
              : organizationsLoading
              ? "Loading Organizations..."
              : "Refresh Organizations"}
          </button>


          {/* =====================================================
              ORGANIZATION LOADING
          ===================================================== */}

          {organizationsLoading ||
          isRefreshing ? (

            <div className="organization-loading-list">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    className="organization-loading-card"
                    key={item}
                  >

                    <div className="organization-loading-left">

                      <div className="organization-skeleton organization-skeleton-title" />

                      <div className="organization-skeleton organization-skeleton-posts" />

                      <div className="organization-skeleton organization-skeleton-link" />

                    </div>


                    <div className="organization-skeleton organization-skeleton-pill" />

                  </div>

                )
              )}

            </div>

          ) : organizations.length === 0 ? (

            <p className="muted">
              No organizations created yet.
            </p>

          ) : (

            organizations.map(
              (organization) => {
                const tx =
                  getOrganizationTransaction(
                    organization.name
                  );

                const txHash =
                  normalizeTxHash(
                    tx?.tx_hash
                  );

                const organizationEtherscanUrl =
                  txHash
                    ? `https://sepolia.etherscan.io/tx/${txHash}`
                    : "";

                return (

                  <div
                    className="row-card"

                    key={
                      organization.id
                    }
                  >

                    <div>

                      <b>
                        {organization.id}.{" "}
                        {organization.name}
                      </b>

                      <p>
                        {
                          organization.postCount
                        }{" "}
                        posts
                      </p>


                      {organizationEtherscanUrl && (

                        <a
                          href={
                            organizationEtherscanUrl
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
                      Organization
                    </span>

                  </div>

                );
              }
            )

          )}

        </>

      )}

    </section>
  );
}


// ============================================================
// STYLES
// ============================================================

const overlayStyle = {
  position:
    "fixed",

  inset:
    0,

  zIndex:
    9999,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  padding:
    "20px",

  background:
    "rgba(0,0,0,0.72)",

  backdropFilter:
    "blur(3px)",
};


const confirmModalStyle = {
  width:
    "100%",

  maxWidth:
    "390px",

  padding:
    "20px",

  borderRadius:
    "12px",

  border:
    "1px solid #475569",

  background:
    "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.55)",
};


const successModalStyle = {
  position:
    "relative",

  width:
    "100%",

  maxWidth:
    "360px",

  padding:
    "18px",

  borderRadius:
    "14px",

  border:
    "1px solid rgba(34,197,94,0.30)",

  background:
    "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.58)",
};


const closeButtonStyle = {
  position:
    "absolute",

  top:
    "9px",

  right:
    "9px",

  width:
    "28px",

  height:
    "28px",

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

  fontSize:
    "14px",
};


const successIconStyle = {
  width:
    "44px",

  height:
    "44px",

  margin:
    "0 auto 10px",

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

  fontSize:
    "22px",
};


const resultInfoBoxStyle = {
  display:
    "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",

  gap:
    "10px",

  padding:
    "8px 10px",

  marginBottom:
    "7px",

  background:
    "rgba(255,255,255,0.035)",

  border:
    "1px solid rgba(255,255,255,0.08)",

  borderRadius:
    "8px",
};


const resultLabelStyle = {
  color:
    "#94a3b8",

  fontSize:
    "10px",

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

  marginTop:
    "11px",

  padding:
    "9px 12px",

  display:
    "flex",

  justifyContent:
    "center",

  alignItems:
    "center",

  gap:
    "7px",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(56,189,248,0.35)",

  background:
    "rgba(56,189,248,0.10)",

  color:
    "#38bdf8",

  fontWeight:
    "700",

  fontSize:
    "12px",

  textDecoration:
    "none",
};


const doneButtonStyle = {
  width:
    "100%",

  marginTop:
    "7px",

  padding:
    "9px 12px",

  border:
    "none",

  borderRadius:
    "8px",

  background:
    "#1688a5",

  color:
    "#ffffff",

  fontWeight:
    "800",

  fontSize:
    "12px",

  cursor:
    "pointer",
};


const modalActionsStyle = {
  display:
    "flex",

  justifyContent:
    "flex-end",

  gap:
    "9px",
};


const cancelButtonStyle = {
  padding:
    "9px 14px",

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
    "9px 14px",

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


export default Organizations;