from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from model_utils import detect_violence

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from model_utils import detect_violence  # hàm đã tách riêng ở file model_utils.py

app = FastAPI(title="Violence Detection API")

# Route root để test nhanh
@app.get("/")
def root():
    return {"msg": "Violence Detection API is running!"}

# Route detect violence từ 1 ảnh upload
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """
    Upload 1 frame (ảnh) → trả về JSON kết quả detect
    """
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return JSONResponse(content={"error": "Invalid image"}, status_code=400)

    detections, inference_time = detect_violence(image)

    return {
        "detections": detections,
        "inference_time": inference_time
    }

