import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiClock,
  FiExternalLink,
  FiFilter,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";

import {
  useAdmin,
} from "../../context/AdminContext";


// ============================================================
// TRANSACTION HASH
// ============================================================

function normalizeTxHash(txHash) {
  if (!txHash) {
    return "";
  }

  const hash =
    String(txHash).trim();

  if (
    hash.startsWith("0x")
  ) {
    return hash;
  }

  return `0x${hash}`;
}


// ============================================================
// TRANSACTION DATE
// ============================================================

function getTransactionTime(tx) {
  if (!tx?.created_at) {
    return 0;
  }

  const raw =
    tx.created_at;

  // Number timestamp
  if (
    typeof raw === "number"
  ) {
    // Seconds
    if (
      raw < 100000000000
    ) {
      return raw * 1000;
    }

    // Milliseconds
    return raw;
  }

  const parsed =
    new Date(raw).getTime();

  return Number.isNaN(parsed)
    ? 0
    : parsed;
}


// ============================================================
// LOADING ROW
// ============================================================

function ElectionLoadingRow() {
  return (
    <div className="admin-election-row">

      <div className="admin-election-status-area">

        <div className="admin-election-skeleton admin-election-skeleton-status" />

      </div>


      <div className="admin-election-main">

        <div className="admin-election-skeleton admin-election-skeleton-title" />

        <div className="admin-election-skeleton admin-election-skeleton-location" />


        <div className="admin-election-meta">

          <div className="admin-election-skeleton admin-election-skeleton-meta" />

          <div className="admin-election-skeleton admin-election-skeleton-meta" />

          <div className="admin-election-skeleton admin-election-skeleton-date" />

        </div>

      </div>


      <div className="admin-election-skeleton admin-election-skeleton-button" />

    </div>
  );
}


