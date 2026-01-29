import cv2
import mediapipe as mp

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=2,
    refine_landmarks=True
)

def analyze_face(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        return {
            "faces": 0,
            "direction": "NONE",
            "event": "NO_FACE"
        }

    if len(result.multi_face_landmarks) > 1:
        return {
            "faces": len(result.multi_face_landmarks),
            "direction": "MULTIPLE",
            "event": "MULTIPLE_FACES"
        }

    landmarks = result.multi_face_landmarks[0].landmark

    nose_x = landmarks[1].x
    left = landmarks[234].x
    right = landmarks[454].x

    offset = nose_x - ((left + right) / 2)

    if offset > 0.06:
        return {"faces": 1, "direction": "LEFT", "event": "LOOKING_LEFT"}
    if offset < -0.06:
        return {"faces": 1, "direction": "RIGHT", "event": "LOOKING_RIGHT"}

    return {"faces": 1, "direction": "CENTER", "event": None}
