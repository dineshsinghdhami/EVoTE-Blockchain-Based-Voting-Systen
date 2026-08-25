import { useEffect } from "react";
import {
  FiAward,
  FiUsers,
  FiCheckCircle,
  FiBarChart2,
  FiActivity,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

import { API_URL } from "../../config";
import { useAdmin } from "../../context/AdminContext";

const COLORS = [
  "#158aa3",
  "#2f80ed",
  "#0f9f9a",
  "#f97316",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#22c55e",
  "#ef4444",
  "#8b5cf6",
];

function CandidateAvatar({ candidate, size = 38 }) {
  const firstLetter = candidate?.name?.trim()?.charAt(0)?.toUpperCase() || "C";

  if (candidate?.photo) {
    const photoSource = candidate.photo.startsWith("http")
      ? candidate.photo
      : `${API_URL}/${candidate.photo}`;

    return (
      <img
        src={photoSource}
        alt={candidate.name || "Candidate"}
        className="results-candidate-avatar"
        style={{ width: size, height: size }}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget.nextElementSibling;
          if (fallback) fallback.style.display = "grid";
        }}
      />
    );
  }

  return (
    <div
      className="results-avatar-fallback"
      style={{ width: size, height: size }}
      aria-label={candidate?.name || "Candidate"}
    >
      {firstLetter}
    </div>
  );
}

