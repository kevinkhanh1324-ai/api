import cv2
import numpy as np
import time
import os
import torch

# Lưu bản gốc của torch.load
_original_torch_load = torch.load

def _torch_load_wrapper(*args, **kwargs):
    # Nếu không có weights_only, mặc định là False (cho phép load checkpoint cũ)
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)

# Ghi đè torch.load tạm thời
torch.load = _torch_load_wrapper

# Bây giờ mới import Ultralytics và load model
from ultralytics import YOLO

MODEL_PATH = os.path.join(os.path.dirname(__file__), "weight", "best.pt")
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