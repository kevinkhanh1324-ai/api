import cv2
import numpy as np
from ultralytics import YOLO
import time

# Load YOLO model khi import module
MODEL_PATH = "/home/shuilee/Python/EXE201/Violence-Prediction/Violence-Prediction-Model-in-Real-time-main/weight/best.pt"   # 👉 chỉnh path tới file weight
model = YOLO(MODEL_PATH)
model_names = model.names

def detect_violence(image: np.ndarray, conf_thres: float = 0.25):
    """
    Detect violence trong 1 frame ảnh.
    Trả về danh sách detections dạng JSON-friendly.
    """
    start = time.time()
    results = model(image, conf=conf_thres)
    detections = []

    for result in results:
        for box, cls, conf in zip(result.boxes.xyxy, result.boxes.cls, result.boxes.conf):
            detections.append({
                "class": model_names[int(cls)],
                "confidence": float(conf),
                "box": [float(x) for x in box]  # [x1,y1,x2,y2]
            })

    end = time.time()
    return detections, round(end - start, 3)
