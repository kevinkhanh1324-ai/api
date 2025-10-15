"""
PayPOS Payment API - Tích hợp với PayPOS thực tế
Chạy sau khi đã migration database
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
import io
import base64
import time
import logging

# Setup logger
logger = logging.getLogger(__name__)

# Try to import qrcode, fallback to simple text if not available
try:
    import qrcode
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False
    print("Warning: qrcode library not available. Install with: pip install qrcode[pil]")

router = APIRouter(prefix="/api/paypos", tags=["💳 PayPOS Payment Management"])

# --- CREATE PAYOS ORDER ENDPOINT ---
@router.post("/create-order")
def create_payos_order(
    order_data: dict,
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Tạo PayOS order cho payment đã tồn tại"""
    
    try:
        # Use real user if authenticated, otherwise demo user
        user_id = user.id if user else 1
        
        # Prepare PayOS order data
        # PayOS requires description to be max 25 characters
        original_description = order_data.get("description", "")
        short_description = original_description[:25] if len(original_description) > 25 else original_description
        
        payos_order_data = {
            "order_id": order_data.get("order_id"),
            "amount": int(order_data.get("amount", 0)),
            "description": short_description,
            "return_url": order_data.get("return_url", ""),
            "cancel_url": order_data.get("cancel_url", "")
        }
        
        print(f"Creating PayOS order for user {user_id}: {payos_order_data}")
        
        # Try to create PayOS order
        if paypos_client and hasattr(paypos_client, 'create_payment_request'):
            try:
                payos_result = paypos_client.create_payment_request(payos_order_data)
                print(f"PayOS order creation result: {payos_result}")
                
                if payos_result and payos_result.get("success"):
                    return {
                        "success": True,
                        "payment_url": payos_result["payment_url"],
                        "order_id": payos_result["order_id"],
                        "message": "PayOS order created successfully"
                    }
                else:
                    print(f"PayOS order creation failed: {payos_result}")
                    return {
                        "success": False,
                        "error": f"PayOS order creation failed: {payos_result.get('error', 'Unknown error') if payos_result else 'No response'}"
                    }
            except Exception as e:
                print(f"PayOS API error: {str(e)}")
                return {
                    "success": False,
                    "error": f"PayOS API error: {str(e)}"
                }
        else:
            print("PayOS client not available")
            return {
                "success": False,
                "error": "PayOS client not available"
            }
            
    except Exception as e:
        print(f"Error creating PayOS order: {str(e)}")
        return {
            "success": False,
            "error": f"Error creating PayOS order: {str(e)}"
        }

