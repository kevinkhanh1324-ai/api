"""
PayPOS Configuration
Thông tin cấu hình PayPOS API
"""

# PayPOS API Configuration
# Using real PayOS credentials
PAYPOS_CONFIG = {
    "client_id": "c70a3ef3-1a29-4649-b85d-1e95824c7ff9",
    "api_key": "6abd8c3b-7990-45f5-8880-36fdf14a5585", 
    "checksum_key": "8583541673877adbb60dc76f413b09c397f1e6a27d4c0743b001910fd5dea2d1",
    "base_url": "https://api-merchant.payos.vn",  # PayOS API base URL
    "webhook_url": "https://your-domain.com/api/paypos/webhook",  # Webhook URL for PayOS callbacks (update for production)
    "return_url": "http://localhost:3000/payment/success",  # Frontend return URL
    "cancel_url": "http://localhost:3000/payment/cancel"   # Frontend cancel URL
}

# Environment variables (recommended for production)
import os
PAYPOS_CONFIG.update({
    "client_id": os.getenv("PAYPOS_CLIENT_ID", PAYPOS_CONFIG["client_id"]),
    "api_key": os.getenv("PAYPOS_API_KEY", PAYPOS_CONFIG["api_key"]),
    "checksum_key": os.getenv("PAYPOS_CHECKSUM_KEY", PAYPOS_CONFIG["checksum_key"]),
    "webhook_url": os.getenv("PAYPOS_WEBHOOK_URL", PAYPOS_CONFIG["webhook_url"]),
    "return_url": os.getenv("PAYPOS_RETURN_URL", PAYPOS_CONFIG["return_url"]),
    "cancel_url": os.getenv("PAYPOS_CANCEL_URL", PAYPOS_CONFIG["cancel_url"])
})
