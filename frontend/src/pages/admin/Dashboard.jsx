import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

function formatTransactionAction(action) {
  if (!action) return "Blockchain Transaction";

  return String(action)
    .replace(/\s*-\s*/g, " > ")
    .replace(/[()]/g, "");
}

function Dashboard() {
  const navigate = useNavigate();

  const {
    users,
    usersLoading,

    institutions,
    institutionsLoading,

    totalOrganizations,

    totalPosts,
    dashboardStatsLoading,

    totalTransactions,

    activePostsList,

    requests,
    requestsLoading,

    transactions,
    transactionsLoading,
  } = useAdmin();

  const pendingCandidateRequests =
    requests.filter(
      (request) =>
        request.status === "pending"
    ).length;

  return (
    <>
      {/* =====================================================
          DASHBOARD STATS
      ===================================================== */}

      <section className="stats-grid">

        {/* REGISTERED USERS */}

        <div className="stat-card">
          <p>Registered Users</p>

          {usersLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>{users.length}</h2>
          )}

          <span>Database</span>
        </div>


        {/* TOTAL INSTITUTIONS */}

        <div className="stat-card">
          <p>Total Institutions</p>

          {institutionsLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>{institutions.length}</h2>
          )}

          <span>Blockchain</span>
        </div>


        {/* TOTAL ORGANIZATIONS */}

        <div className="stat-card">
          <p>Total Organizations</p>

          {institutionsLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>{totalOrganizations}</h2>
          )}

          <span>Blockchain</span>
        </div>


        {/* ACTIVE ELECTIONS */}

        <div className="stat-card">
          <p>Active Elections</p>

          {dashboardStatsLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>{totalPosts}</h2>
          )}

          <span>Blockchain</span>
        </div>


        {/* CANDIDATE REQUESTS */}

        <div className="stat-card">
          <p>Candidate Requests</p>

          {requestsLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>
              {pendingCandidateRequests}
            </h2>
          )}

          <span>Pending</span>
        </div>


        {/* TOTAL TRANSACTIONS */}

        <div className="stat-card">
          <p>Total Transactions</p>

          {transactionsLoading ? (
            <div className="dashboard-stat-loading"></div>
          ) : (
            <h2>{totalTransactions}</h2>
          )}

          <span>History</span>
        </div>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="content-grid">

        {/* ===================================================
            ACTIVE ELECTIONS
        =================================================== */}

        <div className="panel">

          <h3>Active Elections</h3>


          {/* LOADING */}

          {dashboardStatsLoading ? (
            <>

              <div className="dashboard-election-loading">
                <div className="dashboard-loading-line dashboard-loading-title"></div>

                <div className="dashboard-loading-line dashboard-loading-medium"></div>

                <div className="dashboard-loading-line dashboard-loading-small"></div>
              </div>


              <div className="dashboard-election-loading">
                <div className="dashboard-loading-line dashboard-loading-title"></div>

                <div className="dashboard-loading-line dashboard-loading-medium"></div>

                <div className="dashboard-loading-line dashboard-loading-small"></div>
              </div>


              <div className="dashboard-election-loading">
                <div className="dashboard-loading-line dashboard-loading-title"></div>

                <div className="dashboard-loading-line dashboard-loading-medium"></div>

                <div className="dashboard-loading-line dashboard-loading-small"></div>
              </div>

            </>
          ) : activePostsList.length === 0 ? (

            /* NO ACTIVE ELECTIONS */

            <p className="muted">
              No active elections.
            </p>

          ) : (

            /* ACTIVE ELECTION LIST */

            [...activePostsList]
              .sort(
                (a, b) =>
                  Number(b.startDate || 0) -
                  Number(a.startDate || 0)
              )
              .slice(0, 3)
              .map((post) => (

                <div
                  className="dashboard-election-row"
                  key={`${post.institutionId}-${post.organizationId}-${post.id}`}
                >

                  {/* LEFT SIDE */}

                  <div className="dashboard-election-main">

                    <b className="dashboard-election-title">
                      {post.title}
                    </b>


                    {/* LOCATION */}

                    <div className="dashboard-election-location">

                      <span>
                        {post.institutionName}
                      </span>

                      <span className="dashboard-election-dot">
                        &gt;
                      </span>

                      <span>
                        {post.organizationName}
                      </span>

                    </div>


                    {/* META */}

                    <div className="dashboard-election-meta">

                      <span>
                        {post.candidateCount} candidates
                      </span>

                      <span className="dashboard-election-dot">
                        •
                      </span>

                      <span>
                        Ends:{" "}
                        {new Date(
                          post.endDate * 1000
                        ).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>

                    </div>

                  </div>


                  {/* ACTIVE STATUS */}

                  <span className="pill green dashboard-election-status">
                    Active
                  </span>

                </div>

              ))
          )}

        </div>


        {/* ===================================================
            RECENT TRANSACTIONS
        =================================================== */}

        <div className="panel">

          {/* HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >

            <h3 style={{ margin: 0 }}>
              Recent Transactions
            </h3>


            {!transactionsLoading && (
              <span
                onClick={() =>
                  navigate("/admin/transactions")
                }
                style={{
                  cursor: "pointer",
                  color: "#22d3ee",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                View All »
              </span>
            )}

          </div>


          {/* =================================================
              TRANSACTION LOADING SKELETON
          ================================================= */}

          {transactionsLoading ? (
            <>

              <div className="dashboard-transaction-loading">

                <div>
                  <div className="dashboard-loading-line dashboard-loading-title"></div>

                  <div className="dashboard-loading-line dashboard-loading-small"></div>
                </div>

                <div className="dashboard-transaction-loading-right">

                  <div className="dashboard-loading-line dashboard-loading-status"></div>

                  <div className="dashboard-loading-line dashboard-loading-date"></div>

                </div>

              </div>


              <div className="dashboard-transaction-loading">

                <div>
                  <div className="dashboard-loading-line dashboard-loading-title"></div>

                  <div className="dashboard-loading-line dashboard-loading-small"></div>
                </div>

                <div className="dashboard-transaction-loading-right">

                  <div className="dashboard-loading-line dashboard-loading-status"></div>

                  <div className="dashboard-loading-line dashboard-loading-date"></div>

                </div>

              </div>


              <div className="dashboard-transaction-loading">

                <div>
                  <div className="dashboard-loading-line dashboard-loading-title"></div>

                  <div className="dashboard-loading-line dashboard-loading-small"></div>
                </div>

                <div className="dashboard-transaction-loading-right">

                  <div className="dashboard-loading-line dashboard-loading-status"></div>

                  <div className="dashboard-loading-line dashboard-loading-date"></div>

                </div>

              </div>

            </>

          ) : !transactions ||
            transactions.length === 0 ? (

            /* NO TRANSACTIONS */

            <p className="muted">
              No transactions yet.
            </p>

          ) : (

            /* =================================================
                RECENT TRANSACTIONS LIST
            ================================================= */

            transactions
              .slice(0, 3)
              .map((tx, index) => (

                <div
                  key={
                    tx.id ||
                    tx.tx_hash ||
                    index
                  }
                  style={{
                    padding: "14px 16px",

                    marginBottom:
                      index !==
                      Math.min(
                        transactions.length,
                        3
                      ) -
                        1
                        ? "10px"
                        : "0",

                    minHeight: "64px",

                    background: "#272727",

                    border:
                      "1px solid #3a3a3a",

                    borderRadius: "12px",

                    display: "flex",

                    alignItems: "center",
                  }}
                >

                  <div
                    style={{
                      display: "flex",

                      justifyContent:
                        "space-between",

                      alignItems: "center",

                      gap: "20px",

                      width: "100%",
                    }}
                  >

                    {/* =========================================
                        LEFT TRANSACTION INFORMATION
                    ========================================= */}

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      {/* ACTION */}

                      <b
                        style={{
                          fontSize: "13px",

                          lineHeight: "1.45",
                        }}
                      >
                        {formatTransactionAction(
                          tx.action
                        )}
                      </b>


                      {/* TRANSACTION HASH */}

                      <div
                        style={{
                          marginTop: "5px",

                          fontSize: "11px",

                          color: "#4ade80",

                          fontWeight: "600",
                        }}
                      >
                        {tx.tx_hash
                          ? `${tx.tx_hash.slice(
                              0,
                              8
                            )}...${tx.tx_hash.slice(
                              -6
                            )}`
                          : "No transaction hash"}
                      </div>

                    </div>


                    {/* =========================================
                        RIGHT SIDE
                    ========================================= */}

                    <div
                      style={{
                        textAlign: "right",

                        fontSize: "11px",

                        minWidth: "125px",
                      }}
                    >

                      {/* STATUS */}

                      <div
                        style={{
                          color:
                            tx.status ===
                            "failed"
                              ? "#f87171"
                              : "#4ade80",

                          fontWeight: "600",

                          textTransform:
                            "capitalize",
                        }}
                      >
                        {tx.status ||
                          "success"}
                      </div>


                      {/* CREATED DATE */}

                      <div
                        className="muted"
                        style={{
                          marginTop: "5px",

                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.created_at
                          ? new Date(
                              tx.created_at
                            ).toLocaleString()
                          : ""}
                      </div>


                      {/* =======================================
                          VERIFY ON SEPOLIA
                      ======================================= */}

                      {tx.tx_hash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display:
                              "inline-flex",

                            alignItems:
                              "center",

                            gap: "3px",

                            marginTop: "6px",

                            color: "#22d3ee",

                            fontSize: "10px",

                            fontWeight: "700",

                            textDecoration:
                              "none",

                            cursor: "pointer",
                          }}
                        >
                          Verify on Sepolia ↗
                        </a>
                      )}

                    </div>

                  </div>

                </div>

              ))
          )}

        </div>

      </section>
    </>
  );
}

export default Dashboard;