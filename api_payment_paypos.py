"""
PayPOS Payment API - Clean Version
Chỉ giữ lại các endpoint cần thiết cho production
"""

from fastapi import APIRouter, Depends, HTTPException, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from models import Payment, Package, User
from apiSQL import get_session, require_role, get_current_user, get_current_user_optional
from paypos_client import paypos_client
import json
import logging

# Setup logger
logger = logging.getLogger(__name__)

# Check if PayPOS client is available
PAYPOS_AVAILABLE = paypos_client is not None

router = APIRouter(prefix="/api/paypos", tags=["💳 PayPOS Payment Management"])

# --- CREATE PAYMENT ---
@router.post("/create")
def create_paypos_payment(
    package_id: int = Form(...),
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Tạo payment mới với PayPOS"""
    try:
        # Use real user if authenticated, otherwise demo user
        user_id = user.id if user else 1
        
        # Get package
        package = session.get(Package, package_id)
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        
        # Check for ANY pending payment for this user (not just same package)
        existing_pending = session.exec(
            select(Payment).where(
                Payment.user_id == user_id,
                Payment.status == "Pending"
            )
        ).first()
        
        if existing_pending:
            # Block new payment creation if user has any pending payment
            logger.info(f"Found existing pending payment {existing_pending.id} for user {user_id}")
            raise HTTPException(
                status_code=400, 
                detail=f"Bạn đã có một giao dịch đang chờ thanh toán (ID: {existing_pending.id}). Vui lòng hoàn tất hoặc hủy giao dịch đó trước khi tạo giao dịch mới."
            )
        
        # Generate unique order_id
        timestamp = int(datetime.utcnow().timestamp())
        order_id = f"PKG_{user_id}_{timestamp}_{package_id}"
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            package_id=package_id,
            amount=package.price,
            method="PayPOS",
            status="Pending",
            transaction_id=order_id
        )
        
        session.add(payment)
        session.commit()
        session.refresh(payment)
        
        # Try PayPOS integration
        if PAYPOS_AVAILABLE:
            try:
                # Prepare PayOS order data
                order_data = {
                    "order_id": payment.transaction_id,
                    "amount": int(package.price),
                    "description": f"Thanh toán gói {package.name}"[:25],
                    "package_name": package.name,
                    "return_url": f"http://localhost:3000/payment/success/{payment.id}",
                    "cancel_url": f"http://localhost:3000/payment/cancel"
                }
                
                logger.info(f"Creating PayOS order for existing payment: {order_data}")
                paypos_result = paypos_client.create_payment_request(order_data)
                logger.info(f"PayOS order created: {paypos_result}")
                
                if paypos_result and paypos_result.get("success"):
                    return {
                        "payment_id": payment.id,
                        "amount": payment.amount,
                        "package_name": package.name,
                        "order_id": paypos_result["order_id"],
                        "payment_url": paypos_result["payment_url"],
                        "status": "redirect_to_paypos"
                    }
                else:
                    logger.warning(f"PayOS order creation failed: {paypos_result}")
                    return {
                        "payment_id": payment.id,
                        "amount": payment.amount,
                        "package_name": package.name,
                        "order_id": payment.transaction_id,
                        "payment_url": None,
                        "status": "paypos_failed",
                        "error": paypos_result.get("error", "PayOS order creation failed") if paypos_result else "No response from PayOS"
                    }
            except Exception as e:
                logger.error(f"PayOS API error: {str(e)}")
                return {
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "package_name": package.name,
                    "order_id": payment.transaction_id,
                    "payment_url": None,
                    "status": "paypos_error",
                    "error": str(e)
                }
        else:
            return {
                "payment_id": payment.id,
                "amount": payment.amount,
                "package_name": package.name,
                "order_id": payment.transaction_id,
                "payment_url": None,
                "status": "paypos_unavailable",
                "error": "PayPOS client not available"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- CREATE PAYOS ORDER FOR EXISTING PAYMENT ---
@router.post("/create-order")
async def create_payos_order_for_existing_payment(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Tạo PayOS order cho payment đã tồn tại"""
    try:
        # Get JSON data from request
        order_data = await request.json()
        
        # Use real user if authenticated, otherwise demo user
        user_id = user.id if user else 1
        
        # Extract data from request
        order_id = order_data.get("order_id")
        amount = order_data.get("amount")
        description = order_data.get("description")
        package_name = order_data.get("package_name")
        return_url = order_data.get("return_url")
        cancel_url = order_data.get("cancel_url")
        
        if not all([order_id, amount, description, package_name, return_url, cancel_url]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Find existing payment by transaction_id
        existing_payment = session.exec(
            select(Payment).where(Payment.transaction_id == order_id)
        ).first()
        
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Check if payment belongs to user
        if existing_payment.user_id != user_id:
            raise HTTPException(status_code=403, detail="Payment does not belong to user")
        
        # Check if payment is still pending
        if existing_payment.status != "Pending":
            raise HTTPException(status_code=400, detail=f"Payment is not pending (status: {existing_payment.status})")
        
        # Try PayPOS integration
        if PAYPOS_AVAILABLE:
            try:
                # Prepare PayOS order data
                payos_order_data = {
                    "order_id": existing_payment.transaction_id,
                    "amount": int(amount),
                    "description": description,
                    "package_name": package_name,
                    "return_url": return_url,
                    "cancel_url": cancel_url
                }
                
                logger.info(f"Creating PayOS order for existing payment: {payos_order_data}")
                paypos_result = paypos_client.create_payment_request(payos_order_data)
                logger.info(f"PayOS order created: {paypos_result}")
                
                if paypos_result and paypos_result.get("success"):
                    return {
                        "payment_id": existing_payment.id,
                        "amount": existing_payment.amount,
                        "package_name": package_name,
                        "order_id": paypos_result["order_id"],
                        "payment_url": paypos_result["payment_url"],
                        "status": "redirect_to_paypos"
                    }
                else:
                    logger.warning(f"PayOS order creation failed: {paypos_result}")
                    return {
                        "payment_id": existing_payment.id,
                        "amount": existing_payment.amount,
                        "package_name": package_name,
                        "order_id": existing_payment.transaction_id,
                        "payment_url": None,
                        "status": "paypos_failed",
                        "error": paypos_result.get("error", "PayOS order creation failed") if paypos_result else "No response from PayOS"
                    }
            except Exception as e:
                logger.error(f"PayOS API error: {str(e)}")
                return {
                    "payment_id": existing_payment.id,
                    "amount": existing_payment.amount,
                    "package_name": package_name,
                    "order_id": existing_payment.transaction_id,
                    "payment_url": None,
                    "status": "paypos_failed",
                    "error": str(e)
                }
        else:
            return {
                "payment_id": existing_payment.id,
                "amount": existing_payment.amount,
                "package_name": package_name,
                "order_id": existing_payment.transaction_id,
                "payment_url": None,
                "status": "paypos_unavailable",
                "error": "PayPOS client not available"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating PayOS order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GET USER PAYMENTS ---
@router.get("/user/{user_id}")
def get_user_payments(
    user_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy danh sách payments của user"""
    try:
        # Check if user is accessing their own data or is admin
        if user.id != user_id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        payments = session.exec(
            select(Payment).where(Payment.user_id == user_id)
        ).all()
        
        payment_list = []
        for payment in payments:
            package = session.get(Package, payment.package_id)
            payment_list.append({
                "id": payment.id,
                "package_name": package.name if package else "Unknown Package",
                "amount": payment.amount,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "method": payment.method,
                "created_at": payment.transaction_date
            })
        
        return {
            "success": True,
            "payments": payment_list
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GET ALL PAYMENTS (ADMIN) ---
@router.get("/")
def get_all_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Lấy tất cả payments (chỉ admin)"""
    try:
        payments = session.exec(select(Payment)).all()
        
        payment_list = []
        for payment in payments:
            package = session.get(Package, payment.package_id)
            payment_list.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "package_name": package.name if package else "Unknown Package",
                "amount": payment.amount,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "method": payment.method,
                "created_at": payment.transaction_date
            })
        
        return {
            "success": True,
            "payments": payment_list
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting all payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- UPDATE PAYMENT STATUS ---
@router.put("/{payment_id}/status")
def update_payment_status(
    payment_id: int,
    status: str = Form(...),
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cập nhật trạng thái payment (chỉ admin)"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        old_status = payment.status
        payment.status = status
        session.add(payment)
        session.commit()
        
        return {
            "success": True,
            "message": f"Payment {payment_id} status updated from {old_status} to {status}",
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "transaction_id": payment.transaction_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GET PAYMENT STATUS ---
@router.get("/{payment_id}/status")
def get_payment_status(
    payment_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy trạng thái payment"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Check if user owns this payment or is admin
        if payment.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        package = session.get(Package, payment.package_id)
        
        return {
            "success": True,
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "amount": payment.amount,
                "package_name": package.name if package else "Unknown Package",
                "transaction_id": payment.transaction_id,
                "created_at": payment.transaction_date
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- PAYOS WEBHOOK ---
@router.post("/webhook")
async def paypos_webhook(request: Request, session: Session = Depends(get_session)):
    """Webhook từ PayOS để cập nhật trạng thái payment"""
    try:
        # Get webhook data
        webhook_data = await request.json()
        logger.info(f"PayOS webhook received: {webhook_data}")
        
        # Extract order information
        order_id = webhook_data.get("orderCode")
        status = webhook_data.get("status")
        
        if not order_id or not status:
            logger.error("Missing orderCode or status in webhook")
            return JSONResponse(content={"error": "Missing required fields"}, status_code=400)
        
        # Find payment by transaction_id
        payment = session.exec(
            select(Payment).where(Payment.transaction_id == order_id)
        ).first()
        
        if not payment:
            logger.error(f"Payment not found for order_id: {order_id}")
            return JSONResponse(content={"error": "Payment not found"}, status_code=404)
        
        # Update payment status
        old_status = payment.status
        if status == "PAID":
            payment.status = "Success"
        elif status == "CANCELLED":
            payment.status = "Failed"
        else:
            payment.status = "Pending"
        
        session.add(payment)
        session.commit()
        
        # If payment successful, activate package
        if payment.status == "Success":
            user = session.get(User, payment.user_id)
            if user:
                user.active_package_id = payment.package_id
                user.package_expiry_date = datetime.utcnow() + timedelta(days=30)  # Default 30 days
                user.is_active_package = True
                session.add(user)
                session.commit()
                logger.info(f"Activated package {payment.package_id} for user {user.id}")
        
        logger.info(f"Payment {payment.id} status updated from {old_status} to {payment.status}")
        
        return JSONResponse(content={"success": True, "message": "Webhook processed"})
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

# --- GET PAYMENT BY ORDER ID ---
@router.get("/status/{order_id}")
def get_payment_by_order_id(
    order_id: str,
    session: Session = Depends(get_session)
):
    """Lấy payment theo order_id (không cần auth)"""
    try:
        payment = session.exec(
            select(Payment).where(Payment.transaction_id == order_id)
        ).first()
        
        if not payment:
            return {
                "success": False,
                "error": "Payment not found"
            }
        
        package = session.get(Package, payment.package_id)
        
        return {
            "success": True,
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "amount": payment.amount,
                "package_name": package.name if package else "Unknown Package",
                "transaction_id": payment.transaction_id,
                "created_at": payment.transaction_date
            }
        }
    except Exception as e:
        logger.error(f"Error getting payment by order_id: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# --- CANCEL PAYMENT ---
@router.post("/cancel/{payment_id}")
def cancel_payment(
    payment_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Hủy payment"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Check if user owns this payment or is admin
        if payment.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Only allow canceling pending payments
        if payment.status != "Pending":
            raise HTTPException(status_code=400, detail="Only pending payments can be cancelled")
        
        payment.status = "Cancelled"
        session.add(payment)
        session.commit()
        
        return {
            "success": True,
            "message": f"Payment {payment_id} cancelled successfully",
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "transaction_id": payment.transaction_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- CANCEL ALL PENDING PAYMENTS ---
@router.post("/cancel-pending")
def cancel_user_pending_payments(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Hủy tất cả pending payments của user"""
    try:
        pending_payments = session.exec(
            select(Payment).where(
                Payment.user_id == user.id,
                Payment.status == "Pending"
            )
        ).all()
        
        cancelled_payments = []
        for payment in pending_payments:
            payment.status = "Cancelled"
            session.add(payment)
            cancelled_payments.append({
                "id": payment.id,
                "transaction_id": payment.transaction_id
            })
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cancelled {len(cancelled_payments)} pending payments",
            "cancelled_payments": cancelled_payments
        }
    except Exception as e:
        logger.error(f"Error cancelling pending payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GET USER PENDING PAYMENTS ---
@router.get("/user/pending")
def get_user_pending_payments(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy danh sách pending payments của user"""
    try:
        pending_payments = session.exec(
            select(Payment).where(
                Payment.user_id == user.id,
                Payment.status == "Pending"
            )
        ).all()
        
        payment_list = []
        for payment in pending_payments:
            package = session.get(Package, payment.package_id)
            payment_list.append({
                "id": payment.id,
                "package_name": package.name if package else "Unknown Package",
                "amount": payment.amount,
                "transaction_id": payment.transaction_id,
                "created_at": payment.transaction_date
            })
        
        return {
            "success": True,
            "pending_payments": payment_list
        }
    except Exception as e:
        logger.error(f"Error getting pending payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- CLEANUP OLD PAYMENTS ---
@router.post("/cleanup-all-old")
def cleanup_old_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cleanup old pending payments (chỉ admin)"""
    try:
        # Cleanup pending payments older than 30 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=30)
        old_pending_payments = session.exec(
            select(Payment).where(
                Payment.status == "Pending",
                Payment.transaction_date < cutoff_time
            )
        ).all()
        
        cleaned_count = 0
        for payment in old_pending_payments:
            payment.status = "Expired"
            session.add(payment)
            cleaned_count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cleaned up {cleaned_count} old pending payments",
            "cleaned_count": cleaned_count
        }
    except Exception as e:
        logger.error(f"Error cleaning up old payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
