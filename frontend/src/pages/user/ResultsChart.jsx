import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
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

import UserBreadcrumb from "./UserBreadcrumb";
import { API_URL } from "../../config";
import { useVoting } from "../../context/VotingContext";

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
  const firstLetter =
    candidate?.name?.trim()?.charAt(0)?.toUpperCase() || "C";

  if (candidate?.photo) {
    const cleanPhoto = String(candidate.photo).replace(/^\/+/, "");
    const photoSource = candidate.photo.startsWith("http")
      ? candidate.photo
      : `${API_URL}/${cleanPhoto}`;

    return (
      <div
        className="user-results-avatar-shell"
        style={{ width: size, height: size }}
      >
        <img
          src={photoSource}
          alt={candidate.name || "Candidate"}
          className="user-results-candidate-avatar"
          style={{ width: size, height: size }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "grid";
          }}
        />
        <div
          className="user-results-avatar-fallback"
          style={{ width: size, height: size, display: "none" }}
        >
          {firstLetter}
        </div>
      </div>
    );
  }

  return (
    <div
      className="user-results-avatar-fallback"
      style={{ width: size, height: size }}
      aria-label={candidate?.name || "Candidate"}
    >
      {firstLetter}
    </div>
  );
}

function CandidateChartTick({ x, y, index, candidates, compact }) {
  const candidate = candidates?.[index];
  if (!candidate) return null;

  const shortName = (() => {
    const name = candidate.name || "Candidate";
    if (compact) {
      const parts = name.trim().split(/\s+/);
      return parts[0]?.slice(0, 8) || "Candidate";
    }
    if (name.length <= 14) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return `${name.slice(0, 13)}…`;
  })();

  const avatarSize = compact ? 26 : 34;
  const width = compact ? 62 : 96;

  return (
    <foreignObject
      x={x - width / 2}
      y={y + 7}
      width={width}
      height={compact ? 64 : 78}
      style={{ overflow: "visible" }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`user-results-chart-candidate-tick ${
          compact ? "compact" : ""
        }`}
      >
        <CandidateAvatar candidate={candidate} size={avatarSize} />
        <span title={candidate.name}>{shortName}</span>
      </div>
    </foreignObject>
  );
}

