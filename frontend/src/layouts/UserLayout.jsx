import { useState, useEffect } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";

import {
  FiHome,
  FiCheckSquare,
  FiUserPlus,
  FiBarChart2,
  FiUser,
  FiClipboard,
  FiMenu,
  FiX,
  FiSidebar,
  FiList,
  FiLogOut,
} from "react-icons/fi";
import { useVoting } from "../context/VotingContext";
import GlobalToast from "../components/GlobalToast";

function UserLayout() {
  const {
  user,
  account,
  connectWallet,
  message,
  setMessage,
  profileImage,
  logout,
} = useVoting();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [collapsed, setCollapsed] =
    useState(
      () =>
        localStorage.getItem(
          "user_sidebar_collapsed"
        ) === "1"
    );

  useEffect(() => {
    localStorage.setItem(
      "user_sidebar_collapsed",
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  const walletShort =
    account
      ? account.slice(0, 6) +
        "..." +
        account.slice(-4)
      : "Not Connected";

  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  const navItems = [
    {
      to: "/user",
      label: "Overview",
      icon: (
        <FiHome className="side-icon" />
      ),
      end: true,
    },

    {
      to: "/user/elections",
      label: "All Elections",
      icon: (
        <FiList className="side-icon" />
      ),
    },

    {
      to: "/user/request",
      label: "Request Candidate",
      icon: (
        <FiUserPlus className="side-icon" />
      ),
    },

    {
      to: "/user/vote",
      label: "Vote",
      icon: (
        <FiCheckSquare className="side-icon" />
      ),
    },

    {
      to: "/user/results",
      label: "Result",
      icon: (
        <FiBarChart2 className="side-icon" />
      ),
    },

    {
      to: "/user/transactions",
      label: "Transactions",
      icon: (
        <FiClipboard className="side-icon" />
      ),
    },
  ];

  return (
    <div className="user-dashboard-shell">

      {/* =====================================================
          MOBILE MENU BUTTON
      ===================================================== */}

      <button
        className="user-mobile-toggle"
        onClick={() =>
          setSidebarOpen(
            (state) => !state
          )
        }
        aria-label="Toggle menu"
      >
        {sidebarOpen ? (
          <FiX />
        ) : (
          <FiMenu />
        )}
      </button>


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="user-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`user-sidebar ${
          sidebarOpen
            ? "open"
            : ""
        } ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >

        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="user-brand">

          <Link
            to="/"
            className="brand-left"
          >
            <div className="user-brand-icon">
              <img
                src="/hero-image.webp"
                alt="Logo"
                className="brand-logo"
              />
            </div>

            <div className="brand-text">
              <h2>
                E-Vote
              </h2>

              <p>
                Voter Dashboard
              </p>
            </div>
          </Link>


          <button
            className="sidebar-toggle-btn"
            onClick={() =>
              setCollapsed(
                (state) => !state
              )
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <FiSidebar />
          </button>

        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="user-side-nav">

          {navItems.map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({
                  isActive,
                }) =>
                  `user-side-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
                title={
                  item.label
                }
              >
                {item.icon}

                <span className="link-label">
                  {item.label}
                </span>
              </NavLink>
            )
          )}

        </nav>


        {/* ===================================================
            BOTTOM BUTTONS
        =================================================== */}

        <div className="user-sidebar-bottom">

          {/* WALLET */}

          <button
            className="user-wallet-btn"
            onClick={
              connectWallet
            }
            title="Wallet"
          >
            <span
              className={`wallet-dot ${
                account
                  ? "on"
                  : "off"
              }`}
            />

            <span
              className={`link-label ${
                account
                  ? "wallet-text-connected"
                  : "wallet-text-disconnected"
              }`}
            >
              {account
                ? walletShort
                : "Not Connected"}
            </span>
          </button>


          {/* LOGOUT */}

          <button
            className="user-logout-btn"
            onClick={() =>
              setShowLogoutModal(
                true
              )
            }
            title="Logout"
          >
            <FiLogOut className="side-icon" />

            <span className="link-label">
              Logout
            </span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className={`user-main ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <div className="user-topbar">

          <div>
            <p className="user-topbar-eyebrow">
              Welcome back
            </p>

            <h1>
              {user?.full_name ||
                "Voter"}
            </h1>

            <p>
              Manage your voting, candidate requests,
              results and transactions.
            </p>
          </div>


          {/* =================================================
              PROFILE ACCESS
              Profile removed from sidebar but remains here
          ================================================= */}

          <Link
            to="/user/profile"
            className="user-profile-chip"
          >
            <span>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                />
              ) : (
                <FiUser />
              )}
            </span>

            {user?.full_name ||
              "Profile"}
          </Link>

        </div>


        {/* ===================================================
    GLOBAL SMALL TOAST
=================================================== */}

<GlobalToast
  message={message}
  onClose={() => setMessage("")}
/>


        {/* ===================================================
            CURRENT PAGE
        =================================================== */}

        <div className="user-page-body">
          <Outlet />
        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="user-footer">
          <p>
            ©{" "}
            {new Date().getFullYear()}{" "}
            E-Vote · Secure Blockchain Voting System
          </p>
        </footer>

      </main>


      {/* =====================================================
          LOGOUT CONFIRMATION
      ===================================================== */}

      {showLogoutModal && (
        <div className="logout-overlay">

          <div className="logout-box">

            <h3>
              Logout
            </h3>

            <p>
              Are you sure you want to logout?
            </p>


            <div className="logout-actions">

              <button
                className="btn logout-yes"
                onClick={
                  logout
                }
              >
                Yes
              </button>


              <button
                className="btn logout-no"
                onClick={() =>
                  setShowLogoutModal(
                    false
                  )
                }
              >
                No
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default UserLayout;