function CandidateAvatarWithFallback({ candidate, size = 38 }) {
  if (!candidate?.photo) {
    return <CandidateAvatar candidate={candidate} size={size} />;
  }

  return (
    <div className="results-avatar-shell" style={{ width: size, height: size }}>
      <CandidateAvatar candidate={candidate} size={size} />
      <div
        className="results-avatar-fallback"
        style={{ width: size, height: size, display: "none" }}
      >
        {candidate?.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
      </div>
    </div>
  );
}


function CandidateChartTick({ x, y, payload, index, candidates }) {
  const candidate = candidates?.[index] ||
    candidates?.find((item) => item.name === payload?.value);

  if (!candidate) return null;

  const shortName = (() => {
    const name = candidate.name || "Candidate";
    if (name.length <= 14) return name;
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return `${name.slice(0, 13)}…`;
  })();

  return (
    <foreignObject
      x={x - 48}
      y={y + 8}
      width={96}
      height={78}
      style={{ overflow: "visible" }}
    >
      <div xmlns="http://www.w3.org/1999/xhtml" className="results-chart-candidate-tick">
        <CandidateAvatarWithFallback candidate={candidate} size={34} />
        <span title={candidate.name}>{shortName}</span>
      </div>
    </foreignObject>
  );
}

function ResultsSkeleton() {
  return (
    <div className="results-loading-wrap">
      <div className="results-summary-grid">
        {[1, 2, 3].map((item) => (
          <div className="results-stat-card" key={item}>
            <div className="results-skeleton results-skeleton-icon" />
            <div style={{ flex: 1 }}>
              <div className="results-skeleton" style={{ width: "42%", height: 10 }} />
              <div
                className="results-skeleton"
                style={{ width: "62%", height: 24, marginTop: 10 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="results-main-grid">
        <div className="results-card results-chart-card">
          <div className="results-skeleton" style={{ width: 150, height: 18 }} />
          <div
            className="results-skeleton"
            style={{ width: "100%", height: 330, marginTop: 24 }}
          />
        </div>

        <div className="results-card">
          <div className="results-skeleton" style={{ width: 150, height: 18 }} />
          {[1, 2, 3, 4].map((item) => (
            <div className="results-skeleton-row" key={item}>
              <div className="results-skeleton results-skeleton-avatar" />
              <div style={{ flex: 1 }}>
                <div className="results-skeleton" style={{ width: "55%", height: 12 }} />
                <div
                  className="results-skeleton"
                  style={{ width: "100%", height: 8, marginTop: 12 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="results-chart-tooltip">
      <strong>{item.name}</strong>
      <span>{item.votes} {item.votes === 1 ? "vote" : "votes"}</span>
      <small>{item.percentage.toFixed(2)}%</small>
    </div>
  );
}

function Results() {
  const {
    selectedInstitutionId,
    selectedOrganizationId,
    selectedPostId,
    loadCandidates,
    results,
    resultData,
    totalResultVotes,
    winner,
    isTie,
    topCandidates,
    resultsLoading,
  } = useAdmin();

  useEffect(() => {
    if (
      selectedInstitutionId &&
      selectedOrganizationId &&
      selectedPostId
    ) {
      loadCandidates(
        selectedInstitutionId,
        selectedOrganizationId,
        selectedPostId
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstitutionId, selectedOrganizationId, selectedPostId]);

  if (
    !selectedInstitutionId ||
    !selectedOrganizationId ||
    !selectedPostId
  ) {
    return (
      <section className="panel admin-results-page modern-results-page">
        <div className="results-empty-state">
          <FiBarChart2 />
          <h3>Election Results</h3>
          <p>Select an institution, organization and post above to view results.</p>
        </div>
      </section>
    );
  }

  const rankedCandidates = [...resultData]
    .map((candidate) => ({
      ...candidate,
      percentage:
        totalResultVotes === 0
          ? 0
          : (candidate.voteCount / totalResultVotes) * 100,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  const chartData = rankedCandidates.map((candidate, index) => ({
    ...candidate,
    votes: candidate.voteCount,
    color: COLORS[index % COLORS.length],
  }));

  const winnerPercentage = winner
    ? totalResultVotes === 0
      ? 0
      : (winner.voteCount / totalResultVotes) * 100
    : 0;

  const statusText = isTie ? "Tie Result" : winner ? "Completed" : "Completed";

  return (
    <section className="panel admin-results-page modern-results-page">
      <style>{`
        .modern-results-page {
          --result-bg: #1f1f1f;
          --result-card: #202020;
          --result-card-2: #242424;
          --result-border: rgba(255, 255, 255, 0.075);
          --result-text: #f5f5f5;
          --result-muted: #9ca3af;
          --result-green: #22c55e;
          --result-purple: #158aa3;
          background: #1f1f1f;
          border: 1px solid rgba(255,255,255,0.055);
          padding: 22px;
          border-radius: 18px;
          color: var(--result-text);
          overflow: hidden;
        }

        .results-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .results-page-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .results-page-title-row h2 {
          margin: 0;
          font-size: clamp(21px, 2vw, 28px);
          font-weight: 750;
          letter-spacing: -0.03em;
          color: #fff;
        }

        .results-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(34,197,94,.22);
          background: rgba(34,197,94,.09);
          color: #4ade80;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .results-status-badge.tie {
          color: #fbbf24;
          background: rgba(245,158,11,.10);
          border-color: rgba(245,158,11,.24);
        }

        .results-page-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0 0;
          color: var(--result-muted);
          font-size: 12px;
        }

        .results-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .results-stat-card {
          min-height: 96px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--result-border);
          background: #222222;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.015);
        }

        .results-stat-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-size: 20px;
        }

        .results-stat-icon.purple {
          color: #37b9d4;
          background: rgba(21,138,163,.16);
        }

        .results-stat-icon.blue {
          color: #60a5fa;
          background: rgba(37,99,235,.13);
        }

        .results-stat-icon.green {
          color: #4ade80;
          background: rgba(34,197,94,.12);
        }

        .results-stat-copy span {
          display: block;
          color: var(--result-muted);
          font-size: 11px;
          margin-bottom: 3px;
        }

        .results-stat-copy strong {
          display: block;
          color: #fff;
          font-size: 23px;
          line-height: 1.15;
          font-weight: 750;
        }

        .results-stat-copy small {
          display: block;
          margin-top: 5px;
          color: #9aa4b5;
          font-size: 10px;
        }

        .results-stat-copy small.green { color: #4ade80; }

        .results-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.03fr) minmax(370px, 1.07fr);
          gap: 12px;
          align-items: stretch;
        }

        .results-card {
          border: 1px solid var(--result-border);
          background: #202020;
          border-radius: 12px;
          overflow: hidden;
        }

        .results-card-header {
          min-height: 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--result-border);
        }

        .results-card-header h3 {
          margin: 0;
          color: #f7f8fa;
          font-size: 13px;
          font-weight: 700;
        }

        .results-card-header span {
          color: var(--result-muted);
          font-size: 10px;
        }

        .results-chart-area {
          height: 405px;
          padding: 18px 8px 4px 0;
        }

        .results-chart-candidate-tick {
          width: 96px;
          height: 74px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          color: #d9dde5;
          font-size: 9px;
          font-weight: 600;
          line-height: 1.15;
          text-align: center;
          overflow: visible;
        }

        .results-chart-candidate-tick .results-avatar-shell,
        .results-chart-candidate-tick .results-candidate-avatar,
        .results-chart-candidate-tick .results-avatar-fallback {
          flex: 0 0 auto;
        }

        .results-chart-candidate-tick .results-candidate-avatar,
        .results-chart-candidate-tick .results-avatar-fallback {
          border: 2px solid #4a4a4a;
          box-shadow: 0 2px 8px rgba(0,0,0,.25);
        }

        .results-chart-candidate-tick span {
          display: block;
          width: 92px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .results-chart-tooltip {
          min-width: 132px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #262626;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 9px;
          box-shadow: 0 12px 34px rgba(0,0,0,.35);
        }

        .results-chart-tooltip strong { color: #fff; font-size: 12px; }
        .results-chart-tooltip span { color: #c8cfda; font-size: 11px; }
        .results-chart-tooltip small { color: #37b9d4; font-size: 10px; }

        .results-winner-banner {
          margin: 0 12px 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-radius: 9px;
          border: 1px solid rgba(34,197,94,.08);
          background: linear-gradient(90deg, rgba(16,65,44,.28), rgba(12,35,28,.24));
        }

        .results-winner-banner.tie {
          border-color: rgba(245,158,11,.10);
          background: linear-gradient(90deg, rgba(92,58,8,.27), rgba(54,39,13,.20));
        }

        .results-winner-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .results-winner-trophy {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(34,197,94,.12);
          color: #4ade80;
        }

        .results-winner-banner.tie .results-winner-trophy {
          background: rgba(245,158,11,.12);
          color: #fbbf24;
        }

        .results-winner-banner strong {
          display: block;
          color: #e9fff1;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .results-winner-banner p {
          margin: 4px 0 0;
          color: #9bb7a6;
          font-size: 9px;
        }

        .results-detail-head {
          display: grid;
          grid-template-columns: 44px minmax(150px, 1fr) 75px minmax(100px, 145px);
          gap: 8px;
          align-items: center;
          padding: 9px 13px;
          color: #7f8999;
          font-size: 9px;
          border-bottom: 1px solid var(--result-border);
        }

        .results-detail-list {
          padding: 0 10px 6px;
        }

        .results-detail-row {
          display: grid;
          grid-template-columns: 44px minmax(150px, 1fr) 75px minmax(100px, 145px);
          gap: 8px;
          align-items: center;
          min-height: 63px;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .results-detail-row:last-child { border-bottom: 0; }

        .results-rank-circle {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #212733;
          border: 1px solid rgba(255,255,255,.10);
          color: #d5d9e0;
          font-size: 10px;
          font-weight: 700;
        }

        .results-rank-circle.first {
          color: #fde68a;
          background: rgba(161,98,7,.34);
          border-color: rgba(245,158,11,.6);
        }

        .results-rank-circle.second {
          color: #e5e7eb;
          background: rgba(107,114,128,.25);
        }

        .results-rank-circle.third {
          color: #fdba74;
          background: rgba(154,52,18,.28);
          border-color: rgba(249,115,22,.35);
        }

        .results-candidate-cell {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .results-avatar-shell {
          position: relative;
          flex: 0 0 auto;
        }

        .results-candidate-avatar,
        .results-avatar-fallback {
          flex: 0 0 auto;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,.10);
          background: #2a2a2a;
        }

        .results-avatar-fallback {
          display: grid;
          place-items: center;
          color: #d9e1ef;
          font-size: 13px;
          font-weight: 800;
        }

        .results-candidate-name-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .results-candidate-name {
          max-width: 145px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #eff2f7;
          font-size: 11px;
          font-weight: 650;
        }

        .results-elected-badge {
          padding: 3px 5px;
          border-radius: 4px;
          color: #67d4e8;
          background: rgba(21,138,163,.18);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .results-vote-number {
          color: #f2f4f8;
          font-size: 11px;
          font-weight: 700;
        }

        .results-percentage-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .results-progress-track {
          position: relative;
          flex: 1;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #2b2b2b;
        }

        .results-progress-fill {
          height: 100%;
          min-width: 2px;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .results-percent-value {
          width: 48px;
          text-align: right;
          font-size: 10px;
          font-weight: 700;
        }

        .results-complete-card {
          grid-column: 1 / -1;
          min-height: 72px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .results-complete-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .results-complete-icon {
          margin-top: 1px;
          color: #22c55e;
          font-size: 17px;
        }

        .results-complete-left strong {
          color: #f6f8fb;
          font-size: 11px;
        }

        .results-complete-left p {
          margin: 5px 0 0;
          color: var(--result-muted);
          font-size: 9px;
        }

        .results-complete-large-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(34,197,94,.08);
          color: #4ade80;
          font-size: 21px;
        }

        .results-empty-state {
          min-height: 290px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #8d98aa;
        }

        .results-empty-state > svg {
          font-size: 38px;
          color: #158aa3;
          margin-bottom: 12px;
        }

        .results-empty-state h3 { margin: 0; color: #f4f6fa; }
        .results-empty-state p { margin: 8px 0 0; font-size: 12px; }

        .results-skeleton {
          position: relative;
          overflow: hidden;
          border-radius: 6px;
          background: #292929;
        }

        .results-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), rgba(255,255,255,.1), transparent);
          animation: resultShimmer 1.25s infinite;
        }

        .results-skeleton-icon { width: 44px; height: 44px; border-radius: 50%; }
        .results-skeleton-avatar { width: 38px; height: 38px; border-radius: 50%; }
        .results-skeleton-row { display: flex; align-items: center; gap: 12px; padding: 15px 12px; border-bottom: 1px solid rgba(255,255,255,.045); }

        @keyframes resultShimmer {
          100% { transform: translateX(100%); }
        }

        @media (max-width: 1050px) {
          .results-main-grid { grid-template-columns: 1fr; }
          .results-complete-card { grid-column: auto; }
        }

        @media (max-width: 760px) {
          .modern-results-page { padding: 14px; }
          .results-summary-grid { grid-template-columns: 1fr; }
          .results-page-header { flex-direction: column; }
          .results-detail-head { display: none; }
          .results-detail-row {
            grid-template-columns: 36px minmax(0, 1fr) auto;
            min-height: 70px;
            padding: 8px 2px;
          }
          .results-vote-number { text-align: right; }
          .results-percentage-cell {
            grid-column: 2 / 4;
            padding-left: 47px;
            padding-bottom: 4px;
          }
          .results-chart-area { height: 315px; }
        }

        @media (max-width: 480px) {
          .results-stat-card { min-height: 82px; }
          .results-chart-area { height: 285px; }
          .results-candidate-name { max-width: 118px; }
          .results-winner-banner { align-items: flex-start; }
        }
      `}</style>

      <div className="results-page-header">
        <div>
          <div className="results-page-title-row">
            <h2>Election Results</h2>
            {!resultsLoading && totalResultVotes > 0 && (
              <span className={`results-status-badge ${isTie ? "tie" : ""}`}>
                <FiCheckCircle />
                {statusText}
              </span>
            )}
          </div>
          <p className="results-page-subtitle">
            <FiActivity /> Candidate ranking and final verified vote result
          </p>
        </div>
      </div>

      {resultsLoading ? (
        <ResultsSkeleton />
      ) : results.length === 0 ? (
        <div className="results-empty-state">
          <FiUsers />
          <h3>No candidates found</h3>
          <p>No candidates are available for the selected post.</p>
        </div>
      ) : totalResultVotes === 0 ? (
        <>
          <div className="results-summary-grid">
            <div className="results-stat-card">
              <div className="results-stat-icon purple"><FiUsers /></div>
              <div className="results-stat-copy">
                <span>Total Votes Cast</span>
                <strong>0</strong>
                <small>No votes recorded yet</small>
              </div>
            </div>
            <div className="results-stat-card">
              <div className="results-stat-icon blue"><FiBarChart2 /></div>
              <div className="results-stat-copy">
                <span>Total Candidates</span>
                <strong>{results.length}</strong>
                <small>Registered for this post</small>
              </div>
            </div>
            <div className="results-stat-card">
              <div className="results-stat-icon green"><FiAward /></div>
              <div className="results-stat-copy">
                <span>Result Status</span>
                <strong>Pending</strong>
                <small>Waiting for votes</small>
              </div>
            </div>
          </div>

          <div className="results-empty-state">
            <FiBarChart2 />
            <h3>No votes recorded yet</h3>
            <p>The result visualization will appear as soon as votes are available.</p>
          </div>
        </>
      ) : (
        <>
          <div className="results-summary-grid">
            <div className="results-stat-card">
              <div className="results-stat-icon purple">
                <FiUsers />
              </div>
              <div className="results-stat-copy">
                <span>Total Votes Cast</span>
                <strong>{totalResultVotes.toLocaleString()}</strong>
                <small>Verified votes counted</small>
              </div>
            </div>

            <div className="results-stat-card">
              <div className="results-stat-icon blue">
                <FiBarChart2 />
              </div>
              <div className="results-stat-copy">
                <span>Total Candidates</span>
                <strong>{results.length}</strong>
                <small>Competing for this post</small>
              </div>
            </div>

            <div className="results-stat-card">
              <div className="results-stat-icon green">
                <FiAward />
              </div>
              <div className="results-stat-copy">
                <span>Result Status</span>
                <strong>{isTie ? "Tie" : "Completed"}</strong>
                <small className="green">
                  {isTie
                    ? "Multiple candidates share first place"
                    : `${winnerPercentage.toFixed(2)}% winning share`}
                </small>
              </div>
            </div>
          </div>

          <div className="results-main-grid">
            <div className="results-card results-chart-card">
              <div className="results-card-header">
                <h3>Results Overview</h3>
                <span>Votes by candidate</span>
              </div>

              <div className="results-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 28, right: 10, left: 0, bottom: 92 }}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.055)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                      tickLine={false}
                      interval={0}
                      height={88}
                      tick={(props) => (
                        <CandidateChartTick
                          {...props}
                          candidates={chartData}
                        />
                      )}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#788395", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,.025)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]} maxBarSize={58}>
                      <LabelList
                        dataKey="votes"
                        position="top"
                        fill="#f5f5f5"
                        fontSize={10}
                        fontWeight={700}
                      />
                      {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {isTie ? (
                <div className="results-winner-banner tie">
                  <div className="results-winner-banner-left">
                    <div className="results-winner-trophy"><FiAward /></div>
                    <div>
                      <strong>
                        Election tied between {topCandidates.map((c) => c.name).join(", ")}
                      </strong>
                      <p>
                        Each leading candidate received {topCandidates[0]?.voteCount || 0} votes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : winner ? (
                <div className="results-winner-banner">
                  <div className="results-winner-banner-left">
                    <div className="results-winner-trophy"><FiAward /></div>
                    <div>
                      <strong>{winner.name} is elected with the highest vote count</strong>
                      <p>
                        Winner · {winner.voteCount} {winner.voteCount === 1 ? "vote" : "votes"} · {winnerPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="results-card results-detail-card">
              <div className="results-card-header">
                <h3>Detailed Results</h3>
                <span>{rankedCandidates.length} candidates</span>
              </div>

              <div className="results-detail-head">
                <span>Rank</span>
                <span>Candidate</span>
                <span>Votes</span>
                <span>Percentage</span>
              </div>

              <div className="results-detail-list">
                {rankedCandidates.map((candidate, index) => {
                  const color = COLORS[index % COLORS.length];
                  const isElected = index === 0 && !isTie;

                  return (
                    <div className="results-detail-row" key={candidate.id}>
                      <div
                        className={`results-rank-circle ${
                          index === 0
                            ? "first"
                            : index === 1
                            ? "second"
                            : index === 2
                            ? "third"
                            : ""
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="results-candidate-cell">
                        <CandidateAvatarWithFallback candidate={candidate} size={38} />
                        <div className="results-candidate-name-wrap">
                          <span className="results-candidate-name" title={candidate.name}>
                            {candidate.name}
                          </span>
                          {isElected && (
                            <span className="results-elected-badge">Elected</span>
                          )}
                        </div>
                      </div>

                      <div className="results-vote-number">
                        {candidate.voteCount.toLocaleString()}
                      </div>

                      <div className="results-percentage-cell">
                        <div className="results-progress-track">
                          <div
                            className="results-progress-fill"
                            style={{
                              width: `${candidate.percentage}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span
                          className="results-percent-value"
                          style={{ color }}
                        >
                          {candidate.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="results-card results-complete-card">
              <div className="results-complete-left">
                <FiCheckCircle className="results-complete-icon" />
                <div>
                  <strong>{isTie ? "Election Result Verified" : "Election Completed"}</strong>
                  <p>
                    Candidate votes shown above are loaded from the verified election result data.
                  </p>
                </div>
              </div>
              <div className="results-complete-large-icon">
                <FiCheckCircle />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Results;