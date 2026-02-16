from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
from collections import defaultdict

# --- Custom Imports (Assuming these exist in your project structure) ---
from proctoring.face import analyze_face, extract_face
from proctoring.phone import detect_phone
from proctoring.face_auth import (
    get_face_embedding as extract_embedding,
    cosine_distance
)

from db.events import log_event
from db.attempts import (
    evaluate_attempt,
    get_face_embedding,
    terminate_attempt
)

proctoring_bp = Blueprint("proctoring", __name__)

# =================================================
# CONFIGURATION
# =================================================

# ---- NO FACE ----
NO_FACE_THRESHOLD = 3
NO_FACE_TIME_WINDOW = 8

# ---- GENERAL COOLDOWN ----
EVENT_COOLDOWN = 2

# ---- PHONE DETECTION ----
PHONE_DURATION_THRESHOLD = 3      # must see phone for 3 seconds
PHONE_COOLDOWN = 8                # wait 8 sec before logging again

# ---- HEAD MOVEMENT ----
HEAD_DURATION_THRESHOLD = 2       # must look away 2 sec
HEAD_COOLDOWN = 5

# ---- GAZE MOVEMENT ----
GAZE_DURATION_THRESHOLD = 2
GAZE_COOLDOWN = 5

# ---- FACE AUTH ----
FACE_MISMATCH_THRESHOLD = 0.35
FACE_MISMATCH_CONSECUTIVE = 3

# =================================================
# IN-MEMORY STATE
# (Note: In production with multiple workers, use Redis/DB instead of global vars)
# =================================================

last_face_seen = {}
no_face_counter = {}

# Phone tracking
phone_start_time = {}   # Tracks when the phone was first seen
last_phone_logged = {}  # Tracks when we last logged a phone event

# Head tracking
head_start_time = {}
last_head_logged = {}

# Gaze tracking
gaze_start_time = {}
last_gaze_logged = {}

# Identity
face_mismatch_counter = defaultdict(int)
identity_warning_issued = set()

# =================================================
# ANALYZE FRAME
# =================================================

