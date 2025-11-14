"""
PayPOS Client - Tích hợp với PayPOS API thực tế
"""

import hashlib
import hmac
import json
import requests
import time
from datetime import datetime
from typing import Dict, Any, Optional
from paypos_config import PAYPOS_CONFIG

class PayPOSClient:
    def __init__(self):
        self.client_id = PAYPOS_CONFIG["client_id"]
        self.api_key = PAYPOS_CONFIG["api_key"]
        self.checksum_key = PAYPOS_CONFIG["checksum_key"]
        self.base_url = PAYPOS_CONFIG["base_url"]
        self.webhook_url = PAYPOS_CONFIG["webhook_url"]
        self.return_url = PAYPOS_CONFIG["return_url"]
        self.cancel_url = PAYPOS_CONFIG["cancel_url"]
    
    def generate_checksum(self, data: str) -> str:
        """Tạo checksum cho PayPOS"""
        return hmac.new(
            self.checksum_key.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def create_payment_request(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo yêu cầu thanh toán PayOS
        
        Args:
            order_data: {
                "order_id": "PKG_123_1234567890",
                "amount": 500000,
                "description": "Thanh toán gói dịch vụ",
                "return_url": "https://your-domain.com/payment/success/123",
                "cancel_url": "https://your-domain.com/payment/cancel/123"
            }
        """
        try:
            # PayOS API endpoint - sử dụng đúng endpoint
            url = f"{self.base_url}/v2/payment-requests"
            
            # Headers
            headers = {
                "Content-Type": "application/json",
                "x-client-id": self.client_id,
                "x-api-key": self.api_key
            }
            
            # Request body theo PayOS API format đúng
            # Generate a simple numeric order code for PayOS
            order_code = int(time.time() * 1000) % 100000000  # 8-digit number
            payload = {
                "orderCode": order_code,
                "amount": order_data["amount"],
                "description": order_data["description"],
                "returnUrl": order_data.get("return_url", self.return_url),
                "cancelUrl": order_data.get("cancel_url", self.cancel_url)
            }
            
            # Generate signature theo format PayOS đúng
            # PayOS signature format: sorted fields with & separator (without webhookUrl in signature)
            raw = f"amount={payload['amount']}&cancelUrl={payload['cancelUrl']}&description={payload['description']}&orderCode={payload['orderCode']}&returnUrl={payload['returnUrl']}"
            signature = hmac.new(self.checksum_key.encode(), raw.encode(), hashlib.sha256).hexdigest()
            payload["signature"] = signature
            
            print(f"PayOS Request payload: {payload}")
            print(f"PayOS Request signature raw: {raw}")
            print(f"PayOS Request signature: {signature}")
            
            # Make request
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response text: {response.text}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    print("Response JSON received successfully")
                    print(f"Response code: {result.get('code')}")
                    print(f"Response message: {result.get('message')}")
                    print(f"Response data: {result.get('data')}")
                    
                    # Check if response indicates success
                    if result.get("code") == "00":
                        inner_data = result.get("data", {})
                        return {
                            "success": True,
                            "payment_url": inner_data.get("checkoutUrl"),
                            "qr_code": inner_data.get("qrCode"),
                            "order_id": payload["orderCode"],
                            "data": result
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"PayOS API error: {result.get('code')} - {result.get('message', 'Unknown error')}",
                            "data": result
                        }
                except Exception as json_error:
                    print(f"JSON parsing error: {json_error}")
                    return {
                        "success": False,
                        "error": f"PayOS response parsing error: {str(json_error)}",
                        "details": response.text
                    }
            else:
                return {
                    "success": False,
                    "error": f"PayOS API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"PayOS request failed: {str(e)}"
            }
    
    def verify_webhook(self, webhook_data: Dict[str, Any], signature: str) -> bool:
        """
        Xác thực webhook từ PayPOS
        
        Args:
            webhook_data: Dữ liệu webhook
            signature: Chữ ký từ PayPOS
        """
        try:
            # Tạo checksum từ dữ liệu webhook
            data_str = json.dumps(webhook_data, separators=(',', ':'))
            expected_signature = self.generate_checksum(data_str)
            
            # So sánh signature
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            print(f"Webhook verification failed: {e}")
            return False
    
    def get_payment_status(self, order_id: str) -> Dict[str, Any]:
        """
        Kiểm tra trạng thái thanh toán
        
        Args:
            order_id: ID đơn hàng
        """
        try:
            url = f"{self.base_url}/v2/payment-requests/{order_id}"
            
            headers = {
                "x-client-id": self.client_id,
                "x-api-key": self.api_key
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"PayPOS API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"PayPOS request failed: {str(e)}"
            }
    
    def cancel_payment(self, order_id: str) -> Dict[str, Any]:
        """
        Hủy thanh toán
        
        Args:
            order_id: ID đơn hàng
        """
        try:
            url = f"{self.base_url}/v2/payment-requests/{order_id}/cancel"
            
            headers = {
                "Content-Type": "application/json",
                "x-client-id": self.client_id,
                "x-api-key": self.api_key
            }
            
            response = requests.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"PayPOS API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"PayPOS request failed: {str(e)}"
            }

# Global instance
paypos_client = PayPOSClient()
