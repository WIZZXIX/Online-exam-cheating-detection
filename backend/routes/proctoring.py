from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
from collections import defaultdict

from proctoring.face import analyze_face, extract_face
from proctoring.phone import detect_phone
from proctoring.face_auth import get_face_embedding as extract_embedding, cosine_distance

from db.events import log_event
from db.attempts import (
    evaluate_attempt,
    get_face_embedding,
    terminate_attempt
)

proctoring_bp = Blueprint("proctoring", __name__)

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
NO_FACE_THRESHOLD = 3
NO_FACE_TIME_WINDOW = 8
EVENT_COOLDOWN = 2

FACE_MISMATCH_THRESHOLD = 0.35
FACE_MISMATCH_CONSECUTIVE = 3

# -------------------------------------------------
# STATE (IN-MEMORY)
# -------------------------------------------------
last_face_seen = {}
no_face_counter = {}
last_event_time = {}

face_mismatch_counter = defaultdict(int)
identity_warning_issued = set()

# -------------------------------------------------
# ANALYZE FRAME
# -------------------------------------------------
@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json
    attempt_id = int(data["attempt_id"])
    image = data["image"]

    # -------- Decode image --------
    image_bytes = base64.b64decode(image.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    now = time.time()

    # -------- Init state --------
    last_face_seen.setdefault(attempt_id, now)
    no_face_counter.setdefault(attempt_id, 0)
    last_event_time.setdefault(attempt_id, 0)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "phone_detected": False,
        "status": None,
        "warning": None
    }

    # -------------------------------------------------
    # PHONE DETECTION
    # -------------------------------------------------
    response["phone_detected"] = detect_phone(frame)

    # -------------------------------------------------
    # FACE BEHAVIOR ANALYSIS
    # -------------------------------------------------
    face_result = analyze_face(frame)

    response["faces_detected"] = face_result["faces"]
    response["direction"] = face_result["direction"]
    event = face_result["event"]

    # -------------------------------------------------
    # NO FACE HANDLING
    # -------------------------------------------------
    if event == "NO_FACE":
        no_face_counter[attempt_id] += 1

        if (
            no_face_counter[attempt_id] >= NO_FACE_THRESHOLD
            and now - last_face_seen[attempt_id] > NO_FACE_TIME_WINDOW
        ):
            log_event("NO_FACE", attempt_id)
            last_event_time[attempt_id] = now
            no_face_counter[attempt_id] = 0

        response.update(evaluate_attempt(attempt_id))
        return jsonify(response)

    # Face detected → reset
    last_face_seen[attempt_id] = now
    no_face_counter[attempt_id] = 0

    # -------------------------------------------------
    # CONTINUOUS IDENTITY VERIFICATION (PHASE 4)
    # -------------------------------------------------
    stored_embedding = get_face_embedding(attempt_id)

    if stored_embedding is not None and face_result["faces"] == 1:
        face_img, face_count = extract_face(frame)

        if face_count == 1:
            try:
                live_embedding = extract_embedding(face_img)
                distance = cosine_distance(stored_embedding, live_embedding)

                if distance > FACE_MISMATCH_THRESHOLD:
                    face_mismatch_counter[attempt_id] += 1
                else:
                    face_mismatch_counter[attempt_id] = 0

                # ---- WARNING ----
                if (
                    face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE
                    and attempt_id not in identity_warning_issued
                ):
                    log_event("IDENTITY_MISMATCH_WARNING", attempt_id)
                    identity_warning_issued.add(attempt_id)
                    response["warning"] = "IDENTITY_MISMATCH"
                    face_mismatch_counter[attempt_id] = 0

                # ---- TERMINATION ----
                elif (
                    face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE
                    and attempt_id in identity_warning_issued
                ):
                    log_event("FACE_MISMATCH", attempt_id)
                    terminate_attempt(attempt_id)
                    response["status"] = "TERMINATED"
                    return jsonify(response)

            except Exception as e:
                print("Identity check error:", e)

    # -------------------------------------------------
    # OTHER EVENTS
    # -------------------------------------------------
    if event and now - last_event_time[attempt_id] > EVENT_COOLDOWN:
        log_event(event, attempt_id)
        last_event_time[attempt_id] = now

    response.update(evaluate_attempt(attempt_id))
    return jsonify(response)
