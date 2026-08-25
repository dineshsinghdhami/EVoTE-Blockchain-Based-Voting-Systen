import { API_URL } from "../../config";
import { useEffect, useState } from "react";
import { FiFilter } from "react-icons/fi";
import axios from "axios";


// ============================================================
// REQUEST SKELETON CARD
// ============================================================

function RequestSkeletonCard() {
  return (
    <div className="request-card candidate-request-item">
      <div className="candidate-request-main">
        <div className="candidate-request-info">

          <div className="candidate-request-name-row">
            <div
              className="request-page-skeleton"
              style={{
                width: "170px",
                height: "18px",
              }}
            />

            <div
              className="request-page-skeleton"
              style={{
                width: "55px",
                height: "23px",
                borderRadius: "999px",
              }}
            />
          </div>


          <div className="candidate-request-grid">

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                className="candidate-request-field"
                key={item}
              >
                <div
                  className="request-page-skeleton"
                  style={{
                    width: "80px",
                    height: "9px",
                    marginBottom: "7px",
                  }}
                />

                <div
                  className="request-page-skeleton"
                  style={{
                    width:
                      item === 1
                        ? "180px"
                        : "100px",
                    maxWidth: "90%",
                    height: "11px",
                  }}
                />
              </div>
            ))}

          </div>

        </div>
      </div>
    </div>
  );
}


// ============================================================
// REQUESTS PAGE
// ============================================================

