"""
Package Service API - Cho Parent và School mua gói dịch vụ
Chạy sau khi đã migration database
"""

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from models import Package, Payment, User
# from common import get_session, get_current_user
from apiSQL import get_session, get_current_user
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import PayPOS client at module level to avoid import issues
try:
    from paypos_client import paypos_client
    from paypos_config import PAYPOS_CONFIG
    PAYPOS_AVAILABLE = True
    logger.info("PayPOS client imported successfully")
except ImportError as e:
    PAYPOS_AVAILABLE = False
    logger.warning(f"PayPOS client not available: {e}")

router = APIRouter(prefix="/api/package-service", tags=["📦 Package Service"])

# --- PACKAGE SERVICE FOR PARENT & SCHOOL ---
@router.get("/", response_model=List[Package])
def get_available_packages(session: Session = Depends(get_session)):
    """Lấy danh sách các gói dịch vụ đang hoạt động (public)"""
    packages = session.exec(select(Package).where(Package.is_active == True)).all()
    return packages

@router.get("/{package_id}", response_model=Package)
def get_package_details(package_id: int, session: Session = Depends(get_session)):
    """Lấy chi tiết gói dịch vụ"""
    package = session.get(Package, package_id)
    if not package or not package.is_active:
        raise HTTPException(status_code=404, detail="Package not found or inactive")
    return package

