from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import func, text
from datetime import datetime as dt, timedelta
from typing import Optional
from models import (
    User,Token, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn, 
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog 
)
from apiSQL import get_session, require_role, audit, hash_password
import asyncio

router = APIRouter(prefix="/api/school", tags=["School"])

# SCHOOL DASHBOARD
@router.get("/dashboard")
def school_dashboard(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    classes = session.exec(select(ClassRoom).where(ClassRoom.school_id == user.id)).all()
    class_ids = [c.id for c in classes]

    if not class_ids:
        return {
            "msg": f"Chào mừng nhà trường {user.full_name}",
            "stats": {
                "students": 0,
                "present_today": 0,
                "avg_behavior_score": 0,
                "avg_class_score": 0
            }
        }

    students = session.exec(select(Child).where(Child.class_id.in_(class_ids))).all()
    student_count = len(students)

    today_start = dt.utcnow() - timedelta(hours=24)
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
        "msg": f"Chào mừng nhà trường {user.full_name}",
        "stats": {
            "students": student_count,
            "present_today": present_count,
            "avg_behavior_score": round(avg_behavior_score, 2),
            "avg_class_score": round(avg_class_score, 2)
        }
    }

# QUẢN LÝ LỚP HỌC
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
    if teacher_email is not None:
        teacher = session.exec(select(User).where(User.email == teacher_email, User.role == "teacher")).first()
        if not teacher:
            raise HTTPException(status_code=400, detail=f"Giáo viên với email '{teacher_email}' không tồn tại")
        teacher_id = teacher.id

    c = ClassRoom(name=name, teacher_id=teacher_id, school_id=user.id)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@router.put("/classes/{id}")
