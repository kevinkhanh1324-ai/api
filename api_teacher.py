from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from typing import Optional
from models import User, ClassRoom, Camera, Child, Alert, BehaviorLog
from apiSQL import get_session, require_role
from sqlalchemy import func
from datetime import datetime, timedelta
router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

# TEACHER DASHBOARD
@router.get("/dashboard")
def teacher_dashboard(user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    classes = session.exec(select(ClassRoom).where(ClassRoom.teacher_id == user.id)).all()
    class_ids = [c.id for c in classes]

    if not class_ids:
        return {
            "msg": f"Chào mừng giáo viên {user.email}",
            "stats": {
                "students": 0,
                "present_today": 0,
                "avg_behavior_score": 0,
                "avg_class_score": 0
            }
        }

    students = session.exec(select(Child).where(Child.class_id.in_(class_ids))).all()
    today_start = datetime.utcnow() - timedelta(hours=24)
    present_students = session.exec(
        select(func.distinct(BehaviorLog.child_id))
        .join(Child, BehaviorLog.child_id == Child.id)
        .where(Child.class_id.in_(class_ids), BehaviorLog.timestamp >= today_start)
    ).all()
    present_count = len(present_students)

    avg_behavior_score = session.exec(
        select(func.avg(BehaviorLog.confidence))
        .join(Child, BehaviorLog.child_id == Child.id)
        .where(Child.class_id.in_(class_ids))
    ).first() or 0

    avg_class_score = session.exec(
        select(func.avg(Alert.severity))
        .join(Child, Alert.child_id == Child.id)
        .where(Child.class_id.in_(class_ids))
    ).first() or 0

    return {
        "msg": f"Chào mừng giáo viên {user.email}",
        "stats": {
            "students": len(students),
            "present_today": present_count,
            "avg_behavior_score": round(avg_behavior_score, 2),
            "avg_class_score": round(avg_class_score, 2)
        }
    }

# QUẢN LÝ LỚP HỌC
@router.get("/classes")
def teacher_get_classes(user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom).where(ClassRoom.teacher_id == user.id)).all()

# QUẢN LÝ HỌC SINH
@router.get("/children")
def teacher_get_children(user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.teacher_id == user.id)
    ).all()
    if not class_ids:
        return []
    children = session.exec(
        select(Child).where(Child.class_id.in_(class_ids))
    ).all()
    return children

@router.get("/children/{child_id}")
def teacher_get_child(child_id: int, user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    return child

@router.post("/children")
def teacher_create_child(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),
    parent_email: Optional[str] = Form(None),
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    class_id = None
    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại")
        class_id = classroom.id

    parent_id = None
    if parent_email is not None:
        parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
        if not parent:
            raise HTTPException(status_code=400, detail=f"Phụ huynh với email '{parent_email}' không tồn tại")
        parent_id = parent.id

    child = Child(name=name, class_id=class_id, parent_id=parent_id)
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@router.put("/children/{child_id}")
def teacher_update_child(
    child_id: int,
    name: str = Form(...),
    class_id: Optional[int] = Form(None),
    parent_id: Optional[int] = Form(None),
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    child.name = name
    if class_id is not None:
        child.class_id = class_id
    if parent_id is not None:
        child.parent_id = parent_id
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@router.delete("/children/{child_id}")
def teacher_delete_child(
    child_id: int,
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    session.delete(child)
    session.commit()
    return {"msg": "Đã xóa trẻ"}

# QUẢN LÝ CAMERA
@router.get("/cameras")
def teacher_get_cameras(user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.teacher_id == user.id)
    ).all()
    if not class_ids:
        return []
    cameras = session.exec(
        select(Camera).where(Camera.class_id.in_(class_ids))
    ).all()
    return cameras

@router.post("/cameras")
def teacher_create_camera(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    class_id = None
    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại")
        class_id = classroom.id

    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam

@router.put("/cameras/{camera_id}")
def teacher_update_camera(
    camera_id: int,
    name: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    active: Optional[bool] = Form(None),
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Không tìm thấy camera")

    if name is not None:
        camera.name = name
    if rtsp_url is not None:
        camera.rtsp_url = rtsp_url
    if active is not None:
        camera.active = active

    if class_name is not None:
        if class_name == "":
            camera.class_id = None
        else:
            classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
            if not classroom:
                raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại")
            camera.class_id = classroom.id

    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

@router.delete("/cameras/{camera_id}")
def teacher_delete_camera(
    camera_id: int,
    user: User = Depends(require_role("teacher")),
    session: Session = Depends(get_session)
):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Không tìm thấy camera")
    session.delete(camera)
    session.commit()
    return {"msg": "Đã xóa camera"}

# XEM CẢNH BÁO
@router.get("/alerts")
def teacher_get_alerts(user: User = Depends(require_role("teacher")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.teacher_id == user.id)
    ).all()
    if not class_ids:
        return []

    child_ids = session.exec(
        select(Child.id).where(Child.class_id.in_(class_ids))
    ).all()
    if not child_ids:
        return []

    alerts = session.exec(
        select(Alert)
        .where(Alert.child_id.in_(child_ids))
        .order_by(Alert.created_at.desc())
    ).all()
    return alerts