function ResultsSkeleton() {
  return (
    <div className="user-results-loading-wrap">
      <div className="user-results-summary-grid">
        {[1, 2, 3].map((item) => (
          <div className="user-results-stat-card" key={item}>
            <div className="user-results-skeleton user-results-skeleton-icon" />
            <div style={{ flex: 1 }}>
              <div
                className="user-results-skeleton"
                style={{ width: "42%", height: 10 }}
              />
              <div
                className="user-results-skeleton"
                style={{ width: "62%", height: 24, marginTop: 10 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="user-results-main-grid">
        <div className="user-results-card">
          <div
            className="user-results-skeleton"
            style={{ width: 150, height: 18, margin: 14 }}
          />
          <div
            className="user-results-skeleton"
            style={{ height: 330, margin: "18px 14px 24px" }}
          />
        </div>

        <div className="user-results-card">
          <div
            className="user-results-skeleton"
            style={{ width: 150, height: 18, margin: 14 }}
          />
          {[1, 2, 3, 4].map((item) => (
            <div className="user-results-skeleton-row" key={item}>
              <div className="user-results-skeleton user-results-skeleton-avatar" />
              <div style={{ flex: 1 }}>
                <div
                  className="user-results-skeleton"
                  style={{ width: "55%", height: 12 }}
                />
                <div
                  className="user-results-skeleton"
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
    <div className="user-results-chart-tooltip">
      <strong>{item.name}</strong>
      <span>
        {item.votes.toLocaleString()} {item.votes === 1 ? "vote" : "votes"}
      </span>
      <small>{item.percentage.toFixed(2)}%</small>
    </div>
  );
}

function ResultsChart() {
  const navigate = useNavigate();
  const { instId, orgId, postId } = useParams();

  const { getContract, setMessage, account } = useVoting();

  const [institutionName, setInstitutionName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsAvailable, setResultsAvailable] = useState(false);

  useEffect(() => {
    loadResult();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, orgId, postId, account]);

  async function loadResult() {
    setLoading(true);

    try {
      const contract = await getContract();

      if (!contract) {
        setLoading(false);
        return;
      }

      const institutionData = await contract.institutions(Number(instId));
      setInstitutionName(institutionData.name || institutionData[1]);

      const organizationData = await contract.getOrganization(
        Number(instId),
        Number(orgId)
      );
      setOrganizationName(organizationData.name || organizationData[1]);

      const postData = await contract.getPost(
        Number(instId),
        Number(orgId),
        Number(postId)
      );
      setPostTitle(postData.title || postData[1]);

      const available = await contract.areResultsAvailable(
        Number(instId),
        Number(orgId),
        Number(postId)
      );

      setResultsAvailable(available);

      if (!available) {
        setCandidates([]);
        setMessage("");
        setLoading(false);
        return;
      }

      const candidateCount = Number(
        postData.candidateCount ?? postData[5]
      );

      const temp = [];

      for (let i = 1; i <= candidateCount; i++) {
        const candidate = await contract.getCandidateResult(
          Number(instId),
          Number(orgId),
          Number(postId),
          i
        );

        temp.push({
          id: Number(candidate.id ?? candidate[0]),
          wallet: candidate.wallet ?? candidate[1],
          name: String(candidate.name ?? candidate[2] ?? ""),
          voteCount: Number(candidate.voteCount ?? candidate[3] ?? 0),
          // If your contract/backend supplies photo in the returned candidate,
          // this page will automatically display it. Otherwise initials are shown.
          photo: "",
        });
      }

      // Load optional candidate profile photos from FastAPI.
      // The blockchain result contains id, wallet, name and voteCount only,
      // so photos must be enriched from the backend profile endpoint.
      let profiles = [];

      try {
        const profileResponse = await fetch(
          `${API_URL}/candidate-profiles/${instId}/${postId}`
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          profiles = Array.isArray(profileData) ? profileData : [];
        }
      } catch (profileError) {
        console.warn(
          "Candidate profile backend unavailable. Showing initials instead.",
          profileError
        );
      }

      const candidatesWithPhotos = temp.map((candidate) => {
        const wallet = String(candidate.wallet || "").toLowerCase();

        const profile = profiles.find(
          (item) =>
            String(item.wallet_address || item.wallet || "").toLowerCase() ===
            wallet
        );

        return {
          ...candidate,
          photo: profile?.photo || "",
        };
      });

      setCandidates(candidatesWithPhotos);
      setMessage("");
    } catch (err) {
      console.error("Failed to load result:", err);
      setCandidates([]);
      setMessage(
        err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to load result"
      );
    }

    setLoading(false);
  }

  const totalVotes = useMemo(
    () =>
      candidates.reduce(
        (sum, candidate) => sum + candidate.voteCount,
        0
      ),
    [candidates]
  );

  const rankedCandidates = useMemo(
    () =>
      [...candidates]
        .map((candidate) => ({
          ...candidate,
          percentage:
            totalVotes === 0
              ? 0
              : (candidate.voteCount / totalVotes) * 100,
        }))
        .sort((a, b) => b.voteCount - a.voteCount),
    [candidates, totalVotes]
  );

  const maxVotes =
    candidates.length > 0
      ? Math.max(...candidates.map((candidate) => candidate.voteCount))
      : 0;

  const topCandidates = candidates.filter(
    (candidate) => candidate.voteCount === maxVotes
  );

  const isTie = maxVotes > 0 && topCandidates.length > 1;
  const winner =
    maxVotes > 0 && topCandidates.length === 1 ? topCandidates[0] : null;

  const winnerPercentage = winner
    ? totalVotes === 0
      ? 0
      : (winner.voteCount / totalVotes) * 100
    : 0;

  const chartData = rankedCandidates.map((candidate, index) => ({
    ...candidate,
    votes: candidate.voteCount,
    color: COLORS[index % COLORS.length],
  }));

  // No horizontal scrolling. For larger candidate sets the chart becomes
  // progressively more compact while the detailed table keeps every name clear.
  const compactChart = chartData.length > 8;
  const veryCompactChart = chartData.length > 14;

  return (
    <section className="user-panel user-modern-results-page">
      <style>{`
        .user-modern-results-page {
          --result-card: #202020;
          --result-card-2: #222222;
          --result-border: rgba(255, 255, 255, 0.075);
          --result-text: #f5f5f5;
          --result-muted: #9ca3af;
          --result-green: #22c55e;
          --result-teal: #158aa3;
          background: #1f1f1f;
          border: 1px solid rgba(255,255,255,0.055);
          padding: 22px;
          border-radius: 18px;
          color: var(--result-text);
          overflow: hidden;
        }

        .user-results-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin: 15px 0 20px;
        }

        .user-results-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .user-results-title-row h2 {
          margin: 0;
          color: #fff;
          font-size: clamp(21px, 2vw, 28px);
          line-height: 1.15;
          font-weight: 750;
          letter-spacing: -0.03em;
        }

        .user-results-eyebrow {
          margin: 0 0 5px;
          color: #45bfd5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .user-results-subtitle {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 8px 0 0;
          color: var(--result-muted);
          font-size: 11px;
        }

        .user-results-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(34,197,94,.22);
          background: rgba(34,197,94,.09);
          color: #4ade80;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .user-results-status-badge.tie {
          color: #fbbf24;
          background: rgba(245,158,11,.10);
          border-color: rgba(245,158,11,.24);
        }

        .user-results-back-btn {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .user-results-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .user-results-stat-card {
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

        .user-results-stat-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-size: 20px;
        }

        .user-results-stat-icon.teal {
          color: #37b9d4;
          background: rgba(21,138,163,.16);
        }

        .user-results-stat-icon.blue {
          color: #60a5fa;
          background: rgba(37,99,235,.13);
        }

        .user-results-stat-icon.green {
          color: #4ade80;
          background: rgba(34,197,94,.12);
        }

        .user-results-stat-copy span {
          display: block;
          color: var(--result-muted);
          font-size: 11px;
          margin-bottom: 3px;
        }

        .user-results-stat-copy strong {
          display: block;
          color: #fff;
          font-size: 23px;
          line-height: 1.15;
          font-weight: 750;
        }

        .user-results-stat-copy small {
          display: block;
          margin-top: 5px;
          color: #9aa4b5;
          font-size: 10px;
        }

        .user-results-stat-copy small.green {
          color: #4ade80;
        }

        .user-results-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.03fr) minmax(370px, 1.07fr);
          gap: 12px;
          align-items: stretch;
        }

        .user-results-card {
          border: 1px solid var(--result-border);
          background: #202020;
          border-radius: 12px;
          overflow: hidden;
          min-width: 0;
        }

        .user-results-card-header {
          min-height: 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--result-border);
        }

        .user-results-card-header h3 {
          margin: 0;
          color: #f7f8fa;
          font-size: 13px;
          font-weight: 700;
        }

        .user-results-card-header span {
          color: var(--result-muted);
          font-size: 10px;
        }

        .user-results-chart-area {
          width: 100%;
          height: 405px;
          padding: 18px 8px 4px 0;
          overflow: hidden;
        }

        .user-results-chart-candidate-tick {
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

        .user-results-chart-candidate-tick.compact {
          width: 62px;
          gap: 4px;
          font-size: 7px;
        }

        .user-results-chart-candidate-tick span {
          display: block;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-results-avatar-shell {
          position: relative;
          flex: 0 0 auto;
        }

        .user-results-candidate-avatar,
        .user-results-avatar-fallback {
          flex: 0 0 auto;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,.11);
          background: #2a2a2a;
        }

        .user-results-avatar-fallback {
          display: grid;
          place-items: center;
          color: #d9e1ef;
          font-size: 13px;
          font-weight: 800;
        }

        .user-results-chart-candidate-tick .user-results-candidate-avatar,
        .user-results-chart-candidate-tick .user-results-avatar-fallback {
          border-color: #4a4a4a;
          box-shadow: 0 2px 8px rgba(0,0,0,.25);
        }

        .user-results-chart-tooltip {
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

        .user-results-chart-tooltip strong { color: #fff; font-size: 12px; }
        .user-results-chart-tooltip span { color: #c8cfda; font-size: 11px; }
        .user-results-chart-tooltip small { color: #37b9d4; font-size: 10px; }

        .user-results-winner-banner {
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

        .user-results-winner-banner.tie {
          border-color: rgba(245,158,11,.10);
          background: linear-gradient(90deg, rgba(92,58,8,.27), rgba(54,39,13,.20));
        }

        .user-results-winner-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .user-results-winner-trophy {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(34,197,94,.12);
          color: #4ade80;
        }

        .user-results-winner-banner.tie .user-results-winner-trophy {
          background: rgba(245,158,11,.12);
          color: #fbbf24;
        }

        .user-results-winner-banner strong {
          display: block;
          color: #e9fff1;
          font-size: 11px;
        }

        .user-results-winner-banner p {
          margin: 4px 0 0;
          color: #9bb7a6;
          font-size: 9px;
        }

        .user-results-detail-head,
        .user-results-detail-row {
          display: grid;
          grid-template-columns: 44px minmax(145px, 1fr) 72px minmax(105px, 145px);
          gap: 8px;
          align-items: center;
        }

        .user-results-detail-head {
          padding: 9px 13px;
          color: #7f8999;
          font-size: 9px;
          border-bottom: 1px solid var(--result-border);
        }

        .user-results-detail-list {
          padding: 0 10px 6px;
          max-height: 430px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .user-results-detail-list::-webkit-scrollbar {
          width: 5px;
        }

        .user-results-detail-list::-webkit-scrollbar-thumb {
          background: #3c3c3c;
          border-radius: 999px;
        }

        .user-results-detail-row {
          min-height: 63px;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .user-results-detail-row:last-child { border-bottom: 0; }

        .user-results-rank-circle {
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

        .user-results-rank-circle.first {
          color: #fde68a;
          background: rgba(161,98,7,.34);
          border-color: rgba(245,158,11,.6);
        }

        .user-results-rank-circle.second {
          color: #e5e7eb;
          background: rgba(107,114,128,.25);
        }

        .user-results-rank-circle.third {
          color: #fdba74;
          background: rgba(154,52,18,.28);
          border-color: rgba(249,115,22,.35);
        }

        .user-results-candidate-cell {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .user-results-candidate-name-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .user-results-candidate-name {
          max-width: 145px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #eff2f7;
          font-size: 11px;
          font-weight: 650;
        }

        .user-results-elected-badge {
          padding: 3px 5px;
          border-radius: 4px;
          color: #67d4e8;
          background: rgba(21,138,163,.18);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .user-results-vote-number {
          color: #f2f4f8;
          font-size: 11px;
          font-weight: 700;
        }

        .user-results-percentage-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-results-progress-track {
          position: relative;
          flex: 1;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #2b2b2b;
        }

        .user-results-progress-fill {
          height: 100%;
          min-width: 2px;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .user-results-percent-value {
          width: 48px;
          text-align: right;
          font-size: 10px;
          font-weight: 700;
        }

        .user-results-complete-card {
          grid-column: 1 / -1;
          min-height: 72px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .user-results-complete-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .user-results-complete-icon {
          margin-top: 1px;
          color: #22c55e;
          font-size: 17px;
        }

        .user-results-complete-left strong {
          color: #f6f8fb;
          font-size: 11px;
        }

        .user-results-complete-left p {
          margin: 5px 0 0;
          color: var(--result-muted);
          font-size: 9px;
        }

        .user-results-complete-large-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(34,197,94,.08);
          color: #4ade80;
          font-size: 21px;
        }

        .user-results-empty-state {
          min-height: 290px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #8d98aa;
        }

        .user-results-empty-state > svg {
          font-size: 38px;
          color: #158aa3;
          margin-bottom: 12px;
        }

        .user-results-empty-state h3 {
          margin: 0;
          color: #f4f6fa;
        }

        .user-results-empty-state p {
          margin: 8px 0 0;
          max-width: 470px;
          font-size: 12px;
        }

        .user-results-skeleton {
          position: relative;
          overflow: hidden;
          border-radius: 6px;
          background: #292929;
        }

        .user-results-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), rgba(255,255,255,.1), transparent);
          animation: userResultShimmer 1.25s infinite;
        }

        .user-results-skeleton-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        .user-results-skeleton-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
        }

        .user-results-skeleton-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 12px;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        @keyframes userResultShimmer {
          100% { transform: translateX(100%); }
        }

        @media (max-width: 1050px) {
          .user-results-main-grid {
            grid-template-columns: 1fr;
          }

          .user-results-complete-card {
            grid-column: auto;
          }

          .user-results-detail-list {
            max-height: none;
          }
        }

        @media (max-width: 760px) {
          .user-modern-results-page {
            padding: 14px;
          }

          .user-results-summary-grid {
            grid-template-columns: 1fr;
          }

          .user-results-topbar {
            flex-direction: column;
          }

          .user-results-detail-head {
            display: none;
          }

          .user-results-detail-row {
            grid-template-columns: 36px minmax(0, 1fr) auto;
            min-height: 70px;
            padding: 8px 2px;
          }

          .user-results-vote-number {
            text-align: right;
          }

          .user-results-percentage-cell {
            grid-column: 2 / 4;
            padding-left: 47px;
            padding-bottom: 4px;
          }

          .user-results-chart-area {
            height: 315px;
          }
        }

        @media (max-width: 480px) {
          .user-results-stat-card {
            min-height: 82px;
          }

          .user-results-chart-area {
            height: 285px;
          }

          .user-results-candidate-name {
            max-width: 118px;
          }

          .user-results-winner-banner {
            align-items: flex-start;
          }
        }
      `}</style>

      <UserBreadcrumb
        items={[
          {
            label: institutionName || "Institution",
            to: `/user/results/${instId}`,
          },
          {
            label: organizationName || "Organization",
            to: `/user/results/${instId}/${orgId}`,
          },
          {
            label: postTitle || "Position",
          },
        ]}
      />

      <div className="user-results-topbar">
        <div>
          <p className="user-results-eyebrow">Election Results</p>
          <div className="user-results-title-row">
            <h2>{postTitle || "Election Result"}</h2>

            {!loading && resultsAvailable && totalVotes > 0 && (
              <span
                className={`user-results-status-badge ${
                  isTie ? "tie" : ""
                }`}
              >
                <FiCheckCircle />
                {isTie ? "Tie Result" : "Completed"}
              </span>
            )}
          </div>

          <p className="user-results-subtitle">
            <FiActivity /> Candidate ranking and final verified vote result
          </p>
        </div>

        <button
          className="small-btn user-results-back-btn"
          onClick={() => navigate(`/user/results/${instId}/${orgId}`)}
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      {loading ? (
        <ResultsSkeleton />
      ) : !resultsAvailable ? (
        <div className="user-results-empty-state">
          <FiBarChart2 />
          <h3>Results are not available yet</h3>
          <p>
            Results will automatically become visible after the voting period
            has ended.
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="user-results-empty-state">
          <FiUsers />
          <h3>No candidates found</h3>
          <p>No candidates are available for this position.</p>
        </div>
      ) : totalVotes === 0 ? (
        <>
          <div className="user-results-summary-grid">
            <div className="user-results-stat-card">
              <div className="user-results-stat-icon teal">
                <FiUsers />
              </div>
              <div className="user-results-stat-copy">
                <span>Total Votes Cast</span>
                <strong>0</strong>
                <small>No votes recorded</small>
              </div>
            </div>

            <div className="user-results-stat-card">
              <div className="user-results-stat-icon blue">
                <FiBarChart2 />
              </div>
              <div className="user-results-stat-copy">
                <span>Total Candidates</span>
                <strong>{candidates.length}</strong>
                <small>Competing for this position</small>
              </div>
            </div>

            <div className="user-results-stat-card">
              <div className="user-results-stat-icon green">
                <FiAward />
              </div>
              <div className="user-results-stat-copy">
                <span>Result Status</span>
                <strong>Completed</strong>
                <small>No votes were cast</small>
              </div>
            </div>
          </div>

          <div className="user-results-empty-state">
            <FiBarChart2 />
            <h3>No votes were cast</h3>
            <p>There are no recorded votes for this position.</p>
          </div>
        </>
      ) : (
        <>
          <div className="user-results-summary-grid">
            <div className="user-results-stat-card">
              <div className="user-results-stat-icon teal">
                <FiUsers />
              </div>
              <div className="user-results-stat-copy">
                <span>Total Votes Cast</span>
                <strong>{totalVotes.toLocaleString()}</strong>
                <small>Verified votes counted</small>
              </div>
            </div>

            <div className="user-results-stat-card">
              <div className="user-results-stat-icon blue">
                <FiBarChart2 />
              </div>
              <div className="user-results-stat-copy">
                <span>Total Candidates</span>
                <strong>{candidates.length}</strong>
                <small>Competing for this position</small>
              </div>
            </div>

            <div className="user-results-stat-card">
              <div className="user-results-stat-icon green">
                <FiAward />
              </div>
              <div className="user-results-stat-copy">
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

          <div className="user-results-main-grid">
            <div className="user-results-card">
              <div className="user-results-card-header">
                <h3>Results Overview</h3>
                <span>Votes by candidate</span>
              </div>

              <div className="user-results-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 28,
                      right: 10,
                      left: 0,
                      bottom: compactChart ? 76 : 92,
                    }}
                    barCategoryGap={veryCompactChart ? "12%" : "24%"}
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
                      height={compactChart ? 72 : 88}
                      tick={(props) => (
                        <CandidateChartTick
                          {...props}
                          candidates={chartData}
                          compact={compactChart}
                        />
                      )}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#788395", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                      domain={[0, "auto"]}
                    />

                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,.025)" }}
                      content={<CustomTooltip />}
                    />

                    <Bar
                      dataKey="votes"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={veryCompactChart ? 30 : 58}
                      minPointSize={3}
                    >
                      <LabelList
                        dataKey="votes"
                        position="top"
                        fill="#f5f5f5"
                        fontSize={veryCompactChart ? 7 : 10}
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
                <div className="user-results-winner-banner tie">
                  <div className="user-results-winner-banner-left">
                    <div className="user-results-winner-trophy">
                      <FiAward />
                    </div>
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
                <div className="user-results-winner-banner">
                  <div className="user-results-winner-banner-left">
                    <div className="user-results-winner-trophy">
                      <FiAward />
                    </div>
                    <div>
                      <strong>
                        {winner.name} is elected with the highest vote count
                      </strong>
                      <p>
                        Winner · {winner.voteCount.toLocaleString()} {winner.voteCount === 1 ? "vote" : "votes"} · {winnerPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="user-results-card">
              <div className="user-results-card-header">
                <h3>Detailed Results</h3>
                <span>{rankedCandidates.length} candidates</span>
              </div>

              <div className="user-results-detail-head">
                <span>Rank</span>
                <span>Candidate</span>
                <span>Votes</span>
                <span>Percentage</span>
              </div>

              <div className="user-results-detail-list">
                {rankedCandidates.map((candidate, index) => {
                  const color = COLORS[index % COLORS.length];
                  const isElected = index === 0 && !isTie;

                  return (
                    <div
                      className="user-results-detail-row"
                      key={candidate.id}
                    >
                      <div
                        className={`user-results-rank-circle ${
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

                      <div className="user-results-candidate-cell">
                        <CandidateAvatar candidate={candidate} size={38} />
                        <div className="user-results-candidate-name-wrap">
                          <span
                            className="user-results-candidate-name"
                            title={candidate.name}
                          >
                            {candidate.name}
                          </span>

                          {isElected && (
                            <span className="user-results-elected-badge">
                              Elected
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="user-results-vote-number">
                        {candidate.voteCount.toLocaleString()}
                      </div>

                      <div className="user-results-percentage-cell">
                        <div className="user-results-progress-track">
                          <div
                            className="user-results-progress-fill"
                            style={{
                              width: `${candidate.percentage}%`,
                              background: color,
                            }}
                          />
                        </div>

                        <span
                          className="user-results-percent-value"
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

            <div className="user-results-card user-results-complete-card">
              <div className="user-results-complete-left">
                <FiCheckCircle className="user-results-complete-icon" />
                <div>
                  <strong>
                    {isTie ? "Election Result Verified" : "Election Completed"}
                  </strong>
                  <p>
                    Candidate votes shown above are loaded from the verified blockchain election result.
                  </p>
                </div>
              </div>

              <div className="user-results-complete-large-icon">
                <FiCheckCircle />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ResultsChart;