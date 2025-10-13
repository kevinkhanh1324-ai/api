from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime as dt, timedelta
from typing import Optional
from models import (
    User,Token, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn, 
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog 
)
from apiSQL import get_session, require_role, hash_password

router = APIRouter(prefix="/api/school", tags=["School"])


# --- TIỆN ÍCH ---
def get_class_ids(session: Session, school_id: int):
    return session.exec(select(ClassRoom.id).where(ClassRoom.school_id == school_id)).all()


# --- DASHBOARD ---
@router.get("/dashboard")
def school_dashboard(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return {
            "msg": f"Chào mừng nhà trường {user.full_name}",
            "stats": {"students": 0, "present_today": 0, "avg_behavior_score": 0, "avg_class_score": 0}
        }

    # Số học sinh
    student_count = session.exec(select(func.count(Child.id)).where(Child.class_id.in_(class_ids))).one()

    # Học sinh có hành vi trong 24h
    today_start = dt.utcnow() - timedelta(hours=24)
    present_count = session.exec(
        select(func.count(func.distinct(BehaviorLog.child_id)))
        .join(Child).where(Child.class_id.in_(class_ids), BehaviorLog.timestamp >= today_start)
    ).one()

    # Điểm trung bình
    avg_behavior = session.exec(
        select(func.avg(BehaviorLog.confidence))
        .join(Child).where(Child.class_id.in_(class_ids))
    ).first() or 0

    avg_severity = session.exec(
        select(func.avg(Alert.severity))
        .join(Child).where(Child.class_id.in_(class_ids))
    ).first() or 0

    return {
        "msg": f"Chào mừng nhà trường {user.full_name}",
        "stats": {
            "students": student_count,
            "present_today": present_count,
            "avg_behavior_score": round(avg_behavior, 2),
            "avg_class_score": round(avg_severity, 2)
        }
    }


# --- LỚP HỌC ---
@router.get("/classes")
def school_get_classes(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom).where(ClassRoom.school_id == user.id)).all()

