import { useEffect, useState } from "react";
import {
  FiFilter,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";

import { useAdmin } from "../../context/AdminContext";


// ============================================================
// TRANSACTION HASH HELPER
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
// ELECTION LOADING CARD
// ============================================================

function ElectionLoadingCard() {
  return (
    <div className="row-card all-election-loading-card">

      <div className="all-election-loading-content">

        <div className="all-election-loading-heading">
          <div className="all-election-skeleton all-election-skeleton-title" />

          <div className="all-election-skeleton all-election-skeleton-pill" />
        </div>


        <div className="all-election-loading-grid">

          <div>
            <div className="all-election-skeleton all-election-skeleton-label" />

            <div className="all-election-skeleton all-election-skeleton-value" />
          </div>


          <div>
            <div className="all-election-skeleton all-election-skeleton-label" />

            <div className="all-election-skeleton all-election-skeleton-value medium" />
          </div>


          <div>
            <div className="all-election-skeleton all-election-skeleton-label" />

            <div className="all-election-skeleton all-election-skeleton-value small" />
          </div>


          <div>
            <div className="all-election-skeleton all-election-skeleton-label" />

            <div className="all-election-skeleton all-election-skeleton-value long" />
          </div>


          <div>
            <div className="all-election-skeleton all-election-skeleton-label" />

            <div className="all-election-skeleton all-election-skeleton-value long" />
          </div>

        </div>


        <div className="all-election-skeleton all-election-skeleton-link" />

      </div>

    </div>
  );
}


// ============================================================
// ALL ELECTIONS PAGE
// ============================================================

function AllElections() {
  const {
    allPostsList,
    loadDashboardStats,
    dashboardStatsLoading,
    transactions,
  } = useAdmin();


  const [
    filterStatus,
    setFilterStatus,
  ] = useState("all");


  const [
    showFilter,
    setShowFilter,
  ] = useState(false);


  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboardStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate =
    (value) => {

      if (
        !value ||
        Number(value) <= 0
      ) {
        return "N/A";
      }

      return new Date(
        Number(value) * 1000
      ).toLocaleString();
    };


  // ==========================================================
  // REFRESH ELECTIONS
  // ==========================================================

  const handleRefreshElections =
    async () => {

      if (
        isRefreshing ||
        dashboardStatsLoading
      ) {
        return;
      }

      try {

        setIsRefreshing(true);

        await loadDashboardStats();

      } finally {

        setIsRefreshing(false);

      }
    };


  // ==========================================================
  // CURRENT TIME
  // ==========================================================

  const currentTime =
    Math.floor(
      Date.now() / 1000
    );


  // ==========================================================
  // ELECTION STATUS
  // ==========================================================

  const getElectionStatus =
    (post) => {

      const startDate =
        Number(
          post.startDate
        );

      const endDate =
        Number(
          post.endDate
        );


      if (
        startDate <= 0 ||
        endDate <= 0
      ) {
        return "unknown";
      }


      if (
        currentTime <
        startDate
      ) {
        return "upcoming";
      }


      if (
        currentTime >=
          startDate &&
        currentTime <=
          endDate
      ) {
        return "active";
      }


      return "closed";
    };


  // ==========================================================
  // FIND CREATE-ELECTION TRANSACTION
  // ==========================================================

  const getElectionTransaction =
    (post) => {

      const title =
        String(
          post.title || ""
        )
          .trim()
          .toLowerCase();


      const institution =
        String(
          post.institutionName || ""
        )
          .trim()
          .toLowerCase();


      const organization =
        String(
          post.organizationName || ""
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


          const isCreateElection =
            action.includes(
              "create election"
            ) ||
            action.includes(
              "create post"
            );


          if (
            !isCreateElection ||
            !tx.tx_hash
          ) {
            return false;
          }


          if (
            title &&
            !action.includes(
              title
            )
          ) {
            return false;
          }


          if (
            institution &&
            action.includes(
              institution
            ) &&
            organization &&
            action.includes(
              organization
            )
          ) {
            return true;
          }


          return true;
        }
      );
    };


  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredPosts =
    allPostsList
      .filter(
        (post) => {

          const status =
            getElectionStatus(
              post
            );


          if (
            filterStatus ===
            "all"
          ) {
            return true;
          }


          return (
            status ===
            filterStatus
          );
        }
      )
      .sort(
        (a, b) =>
          Number(
            b.startDate || 0
          ) -
          Number(
            a.startDate || 0
          )
      );


  // ==========================================================
  // LOADING
  // ==========================================================

  const electionsLoading =
    dashboardStatsLoading ||
    isRefreshing;


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section
      className="panel all-elections-panel"
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="election-header">

        <div>

          <h3>
            All Elections
          </h3>

          <p
            className="muted"

            style={{
              marginTop: "5px",
              marginBottom: 0,
              fontSize: "13px",
            }}
          >
            View all blockchain election posts and their current voting status.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          {/* REFRESH */}

          <button
            className="secondary-btn"

            type="button"

            onClick={
              handleRefreshElections
            }

            disabled={
              electionsLoading
            }

            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              gap:
                "7px",

              cursor:
                electionsLoading
                  ? "not-allowed"
                  : "pointer",

              opacity:
                electionsLoading
                  ? 0.7
                  : 1,
            }}
          >
            <FiRefreshCw
              className={
                electionsLoading
                  ? "all-election-refresh-icon spinning"
                  : "all-election-refresh-icon"
              }
            />

            {electionsLoading
              ? "Refreshing Elections..."
              : "Refresh Elections"}
          </button>


          {/* FILTER */}

          <div className="filter-box">

            <button
              className="filter-btn"

              disabled={
                electionsLoading
              }

              onClick={() =>
                setShowFilter(
                  !showFilter
                )
              }

              style={{
                opacity:
                  electionsLoading
                    ? 0.6
                    : 1,

                cursor:
                  electionsLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <FiFilter />

              Filter
            </button>


            {showFilter &&
            !electionsLoading && (

              <div className="filter-menu">

                <button
                  className={
                    filterStatus ===
                    "all"
                      ? "active"
                      : ""
                  }

                  onClick={() => {

                    setFilterStatus(
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
                    filterStatus ===
                    "upcoming"
                      ? "active"
                      : ""
                  }

                  onClick={() => {

                    setFilterStatus(
                      "upcoming"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Upcoming
                </button>


                <button
                  className={
                    filterStatus ===
                    "active"
                      ? "active"
                      : ""
                  }

                  onClick={() => {

                    setFilterStatus(
                      "active"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Active
                </button>


                <button
                  className={
                    filterStatus ===
                    "closed"
                      ? "active"
                      : ""
                  }

                  onClick={() => {

                    setFilterStatus(
                      "closed"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Closed
                </button>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          LOADING ELECTIONS
      ===================================================== */}

      {electionsLoading ? (

        <div className="all-election-loading-list">

          {[1, 2, 3].map(
            (item) => (

              <ElectionLoadingCard
                key={item}
              />

            )
          )}

        </div>

      ) : filteredPosts.length ===
        0 ? (

        /* =====================================================
           REAL EMPTY STATE
        ===================================================== */

        <div
          style={{
            marginTop:
              "18px",

            padding:
              "22px",

            border:
              "1px dashed #475569",

            borderRadius:
              "10px",

            color:
              "#94a3b8",
          }}
        >
          {filterStatus === "all"
            ? "No elections found."
            : `No ${filterStatus} elections found.`}
        </div>

      ) : (

        /* =====================================================
           ELECTION LIST
        ===================================================== */

        <div
          style={{
            display:
              "grid",

            gap:
              "14px",

            marginTop:
              "18px",
          }}
        >

          {filteredPosts.map(
            (post) => {

              const status =
                getElectionStatus(
                  post
                );


              const tx =
                getElectionTransaction(
                  post
                );


              const txHash =
                normalizeTxHash(
                  tx?.tx_hash
                );


              const etherscanUrl =
                txHash
                  ? `https://sepolia.etherscan.io/tx/${txHash}`
                  : "";


              return (

                <div
                  className="row-card"

                  key={`${post.institutionId}-${post.organizationId}-${post.id}`}

                  style={{
                    alignItems:
                      "flex-start",
                  }}
                >

                  {/* LEFT */}

                  <div
                    style={{
                      flex: 1,
                    }}
                  >

                    {/* TITLE + STATUS */}

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "10px",

                        flexWrap:
                          "wrap",

                        marginBottom:
                          "12px",
                      }}
                    >

                      <b
                        style={{
                          fontSize:
                            "18px",
                        }}
                      >
                        {post.title}
                      </b>


                      {status ===
                        "upcoming" && (

                        <span className="pill upcoming">
                          Upcoming
                        </span>

                      )}


                      {status ===
                        "active" && (

                        <span className="pill green">
                          Active
                        </span>

                      )}


                      {status ===
                        "closed" && (

                        <span className="pill">
                          Closed
                        </span>

                      )}


                      {status ===
                        "unknown" && (

                        <span className="pill">
                          Unknown
                        </span>

                      )}

                    </div>


                    {/* INFORMATION */}

                    <div
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(190px, 1fr))",

                        gap:
                          "12px 22px",
                      }}
                    >

                      <ElectionInfo
                        label="Institution"

                        value={
                          post.institutionName ||
                          "N/A"
                        }
                      />


                      <ElectionInfo
                        label="Organization"

                        value={
                          post.organizationName ||
                          "N/A"
                        }
                      />


                      <ElectionInfo
                        label="Candidates"

                        value={
                          post.candidateCount ??
                          0
                        }
                      />


                      <ElectionInfo
                        label="Voting Start"

                        value={
                          formatDate(
                            post.startDate
                          )
                        }
                      />


                      <ElectionInfo
                        label="Voting End"

                        value={
                          formatDate(
                            post.endDate
                          )
                        }
                      />

                    </div>


                    {/* ETHERSCAN */}

                    {etherscanUrl && (

                      <a
                        href={
                          etherscanUrl
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
                            "14px",

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

                </div>

              );
            }
          )}

        </div>

      )}

    </section>
  );
}


// ============================================================
// SMALL DISPLAY COMPONENT
// ============================================================

function ElectionInfo({
  label,
  value,
}) {
  return (

    <div>

      <div
        style={{
          color:
            "#94a3b8",

          fontSize:
            "11px",

          fontWeight:
            "800",

          textTransform:
            "uppercase",

          letterSpacing:
            "0.04em",

          marginBottom:
            "4px",
        }}
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
        }}
      >
        {value}
      </div>

    </div>

  );
}


export default AllElections;