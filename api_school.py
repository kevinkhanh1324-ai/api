from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime as dt, timedelta
from typing import Optional
from models import (
    User,Token, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn, 
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog 
)
from apiSQL import get_session, require_role, hash_password, get_current_user, security

router = APIRouter(prefix="/api/school")

# --- TIỆN ÍCH ---
def get_class_ids(session: Session, school_id: int):
    return session.exec(select(ClassRoom.id).where(ClassRoom.school_id == school_id)).all()

# --- DASHBOARD ---
@router.get("/dashboard", tags=["📊 Dashboard"])
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
@router.get("/classes",  tags=["Class Management"])
def school_get_classes(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom).where(ClassRoom.school_id == user.id)).all()

@router.post("/classes",  tags=["Class Management"])
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

@router.put("/classes/{id}", tags=["Class Management"])
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

@router.delete("/classes/{id}",  tags=["Class Management"])
def school_delete_class(id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    classroom = session.get(ClassRoom, id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=404, detail="Lớp không tồn tại")
    session.delete(classroom)
    session.commit()
    return {"msg": "Đã xóa lớp"}

# --- HỌC SINH ---
@router.get("/children", tags=["👶 Student Management"])
def school_get_children(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return []
    return session.exec(select(Child).where(Child.class_id.in_(class_ids))).all()

@router.get("/children/{child_id}", tags=["👶 Student Management"])
def school_get_child(child_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    return child

@router.get("/parents/{parent_id}", tags=["👨‍👩‍👧‍👦 Parent Management"])
def school_get_parent(parent_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    parent = session.get(User, parent_id)
    if not parent or parent.role != "parent":
        raise HTTPException(status_code=404, detail="Không tìm thấy phụ huynh")
    return parent

@router.get("/children/{child_id}/status", tags=["👶 Student Management"])
def school_get_child_status(child_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Không tìm thấy trẻ")
    classroom = session.get(ClassRoom, child.class_id)
    if not classroom or classroom.school_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    # Lấy thông tin hành vi gần nhất (24h)
    today_start = dt.utcnow() - timedelta(hours=24)
    recent_behavior = session.exec(
        select(BehaviorLog)
        .where(BehaviorLog.child_id == child_id, BehaviorLog.timestamp >= today_start)
        .order_by(BehaviorLog.timestamp.desc())
        .limit(1)
    ).first()
    
    # Lấy cảnh báo gần nhất
    recent_alert = session.exec(
        select(Alert)
        .where(Alert.child_id == child_id)
        .order_by(Alert.created_at.desc())
        .limit(1)
    ).first()
    
    # Tính điểm hành vi trung bình
    avg_behavior = session.exec(
        select(func.avg(BehaviorLog.confidence))
        .where(BehaviorLog.child_id == child_id)
    ).first() or 0
    
    # Xác định status dựa trên hành vi gần nhất
    status = "absent"  # Mặc định là vắng mặt
    if recent_behavior:
        if recent_behavior.confidence >= 80:
            status = "present"
        elif recent_behavior.confidence >= 60:
            status = "late"
    
    return {
        "child_id": child_id,
        "status": status,
        "behavior_score": round(avg_behavior, 1),
        "last_activity": recent_behavior.timestamp if recent_behavior else None,
        "recent_alert": recent_alert.alert_type if recent_alert else None,
        "alert_severity": recent_alert.severity if recent_alert else 0
    }

@router.post("/children", tags=["👶 Student Management"])
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

@router.put("/children/{child_id}", tags=["👶 Student Management"])
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

@router.delete("/children/{child_id}", tags=["👶 Student Management"])
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
@router.get("/teachers", tags=["👨‍🏫 Teacher Management"])
def school_get_teachers(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Teacher).where(Teacher.school_id == user.id)).all()

@router.post("/teachers", tags=["👨‍🏫 Teacher Management"])
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

@router.put("/teachers/{email}", tags=["👨‍🏫 Teacher Management"])
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

@router.delete("/teachers/{email}", tags=["👨‍🏫 Teacher Management"])
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
@router.get("/cameras", tags=["📹 Camera Management"])
def school_get_cameras(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    class_ids = get_class_ids(session, user.id)
    if not class_ids:
        return []
    return session.exec(select(Camera).where(Camera.class_id.in_(class_ids))).all()

@router.post("/cameras", tags=["📹 Camera Management"])
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

@router.put("/cameras/{camera_id}", tags=["📹 Camera Management"])
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

@router.delete("/cameras/{camera_id}", tags=["📹 Camera Management"])
def school_delete_camera(camera_id: int, user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera không tồn tại")
    session.delete(camera)
    session.commit()
    return {"msg": "Đã xóa camera"}

# --- CẢNH BÁO ---
@router.get("/alerts", tags=["🚨 Alert Management"])
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

# --- SCHOOL SETTINGS APIS ---
from pydantic import BaseModel

class SchoolProfileUpdate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    relationship: Optional[str] = None

class SystemSettings(BaseModel):
    autoBackup: bool
    backupFrequency: str
    dataRetention: int
    enableAnalytics: bool
    enableReports: bool
    maxStudentsPerClass: int

class NotificationSettings(BaseModel):
    systemAlerts: bool
    parentNotifications: bool
    teacherNotifications: bool
    emergencyAlerts: bool
    maintenanceNotifications: bool
    reportReminders: bool

class PasswordPolicy(BaseModel):
    minLength: int
    requireSpecialChars: bool
    requireNumbers: bool
    expireDays: int

class SecuritySettings(BaseModel):
    passwordPolicy: PasswordPolicy
    sessionTimeout: int
    loginAttempts: int
    ipRestriction: bool
    auditLogging: bool

@router.get("/debug-token", tags=["🔧 Debug & Test"])
def debug_token(user: User = Depends(get_current_user)):
    """Debug endpoint to check token validity"""
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "status": "Token is valid"
    }

@router.get("/debug-auth", tags=["🔧 Debug & Test"])
def debug_auth(cred: HTTPAuthorizationCredentials = Depends(security)):
    """Debug endpoint to check raw token"""
    return {
        "token": cred.credentials[:20] + "...",  # Chỉ hiển thị 20 ký tự đầu
        "has_token": bool(cred.credentials)
    }

@router.get("/test", tags=["🔧 Debug & Test"])
def test_endpoint():
    """Simple test endpoint without auth"""
    return {"message": "API is working", "timestamp": dt.utcnow().isoformat()}

@router.get("/test-auth", tags=["🔧 Debug & Test"])
def test_auth_endpoint(user: User = Depends(get_current_user)):
    """Test endpoint with auth"""
    return {
        "message": "Auth is working",
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }

@router.post("/test-put", tags=["🔧 Debug & Test"])
def test_put_endpoint(user: User = Depends(get_current_user)):
    """Test PUT endpoint with auth"""
    return {
        "message": "PUT auth is working",
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }

@router.get("/debug-teacher", tags=["🔧 Debug & Test"])
def debug_teacher(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Debug endpoint to check teacher info"""
    if user.role != "teacher":
        return {"error": "Not a teacher"}
    
    teacher = session.exec(select(Teacher).where(Teacher.email == user.email)).first()
    if not teacher:
        return {"error": "Teacher not found in Teacher table"}
    
    return {
        "teacher_id": teacher.id,
        "email": teacher.email,
        "school_id": teacher.school_id,
        "full_name": teacher.full_name
    }


@router.get("/profile", tags=["⚙️ Profile & Settings"])
def get_school_profile(
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    """Lấy thông tin trường"""
    
    # Xác định school_id dựa trên role
    if user.role == "school":
        school_id = user.id
    elif user.role == "teacher":
        # Lấy school_id từ teacher
        teacher = session.exec(select(Teacher).where(Teacher.email == user.email)).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        school_id = teacher.school_id
        if not school_id:
            raise HTTPException(status_code=404, detail="Teacher not assigned to any school")
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Lấy thống kê
    class_ids = get_class_ids(session, school_id)
    total_students = session.exec(
        select(func.count(Child.id)).where(Child.class_id.in_(class_ids))
    ).one() if class_ids else 0
    
    total_teachers = session.exec(
        select(func.count(Teacher.id)).where(Teacher.school_id == school_id)
    ).one()
    
    total_classes = len(class_ids)
    
    return {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "address": user.address or "",
        "emergency_contact": user.emergency_contact or "",
        "relationship": user.relationship or "",
        "role": user.role,
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalClasses": total_classes
    }

@router.put("/profile", tags=["⚙️ Profile & Settings"])
def update_school_profile(
    profile_data: SchoolProfileUpdate,
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    """Cập nhật thông tin trường/giáo viên"""
    
    # Chỉ cho phép school và teacher cập nhật
    if user.role not in ["school", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user.full_name = profile_data.full_name
    user.email = profile_data.email
    user.phone = profile_data.phone
    user.address = profile_data.address
    user.emergency_contact = profile_data.emergency_contact
    user.relationship = profile_data.relationship
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {"message": "Cập nhật thông tin thành công"}

@router.get("/system-settings", tags=["⚙️ Profile & Settings"])
def get_system_settings(
    user: User = Depends(require_role("school"))
):
    """Lấy cài đặt hệ thống (mock data)"""
    return {
        "autoBackup": True,
        "backupFrequency": "daily",
        "dataRetention": 36,
        "enableAnalytics": True,
        "enableReports": True,
        "maxStudentsPerClass": 35
    }

@router.put("/system-settings", tags=["⚙️ Profile & Settings"])
def update_system_settings(
    settings: SystemSettings,
    user: User = Depends(require_role("school"))
):
    """Cập nhật cài đặt hệ thống"""
    # Trong thực tế, lưu vào database hoặc config file
    # Hiện tại chỉ return success
    return {"message": "Cập nhật cài đặt hệ thống thành công"}

@router.get("/notification-settings", tags=["⚙️ Profile & Settings"])
def get_notification_settings(
    user: User = Depends(require_role("school"))
):
    """Lấy cài đặt thông báo (mock data)"""
    return {
        "systemAlerts": True,
        "parentNotifications": True,
        "teacherNotifications": True,
        "emergencyAlerts": True,
        "maintenanceNotifications": False,
        "reportReminders": True
    }

@router.put("/notification-settings", tags=["⚙️ Profile & Settings"])
def update_notification_settings(
    settings: NotificationSettings,
    user: User = Depends(require_role("school"))
):
    """Cập nhật cài đặt thông báo"""
    return {"message": "Cập nhật cài đặt thông báo thành công"}

@router.get("/security-settings", tags=["⚙️ Profile & Settings"])
def get_security_settings(
    user: User = Depends(require_role("school"))
):
    """Lấy cài đặt bảo mật (mock data)"""
    return {
        "passwordPolicy": {
            "minLength": 8,
            "requireSpecialChars": True,
            "requireNumbers": True,
            "expireDays": 90
        },
        "sessionTimeout": 60,
        "loginAttempts": 5,
        "ipRestriction": False,
        "auditLogging": True
    }

@router.put("/security-settings", tags=["⚙️ Profile & Settings"])
def update_security_settings(
    settings: SecuritySettings,
    user: User = Depends(require_role("school"))
):
    """Cập nhật cài đặt bảo mật"""
    return {"message": "Cập nhật cài đặt bảo mật thành công"}