function Requests() {
  const [requests, setRequests] = useState([]);

  const [requestFilter, setRequestFilter] =
    useState("new");

  const [showFilter, setShowFilter] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [confirmBox, setConfirmBox] =
    useState(null);


  // ==========================================================
  // LOAD REQUESTS
  // ==========================================================

  async function loadRequests() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setRequests([]);

        setMessage(
          "Login token not found."
        );

        return;
      }

      const res = await axios.get(
        `${API_URL}/candidate-requests`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setRequests(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load candidate requests:",
        err
      );

      setRequests([]);

      setMessage(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load candidate requests"
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadRequests();
  }, []);


  // ==========================================================
  // AUTO HIDE MESSAGE
  // ==========================================================

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 5000);

    return () =>
      clearTimeout(timer);

  }, [message]);


  // ==========================================================
  // NORMALIZE STATUS
  // ==========================================================

  function normalizeStatus(status) {
    return String(status || "")
      .trim()
      .toLowerCase();
  }


  // ==========================================================
  // FILTERED REQUESTS
  // ==========================================================

  const filteredRequests =
    requests.filter((request) => {

      const status =
        normalizeStatus(
          request.status
        );

      if (
        requestFilter === "new"
      ) {
        return status === "pending";
      }

      if (
        requestFilter === "accepted"
      ) {
        return (
          status === "approved" ||
          status === "accepted" ||
          status === "registered"
        );
      }

      if (
        requestFilter === "rejected"
      ) {
        return (
          status === "rejected"
        );
      }

      return true;
    });


  // ==========================================================
  // APPROVE
  // ==========================================================

  function askApprove(request) {
    setConfirmBox({
      type: "approve",

      request,

      title:
        "Approve Candidate",

      message:
        `Approve "${request.candidate_name}" as a candidate?`,

      confirmText:
        "Approve",
    });
  }


  // ==========================================================
  // REJECT
  // ==========================================================

  function askReject(request) {
    setConfirmBox({
      type: "reject",

      request,

      title:
        "Reject Candidate",

      message:
        `Reject candidate request from "${request.candidate_name}"?`,

      confirmText:
        "Reject",
    });
  }


  // ==========================================================
  // CONFIRM ACTION
  // ==========================================================

  async function confirmAction() {
    if (!confirmBox?.request) {
      return;
    }

    const request =
      confirmBox.request;

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Login token not found."
        );

        return;
      }


      if (
        confirmBox.type === "approve"
      ) {
        await axios.put(
          `${API_URL}/approve-candidate/${request.id}`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        setMessage(
          "Candidate request approved."
        );
      }


      if (
        confirmBox.type === "reject"
      ) {
        await axios.put(
          `${API_URL}/reject-candidate/${request.id}`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        setMessage(
          "Candidate request rejected."
        );
      }


      setConfirmBox(null);

      await loadRequests();

    } catch (err) {
      console.error(
        "Candidate request action failed:",
        err
      );

      setMessage(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to update candidate request"
      );
    }
  }


  // ==========================================================
  // FILTER TITLE
  // ==========================================================

  function getFilterTitle() {
    if (
      requestFilter === "new"
    ) {
      return "New";
    }

    if (
      requestFilter === "accepted"
    ) {
      return "Accepted";
    }

    if (
      requestFilter === "rejected"
    ) {
      return "Rejected";
    }

    return "New";
  }


  // ==========================================================
  // FILTER CHANGE
  // ==========================================================

  function changeFilter(filter) {
    setRequestFilter(filter);

    setShowFilter(false);

    setConfirmBox(null);
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="panel">

      {/* =====================================================
          PAGE CSS
      ===================================================== */}

      <style>
        {`

          /* ================================================
             REQUEST LIST
          ================================================ */

          .candidate-request-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }


          /* ================================================
             REQUEST CARD
          ================================================ */

          .candidate-request-item {
            padding: 15px 18px !important;
          }

          .candidate-request-main {
            display: block;
            width: 100%;
          }

          .candidate-request-info {
            width: 100%;
          }


          /* ================================================
             NAME + STATUS
          ================================================ */

          .candidate-request-name-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 14px;
          }

          .candidate-request-name-row h4 {
            margin: 0;
            font-size: 18px;
            line-height: 1.2;
          }

          .candidate-request-name-row .pill {
            font-size: 11px;
            padding: 4px 10px;
          }


          /* ================================================
             INFORMATION GRID
          ================================================ */

          .candidate-request-grid {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            column-gap: 28px;
            row-gap: 12px;
          }


          .candidate-request-field {
            min-width: 0;
          }


          .candidate-request-field-label {
            display: block;

            margin-bottom: 4px;

            color: #94a3b8;

            font-size: 11px;

            font-weight: 800;

            text-transform: uppercase;

            letter-spacing: 0.5px;
          }


          .candidate-request-field-value {
            display: block;

            color: #e5e7eb;

            font-size: 14px;

            font-weight: 500;

            line-height: 1.35;

            overflow-wrap: anywhere;
          }


          /* ================================================
             WALLET
          ================================================ */

          .candidate-request-wallet {
            grid-column: span 2;
          }

          .candidate-request-wallet
          .candidate-request-field-value {
            color: #22d3ee;
            font-size: 13px;
          }


          /* ================================================
             STATUS COLORS
          ================================================ */

          .candidate-status-pending {
            color: #fbbf24;
          }

          .candidate-status-approved {
            color: #4ade80;
          }

          .candidate-status-rejected {
            color: #f87171;
          }


          /* ================================================
             ACTION BUTTONS
          ================================================ */

          .candidate-request-actions {
            display: flex;

            align-items: center;

            gap: 8px;

            margin-top: 14px;
          }


          .candidate-request-actions button {
            min-height: 34px;

            padding: 7px 14px;

            font-size: 13px;

            border-radius: 8px;
          }


          /* ================================================
             SKELETON
          ================================================ */

          .request-page-skeleton {
            position: relative;

            overflow: hidden;

            background: #303030;

            border-radius: 5px;
          }


          .request-page-skeleton::after {
            content: "";

            position: absolute;

            inset: 0;

            transform:
              translateX(-100%);

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(
                  255,
                  255,
                  255,
                  0.05
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.12
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.05
                ),
                transparent
              );

            animation:
              requestPageSkeletonShimmer
              1.25s infinite;
          }


          @keyframes
          requestPageSkeletonShimmer {

            100% {
              transform:
                translateX(100%);
            }

          }


          /* ================================================
             TABLET
          ================================================ */

          @media (
            max-width: 1100px
          ) {

            .candidate-request-grid {
              grid-template-columns:
                repeat(
                  3,
                  minmax(0, 1fr)
                );
            }

          }


          /* ================================================
             SMALL TABLET
          ================================================ */

          @media (
            max-width: 850px
          ) {

            .candidate-request-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .candidate-request-wallet {
              grid-column: span 2;
            }

          }


          /* ================================================
             MOBILE
          ================================================ */

          @media (
            max-width: 600px
          ) {

            .candidate-request-item {
              padding:
                14px !important;
            }

            .candidate-request-grid {
              grid-template-columns:
                1fr;
            }

            .candidate-request-wallet {
              grid-column:
                span 1;
            }

            .candidate-request-name-row h4 {
              font-size: 16px;
            }

          }

        `}
      </style>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div
          style={{
            marginBottom:
              "18px",

            padding:
              "14px 16px",

            borderRadius:
              "10px",

            border:
              "1px solid #155e75",

            background:
              "#17343b",

            color:
              "#67e8f9",

            fontWeight:
              "700",
          }}
        >
          {message}
        </div>
      )}


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="election-header">

        <div>

          <h3>
            Candidate Requests
          </h3>

          <p className="muted">
            Candidate requests submitted by registered voters.
          </p>

        </div>


        <div className="filter-box">

          <button
            className="filter-btn"

            disabled={
              loading
            }

            onClick={() =>
              setShowFilter(
                (prev) =>
                  !prev
              )
            }

            style={{
              opacity:
                loading
                  ? 0.6
                  : 1,

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            <FiFilter />

            {getFilterTitle()}

          </button>


          {showFilter &&
            !loading && (

            <div className="filter-menu">

              <button
                className={
                  requestFilter ===
                  "new"
                    ? "active"
                    : ""
                }

                onClick={() =>
                  changeFilter(
                    "new"
                  )
                }
              >
                New
              </button>


              <button
                className={
                  requestFilter ===
                  "accepted"
                    ? "active"
                    : ""
                }

                onClick={() =>
                  changeFilter(
                    "accepted"
                  )
                }
              >
                Accepted
              </button>


              <button
                className={
                  requestFilter ===
                  "rejected"
                    ? "active"
                    : ""
                }

                onClick={() =>
                  changeFilter(
                    "rejected"
                  )
                }
              >
                Rejected
              </button>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          REQUEST COUNT
      ===================================================== */}

      <div
        style={{
          marginBottom:
            "18px",
        }}
      >

        {loading ? (

          <div
            className="request-page-skeleton"

            style={{
              width:
                "95px",

              height:
                "25px",

              borderRadius:
                "999px",
            }}
          />

        ) : (

          <span className="pill">

            {filteredRequests.length}{" "}

            {filteredRequests.length === 1
              ? "Request"
              : "Requests"}

          </span>

        )}

      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      {loading ? (

        <div className="candidate-request-list">

          {[1, 2, 3].map(
            (item) => (

              <RequestSkeletonCard
                key={item}
              />

            )
          )}

        </div>

      ) : filteredRequests.length ===
        0 ? (

        <div className="empty-box">

          {requestFilter === "new" &&
            "No new candidate requests."}


          {requestFilter ===
            "accepted" &&
            "No accepted candidate requests."}


          {requestFilter ===
            "rejected" &&
            "No rejected candidate requests."}

        </div>

      ) : (

        <div className="candidate-request-list">

          {filteredRequests.map((r) => {

            const status =
              normalizeStatus(
                r.status
              );


            const showConfirmation =
              confirmBox
                ?.request
                ?.id ===
              r.id;


            let statusClass =
              "candidate-status-pending";


            if (
              status === "approved" ||
              status === "accepted" ||
              status === "registered"
            ) {
              statusClass =
                "candidate-status-approved";
            }


            if (
              status === "rejected"
            ) {
              statusClass =
                "candidate-status-rejected";
            }


            return (

              <div
                className="
                  request-card
                  candidate-request-item
                "

                key={r.id}
              >

                <div className="candidate-request-main">


                  {/* =========================================
                      CANDIDATE INFORMATION
                  ========================================= */}

                  <div className="candidate-request-info">


                    {/* NAME */}

                    <div className="candidate-request-name-row">

                      <h4>
                        {r.candidate_name ||
                          "Unknown User"}
                      </h4>


                      {status ===
                        "pending" && (

                        <span className="pill">
                          New
                        </span>

                      )}


                      {(status ===
                        "approved" ||
                        status ===
                          "accepted") && (

                        <span className="pill green">
                          Accepted
                        </span>

                      )}


                      {status ===
                        "registered" && (

                        <span className="pill green">
                          Registered
                        </span>

                      )}


                      {status ===
                        "rejected" && (

                        <span className="pill">
                          Rejected
                        </span>

                      )}

                    </div>


                    {/* =======================================
                        INFORMATION GRID
                    ======================================= */}

                    <div className="candidate-request-grid">


                      {/* EMAIL */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Email
                        </span>

                        <span className="candidate-request-field-value">
                          {r.email ||
                            "Not available"}
                        </span>

                      </div>


                      {/* AGE */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Age
                        </span>

                        <span className="candidate-request-field-value">

                          {r.age !== null &&
                          r.age !== undefined
                            ? `${r.age} years`
                            : "Not available"}

                        </span>

                      </div>


                      {/* INSTITUTION */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Institution
                        </span>

                        <span className="candidate-request-field-value">

                          {r.institution_name ||
                            "Not available"}

                        </span>

                      </div>


                      {/* ORGANIZATION */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Organization
                        </span>

                        <span className="candidate-request-field-value">

                          {r.organization_name ||
                            "Not available"}

                        </span>

                      </div>


                      {/* POST */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Post
                        </span>

                        <span className="candidate-request-field-value">

                          {r.post_name ||
                            "Not available"}

                        </span>

                      </div>


                      {/* STATUS */}

                      <div className="candidate-request-field">

                        <span className="candidate-request-field-label">
                          Status
                        </span>

                        <span
                          className={`
                            candidate-request-field-value
                            ${statusClass}
                          `}
                        >
                          {status}
                        </span>

                      </div>


                      {/* WALLET */}

                      <div
                        className="
                          candidate-request-field
                          candidate-request-wallet
                        "
                      >

                        <span className="candidate-request-field-label">
                          Wallet
                        </span>

                        <span className="candidate-request-field-value">

                          {r.wallet_address ||
                            "Not available"}

                        </span>

                      </div>

                    </div>


                    {/* =======================================
                        ACTIONS
                    ======================================= */}

                    {status ===
                      "pending" && (

                      <div className="candidate-request-actions">

                        <button
                          className="primary-btn"

                          onClick={() =>
                            askApprove(r)
                          }
                        >
                          Approve
                        </button>


                        <button
                          className="danger-btn"

                          onClick={() =>
                            askReject(r)
                          }
                        >
                          Reject
                        </button>

                      </div>

                    )}

                  </div>

                </div>


                {/* =========================================
                    CONFIRMATION MODAL
                ========================================= */}

                {showConfirmation &&
                  confirmBox && (

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
                        {confirmBox.title}
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


                      <div style={modalActionsStyle}>

                        <button
                          type="button"

                          onClick={() =>
                            setConfirmBox(
                              null
                            )
                          }

                          style={cancelButtonStyle}
                        >
                          Cancel
                        </button>


                        <button
                          type="button"

                          onClick={
                            confirmAction
                          }

                          style={
                            confirmBox.type ===
                            "reject"
                              ? rejectButtonStyle
                              : confirmButtonStyle
                          }
                        >
                          {confirmBox.confirmText}
                        </button>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            );

          })}

        </div>

      )}

    </section>
  );
}


// ============================================================
// MODAL STYLES
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
    "rgba(0, 0, 0, 0.72)",
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


const modalActionsStyle = {
  display: "flex",

  justifyContent:
    "flex-end",

  gap: "10px",
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


const rejectButtonStyle = {
  padding:
    "10px 16px",

  borderRadius:
    "8px",

  border:
    "none",

  background:
    "#dc2626",

  color:
    "#ffffff",

  fontWeight:
    "800",

  cursor:
    "pointer",
};


export default Requests;