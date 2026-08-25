import { useEffect, useState } from "react";
import UserBreadcrumb from "./UserBreadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useVoting } from "../../context/VotingContext";

const MODE_DESC = {
  vote: "Select organization to view posts.",
  request: "Select organization.",
  results: "Select organization.",
};

function OrganizationList({ mode }) {
  const navigate = useNavigate();
  const { instId } = useParams();
  const { getContract, setMessage, account } = useVoting();

  const [institutionName, setInstitutionName] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, account]);

  async function loadOrganizations() {
    setLoading(true);
    try {
      const contract = await getContract();
      if (!contract) {
        setLoading(false);
        return;
      }

      const institutionData = await contract.institutions(Number(instId));
      setInstitutionName(institutionData.name);

      const count = Number(institutionData.organizationCount);
      let temp = [];

      for (let i = 1; i <= count; i++) {
        const org = await contract.getOrganization(Number(instId), i);
        temp.push({
  id: Number(org[0]),
  name: org[1],
  exists: org[2],
  postCount: Number(org[3]),
});
      }

      setOrganizations(temp);
      setMessage("");
    } catch {
      setMessage("Failed to load organizations");
    }
    setLoading(false);
  }

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="user-panel">
      <UserBreadcrumb
  items={[
    {
      label: institutionName || "Institution",
      to: `/user/${mode}`,
    },
  ]}
/>
      <div className="organization-header-row">
        <div className="section-heading">
          <h2>{institutionName || "Institution"}</h2>
          <p>{MODE_DESC[mode]}</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="institution-search-top"
          />

          <button
            className="small-btn"
            onClick={() => navigate(`/user/${mode}`)}
          >
            Back
          </button>
        </div>
      </div>

      <div className="election-list">
        {loading ? (
  <div className="election-list">

    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="election-card organization-skeleton-card"
      >
        <div className="organization-skeleton-content">

          <div
            className="
              dashboard-loading-line
              organization-skeleton-title
            "
          />

          <div
            className="
              dashboard-loading-line
              organization-skeleton-count
            "
          />

        </div>

        <div
          className="
            dashboard-loading-line
            organization-skeleton-open
          "
        />

      </div>
    ))}

  </div>
) : filteredOrganizations.length === 0 ? (
          <div className="empty-box">No organizations found.</div>
        ) : (
          filteredOrganizations.map((org) => (
            <button
              key={org.id}
              className="election-card"
              onClick={() => navigate(`/user/${mode}/${instId}/${org.id}`)}
            >
              <div>
                <h3>{org.name}</h3>
                <p>{org.postCount} posts</p>
              </div>
              <span className="status-badge active">Open</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default OrganizationList;