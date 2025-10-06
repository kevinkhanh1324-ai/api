from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from models import User, Child, Alert
# from api import get_session, require_role
from apiSQL import get_session, require_role

router = APIRouter(prefix="/api/parent", tags=["Parent"])

# ---------- Parent Dashboard ----------
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
        "msg": f"Welcome parent {user.full_name}",
        "children_count": len(children),
        "recent_alerts_count": len(alerts),
        "children": children,
        "recent_alerts": alerts[:5]  # chỉ 5 cảnh báo mới nhất
    }

# ---------- Xem danh sách con ----------
@router.get("/children")
def parent_get_children(user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    children = session.exec(select(Child).where(Child.parent_id == user.id)).all()
    return children

# ---------- Xem chi tiết con ----------
@router.get("/children/{child_id}")
def parent_get_child(child_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    if child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Not your child")
    return child

# ---------- Xem cảnh báo của con ----------
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

# ---------- Xem chi tiết cảnh báo ----------
@router.get("/alerts/{alert_id}")
def parent_get_alert(alert_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Kiểm tra xem cảnh báo này có thuộc con của parent không
    child = session.get(Child, alert.child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return alert

# ---------- (Tùy chọn) Xác nhận đã xem cảnh báo ----------
@router.put("/alerts/{alert_id}/acknowledge")
def parent_acknowledge_alert(alert_id: int, user: User = Depends(require_role("parent")), session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    child = session.get(Child, alert.child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    alert.acknowledged = True
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert