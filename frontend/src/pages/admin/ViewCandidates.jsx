import { API_URL } from "../../config";
import { useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

function CandidateSkeletonCard() {
  return (
    <div
      className="admin-candidate-card compact-candidate-card"
      style={{
        width: "260px",
        padding: "22px",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        className="view-candidate-skeleton"
        style={{
          width: "105px",
          height: "105px",
          borderRadius: "50%",
          marginBottom: "16px",
        }}
      />

      <div
        className="view-candidate-skeleton"
        style={{
          width: "150px",
          height: "18px",
          marginBottom: "12px",
        }}
      />

      <div
        className="view-candidate-skeleton"
        style={{
          width: "90px",
          height: "26px",
          borderRadius: "999px",
          marginBottom: "14px",
        }}
      />

      <div
        style={{
          width: "100%",
          paddingTop: "12px",
          borderTop:
            "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="view-candidate-skeleton"
          style={{
            width: "95px",
            height: "9px",
            margin: "0 auto 8px",
          }}
        />

        <div
          className="view-candidate-skeleton"
          style={{
            width: "130px",
            height: "12px",
            margin: "0 auto",
          }}
        />
      </div>
    </div>
  );
}

function ViewCandidates() {
  const {
    selectedInstitutionId,
    selectedOrganizationId,
    selectedPostId,

    loadCandidates,

    viewCandidates,
    candidatesLoading,
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
  }, [
    selectedInstitutionId,
    selectedOrganizationId,
    selectedPostId,
  ]);

  if (
    !selectedInstitutionId ||
    !selectedOrganizationId ||
    !selectedPostId
  ) {
    return (
      <section className="panel">
        <h3>View Candidates</h3>

        <p className="muted">
          Select an institution, organization and post above to view its
          candidates.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <style>
        {`
          .view-candidate-skeleton {
            position: relative;
            overflow: hidden;
            background: #303030;
          }

          .view-candidate-skeleton::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.05),
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.05),
              transparent
            );
            animation: viewCandidateSkeletonShimmer 1.25s infinite;
          }

          @keyframes viewCandidateSkeletonShimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>

      <h3>View Candidates</h3>

      {candidatesLoading ? (
        <div className="admin-candidate-grid compact-candidate-grid">
          {[1, 2, 3, 4].map((item) => (
            <CandidateSkeletonCard
              key={item}
            />
          ))}
        </div>
      ) : viewCandidates.length === 0 ? (
        <p className="muted">
          No candidates added yet for this post.
        </p>
      ) : (
        <div className="admin-candidate-grid compact-candidate-grid">
          {viewCandidates.map((candidate) => (
            <div
              className="admin-candidate-card compact-candidate-card"
              key={candidate.id}
              style={{
                width: "260px",
                padding: "22px",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {candidate.photo ? (
                <img
                  src={`${API_URL}/${candidate.photo}`}
                  alt={candidate.name}
                  style={{
                    width: "105px",
                    height: "105px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    objectPosition: "center",
                    border:
                      "3px solid rgba(255,255,255,0.18)",
                    boxShadow:
                      "0 4px 14px rgba(0,0,0,0.35)",
                    marginBottom: "16px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "105px",
                    height: "105px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(14,165,233,0.18)",
                    border:
                      "3px solid rgba(255,255,255,0.18)",
                    fontSize: "34px",
                    fontWeight: "800",
                    marginBottom: "16px",
                  }}
                >
                  {candidate.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              )}

              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "18px",
                  lineHeight: "1.3",
                }}
              >
                {candidate.id}. {candidate.name}
              </h3>

              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: "999px",
                  background:
                    "rgba(59,130,246,0.12)",
                  border:
                    "1px solid rgba(96,165,250,0.25)",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                Age:{" "}
                <b>
                  {candidate.age ??
                    "Not available"}
                </b>
              </div>

              <div
                style={{
                  width: "100%",
                  paddingTop: "12px",
                  borderTop:
                    "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginBottom: "5px",
                    textTransform:
                      "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Wallet Address
                </div>

                <div
                  title={
                    candidate.wallet_address ||
                    candidate.wallet
                  }
                  style={{
                    color: "#22c55e",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {(() => {
                    const wallet =
                      candidate.wallet_address ||
                      candidate.wallet ||
                      "";

                    if (!wallet) {
                      return "Not available";
                    }

                    return `${wallet.slice(
                      0,
                      8
                    )}...${wallet.slice(-5)}`;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ViewCandidates;