// ============================================================
// ALL ELECTIONS
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
  // CURRENT TIME
  // ==========================================================

  const currentTime =
    Math.floor(
      Date.now() / 1000
    );


  // ==========================================================
  // DATE
  // ==========================================================

  function formatDate(timestamp) {
    if (
      !timestamp ||
      Number(timestamp) <= 0
    ) {
      return "N/A";
    }

    return new Date(
      Number(timestamp) * 1000
    ).toLocaleString(
      [],
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  function getElectionStatus(
    post
  ) {
    const startDate =
      Number(
        post.startDate || 0
      );

    const endDate =
      Number(
        post.endDate || 0
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
  }


  // ==========================================================
  // FIND CREATE TRANSACTION
  // ==========================================================

  function getElectionTransaction(
    post
  ) {
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


    const matchingTransactions =
      transactions.filter(
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
            !action.includes(
              institution
            )
          ) {
            return false;
          }


          if (
            organization &&
            !action.includes(
              organization
            )
          ) {
            return false;
          }


          return true;
        }
      );


    if (
      matchingTransactions.length === 0
    ) {
      return null;
    }


    // Most recent matching transaction
    return [
      ...matchingTransactions,
    ].sort(
      (a, b) =>
        getTransactionTime(b) -
        getTransactionTime(a)
    )[0];
  }


  // ==========================================================
  // ELECTIONS + TRANSACTION DATA
  // ==========================================================

  const elections =
    useMemo(() => {
      return allPostsList.map(
        (post) => {
          const tx =
            getElectionTransaction(
              post
            );

          return {
            ...post,

            status:
              getElectionStatus(
                post
              ),

            transaction:
              tx,

            createdTime:
              getTransactionTime(
                tx
              ),
          };
        }
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      allPostsList,
      transactions,
      currentTime,
    ]);


  // ==========================================================
  // FILTER + NEWEST CREATED FIRST
  // ==========================================================

  const filteredPosts =
    useMemo(() => {

      const filtered =
        elections.filter(
          (post) => {
            if (
              filterStatus ===
              "all"
            ) {
              return true;
            }

            return (
              post.status ===
              filterStatus
            );
          }
        );


      return [
        ...filtered,
      ].sort(
        (a, b) => {

          // ===============================================
          // 1. PRIMARY:
          // Transaction creation time
          // ===============================================

          if (
            b.createdTime !==
            a.createdTime
          ) {
            return (
              b.createdTime -
              a.createdTime
            );
          }


          // ===============================================
          // 2. FALLBACK:
          // Newer blockchain hierarchy first
          // ===============================================

          if (
            Number(
              b.institutionId
            ) !==
            Number(
              a.institutionId
            )
          ) {
            return (
              Number(
                b.institutionId
              ) -
              Number(
                a.institutionId
              )
            );
          }


          if (
            Number(
              b.organizationId
            ) !==
            Number(
              a.organizationId
            )
          ) {
            return (
              Number(
                b.organizationId
              ) -
              Number(
                a.organizationId
              )
            );
          }


          return (
            Number(
              b.id || b.postId || 0
            ) -
            Number(
              a.id || a.postId || 0
            )
          );
        }
      );

    }, [
      elections,
      filterStatus,
    ]);


  // ==========================================================
  // COUNTS
  // ==========================================================

  const activeCount =
    elections.filter(
      (post) =>
        post.status ===
        "active"
    ).length;


  const upcomingCount =
    elections.filter(
      (post) =>
        post.status ===
        "upcoming"
    ).length;


  const closedCount =
    elections.filter(
      (post) =>
        post.status ===
        "closed"
    ).length;


  // ==========================================================
  // REFRESH
  // ==========================================================

  async function handleRefreshElections() {
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
  }


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
    <section className="panel admin-all-elections-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-elections-header">

        <div>

          <h2>
            All Elections
          </h2>

          <p>
            View and manage all blockchain election posts.
            Newly created elections appear first.
          </p>

        </div>


        <button
          type="button"

          className="secondary-btn"

          onClick={
            handleRefreshElections
          }

          disabled={
            electionsLoading
          }
        >

          <FiRefreshCw
            className={
              electionsLoading
                ? "admin-election-refresh spinning"
                : "admin-election-refresh"
            }
          />

          {electionsLoading
            ? "Refreshing..."
            : "Refresh Elections"}

        </button>

      </div>


      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="admin-election-filter-bar">

        <button
          type="button"

          className={
            filterStatus === "all"
              ? "admin-election-filter-btn active"
              : "admin-election-filter-btn"
          }

          onClick={() =>
            setFilterStatus(
              "all"
            )
          }
        >
          All

          <span>
            {elections.length}
          </span>
        </button>


        <button
          type="button"

          className={
            filterStatus === "active"
              ? "admin-election-filter-btn active"
              : "admin-election-filter-btn"
          }

          onClick={() =>
            setFilterStatus(
              "active"
            )
          }
        >
          Active

          <span>
            {activeCount}
          </span>
        </button>


        <button
          type="button"

          className={
            filterStatus === "upcoming"
              ? "admin-election-filter-btn active"
              : "admin-election-filter-btn"
          }

          onClick={() =>
            setFilterStatus(
              "upcoming"
            )
          }
        >
          Upcoming

          <span>
            {upcomingCount}
          </span>
        </button>


        <button
          type="button"

          className={
            filterStatus === "closed"
              ? "admin-election-filter-btn active"
              : "admin-election-filter-btn"
          }

          onClick={() =>
            setFilterStatus(
              "closed"
            )
          }
        >
          Closed

          <span>
            {closedCount}
          </span>
        </button>

      </div>


      {/* =====================================================
          ELECTION LIST
      ===================================================== */}

      {electionsLoading ? (

        <div className="admin-election-list">

          {[1, 2, 3, 4].map(
            (item) => (

              <ElectionLoadingRow
                key={item}
              />

            )
          )}

        </div>

      ) : filteredPosts.length ===
        0 ? (

        <div className="admin-election-empty">

          {filterStatus === "all"
            ? "No elections found."
            : `No ${filterStatus} elections found.`}

        </div>

      ) : (

        <div className="admin-election-list">

          {filteredPosts.map(
            (post) => {

              const txHash =
                normalizeTxHash(
                  post.transaction
                    ?.tx_hash
                );


              const etherscanUrl =
                txHash
                  ? `https://sepolia.etherscan.io/tx/${txHash}`
                  : "";


              return (

                <div
                  className="admin-election-row"

                  key={
                    `${post.institutionId}-${post.organizationId}-${post.id}`
                  }
                >


                  {/* STATUS */}

                  <div className="admin-election-status-area">

                    <span
                      className={
                        `admin-election-status ${post.status}`
                      }
                    >

                      {post.status ===
                      "active"
                        ? "Active"
                        : post.status ===
                          "upcoming"
                        ? "Upcoming"
                        : post.status ===
                          "closed"
                        ? "Closed"
                        : "Unknown"}

                    </span>

                  </div>


                  {/* MAIN */}

                  <div className="admin-election-main">

                    <h3>
                      {post.title}
                    </h3>


                    <p className="admin-election-location">

                      {post.institutionName ||
                        "Unknown Institution"}

                      <span>
                        •
                      </span>

                      {post.organizationName ||
                        "Unknown Organization"}

                    </p>


                    <div className="admin-election-meta">

                      <span>
                        <FiUsers />

                        {post.candidateCount ??
                          0}{" "}
                        candidates
                      </span>


                      <span>
                        Seats:{" "}

                        {post.seatLimit ??
                          "N/A"}
                      </span>


                      <span>
                        <FiClock />

                        {post.status ===
                        "upcoming"
                          ? `Starts ${formatDate(
                              post.startDate
                            )}`
                          : `Ends ${formatDate(
                              post.endDate
                            )}`}
                      </span>

                    </div>

                  </div>


                  {/* ETHERSCAN */}

                  <div className="admin-election-action-area">

                    {etherscanUrl ? (

                      <a
                        href={
                          etherscanUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        className="admin-election-action"
                      >

                        <FiExternalLink />

                        View on Sepolia Etherscan

                      </a>

                    ) : (

                      <span className="admin-election-no-tx">
                        No Tx
                      </span>

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


export default AllElections;