def school_update_class(
    id: int,
    name: Optional[str] = Form(None),
    teacher_email: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    c = session.get(ClassRoom, id)
    if not c or c.school_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp")

    if name is not None:
        c.name = name
    if teacher_email is not None:
        if teacher_email == "":
            c.teacher_id = None
        else:
            teacher = session.exec(select(User).where(User.email == teacher_email, User.role == "teacher")).first()
            if not teacher:
                raise HTTPException(status_code=400, detail=f"Giáo viên với email '{teacher_email}' không tồn tại")
            c.teacher_id = teacher.id

    session.add(c)
    session.commit()
    return c

@router.delete("/classes/{id}")
def school_delete_class(
    id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    c = session.get(ClassRoom, id)
    if not c or c.school_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp")
    session.delete(c)
    session.commit()
    return {"msg": "Đã xóa lớp"}

# QUẢN LÝ HỌC SINH
@router.get("/children")
def school_get_children(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.school_id == user.id)
    ).all()
    if not class_ids:
        return []
    children = session.exec(
        select(Child).where(Child.class_id.in_(class_ids))
    ).all()
    return children

@router.get("/children/{child_id}")
def school_get_child(
    child_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
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
    class_id = None
    if class_name is not None:
        classroom = session.exec(
            select(ClassRoom)
            .where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại hoặc không thuộc nhà trường")
        class_id = classroom.id

    parent_id = None
    if parent_email is not None:
        parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
        if not parent:
            raise HTTPException(status_code=400, detail=f"Phụ huynh với email '{parent_email}' không tồn tại")
        parent_id = parent.id

    try:
        dob = dt.strptime(date_of_birth, "%d/%m/%Y")
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ. Dùng DD/MM/YYYY")

    child = Child(
        full_name=full_name,
        date_of_birth=dob,
        class_id=class_id,
        parent_id=parent_id
    )
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
            raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ. Dùng DD/MM/YYYY")
    if class_name is not None:
        if class_name == "":
            child.class_id = None
        else:
            classroom = session.exec(
                select(ClassRoom)
                .where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
            ).first()
            if not classroom:
                raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại hoặc không thuộc nhà trường")
            child.class_id = classroom.id
    if parent_email is not None:
        if parent_email == "":
            child.parent_id = None
        else:
            parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
            if not parent:
                raise HTTPException(status_code=400, detail=f"Phụ huynh với email '{parent_email}' không tồn tại")
            child.parent_id = parent.id

    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@router.delete("/children/{child_id}")
def school_delete_child(
    child_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    session.delete(child)
    session.commit()
    return {"msg": "Đã xóa trẻ"}

# QUẢN LÝ GIÁO VIÊN
@router.get('/teachers')
def school_get_teachers(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    teachers = session.exec(
        select(Teacher)
        .where(Teacher.school_id == user.id)
    ).all()
    return teachers

@router.post('/teachers')
def school_create_teacher(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    full_name: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    user: User = Depends(require_role('school')),
    session: Session = Depends(get_session)
):
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=400, detail="Email exists")

    u = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role='teacher',
        phone=phone,
        address=address,
        emergency_contact=emergency_contact,
        school_id=user.id
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    background_tasks.add_task(audit, user.id, "create_teacher", f"user_id={u.id}")
    return u

@router.put('/teachers/{email}')
def school_update_teacher(
    email: str,
    background_tasks: BackgroundTasks,
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    user: User = Depends(require_role('school')),
    session: Session = Depends(get_session)
):
    u = session.exec(select(User).where(User.email == email, User.role == 'teacher', User.school_id == user.id)).first()
    if not u:
        raise HTTPException(status_code=404, detail='Teacher not found')
    
    if full_name is not None:
        u.full_name = full_name
    if phone is not None:
        u.phone = phone
    if address is not None:
        u.address = address
    if emergency_contact is not None:
        u.emergency_contact = emergency_contact

    session.add(u)
    session.commit()
    background_tasks.add_task(audit, user.id, "update_teacher", f"user_email={email}")
    return u

@router.delete('/teachers/{email}')
def school_delete_teacher(
    email: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('school')),
    session: Session = Depends(get_session)
):
    u = session.exec(select(User).where(User.email == email, User.role == 'teacher', User.school_id == user.id)).first()
    if not u:
        raise HTTPException(status_code=404, detail='Teacher not found')
    session.delete(u)
    session.commit()
    background_tasks.add_task(audit, user.id, "delete_teacher", f"{email}")
    return {"msg": "Đã xóa giáo viên"}

# QUẢN LÝ CAMERA
@router.get("/cameras")
def school_get_cameras(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.school_id == user.id)
    ).all()
    if not class_ids:
        return []
    cameras = session.exec(
        select(Camera).where(Camera.class_id.in_(class_ids))
    ).all()
    return cameras

@router.post("/cameras")
def school_create_camera(
    name: str = Form(...),
    class_name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    class_id = None
    if class_name is not None:
        classroom = session.exec(
            select(ClassRoom)
            .where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
        ).first()
        if not classroom:
            raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại hoặc không thuộc nhà trường")
        class_id = classroom.id

    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam

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
    cam = session.get(Camera, camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Không tìm thấy camera")

    if name is not None:
        cam.name = name
    if rtsp_url is not None:
        cam.rtsp_url = rtsp_url
    if active is not None:
        cam.active = active

    if class_name is not None:
        if class_name == "":
            cam.class_id = None
        else:
            classroom = session.exec(
                select(ClassRoom)
                .where(ClassRoom.name == class_name, ClassRoom.school_id == user.id)
            ).first()
            if not classroom:
                raise HTTPException(status_code=400, detail=f"Lớp '{class_name}' không tồn tại hoặc không thuộc nhà trường")
            cam.class_id = classroom.id

    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam

@router.delete("/cameras/{camera_id}")
def school_delete_camera(
    camera_id: int,
    user: User = Depends(require_role("school")),
    session: Session = Depends(get_session)
):
    cam = session.get(Camera, camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Không tìm thấy camera")
    session.delete(cam)
    session.commit()
    return {"msg": "Đã xóa camera"}

# XEM CẢNH BÁO
@router.get("/alerts")
def school_get_alerts(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = session.exec(
        select(ClassRoom.id).where(ClassRoom.school_id == user.id)
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