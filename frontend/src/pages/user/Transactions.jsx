import { useEffect, useState } from "react";
import {
  FiFilter,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useVoting } from "../../context/VotingContext";


// ============================================================
// FORMAT NEPAL TIME
// ============================================================

function formatNepalTime(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  let value = dateValue;

  if (
    typeof value === "string" &&
    !value.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(value)
  ) {
    value = `${value}Z`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}


// ============================================================
// FORMAT ACTION
// ============================================================

function formatTransactionAction(action) {
  if (!action) {
    return "Transaction";
  }

  return String(action)
    .replace(/\s*-\s*/g, " > ")
    .replace(/[()]/g, "");
}


// ============================================================
// NORMALIZE HASH
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


// ============================================================
// SHORT HASH
// ============================================================

function shortHash(value) {
  if (!value) {
    return "N/A";
  }

  const text = String(value);

  if (text.length <= 22) {
    return text;
  }

  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}


// ============================================================
// USER TRANSACTIONS PAGE
// ============================================================

function Transactions() {
  const {
    transactions,
    loadTransactions,
    user,
    transactionError,
    transactionsLoading,
    clearTransactionError,
  } = useVoting();

  const [sortOrder, setSortOrder] =
    useState("newest");

  const [showFilter, setShowFilter] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const transactionsPerPage = 8;


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);


  // =========================================================
  // REFRESH / RETRY
  // =========================================================

  const handleRefresh = async () => {
    if (isRefreshing || transactionsLoading) {
      return;
    }

    setIsRefreshing(true);

    if (clearTransactionError) {
      clearTransactionError();
    }

    try {
      await Promise.all([
        loadTransactions(),
        new Promise((resolve) =>
          setTimeout(resolve, 700)
        ),
      ]);
    } catch (error) {
      console.error(
        "Transaction refresh failed:",
        error
      );
    } finally {
      setIsRefreshing(false);
    }
  };


  // =========================================================
  // SORT
  // =========================================================

  const sortedTransactions = [
    ...transactions,
  ].sort((a, b) => {
    const dateA = a.created_at
      ? new Date(a.created_at).getTime()
      : 0;

    const dateB = b.created_at
      ? new Date(b.created_at).getTime()
      : 0;

    return sortOrder === "newest"
      ? dateB - dateA
      : dateA - dateB;
  });


  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(
    sortedTransactions.length /
      transactionsPerPage
  );

  const startIndex =
    (currentPage - 1) *
    transactionsPerPage;

  const endIndex =
    startIndex + transactionsPerPage;

  const paginatedTransactions =
    sortedTransactions.slice(
      startIndex,
      endIndex
    );


  // =========================================================
  // UI
  // =========================================================

  return (
    <section className="user-panel user-transaction-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="transaction-page-header">
        <div>
          <h2>
            Transaction History
          </h2>

          <p
            style={{
              marginTop: "4px",
              marginBottom: 0,
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            Your transactions are verified directly against Ethereum Sepolia.
          </p>
        </div>

        <div className="filter-box">
          <button
            className="filter-btn"
            onClick={() =>
              setShowFilter(!showFilter)
            }
          >
            <FiFilter />
            Filter
          </button>

          {showFilter && (
            <div className="filter-menu">
              <button
                className={
                  sortOrder === "newest"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setSortOrder("newest");
                  setCurrentPage(1);
                  setShowFilter(false);
                }}
              >
                Newest
              </button>

              <button
                className={
                  sortOrder === "oldest"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setSortOrder("oldest");
                  setCurrentPage(1);
                  setShowFilter(false);
                }}
              >
                Oldest
              </button>
            </div>
          )}
        </div>
      </div>


      {/* =====================================================
          REFRESH BUTTON
      ===================================================== */}

      <button
        className="transaction-refresh-btn"
        onClick={handleRefresh}
        disabled={
          isRefreshing ||
          transactionsLoading
        }
        style={{
          cursor:
            isRefreshing ||
            transactionsLoading
              ? "not-allowed"
              : "pointer",

          opacity:
            isRefreshing ||
            transactionsLoading
              ? 0.7
              : 1,
        }}
      >
        {isRefreshing ||
        transactionsLoading
          ? "Refreshing Transactions..."
          : "Refresh Transactions"}
      </button>


      {/* =====================================================
          BACKEND OFFLINE / LOAD ERROR
      ===================================================== */}

      {transactionError && (
        <div style={errorBoxStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <FiAlertCircle
              size={18}
              style={{
                color: "#f59e0b",
                flexShrink: 0,
                marginTop: "1px",
              }}
            />

            <div>
              <div
                style={{
                  color: "#f8fafc",
                  fontSize: "14px",
                  fontWeight: "800",
                  marginBottom: "5px",
                }}
              >
                Unable to Load Transaction History
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                {transactionError}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#4ade80",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                Your existing blockchain records are not deleted.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              isRefreshing ||
              transactionsLoading
            }
            style={retryButtonStyle}
          >
            <FiRefreshCw size={13} />

            {isRefreshing ||
            transactionsLoading
              ? "Retrying..."
              : "Retry"}
          </button>
        </div>
      )}


      {/* =====================================================
          TRANSACTION LIST
      ===================================================== */}

      {transactionsLoading ? (

  <div className="transaction-history-list">

    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="transaction-history-card transaction-skeleton-card"
      >

        {/* LEFT */}
        <div className="transaction-skeleton-left">

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-title
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-detail
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-detail-wide
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-detail
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-hash
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-wallet
            "
          />

        </div>


        {/* RIGHT */}
        <div className="transaction-skeleton-right">

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-badge
            "
          />

          <div
            className="
              dashboard-loading-line
              transaction-skeleton-block
            "
          />

        </div>

      </div>
    ))}

  </div>

) : sortedTransactions.length === 0 ? (

  !transactionError && (
    <div className="empty-box">
      No transactions found.
    </div>
  )

) : (
        <div className="transaction-history-list">
          {paginatedTransactions.map((tx) => {
            const txHash =
              normalizeTxHash(tx.tx_hash);

            const etherscanUrl =
              tx.etherscan_url ||
              (
                txHash
                  ? `https://sepolia.etherscan.io/tx/${txHash}`
                  : ""
              );

            const verified =
              tx.blockchain_verified === true;

            return (
              <div
                className="transaction-history-card"
                key={tx.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                  padding:
                    "9px 12px",
                }}
              >
                {/* LEFT SIDE */}

                <div
                  className="transaction-history-info"
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: "14px",
                    }}
                  >
                    {formatTransactionAction(
                      tx.action
                    )}
                  </h3>

                  <p style={detailStyle}>
                    <b>Name:</b>{" "}
                    {tx.role === "admin"
                      ? "Election Admin"
                      : tx.full_name || "N/A"}
                  </p>

                  {tx.role !== "admin" && (
                    <p style={detailStyle}>
                      <b>Email:</b>{" "}
                      {tx.email || "N/A"}
                    </p>
                  )}

                  <p style={detailStyle}>
                    <b>Role:</b>{" "}
                    {tx.role || "N/A"}
                  </p>

                  <p style={detailStyle}>
                    <b>Tx Hash:</b>{" "}
                    <span
                      title={txHash}
                      style={{
                        color: "#38bdf8",
                        fontFamily: "monospace",
                        fontSize: "11px",
                      }}
                    >
                      {shortHash(txHash)}
                    </span>
                  </p>

                  <p style={detailStyle}>
                    <b>Wallet:</b>{" "}
                    <span
                      style={{
                        color: "#4ade80",
                        fontWeight: "600",
                        wordBreak: "break-all",
                      }}
                    >
                      {tx.from_address ||
                        "N/A"}
                    </span>
                  </p>

                  <p style={detailStyle}>
                    <b>App Status:</b>{" "}
                    <span
                      style={{
                        color:
                          String(
                            tx.status
                          ).toLowerCase() ===
                          "success"
                            ? "#4ade80"
                            : "#f87171",
                        fontWeight: "700",
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {tx.status || "N/A"}
                    </span>
                  </p>

                  <p style={detailStyle}>
                    <b>Time (NPT):</b>{" "}
                    {formatNepalTime(
                      tx.created_at
                    )}
                  </p>

                  {etherscanUrl && (
                    <a
                      href={etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        marginTop: "6px",
                        color: "#38bdf8",
                        fontSize: "10px",
                        fontWeight: "700",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <FiExternalLink size={11} />

                      View on Sepolia Etherscan
                    </a>
                  )}
                </div>


                {/* RIGHT SIDE */}

                <div
                  style={{
                    width: "215px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 7px",
                        borderRadius: "20px",

                        border:
                          verified
                            ? "1px solid rgba(34,197,94,0.35)"
                            : "1px solid rgba(248,113,113,0.35)",

                        background:
                          verified
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",

                        color:
                          verified
                            ? "#4ade80"
                            : "#f87171",

                        fontSize: "9px",
                        fontWeight: "800",
                      }}
                    >
                      {verified
                        ? "On-Chain"
                        : "Unverified"}
                    </span>
                  </div>


                  <div
                    style={{
                      padding: "6px 8px",
                      borderRadius: "7px",

                      border:
                        verified
                          ? "1px solid rgba(34,197,94,0.32)"
                          : "1px solid rgba(248,113,113,0.32)",

                      background:
                        verified
                          ? "rgba(34,197,94,0.07)"
                          : "rgba(239,68,68,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "5px",

                        color:
                          verified
                            ? "#4ade80"
                            : "#f87171",

                        fontSize: "10px",
                        fontWeight: "800",
                      }}
                    >
                      {verified ? (
                        <FiCheckCircle
                          size={11}
                        />
                      ) : (
                        <FiAlertCircle
                          size={11}
                        />
                      )}

                      {verified
                        ? "Verified On-Chain"
                        : "Verification Unavailable"}
                    </div>


                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1.15fr 1fr 0.85fr",
                        gap: "4px",
                      }}
                    >
                      <BlockchainInfo
                        label="Network"
                        value="Sepolia"
                      />

                      <BlockchainInfo
                        label="Block"
                        value={
                          tx.block_number
                            ? `#${tx.block_number}`
                            : "N/A"
                        }
                      />

                      <BlockchainInfo
                        label="Confirms"
                        value={
                          tx.confirmations ?? 0
                        }
                      />
                    </div>
                  </div>
                </div>


              </div>
            );
          })}
        </div>
      )}


      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {totalPages > 1 && (
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(page - 1, 1)
              )
            }
            style={{
              border: "none",
              background: "transparent",
              color:
                currentPage === 1
                  ? "#4b5563"
                  : "#94a3b8",
              fontSize: "18px",
              cursor:
                currentPage === 1
                  ? "default"
                  : "pointer",
              padding: "4px 6px",
            }}
          >
            ‹
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    setCurrentPage(pageNumber)
                  }
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border:
                      currentPage === pageNumber
                        ? "1px solid rgba(56,189,248,0.35)"
                        : "1px solid transparent",
                    background:
                      currentPage === pageNumber
                        ? "rgba(56,189,248,0.10)"
                        : "transparent",
                    color:
                      currentPage === pageNumber
                        ? "#38bdf8"
                        : "#94a3b8",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {pageNumber}
                </button>
              );
            }
          )}

          <button
            type="button"
            disabled={
              currentPage >= totalPages
            }
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(
                  page + 1,
                  totalPages
                )
              )
            }
            style={{
              border: "none",
              background: "transparent",
              color:
                currentPage >= totalPages
                  ? "#4b5563"
                  : "#94a3b8",
              fontSize: "18px",
              cursor:
                currentPage >= totalPages
                  ? "default"
                  : "pointer",
              padding: "4px 6px",
            }}
          >
            ›
          </button>
        </div>
      )}

    </section>
  );
}


// ============================================================
// BLOCKCHAIN INFO
// ============================================================

function BlockchainInfo({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={{
          color: "#94a3b8",
          fontSize: "7px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          marginBottom: "1px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#e2e8f0",
          fontSize: "8.5px",
          fontWeight: "600",
          lineHeight: "1.15",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const detailStyle = {
  margin: "2px 0",
  fontSize: "11px",
  lineHeight: "1.25",
};


const errorBoxStyle = {
  marginTop: "14px",
  marginBottom: "14px",

  padding: "13px 14px",

  borderRadius: "10px",

  border:
    "1px solid rgba(245,158,11,0.30)",

  background:
    "rgba(245,158,11,0.07)",

  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  gap: "18px",
};


const retryButtonStyle = {
  flexShrink: 0,

  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  gap: "6px",

  padding: "8px 13px",

  borderRadius: "7px",

  border:
    "1px solid rgba(56,189,248,0.35)",

  background:
    "rgba(56,189,248,0.10)",

  color: "#38bdf8",

  fontSize: "11px",
  fontWeight: "800",

  cursor: "pointer",
};


export default Transactions;