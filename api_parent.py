from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from models import User, Child, Alert
from apiSQL import require_role, get_session
from sqlmodel import Session, select
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