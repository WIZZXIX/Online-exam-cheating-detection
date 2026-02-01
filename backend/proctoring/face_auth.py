import cv2
import numpy as np
from deepface import DeepFace
from numpy.linalg import norm

# -----------------------------------
# MODEL CONFIG
# -----------------------------------
MODEL_NAME = "Facenet512"     # stable + accurate
DISTANCE_THRESHOLD = 0.35     # tuned for Facenet512 (strict)


# -----------------------------------
# FACE EMBEDDING
# -----------------------------------
def get_face_embedding(face_img):
    try:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)

        result = DeepFace.represent(
            img_path=face_img,
            model_name="Facenet512",
            enforce_detection=False
        )

        if not result or "embedding" not in result[0]:
            return None

        return result[0]["embedding"]

    except Exception as e:
        print("❌ Face embedding error:", e)
        return None



# -----------------------------------
# DISTANCE METRICS
# -----------------------------------
def cosine_distance(vec1, vec2):
    v1 = np.array(vec1)
    v2 = np.array(vec2)

    return 1 - np.dot(v1, v2) / (norm(v1) * norm(v2))


def is_face_match(ref_embedding, curr_embedding):
    """
    returns: (is_match: bool, distance: float)
    """
    distance = cosine_distance(ref_embedding, curr_embedding)
    return distance <= DISTANCE_THRESHOLD, distance
