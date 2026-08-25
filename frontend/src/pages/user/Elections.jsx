import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiUsers,
} from "react-icons/fi";
import { useVoting } from "../../context/VotingContext";

function Elections() {
  const navigate = useNavigate();

  const {
    getContract,
    setMessage,
    account,
  } = useVoting();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAllElections();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  async function loadAllElections() {
    setLoading(true);

    try {
      const contract = await getContract();

      if (!contract) {
        setElections([]);
        setLoading(false);
        return;
      }

      const institutionCount = Number(
        await contract.institutionCount()
      );

      const temp = [];

      const now = Math.floor(Date.now() / 1000);

      // =====================================================
      // INSTITUTIONS
      // =====================================================

      for (
        let institutionId = 1;
        institutionId <= institutionCount;
        institutionId++
      ) {
        const institution =
          await contract.institutions(institutionId);

        const institutionName = institution.name;

        const organizationCount = Number(
          institution.organizationCount
        );

        // ===================================================
        // ORGANIZATIONS
        // ===================================================

        for (
          let organizationId = 1;
          organizationId <= organizationCount;
          organizationId++
        ) {
          const organization =
            await contract.getOrganization(
              institutionId,
              organizationId
            );

          const organizationName = organization[1];
const organizationExists = organization[2];
const postCount = Number(organization[3]);

          if (!organizationExists) {
            continue;
          }

          // =================================================
          // POSTS / ELECTIONS
          // =================================================

          for (
            let postId = 1;
            postId <= postCount;
            postId++
          ) {
            const post = await contract.getPost(
              institutionId,
              organizationId,
              postId
            );

            const startDate = Number(post.votingStart);
const endDate = Number(post.votingEnd);

            let status = "upcoming";

            if (
              now >= startDate &&
              now <= endDate
            ) {
              status = "active";
            } else if (now > endDate) {
              status = "closed";
            }

            temp.push({
              institutionId,
              institutionName,

              organizationId,
              organizationName,

              postId,

              title: post.title,
seatLimit: Number(post.seatCount),
candidateCount: Number(post.candidateCount),

              startDate,
              endDate,
              status,
            });
          }
        }
      }

      // Newest created elections first
temp.sort((a, b) => {
  // Newer institution first
  if (b.institutionId !== a.institutionId) {
    return b.institutionId - a.institutionId;
  }

  // Newer organization first
  if (b.organizationId !== a.organizationId) {
    return b.organizationId - a.organizationId;
  }

  // Newer post/election first
  return b.postId - a.postId;
});

      setElections(temp);
      setMessage("");
    } catch (err) {
      console.error(err);

      setElections([]);
      setMessage("Failed to load elections");
    }

    setLoading(false);
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filteredElections = useMemo(() => {
    if (filter === "all") {
      return elections;
    }

    return elections.filter(
      (election) => election.status === filter
    );
  }, [elections, filter]);

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount = elections.filter(
    (election) => election.status === "active"
  ).length;

  const closedCount = elections.filter(
    (election) => election.status === "closed"
  ).length;

  const upcomingCount = elections.filter(
    (election) => election.status === "upcoming"
  ).length;

  // =====================================================
  // DATE
  // =====================================================

  function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // =====================================================
  // OPEN ELECTION
  // =====================================================

  function openElection(election) {
    if (election.status === "active") {
      navigate(
        `/user/vote/${election.institutionId}/${election.organizationId}/${election.postId}`
      );

      return;
    }

    if (election.status === "closed") {
      navigate(
        `/user/results/${election.institutionId}/${election.organizationId}/${election.postId}`
      );
    }
  }

  return (
    <section className="user-panel elections-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="all-elections-header">
        <div>
          <button
  className="small-btn elections-back-btn"
  onClick={() => navigate("/user")}
>
  <FiArrowLeft />
  Back
</button>

          <h2>All Elections</h2>

          <p>
            View active, upcoming and completed elections.
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="election-filter-bar">
        <button
          className={
            filter === "all"
              ? "election-filter-btn active"
              : "election-filter-btn"
          }
          onClick={() => setFilter("all")}
        >
          All
          <span>{elections.length}</span>
        </button>

        <button
          className={
            filter === "active"
              ? "election-filter-btn active"
              : "election-filter-btn"
          }
          onClick={() => setFilter("active")}
        >
          Active
          <span>{activeCount}</span>
        </button>

        <button
          className={
            filter === "upcoming"
              ? "election-filter-btn active"
              : "election-filter-btn"
          }
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
          <span>{upcomingCount}</span>
        </button>

        <button
          className={
            filter === "closed"
              ? "election-filter-btn active"
              : "election-filter-btn"
          }
          onClick={() => setFilter("closed")}
        >
          Closed
          <span>{closedCount}</span>
        </button>
      </div>

      {/* =====================================================
          ELECTIONS
      ===================================================== */}

      {loading ? (
  <div className="all-election-list">

    {[1, 2, 3, 4].map((item) => (
      <div
        className="all-election-row"
        key={item}
      >

        {/* STATUS SKELETON */}
        <div className="all-election-status-area">

          <div
            className="
              dashboard-loading-line
              election-list-skeleton-status
            "
          />

        </div>


        {/* MAIN CONTENT SKELETON */}
        <div className="all-election-main">

          <div
            className="
              dashboard-loading-line
              election-list-skeleton-title
            "
          />


          <div
            className="
              dashboard-loading-line
              election-list-skeleton-location
            "
          />


          <div className="all-election-meta">

            <div
              className="
                dashboard-loading-line
                election-list-skeleton-meta
              "
            />

            <div
              className="
                dashboard-loading-line
                election-list-skeleton-meta-small
              "
            />

            <div
              className="
                dashboard-loading-line
                election-list-skeleton-date
              "
            />

          </div>

        </div>


        {/* BUTTON SKELETON */}
        <div
          className="
            dashboard-loading-line
            election-list-skeleton-button
          "
        />

      </div>
    ))}

  </div>
) : filteredElections.length === 0 ? (
        <div className="empty-box">
          No elections found.
        </div>
      ) : (
        <div className="all-election-list">
          {filteredElections.map((election) => (
            <div
              className="all-election-row"
              key={`${election.institutionId}-${election.organizationId}-${election.postId}`}
            >
              <div className="all-election-status-area">
                <span
                  className={`all-election-status ${election.status}`}
                >
                  {election.status === "active"
                    ? "Active"
                    : election.status === "closed"
                    ? "Closed"
                    : "Upcoming"}
                </span>
              </div>

              <div className="all-election-main">
                <h3>{election.title}</h3>

                <p className="all-election-location">
                  {election.institutionName}

                  <span>•</span>

                  {election.organizationName}
                </p>

                <div className="all-election-meta">
                  <span>
                    <FiUsers />
                    {election.candidateCount} candidates
                  </span>

                  <span>
                    Vote limit: {election.seatLimit}
                  </span>

                  <span>
                    <FiClock />

                    {election.status === "upcoming"
                      ? `Starts ${formatDate(
                          election.startDate
                        )}`
                      : `Ends ${formatDate(
                          election.endDate
                        )}`}
                  </span>
                </div>
              </div>

              {election.status === "active" ? (
                <button
                  className="all-election-action active"
                  onClick={() => openElection(election)}
                >
                  Vote
                  <FiArrowRight />
                </button>
              ) : election.status === "closed" ? (
                <button
                  className="all-election-action"
                  onClick={() => openElection(election)}
                >
                  Results
                  <FiArrowRight />
                </button>
              ) : (
                <button
                  className="all-election-action"
                  disabled
                >
                  Not Started
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Elections;