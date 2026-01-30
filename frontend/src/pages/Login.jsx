import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 1. Instructions:
// For the best look, add this line to your index.css or index.html head:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (
      role === "student" &&
      email === "student@example.com" &&
      password === "exam123"
    ) {
      navigate("/exam");
    } else if (
      role === "admin" &&
      email === "admin@example.com" &&
      password === "admin123"
    ) {
      navigate("/admin");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.left}>
          <div style={styles.header}>
            <h1 style={styles.brand}>🛡️ SecureExam.ai</h1>
          </div>

          <h2 style={styles.welcome}>Welcome Back</h2>
          <p style={styles.subtitle}>
            Please enter your credentials to access the portal.
          </p>

          {/* ROLE SWITCH */}
          <div style={styles.roleSwitch}>
            <button
              onClick={() => setRole("student")}
              style={{
                ...styles.roleBtn,
                ...(role === "student" ? styles.activeRole : {}),
              }}
            >
              Student
            </button>
            <button
              onClick={() => setRole("admin")}
              style={{
                ...styles.roleBtn,
                ...(role === "admin" ? styles.activeRole : {}),
              }}
            >
              Administrator
            </button>
          </div>

          {/* EMAIL */}
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder={
              role === "student" ? "student@example.com" : "admin@example.com"
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          {/* PASSWORD */}
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.loginBtn} onClick={handleLogin}>
            Sign In
          </button>

          <p style={styles.demo}>
            Demo:{" "}
            {role === "student" ? (
              <>
                <span style={styles.code}>student@example.com</span> /{" "}
                <span style={styles.code}>exam123</span>
              </>
            ) : (
              <>
                <span style={styles.code}>admin@example.com</span> /{" "}
                <span style={styles.code}>admin123</span>
              </>
            )}
          </p>
        </div>

        {/* RIGHT PANEL - Re-designed for Context */}
        <div style={styles.right}>
          <div style={styles.rightContent}>
            <h2 style={styles.rightTitle}>AI-Powered Integrity</h2>
            <p style={styles.rightSub}>
              Our advanced algorithms ensure a fair testing environment by
              detecting malicious activity in real-time.
            </p>

            <div style={styles.featuresList}>
              <FeatureCard
                icon={
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                }
                title="Gaze Tracking"
                desc="Monitors eye movement to detect off-screen references."
              />

              <FeatureCard
                icon={
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                title="Identity Verification"
                desc="Continuous biometric authentication throughout the exam."
              />

              <FeatureCard
                icon={
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.175m4.48 1.559A6 6 0 006 9c0 1.59.35 3.09 1 4.417"
                    />
                  </svg>
                }
                title="Malpractice Detection"
                desc="AI analyzes tab switching, multiple voices, and object detection."
              />
            </div>
          </div>
          {/* Decorative Circles */}
          <div style={styles.circle1} />
          <div style={styles.circle2} />
        </div>
      </div>
    </div>
  );
}

// Helper Component for the Right Panel Cards
const FeatureCard = ({ icon, title, desc }) => (
  <div style={styles.featureCard}>
    <div style={styles.iconBox}>{icon}</div>
    <div>
      <h4 style={styles.featureTitle}>{title}</h4>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  </div>
);

/* ================= STYLES ================= */
/* ================= STYLES ================= */

const styles = {
  page: {
    height: "100vh", // Force exact viewport height
    width: "100vw",  // Force exact viewport width
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden", // STRICTLY remove scrollbars
  },

  container: {
    width: "100%",
    maxWidth: "1000px", // Use string with px
    height: "600px",    // Fixed height for consistency (optional, but looks cleaner)
    maxHeight: "90vh",  // Safety cap for smaller screens
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.8)",
    overflow: "hidden", // Ensures content doesn't spill out of corners
  },

  /* --- LEFT PANEL --- */
  left: {
    padding: "40px 50px", // Reduced top/bottom padding slightly
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",       // Take full height of container
    boxSizing: "border-box", // Important for padding calculations
  },

  brand: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: "30px", // Reduced margin
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  welcome: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    color: "#64748b",
    fontSize: "15px",
    marginBottom: "24px",
    lineHeight: "1.5",
  },

  roleSwitch: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
  },

  roleBtn: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.2s ease",
  },

  activeRole: {
    background: "white",
    color: "#4f46e5",
    fontWeight: "600",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "6px",
    display: "block",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    marginBottom: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    background: "#f8fafc",
  },

  loginBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "white",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
    transition: "transform 0.1s",
  },

  error: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "15px",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "8px 12px",
    borderRadius: "8px",
  },

  demo: {
    marginTop: "20px",
    fontSize: "13px",
    color: "#94a3b8",
    textAlign: "center",
  },
  
  code: {
    fontFamily: "monospace",
    color: "#475569",
    background: "#f1f5f9",
    padding: "2px 4px",
    borderRadius: "4px",
  },

  /* --- RIGHT PANEL --- */
  right: {
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    color: "white",
    height: "100%",
    boxSizing: "border-box",
  },

  rightContent: {
    position: "relative",
    zIndex: 10,
  },

  rightTitle: {
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "12px",
    letterSpacing: "-0.5px",
  },

  rightSub: {
    fontSize: "15px",
    opacity: 0.9,
    marginBottom: "30px",
    lineHeight: "1.5",
  },

  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  featureCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "14px",
    borderRadius: "16px",
    transition: "transform 0.2s ease",
  },

  iconBox: {
    background: "rgba(255, 255, 255, 0.2)",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  featureTitle: {
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },

  featureDesc: {
    fontSize: "12px",
    margin: 0,
    opacity: 0.8,
    lineHeight: "1.4",
  },

  /* BACKGROUND SHAPES */
  circle1: {
    position: "absolute",
    width: "250px",
    height: "250px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "-40px",
    right: "-40px",
    zIndex: 1,
  },
  circle2: {
    position: "absolute",
    width: "180px",
    height: "180px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    bottom: "-40px",
    left: "-20px",
    zIndex: 1,
  },
};

export default Login;