"""
Package Service API - Cho Parent và School mua gói dịch vụ
Chạy sau khi đã migration database
"""

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from models import Package, Payment, User
from apiSQL import get_session, get_current_user
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import PayPOS client at module level to avoid import issues
try:
    from paypos_client import paypos_client
    PAYPOS_AVAILABLE = True
    logger.info("PayPOS client imported successfully")
except ImportError as e:
    PAYPOS_AVAILABLE = False
    logger.warning(f"PayPOS client not available: {e}")

router = APIRouter(prefix="/api/packages", tags=["📦 Package Service"])

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
    
    # Check for very recent pending payment for same package (within last 10 seconds)
    # This prevents double-click, but allows creating new payment if old one is stuck
    recent_cutoff = datetime.utcnow() - timedelta(seconds=10)
    recent_pending = session.exec(
        select(Payment).where(
            Payment.user_id == user.id,
            Payment.package_id == package_id,
            Payment.status == "Pending",
            Payment.transaction_date > recent_cutoff
        )
    ).first()
    
    if recent_pending:
        raise HTTPException(
            status_code=400,
            detail="A payment for this package is already being processed. Please wait a moment."
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
            order_data = {
                "order_id": payment.transaction_id,
                "amount": int(package.price),
                "description": f"Thanh toán gói {package.name}",
                "package_name": package.name,
                "return_url": f"http://localhost:3000/payment/success/{payment.id}",
                "cancel_url": f"http://localhost:3000/payment/cancel"
            }
            
            logger.info(f"Creating PayOS payment for order: {order_data}")
            paypos_result = paypos_client.create_payment_request(order_data)
            logger.info(f"PayOS result: {paypos_result}")
            
            if paypos_result and paypos_result.get("success"):
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

# --- CLEANUP INVALID PAYMENTS ---
@router.post("/cleanup-invalid-payments")
def cleanup_invalid_payments(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cleanup payments with invalid package references for current user"""
    try:
        # Find payments with package_id that don't exist for this user
        user_payments = session.exec(
            select(Payment).where(Payment.user_id == user.id)
        ).all()
        
        invalid_payments = []
        for payment in user_payments:
            package = session.get(Package, payment.package_id)
            if not package:
                invalid_payments.append(payment)
        
        count = 0
        for payment in invalid_payments:
            payment.status = "Invalid"
            session.add(payment)
            count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cleaned up {count} invalid payments",
            "count": count
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- FORCE CLEANUP OLD PENDING PAYMENTS ---
@router.post("/force-cleanup-pending")
def force_cleanup_old_pending_payments(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Force cleanup old pending payments for current user (older than 5 minutes)"""
    try:
        # Find payments that are pending for more than 5 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=5)
        
        old_pending_payments = session.exec(
            select(Payment).where(
                Payment.user_id == user.id,
                Payment.status == "Pending",
                Payment.transaction_date < cutoff_time
            )
        ).all()
        
        count = 0
        for payment in old_pending_payments:
            payment.status = "Expired"
            session.add(payment)
            count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cleaned up {count} old pending payments",
            "count": count
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- TEST PAYPOS CONNECTION ---
@router.get("/test-paypos")
def test_paypos_connection():
    """Test PayPOS connection and configuration"""
    try:
        if not PAYPOS_AVAILABLE:
            return {
                "success": False,
                "error": "PayPOS client not available",
                "demo_mode": True
            }
        
        # Test basic PayPOS client functionality
        test_result = {
            "success": True,
            "paypos_available": PAYPOS_AVAILABLE,
            "client_id": paypos_client.client_id if hasattr(paypos_client, 'client_id') else "Not set",
            "base_url": paypos_client.base_url if hasattr(paypos_client, 'base_url') else "Not set",
            "demo_mode": False
        }
        
        logger.info(f"PayPOS test result: {test_result}")
        return test_result
        
    except Exception as e:
        logger.error(f"PayPOS test error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "demo_mode": True
        }
