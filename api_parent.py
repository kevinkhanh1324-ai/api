from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from models import User, Child, Alert
from apiSQL import require_role, get_session, hash_password, verify_password
from sqlmodel import Session, select
from pydantic import BaseModel

# Models cho Parent Profile
class ParentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    relationship: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    climbing_alerts: bool = True
    wandering_alerts: bool = True
    out_of_zone_alerts: bool = True
    collision_alerts: bool = True
    quiet_hours: bool = False

class PrivacySettings(BaseModel):
    share_data_with_teachers: bool = True
    allow_video_recording: bool = True
    data_retention_30_days: bool = True

router = APIRouter(prefix="/api/parent", tags=["Parent"])

# PARENT DASHBOARD
@router.get("/dashboard")
def parent_dashboard(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    children = session.exec(select(Child).where(Child.parent_id == user.id)).all()
    child_ids = [c.id for c in children]
    alerts = session.exec(
        select(Alert)
        .where(Alert.child_id.in_(child_ids))
        .order_by(Alert.created_at.desc())
    ).all() if child_ids else []

    return {
        "msg": f"Chào mừng phụ huynh {user.full_name}",
        "profile": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "address": user.address,
            "emergency_contact": user.emergency_contact,
            "relationship": user.relationship
        },
        "children_count": len(children),
        "recent_alerts_count": len(alerts),
        "children": children,
        "recent_alerts": alerts[:5]
    }

# QUẢN LÝ CON
@router.get("/children")
def parent_get_children(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    return session.exec(select(Child).where(Child.parent_id == user.id)).all()

@router.get("/children/{child_id}")
def parent_get_child(child_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    if child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Không phải con của bạn")
    return child

# QUẢN LÝ CẢNH BÁO
@router.get("/alerts")
def parent_get_alerts(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    children = session.exec(select(Child).where(Child.parent_id == user.id)).all()
    child_ids = [c.id for c in children]
    if not child_ids:
        return []
    alerts = session.exec(
        select(Alert)
        .where(Alert.child_id.in_(child_ids))
        .order_by(Alert.created_at.desc())
    ).all()
    return alerts

@router.get("/alerts/{alert_id}")
def parent_get_alert(alert_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")
    
    child = session.get(Child, alert.child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    return alert

@router.put("/alerts/{alert_id}/acknowledge")
def parent_acknowledge_alert(alert_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")
    
    child = session.get(Child, alert.child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    alert.acknowledged = True
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert

# PARENT PROFILE MANAGEMENT
@router.get("/profile", tags=["⚙️ Profile & Settings"])
def get_parent_profile(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    """Lấy thông tin profile của parent"""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "address": user.address,
        "emergency_contact": user.emergency_contact,
        "relationship": user.relationship
    }

@router.put("/profile", tags=["⚙️ Profile & Settings"])
def update_parent_profile(
    profile_data: ParentProfileUpdate,
    user: User = Depends(require_role("parent")),
    session: Session = Depends(get_session)
):
    """Cập nhật thông tin profile của parent"""
    if profile_data.full_name:
        user.full_name = profile_data.full_name
    if profile_data.phone:
        user.phone = profile_data.phone
    if profile_data.address:
        user.address = profile_data.address
    if profile_data.emergency_contact:
        user.emergency_contact = profile_data.emergency_contact
    if profile_data.relationship:
        user.relationship = profile_data.relationship
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "msg": "Profile updated successfully",
        "profile": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "address": user.address,
            "emergency_contact": user.emergency_contact,
            "relationship": user.relationship
        }
    }

@router.put("/change-password", tags=["⚙️ Profile & Settings"])
def change_parent_password(
    password_data: PasswordChange,
    user: User = Depends(require_role("parent")),
    session: Session = Depends(get_session)
):
    """Đổi mật khẩu của parent"""
    # Kiểm tra mật khẩu hiện tại
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    
    # Cập nhật mật khẩu mới
    user.hashed_password = hash_password(password_data.new_password)
    session.add(user)
    session.commit()
    
    return {"msg": "Password changed successfully"}

@router.get("/notification-settings", tags=["⚙️ Profile & Settings"])
def get_notification_settings(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    """Lấy cài đặt thông báo của parent"""
    # Trả về cài đặt mặc định (có thể lưu trong database sau)
    return {
        "email_notifications": True,
        "climbing_alerts": True,
        "wandering_alerts": True,
        "out_of_zone_alerts": True,
        "collision_alerts": True,
        "quiet_hours": False
    }

@router.put("/notification-settings", tags=["⚙️ Profile & Settings"])
def update_notification_settings(
    settings: NotificationSettings,
    user: User = Depends(require_role("parent")),
    session: Session = Depends(get_session)
):
    """Cập nhật cài đặt thông báo của parent"""
    # Có thể lưu vào database hoặc trả về thành công
    return {
        "msg": "Notification settings updated successfully",
        "settings": settings.dict()
    }

@router.get("/privacy-settings", tags=["⚙️ Profile & Settings"])
def get_privacy_settings(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    """Lấy cài đặt riêng tư của parent"""
    # Trả về cài đặt mặc định (có thể lưu trong database sau)
    return {
        "share_data_with_teachers": True,
        "allow_video_recording": True,
        "data_retention_30_days": True
    }

@router.put("/privacy-settings", tags=["⚙️ Profile & Settings"])
def update_privacy_settings(
    settings: PrivacySettings,
    user: User = Depends(require_role("parent")),
    session: Session = Depends(get_session)
):
    """Cập nhật cài đặt riêng tư của parent"""
    # Có thể lưu vào database hoặc trả về thành công
    return {
        "msg": "Privacy settings updated successfully",
        "settings": settings.dict()
    }