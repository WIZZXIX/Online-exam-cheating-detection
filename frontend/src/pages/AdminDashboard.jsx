import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
function AdminDashboard() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch(`${API_BASE}/admin/attempts`)
      .then(res => res.json())
      .then(data => setAttempts(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const filteredAttempts =
    filter === "ALL"
      ? attempts
      : attempts.filter(a => a.status === filter);

  const total = attempts.length;
  const completed = attempts.filter(a => a.status === "COMPLETED").length;
  const ongoing = attempts.filter(a => a.status === "ONGOING").length;
  const flagged = attempts.filter(a => a.status === "FLAGGED").length;
  const terminated = attempts.filter(a => a.status === "TERMINATED").length;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {/* ================= STATS ================= */}
      <div style={styles.statsGrid}>
        <StatCard label="Total Attempts" value={total} color="#0f172a" desc="All exam sessions" />
        <StatCard label="Completed" value={completed} color="#16a34a" desc="No issues detected" />
        <StatCard label="Ongoing" value={ongoing} color="#2563eb" desc="Live exams running" />
        <StatCard label="Flagged" value={flagged} color="#f59e0b" desc="Needs review" />
        <StatCard label="Terminated" value={terminated} color="#dc2626" desc="Malpractice found" />
      </div>

      {/* ================= FILTERS ================= */}
      <div style={styles.filters}>
        {["ALL", "COMPLETED", "ONGOING", "FLAGGED", "TERMINATED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              background: filter === f ? "#2563eb" : "#e5e7eb",
              color: filter === f ? "white" : "#111827"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Exam</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Score</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
              <th style={styles.th}>Started At</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAttempts.map(a => (
              <tr key={a.id} style={styles.row}>
                <td style={styles.td}>{a.user_id}</td>
                <td style={styles.td}>{a.exam_id}</td>

                <td style={{ ...styles.td, textAlign: "center", ...scoreStyle(a.cheating_score) }}>
                  {a.cheating_score}
                </td>

                <td style={{ ...styles.td, textAlign: "center" }}>
                  <StatusBadge status={a.status} />
                </td>

                <td style={styles.td}>
                  {new Date(a.started_at).toLocaleString()}
                </td>

                <td style={{ ...styles.td, textAlign: "center" }}>
                <button
                  style={styles.viewBtn}
                  onClick={() => navigate(`/admin/attempt/${a.id}`)}
                >
                  View
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const StatCard = ({ label, value, color, desc }) => (
  <div
    style={{
      ...styles.statCard,
      borderLeft: `6px solid ${color}`
    }}
  >
    <div style={styles.statInner}>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
      <p style={styles.statDesc}>{desc}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    COMPLETED: "#16a34a",
    ONGOING: "#2563eb",
    FLAGGED: "#f59e0b",
    TERMINATED: "#dc2626"
  };

  return (
    <span
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: "white",
        background: colors[status]
      }}
    >
      {status}
    </span>
  );
};

const scoreStyle = score => {
  if (score >= 15) return { color: "#dc2626", fontWeight: 700 };
  if (score >= 8) return { color: "#f59e0b", fontWeight: 600 };
  return { color: "#16a34a", fontWeight: 600 };
};

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 32,
    background: "#f8fafc",
    minHeight: "100vh"
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 28
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 30
  },

  statCard: {
    background: "white",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    minHeight: 120,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  statInner: {
    textAlign: "center"
  },

  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6
  },

  statValue: {
    fontSize: 32,
    fontWeight: 800
  },

  statDesc: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4
  },

  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap"
  },

  filterBtn: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    fontWeight: 600,
    cursor: "pointer"
  },

  tableCard: {
    background: "white",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: 14,
    color: "#475569",
    borderBottom: "1px solid #e5e7eb"
  },

  td: {
    padding: "14px 12px",
    fontSize: 14,
    borderBottom: "1px solid #f1f5f9"
  },

  row: {
    transition: "background 0.2s"
  },

  viewBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    background: "#0f172a",
    color: "white",
    fontSize: 12,
    cursor: "pointer"
  }
};

export default AdminDashboard;
