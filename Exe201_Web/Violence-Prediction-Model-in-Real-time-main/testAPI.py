import websocket, base64, cv2

ws = websocket.WebSocket()
ws.connect("ws://127.0.0.1:8000/ws/detect")

# test bằng 1 ảnh
img = cv2.imread("/home/shuilee/Pictures/124.png")
_, buf = cv2.imencode(".png", img)
ws.send(base64.b64encode(buf).decode("utf-8"))

print(ws.recv())
