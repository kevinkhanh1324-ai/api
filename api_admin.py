from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime as dt, timedelta
from typing import Optional
from models import (
    User,Token, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn, 
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog, Package, Payment
)
from common import get_session, require_role, audit, hash_password
import asyncio

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ADMIN DASHBOARD
@router.get('/dashboard')
def admin_dashboard(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    total_users = session.exec(select(func.count(User.id)).where(User.role.in_(["school", "parent"]))).one()
    total_parents = session.exec(select(func.count(User.id)).where(User.role == "parent")).one()
    total_schools = session.exec(select(func.count(User.id)).where(User.role == "school")).one()
    total_teachers = session.exec(select(func.count(Teacher.id))).one()  # Count from Teacher table

    return {
        "users": total_users,
        "parents": total_parents,
        "schools": total_schools,
        "teachers": total_teachers
    }

# QUẢN LÝ NGƯỜI DÙNG (school, parent)
@router.get('/users')
def admin_get_users(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(User).where(User.role.in_(["school", "parent"]))).all()

@router.post('/users')
def admin_create_user(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    full_name: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),  # "school" or "parent" only
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    if role not in ["school", "parent"]:
        raise HTTPException(status_code=400, detail="Role must be 'school' or 'parent'")
    
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=400, detail="Email exists")

    u = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        phone=phone,
        address=address,
        emergency_contact=emergency_contact,
        relationship=relationship
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    background_tasks.add_task(audit, user.id, "create_user", f"role={u.role}, user_id={u.id}")
    return u

