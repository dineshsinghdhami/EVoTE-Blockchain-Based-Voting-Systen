import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import GlobalToast from "../components/GlobalToast";

import {
  FiGrid,
  FiHome,
  FiBriefcase,
  FiFileText,
  FiList,
  FiUserCheck,
  FiBarChart2,
  FiSend,
  FiUsers,
  FiRepeat,
  FiSidebar,
  FiLogOut,
  FiGithub,
  FiLinkedin,
  FiYoutube,
  FiFacebook,
  FiInstagram,
} from "react-icons/fi";

import { FaWhatsapp } from "react-icons/fa";

import { useAdmin } from "../context/AdminContext";
import ContextSelector from "../components/admin/ContextSelector";
import { API_URL } from "../config";


const CONTEXT_LEVELS = {
  "/admin/organizations": [
    "institution",
  ],

  "/admin/posts": [
    "institution",
    "organization",
  ],

  "/admin/view-candidates": [
    "institution",
    "organization",
    "post",
  ],

  "/admin/results": [
    "institution",
    "organization",
    "post",
  ],

  "/admin/requests": [
    "institution",
    "organization",
    "post",
  ],
};


function AdminLayout() {
  const {
  adminUser,
  account,
  message,
  setMessage,
  connectWallet,
  logout,

  setSelectedInstitutionId,
  setSelectedOrganizationId,
  setSelectedPostId,

  setOrganizations,
  setPosts,
} = useAdmin();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);


  const [
    collapsed,
    setCollapsed,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_sidebar_collapsed"
      ) === "1"
  );


  useEffect(() => {
    localStorage.setItem(
      "admin_sidebar_collapsed",
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  const adminProfileImage =
  adminUser?.profile_picture
    ? `${API_URL}/${adminUser.profile_picture}?v=${
        adminUser.profile_picture_version ||
        ""
      }`
    : null;

  const location = useLocation();

  const contextLevels =
    CONTEXT_LEVELS[
      location.pathname
    ] || [];


  useEffect(() => {
    setSelectedInstitutionId("");
    setSelectedOrganizationId("");
    setSelectedPostId("");

    setOrganizations([]);
    setPosts([]);

    setMessage("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


  const navItems = [
    {
      to: "/admin",
      label: "Main Dashboard",
      icon: <FiGrid />,
      end: true,
    },

    {
      to: "/admin/institutions",
      label: "Create Institutions",
      icon: <FiHome />,
    },

    {
      to: "/admin/organizations",
      label: "Create Organizations",
      icon: <FiBriefcase />,
    },

    {
      to: "/admin/posts",
      label: "Create Posts",
      icon: <FiFileText />,
    },

    {
      to: "/admin/elections",
      label: "All Elections",
      icon: <FiList />,
    },

    {
      to: "/admin/view-candidates",
      label: "View Candidates",
      icon: <FiUserCheck />,
    },

    {
      to: "/admin/results",
      label: "View Results",
      icon: <FiBarChart2 />,
    },

    {
      to: "/admin/requests",
      label: "Candidate Requests",
      icon: <FiSend />,
    },

    {
      to: "/admin/users",
      label: "Registered Users",
      icon: <FiUsers />,
    },

    {
      to: "/admin/transactions",
      label: "Transactions",
      icon: <FiRepeat />,
    },
  ];


  return (
    <div className="admin-shell">

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "open" : ""
        } ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >

        {/* BRAND */}
        <div className="brand-box">

          <NavLink
            to="/admin"
            end
            className="brand-left brand-home-link"
          >
            <div className="user-brand-icon">
              <img
                src="/hero-image.webp"
                alt="Logo"
                className="brand-logo"
              />
            </div>

            <div className="brand-text">
              <h2>EVoTE ⬢</h2>

              <p>
                Admin Panel
              </p>
            </div>
          </NavLink>


          <button
            className="sidebar-toggle-btn"
            onClick={() =>
              setCollapsed(
                (current) =>
                  !current
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


        <div className="side-section">
          Overview
        </div>


        {/* NAVIGATION */}
        {navItems.map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({
                isActive,
              }) =>
                `side-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setSidebarOpen(false)
              }
              title={item.label}
            >
              <span className="link-icon">
                {item.icon}
              </span>

              <span className="link-label">
                {item.label}
              </span>
            </NavLink>
          )
        )}


        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">

          <button
            className="wallet-btn"
            onClick={connectWallet}
            title="Wallet"
          >
            <span
              className={`wallet-dot ${
                account ? "on" : ""
              }`}
            />

            <span className="link-label">
              {account
                ? account.slice(
                    0,
                    6
                  ) +
                  "..." +
                  account.slice(-4)
                : "Connect Wallet"}
            </span>
          </button>


          <button
            className="logout-btn"
            onClick={() =>
              setShowLogoutModal(
                true
              )
            }
            title="Logout"
          >
            <FiLogOut className="link-icon" />

            <span className="link-label">
              Logout
            </span>
          </button>

        </div>

      </aside>


      {/* MAIN */}
      <main
        className={`admin-main ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >

        {/* TOPBAR */}
<header className="topbar">

  <button
    className="menu-btn"
    onClick={() =>
      setSidebarOpen(true)
    }
  >
    ☰
  </button>


  <div className="admin-topbar-title">
    <h1>
      EVoTE Admin
    </h1>

    <p>
      Manage institution based
      blockchain voting system.
    </p>
  </div>


  <NavLink
    to="/admin/profile"
    className="admin-profile-chip"
  >

    <div className="admin-profile-avatar">

      {adminProfileImage ? (
        <img
          src={adminProfileImage}
          alt="Admin Profile"
        />
      ) : (
        <span>
          {adminUser?.full_name
            ?.charAt(0)
            ?.toUpperCase() || "A"}
        </span>
      )}

    </div>


    <div className="admin-profile-info">

      <strong>
        {adminUser?.full_name ||
          "Administrator"}
      </strong>

      <span>
        {adminUser?.role === "superadmin"
          ? "Super Admin"
          : "Admin"}
      </span>

    </div>

  </NavLink>

</header>


        {/* GLOBAL SMALL TOAST */}
<GlobalToast
  message={message}
  onClose={() => setMessage("")}
/>


        {/* CONTEXT SELECTOR */}
        <ContextSelector
          levels={contextLevels}
        />


        {/* PAGE CONTENT */}
        <div className="admin-page-content">
          <Outlet />
        </div>


       <footer className="admin-footer">
  <div className="admin-footer-text">
    © 2026 E-Vote · Secure Blockchain Voting System
  </div>

  <div className="admin-footer-socials">
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

    <a href="https://www.youtube.com/@dineshsinghdhami1" title="YouTube">
      <FiYoutube />
    </a>

    <a href="#" title="Facebook">
      <FiFacebook />
    </a>

    <a href="#" title="Instagram">
      <FiInstagram />
    </a>

    <a href="https://wa.me/9779866109958" title="WhatsApp"> 
      <FaWhatsapp />
    </a>
  </div>
</footer>

      </main>


      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}


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


export default AdminLayout;