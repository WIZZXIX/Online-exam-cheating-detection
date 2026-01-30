from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time

from proctoring.face import analyze_face
from proctoring.phone import detect_phone
from db.events import log_event
from db.attempts import evaluate_attempt

proctoring_bp = Blueprint("proctoring", __name__)

# -----------------------------------
# TOLERANCE & COOLDOWNS
# -----------------------------------
NO_FACE_THRESHOLD = 3          # frames
NO_FACE_TIME_WINDOW = 8        # seconds
EVENT_COOLDOWN = 2             # seconds

last_face_seen = {}
no_face_counter = {}
last_event_time = {}

# -----------------------------------
# ANALYZE FRAME
# -----------------------------------
@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json
    attempt_id = data["attempt_id"]
    image = data["image"]

    # Decode frame
    image_bytes = base64.b64decode(image.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    now = time.time()

    # Init tracking
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

    # -----------------------------------
    # PHONE DETECTION
    # -----------------------------------
    phone_detected = detect_phone(frame)
    response["phone_detected"] = phone_detected

    # -----------------------------------
    # FACE ANALYSIS (FROM face.py)
    # -----------------------------------
    face_result = analyze_face(frame)

    response["faces_detected"] = face_result["faces"]
    response["direction"] = face_result["direction"]

    event = face_result["event"]

    # -----------------------------------
    # NO FACE TOLERANCE
    # -----------------------------------
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

    # Face detected → reset counters
    last_face_seen[attempt_id] = now
    no_face_counter[attempt_id] = 0

    # -----------------------------------
    # OTHER EVENTS (WITH COOLDOWN)
    # -----------------------------------
    if event and now - last_event_time[attempt_id] > EVENT_COOLDOWN:
        log_event(event, attempt_id)
        last_event_time[attempt_id] = now

    response.update(evaluate_attempt(attempt_id))
    return jsonify(response)
