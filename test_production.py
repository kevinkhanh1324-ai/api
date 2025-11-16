import requests
import time
import json

def test_production():
    """Test production API"""
    url = "https://safenestai.onrender.com"
    
    print(f"🧪 Testing: {url}")
    print("=" * 50)
    
    try:
        # Health check
        health_response = requests.get(f"{url}/", timeout=10)
        print("✅ Health Check:", health_response.json())
        
        # Test login
        login_data = {
            "email": "admin@example.com", 
            "password": "admin123"
        }
        
        login_response = requests.post(
            f"{url}/api/auth/login", 
            json=login_data, 
            timeout=15
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            print("🎉 LOGIN SUCCESS!")
            print(f"✅ Role: {token_data.get('role')}")
            print("✅ Database: Connected")
            print("🚀 Production Status: FULLY OPERATIONAL!")
            return True
        else:
            print(f"❌ Login Status: {login_response.status_code}")
            print(f"❌ Error: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    test_production()