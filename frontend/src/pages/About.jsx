import { Link } from "react-router-dom";
import {
  FiShield,
  FiUsers,
  FiCheckCircle,
  FiLinkedin,
  FiGithub,
  FiPhone,
} from "react-icons/fi";

function About() {
  return (
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
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 60px",
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
          }}
        >
          <div
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
            style={{
              color: "#93c5fd",
              fontSize: "0.75rem",
              marginTop: "4px",
            }}
          >
            Blockchain Voting Platform
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Home
          </Link>

          <Link
            to="/login"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Login
          </Link>

          <Link
            to="/register"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "#0f637f",
              fontWeight: "600",
            }}
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Page Heading */}
<section
  style={{
    padding: "70px 20px 25px",
    textAlign: "center",
  }}
>
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
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
              marginBottom: "18px",
            }}
          >
            <FiShield />
            About EVoTE
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              margin: "0 0 15px",
              color: "white",
            }}
          >
            About Our{" "}
            <span style={{ color: "#93c5fd" }}>Project</span>
          </h1>

          <p
            style={{
              color: "#dbeafe",
              fontSize: "1.05rem",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            Learn about the EVoTE platform, how it works and the team behind
            the project.
          </p>
        </div>
      </section>

      {/* What is EVoTE */}
<section
  style={{
    padding: "35px 30px 65px",
  }}
>
    <div
  style={{
    maxWidth: "1050px",
    margin: "0 auto",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }}
></div>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "2rem",
              marginBottom: "25px",
              color: "white",
            }}
          >
            What is EVoTE?
          </h2>

          <div
            style={{
              padding: "28px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#d1d5db",
                fontSize: "1rem",
                lineHeight: "1.8",
                textAlign: "center",
              }}
            >
              EVoTE is a blockchain-based online voting system designed for
              institutions and organizations. It allows administrators to
              manage elections, candidates and voters while authorized users
              can securely participate in available elections. Blockchain
              technology is used to help maintain secure and transparent voting
              records.
            </p>
          </div>
        </div>
      </section>
<div
  style={{
    maxWidth: "1050px",
    margin: "0 auto",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }}
></div>
      {/* How EVoTE Works */}
<section
  style={{
    padding: "30px 30px 65px",
  }}
>
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                marginBottom: "10px",
                color: "white",
              }}
            >
              How EVoTE Works
            </h2>

            <p
              style={{
                color: "#dbeafe",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              A simple process from election creation to final results.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "18px",
            }}
          >
            <StepCard
              number="01"
              title="Create Election"
              text="Administrator creates and configures an election."
            />

            <StepCard
              number="02"
              title="Add Candidates"
              text="Candidates and eligible voters are added to the election."
            />

            <StepCard
              number="03"
              title="Cast Vote"
              text="Authorized voters securely submit their vote."
            />

            <StepCard
              number="04"
              title="View Results"
              text="Results are available after the voting period is completed."
            />
          </div>
        </div>
      </section>
<div
  style={{
    maxWidth: "1050px",
    margin: "0 auto",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }}
></div>
      {/* Development Team */}
      <section
        style={{
          padding: "70px 30px",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#93c5fd",
                marginBottom: "8px",
              }}
            >
              <FiUsers />
              Development Team
            </div>

            <h2
              style={{
                fontSize: "2rem",
                margin: "0 0 10px",
                color: "white",
              }}
            >
              Meet Our Team
            </h2>

            <p
              style={{
                color: "#dbeafe",
                margin: 0,
              }}
            >
              The developers behind the EVoTE project.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "18px",
            }}
          >
            <TeamCard name="Dinesh Singh Dhami" />
            <TeamCard name="Dilli Raj Bhatta" />
            <TeamCard name="Dipak Shyada" />
            <TeamCard name="Samir Bist" />
          </div>
        </div>
      </section>
<div
  style={{
    maxWidth: "1050px",
    margin: "0 auto",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }}
></div>
      {/* Footer */}
      <footer
  style={{
    padding: "34px 30px 18px",
    color: "#cbd5e1",
  }}
>
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "35px",
              marginBottom: "25px",
            }}
          >
            {/* Brand */}
            <div
  style={{
    paddingLeft: "60px",
  }}
>
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
  to="/"
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
  Home Page
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
            style={{
              paddingTop: "15px",
              color: "#64748b",
              fontSize: "0.82rem",
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} EVoTE — Blockchain Based Voting System
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ number, title, text }) {
  return (
    <div
      style={{
        padding: "23px",
        borderRadius: "9px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          color: "#93c5fd",
          fontSize: "1.45rem",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        {number}
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "1.05rem",
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

function TeamCard({ name }) {
  return (
    <div
      style={{
        padding: "25px 18px",
        textAlign: "center",
        borderRadius: "9px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          margin: "0 auto 13px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(15,99,127,0.28)",
          color: "#93c5fd",
        }}
      >
        <FiUsers size={23} />
      </div>

      <h3
        style={{
          margin: "0 0 6px",
          fontSize: "1rem",
          color: "white",
        }}
      >
        {name}
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "5px",
          color: "#94a3b8",
          fontSize: "0.82rem",
        }}
      >
        <FiCheckCircle size={14} />
        Developer
      </div>
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

export default About;