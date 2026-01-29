import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
function AttemptDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/admin/attempt/${id}/details`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
  }, [id]);

  if (!data) return <p style={{ padding: 30 }}>Loading...</p>;

  let runningScore = 0;

  const statusColor =
    data.attempt.status === "COMPLETED"
      ? "#16a34a"
      : data.attempt.status === "FLAGGED"
      ? "#f59e0b"
      : "#dc2626";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back to Attempts
        </button>

        <h1 style={styles.title}>Attempt Details</h1>

        {/* SUMMARY CARDS */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.label}>Student</span>
            <strong>{data.attempt.user_id}</strong>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.label}>Exam</span>
            <strong>{data.attempt.exam_id}</strong>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.label}>Status</span>
            <span
              style={{
                ...styles.statusBadge,
                background: statusColor
              }}
            >
              {data.attempt.status}
            </span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.label}>Total Score</span>
            <strong>{data.attempt.cheating_score}</strong>
          </div>
        </div>

        {/* TIMELINE */}
        <h2 style={styles.sectionTitle}>Cheating Timeline</h2>

        <div style={styles.tableCard}>
        <table style={styles.table}>
  <thead>
    <tr>
      <th style={styles.th}>Time</th>
      <th style={styles.th}>Event</th>
      <th style={styles.th}>Weight</th>
      <th style={styles.th}>Score After</th>
    </tr>
  </thead>
  <tbody>
    {data.events.map((e, i) => {
      runningScore += e.weight;
      return (
        <tr key={i}>
          <td style={styles.td}>
            {new Date(e.time).toLocaleString()}
          </td>
          <td style={styles.td}>
            <span style={styles.eventTag}>{e.event_type}</span>
          </td>
          <td style={styles.td}>{e.weight}</td>
          <td style={styles.td}>
            <strong>{runningScore}</strong>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>


          {data.events.length === 0 && (
            <p style={styles.noEvents}>No cheating events recorded 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#f1f5f9",
    minHeight: "100vh",
    padding: "40px 20px"
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto"
  },

  backBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 10,
    color: "#2563eb"
  },

  title: {
    marginBottom: 20
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 30
  },

  summaryCard: {
    background: "white",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 6
  },

  label: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 600
  },

  statusBadge: {
    color: "white",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    width: "fit-content"
  },

  sectionTitle: {
    marginBottom: 12
  },

  tableCard: {
    background: "white",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center" // 🔥 this aligns head + body
  },

  eventTag: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600
  },

  noEvents: {
    marginTop: 10,
    color: "#16a34a",
    fontWeight: 600
  }, 
  th: {
    padding: "12px 8px",
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center"
  },
  
  td: {
    padding: "12px 8px",
    fontSize: 14,
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center"
  }
  
};

export default AttemptDetails;