@router.put('/users/{email}')
def admin_update_user(
    email: str,
    background_tasks: BackgroundTasks,
    full_name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    u = session.exec(select(User).where(User.email == email, User.role.in_(["school", "parent"]))).first()
    if not u:
        raise HTTPException(status_code=404, detail='User not found')
    
    if full_name is not None:
        u.full_name = full_name
    if role is not None:
        if role not in ["school", "parent"]:
            raise HTTPException(status_code=400, detail="Role must be 'school' or 'parent'")
        u.role = role
    if phone is not None:
        u.phone = phone
    if address is not None:
        u.address = address
    if emergency_contact is not None:
        u.emergency_contact = emergency_contact
    if relationship is not None:
        u.relationship = relationship
    
    session.add(u)
    session.commit()
    background_tasks.add_task(audit, user.id, "update_user", f"user_email={email}")
    return u

@router.delete('/users/{email}')
def admin_delete_user(
    email: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    u = session.exec(select(User).where(User.email == email, User.role.in_(["school", "parent"]))).first()
    if not u:
        raise HTTPException(status_code=404, detail='User not found')
    session.delete(u)
    session.commit()
    background_tasks.add_task(audit, user.id, "delete_user", f"{email}")
    return {"msg": "User deleted"}

# QUẢN LÝ USER PACKAGES
@router.get('/user-packages')
def admin_get_user_packages(
    user: User = Depends(require_role('admin')), 
    session: Session = Depends(get_session)
):
    """Admin xem danh sách tất cả user packages (parent/school có gói)"""
    # Lấy tất cả user có active package
    users_with_packages = session.exec(
        select(User).where(
            User.role.in_(["parent", "school"]),
            User.active_package_id.isnot(None)
        )
    ).all()
    
    result = []
    for u in users_with_packages:
        package = session.get(Package, u.active_package_id) if u.active_package_id else None
        result.append({
            "user_id": u.id,
            "user_email": u.email,
            "user_name": u.full_name,
            "user_role": u.role,
            "package_id": u.active_package_id,
            "package_name": package.name if package else None,
            "package_price": package.price if package else None,
            "package_expiry_date": u.package_expiry_date,
            "is_active_package": u.is_active_package,
            "days_remaining": (u.package_expiry_date - dt.utcnow()).days if u.package_expiry_date else 0
        })
    
    return result

@router.get('/user-packages/{user_id}')
def admin_get_user_package_detail(
    user_id: int,
    user: User = Depends(require_role('admin')), 
    session: Session = Depends(get_session)
):
    """Admin xem chi tiết package của một user"""
    target_user = session.get(User, user_id)
    if not target_user or target_user.role not in ["parent", "school"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    package = session.get(Package, target_user.active_package_id) if target_user.active_package_id else None
    
    # Lấy lịch sử payments
    payments = session.exec(
        select(Payment).where(Payment.user_id == user_id).order_by(Payment.transaction_date.desc())
    ).all()
    
    return {
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "phone": target_user.phone,
            "address": target_user.address
        },
        "current_package": {
            "id": target_user.active_package_id,
            "name": package.name if package else None,
            "price": package.price if package else None,
            "duration_days": package.duration_days if package else None,
            "camera_limit": package.camera_limit if package else None,
            "ai_features": package.ai_features if package else None,
            "storage_days": package.storage_days if package else None,
            "description": package.description if package else None
        },
        "package_info": {
            "expiry_date": target_user.package_expiry_date,
            "is_active": target_user.is_active_package,
            "days_remaining": (target_user.package_expiry_date - dt.utcnow()).days if target_user.package_expiry_date else 0
        },
        "payment_history": [
            {
                "id": p.id,
                "amount": p.amount,
                "method": p.method,
                "status": p.status,
                "transaction_id": p.transaction_id,
                "transaction_date": p.transaction_date,
                "expiry_date": p.expiry_date
            } for p in payments
        ]
    }

@router.post('/user-packages/{user_id}/extend')
def admin_extend_user_package(
    user_id: int,
    background_tasks: BackgroundTasks,
    package_id: int = Form(...),
    duration_days: int = Form(...),
    user: User = Depends(require_role('admin')), 
    session: Session = Depends(get_session)
):
    """Admin gia hạn/thay đổi package cho user"""
    target_user = session.get(User, user_id)
    if not target_user or target_user.role not in ["parent", "school"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Cập nhật package cho user
    target_user.active_package_id = package_id
    target_user.is_active_package = True
    
    # Tính toán expiry date
    if target_user.package_expiry_date and target_user.package_expiry_date > dt.utcnow():
        # Nếu package còn hạn, gia hạn từ ngày hết hạn hiện tại
        target_user.package_expiry_date = target_user.package_expiry_date + timedelta(days=duration_days)
    else:
        # Nếu package hết hạn hoặc chưa có, tính từ bây giờ
        target_user.package_expiry_date = dt.utcnow() + timedelta(days=duration_days)
    
    session.add(target_user)
    session.commit()
    
    # Tạo payment record cho admin action
    admin_payment = Payment(
        user_id=user_id,
        package_id=package_id,
        amount=package.price,
        method="Admin",
        status="Success",
        transaction_id=f"ADMIN_{user_id}_{dt.utcnow().strftime('%Y%m%d_%H%M%S')}",
        transaction_date=dt.utcnow(),
        expiry_date=target_user.package_expiry_date
    )
    session.add(admin_payment)
    session.commit()
    
    background_tasks.add_task(audit, user.id, "extend_user_package", f"user_id={user_id}, package_id={package_id}, days={duration_days}")
    
    return {
        "message": "Package extended successfully",
        "user_id": user_id,
        "package_id": package_id,
        "new_expiry_date": target_user.package_expiry_date,
        "days_remaining": (target_user.package_expiry_date - dt.utcnow()).days
    }

@router.post('/user-packages/{user_id}/deactivate')
def admin_deactivate_user_package(
    user_id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('admin')), 
    session: Session = Depends(get_session)
):
    """Admin tạm dừng package của user"""
    target_user = session.get(User, user_id)
    if not target_user or target_user.role not in ["parent", "school"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user.is_active_package = False
    session.add(target_user)
    session.commit()
    
    background_tasks.add_task(audit, user.id, "deactivate_user_package", f"user_id={user_id}")
    
    return {
        "message": "Package deactivated successfully",
        "user_id": user_id,
        "is_active": False
    }

@router.post('/user-packages/{user_id}/activate')
def admin_activate_user_package(
    user_id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('admin')), 
    session: Session = Depends(get_session)
):
    """Admin kích hoạt lại package của user"""
    target_user = session.get(User, user_id)
    if not target_user or target_user.role not in ["parent", "school"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not target_user.active_package_id:
        raise HTTPException(status_code=400, detail="User has no active package")
    
    target_user.is_active_package = True
    session.add(target_user)
    session.commit()
    
    background_tasks.add_task(audit, user.id, "activate_user_package", f"user_id={user_id}")
    
    return {
        "message": "Package activated successfully",
        "user_id": user_id,
        "is_active": True
    }