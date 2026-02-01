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
      navigate("/face-verify");
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

        {/* RIGHT PANEL - Updated with REAL features */}
        <div style={styles.right}>
          <div style={styles.rightContent}>
            <h2 style={styles.rightTitle}>AI-Powered Integrity</h2>
            <p style={styles.rightSub}>
              Our advanced algorithms ensure a fair testing environment by
              detecting malicious activity in real-time.
            </p>

            <div style={styles.featuresList}>
              {/* Feature 1: Mobile Detection (YOLO) */}
              <FeatureCard
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                title="Mobile Phone Detection"
                desc="Real-time AI detection of prohibited devices like smartphones."
              />

              {/* Feature 2: Head Pose (MediaPipe) */}
              <FeatureCard
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Head Pose Analysis"
                desc="Monitors face direction to flag suspicious looking away or down."
              />

              {/* Feature 3: Browser Lockdown (JS Utils) */}
              <FeatureCard
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Browser Lockdown"
                desc="Prevents tab switching, minimizing, and copy-pasting."
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

const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },

  container: {
    width: "100%",
    maxWidth: "1000px",
    height: "600px",
    maxHeight: "90vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.8)",
    overflow: "hidden",
  },

  /* --- LEFT PANEL --- */
  left: {
    padding: "40px 50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    boxSizing: "border-box",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: "30px",
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