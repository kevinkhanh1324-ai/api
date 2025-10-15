from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta
from models import Payment, PaymentCreate, PaymentUpdate, Package, User
from apiSQL import get_session, require_role, get_current_user

router = APIRouter(prefix="/api/payments", tags=["💳 Payment Management"])

# --- PAYMENT MANAGEMENT ---
@router.post("/")
def create_payment(
    package_id: int = Form(...),
    method: str = Form(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Tạo yêu cầu thanh toán (school/parent)"""
    
    # Validate package exists and is active
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if not package.is_active:
        raise HTTPException(status_code=400, detail="Package is not active")
    
    # Validate method
    valid_methods = ["PayPOS", "Manual"]
    if method not in valid_methods:
        raise HTTPException(status_code=400, detail=f"Invalid payment method. Must be one of: {valid_methods}")
    
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
    
    # Generate unique transaction_id
    timestamp = int(datetime.utcnow().timestamp())
    transaction_id = f"PKG_{user.id}_{timestamp}_{package_id}"
    
    # Create payment record
    payment = Payment(
        user_id=user.id,
        package_id=package_id,
        amount=package.price,
        method=method,
        status="Pending",
        transaction_id=transaction_id
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Return payment info for frontend to redirect to PayPOS
    return {
        "payment_id": payment.id,
        "amount": payment.amount,
        "method": payment.method,
        "package_name": package.name,
        "redirect_url": f"/payment/paypos/{payment.id}",  # Frontend will handle PayPOS integration
        "paypos_data": {
            "order_id": f"PKG_{payment.id}_{int(datetime.utcnow().timestamp())}",
            "amount": int(payment.amount),
            "description": f"Thanh toán gói {package.name}",
            "return_url": f"/payment/success/{payment.id}",
            "cancel_url": f"/payment/cancel/{payment.id}"
        }
    }

@router.get("/user/{user_id}")
def get_user_payments(
    user_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy lịch sử thanh toán của user (school/parent)"""
    
    # Check if user can access this data
    if user.role == "admin" or user.id == user_id:
        payments = session.exec(
            select(Payment, Package)
            .join(Package, Payment.package_id == Package.id)
            .where(Payment.user_id == user_id)
            .order_by(Payment.transaction_date.desc())
        ).all()
        
        result = []
        for payment, package in payments:
            result.append({
                "id": payment.id,
                "package_name": package.name,
                "amount": payment.amount,
                "method": payment.method,
                "status": payment.status,
                "transaction_date": payment.transaction_date,
                "expiry_date": payment.expiry_date
            })
        
        return result
    else:
        raise HTTPException(status_code=403, detail="Access denied")

@router.get("/")
def admin_get_all_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Admin xem tất cả thanh toán"""
    
    payments = session.exec(
        select(Payment, Package, User)
        .join(Package, Payment.package_id == Package.id)
        .join(User, Payment.user_id == User.id)
        .order_by(Payment.transaction_date.desc())
    ).all()
    
    result = []
    for payment, package, user in payments:
        result.append({
            "id": payment.id,
            "user_name": user.full_name,
            "user_email": user.email,
            "user_role": user.role,
            "package_name": package.name,
            "amount": payment.amount,
            "method": payment.method,
            "status": payment.status,
            "transaction_date": payment.transaction_date,
            "expiry_date": payment.expiry_date,
            "transaction_id": payment.transaction_id
        })
    
    return result

@router.put("/{payment_id}")
def update_payment_status(
    payment_id: int,
    status: str = Form(...),
    transaction_id: Optional[str] = Form(None),
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Admin cập nhật trạng thái thanh toán"""
    
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    valid_statuses = ["Pending", "Success", "Failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    payment.status = status
    if transaction_id:
        payment.transaction_id = transaction_id
    
    # If payment is successful, activate the package for user
    if status == "Success":
        user_obj = session.get(User, payment.user_id)
        package = session.get(Package, payment.package_id)
        
        if user_obj and package:
            user_obj.active_package_id = package.id
            user_obj.expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
            user_obj.is_active = True
            
            # Set payment expiry date
            payment.expiry_date = user_obj.expiry_date
            
            session.add(user_obj)
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.get("/{payment_id}")
def get_payment_details(
    payment_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy chi tiết thanh toán"""
    
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check if user can access this payment
    if user.role != "admin" and payment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    package = session.get(Package, payment.package_id)
    user_obj = session.get(User, payment.user_id)
    
    return {
        "id": payment.id,
        "user_name": user_obj.full_name if user_obj else "Unknown",
        "package_name": package.name if package else "Unknown",
        "amount": payment.amount,
        "method": payment.method,
        "status": payment.status,
        "transaction_date": payment.transaction_date,
        "expiry_date": payment.expiry_date,
        "transaction_id": payment.transaction_id
    }

# --- PAYMENT GATEWAY CALLBACKS ---
@router.post("/paypos/callback")
async def paypos_callback(request: Request, session: Session = Depends(get_session)):
    """PayPOS webhook callback"""
    try:
        data = await request.json()
        order_id = data.get("order_id")
        status = data.get("status")  # "success", "failed", "pending"
        transaction_id = data.get("transaction_id")
        
        if not order_id:
            return {"success": False, "message": "Missing order_id"}
        
        # Find payment by order_id (format: PKG_{payment_id}_{timestamp})
        payment_id = order_id.split("_")[1] if order_id.startswith("PKG_") else None
        if not payment_id:
            return {"success": False, "message": "Invalid order_id format"}
        
        payment = session.get(Payment, int(payment_id))
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        # Update payment status
        if status == "success":
            payment.status = "Success"
            payment.transaction_id = transaction_id
            
            # Activate package for user
            user = session.get(User, payment.user_id)
            package = session.get(Package, payment.package_id)
            
            if user and package:
                user.active_package_id = package.id
                user.package_expiry_date = datetime.utcnow() + timedelta(days=package.duration_days)
                user.is_active_package = True
                payment.expiry_date = user.package_expiry_date
                
                session.add(user)
        elif status == "failed":
            payment.status = "Failed"
            payment.transaction_id = transaction_id
        else:  # pending
            payment.status = "Pending"
            payment.transaction_id = transaction_id
        
        session.add(payment)
        session.commit()
        
        return {"success": True, "message": "Payment status updated"}
        
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/paypos/status/{payment_id}")
def get_paypos_status(payment_id: int, session: Session = Depends(get_session)):
    """Get PayPOS payment status"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "payment_id": payment.id,
        "status": payment.status,
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "method": payment.method
    }

# --- CANCEL PENDING PAYMENTS ---
@router.post("/cancel-pending")
def cancel_pending_payments(
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
        for payment in pending_payments:
            payment.status = "Cancelled"
            session.add(payment)
            count += 1
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Cancelled {count} pending payments",
            "count": count
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- DEBUG ENDPOINT ---
@router.get("/debug/invalid-payments")
def debug_invalid_payments(
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Debug endpoint to check for invalid payments"""
    
    # Get all payments with their package info
    payments = session.exec(select(Payment)).all()
    
    invalid_payments = []
    valid_payments = []
    
    for payment in payments:
        package = session.get(Package, payment.package_id)
        if not package:
            invalid_payments.append({
                "payment_id": payment.id,
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "status": payment.status,
                "amount": payment.amount,
                "transaction_date": payment.transaction_date,
                "error": "Package not found"
            })
        else:
            valid_payments.append({
                "payment_id": payment.id,
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "package_name": package.name,
                "status": payment.status,
                "amount": payment.amount,
                "transaction_date": payment.transaction_date
            })
    
    return {
        "total_payments": len(payments),
        "invalid_payments": invalid_payments,
        "valid_payments": valid_payments,
        "available_packages": [
            {"id": p.id, "name": p.name, "is_active": p.is_active} 
            for p in session.exec(select(Package)).all()
        ]
    }