# --- TEST ENDPOINT (NO AUTH) ---
@router.post("/create-demo")
def create_paypos_payment_demo(
    package_id: int = Form(...),
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Demo tạo yêu cầu thanh toán PayPOS (không cần auth, nhưng sử dụng user nếu có)"""
    
    # Validate package exists
    package = session.get(Package, package_id)
    if not package or not package.is_active:
        raise HTTPException(status_code=404, detail="Package not found or inactive")
    
    # Use real user if authenticated, otherwise demo user
    user_id = user.id if user else 1
    
    # Create payment record
    payment = Payment(
        user_id=user_id,
        package_id=package_id,
        amount=package.price,
        method="PayPOS",
        status="Pending",
        transaction_id=f"DEMO_{package_id}_{int(datetime.utcnow().timestamp())}"
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Generate QR code for payment
    qr_data = {
        "order_id": payment.transaction_id,
        "amount": int(payment.amount),
        "description": f"Thanh toán gói {package.name}",
        "merchant": "SafeNest AI",
        "callback_url": f"http://localhost:8000/api/payments/paypos/callback/{payment.id}"
    }
    
    if QR_AVAILABLE:
        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        
        # Generate QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "payment_id": payment.id,
            "amount": payment.amount,
            "package_name": package.name,
            "order_id": payment.transaction_id,
            "status": "qr_generated",
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "qr_data": qr_data,
            "payment_url": f"http://localhost:8000/api/paypos/callback/{payment.id}",
            "demo": True,
            "message": "QR Code generated for payment"
        }
    else:
        # Fallback without QR code
        return {
            "payment_id": payment.id,
            "amount": payment.amount,
            "package_name": package.name,
            "order_id": payment.transaction_id,
            "status": "payment_created",
            "qr_data": qr_data,
            "payment_url": f"http://localhost:8000/api/paypos/callback/{payment.id}",
            "demo": True,
            "message": "Payment created (QR code library not available)"
        }

# --- PAYPOS PAYMENT MANAGEMENT ---
@router.post("/create")
def create_paypos_payment(
    package_id: int = Form(...),
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Tạo yêu cầu thanh toán PayPOS"""
    
    # Use real user if authenticated, otherwise demo user
    user_id = user.id if user else 1
    logger.info(f"Creating PayPOS payment for user {user_id}, package {package_id}")
    
    # Validate package exists and is active
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if not package.is_active:
        raise HTTPException(status_code=400, detail="Package is not active")
    
    # Check if user already has active package (only if authenticated)
    if user and user.active_package_id and user.package_expiry_date and user.package_expiry_date > datetime.utcnow():
        raise HTTPException(
            status_code=400, 
            detail="You already have an active package. Please wait for it to expire or contact admin"
        )
    
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
    
    # Cleanup old pending payments for this user (older than 30 minutes)
    cutoff_time = datetime.utcnow() - timedelta(minutes=30)
    old_pending_payments = session.exec(
        select(Payment).where(
            Payment.user_id == user_id,
            Payment.status == "Pending",
            Payment.transaction_date < cutoff_time
        )
    ).all()
    
    for old_payment in old_pending_payments:
        old_payment.status = "Expired"
        session.add(old_payment)
    
    if old_pending_payments:
        session.commit()
        print(f"Cleaned up {len(old_pending_payments)} old pending payments for user {user_id}")
    
    # Also cleanup old failed payments (older than 1 hour) to avoid PayOS conflicts
    failed_cutoff = datetime.utcnow() - timedelta(hours=1)
    old_failed_payments = session.exec(
        select(Payment).where(
            Payment.user_id == user_id,
            Payment.status.in_(["Failed", "Expired"]),
            Payment.transaction_date < failed_cutoff
        )
    ).all()
    
    for old_payment in old_failed_payments:
        old_payment.status = "Cleaned"
        session.add(old_payment)
    
    if old_failed_payments:
        session.commit()
        print(f"Cleaned up {len(old_failed_payments)} old failed payments for user {user_id}")
    
    # Generate unique order_id with microsecond precision
    now = datetime.utcnow()
    timestamp = int(now.timestamp() * 1000000)  # Microsecond precision
    order_id = f"PKG_{user_id}_{timestamp}_{package_id}"
    
    # Check if order_id already exists in database
    existing_payment = session.exec(
        select(Payment).where(Payment.transaction_id == order_id)
    ).first()
    
    if existing_payment:
        # If exists, add random suffix
        import random
        order_id = f"PKG_{user_id}_{timestamp}_{package_id}_{random.randint(1000, 9999)}"
    
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
    
    # Prepare PayPOS order data
    # PayOS requires description to be max 25 characters
    short_description = f"Goi {package.name}"[:25]
    
    order_data = {
        "order_id": order_id,  # Use the same order_id
        "amount": int(package.price),  # PayPOS expects integer
        "description": short_description,
        "package_name": package.name,
        "return_url": f"http://localhost:3000/payment/success/{payment.id}",
        "cancel_url": f"http://localhost:3000/payment/cancel"
    }
    
    # Create PayPOS payment request
    try:
        print(f"Creating PayOS payment for order: {order_data}")
        paypos_result = paypos_client.create_payment_request(order_data)
        print(f"PayOS result: {paypos_result}")
        
        if paypos_result["success"]:
            return {
                "payment_id": payment.id,
                "amount": payment.amount,
                "package_name": package.name,
                "payment_url": paypos_result["payment_url"],
                "order_id": paypos_result["order_id"],
                "status": "redirect_to_paypos"
            }
        else:
            # Check if it's a duplicate order error (231)
            if "231" in str(paypos_result.get('error', '')) or "đã tồn tại" in str(paypos_result.get('error', '')):
                # Rollback current payment
                session.delete(payment)
                session.commit()
                
                # Generate new order_id and try again
                import random
                new_timestamp = int(datetime.utcnow().timestamp() * 1000000)
                new_order_id = f"PKG_{user_id}_{new_timestamp}_{package_id}_{random.randint(10000, 99999)}"
                
                # Create new payment with new order_id
                new_payment = Payment(
                    user_id=user_id,
                    package_id=package_id,
                    amount=package.price,
                    method="PayPOS",
                    status="Pending",
                    transaction_id=new_order_id
                )
                
                session.add(new_payment)
                session.commit()
                session.refresh(new_payment)
                
                # Update order_data with new order_id
                order_data["order_id"] = new_order_id
                order_data["return_url"] = f"http://localhost:3000/payment/success/{new_payment.id}"
                order_data["cancel_url"] = f"http://localhost:3000/payment/cancel"
                
                # Try PayOS again with new order_id
                print(f"Retrying PayOS payment with new order: {order_data}")
                retry_result = paypos_client.create_payment_request(order_data)
                print(f"PayOS retry result: {retry_result}")
                
                if retry_result["success"]:
                    return {
                        "payment_id": new_payment.id,
                        "amount": new_payment.amount,
                        "package_name": package.name,
                        "payment_url": retry_result["payment_url"],
                        "order_id": retry_result["order_id"],
                        "status": "redirect_to_paypos"
                    }
                else:
                    # Rollback new payment if retry fails
                    session.delete(new_payment)
                    session.commit()
                    raise HTTPException(
                        status_code=500, 
                        detail=f"PayPOS payment creation failed after retry: {retry_result['error']}"
                    )
            else:
                # For other PayOS errors, fail properly
                print(f"PayOS error: {paypos_result.get('error', 'Unknown error')}")
                # Rollback payment record if PayPOS fails
                session.delete(payment)
                session.commit()
                raise HTTPException(
                    status_code=500, 
                    detail=f"PayPOS payment creation failed: {paypos_result.get('error', 'Unknown error')}"
                )
    except Exception as e:
        print(f"PayOS API not accessible: {str(e)}")
        # Rollback payment record if PayPOS fails
        session.delete(payment)
        session.commit()
        raise HTTPException(
            status_code=500, 
            detail=f"PayOS API not accessible: {str(e)}"
        )

@router.get("/user/{user_id}")
def get_user_payments(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy lịch sử thanh toán của user"""
    # Ensure user can only view their own payments or admin can view any
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    payments = session.exec(select(Payment).where(Payment.user_id == user_id)).all()
    return payments

@router.get("/")
def admin_get_all_payments(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    """Admin xem tất cả giao dịch thanh toán"""
    return session.exec(select(Payment)).all()

@router.put("/{payment_id}/status")
def update_payment_status(
    payment_id: int,
    background_tasks: BackgroundTasks,
    status: str = Form(...),  # "Success", "Failed"
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Admin cập nhật trạng thái thanh toán"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if status not in ["Success", "Failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    payment.status = status
    session.add(payment)

    if status == "Success":
        package = session.get(Package, payment.package_id)
        if package:
            target_user = session.get(User, payment.user_id)
            if target_user:
                target_user.active_package_id = package.id
                target_user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
                target_user.is_active_package = True
                session.add(target_user)
                payment.expiry_date = target_user.package_expiry_date
            else:
                background_tasks.add_task(print, f"User {payment.user_id} not found for payment {payment_id}")
        else:
            background_tasks.add_task(print, f"Package {payment.package_id} not found for payment {payment_id}")
    
    session.commit()
    session.refresh(payment)
    return payment

@router.get("/{payment_id}/status")
def get_payment_status(
    payment_id: int,
    session: Session = Depends(get_session)
):
    """Kiểm tra trạng thái thanh toán"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "payment_id": payment.id,
        "status": payment.status,
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "method": payment.method,
        "created_at": payment.transaction_date,
        "expiry_date": payment.expiry_date
    }

# --- PAYPOS WEBHOOK ---
@router.post("/webhook")
async def paypos_webhook(request: Request, session: Session = Depends(get_session)):
    """PayPOS webhook callback"""
    try:
        # Get request data
        data = await request.json()
        signature = request.headers.get("x-paypos-signature", "")
        
        # Verify webhook signature
        if not paypos_client.verify_webhook(data, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Extract payment info
        order_id = data.get("order_id")
        status = data.get("status")  # "success", "failed", "pending"
        transaction_id = data.get("transaction_id")
        
        if not order_id:
            return {"success": False, "message": "Missing order_id"}
        
        # Find payment by transaction_id
        payment = session.exec(
            select(Payment).where(Payment.transaction_id == order_id)
        ).first()
        
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        # Update payment status
        if status == "success":
            payment.status = "Success"
            if transaction_id:
                payment.transaction_id = transaction_id
            
            # Activate package for user
            user = session.get(User, payment.user_id)
            package = session.get(Package, payment.package_id)
            
            if user and package:
                user.active_package_id = package.id
                user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
                user.is_active_package = True
                session.add(user)
                payment.expiry_date = user.package_expiry_date
        elif status == "failed":
            payment.status = "Failed"
            if transaction_id:
                payment.transaction_id = transaction_id
        else:  # pending
            payment.status = "Pending"
            if transaction_id:
                payment.transaction_id = transaction_id
        
        session.add(payment)
        session.commit()
        
        return {"success": True, "message": "Payment status updated"}
        
    except Exception as e:
        return {"success": False, "message": str(e)}

# --- PAYPOS STATUS CHECK ---
@router.get("/status/{order_id}")
def check_paypos_status(order_id: str, session: Session = Depends(get_session)):
    """Kiểm tra trạng thái thanh toán từ PayPOS"""
    try:
        # Check with PayPOS API
        paypos_result = paypos_client.get_payment_status(order_id)
        
        if paypos_result["success"]:
            # Also check local database
            payment = session.exec(
                select(Payment).where(Payment.transaction_id == order_id)
            ).first()
            
            return {
                "order_id": order_id,
                "paypos_status": paypos_result["data"],
                "local_status": payment.status if payment else "not_found",
                "payment_id": payment.id if payment else None
            }
        else:
            return {
                "order_id": order_id,
                "error": paypos_result["error"]
            }
            
    except Exception as e:
        return {"error": str(e)}

# --- PAYPOS CANCEL ---
@router.post("/paypos/cancel/{order_id}")
def cancel_paypos_payment(
    order_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Hủy thanh toán PayPOS"""
    try:
        # Find payment
        payment = session.exec(
            select(Payment).where(Payment.transaction_id == order_id)
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Check if user owns this payment
        if user.role != "admin" and payment.user_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Cancel with PayPOS
        paypos_result = paypos_client.cancel_payment(order_id)
        
        if paypos_result["success"]:
            # Update local status
            payment.status = "Cancelled"
            session.add(payment)
            session.commit()
            
            return {
                "success": True,
                "message": "Payment cancelled successfully",
                "payment_id": payment.id
            }
        else:
            return {
                "success": False,
                "error": paypos_result["error"]
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- CLEANUP OLD PENDING PAYMENTS ---
@router.post("/cleanup-pending")
def cleanup_old_pending_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cleanup old pending payments (older than 1 hour)"""
    try:
        # Find payments that are pending for more than 1 hour
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        old_pending_payments = session.exec(
            select(Payment).where(
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

# --- CANCEL USER PENDING PAYMENTS ---
@router.post("/cancel-pending")
def cancel_user_pending_payments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel all pending payments for current user"""
    try:
        # Find all pending payments for this user
        pending_payments = session.exec(
            select(Payment).where(
                Payment.user_id == current_user.id,
                Payment.status == "Pending"
            )
        ).all()
        
        count = 0
        cancelled_payments = []
        for payment in pending_payments:
            payment.status = "Cancelled"
            session.add(payment)
            cancelled_payments.append({
                "payment_id": payment.id,
                "transaction_id": payment.transaction_id,
                "amount": payment.amount,
                "package_id": payment.package_id
            })
            count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Đã hủy {count} giao dịch đang chờ",
            "count": count,
            "cancelled_payments": cancelled_payments
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- CANCEL SPECIFIC PENDING PAYMENT ---
@router.post("/cancel/{payment_id}")
def cancel_specific_pending_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel a specific pending payment for current user"""
    try:
        # Find the specific payment
        payment = session.exec(
            select(Payment).where(
                Payment.id == payment_id,
                Payment.user_id == current_user.id,
                Payment.status == "Pending"
            )
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=404, 
                detail="Không tìm thấy giao dịch đang chờ hoặc bạn không có quyền hủy giao dịch này"
            )
        
        # Cancel the payment
        payment.status = "Cancelled"
        session.add(payment)
        session.commit()
        
        return {
            "success": True,
            "message": f"Đã hủy giao dịch {payment_id}",
            "payment_id": payment.id,
            "transaction_id": payment.transaction_id,
            "amount": payment.amount
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- CLEANUP INVALID PAYMENTS ---
@router.post("/cleanup-invalid")
def cleanup_invalid_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cleanup payments with invalid package references"""
    try:
        # Find payments with package_id that don't exist
        all_payments = session.exec(select(Payment)).all()
        invalid_payments = []
        
        for payment in all_payments:
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

# --- DEBUG: LIST ALL PAYMENTS ---
@router.get("/debug/list")
def debug_list_payments(session: Session = Depends(get_session)):
    """Debug endpoint to list all payments (no auth required)"""
    try:
        payments = session.exec(select(Payment)).all()
        result = []
        for payment in payments:
            result.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "amount": payment.amount,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "method": payment.method,
                "created_at": payment.transaction_date
            })
        return {
            "success": True,
            "payments": result,
            "count": len(result)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- DEBUG: CHECK USER DATA ---
@router.get("/debug/user/{user_id}")
def debug_check_user(user_id: int, session: Session = Depends(get_session)):
    """Debug endpoint to check user data (no auth required)"""
    try:
        user = session.get(User, user_id)
        if not user:
            return {
                "success": False,
                "error": f"User {user_id} not found"
            }
        
        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": getattr(user, 'name', 'N/A'),
                "email": getattr(user, 'email', 'N/A'),
                "active_package_id": user.active_package_id,
                "package_expiry_date": user.package_expiry_date,
                "is_active_package": user.is_active_package,
                "role": user.role
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- DEBUG: TEST PAYOS API ---
@router.get("/debug/test-payos")
def debug_test_payos():
    """Debug endpoint to test PayOS API directly (no auth required)"""
    try:
        # Test PayOS API with simple data
        test_order_data = {
            "order_id": f"TEST_{int(time.time())}",
            "amount": 1000,  # 1000 VND
            "description": "Test payment",
            "return_url": "http://localhost:3000/payment/success",
            "cancel_url": "http://localhost:3000/payment/cancel"
        }
        
        print(f"Testing PayOS API with data: {test_order_data}")
        result = paypos_client.create_payment_request(test_order_data)
        print(f"PayOS API result: {result}")
        
        return {
            "success": True,
            "test_data": test_order_data,
            "payos_result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- DEBUG: CLEAR USER PACKAGE ---
@router.post("/debug/clear-user-package/{user_id}")
def debug_clear_user_package(user_id: int, session: Session = Depends(get_session)):
    """Debug endpoint to clear user package data (no auth required)"""
    try:
        user = session.get(User, user_id)
        if not user:
            return {
                "success": False,
                "error": f"User {user_id} not found"
            }
        
        # Clear package data
        user.active_package_id = None
        user.package_expiry_date = None
        user.is_active_package = False
        session.add(user)
        session.commit()
        
        return {
            "success": True,
            "message": f"Cleared package data for user {user_id}",
            "user": {
                "id": user.id,
                "name": getattr(user, 'name', 'N/A'),
                "active_package_id": user.active_package_id,
                "package_expiry_date": user.package_expiry_date,
                "is_active_package": user.is_active_package
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- DEBUG: DELETE PAYMENT ---
@router.post("/debug/delete-payment/{payment_id}")
def debug_delete_payment(payment_id: int, session: Session = Depends(get_session)):
    """Debug endpoint to delete a payment (no auth required)"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            return {
                "success": False,
                "error": f"Payment {payment_id} not found"
            }
        
        # Delete payment
        session.delete(payment)
        session.commit()
        
        return {
            "success": True,
            "message": f"Deleted payment {payment_id}",
            "deleted_payment": {
                "id": payment.id,
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "amount": payment.amount,
                "status": payment.status,
                "transaction_id": payment.transaction_id
            }
        }
    except Exception as e:
        logger.error(f"Error deleting payment {payment_id}: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# --- DEBUG: CREATE PAYMENT WITH USER ID ---
@router.post("/create-debug")
def create_paypos_payment_debug(
    package_id: int = Form(...),
    user_id: int = Form(...),
    session: Session = Depends(get_session)
):
    """Debug endpoint to create payment with specific user_id (no auth required)"""
    try:
        # Get user by ID
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
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
        
        return {
            "success": True,
            "message": "Payment created successfully",
            "payment_id": payment.id,
            "user_id": user_id,
            "package_id": package_id,
            "amount": payment.amount,
            "transaction_id": payment.transaction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- UPDATE PAYMENT BY ORDER ID ---
@router.post("/update-by-order-id")
def update_payment_by_order_id(
    order_id: str = Form(...),
    status: str = Form(...),  # "Success", "Failed"
    session: Session = Depends(get_session)
):
    """Cập nhật trạng thái thanh toán theo PayOS order ID (không cần auth cho trường hợp webhook)"""
    try:
        # Find payment by transaction_id (which contains the order_id)
        payment = session.exec(
            select(Payment).where(Payment.transaction_id.like(f"%{order_id}%"))
        ).first()
        
        if not payment:
            return {
                "success": False,
                "error": f"Payment not found for order_id: {order_id}"
            }

        if status not in ["Success", "Failed"]:
            return {
                "success": False,
                "error": "Invalid status. Must be 'Success' or 'Failed'"
            }

        old_status = payment.status
        payment.status = status
        session.add(payment)

        if status == "Success":
            # Activate package for user
            package = session.get(Package, payment.package_id)
            if package:
                target_user = session.get(User, payment.user_id)
                if target_user:
                    target_user.active_package_id = package.id
                    target_user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
                    target_user.is_active_package = True
                    session.add(target_user)
                    payment.expiry_date = target_user.package_expiry_date
                    print(f"Activated package {package.id} for user {target_user.id}")
                else:
                    print(f"User {payment.user_id} not found for payment {payment.id}")
            else:
                print(f"Package {payment.package_id} not found for payment {payment.id}")
        
        session.commit()
        session.refresh(payment)
        
        return {
            "success": True,
            "message": f"Payment status updated from {old_status} to {status}",
            "payment_id": payment.id,
            "order_id": order_id,
            "old_status": old_status,
            "new_status": payment.status,
            "package_activated": status == "Success"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- MANUAL PAYMENT STATUS UPDATE ---
@router.post("/manual-update/{payment_id}")
def manual_update_payment_status(
    payment_id: int,
    status: str = Form(...),  # "Success", "Failed"
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Admin cập nhật thủ công trạng thái thanh toán (cho trường hợp webhook không hoạt động)"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if status not in ["Success", "Failed"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        old_status = payment.status
        payment.status = status
        session.add(payment)

        if status == "Success":
            # Activate package for user
            package = session.get(Package, payment.package_id)
            if package:
                target_user = session.get(User, payment.user_id)
                if target_user:
                    target_user.active_package_id = package.id
                    target_user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
                    target_user.is_active_package = True
                    session.add(target_user)
                    payment.expiry_date = target_user.package_expiry_date
                    print(f"Activated package {package.id} for user {target_user.id}")
                else:
                    print(f"User {payment.user_id} not found for payment {payment_id}")
            else:
                print(f"Package {payment.package_id} not found for payment {payment_id}")
        
        session.commit()
        session.refresh(payment)
        
        return {
            "success": True,
            "message": f"Payment status updated from {old_status} to {status}",
            "payment_id": payment.id,
            "old_status": old_status,
            "new_status": payment.status,
            "package_activated": status == "Success"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# --- CLEANUP ALL OLD PAYMENTS ---
@router.post("/cleanup-all-old")
def cleanup_all_old_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cleanup all old payments to avoid PayOS conflicts"""
    try:
        # Cleanup all payments older than 2 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=2)
        
        old_payments = session.exec(
            select(Payment).where(
                Payment.transaction_date < cutoff_time,
                Payment.status.in_(["Pending", "Failed", "Expired"])
            )
        ).all()
        
        count = 0
        for payment in old_payments:
            payment.status = "Cleaned"
            session.add(payment)
            count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cleaned up {count} old payments",
            "count": count
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- GET USER PENDING PAYMENTS ---
@router.get("/user/pending")
def get_user_pending_payments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all pending payments for current user"""
    try:
        pending_payments = session.exec(
            select(Payment).where(
                Payment.user_id == current_user.id,
                Payment.status == "Pending"
            )
        ).all()
        
        result = []
        for payment in pending_payments:
            package = session.get(Package, payment.package_id)
            result.append({
                "id": payment.id,
                "amount": payment.amount,
                "method": payment.method,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "transaction_date": payment.transaction_date,
                "package": {
                    "id": package.id if package else None,
                    "name": package.name if package else "Package not found"
                } if package else None
            })
        
        return {
            "success": True,
            "pending_payments": result,
            "count": len(result)
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- QR CODE PAYMENT CALLBACK ---
@router.post("/callback/{payment_id}")
def payment_callback(
    payment_id: int,
    status: str = Form("success"),  # "success" or "failed"
    session: Session = Depends(get_session)
):
    """Callback endpoint for QR code payment"""
    
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if status == "success":
        payment.status = "Success"
        # Activate package for user
        user = session.get(User, payment.user_id)
        package = session.get(Package, payment.package_id)
        
        if user and package:
            user.active_package_id = package.id
            user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
            user.is_active_package = True
            session.add(user)
            payment.expiry_date = user.package_expiry_date
    else:
        payment.status = "Failed"
    
    session.add(payment)
    session.commit()
    
    return {
        "success": True,
        "payment_id": payment.id,
        "status": payment.status,
        "message": f"Payment {status}"
    }
