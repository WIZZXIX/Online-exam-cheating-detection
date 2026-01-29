from flask import Blueprint, request, jsonify
import cv2, base64, time
import numpy as np

from proctoring.face import analyze_face
from proctoring.phone import detect_phone
from db.events import log_event
from db.attempts import evaluate_attempt

proctoring_bp = Blueprint("proctoring", __name__)

# state
last_direction = "CENTER"
last_log_time = 0
LOG_COOLDOWN = 2


@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    global last_direction, last_log_time

    data = request.json
    attempt_id = data["attempt_id"]

    image_bytes = base64.b64decode(data["image"].split(",")[1])
    frame = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "phone_detected": False,
        "status": None,
        "warning": None
    }

    # 📱 PHONE DETECTION
    phone_detected = detect_phone(frame)
    response["phone_detected"] = phone_detected

    if phone_detected:
        log_event("PHONE_DETECTED", attempt_id)

    # 👤 FACE ANALYSIS
    face_result = analyze_face(frame)

    response["faces_detected"] = face_result["faces"]
    response["direction"] = face_result["direction"]

    # ❗ IMPORTANT: ONLY STRINGS GO INTO log_event
    if face_result["event"] is not None:
        log_event(face_result["event"], attempt_id)

    # evaluate score & warnings
    result = evaluate_attempt(attempt_id)
    response.update(result)

    return jsonify(response)
