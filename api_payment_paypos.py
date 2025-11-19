"""
PayPOS Payment API - Clean & Minimal
"""

from fastapi import APIRouter, Depends, HTTPException, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta
from models import Payment, Package, User
from apiSQL import get_session, require_role, get_current_user, get_current_user_optional
from paypos_client import paypos_client
from paypos_config import PAYPOS_CONFIG
import logging
import json

logger = logging.getLogger(__name__)
PAYPOS_AVAILABLE = paypos_client is not None

router = APIRouter(prefix="/api/paypos", tags=["💳 PayPOS Payment Management"])

def _get_user_id(user: Optional[User]) -> int:
    return user.id if user else 1  # fallback to demo user

def _create_payos_order(payment: Payment, package: Package, return_url: str, cancel_url: str):
    if not PAYPOS_AVAILABLE:
        return {
            "payment_id": payment.id,
            "amount": payment.amount,
            "package_name": package.name,
            "order_id": payment.transaction_id,
            "payment_url": None,
            "status": "paypos_unavailable",
            "error": "PayPOS client not available"
        }

    try:
        order_data = {
            "order_id": payment.transaction_id,
            "amount": int(package.price),
            "description": f"Thanh toán gói {package.name}"[:25],
            "package_name": package.name,
            "return_url": return_url,
            "cancel_url": cancel_url
        }
        logger.info(f"Creating PayOS order: {order_data}")
        result = paypos_client.create_payment_request(order_data)
        logger.info(f"PayOS result: {result}")

        if result and result.get("success"):
            # ✅ QUAN TRỌNG: Update transaction_id với orderCode từ PayOS
            # PayOS trả về orderCode (ví dụ: 27396828) và webhook sẽ gửi lại orderCode này
            # Cần update để webhook có thể tìm thấy payment
            payment.transaction_id = str(result["order_id"])
            session.add(payment)
            session.commit()
            logger.info(f"Updated payment {payment.id} transaction_id to PayOS orderCode: {result['order_id']}")
            
            return {
                "payment_id": payment.id,
                "amount": payment.amount,
                "package_name": package.name,
                "order_id": result["order_id"],
                "payment_url": result["payment_url"],
                "status": "redirect_to_paypos"
            }
        else:
            error = result.get("error", "PayOS order creation failed") if result else "No response from PayOS"
            return {
                "payment_id": payment.id,
                "amount": payment.amount,
                "package_name": package.name,
                "order_id": payment.transaction_id,
                "payment_url": None,
                "status": "paypos_failed",
                "error": error
            }
    except Exception as e:
        logger.error(f"PayOS API error: {e}")
        return {
            "payment_id": payment.id,
            "amount": payment.amount,
            "package_name": package.name,
            "order_id": payment.transaction_id,
            "payment_url": None,
            "status": "paypos_error",
            "error": str(e)
        }