@router.post("/classes")
def school_create_class(
    name: str = Form(...),
    teacher_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    if session.exec(select(ClassRoom).where(ClassRoom.name == name, ClassRoom.school_id == user.id)).first():
        raise HTTPException(status_code=400, detail=f"Lớp '{name}' đã tồn tại")

    teacher_id = None
    if teacher_email:
        teacher = session.exec(
            select(Teacher).where(Teacher.email == teacher_email, Teacher.school_id == user.id)
        ).first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Giáo viên không tồn tại hoặc không thuộc trường")
        teacher_id = teacher.id

    classroom = ClassRoom(name=name, teacher_id=teacher_id, school_id=user.id)
    session.add(classroom)
    session.commit()
    session.refresh(classroom)
    return classroom

@router.put("/classes/{id}")
def school_update_class(
    id: int,
    name: Optional[str] = Form(None),
    teacher_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    classroom = session.get(ClassRoom, id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=404, detail="Lớp không tồn tại")

    if name is not None:
        classroom.name = name
    if teacher_email == "":
        classroom.teacher_id = None
    elif teacher_email:
        teacher = session.exec(
            select(Teacher).where(Teacher.email == teacher_email, Teacher.school_id == user.id)
        ).first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Giáo viên không tồn tại hoặc không thuộc trường")
        classroom.teacher_id = teacher.id

    session.add(classroom)
    session.commit()
    session.refresh(classroom)
    return classroom

@router.delete("/classes/{id}")
def school_delete_class(id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    classroom = session.get(ClassRoom, id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=404, detail="Lớp không tồn tại")
    session.delete(classroom)
    session.commit()
    return {"msg": "Đã xóa lớp"}


# --- HỌC SINH ---
@router.get("/children")
def school_get_children(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return []
    return session.exec(select(Child).where(Child.class_id.in_(class_ids))).all()

@router.get("/children/{child_id}")
def school_get_child(child_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    return child

@router.post("/children")
def school_create_child(
    full_name: str = Form(...),
    date_of_birth: str = Form(...),
    class_name: Optional[str] = Form(None),
    parent_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    # Xử lý lớp
    class_id = None
    if class_name:
        classroom = session.exec(
            select(ClassRoom).where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại")
        class_id = classroom.id

    # Xử lý phụ huynh
    parent_id = None
    if parent_email:
        parent = session.exec(
            select(User).where(User.email == parent_email, User.role == "parent")
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Phụ huynh không tồn tại")
        parent_id = parent.id

    # Xử lý ngày sinh
    try:
        dob = dt.strptime(date_of_birth, "%d/%m/%Y")
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày: DD/MM/YYYY")

    child = Child(full_name=full_name, date_of_birth=dob, class_id=class_id, parent_id=parent_id)
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@router.put("/children/{child_id}")
def school_update_child(
    child_id: int,
    full_name: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    parent_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")

    if full_name is not None:
        child.full_name = full_name
    if date_of_birth is not None:
        try:
            child.date_of_birth = dt.strptime(date_of_birth, "%d/%m/%Y")
        except ValueError:
            raise HTTPException(status_code=400, detail="Định dạng ngày: DD/MM/YYYY")
    if class_name == "":
        child.class_id = None
    elif class_name:
        classroom = session.exec(
            select(ClassRoom).where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail="Lớp không tồn tại")
        child.class_id = classroom.id
    if parent_email == "":
        child.parent_id = None
    elif parent_email:
        parent = session.exec(
            select(User).where(User.email == parent_email, User.role == "parent")
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Phụ huynh không tồn tại")
        child.parent_id = parent.id

    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@router.delete("/children/{child_id}")
def school_delete_child(child_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    session.delete(child)
    session.commit()
    return {"msg": "Đã xóa trẻ"}


# --- GIÁO VIÊN (DÙNG BẢNG TEACHER) ---
@router.get("/teachers")
def school_get_teachers(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Teacher).where(Teacher.school_id == user.id)).all()

@router.post("/teachers")
def school_create_teacher(
    email: str = Form(...),
    full_name: str = Form(...),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education_level: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    if session.exec(select(Teacher).where(Teacher.email == email)).first():
        raise HTTPException(status_code=400, detail="Email giáo viên đã tồn tại")

    teacher = Teacher(
        email=email,
        full_name=full_name,
        hashed_password=hash_password("teacher123"),  # hoặc bỏ nếu không cần login
        phone=phone,
        address=address,
        emergency_contact=emergency_contact,
        experience=experience,
        education_level=education_level,
        school_id=user.id
    )
    session.add(teacher)
    session.commit()
    session.refresh(teacher)
    return teacher

@router.put("/teachers/{email}")
def school_update_teacher(
    email: str,
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education_level: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    teacher = session.exec(
        select(Teacher).where(Teacher.email == email, Teacher.school_id == user.id)
    ).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Giáo viên không tồn tại")

    for field, value in [
        ("full_name", full_name),
        ("phone", phone),
        ("address", address),
        ("emergency_contact", emergency_contact),
        ("experience", experience),
        ("education_level", education_level)
    ]:
        if value is not None:
            setattr(teacher, field, value)

    session.add(teacher)
    session.commit()
    session.refresh(teacher)
    return teacher

@router.delete("/teachers/{email}")
def school_delete_teacher(email: str, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    teacher = session.exec(
        select(Teacher).where(Teacher.email == email, Teacher.school_id == user.id)
    ).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Giáo viên không tồn tại")
    session.delete(teacher)
    session.commit()
    return {"msg": "Đã xóa giáo viên"}


# --- CAMERA ---
@router.get("/cameras")
def school_get_cameras(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return []
    return session.exec(select(Camera).where(Camera.class_id.in_(class_ids))).all()

@router.post("/cameras")
def school_create_camera(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    class_id = None
    if class_name:
        classroom = session.exec(
            select(ClassRoom).where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail="Lớp không tồn tại")
        class_id = classroom.id

    camera = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

@router.put("/cameras/{camera_id}")
def school_update_camera(
    camera_id: int,
    name: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    active: Optional[bool] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera không tồn tại")

    if name is not None: camera.name = name
    if rtsp_url is not None: camera.rtsp_url = rtsp_url
    if active is not None: camera.active = active

    if class_name == "":
        camera.class_id = None
    elif class_name:
        classroom = session.exec(
            select(ClassRoom).where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail="Lớp không tồn tại")
        camera.class_id = classroom.id

    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

@router.delete("/cameras/{camera_id}")
def school_delete_camera(camera_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera không tồn tại")
    session.delete(camera)
    session.commit()
    return {"msg": "Đã xóa camera"}


# --- CẢNH BÁO ---
@router.get("/alerts")
def school_get_alerts(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return []
    child_ids = session.exec(select(Child.id).where(Child.class_id.in_(class_ids))).all()
    if not child_ids:
        return []
    return session.exec(
        select(Alert)
        .where(Alert.child_id.in_(child_ids))
        .order_by(Alert.created_at.desc())
    ).all()