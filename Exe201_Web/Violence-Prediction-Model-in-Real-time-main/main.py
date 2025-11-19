# main.py (đã cập nhật)
from fastapi import FastAPI, WebSocket
import cv2, numpy as np, base64, requests, json
from model_utils import detect_violence

app = FastAPI(title="Violence Detection API")

SAFENEST_API_URL = "http://localhost:8000"

DEFAULT_CHILD_ID = 1
DEFAULT_CAMERA_ID = 1

@app.websocket("/ws/detect")
async def ws_detect(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()

            try:
                payload = json.loads(data)
                img_b64 = payload["image"]
                child_id = int(payload.get("child_id", DEFAULT_CHILD_ID))
                camera_id = int(payload.get("camera_id", DEFAULT_CAMERA_ID))
            except (json.JSONDecodeError, KeyError):
                img_b64 = data
                child_id = DEFAULT_CHILD_ID
                camera_id = DEFAULT_CAMERA_ID

            # Giải mã ảnh
            img_data = base64.b64decode(img_b64)
            np_arr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if image is None:
                await websocket.send_json({"error": "Invalid image"})
                continue

            # Detect
            detections, inference_time = detect_violence(image)

            # GỬI CẢNH BÁO NẾU PHÁT HIỆN VIOLENCE
            violence_detections = [d for d in detections if d["class"].lower() == "violence"]
            if violence_detections:
                try:
                    response = requests.post(
                        f"{SAFENEST_API_URL}/internal/alert/create",
                        json={
                            "child_id": child_id,
                            "camera_id": camera_id,
                            "alert_type": "violence",
                            "severity": 2
                        },
                        timeout=3
                    )
                    if response.status_code == 200:
                        print(f"✅ Tạo cảnh báo thành công: {response.json()}")
                    else:
                        print(f"⚠️ Lỗi tạo cảnh báo: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"❌ Lỗi gọi API cảnh báo: {e}")

            # Trả kết quả về frontend
            await websocket.send_json({
                "detections": detections,
                "inference_time": inference_time
            })

        except Exception as e:
            print("WebSocket error:", e)
            break