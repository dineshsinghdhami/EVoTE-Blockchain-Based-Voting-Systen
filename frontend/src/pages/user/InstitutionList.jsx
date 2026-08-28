import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoting } from "../../context/VotingContext";

const MODE_COPY = {
  vote: {
    title: "Select Institution",
    desc: "Choose an institution to view its elections.",
  },
  request: {
    title: "Select Institution",
    desc: "Choose the institution where you want to become a candidate.",
  },
  results: {
    title: "Select Institution",
    desc: "Choose an institution to view results.",
  },
};

function InstitutionList({ mode }) {
  const navigate = useNavigate();
  const {
  getContract,
  setMessage,
  account,
  cachedInstitutions,
  setCachedInstitutions,
  institutionsLoaded,
  setInstitutionsLoaded,
} = useVoting();

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const copy = MODE_COPY[mode];

  useEffect(() => {
    loadInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  async function loadInstitutions() {
  // =====================================================
  // USE CACHE IF INSTITUTIONS WERE ALREADY LOADED
  // =====================================================

  if (institutionsLoaded) {
    setInstitutions(cachedInstitutions);
    setLoading(false);
    return;
  }

  setLoading(true);

  try {
    const contract =
      await getContract();

    if (!contract) {
      setInstitutions([]);
      return;
    }

    const count =
      Number(
        await contract.institutionCount()
      );

    if (count === 0) {
      setInstitutions([]);
      setCachedInstitutions([]);
      setInstitutionsLoaded(true);
      return;
    }

    // =====================================================
    // LOAD ALL INSTITUTIONS TOGETHER
    // =====================================================

    const institutionPromises = [];

    for (
      let i = 1;
      i <= count;
      i++
    ) {
      institutionPromises.push(
        contract
          .institutions(i)
          .then((institution) => ({
            id: i,

            name:
              institution.name,

            organizationCount:
              Number(
                institution.organizationCount
              ),
          }))
      );
    }

    const results =
      await Promise.all(
        institutionPromises
      );

    // Show on current page
    setInstitutions(results);

    // Save globally for future navigation
    setCachedInstitutions(results);

    // Mark successful blockchain load
    setInstitutionsLoaded(true);

    setMessage("");

  } catch (err) {
    console.error(
      "Failed to load institutions:",
      err
    );

    setInstitutions([]);

    setMessage(
      "Failed to load institutions"
    );

  } finally {
    setLoading(false);
  }
}

  const filteredInstitutions = institutions.filter((institution) =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="user-panel">
      <div className="institution-header-row">
        <div className="section-heading">
          <h2>{copy.title}</h2>
          <p>{copy.desc}</p>
        </div>

        <input
          type="text"
          placeholder="Search institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="institution-search-top"
        />
      </div>

      <div className="election-list">
  {loading ? (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="election-card institution-skeleton-card"
        >
          <div className="institution-skeleton-content">

            <div
              className="
                dashboard-loading-line
                institution-skeleton-title
              "
            />

            <div
              className="
                dashboard-loading-line
                institution-skeleton-count
              "
            />

          </div>

          <div
            className="
              dashboard-loading-line
              institution-skeleton-open
            "
          />
        </div>
      ))}
    </>
  ) : filteredInstitutions.length === 0 ? (
          <div className="empty-box">No institutions found.</div>
        ) : (
          filteredInstitutions.map((institution) => (
            <button
              key={institution.id}
              className="election-card"
              onClick={() => navigate(`/user/${mode}/${institution.id}`)}
            >
              <div>
                <h3>{institution.name}</h3>
                <p>{institution.organizationCount} organizations</p>
              </div>
              <span className="status-badge active">Open</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default InstitutionList;