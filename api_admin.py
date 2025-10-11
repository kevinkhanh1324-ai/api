from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import func, text
from datetime import datetime as dt, timedelta
from typing import Optional
from models import User, ClassRoom, Camera, DangerZone, Alert, Child
from apiSQL import get_session, require_role, audit, hash_password
import asyncio
router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ADMIN DASHBOARD
@router.get('/dashboard')
def admin_dashboard(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    total_children = session.exec(select(func.count(Child.id))).one()
    total_class = session.exec(select(func.count(ClassRoom.id))).one()
    active_classes = session.exec(
        select(func.count(func.distinct(ClassRoom.id)))
        .join(Camera, ClassRoom.id == Camera.class_id)
        .where(Camera.active == True)
    ).one()
    active_cameras = session.exec(select(func.count(Camera.id)).where(Camera.active == True)).one()
    today_start = dt.utcnow() - timedelta(hours=24)
    alerts_today = session.exec(select(func.count(Alert.id)).where(Alert.created_at >= today_start)).one()
    total_users = session.exec(select(func.count(User.id))).one()
    total_alerts = session.exec(select(func.count(Alert.id))).one()

    return {
        "users": total_users,
        "children": total_children,
        "alerts": total_alerts,
        "total_classes": total_class,
        "active_classes": active_classes,
        "active_cameras": active_cameras,
        "alerts_today": alerts_today        
    }

# CHILDREN CRUD
@router.get('/children')
def admin_get_children(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    children_with_info = session.exec(
        select(Child, User, ClassRoom)
        .join(User, Child.parent_id == User.id, isouter=True)
        .join(ClassRoom, Child.class_id == ClassRoom.id, isouter=True)
    ).all()
    
    result = []
    for child, parent, classroom in children_with_info:
        age = None
        if child.date_of_birth:
            today = dt.utcnow()
            dob = child.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        
        result.append({
            "id": child.id,
            "name": child.name,
            "date_of_birth": child.date_of_birth.strftime("%d/%m/%Y") if child.date_of_birth else None,
            "age": age,
            "class_id": child.class_id,
            "class_name": classroom.name if classroom else None,
            "parent_id": child.parent_id,
            "parent_name": parent.full_name if parent else None,
            "parent_email": parent.email if parent else None,
            "parent_phone": parent.phone if parent else None,
            "parent_address": parent.address if parent else None,
            "parent_emergency_contact": parent.emergency_contact if parent else None,
        })
    return result

@router.post('/children')
def admin_create_child(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    date_of_birth: str = Form(...),
    class_name: str = Form(...),
    parent_email: str = Form(...),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
    if not parent:
        raise HTTPException(status_code=400, detail=f"Parent with email '{parent_email}' not found")
    parent_id = parent.id

    classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
    class_id = classroom.id

    try:
        dob = dt.strptime(date_of_birth, "%d/%m/%Y")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use DD/MM/YYYY")

    with session.bind.connect() as conn:
        conn.execute(text("""
            INSERT INTO Child (name, date_of_birth, class_id, parent_id)
            VALUES (:name, :date_of_birth, :class_id, :parent_id)
        """), {
            "name": name,
            "date_of_birth": dob,
            "class_id": class_id,
            "parent_id": parent_id
        })
        conn.commit()

    child = session.exec(select(Child).where(Child.name == name, Child.parent_id == parent_id)).first()
    background_tasks.add_task(audit, user.id, "create_child", f"child_id={child.id}")    
    return child

@router.put('/children/{child_id}')
def admin_update_child(
    child_id: int,
    background_tasks: BackgroundTasks,
    name: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    parent_email: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    parent_id = None
    if parent_email is not None:
        parent = session.exec(select(User).where(User.email == parent_email, User.role == "parent")).first()
        if not parent:
            raise HTTPException(status_code=400, detail=f"Parent with email '{parent_email}' not found")
        parent_id = parent.id

    class_id = None
    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if not classroom:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        class_id = classroom.id

    dob = None
    if date_of_birth is not None:
        try:
            dob = dt.strptime(date_of_birth, "%d/%m/%Y")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use DD/MM/YYYY")

    with session.bind.connect() as conn:
        updates = []
        params = {"child_id": child_id}
        if name is not None:
            updates.append("name = :name")
            params["name"] = name
        if dob is not None:
            updates.append("date_of_birth = :date_of_birth")
            params["date_of_birth"] = dob
        if class_id is not None:
            updates.append("class_id = :class_id")
            params["class_id"] = class_id
        if parent_id is not None:
            updates.append("parent_id = :parent_id")
            params["parent_id"] = parent_id

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"UPDATE Child SET {', '.join(updates)} WHERE id = :child_id"
        conn.execute(text(query), params)
        conn.commit()

    updated_child = session.exec(select(Child).where(Child.id == child_id)).first()
    background_tasks.add_task(audit, user.id, "update_child", f"child_id={child_id}")
    return updated_child

@router.delete('/children/{child_id}')
def admin_delete_child(
    child_id: int,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    # Kiểm tra child có tồn tại không (dùng ORM để kiểm tra)
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Dùng raw SQL để xóa (tránh lỗi foreign key)
    with session.bind.connect() as conn:
        conn.execute(text("DELETE FROM Child WHERE id = :child_id"), {"child_id": child_id})
        conn.commit()

    return {"msg": "Child deleted"}

# PARENTS CRUD
@router.get('/parents')
def admin_get_parents(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(User).where(User.role == "parent")).all()

@router.post('/parents')
def admin_create_parent(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    full_name: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=400, detail="Email exists")

    hashed_pw = hash_password(password)

    with session.bind.connect() as conn:
        conn.execute(text("""
            INSERT INTO [User] (email, full_name, hashed_password, role, phone, address, emergency_contact, relationship)
            VALUES (:email, :full_name, :hashed_password, :role, :phone, :address, :emergency_contact, :relationship)
        """), {
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_pw,
            "role": "parent",
            "phone": phone,
            "address": address,
            "emergency_contact": emergency_contact,
            "relationship": relationship
        })
        conn.commit()

    parent = session.exec(select(User).where(User.email == email)).first()
    background_tasks.add_task(audit, user.id, "create_parent", details=f"parent_id={parent.id}")
    return parent

@router.put('/parents/{email}')
def admin_update_parent(
    email: str,
    background_tasks: BackgroundTasks,
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    parent = session.exec(select(User).where(User.email == email, User.role == "parent")).first()
    if not parent:
        raise HTTPException(status_code=404, detail='Parent not found')

    with session.bind.connect() as conn:
        updates = []
        params = {"email": email}
        if full_name is not None:
            updates.append("full_name = :full_name")
            params["full_name"] = full_name
        if phone is not None:
            updates.append("phone = :phone")
            params["phone"] = phone
        if relationship is not None:
            updates.append("relationship = :relationship")
            params["relationship"] = relationship
        if emergency_contact is not None:
            updates.append("emergency_contact = :emergency_contact")
            params["emergency_contact"] = emergency_contact
        if address is not None:
            updates.append("address = :address")
            params["address"] = address

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"UPDATE [User] SET {', '.join(updates)} WHERE email = :email AND role = 'parent'"
        conn.execute(text(query), params)
        conn.commit()

    updated_parent = session.exec(select(User).where(User.email == email, User.role == "parent")).first()
    background_tasks.add_task(audit, user.id, "update_parent", details=f"parent_email={email}")
    return updated_parent

@router.delete('/parents/{email}')
def admin_delete_parent(
    email: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)    
):
    parent = session.exec(select(User).where(User.email == email, User.role == "parent")).first()
    if not parent:
        raise HTTPException(status_code=404, detail='Parent not found')
    session.delete(parent)
    session.commit()
    background_tasks.add_task(audit, user.id, "delete_parent", details=f"{email}")
    return {"msg": "Parent deleted"}

# TEACHERS CRUD
@router.get('/teachers')
def admin_get_teachers(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(User).where(User.role == "teacher")).all()

@router.post('/teachers')
def admin_create_teacher(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    full_name: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education_level: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=400, detail="Email exists")

    hashed_pw = hash_password(password)

    # Dùng raw SQL để insert (SQLAlchemy tự xử lý Unicode)
    with session.bind.connect() as conn:
        conn.execute(text("""
            INSERT INTO [User] (email, full_name, hashed_password, role, phone, address, experience, education_level)
            VALUES (:email, :full_name, :hashed_password, :role, :phone, :address, :experience, :education_level)
        """), {
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_pw,
            "role": "teacher",
            "phone": phone,
            "address": address,
            "experience": experience,
            "education_level": education_level
        })
        conn.commit()

    teacher = session.exec(select(User).where(User.email == email, User.role == "teacher")).first()

    if class_name is not None:
        classroom = session.exec(select(ClassRoom).where(ClassRoom.name == class_name)).first()
        if classroom:
            classroom.teacher_id = teacher.id
            session.add(classroom)
            session.commit()

    background_tasks.add_task(audit, user.id, "create_teacher", details=f"teacher_id={teacher.id}")
    return teacher

@router.put('/teachers/{id}')
def admin_update_teacher(
    id: int,
    background_tasks: BackgroundTasks,
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education_level: Optional[str] = Form(None),
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    teacher = session.get(User, id)
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=404, detail='Teacher not found')

    with session.bind.connect() as conn:
        updates = []
        params = {"id": id}
        if full_name is not None:
            updates.append("full_name = :full_name")
            params["full_name"] = full_name
        if phone is not None:
            updates.append("phone = :phone")
            params["phone"] = phone
        if address is not None:
            updates.append("address = :address")
            params["address"] = address
        if experience is not None:
            updates.append("experience = :experience")
            params["experience"] = experience
        if education_level is not None:
            updates.append("education_level = :education_level")
            params["education_level"] = education_level

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"UPDATE [User] SET {', '.join(updates)} WHERE id = :id AND role = 'teacher'"
        conn.execute(text(query), params)
        conn.commit()

    updated_teacher = session.get(User, id)
    background_tasks.add_task(audit, user.id, "update_teacher", details=f"teacher_id={id}")
    return updated_teacher

@router.delete('/teachers/{id}')
def admin_delete_teacher(
    id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    teacher = session.get(User, id)
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=404, detail='Teacher not found')
    session.delete(teacher)
    session.commit()
    background_tasks.add_task(audit, user.id, "delete_teacher", details=f"{id}")
    return {"msg": "Teacher deleted"}

@router.get('/classes')
def admin_get_classes(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    classes = session.exec(select(ClassRoom)).all()
    result = []
    for cls in classes:
        cameras = session.exec(select(Camera).where(Camera.class_id == cls.id)).all()
        active_count = sum(1 for cam in cameras if cam.active)
        total = len(cameras)
        percent = round((active_count / total) * 100, 1) if total > 0 else 0
        result.append({
            "id": cls.id,
            "name": cls.name,
            "camera_status": {
                "active_percent": percent,
                "status": "Hoạt động" if percent > 0 else "Ngừng"
            },
            "total_cameras": total,
            "active_cameras": active_count
        })
    return result

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

# CAMERAS CRUD
@router.get('/cameras')
def admin_get_cameras(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    cameras_with_class = session.exec(
        select(Camera, ClassRoom.name.label("class_name"))
        .join(ClassRoom, Camera.class_id == ClassRoom.id, isouter=True)
    ).all()
    result = []
    for cam, class_name in cameras_with_class:
        result.append({
            "id": cam.id,
            "name": cam.name,
            "class_id": cam.class_id,
            "class_name": class_name,
            "rtsp_url": cam.rtsp_url,
            "active": cam.active
        })
    return result

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

# DANGER ZONES CRUD
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

# REPORTS & ALERTS
@router.get('/reports')
def admin_reports(
    type: Optional[str] = None,
    timeRange: Optional[str] = None,
    user: User = Depends(require_role('admin')),
    session: Session = Depends(get_session)
):
    return {"alerts_count": session.exec(select(Alert)).count()}

@router.get('/alerts-by-class')
def admin_get_alerts_by_class(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    alerts_by_class = session.exec(
        select(
            ClassRoom.name,
            func.count(Alert.id).label("alert_count")
        )
        .join(Child, ClassRoom.id == Child.class_id)
        .join(Alert, Child.id == Alert.child_id)
        .group_by(ClassRoom.name)
        .order_by(func.count(Alert.id).desc())
    ).all()
    return [
        {"class_name": name, "alert_count": count}
        for name, count in alerts_by_class
    ]

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