import { useEffect, useState } from "react";
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
  FiGithub,
  FiLinkedin,
  FiYoutube,
  FiFacebook,
  FiInstagram,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

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

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(
    () =>
      localStorage.getItem("user_sidebar_collapsed") === "1"
  );

  useEffect(() => {
    localStorage.setItem(
      "user_sidebar_collapsed",
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  const walletShort = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "Connect Wallet";

  const navItems = [
    {
      to: "/user",
      label: "Main Dashboard",
      icon: <FiHome />,
      end: true,
    },
    {
      to: "/user/elections",
      label: "All Elections",
      icon: <FiList />,
    },
    {
      to: "/user/request",
      label: "Request Candidate",
      icon: <FiUserPlus />,
    },
    {
      to: "/user/vote",
      label: "Vote",
      icon: <FiCheckSquare />,
    },
    {
      to: "/user/results",
      label: "Results",
      icon: <FiBarChart2 />,
    },
    {
      to: "/user/transactions",
      label: "Transactions",
      icon: <FiClipboard />,
    },
  ];

  return (
    <div className="user-dashboard-shell">

      {/* MOBILE BUTTON */}
      <button
        className="user-mobile-toggle"
        onClick={() =>
          setSidebarOpen((state) => !state)
        }
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="user-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`user-sidebar ${
          sidebarOpen ? "open" : ""
        } ${collapsed ? "collapsed" : ""}`}
      >

        {/* BRAND AREA */}
        <div className="user-brand-box">

          <Link
            to="/user"
            className="user-brand-content"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="user-admin-brand-image">
              <img
                src="/hero-image.webp"
                alt="EVoTE"
              />
            </div>

            <div className="user-admin-brand-text">
              <h2>EVoTE ⬢</h2>
              <p>Voter Panel</p>
            </div>
          </Link>

          <button
            className="user-admin-toggle"
            onClick={() =>
              setCollapsed((state) => !state)
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

        {/* OVERVIEW TITLE */}
        <div className="user-side-section-title">
          OVERVIEW
        </div>

        {/* NAVIGATION */}
        <nav className="user-admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `user-admin-nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="user-admin-nav-icon">
                {item.icon}
              </span>

              <span className="user-admin-nav-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM */}
        <div className="user-admin-sidebar-bottom">

          <button
            className="user-admin-wallet"
            onClick={connectWallet}
            title={account || "Connect Wallet"}
          >
            <span className="user-admin-wallet-dot" />

            <span className="user-admin-nav-label">
              {walletShort}
            </span>
          </button>

          <button
            className="user-admin-logout"
            onClick={() =>
              setShowLogoutModal(true)
            }
          >
            <FiLogOut />

            <span className="user-admin-nav-label">
              Logout
            </span>
          </button>

        </div>
      </aside>

      {/* MAIN */}
      <main
        className={`user-main ${
          collapsed ? "collapsed" : ""
        }`}
      >

        {/* TOP BAR */}
        <section className="user-admin-style-topbar">

          <div className="user-admin-style-left">
            <p className="user-admin-style-eyebrow">
              Welcome back
            </p>

            <h1>
              {user?.full_name || "Voter"}
            </h1>

            <p className="user-admin-style-description">
              Manage your voting, candidate requests,
              results and transactions.
            </p>
          </div>

          <Link
            to="/user/profile"
            className="user-admin-style-profile"
          >
            <div className="user-admin-style-avatar">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                />
              ) : (
                <FiUser />
              )}
            </div>

            <div className="user-admin-style-profile-text">
              <strong>
                {user?.full_name || "Voter"}
              </strong>

              <span>Voter</span>
            </div>
          </Link>

        </section>

        <GlobalToast
          message={message}
          onClose={() => setMessage("")}
        />

        <div className="user-page-body">
          <Outlet />
        </div>

        <footer className="user-footer">
  <div className="user-footer-text">
    © {new Date().getFullYear()} E-Vote · Secure Blockchain Voting System
  </div>

  <div className="user-footer-socials">
    <a
      href="https://github.com/dineshsinghdhami"
      target="_blank"
      rel="noreferrer"
      title="GitHub"
    >
      <FiGithub />
    </a>

    <a
      href="https://www.linkedin.com/in/dineshsinghdhami2"
      target="_blank"
      rel="noreferrer"
      title="LinkedIn"
    >
      <FiLinkedin />
    </a>

    <a
      href="https://www.youtube.com/@dineshsinghdhami1"
      target="_blank"
      rel="noreferrer"
      title="YouTube"
    >
      <FiYoutube />
    </a>

    <a
      href="#"
      title="Facebook"
    >
      <FiFacebook />
    </a>

    <a
      href="#"
      title="Instagram"
    >
      <FiInstagram />
    </a>

    <a
      href="https://wa.me/9779866109958"
      target="_blank"
      rel="noreferrer"
      title="WhatsApp"
    >
      <FaWhatsapp />
    </a>
  </div>
</footer>

      </main>

      {/* LOGOUT MODAL */}
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
          className="danger-btn"
          onClick={logout}
        >
          Yes
        </button>

        <button
          className="secondary-btn"
          onClick={() =>
            setShowLogoutModal(false)
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