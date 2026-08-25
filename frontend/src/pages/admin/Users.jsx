import { API_URL } from "../../config";
import { useState } from "react";
import {
  FiFilter,
  FiExternalLink,
} from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";

function Users() {
  const { users } = useAdmin();

  const [filterType, setFilterType] =
    useState("all");

  const [showFilter, setShowFilter] =
    useState(false);


  // =========================================================
  // CALCULATE AGE
  // =========================================================

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
      return "Not available";
    }

    const birthDate =
      new Date(dateOfBirth);

    if (
      Number.isNaN(
        birthDate.getTime()
      )
    ) {
      return "Not available";
    }

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
          birthDate.getDate()
      )
    ) {
      age--;
    }

    return age;
  };


  // =========================================================
  // NORMALIZE TRANSACTION HASH
  // =========================================================

  const normalizeTxHash = (txHash) => {
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
  };


  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers =
    users.filter((user) => {
      const role =
        user.role?.toLowerCase();

      if (
        filterType === "all"
      ) {
        return true;
      }

      if (
        filterType === "admin"
      ) {
        return (
          role === "admin" ||
          role === "superadmin"
        );
      }

      return (
        role === "user" ||
        role === "users" ||
        role === "voter"
      );
    });


  // =========================================================
  // UI
  // =========================================================

  return (
    <section className="panel">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="election-header">

        <h3>
          Registered Users
        </h3>

        <div className="filter-box">

          <button
            className="filter-btn"

            onClick={() =>
              setShowFilter(
                !showFilter
              )
            }
          >
            <FiFilter />

            Filter
          </button>


          {showFilter && (

            <div className="filter-menu">

              <button
                className={
                  filterType === "all"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setFilterType(
                    "all"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                All
              </button>


              <button
                className={
                  filterType === "admin"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setFilterType(
                    "admin"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                Admin
              </button>


              <button
                className={
                  filterType === "user"
                    ? "active"
                    : ""
                }

                onClick={() => {
                  setFilterType(
                    "user"
                  );

                  setShowFilter(
                    false
                  );
                }}
              >
                Users
              </button>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          USER LIST
      ===================================================== */}

      {filteredUsers.length === 0 ? (

        <p className="muted">
          No users found.
        </p>

      ) : (

        filteredUsers.map(
          (user) => {
            const txHash =
              normalizeTxHash(
                user.registration_tx_hash
              );

            const etherscanUrl =
              txHash
                ? `https://sepolia.etherscan.io/tx/${txHash}`
                : "";

            return (
              <div
                className="user-card"
                key={user.id}
                style={{
                  alignItems: "flex-start",
                }}
              >

                {/* ============================================
                    PROFILE
                ============================================ */}

                <div className="avatar">

                  {user.profile_picture ? (

                    <img
                      src={`${API_URL}/${user.profile_picture}`}

                      alt={
                        user.full_name
                      }

                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />

                  ) : (

                    user.full_name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "U"

                  )}

                </div>


                {/* ============================================
                    USER DETAILS
                ============================================ */}

                <div
                  style={{
                    flex: 1,
                  }}
                >

                  <h4>
                    {user.full_name}
                  </h4>


                  <p>
                    {user.email}
                  </p>


                  <p>
                    <b>Age:</b>{" "}
                    {calculateAge(
                      user.date_of_birth
                    )}
                  </p>


                  <p>
                    <b>Phone:</b>{" "}
                    {user.phone ||
                      "Not available"}
                  </p>


                  <p>
                    <b>Wallet:</b>{" "}

                    <span
                      className="hash-text"
                    >
                      {user.wallet_address ||
                        "Not available"}
                    </span>
                  </p>


                  <span className="pill">
                    {user.role}
                  </span>


                  {/* ============================================
                      ETHERSCAN REGISTRATION PROOF
                  ============================================ */}

                  {etherscanUrl && (

                    <div
                      style={{
                        marginTop: "12px",
                      }}
                    >

                      <a
                        href={
                          etherscanUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        style={{
                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          gap:
                            "6px",

                          color:
                            "#38bdf8",

                          fontSize:
                            "12px",

                          fontWeight:
                            "700",

                          textDecoration:
                            "none",
                        }}
                      >
                        <FiExternalLink />

                        View Registration on Sepolia Etherscan
                      </a>

                    </div>

                  )}

                </div>

              </div>
            );
          }
        )
      )}

    </section>
  );
}

export default Users;