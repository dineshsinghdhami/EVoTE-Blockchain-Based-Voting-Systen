import { Link } from "react-router-dom";
import {
  FiShield,
  FiCheckCircle,
  FiLock,
  FiUsers,
  FiBarChart2,
  FiLinkedin,
  FiGithub,
  FiPhone,
} from "react-icons/fi";

function Landing() {
  return (
    <>
      {/* Responsive CSS */}
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          
          body {
            margin: 0;
            overflow-x: hidden;
          }

          .landing-navbar {
            padding: 12px 60px;
          }

          .landing-nav-actions {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .landing-hero {
  min-height: 100vh;
  padding: 110px 20px 45px;
}

          .landing-hero-title {
            font-size: clamp(2.7rem, 6vw, 4.5rem);
          }

          .landing-hero-description {
            font-size: 1.1rem;
          }

          .landing-features {
            padding: 70px 30px;
          }

          .landing-features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 18px;
          }

          .landing-footer {
            padding: 34px 30px 18px;
          }

          .landing-footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 35px;
          }

          .landing-divider {
            max-width: 1050px;
            margin: 0 auto;
            height: 1px;
            background: rgba(255,255,255,0.12);
          }
            .landing-divider {
  max-width: 1050px;
  margin: 0 auto;
  height: 1px;
  background: rgba(255,255,255,0.12);
}

.landing-footer-divider {
  max-width: 1200px;
}

.landing-copyright {
  margin-top: 5px;
}
          /* Tablet */
          @media (max-width: 768px) {
            .landing-navbar {
              padding: 12px 24px;
            }

            .landing-logo-title {
              font-size: 1.25rem !important;
            }

            .landing-logo-subtitle {
              font-size: 0.68rem !important;
            }

            .landing-nav-actions {
              gap: 8px;
            }

            .landing-nav-button {
              padding: 7px 12px !important;
              font-size: 0.88rem;
            }

            .landing-hero {
              min-height: auto;
              padding: 70px 20px;
            }

            .landing-hero-title {
              font-size: clamp(2.4rem, 9vw, 3.5rem);
            }

            .landing-hero-description {
              font-size: 1rem;
            }

            .landing-features {
              padding: 55px 20px;
            }

            .landing-footer {
              padding: 40px 24px 20px;
            }

            .landing-footer-grid {
              grid-template-columns: 1fr 1fr;
              gap: 35px;
            }

            .landing-footer-brand {
              grid-column: 1 / -1;
            }

            .landing-divider {
              width: calc(100% - 40px);
            }
          }

          /* Mobile */
          @media (max-width: 520px) {
            .landing-navbar {
              padding: 11px 16px;
              gap: 10px;
            }

            .landing-logo-title {
              font-size: 1.12rem !important;
            }

            .landing-logo-subtitle {
              font-size: 0.58rem !important;
              white-space: nowrap;
            }

            .landing-nav-actions {
              gap: 6px;
            }

            .landing-nav-button {
              padding: 6px 9px !important;
              font-size: 0.78rem;
              border-radius: 6px !important;
            }

            .landing-hero {
              padding: 55px 16px;
            }

            .landing-security-badge {
              font-size: 0.78rem !important;
              padding: 6px 11px !important;
              margin-bottom: 18px !important;
            }

            .landing-hero-title {
              font-size: clamp(2.1rem, 12vw, 3rem);
              line-height: 1.08 !important;
            }

            .landing-hero-description {
              font-size: 0.95rem;
              line-height: 1.6 !important;
              margin-bottom: 25px !important;
            }

            .landing-hero-buttons {
              flex-direction: column;
              width: 100%;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
              gap: 10px !important;
            }

            .landing-main-button {
              width: 100%;
              text-align: center;
              padding: 12px 18px !important;
            }

            .landing-status-row {
              flex-direction: column;
              gap: 12px !important;
              align-items: center;
            }

            .landing-features {
              padding: 50px 16px;
            }

            .landing-features-heading {
              font-size: 1.7rem !important;
            }

            .landing-features-grid {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .landing-feature-card {
              padding: 20px !important;
            }

            .landing-footer {
              padding: 40px 20px 20px;
            }

            .landing-footer-grid {
              grid-template-columns: 1fr;
              gap: 28px;
            }

            .landing-footer-brand {
              grid-column: auto;
            }

            .landing-divider {
              width: calc(100% - 32px);
            }

            .landing-copyright {
              font-size: 0.72rem !important;
              line-height: 1.5;
            }
          }

          /* Very small phones */
          @media (max-width: 370px) {
            .landing-navbar {
              padding: 10px 10px;
            }

            .landing-logo-subtitle {
              display: none;
            }

            .landing-nav-button {
              padding: 6px 8px !important;
              font-size: 0.72rem;
            }

            .landing-hero {
              padding: 45px 12px;
            }

            .landing-hero-title {
              font-size: 2rem;
            }
          }
        `}
        
      </style>

      <div
        style={{
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/blockchain-bg.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          color: "white",
          overflowX: "hidden",
        }}
      >
        {/* Navbar */}
        <nav
          className="landing-navbar"
          style={{
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  zIndex: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
}}
        >
          <a
  href="/"
  style={{
    textDecoration: "none",
    cursor: "pointer",
  }}
>
  <div
    className="landing-logo-title"
    style={{
      color: "white",
      fontSize: "1.5rem",
      fontWeight: "700",
      lineHeight: "1",
    }}
  >
    EVoTE ⬢
  </div>

  <div
    className="landing-logo-subtitle"
    style={{
      color: "#93c5fd",
      fontSize: "0.75rem",
      marginTop: "4px",
    }}
  >
    Blockchain Voting Platform
  </div>
</a>

          <div className="landing-nav-actions">
            <a
  href="#features"
  style={{
    color: "white",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: "500",
    padding: "8px 4px",
  }}
>
  Features
</a>
            <Link
              className="landing-nav-button"
              to="/login"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              Login
            </Link>

            <Link
              className="landing-nav-button"
              to="/register"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                background: "#0f637f",
                fontWeight: "600",
              }}
            >
              Register
            </Link>

          </div>
        </nav>

        {/* Hero */}
        <section
          className="landing-hero"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
            }}
          >
            {/* Security Badge */}
            <div
              className="landing-security-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#dbeafe",
                fontSize: "0.9rem",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiShield size={18} />

                <span
                  style={{
                    position: "absolute",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    left: "46%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              Secure Blockchain Voting
            </div>

            {/* Title */}
            <h1
              className="landing-hero-title"
              style={{
                color: "white",
                lineHeight: "1.1",
                margin: "0 auto 18px",
                fontWeight: "750",
              }}
            >
              Blockchain Based
              <br />
              <span style={{ color: "#93c5fd" }}>Voting System</span>
            </h1>

            {/* Description */}
            <p
              className="landing-hero-description"
              style={{
                maxWidth: "700px",
                margin: "0 auto 30px",
                color: "#dbeafe",
                lineHeight: "1.7",
              }}
            >
              A simple online voting system for institutions and organizations.
              Manage elections, candidates and voters using blockchain-based
              records.
            </p>

            {/* Buttons */}
            <div
              className="landing-hero-buttons"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "32px",
              }}
            >
              <Link
                className="landing-main-button"
                to="/login"
                style={{
                  textDecoration: "none",
                  color: "white",
                  padding: "13px 26px",
                  borderRadius: "8px",
                  background: "#0f637f",
                  fontWeight: "600",
                }}
              >
                Vote Now
              </Link>

              <Link
                className="landing-main-button"
                to="/register"
                style={{
                  textDecoration: "none",
                  color: "white",
                  padding: "13px 26px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.05)",
                  fontWeight: "500",
                }}
              >
                Create Account
              </Link>
            </div>

            {/* Status */}
            <div
              className="landing-status-row"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "28px",
                flexWrap: "wrap",
                color: "#e2e8f0",
                fontSize: "0.92rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <FiCheckCircle color="#4ade80" />
                Verified Votes
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <FiLock color="#60a5fa" />
                Secure Voting
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <FiBarChart2 color="#c084fc" />
                Election Results
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="landing-divider" />

        {/* Features */}
        <section id="features" className="landing-features">
          <div
            style={{
              maxWidth: "1150px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "38px",
              }}
            >
              <h2
                className="landing-features-heading"
                style={{
                  fontSize: "2rem",
                  marginBottom: "10px",
                  color: "white",
                }}
              >
                Main Features
              </h2>

              <p
                style={{
                  color: "#dbeafe",
                  maxWidth: "620px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                }}
              >
                Everything needed to manage and participate in institutional
                elections.
              </p>
            </div>

            <div className="landing-features-grid">
              <FeatureCard
                icon={<FiLock size={25} />}
                title="Secure Voting"
                text="Only authorized users can participate in available elections."
              />

              <FeatureCard
                icon={<FiShield size={25} />}
                title="Blockchain Records"
                text="Voting records are handled using blockchain technology."
              />

              <FeatureCard
                icon={<FiUsers size={25} />}
                title="Voter Management"
                text="Manage voters, candidates, organizations and elections."
              />

              <FeatureCard
                icon={<FiBarChart2 size={25} />}
                title="Election Results"
                text="View election results after the voting period is completed."
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="landing-divider landing-footer-divider" />

        {/* Footer */}
        <footer
          className="landing-footer"
          style={{
            color: "#cbd5e1",
          }}
        >
          <div
            style={{
              maxWidth: "1150px",
              margin: "0 auto",
            }}
          >
            <div className="landing-footer-grid">
              {/* Brand */}
              <div className="landing-footer-brand">
                <h3
                  style={{
                    color: "white",
                    margin: "0 0 8px",
                    fontSize: "1.3rem",
                  }}
                >
                  EVoTE ⬢
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#94a3b8",
                    lineHeight: "1.6",
                    maxWidth: "390px",
                    fontSize: "0.9rem",
                  }}
                >
                  Blockchain based voting system for institutions and
                  organizations.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4
                  style={{
                    color: "white",
                    margin: "0 0 10px",
                    fontSize: "0.95rem",
                  }}
                >
                  Links
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                  }}
                >
                  <Link
                    to="/about"
                    style={footerLinkStyle}
                    onClick={() => {
                      setTimeout(() => {
                        window.scrollTo({
                          top: 0,
                          left: 0,
                          behavior: "auto",
                        });
                      }, 0);
                    }}
                  >
                    About EVoTE
                  </Link>

                  <Link to="/login" style={footerLinkStyle}>
                    Login Page
                  </Link>

                  <Link to="/register" style={footerLinkStyle}>
                    Register Page
                  </Link>
                </div>
              </div>

              {/* Connect */}
              <div>
                <h4
                  style={{
                    color: "white",
                    margin: "0 0 10px",
                    fontSize: "0.95rem",
                  }}
                >
                  Connect
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "0.9rem",
                  }}
                >
                  <a
                    href="https://www.linkedin.com/in/dineshsinghdhami2"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                  >
                    <FiLinkedin size={18} />
                    LinkedIn
                  </a>

                  <a
                    href="https://github.com/dineshsinghdhami"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                  >
                    <FiGithub size={18} />
                    GitHub
                  </a>

                  <a
                    href="tel:+9779866109958"
                    style={socialLinkStyle}
                  >
                    <FiPhone size={18} />
                    +977 9866109958
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div
              className="landing-copyright"
              style={{
                paddingTop: "15px",
                color: "#64748b",
                fontSize: "0.82rem",
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} EVoTE - Blockchain Based Voting
              System
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div
      className="landing-feature-card"
      style={{
        padding: "24px",
        borderRadius: "9px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          width: "45px",
          height: "45px",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(15,99,127,0.28)",
          color: "#93c5fd",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          marginTop: 0,
          marginBottom: "8px",
          fontSize: "1.1rem",
          color: "white",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#d1d5db",
          lineHeight: "1.6",
          fontSize: "0.9rem",
        }}
      >
        {text}
      </p>
    </div>
  );
}

const footerLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: "0.9rem",
};

const socialLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: "0.9rem",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export default Landing;