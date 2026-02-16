from db.connection import get_db 
from datetime import datetime
import json

def save_face_embedding(attempt_id, embedding):
    conn, cur = get_db()

    # Convert embedding to JSON string
    embedding_json = json.dumps(embedding)

    cur.execute("""
        UPDATE exam_attempts
        SET face_embedding = %s
        WHERE id = %s
    """, (embedding_json, attempt_id))

    conn.commit()
    cur.close()
    conn.close()

def is_face_registered(attempt_id):
    conn, cur = get_db()

    cur.execute("""
        SELECT face_embedding
        FROM exam_attempts
        WHERE id = %s
    """, (attempt_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    return row is not None and row[0] is not None

def evaluate_attempt(attempt_id):
    conn, cur = get_db()

    cur.execute(
        "SELECT cheating_score, status FROM exam_attempts WHERE id=%s",
        (attempt_id,)
    )
    score, status = cur.fetchone()

    admin_status = None

    if score >= 15 and status == "ONGOING":
        admin_status = "TERMINATED"
        cur.execute(
            "UPDATE exam_attempts SET status=%s WHERE id=%s",
            (admin_status, attempt_id)
        )

    conn.commit()
    cur.close()
    conn.close()

    warning = None
    if 5 <= score < 8:
        warning = "WARNING"
    elif 8 <= score < 12:
        warning = "WARNING_YELLOW"
    elif 12 <= score < 15:
        warning = "FINAL_WARNING"

    return {
        "status": admin_status,
        "warning": warning
    }



def auto_flag_abandoned_attempts():
    """
    Any exam that:
    - is ONGOING
    - has NO ended_at
    - started more than X minutes ago
    should be FLAGGED
    """
    conn, cur = get_db()

    cur.execute("""
        UPDATE exam_attempts
        SET status = 'FLAGGED'
        WHERE status = 'ONGOING'
          AND ended_at IS NULL
          AND started_at < NOW() - INTERVAL '2 minutes'
    """)

    conn.commit()
    cur.close()
    conn.close()
    
def get_face_embedding(attempt_id):
    conn, cur = get_db()

    cur.execute("""
        SELECT face_embedding
        FROM exam_attempts
        WHERE id = %s
    """, (attempt_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    if row and row[0]:
        return json.loads(row[0])  # convert JSON string back to list

    return None

def terminate_attempt(attempt_id):
    conn, cur = get_db()

    cur.execute("""
        UPDATE exam_attempts
        SET status = 'TERMINATED',
            ended_at = %s
        WHERE id = %s
    """, (datetime.utcnow(), attempt_id))

    conn.commit()
    cur.close()
    conn.close()