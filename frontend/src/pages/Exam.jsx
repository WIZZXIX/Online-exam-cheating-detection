import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Webcam from "../components/Webcam";
import { questions } from "../data/questions";
import { startTabMonitoring } from "../utils/monitor";
import { blockClipboard } from "../utils/clipboard";

function Exam() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const [warning, setWarning] = useState(null);

  // ---------------- START EXAM ----------------
  useEffect(() => {
    fetch("http://127.0.0.1:5000/start-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam_id: "ai_exam_1" })
    })
      .then(res => res.json())
      .then(data => setAttemptId(data.attempt_id))
      .catch(err => console.error(err));
  }, []);

  // ---------------- LOG EVENTS ----------------
  const logEvent = async (event) => {
    if (!attemptId || submitted || terminated) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, attempt_id: attemptId })
      });

      const data = await res.json();

      if (data.warning) {
        setWarning(data.warning);
      }

      if (data.status === "TERMINATED") {
        setTerminated(true);
      }
    } catch (err) {
      console.error("Log failed:", err);
    }
  };

  useEffect(() => {
    if (!submitted && !terminated && attemptId) {
      startTabMonitoring(logEvent);
      blockClipboard(logEvent);
    }
  }, [submitted, terminated, attemptId]);

  // ---------------- WEBCAM ----------------
  const sendFrameToBackend = async (image) => {
    if (!attemptId || submitted || terminated) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, attempt_id: attemptId })
      });

      const data = await res.json();

      // 📱 PHONE DETECTED (HIGHEST PRIORITY)
      if (data.phone_detected) {
        setWarning("PHONE_DETECTED");
      } 
      // ⚠️ OTHER WARNINGS
      else if (data.warning) {
        setWarning(data.warning);
      }

      if (data.status === "TERMINATED") {
        setTerminated(true);
      }

    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    await fetch("http://127.0.0.1:5000/end-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: attemptId })
    });
    setSubmitted(true);
  };

  // ---------------- TERMINATED ----------------
  if (terminated) {
    return (
      <div style={styles.terminatedWrapper}>
        <div style={styles.terminatedCard}>
          <h2 style={{ color: "#dc2626" }}>🚫 Test Terminated</h2>
          <p>Suspicious activity exceeded the allowed limit.</p>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            This incident has been reported to the administrator.
          </p>
          <button style={styles.loginBtn} onClick={() => navigate("/")}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // ---------------- SUBMITTED ----------------
  if (submitted) {
    return (
      <div style={styles.submitWrapper}>
        <div style={styles.submitCard}>
          <h2>✅ Exam Submitted</h2>
          <p>Your exam has been successfully completed.</p>
          <button onClick={() => navigate("/")} style={styles.primaryBtn}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <span>⏱ Time Left: 19:01</span>
        <strong>AI Proctored Exam</strong>
        <button onClick={handleSubmit} style={styles.submitTopBtn}>
          Submit
        </button>
      </div>

      {/* ---------- WARNING BANNER ---------- */}
      {warning && (
        <div
          style={{
            margin: "12px 0",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 600,
            textAlign: "center",
            background:
              warning === "PHONE_DETECTED"
                ? "#fee2e2"
                : warning === "FINAL_WARNING"
                ? "#fecaca"
                : warning === "WARNING_YELLOW"
                ? "#fde68a"
                : "#fef3c7",
            color:
              warning === "PHONE_DETECTED"
                ? "#7f1d1d"
                : "#78350f",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
          }}
        >
          {warning === "PHONE_DETECTED" && "🚫 Mobile phone detected. Remove it immediately."}
          {warning === "WARNING" && "⚠️ Suspicious activity detected. Please focus on the exam."}
          {warning === "WARNING_YELLOW" && "⚠️ Multiple violations detected. Further issues may terminate the exam."}
          {warning === "FINAL_WARNING" && "🚨 FINAL WARNING! Next violation will terminate your exam."}
        </div>
      )}

      {/* BODY */}
      <div style={styles.layout}>
        <div style={styles.questionCard}>
          <h3>Question {current + 1}</h3>
          <p>{questions[current].question}</p>
        </div>

        <div style={styles.optionsCard}>
          {questions[current].options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => setAnswers({ ...answers, [current]: idx })}
              style={{
                ...styles.option,
                background: answers[current] === idx ? "#e0f2fe" : "#fff",
                borderColor: answers[current] === idx ? "#2563eb" : "#e5e7eb"
              }}
            >
              <strong>{String.fromCharCode(65 + idx)}</strong> {opt}
            </div>
          ))}
        </div>

        <div style={styles.palette}>
          <h4>Questions</h4>
          <div style={styles.paletteGrid}>
            {questions.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  ...styles.qCircle,
                  background:
                    i === current
                      ? "#2563eb"
                      : answers[i] !== undefined
                      ? "#16a34a"
                      : "#e5e7eb",
                  color: i === current ? "#fff" : "#000"
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <button
          onClick={() => setCurrent(current - 1)}
          disabled={current === 0}
          style={styles.secondaryBtn}
        >
          Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            style={styles.primaryBtn}
          >
            Save & Next
          </button>
        ) : (
          <button onClick={handleSubmit} style={styles.submitBtn}>
            Submit Exam
          </button>
        )}
      </div>

      {/* FLOATING WEBCAM */}
      <div style={styles.webcamWrapper}>
        <div style={styles.webcamHeader}>
          <span style={styles.webcamTitle}>Proctoring Camera</span>
          <span style={styles.liveBadge}>
            <span style={styles.liveDot} /> LIVE
          </span>
        </div>

        <div style={styles.webcamBody}>
          <Webcam
            onCapture={sendFrameToBackend}
            warningLevel={warning}
          />
        </div>

        <div style={styles.webcamFooter}>
          Face & device monitoring active
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: { minHeight: "100vh", background: "#f1f5f9", padding: 16 },
  header: {
    background: "#2563eb",
    color: "white",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    borderRadius: 10,
    marginBottom: 16
  },
  layout: { display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 16 },
  questionCard: { background: "white", padding: 20, borderRadius: 12 },
  optionsCard: { background: "white", padding: 20, borderRadius: 12 },
  option: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 10,
    border: "2px solid #e5e7eb",
    cursor: "pointer"
  },
  palette: { background: "white", padding: 16, borderRadius: 12 },
  paletteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 10
  },
  qCircle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  footer: { marginTop: 20, display: "flex", justifyContent: "space-between" },
  primaryBtn: {
    background: "#2563eb",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: 8
  },
  secondaryBtn: {
    background: "#e5e7eb",
    padding: "10px 18px",
    border: "none",
    borderRadius: 8
  },
  submitBtn: {
    background: "#16a34a",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: 8
  },
  submitTopBtn: {
    background: "#facc15",
    border: "none",
    borderRadius: 6,
    padding: "6px 14px"
  },
  submitWrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  submitCard: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    textAlign: "center"
  },
  terminatedWrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff1f2"
  },
  terminatedCard: {
    background: "white",
    padding: 40,
    borderRadius: 14,
    textAlign: "center"
  },
  loginBtn: {
    marginTop: 20,
    padding: "10px 18px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 8
  },
  webcamWrapper: {
    position: "fixed",
    bottom: 24,
    left: 24,
    width: 260,                     // ⬅ slightly wider
    background: "white",
    borderRadius: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,0.15)",
    zIndex: 1000
  },
  
  webcamHeader: {
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb"
  },
  
  webcamTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a"
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "#16a34a"
  },
  
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#16a34a"
  },
  
  webcamBody: {
    padding: 12,
    background: "#f1f5f9"
  },
  
  webcamFooter: {
    padding: "8px",
    textAlign: "center",
    fontSize: 11,
    color: "#64748b",
    borderTop: "1px solid #e5e7eb"
  }
};

export default Exam;
