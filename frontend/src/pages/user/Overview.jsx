import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiCheckSquare,
  FiUserPlus,
  FiBarChart2,
  FiClipboard,
  FiArrowRight,
  FiClock,
  FiUsers,
  FiHome,
  FiActivity,
  FiCreditCard,
  FiCheckCircle,
  FiZap,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useVoting } from "../../context/VotingContext";

function Overview() {
  const navigate = useNavigate();

  const {
    user,
    account,
    walletMismatch,

    institutionCount,
    loadInstitutionCount,

    transactions,
    loadTransactions,

    activeElections,
    upcomingElections,

    activeElectionsLoading,
    loadActiveElections,
    dashboardDataLoaded,
  } = useVoting();

  // =====================================================
// LOAD TRANSACTIONS ONLY ONCE
// =====================================================

useEffect(() => {
  loadTransactions();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


// =====================================================
// LOAD BLOCKCHAIN DASHBOARD DATA
// WHEN WALLET IS AVAILABLE
// =====================================================

useEffect(() => {
  if (!window.ethereum) {
    return;
  }

  if (!account) {
    return;
  }

  // If dashboard blockchain data was already
  // loaded during this session, reuse it.
  if (dashboardDataLoaded) {
    return;
  }

  loadInstitutionCount();
  loadActiveElections();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [account, dashboardDataLoaded]);

  /* =========================================================
     QUICK ACTIONS
     ========================================================= */

  const quickActions = [
    {
      to: "/user/vote",
      title: "Cast Your Vote",
      desc: "Participate in an active election.",
      icon: <FiCheckSquare />,
      className: "purple",
    },
    {
      to: "/user/request",
      title: "Request Candidacy",
      desc: "Apply as a candidate.",
      icon: <FiUserPlus />,
      className: "orange",
    },
    {
      to: "/user/results",
      title: "View Results",
      desc: "See verified election results.",
      icon: <FiBarChart2 />,
      className: "green",
    },
    {
      to: "/user/transactions",
      title: "Transactions",
      desc: "Review your blockchain activity.",
      icon: <FiClipboard />,
      className: "blue",
    },
  ];

  /* =========================================================
     DATE HELPERS
     ========================================================= */

  function formatEndDate(timestamp) {
    if (!timestamp) {
      return "Unknown";
    }

    return new Date(timestamp * 1000).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTransactionDate(transaction) {
    if (!transaction) {
      return null;
    }

    const value =
      transaction.timestamp ||
      transaction.created_at ||
      transaction.createdAt ||
      transaction.date ||
      transaction.time;

    if (!value) {
      return null;
    }

    if (typeof value === "number") {
      return new Date(
        value < 1000000000000 ? value * 1000 : value
      );
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  function timeAgo(date) {
    if (!date) {
      return "Recent Activity";
    }

    const seconds = Math.floor(
      (Date.now() - date.getTime()) / 1000
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString();
  }

  /* =========================================================
     LATEST ACTIVE ELECTIONS
     ========================================================= */

  const latestActiveElections = [...activeElections]
    .sort((a, b) => b.startDate - a.startDate)
    .slice(0, 3);


  const upcomingElectionsCount =
  upcomingElections.length;

  /* =========================================================
     LATEST TRANSACTION
     ========================================================= */

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = getTransactionDate(a)?.getTime() || 0;
    const dateB = getTransactionDate(b)?.getTime() || 0;

    return dateB - dateA;
  });

  const latestTransaction = sortedTransactions[0];

  const lastActivityTime = latestTransaction
    ? timeAgo(getTransactionDate(latestTransaction))
    : "No Activity";

  /* =========================================================
     RECENT ACTIVITY
     ========================================================= */

  const recentTransactions = sortedTransactions.slice(0, 4);

  /* =========================================================
     DASHBOARD STAT CARDS
     ========================================================= */

  const stats = [
    {
      label: "Institutions",
      value: institutionCount,
      icon: <FiHome />,
      type: "purple",
    },
    {
  label: "Active Elections",
  value: activeElections.length,
  icon: <FiCheckSquare />,
  type: "blue",
},
{
  label: "Upcoming Elections",
  value: upcomingElectionsCount,
  icon: <FiClock />,
  type: "cyan",
},
{
  label: "My Transactions",
  value: transactions.length,
  icon: <FiCreditCard />,
  type: "orange",
},
    {
      label: "Last Activity",
      value: lastActivityTime,
      icon: <FiActivity />,
      type: "cyan",
      small: true,
    },
    {
      label: "Wallet Status",
      value: account ? "Connected" : "Not Connected",
      icon: <FiCheckCircle />,
      type: account ? "green" : "red",
      small: true,
    },
  ];

  /* =========================================================
     CHART DATA
     Temporary visual overview using current transaction count.
     We will later connect this to real daily transaction dates.
     ========================================================= */

  /* =========================================================
   REAL VOTING ACTIVITY - LAST 7 DAYS
   Counts only successful vote transactions
   ========================================================= */

const chartData = Array.from({ length: 7 }).map((_, index) => {
  const date = new Date();

  // Start from 6 days ago and finish with today
  date.setDate(date.getDate() - (6 - index));

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const votesForDay = transactions.filter((transaction) => {
    const transactionDate = getTransactionDate(transaction);

    if (!transactionDate) {
      return false;
    }

    /* -----------------------------------------
       Find transaction action/type
       ----------------------------------------- */

    const action = String(
      transaction.action ||
      transaction.type ||
      transaction.event ||
      ""
    ).toLowerCase();

    /* -----------------------------------------
       Only count VOTE transactions
       ----------------------------------------- */

    const isVoteTransaction =
      action === "vote" ||
      action.startsWith("vote ") ||
      action.startsWith("vote -") ||
      action.includes("vote cast");

    /* -----------------------------------------
       Do not count failed transactions
       ----------------------------------------- */

    const isSuccessful =
      String(transaction.status || "success").toLowerCase() !==
      "failed";

    /* -----------------------------------------
       Check whether transaction happened
       during this specific day
       ----------------------------------------- */

    const isSameDay =
      transactionDate >= startOfDay &&
      transactionDate <= endOfDay;

    return (
      isVoteTransaction &&
      isSuccessful &&
      isSameDay
    );
  }).length;

  return {
    day: date.toLocaleDateString([], {
      weekday: "short",
    }),

    date: date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }),

    votes: votesForDay,
  };
});

  return (
    <div className="new-user-overview">
      {/* =====================================================
          WRONG WALLET WARNING
      ===================================================== */}

      {walletMismatch && (
        <div className="dashboard-wallet-warning">
          <strong>Wrong MetaMask wallet connected.</strong>

          <span>
            Please switch to your registered wallet:
          </span>

          <code>{user?.wallet_address}</code>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="dashboard-stats-grid">
  {activeElectionsLoading ? (
    Array.from({ length: 6 }).map((_, index) => (
      <article
        key={index}
        className="dashboard-stat-card dashboard-stat-skeleton-card"
      >
        <div className="dashboard-loading-line dashboard-stat-skeleton-icon" />

        <div className="dashboard-stat-content">
          <div className="dashboard-loading-line dashboard-stat-skeleton-label" />

          <div className="dashboard-loading-line dashboard-stat-skeleton-value" />
        </div>

        <div className="dashboard-loading-line dashboard-stat-skeleton-dot" />
      </article>
    ))
  ) : (
    stats.map((stat) => (
      <article
        key={stat.label}
        className="dashboard-stat-card"
      >
        <div
          className={`dashboard-stat-icon ${stat.type}`}
        >
          {stat.icon}
        </div>

        <div className="dashboard-stat-content">
          <p>{stat.label}</p>

          <h3 className={stat.small ? "small-value" : ""}>
            {stat.value}
          </h3>
        </div>

      </article>
    ))
  )}
</section>

      {/* =====================================================
          ANALYTICS + QUICK ACTIONS
      ===================================================== */}

      <section className="dashboard-main-grid">
        {/* VOTING ACTIVITY */}

        <div className="dashboard-panel voting-activity-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>My Voting Activity</h2>

<p>
  Votes you cast during the last 7 days.
</p>
            </div>

            <span className="dashboard-period">
              Last 7 Days
            </span>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="voteGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#7657e8"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#7657e8"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#343434"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#818181"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />

                <YAxis
                  stroke="#818181"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#202020",
                    border: "1px solid #3a3a3a",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                />

                <Area
  type="monotone"
  dataKey="votes"
  name="Votes"
  stroke="#7657e8"
  strokeWidth={3}
  fill="url(#voteGradient)"
/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="dashboard-panel quick-actions-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Quick Actions</h2>

              <p>
                Access common voting actions.
              </p>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            {quickActions.map((action) => (
              <button
                key={action.to}
                className="dashboard-quick-card"
                onClick={() => navigate(action.to)}
              >
                <div
                  className={`dashboard-quick-icon ${action.className}`}
                >
                  {action.icon}
                </div>

                <div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          ACTIVE ELECTIONS + RECENT ACTIVITY
      ===================================================== */}

      <section className="dashboard-bottom-grid">
        {/* ACTIVE ELECTIONS */}

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Active Elections</h2>

              <p>
                Latest elections currently open for voting.
              </p>
            </div>

            <button
              className="dashboard-view-all"
              onClick={() => navigate("/user/elections")}
            >
              View All
              <FiArrowRight />
            </button>
          </div>

          {activeElectionsLoading ? (
  <div className="dashboard-election-list">
    {[1, 2].map((item) => (
      <article
        key={item}
        className="dashboard-election-row dashboard-election-skeleton-row"
      >
        <div className="dashboard-loading-line dashboard-election-skeleton-avatar" />

        <div className="dashboard-election-details">
          <div className="dashboard-loading-line dashboard-election-skeleton-title" />

          <div className="dashboard-loading-line dashboard-election-skeleton-place" />

          <div className="dashboard-election-meta">
            <div className="dashboard-loading-line dashboard-election-skeleton-meta" />

            <div className="dashboard-loading-line dashboard-election-skeleton-date" />
          </div>
        </div>

        <div className="dashboard-loading-line dashboard-election-skeleton-button" />
      </article>
    ))}
  </div>
) : latestActiveElections.length === 0 ? (
            <div className="dashboard-empty-state">
              No active elections right now.
            </div>
          ) : (
            <div className="dashboard-election-list">
              {latestActiveElections.map((election) => (
                <article
                  className="dashboard-election-row"
                  key={`${election.institutionId}-${election.organizationId}-${election.postId}`}
                >
                  <div className="dashboard-election-avatar">
                    <FiZap />
                  </div>

                  <div className="dashboard-election-details">
                    <div className="dashboard-election-title-row">
                      <h3>{election.title}</h3>

                      <span className="dashboard-active-badge">
                        <span />
                        Active
                      </span>
                    </div>

                    <p>
                      {election.institutionName}
                      {" • "}
                      {election.organizationName}
                    </p>

                    <div className="dashboard-election-meta">
                      <span>
                        <FiUsers />
                        {election.candidateCount} candidates
                      </span>

                      <span>
                        <FiClock />
                        Ends {formatEndDate(election.endDate)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="dashboard-vote-button"
                    onClick={() =>
                      navigate(
                        `/user/vote/${election.institutionId}/${election.organizationId}/${election.postId}`
                      )
                    }
                  >
                    Vote Now
                    <FiArrowRight />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY */}

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recent Activity</h2>

              <p>
                Latest activity from your account.
              </p>
            </div>

            <button
              className="dashboard-view-all"
              onClick={() => navigate("/user/transactions")}
            >
              View All
              <FiArrowRight />
            </button>
          </div>

          {activeElectionsLoading ? (
  <div className="dashboard-activity-list">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="dashboard-activity-row dashboard-activity-skeleton-row"
      >
        <div className="dashboard-loading-line dashboard-activity-skeleton-icon" />

        <div className="dashboard-activity-content">
          <div className="dashboard-loading-line dashboard-activity-skeleton-title" />

          <div className="dashboard-loading-line dashboard-activity-skeleton-text" />
        </div>

        <div className="dashboard-loading-line dashboard-activity-skeleton-time" />
      </div>
    ))}
  </div>
) : recentTransactions.length === 0 ? (
  <div className="dashboard-empty-state">
    No recent activity yet.
  </div>
) : (
            <div className="dashboard-activity-list">
              {recentTransactions.map((transaction, index) => {
                const transactionDate =
                  getTransactionDate(transaction);

                const activityTitle =
                  transaction.action ||
                  transaction.type ||
                  transaction.event ||
                  "Blockchain Transaction";

                return (
                  <div
                    className="dashboard-activity-row"
                    key={
                      transaction.id ||
                      transaction.tx_hash ||
                      transaction.hash ||
                      index
                    }
                  >
                    <div className="dashboard-activity-icon">
                      <FiCheckCircle />
                    </div>

                    <div className="dashboard-activity-content">
                      <h4>{activityTitle}</h4>

                      <p>
                        Transaction successfully recorded.
                      </p>
                    </div>

                    <span className="dashboard-activity-time">
                      {timeAgo(transactionDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Overview;