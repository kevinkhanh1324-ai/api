from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from typing import Optional
from models import User, ClassRoom, Camera, Child
# from api import get_session, require_role
from apiSQL import get_session, require_role

router = APIRouter(prefix="/api/school", tags=["School"])

# ---------- School Dashboard ----------
@router.get("/dashboard")
def school_dashboard(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    classes = session.exec(select(ClassRoom)).all()
    cameras = session.exec(select(Camera)).all()
    children = session.exec(select(Child)).all()

    return {
        "msg": f"Welcome school user {user.email}",
        "stats": {
            "classes": len(classes),
            "cameras": len(cameras),
            "children": len(children),
        }
    }

# --- Quản lý lớp học ---
@router.get("/classes")
def school_get_classes(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom)).all()

@router.post("/classes")
def school_create_class(name: str = Form(...), user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    c = ClassRoom(name=name)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c
# --- Sửa lớp học ---
@router.put("/classes/{class_id}")
def school_update_class(
    class_id: int,
    name: str = Form(...),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    classroom = session.get(ClassRoom, class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    classroom.name = name
    session.add(classroom)
    session.commit()
    session.refresh(classroom)
    return classroom

# --- Xóa lớp học ---
@router.delete("/classes/{class_id}")
def school_delete_class(
    class_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    classroom = session.get(ClassRoom, class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    session.delete(classroom)
    session.commit()
    return {"msg": "Class deleted"}

# --- Quản lý học sinh ---
@router.get("/children")
def school_get_children(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Child)).all()

@router.post("/children")
def school_create_child(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),
    parent_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    # Tra cứu class_id từ class_name
    class_id = None
    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Class '{class_name}' not found")
        class_id = classroom.id

    # Tra cứu parent_id từ parent_email
    parent_id = None
    if parent_email is not None:
        parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
        if not parent:
            raise HTTPException(status_code=400, detail=f"Parent with email '{parent_email}' not found")
        parent_id = parent.id

    # Tạo child với ID đã tra cứu
    child = Child(name=name, class_id=class_id, parent_id=parent_id)
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

# --- Sửa học sinh ---
@router.put("/children/{child_id}")
def school_update_child(
    child_id: int,
    name: str = Form(...),
    class_id: Optional[int] = Form(None),
    parent_id: Optional[int] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    child.name = name
    if class_id is not None:
        child.class_id = class_id
    if parent_id is not None:
        child.parent_id = parent_id
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

# --- Xóa học sinh ---
@router.delete("/children/{child_id}")
def school_delete_child(
    child_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    session.delete(child)
    session.commit()
    return {"msg": "Child deleted"}

# --- Quản lý camera ---
@router.get("/cameras")
def school_get_cameras(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Camera)).all()

@router.post("/cameras")
def school_create_camera(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),      # ← đổi từ class_id → class_name
    rtsp_url: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    class_id = None
    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Class '{class_name}' not found")
        class_id = classroom.id

    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam
# --- Sửa camera ---
@router.put("/cameras/{camera_id}")
def school_update_camera(
    camera_id: int,
    name: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),        # ← thay class_id
    rtsp_url: Optional[str] = Form(None),
    active: Optional[bool] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    if name is not None:
        camera.name = name
    if rtsp_url is not None:
        camera.rtsp_url = rtsp_url
    if active is not None:
        camera.active = active

    # Xử lý class_name → class_id
    if class_name is not None:
        if class_name == "":
            camera.class_id = None
        else:
            classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
            if not classroom:
                raise HTTPException(status_code=400, detail=f"Class '{class_name}' not found")
            camera.class_id = classroom.id

    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

# --- Xóa camera ---
@router.delete("/cameras/{camera_id}")
def school_delete_camera(
    camera_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    session.delete(camera)
    session.commit()
    return {"msg": "Camera deleted"}

# --- Xem danh sách cảnh báo ---
@router.get("/alerts")
def school_get_alerts(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    from models import Alert
    return session.exec(select(Alert).order_by(Alert.created_at.desc())).all()