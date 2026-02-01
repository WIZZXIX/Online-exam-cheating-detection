from flask import Blueprint, request, jsonify
import base64
import cv2
import numpy as np

from proctoring.face import extract_face
from proctoring.face_auth import get_face_embedding
from db.attempts import save_face_embedding, is_face_registered

bp = Blueprint("face_auth", __name__)


def decode_base64_image(data):
    img_bytes = base64.b64decode(data.split(",")[1])
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

@bp.route("/capture-face", methods=["POST"])
def capture_face():
    data = request.json
    print("CAPTURE FACE PAYLOAD:", data)

    attempt_id = data.get("attempt_id")
    frame = data.get("frame") or data.get("image")  # ✅ FIX

    if attempt_id is None or frame is None:
        return jsonify({
            "error": "Invalid payload",
            "received": data
        }), 400

    try:
        attempt_id = int(attempt_id)
    except ValueError:
        return jsonify({"error": "Invalid attempt_id"}), 400

    image = decode_base64_image(frame)

    face, face_count, landmark = extract_face(image)

    if face_count == 0:
        return jsonify({"error": "No face detected"}), 400

    if face_count > 1:
        return jsonify({"error": "Multiple faces detected"}), 400


    embedding = get_face_embedding(face)

    if embedding is None:
        return jsonify({
            "error": "FACE_EMBEDDING_FAILED",
            "message": "Unable to extract face features. Please adjust lighting and face the camera."
        }), 400

    save_face_embedding(attempt_id, embedding)

    return jsonify({
        "status": "FACE_REGISTERED"
    })