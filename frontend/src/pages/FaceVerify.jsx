import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { API_BASE } from "../config/api";

// INSTRUCTIONS:
// Ensure you have this font imported in your index.html or index.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

function FaceVerify() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examInitializing, setExamInitializing] = useState(true);

  // ---------------- START EXAM (Get ID) ----------------
  useEffect(() => {
    fetch(`${API_BASE}/start-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam_id: "ai_exam_1" })
    })
      .then(res => res.json())
      .then(data => {
        setAttemptId(data.attempt_id);
        setExamInitializing(false);
      })
      .catch(() => {
        setError("Failed to initialize exam session.");
        setExamInitializing(false);
      });
  }, []);

  // ---------------- CAPTURE & VERIFY ----------------
  const captureFace = async () => {
    if (!webcamRef.current || !attemptId) {
      setError("Camera not ready. Please wait.");
      return;
    }

    const image = webcamRef.current.getScreenshot();

    if (!image) {
      setError("Unable to capture image. Check camera permissions.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/capture-face`, { // Adjusted route based on previous context
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attemptId,
          image: image
        })
      });

      const data = await res.json();

      

    if (!res.ok || data.status !== "FACE_REGISTERED") {
      setError(data.error || data.message || "Face verification failed. Please try again.");
      setLoading(false);
      return;
    }

// ✅ SUCCESS
navigate("/exam", { state: { attemptId } });


      // ✅ SUCCESS - Navigate to Exam with attemptId state
      navigate("/exam", { state: { attemptId } });

    } catch (err) {
      console.error(err);
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      
      {/* Background Decor */}
      <div style={styles.circle1} />
      <div style={styles.circle2} />

      <div style={styles.card}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>🛡️</div>
          <h2 style={styles.title}>Identity Verification</h2>
          <p style={styles.subtitle}>
            Please center your face within the frame to verify your identity.
          </p>
        </div>

        {/* Webcam Area */}
        <div style={styles.webcamContainer}>
          {examInitializing ? (
            <div style={styles.loaderOverlay}>Initializing Exam...</div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user", width: 400, height: 300 }}
                style={styles.webcam}
              />
              
              {/* Face Guide Overlay */}
              <div style={styles.overlay}>
                <div style={styles.faceGuide} />
              </div>

              {/* Live Tag */}
              <div style={styles.liveTag}>
                <div style={styles.liveDot} /> LIVE
              </div>
            </>
          )}
        </div>

        {/* Status & Actions */}
        <div style={styles.footer}>
          {error && (
            <div style={styles.errorBox}>
              <span style={{marginRight: 6}}>⚠️</span> {error}
            </div>
          )}

          <button 
            onClick={captureFace} 
            disabled={loading || examInitializing} 
            style={{
              ...styles.btn,
              ...(loading || examInitializing ? styles.btnDisabled : {})
            }}
          >
            {loading ? "Verifying Identity..." : "Verify & Start Exam"}
          </button>
          
          <p style={styles.disclaimer}>
            By continuing, you agree to be monitored by AI proctoring for the duration of the exam.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= MODERN STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", // Matches Login
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden"
  },

  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    width: "100%",
    maxWidth: "480px",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.8)",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  header: {
    textAlign: "center",
    marginBottom: "30px"
  },

  iconWrapper: {
    fontSize: "32px",
    marginBottom: "16px",
    display: "inline-block",
    background: "#f1f5f9",
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    lineHeight: "60px"
  },

  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
    margin: 0
  },

  /* WEBCAM STYLING */
  webcamContainer: {
    position: "relative",
    width: "100%",
    height: "280px", // Fixed height for consistency
    background: "#000",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  webcam: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  /* OVERLAYS */
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none" // Let clicks pass through
  },

  faceGuide: {
    width: "160px",
    height: "220px",
    border: "2px dashed rgba(255, 255, 255, 0.6)",
    borderRadius: "50%",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)" // Dim the area outside the oval
  },

  liveTag: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(0, 0, 0, 0.6)",
    color: "white",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backdropFilter: "blur(4px)"
  },

  liveDot: {
    width: "6px",
    height: "6px",
    background: "#ef4444",
    borderRadius: "50%",
    boxShadow: "0 0 6px #ef4444"
  },

  loaderOverlay: {
    color: "white",
    fontWeight: "600",
    fontSize: "14px"
  },

  /* FOOTER & BUTTONS */
  footer: {
    width: "100%"
  },

  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "white",
    border: "none",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
    transition: "transform 0.1s",
    marginTop: "8px"
  },

  btnDisabled: {
    opacity: 0.7,
    cursor: "wait",
    background: "#94a3b8",
    boxShadow: "none"
  },

  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "16px",
    textAlign: "center",
    border: "1px solid #fecaca"
  },

  disclaimer: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "16px"
  },

  /* DECORATIVE BACKGROUNDS */
  circle1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "-50px",
    left: "-50px",
  },
  circle2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    bottom: "-100px",
    right: "-100px",
  }
};

export default FaceVerify;