from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime as dt, timedelta
from typing import Optional
from models import (
    User,Token, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn, 
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog 
)
from apiSQL import get_session, require_role, audit, hash_password
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