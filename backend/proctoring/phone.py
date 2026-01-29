from ultralytics import YOLO

model = YOLO("yolo11n.pt")
PHONE_CLASS_ID = 67

def detect_phone(frame):
    results = model.predict(frame, conf=0.45, verbose=False)
    for r in results:
        if r.boxes:
            for box in r.boxes:
                if int(box.cls[0]) == PHONE_CLASS_ID:
                    return True
    return False