@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json

    if not data or "attempt_id" not in data or "image" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    attempt_id = int(data["attempt_id"])
    image = data["image"]

    # ---------------- DECODE FRAME ----------------
    try:
        image_bytes = base64.b64decode(image.split(",")[1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except:
        return jsonify({"error": "Image decode failed"}), 400

    now = time.time()

    # Initialize basic state if missing
    last_face_seen.setdefault(attempt_id, now)
    no_face_counter.setdefault(attempt_id, 0)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "gaze": "CENTER",
        "phone_detected": False,
        "status": None,
        "warning": None
    }

    # =================================================
    # 1. PHONE DETECTION
    # =================================================
    phone_detected = detect_phone(frame)
    response["phone_detected"] = phone_detected

    if phone_detected:
        state = phone_start_time.get(attempt_id)

        # If this is the FIRST time seeing the phone in this sequence
        if not state:
            phone_start_time[attempt_id] = {"start": now}
        
        # If we are ALREADY tracking the phone
        else:
            duration = now - state["start"]
            last_logged = last_phone_logged.get(attempt_id, 0)

            # Check if we met the duration threshold
            if duration >= PHONE_DURATION_THRESHOLD:
                # Check if enough time has passed since the last log (Cooldown)
                if (now - last_logged > PHONE_COOLDOWN):
                    log_event("PHONE_DETECTED", attempt_id)
                    last_phone_logged[attempt_id] = now
                    # FIX: Do NOT pop phone_start_time here. Let the timer continue.
    else:
        # Phone is gone. Reset the timer.
        phone_start_time.pop(attempt_id, None)

    # =================================================
    # 2. FACE ANALYSIS & EXTRACTION
    # =================================================
    face_result = analyze_face(frame)
    response["faces_detected"] = face_result["faces"]
    response["direction"] = face_result["direction"]
    response["gaze"] = face_result.get("gaze", "CENTER")
    event = face_result["event"]

    # =================================================
    # 3. NO FACE HANDLING
    # =================================================
    if event == "NO_FACE":
        no_face_counter[attempt_id] += 1

        if (
            no_face_counter[attempt_id] >= NO_FACE_THRESHOLD
            and now - last_face_seen[attempt_id] > NO_FACE_TIME_WINDOW
        ):
            log_event("NO_FACE", attempt_id)
            no_face_counter[attempt_id] = 0
            # Note: You might want a cooldown here too if NO_FACE logs too often

        response.update(evaluate_attempt(attempt_id))
        return jsonify(response)

    # Reset counters if face is found
    last_face_seen[attempt_id] = now
    no_face_counter[attempt_id] = 0

    # =================================================
    # 4. IDENTITY VERIFICATION
    # =================================================
    stored_embedding = get_face_embedding(attempt_id)

    if stored_embedding and face_result["faces"] == 1:
        face_img, face_count, _ = extract_face(frame)

        if face_count == 1 and face_img is not None:
            try:
                live_embedding = extract_embedding(face_img)
                distance = cosine_distance(stored_embedding, live_embedding)

                if distance > FACE_MISMATCH_THRESHOLD:
                    face_mismatch_counter[attempt_id] += 1
                else:
                    face_mismatch_counter[attempt_id] = 0

                # Warning Phase
                if (
                    face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE
                    and attempt_id not in identity_warning_issued
                ):
                    log_event("IDENTITY_MISMATCH_WARNING", attempt_id)
                    identity_warning_issued.add(attempt_id)
                    response["warning"] = "IDENTITY_MISMATCH"
                    face_mismatch_counter[attempt_id] = 0

                # Termination Phase
                elif (
                    face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE
                    and attempt_id in identity_warning_issued
                ):
                    log_event("FACE_MISMATCH", attempt_id)
                    terminate_attempt(attempt_id)
                    response["status"] = "TERMINATED"
                    return jsonify(response)

            except Exception as e:
                print(f"Identity verification error: {e}")

    # =================================================
    # 5. HEAD MOVEMENT (Fix applied)
    # =================================================
    current_head = event if event in ["LOOKING_LEFT", "LOOKING_RIGHT"] else "CENTER"
    head_state = head_start_time.get(attempt_id)

    if current_head != "CENTER":
        # New direction or first time looking away
        if not head_state or head_state["direction"] != current_head:
            head_start_time[attempt_id] = {
                "direction": current_head,
                "start": now
            }
        
        # Continuing to look in the same direction
        else:
            duration = now - head_state["start"]
            last_logged = last_head_logged.get(attempt_id, 0)

            if duration >= HEAD_DURATION_THRESHOLD:
                if (now - last_logged > HEAD_COOLDOWN):
                    log_event(current_head, attempt_id)
                    last_head_logged[attempt_id] = now
                    # FIX: Do NOT pop head_start_time here.
    else:
        # Back to CENTER. Reset timer.
        head_start_time.pop(attempt_id, None)

    # =================================================
    # 6. GAZE MOVEMENT (Fix applied)
    # =================================================
    current_gaze = response["gaze"] if response["gaze"] in ["GAZE_LEFT", "GAZE_RIGHT"] else "CENTER"
    gaze_state = gaze_start_time.get(attempt_id)

    if current_gaze != "CENTER":
        if not gaze_state or gaze_state["direction"] != current_gaze:
            gaze_start_time[attempt_id] = {
                "direction": current_gaze,
                "start": now
            }
        else:
            duration = now - gaze_state["start"]
            last_logged = last_gaze_logged.get(attempt_id, 0)

            if duration >= GAZE_DURATION_THRESHOLD:
                if (now - last_logged > GAZE_COOLDOWN):
                    log_event(current_gaze, attempt_id)
                    last_gaze_logged[attempt_id] = now
                    # FIX: Do NOT pop gaze_start_time here.
    else:
        gaze_start_time.pop(attempt_id, None)

    # =================================================
    # FINAL SCORE UPDATE
    # =================================================
    response.update(evaluate_attempt(attempt_id))
    
    return jsonify(response)