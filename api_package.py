from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from typing import Optional, List
import json
from datetime import datetime, timedelta
from models import Package, PackageCreate, PackageUpdate, User
from apiSQL import get_session, require_role

router = APIRouter(prefix="/api/packages", tags=["📦 Package Management"])

# --- PACKAGE MANAGEMENT ---
@router.get("/")
def get_packages(session: Session = Depends(get_session)):
    """Lấy danh sách tất cả gói dịch vụ (public)"""
    packages = session.exec(select(Package).where(Package.is_active == True)).all()
    return packages

@router.get("/admin")
def admin_get_packages(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    """Admin lấy tất cả gói dịch vụ (bao gồm inactive)"""
    packages = session.exec(select(Package)).all()
    return packages

@router.post("/")
def create_package(
    name: str = Form(...),
    price: float = Form(...),
    duration_days: int = Form(...),
    camera_limit: int = Form(...),
    ai_features: str = Form(...),  # JSON string
    storage_days: int = Form(...),
    description: Optional[str] = Form(None),
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Tạo gói dịch vụ mới (admin only)"""
    
    # Validate JSON
    try:
        features_list = json.loads(ai_features)
        if not isinstance(features_list, list):
            raise ValueError("ai_features must be a list")
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="ai_features must be a valid JSON array")
    
    package = Package(
        name=name,
        price=price,
        duration_days=duration_days,
        camera_limit=camera_limit,
        ai_features=ai_features,
        storage_days=storage_days,
        description=description
    )
    
    session.add(package)
    session.commit()
    session.refresh(package)
    return package

@router.put("/{package_id}")
def update_package(
    package_id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    duration_days: Optional[int] = Form(None),
    camera_limit: Optional[int] = Form(None),
    ai_features: Optional[str] = Form(None),
    storage_days: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Cập nhật gói dịch vụ (admin only)"""
    
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if name is not None:
        package.name = name
    if price is not None:
        package.price = price
    if duration_days is not None:
        package.duration_days = duration_days
    if camera_limit is not None:
        package.camera_limit = camera_limit
    if ai_features is not None:
        # Validate JSON
        try:
            features_list = json.loads(ai_features)
            if not isinstance(features_list, list):
                raise ValueError("ai_features must be a list")
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=400, detail="ai_features must be a valid JSON array")
        package.ai_features = ai_features
    if storage_days is not None:
        package.storage_days = storage_days
    if description is not None:
        package.description = description
    if is_active is not None:
        package.is_active = is_active
    
    session.add(package)
    session.commit()
    session.refresh(package)
    return package

@router.delete("/{package_id}")
def delete_package(
    package_id: int,
    user: User = Depends(require_role("admin")),
    session: Session = Depends(get_session)
):
    """Xóa gói dịch vụ (admin only)"""
    
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Check if package is being used
    from models import User
    users_with_package = session.exec(select(User).where(User.active_package_id == package_id)).all()
    if users_with_package:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete package. {len(users_with_package)} users are currently using this package"
        )
    
    session.delete(package)
    session.commit()
    return {"msg": "Package deleted successfully"}

@router.get("/{package_id}")
def get_package(package_id: int, session: Session = Depends(get_session)):
    """Lấy thông tin chi tiết gói dịch vụ"""
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package