@router.post("/create")
def create_paypos_payment(
    package_id: int = Form(...),
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    try:
        user_id = _get_user_id(user)
        package = session.get(Package, package_id)
        if not package:
            raise HTTPException(404, "Package not found")

        pending = session.exec(
            select(Payment).where(Payment.user_id == user_id, Payment.status == "Pending")
        ).first()
        if pending:
            raise HTTPException(400, f"Bạn đã có giao dịch đang chờ (ID: {pending.id}). Vui lòng hoàn tất trước.")

        order_id = f"PKG_{user_id}_{int(datetime.utcnow().timestamp())}_{package_id}"
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

        # Sử dụng return_url và cancel_url từ config (đã deploy lên Vercel)
        return_url = f"{PAYPOS_CONFIG['return_url']}/{payment.id}"
        cancel_url = PAYPOS_CONFIG['cancel_url']
        
        return _create_payos_order(
            payment, package,
            return_url,
            cancel_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        raise HTTPException(500, str(e))

@router.post("/create-order")
async def create_payos_order_for_existing_payment(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    try:
        data = await request.json()
        user_id = _get_user_id(user)
        order_id = data.get("order_id")
        if not order_id:
            raise HTTPException(400, "Missing order_id")

        payment = session.exec(select(Payment).where(Payment.transaction_id == order_id)).first()
        if not payment or payment.user_id != user_id or payment.status != "Pending":
            raise HTTPException(400, "Invalid or non-pending payment")

        package = session.get(Package, payment.package_id)
        if not package:
            raise HTTPException(500, "Package not found")

        # Sử dụng return_url và cancel_url từ request hoặc fallback về config
        return_url = data.get("return_url") or f"{PAYPOS_CONFIG['return_url']}/{payment.id}"
        cancel_url = data.get("cancel_url") or PAYPOS_CONFIG['cancel_url']
        
        return _create_payos_order(
            payment, package,
            return_url,
            cancel_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating PayOS order: {e}")
        raise HTTPException(500, str(e))

# --- Các endpoint còn lại giữ nguyên logic, chỉ rút gọn ---
@router.get("/user/{user_id}")
def get_user_payments(user_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.id != user_id and user.role != "admin":
        raise HTTPException(403, "Access denied")
    payments = session.exec(select(Payment).where(Payment.user_id == user_id)).all()
    return {
        "success": True,
        "payments": [{
            "id": p.id,
            "package_name": session.get(Package, p.package_id).name if session.get(Package, p.package_id) else "Unknown",
            "amount": p.amount,
            "status": p.status,
            "transaction_id": p.transaction_id,
            "method": p.method,
            "created_at": p.transaction_date
        } for p in payments]
    }

@router.get("/")
def get_all_payments(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    payments = session.exec(select(Payment)).all()
    return {
        "success": True,
        "payments": [{
            "id": p.id,
            "user_id": p.user_id,
            "package_name": session.get(Package, p.package_id).name if session.get(Package, p.package_id) else "Unknown",
            "amount": p.amount,
            "status": p.status,
            "transaction_id": p.transaction_id,
            "method": p.method,
            "created_at": p.transaction_date
        } for p in payments]
    }

@router.put("/{payment_id}/status")
def update_payment_status(
    payment_id: int,
    status: str = Form(...),
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    old = payment.status
    payment.status = status
    session.add(payment)
    session.commit()
    return {"success": True, "message": f"Updated from {old} to {status}"}

@router.get("/{payment_id}/status")
def get_payment_status(payment_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    payment = session.get(Payment, payment_id)
    if not payment or (payment.user_id != user.id and user.role != "admin"):
        raise HTTPException(403, "Access denied")
    package = session.get(Package, payment.package_id)
    return {
        "success": True,
        "payment": {
            "id": payment.id,
            "status": payment.status,
            "amount": payment.amount,
            "package_name": package.name if package else "Unknown",
            "transaction_id": payment.transaction_id,
            "created_at": payment.transaction_date
        }
    }

@router.post("/webhook")
async def paypos_webhook(request: Request, session: Session = Depends(get_session)):
    """
    Webhook endpoint nhận callback từ PayOS
    🔒 Có verify signature để đảm bảo tính bảo mật
    """
    try:
        # Lấy raw body để verify signature
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        
        # Parse JSON data
        data = json.loads(body_str) if body_str else {}
        
        # Lấy Svix headers để verify signature
        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature")
        
        # Verify webhook signature (bảo mật)
        if PAYPOS_AVAILABLE and paypos_client:
            if svix_id and svix_timestamp and svix_signature:
                is_valid = paypos_client.verify_webhook(body_str, svix_id, svix_timestamp, svix_signature)
                if not is_valid:
                    logger.warning(f"Invalid webhook signature from PayOS. orderCode: {data.get('orderCode')}")
                    return JSONResponse({"error": "Invalid signature"}, 401)
            else:
                # Nếu không có Svix headers, log warning nhưng vẫn xử lý (cho tương thích)
                logger.warning("Missing Svix headers in webhook request. Proceeding without verification.")
        
        # Validate required fields
        order_id = data.get("orderCode")
        status = data.get("status")
        if not order_id or not status:
            return JSONResponse({"error": "Missing fields"}, 400)

        # Tìm payment theo orderCode
        payment = session.exec(select(Payment).where(Payment.transaction_id == str(order_id))).first()
        if not payment:
            logger.warning(f"Payment not found for orderCode: {order_id}")
            return JSONResponse({"error": "Payment not found"}, 404)

        # Update payment status
        old_status = payment.status
        payment.status = "Success" if status == "PAID" else "Failed" if status == "CANCELLED" else "Pending"
        session.add(payment)
        session.commit()
        
        logger.info(f"Payment status updated: orderCode={order_id}, status={status}, old={old_status}, new={payment.status}")

        # Nếu thanh toán thành công, activate package cho user
        if payment.status == "Success":
            user = session.get(User, payment.user_id)
            if user:
                user.active_package_id = payment.package_id
                user.package_expiry_date = datetime.utcnow() + timedelta(days=30)
                user.is_active_package = True
                session.add(user)
                session.commit()
                logger.info(f"✅ Activated package {payment.package_id} for user {user.id}")

        return JSONResponse({"success": True})
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {e}")
        return JSONResponse({"error": "Invalid JSON"}, 400)
    except Exception as e:
        logger.error(f"Webhook error: {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, 500)

@router.get("/status/{order_id}")
def get_payment_by_order_id(order_id: str, session: Session = Depends(get_session)):
    """
    Lấy payment status theo orderCode
    ✅ Tự động sync status từ PayOS nếu payment vẫn pending
    """
    payment = session.exec(select(Payment).where(Payment.transaction_id == str(order_id))).first()
    if not payment:
        return {"success": False, "error": "Payment not found"}
    
    package = session.get(Package, payment.package_id)
    
    # ✅ Nếu payment vẫn pending, check status từ PayOS API
    if payment.status == "Pending" and PAYPOS_AVAILABLE and paypos_client:
        try:
            logger.info(f"Checking payment status from PayOS for orderCode: {order_id}")
            payos_result = paypos_client.get_payment_status(order_id)
            
            if payos_result.get("success"):
                payos_response = payos_result.get("data", {})
                
                # PayOS API response format: { code: "00", data: { status: "PAID", ... } }
                # Hoặc: { code: "00", data: { ... } } với status trong data
                if isinstance(payos_response, dict):
                    # Check response code
                    response_code = payos_response.get("code")
                    payos_data = payos_response.get("data", payos_response)  # Fallback nếu không có nested data
                    
                    # Parse status từ PayOS response
                    # PayOS có thể trả về: status, orderStatus, transactionStatus, etc.
                    payos_status = None
                    if isinstance(payos_data, dict):
                        payos_status = (
                            payos_data.get("status") or 
                            payos_data.get("orderStatus") or 
                            payos_data.get("transactionStatus") or
                            payos_data.get("transactionStatusDescription")
                        )
                    
                    # Nếu response_code = "00" hoặc status = "PAID", thanh toán thành công
                    if (response_code == "00" or payos_status == "PAID") and payment.status != "Success":
                        # PayOS confirm thanh toán thành công, update payment
                        old_status = payment.status
                        payment.status = "Success"
                        session.add(payment)
                        session.commit()
                        
                        # Activate package cho user
                        user = session.get(User, payment.user_id)
                        if user:
                            user.active_package_id = payment.package_id
                            user.package_expiry_date = datetime.utcnow() + timedelta(days=30)
                            user.is_active_package = True
                            session.add(user)
                            session.commit()
                            logger.info(f"✅ Synced and activated package {payment.package_id} for user {user.id}")
                        
                        logger.info(f"✅ Synced payment {payment.id} status from PayOS: {old_status} -> Success (orderCode: {order_id})")
                    elif payos_status == "CANCELLED" and payment.status != "Failed":
                        old_status = payment.status
                        payment.status = "Failed"
                        session.add(payment)
                        session.commit()
                        logger.info(f"✅ Synced payment {payment.id} status from PayOS: {old_status} -> Failed")
                    else:
                        logger.info(f"Payment {payment.id} still pending. PayOS status: {payos_status}, response_code: {response_code}")
        except Exception as e:
            logger.error(f"Error syncing payment status from PayOS: {e}")
            # Không throw error, chỉ log và trả về status hiện tại
    
    return {
        "success": True,
        "payment": {
            "id": payment.id,
            "status": payment.status,
            "amount": payment.amount,
            "package_name": package.name if package else "Unknown",
            "transaction_id": payment.transaction_id,
            "created_at": payment.transaction_date,
            "expiry_date": payment.expiry_date if hasattr(payment, 'expiry_date') else None
        }
    }

@router.post("/cancel/{payment_id}")
def cancel_payment(
    payment_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    payment = session.get(Payment, payment_id)
    if not payment or (payment.user_id != user.id and user.role != "admin"):
        raise HTTPException(403, "Access denied")
    if payment.status != "Pending":
        raise HTTPException(400, "Only pending payments can be cancelled")
    payment.status = "Cancelled"
    session.add(payment)
    session.commit()
    return {"success": True, "message": "Cancelled"}

@router.post("/cancel-pending")
def cancel_user_pending_payments(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pending = session.exec(select(Payment).where(Payment.user_id == user.id, Payment.status == "Pending")).all()
    for p in pending:
        p.status = "Cancelled"
        session.add(p)
    session.commit()
    return {"success": True, "message": f"Cancelled {len(pending)} payments"}

@router.get("/user/pending")
def get_user_pending_payments(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pending = session.exec(select(Payment).where(Payment.user_id == user.id, Payment.status == "Pending")).all()
    return {
        "success": True,
        "pending_payments": [{
            "id": p.id,
            "package_name": session.get(Package, p.package_id).name if session.get(Package, p.package_id) else "Unknown",
            "amount": p.amount,
            "transaction_id": p.transaction_id,
            "created_at": p.transaction_date
        } for p in pending]
    }

@router.post("/cleanup-all-old")
def cleanup_old_payments(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    old = session.exec(select(Payment).where(Payment.status == "Pending", Payment.transaction_date < cutoff)).all()
    for p in old:
        p.status = "Expired"
        session.add(p)
    session.commit()
    return {"success": True, "message": f"Cleaned {len(old)} old payments"}