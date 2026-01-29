from flask import Blueprint, jsonify
from db.attempts import auto_flag_abandoned_attempts
from db.connection import get_db

# ✅ Admin Blueprint with prefix
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# -----------------------------------
# ADMIN: All Attempts (Dashboard)
# -----------------------------------
@admin_bp.route("/attempts", methods=["GET"])
def admin_attempts():
    try:
        # 🔥 Auto-flag abandoned exams
        auto_flag_abandoned_attempts()

        conn, cur = get_db()
        cur.execute("""
            SELECT id, user_id, exam_id, cheating_score, status, started_at
            FROM exam_attempts
            ORDER BY started_at DESC
        """)
        rows = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify([
            {
                "id": r[0],
                "user_id": r[1],
                "exam_id": r[2],
                "cheating_score": r[3],
                "status": r[4],
                "started_at": str(r[5])
            } for r in rows
        ])

    except Exception as e:
        print("ADMIN ATTEMPTS ERROR:", e)
        return jsonify({"error": "Failed to fetch attempts"}), 500


# -----------------------------------
# ADMIN: Attempt Timeline
# -----------------------------------
@admin_bp.route("/attempt/<int:attempt_id>", methods=["GET"])
def admin_attempt_events(attempt_id):
    conn, cur = get_db()

    cur.execute("""
        SELECT event_type, created_at
        FROM cheating_events
        WHERE attempt_id = %s
        ORDER BY created_at
    """, (attempt_id,))
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify([
        {
            "event_type": r[0],
            "time": str(r[1])
        } for r in rows
    ])


# -----------------------------------
# ADMIN: Attempt Details (USED BY FRONTEND)
# -----------------------------------
@admin_bp.route("/attempt/<int:attempt_id>/details", methods=["GET"])
def admin_attempt_details(attempt_id):
    conn, cur = get_db()

    # Attempt summary
    cur.execute("""
        SELECT user_id, exam_id, cheating_score, status, started_at, ended_at
        FROM exam_attempts
        WHERE id = %s
    """, (attempt_id,))
    attempt = cur.fetchone()

    if not attempt:
        cur.close()
        conn.close()
        return jsonify({"error": "Attempt not found"}), 404

    # Cheating events
    cur.execute("""
        SELECT event_type, weight, created_at
        FROM cheating_events
        WHERE attempt_id = %s
        ORDER BY created_at
    """, (attempt_id,))
    events = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({
        "attempt": {
            "attempt_id": attempt_id,
            "user_id": attempt[0],
            "exam_id": attempt[1],
            "cheating_score": attempt[2],
            "status": attempt[3],
            "started_at": str(attempt[4]),
            "ended_at": str(attempt[5]) if attempt[5] else None
        },
        "events": [
            {
                "event_type": e[0],
                "weight": e[1],
                "time": str(e[2])
            } for e in events
        ]
    })