@router.post("/{package_id}/purchase")
def purchase_package(
    package_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mua gói dịch vụ (Parent/School)"""
    
    # Validate user role
    if user.role not in ["parent", "school"]:
        raise HTTPException(status_code=403, detail="Only parents and schools can purchase packages")
    
    # Validate package exists and is active
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if not package.is_active:
        raise HTTPException(status_code=400, detail="Package is not active")
    
    # Check if user already has active package
    if user.active_package_id and user.package_expiry_date and user.package_expiry_date > datetime.utcnow():
        raise HTTPException(
            status_code=400, 
            detail="You already have an active package. Please wait for it to expire or contact admin"
        )
    
    # Check for ANY pending payment for this user (not just same package)
    existing_pending = session.exec(
        select(Payment).where(
            Payment.user_id == user.id,
            Payment.status == "Pending"
        )
    ).first()
    
    if existing_pending:
        # Block new payment creation if user has any pending payment
        logger.info(f"Found existing pending payment {existing_pending.id} for user {user.id}")
        raise HTTPException(
            status_code=400, 
            detail=f"Bạn đã có một giao dịch đang chờ thanh toán (ID: {existing_pending.id}). Vui lòng hoàn tất hoặc hủy giao dịch đó trước khi tạo giao dịch mới."
        )
    
    # Cleanup old pending payments for this user (older than 30 minutes)
    cutoff_time = datetime.utcnow() - timedelta(minutes=30)
    old_pending_payments = session.exec(
        select(Payment).where(
            Payment.user_id == user.id,
            Payment.status == "Pending",
            Payment.transaction_date < cutoff_time
        )
    ).all()
    
    for old_payment in old_pending_payments:
        old_payment.status = "Expired"
        session.add(old_payment)
    
    if old_pending_payments:
        session.commit()
        print(f"Cleaned up {len(old_pending_payments)} old pending payments for user {user.id}")
    
    # Generate unique order_id
    timestamp = int(datetime.utcnow().timestamp())
    order_id = f"PKG_{user.id}_{timestamp}_{package_id}"
    
    # Create payment record
    payment = Payment(
        user_id=user.id,
        package_id=package_id,
        amount=package.price,
        method="PayPOS",
        status="Pending",
        transaction_id=order_id
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Create PayPOS payment link directly
    logger.info(f"Creating payment for user {user.id}, package {package_id}, payment_id {payment.id}")
    
    # Base response data
    base_response = {
        "payment_id": payment.id,
        "amount": payment.amount,
        "package_name": package.name,
        "transaction_id": payment.transaction_id,
        "package_details": {
            "id": package.id,
            "name": package.name,
            "price": package.price,
            "duration_days": package.duration_days,
            "camera_limit": package.camera_limit,
            "ai_features": json.loads(package.ai_features) if package.ai_features else [],
            "storage_days": package.storage_days,
            "description": package.description
        }
    }
    
    # Try PayPOS integration
    if PAYPOS_AVAILABLE:
        try:
            # Prepare PayPOS order data
            # Sử dụng return_url và cancel_url từ config (đã deploy lên Vercel)
            return_url = f"{PAYPOS_CONFIG['return_url']}/{payment.id}"
            cancel_url = PAYPOS_CONFIG['cancel_url']
            
            order_data = {
                "order_id": payment.transaction_id,
                "amount": int(package.price),
                "description": f"Thanh toán gói {package.name}"[:25],
                "package_name": package.name,
                "return_url": return_url,
                "cancel_url": cancel_url
            }
            
            logger.info(f"Creating PayOS payment for order: {order_data}")
            paypos_result = paypos_client.create_payment_request(order_data)
            logger.info(f"PayOS result: {paypos_result}")
            
            if paypos_result and paypos_result.get("success"):
                # ✅ QUAN TRỌNG: Update transaction_id với orderCode từ PayOS
                # PayOS trả về orderCode (ví dụ: 27904233) và webhook sẽ gửi lại orderCode này
                # Cần update để webhook có thể tìm thấy payment
                payment.transaction_id = str(paypos_result["order_id"])
                session.add(payment)
                session.commit()
                logger.info(f"Updated payment {payment.id} transaction_id to PayOS orderCode: {paypos_result['order_id']}")
                
                return {
                    **base_response,
                    "payment_url": paypos_result["payment_url"],
                    "order_id": paypos_result["order_id"],
                    "status": "redirect_to_paypos",
                    "redirect_url": paypos_result["payment_url"],
                    "message": "Payment created successfully. Redirecting to PayPOS."
                }
            else:
                logger.warning(f"PayPOS creation failed: {paypos_result}")
                # Fallback to payment page
                return {
                    **base_response,
                    "redirect_url": f"/payment/package/{package_id}",
                    "status": "redirect_to_payment_page",
                    "message": "Payment created successfully. Redirect to payment page.",
                    "error": f"PayPOS creation failed: {paypos_result.get('error', 'Unknown error') if paypos_result else 'No response'}"
                }
        except Exception as e:
            logger.error(f"PayOS API error: {str(e)}")
            # Fallback to demo PayPOS URL
            return {
                **base_response,
                "payment_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
                "order_id": payment.transaction_id,
                "status": "redirect_to_paypos",
                "redirect_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
                "message": "Payment created successfully. Redirecting to PayPOS (Demo mode).",
                "demo": True,
                "error": f"PayOS API error: {str(e)}"
            }
    else:
        logger.warning("PayPOS client not available, using demo mode")
        # PayPOS not available, use demo mode
        return {
            **base_response,
            "payment_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
            "order_id": payment.transaction_id,
            "status": "redirect_to_paypos",
            "redirect_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
            "message": "Payment created successfully. Redirecting to PayPOS (Demo mode).",
            "demo": True,
            "error": "PayPOS client not available"
        }


@router.get("/user/current")
def get_user_current_package(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Lấy gói dịch vụ hiện tại của user"""
    
    if not user.active_package_id:
        return {
            "has_package": False,
            "message": "No active package"
        }
    
    package = session.get(Package, user.active_package_id)
    if not package:
        return {
            "has_package": False,
            "message": "Package not found"
        }
    
    # Check if package is still active
    is_active = user.package_expiry_date and user.package_expiry_date > datetime.utcnow()
    
    return {
        "has_package": True,
        "is_active": is_active,
        "package": {
            "id": package.id,
            "name": package.name,
            "price": package.price,
            "duration_days": package.duration_days,
            "camera_limit": package.camera_limit,
            "ai_features": json.loads(package.ai_features) if package.ai_features else [],
            "storage_days": package.storage_days,
            "description": package.description
        },
        "expiry_date": user.package_expiry_date,
        "days_remaining": (user.package_expiry_date - datetime.utcnow()).days if user.package_expiry_date and user.package_expiry_date > datetime.utcnow() else 0
    }

@router.get("/user/pending-payment")
def get_user_pending_payment(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Lấy payment đang pending của user"""
    
    pending_payment = session.exec(
        select(Payment).where(
            Payment.user_id == user.id,
            Payment.status == "Pending"
        )
    ).first()
    
    if not pending_payment:
        return {
            "has_pending": False,
            "message": "No pending payment"
        }
    
    package = session.get(Package, pending_payment.package_id)
    
    return {
        "has_pending": True,
        "payment": {
            "id": pending_payment.id,
            "amount": pending_payment.amount,
            "status": pending_payment.status,
            "method": pending_payment.method,
            "transaction_id": pending_payment.transaction_id,
            "transaction_date": pending_payment.transaction_date,
            "package": {
                "id": package.id,
                "name": package.name,
                "price": package.price,
                "duration_days": package.duration_days
            } if package else None
        }
    }

@router.post("/payment/{payment_id}/retry")
def retry_payment(payment_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Tạo lại payment link cho payment đang pending"""
    
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if payment.status != "Pending":
        raise HTTPException(status_code=400, detail="Payment is not pending")
    
    package = session.get(Package, payment.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Create PayPOS payment link
    if PAYPOS_AVAILABLE:
        try:
            # Sử dụng return_url và cancel_url từ config (đã deploy lên Vercel)
            return_url = f"{PAYPOS_CONFIG['return_url']}/{payment.id}"
            cancel_url = PAYPOS_CONFIG['cancel_url']
            
            order_data = {
                "order_id": payment.transaction_id,
                "amount": int(payment.amount),
                "description": f"Thanh toán gói {package.name}"[:25],
                "package_name": package.name,
                "return_url": return_url,
                "cancel_url": cancel_url
            }
            
            logger.info(f"Retrying PayOS payment for order: {order_data}")
            paypos_result = paypos_client.create_payment_request(order_data)
            logger.info(f"PayOS retry result: {paypos_result}")
            
            if paypos_result and paypos_result.get("success"):
                # ✅ QUAN TRỌNG: Update transaction_id với orderCode từ PayOS
                # PayOS trả về orderCode (ví dụ: 27904233) và webhook sẽ gửi lại orderCode này
                # Cần update để webhook có thể tìm thấy payment
                payment.transaction_id = str(paypos_result["order_id"])
                session.add(payment)
                session.commit()
                logger.info(f"Updated payment {payment.id} transaction_id to PayOS orderCode: {paypos_result['order_id']}")
                
                return {
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "package_name": package.name,
                    "transaction_id": payment.transaction_id,
                    "payment_url": paypos_result["payment_url"],
                    "order_id": paypos_result["order_id"],
                    "status": "redirect_to_paypos",
                    "redirect_url": paypos_result["payment_url"],
                    "message": "Payment link created successfully. Redirecting to PayPOS."
                }
            else:
                logger.warning(f"PayPOS retry failed: {paypos_result}")
                return {
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "package_name": package.name,
                    "transaction_id": payment.transaction_id,
                    "redirect_url": f"/payment/package/{package.id}",
                    "status": "redirect_to_payment_page",
                    "message": "Payment link created successfully. Redirect to payment page.",
                    "error": f"PayPOS creation failed: {paypos_result.get('error', 'Unknown error') if paypos_result else 'No response'}"
                }
        except Exception as e:
            logger.error(f"PayOS retry API error: {str(e)}")
            return {
                "payment_id": payment.id,
                "amount": payment.amount,
                "package_name": package.name,
                "transaction_id": payment.transaction_id,
                "payment_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
                "order_id": payment.transaction_id,
                "status": "redirect_to_paypos",
                "redirect_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
                "message": "Payment link created successfully. Redirecting to PayPOS (Demo mode).",
                "demo": True,
                "error": f"PayOS API error: {str(e)}"
            }
    else:
        logger.warning("PayPOS client not available, using demo mode for retry")
        return {
            "payment_id": payment.id,
            "amount": payment.amount,
            "package_name": package.name,
            "transaction_id": payment.transaction_id,
            "payment_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
            "order_id": payment.transaction_id,
            "status": "redirect_to_paypos",
            "redirect_url": f"https://demo-paypos.com/payment/{payment.transaction_id}",
            "message": "Payment link created successfully. Redirecting to PayPOS (Demo mode).",
            "demo": True,
            "error": "PayPOS client not available"
        }

@router.get("/user/payments")
def get_user_payment_history(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Lấy lịch sử thanh toán của user"""
    
    payments = session.exec(select(Payment).where(Payment.user_id == user.id).order_by(Payment.transaction_date.desc())).all()
    
    result = []
    for payment in payments:
        package = session.get(Package, payment.package_id)
        result.append({
            "id": payment.id,
            "amount": payment.amount,
            "method": payment.method,
            "status": payment.status,
            "transaction_id": payment.transaction_id,
            "transaction_date": payment.transaction_date,
            "expiry_date": payment.expiry_date,
            "package": {
                "id": package.id if package else None,
                "name": package.name if package else "Package not found",
                "duration_days": package.duration_days if package else 0
            } if package else None
        })
    
    return result

@router.post("/{package_id}/extend")
def extend_package(
    package_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Gia hạn gói dịch vụ hiện tại"""
    
    # Validate user role
    if user.role not in ["parent", "school"]:
        raise HTTPException(status_code=403, detail="Only parents and schools can extend packages")
    
    # Validate package exists
    package = session.get(Package, package_id)
    if not package or not package.is_active:
        raise HTTPException(status_code=404, detail="Package not found or inactive")
    
    # Check if user has this package
    if user.active_package_id != package_id:
        raise HTTPException(status_code=400, detail="You don't have this package")
    
    # Check if package is still active
    if not user.package_expiry_date or user.package_expiry_date <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Your package has expired")
    
    # Create payment for extension
    payment = Payment(
        user_id=user.id,
        package_id=package_id,
        amount=package.price,
        method="PayPOS",
        status="Pending",
        transaction_id=f"EXT_{user.id}_{int(datetime.utcnow().timestamp())}"
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return {
        "payment_id": payment.id,
        "amount": payment.amount,
        "package_name": package.name,
        "current_expiry": user.package_expiry_date,
        "new_expiry": user.package_expiry_date + timedelta(days=package.duration_days) if user.package_expiry_date else datetime.utcnow() + timedelta(days=package.duration_days),
        "redirect_url": f"/payment/{payment.id}",
        "message": "Extension payment created successfully. Redirect to payment page."
    }

