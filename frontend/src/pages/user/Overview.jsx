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
} from "react-icons/fi";
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
  activeElectionsLoading,
  loadActiveElections,
} = useVoting();

  useEffect(() => {
    if (window.ethereum) {
      loadInstitutionCount();
      loadActiveElections();
    }

    loadTransactions();

    const interval = setInterval(() => {
      loadTransactions();
    }, 3000);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const cards = [
    {
      to: "/user/vote",
      title: "Cast Your Vote",
      desc: "Browse open elections and vote securely on the blockchain.",
      icon: <FiCheckSquare className="overview-icon" />,
    },
    {
      to: "/user/request",
      title: "Request Candidacy",
      desc: "Apply to become a candidate for an open post.",
      icon: <FiUserPlus className="overview-icon" />,
    },
    {
  to: "/user/results",
  title: "View Results",
  desc: "View verified election results after voting has ended.",
  icon: <FiBarChart2 className="overview-icon" />,
},
    {
      to: "/user/transactions",
      title: "My Transactions",
      desc: "Review every vote and request you've submitted on-chain.",
      icon: <FiClipboard className="overview-icon" />,
    },
  ];

  function formatEndDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTransactionDate(transaction) {
    if (!transaction) return null;

    const value =
      transaction.timestamp ||
      transaction.created_at ||
      transaction.createdAt ||
      transaction.date ||
      transaction.time;

    if (!value) return null;

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

  // =====================================================
  // CURRENT USER'S TRANSACTIONS ONLY
  // =====================================================



  // =====================================================
  // ONLY 3 LATEST ACTIVE ELECTIONS
  // =====================================================

  const latestActiveElections = [...activeElections]
    .sort((a, b) => b.startDate - a.startDate)
    .slice(0, 3);

  // =====================================================
  // LATEST TRANSACTION ONLY FOR CURRENT USER
  // =====================================================

  const latestTransaction = [...transactions]
    .sort((a, b) => {
      const dateA = getTransactionDate(a)?.getTime() || 0;
      const dateB = getTransactionDate(b)?.getTime() || 0;

      return dateB - dateA;
    })[0];

  const lastActivityTime = latestTransaction
    ? timeAgo(getTransactionDate(latestTransaction))
    : "No Activity";

  // =====================================================
  // TEMPORARY DEBUG
  // =====================================================

  console.log("CONNECTED ACCOUNT:", account);
  console.log("FIRST TRANSACTION OBJECT:", transactions[0]);
  console.log("ALL TRANSACTIONS:", transactions);
  

  return (
  <div className="overview-page">
    {walletMismatch && (
      <div className="empty-box">
        Wrong MetaMask wallet connected. Please switch to your registered wallet:{" "}
        {user?.wallet_address}
      </div>
    )}
      {/* ================= STATS ================= */}

      <div className="user-stats-grid">
        <div className="user-stat-card">
          <span>Institutions</span>
          <h3>{institutionCount}</h3>
        </div>

        <div className="user-stat-card">
          <span>Active Elections</span>
          <h3>{activeElections.length}</h3>
        </div>

        <div className="user-stat-card">
          <span>My Transactions</span>
          <h3>{transactions.length}</h3>
        </div>

        <div className="user-stat-card">
          <span>Last Activity</span>
          <h3>{lastActivityTime}</h3>
        </div>

        <div className="user-stat-card">
          <span>Wallet Status</span>

          <h3
            className={
              account
                ? "wallet-connected-text"
                : "wallet-disconnected-text"
            }
          >
            {account ? "Connected" : "Not Connected"}
          </h3>
        </div>
      </div>

      {/* ================= ACTIVE ELECTIONS ================= */}

      <div className="active-election-section">
        <div className="active-election-header">
          <div>
            <h2>Active Elections</h2>
            <p>Latest elections currently open for voting.</p>
          </div>

          <button
            className="small-btn"
            onClick={() => navigate("/user/elections")}
          >
            View All
          </button>
        </div>

        {activeElectionsLoading ? (
          <div className="empty-box">
            Loading active elections...
          </div>
        ) : latestActiveElections.length === 0 ? (
          <div className="empty-box">
            No active elections right now.
          </div>
        ) : (
          <div className="overview-election-grid">
            {latestActiveElections.map((election) => (
              <div
                className="overview-election-card"
                key={`${election.institutionId}-${election.organizationId}-${election.postId}`}
              >
                <div className="overview-election-card-top">
                  <span className="overview-election-live">
                    <span className="overview-election-live-dot" />
                    Active
                  </span>
                </div>

                <div className="overview-election-content">
                  <h3>{election.title}</h3>

                  <p className="overview-election-place">
                    {election.institutionName}

                    <span>•</span>

                    {election.organizationName}
                  </p>

                  <div className="overview-election-info">
                    <div>
                      <FiUsers />

                      <span>
                        {election.candidateCount} candidates
                      </span>
                    </div>

                    <div>
                      <FiClock />

                      <span>
                        Ends {formatEndDate(election.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="overview-election-vote"
                  onClick={() =>
                    navigate(
                      `/user/vote/${election.institutionId}/${election.organizationId}/${election.postId}`
                    )
                  }
                >
                  Vote Now
                  <FiArrowRight />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <div className="section-heading">
        <h2>What would you like to do?</h2>
        <p>Pick an action below to get started.</p>
      </div>

      <div className="overview-grid">
        {cards.map((card) => (
          <button
            key={card.to}
            className="overview-card"
            onClick={() => navigate(card.to)}
          >
            <div className="overview-card-icon">
              {card.icon}
            </div>

            <div className="overview-card-text">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>

            <FiArrowRight className="overview-card-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Overview;