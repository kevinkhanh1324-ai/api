#!/usr/bin/env python3
"""
Script để test xem các server có chạy đúng không
"""
import requests
import websocket
import json
import base64
import time

def test_main_api():
    """Test main API server (port 8000)"""
    print("=== Testing Main API Server (Port 8000) ===")
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Main API Server is running")
            return True
        else:
            print(f"❌ Main API Server error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Main API Server not accessible: {e}")
        return False

def test_violence_detection_api():
    """Test violence detection API server (port 8888)"""
    print("\n=== Testing Violence Detection API Server (Port 8888) ===")
    try:
        response = requests.get("http://localhost:8888/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Violence Detection API Server is running")
            return True
        else:
            print(f"❌ Violence Detection API Server error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Violence Detection API Server not accessible: {e}")
        return False

def test_websocket_connection():
    """Test WebSocket connection to violence detection server"""
    print("\n=== Testing WebSocket Connection ===")
    
    def on_message(ws, message):
        try:
            data = json.loads(message)
            print(f"✅ Received WebSocket message: {data}")
            ws.close()
        except Exception as e:
            print(f"❌ Error parsing WebSocket message: {e}")
            ws.close()
    
    def on_error(ws, error):
        print(f"❌ WebSocket error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("🔌 WebSocket connection closed")
    
    def on_open(ws):
        print("✅ WebSocket connection opened")
        # Gửi test message
        test_payload = {
            "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",  # 1x1 pixel
            "child_id": 1,
            "camera_id": 1
        }
        ws.send(json.dumps(test_payload))
    
    try:
        ws = websocket.WebSocketApp(
            "ws://localhost:8888/ws/detect",
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        ws.run_forever()
        return True
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Server Connections...")
    
    main_api_ok = test_main_api()
    violence_api_ok = test_violence_detection_api()
    websocket_ok = test_websocket_connection()
    
    print("\n" + "="*50)
    print("📊 SUMMARY:")
    print(f"Main API Server (8000): {'✅ OK' if main_api_ok else '❌ FAIL'}")
    print(f"Violence Detection API (8888): {'✅ OK' if violence_api_ok else '❌ FAIL'}")
    print(f"WebSocket Connection: {'✅ OK' if websocket_ok else '❌ FAIL'}")
    
    if main_api_ok and violence_api_ok and websocket_ok:
        print("\n🎉 All servers are running correctly!")
        print("You can now use the Live Monitoring feature.")
    else:
        print("\n⚠️ Some servers are not running properly.")
        print("Please check the server logs and restart if necessary.")
