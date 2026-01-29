from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import mediapipe as mp
import psycopg2
import time
import uuid

from config import DATABASE_URL
from ultralytics import YOLO

# -----------------------------------
# Flask App
# -----------------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------------
# MediaPipe Face Mesh
# -----------------------------------
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=2,
    refine_landmarks=True
)

# -----------------------------------
# YOLO Phone Detection
# -----------------------------------
phone_model = YOLO("yolo11n.pt")  # or yolov8n.pt
PHONE_CLASS_ID = 67  # COCO: cell phone
last_phone_log_time = 0
PHONE_LOG_COOLDOWN = 3  # seconds

# -----------------------------------
# DB Helpers
# -----------------------------------
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn, conn.cursor()

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


def get_event_weight(event_type):
    conn, cur = get_db()
    cur.execute(
        "SELECT weight FROM event_weights WHERE event_type=%s",
        (event_type,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else 1

def log_event(event_type, attempt_id):
    weight = get_event_weight(event_type)
    conn, cur = get_db()

    cur.execute("""
        INSERT INTO cheating_events (attempt_id, event_type, weight)
        VALUES (%s, %s, %s)
    """, (attempt_id, event_type, weight))

    cur.execute("""
        UPDATE exam_attempts
        SET cheating_score = cheating_score + %s
        WHERE id = %s
    """, (weight, attempt_id))

    conn.commit()
    cur.close()
    conn.close()

    print(f"DB LOG: {event_type} (+{weight})")

# -----------------------------------
# Attempt Evaluation
# -----------------------------------
def evaluate_attempt(attempt_id):
    conn, cur = get_db()
    cur.execute(
        "SELECT cheating_score FROM exam_attempts WHERE id=%s",
        (attempt_id,)
    )
    score = cur.fetchone()[0]

    admin_status = None
    if score >= 15:
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

# -----------------------------------
# Start Exam
# -----------------------------------
@app.route("/start-exam", methods=["POST"])
def start_exam():
    data = request.json or {}
    exam_id = data.get("exam_id", "ai_exam_1")
    student_id = f"student_{uuid.uuid4().hex[:6]}"

    conn, cur = get_db()
    cur.execute("""
        INSERT INTO exam_attempts (user_id, exam_id, status)
        VALUES (%s, %s, 'ONGOING')
        RETURNING id
    """, (student_id, exam_id))

    attempt_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "attempt_id": attempt_id,
        "student_id": student_id
    })

# -----------------------------------
# State Control
# -----------------------------------
last_direction = "CENTER"
last_log_time = 0
LOG_COOLDOWN = 2

# -----------------------------------
# Analyze Frame
# -----------------------------------
@app.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    global last_direction, last_log_time, last_phone_log_time

    data = request.json
    image = data["image"]
    attempt_id = data["attempt_id"]

    image_bytes = base64.b64decode(image.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # -------- PHONE DETECTION --------
    phone_detected = False
    yolo_results = phone_model.predict(frame, conf=0.45, verbose=False)

    for r in yolo_results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            if int(box.cls[0]) == PHONE_CLASS_ID:
                phone_detected = True
                break

    now = time.time()
    if phone_detected and now - last_phone_log_time > PHONE_LOG_COOLDOWN:
        log_event("PHONE_DETECTED", attempt_id)
        last_phone_log_time = now

    # -------- FACE MESH --------
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "phone_detected": phone_detected,
        "status": None,
        "warning": None
    }

    if not result.multi_face_landmarks:
        log_event("NO_FACE", attempt_id)
        response.update(evaluate_attempt(attempt_id))
        return jsonify(response)

    if len(result.multi_face_landmarks) > 1:
        response["faces_detected"] = len(result.multi_face_landmarks)
        log_event("MULTIPLE_FACES", attempt_id)
        response.update(evaluate_attempt(attempt_id))
        return jsonify(response)

    response["faces_detected"] = 1
    landmarks = result.multi_face_landmarks[0].landmark

    nose_x = landmarks[1].x
    left_cheek = landmarks[234].x
    right_cheek = landmarks[454].x
    face_center = (left_cheek + right_cheek) / 2
    offset = nose_x - face_center

    direction = "CENTER"
    if offset > 0.06:
        direction = "LEFT"
    elif offset < -0.06:
        direction = "RIGHT"

    response["direction"] = direction

    if direction != last_direction and direction != "CENTER" and now - last_log_time > LOG_COOLDOWN:
        log_event(f"LOOKING_{direction}", attempt_id)
        last_direction = direction
        last_log_time = now

    response.update(evaluate_attempt(attempt_id))
    return jsonify(response)

# -----------------------------------
# END EXAM
# -----------------------------------
@app.route("/end-exam", methods=["POST"])
def end_exam():
    attempt_id = request.json["attempt_id"]

    conn, cur = get_db()
    cur.execute(
        "SELECT cheating_score FROM exam_attempts WHERE id=%s",
        (attempt_id,)
    )
    score = cur.fetchone()[0]

    status = "TERMINATED" if score >= 15 else "COMPLETED"

    cur.execute("""
        UPDATE exam_attempts
        SET status=%s, ended_at=NOW()
        WHERE id=%s
    """, (status, attempt_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"status": status, "score": score})


# -----------------------------------
# Frontend Events
# -----------------------------------
@app.route("/log-event", methods=["POST"])
def log_frontend_event():
    data = request.json
    event_type = data["event"]
    attempt_id = data["attempt_id"]

    log_event(event_type, attempt_id)
    result = evaluate_attempt(attempt_id)

    return jsonify(result)

# -----------------------------------
# ADMIN: All Attempts
# -----------------------------------
@app.route("/admin/attempts", methods=["GET"])
def admin_attempts():
    try:
        # 🔥 AUTO-FLAG ABANDONED EXAMS
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
# ADMIN: Events for Attempt
# -----------------------------------
@app.route("/admin/attempt/<int:attempt_id>", methods=["GET"])
def admin_attempt_events(attempt_id):
    try:
        conn, cur = get_db()
        cur.execute("""
            SELECT event_type, created_at
            FROM cheating_events
            WHERE attempt_id=%s
            ORDER BY created_at
        """, (attempt_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {"event_type": r[0], "time": str(r[1])}
            for r in rows
        ])

    except Exception as e:
        print("ATTEMPT EVENTS ERROR:", e)
        return jsonify({"error": "Failed to fetch events"}), 500

@app.route("/admin/attempt/<int:attempt_id>/details", methods=["GET"])
def admin_attempt_details(attempt_id):
    try:
        conn, cur = get_db()

        # Fetch attempt summary
        cur.execute("""
            SELECT user_id, exam_id, cheating_score, status, started_at, ended_at
            FROM exam_attempts
            WHERE id = %s
        """, (attempt_id,))
        attempt = cur.fetchone()

        if not attempt:
            return jsonify({"error": "Attempt not found"}), 404

        # Fetch cheating events
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

    except Exception as e:
        print("ATTEMPT DETAILS ERROR:", e)
        return jsonify({"error": "Failed to fetch details"}), 500

# -----------------------------------
# DB TEST
# -----------------------------------
@app.route("/db-test")
def db_test():
    try:
        conn, cur = get_db()
        cur.execute("SELECT NOW()")
        cur.close()
        conn.close()
        return "DB CONNECTED"
    except Exception as e:
        return f"DB ERROR: {e}", 500

# -----------------------------------
# Run Server
# -----------------------------------
if __name__ == "__main__":
    app.run(debug=True)
