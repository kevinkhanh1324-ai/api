
from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlmodel import Session, select
from typing import Optional
from models import User, ClassRoom, Camera, DangerZone, Alert, RegisterIn, Child
# from api import get_session, require_role, audit, hash_password
from apiSQL import get_session, require_role, audit, hash_password
import asyncio
router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ---------- Admin Dashboard ----------
@router.get('/dashboard')
def admin_dashboard(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    stats = {
        "users": session.exec(select(User)).count(),
        "children": session.exec(select(Child)).count(),  # ⚠️ cần import Child
        "alerts": session.exec(select(Alert)).count()
    }
    return stats

# ---------- Account Management ----------
@router.get('/accounts')
def admin_get_accounts(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@router.post('/accounts')
def admin_create_account(
    payload: RegisterIn,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email exists")
    u = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),  # ⚠️ cần hash_password
        role=payload.role,
        full_name=payload.fullName
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    # Dùng background task hoặc asyncio
    import asyncio
    asyncio.create_task(audit(user.id, "create_account", details=f"created {u.id}"))
    return u

@router.put('/accounts/{id}')
def admin_update_account(
    id: int,
    fullName: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    u = session.get(User, id)
    if not u:
        raise HTTPException(status_code=404, detail='Not found')
    if fullName:
        u.full_name = fullName
    if role:
        u.role = role
    session.add(u)
    session.commit()
    import asyncio
    asyncio.create_task(audit(user.id, "update_account", details=f"{id}"))
    return u

@router.delete('/accounts/{id}')
def admin_delete_account(
    id: int,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    u = session.get(User, id)
    if not u:
        raise HTTPException(status_code=404, detail='Not found')
    session.delete(u)
    session.commit()
    import asyncio
    asyncio.create_task(audit(user.id, "delete_account", details=f"{id}"))
    return {"msg": "deleted"}

# ---------- Classes ----------
@router.get('/classes')
def admin_get_classes(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom)).all()

@router.post('/classes')
def admin_create_class(name: str = Form(...), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    c = ClassRoom(name=name)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@router.put('/classes/{id}')
def admin_update_class(
    id: int,
    name: str = Form(...),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    c = session.get(ClassRoom, id)
    if not c:
        raise HTTPException(status_code=404, detail='Not found')
    c.name = name
    session.add(c)
    session.commit()
    return c

@router.delete('/classes/{id}')
def admin_delete_class(
    id: int,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    c = session.get(ClassRoom, id)
    if not c:
        raise HTTPException(status_code=404, detail='Not found')
    session.delete(c)
    session.commit()
    return {"msg": "deleted"}

# ---------- Cameras ----------
@router.get('/cameras')
def admin_get_cameras(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(Camera)).all()

@router.post('/cameras')
def admin_create_camera(
    name: str = Form(...),
    class_id: Optional[int] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam

@router.put('/cameras/{id}')
def admin_update_camera(
    id: int,
    name: Optional[str] = Form(None),
    active: Optional[bool] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    cam = session.get(Camera, id)
    if not cam:
        raise HTTPException(status_code=404, detail='Not found')
    if name is not None:
        cam.name = name
    if active is not None:
        cam.active = active
    session.add(cam)
    session.commit()
    return cam

@router.delete('/cameras/{id}')
def admin_delete_camera(
    id: int,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    cam = session.get(Camera, id)
    if not cam:
        raise HTTPException(status_code=404, detail='Not found')
    session.delete(cam)
    session.commit()
    return {"msg": "deleted"}

# ---------- Danger Zones ----------
@router.get('/danger-zones')
def admin_get_zones(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(DangerZone)).all()

@router.post('/danger-zones')
def admin_create_zone(
    name: str = Form(...),
    coords_json: str = Form(...),
    severity: int = Form(1),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    z = DangerZone(name=name, coords_json=coords_json, severity=severity)
    session.add(z)
    session.commit()
    session.refresh(z)
    return z

@router.put('/danger-zones/{id}')
def admin_update_zone(
    id: int,
    name: Optional[str] = Form(None),
    coords_json: Optional[str] = Form(None),
    severity: Optional[int] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    z = session.get(DangerZone, id)
    if not z:
        raise HTTPException(status_code=404, detail='Not found')
    if name is not None:
        z.name = name
    if coords_json is not None:
        z.coords_json = coords_json
    if severity is not None:
        z.severity = severity
    session.add(z)
    session.commit()
    return z

@router.delete('/danger-zones/{id}')
def admin_delete_zone(
    id: int,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    z = session.get(DangerZone, id)
    if not z:
        raise HTTPException(status_code=404, detail='Not found')
    session.delete(z)
    session.commit()
    return {"msg": "deleted"}

# ---------- Reports & Alerts ----------
@router.get('/reports')
def admin_reports(
    type: Optional[str] = None,
    timeRange: Optional[str] = None,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    return {"alerts_count": session.exec(select(Alert)).count()}

@router.get('/alerts')
def admin_get_alerts(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(Alert).order_by(Alert.created_at.desc())).all()

@router.put('/alerts/{id}')
def admin_update_alert(
    id: int,
    acknowledged: Optional[bool] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    a = session.get(Alert, id)
    if not a:
        raise HTTPException(status_code=404, detail='Not found')
    if acknowledged is not None:
        a.acknowledged = acknowledged
    session.add(a)
    session.commit()
    return a