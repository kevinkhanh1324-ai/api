from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from sqlalchemy import Unicode

# ---------- USER & AUTHENTICATION ----------
class User(SQLModel, table=True):
    __tablename__ = "User"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, sa_type=Unicode(255))
    full_name: str = Field(sa_type=Unicode(255))
    hashed_password: str = Field(sa_type=Unicode(255))
    role: str = Field(sa_type=Unicode(50))
    phone: Optional[str] = Field(default=None, sa_type=Unicode(20))
    address: Optional[str] = Field(default=None, sa_type=Unicode(500))
    emergency_contact: Optional[str] = Field(default=None, sa_type=Unicode(255))
    relationship: Optional[str] = Field(default=None, sa_type=Unicode(50))
    # Payment & Package fields
    active_package_id: Optional[int] = Field(default=None, foreign_key="Package.id")
    package_expiry_date: Optional[datetime] = Field(default=None)
    is_active_package: bool = Field(default=False)

# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenWithRole(BaseModel):
    access_token: str
    token_type: str
    role: str

class AuthIn(BaseModel):
    email: str
    password: str

class RegisterIn(BaseModel):
    email: str
    fullName: str
    password: str
    role: str  # "admin", "parent", "school"

class ResetPasswordIn(BaseModel):
    token: str
    newPassword: str

class ParentCreate(BaseModel):
    email: str
    full_name: str
    password: str
    phone: Optional[str] = None
    relationship: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    child_name: str
    child_date_of_birth: str  # "YYYY-MM-DD"
    child_class_id: int

# ---------- TEACHER ----------
class Teacher(SQLModel, table=True):
    __tablename__ = "Teacher"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, sa_type=Unicode(255))
    full_name: str = Field(sa_type=Unicode(255))
    hashed_password: str = Field(sa_type=Unicode(255))
    phone: Optional[str] = Field(default=None, sa_type=Unicode(20))
    address: Optional[str] = Field(default=None, sa_type=Unicode(500))
    emergency_contact: Optional[str] = Field(default=None, sa_type=Unicode(255))
    experience: Optional[str] = Field(default=None, sa_type=Unicode)
    education_level: Optional[str] = Field(default=None, sa_type=Unicode(255))
    school_id: Optional[int] = Field(default=None, foreign_key="User.id")

# ---------- PACKAGE & PAYMENT ----------
class Package(SQLModel, table=True):
    __tablename__ = "Package"
    __table_args__ = {'extend_existing': True}
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_type=Unicode(255))
    price: float = Field()
    duration_days: int = Field()
    camera_limit: int = Field()
    ai_features: str = Field(sa_type=Unicode(1000))  # JSON string
    storage_days: int = Field()
    description: Optional[str] = Field(default=None, sa_type=Unicode(1000))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(SQLModel, table=True):
    __tablename__ = "Payment"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="User.id")
    package_id: int = Field(foreign_key="Package.id")
    amount: float = Field()
    method: str = Field(sa_type=Unicode(50))  # "PayPOS", "Manual"
    status: str = Field(sa_type=Unicode(50))  # "Pending", "Success", "Failed"
    transaction_id: Optional[str] = Field(default=None, unique=True, sa_type=Unicode(255))
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = Field(default=None)

# Pydantic models for API
class PackageCreate(BaseModel):
    name: str
    price: float
    duration_days: int
    camera_limit: int
    ai_features: List[str]
    storage_days: int
    description: Optional[str] = None

class PackageUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    duration_days: Optional[int] = None
    camera_limit: Optional[int] = None
    ai_features: Optional[List[str]] = None
    storage_days: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PaymentCreate(BaseModel):
    package_id: int
    method: str  # "ZaloPay", "Momo", "VNPay", "Manual"

class PaymentUpdate(BaseModel):
    status: str  # "Success", "Failed"
    transaction_id: Optional[str] = None

# ---------- CLASSROOM & CHILDREN ----------
class ClassRoom(SQLModel, table=True):
    __tablename__ = "ClassRoom"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_type=Unicode(255))
    teacher_id: Optional[int] = Field(default=None, foreign_key="Teacher.id")
    school_id: Optional[int] = Field(default=None, foreign_key="User.id")

class Child(SQLModel, table=True):
    __tablename__ = "Child"
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(sa_type=Unicode(255)) 
    date_of_birth: Optional[datetime] = Field(default=None)
    class_id: Optional[int] = Field(default=None, foreign_key="ClassRoom.id")
    parent_id: Optional[int] = Field(default=None, foreign_key="User.id")

# ---------- CAMERAS & DANGER ZONES ----------
class Camera(SQLModel, table=True):
    __tablename__ = "Camera"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_type=Unicode(255))
    class_id: Optional[int] = Field(default=None, foreign_key="ClassRoom.id")
    rtsp_url: Optional[str] = Field(default=None, sa_type=Unicode(500))
    active: bool = True

class DangerZone(SQLModel, table=True):
    __tablename__ = "DangerZone"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_type=Unicode(255))
    coords_json: str = Field(sa_type=Unicode)  # JSON string: "[[x1,y1],[x2,y2],...]"
    severity: int = 1

# ---------- ALERTS & LOGS ----------
class Alert(SQLModel, table=True):
    __tablename__ = "Alert"
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="Child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="Camera.id")
    danger_zone_id: Optional[int] = Field(default=None, foreign_key="DangerZone.id")
    alert_type: str = Field(sa_type=Unicode(100))
    severity: int = 1
    acknowledged: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BehaviorLog(SQLModel, table=True):
    __tablename__ = "BehaviorLog"
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="Child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="Camera.id")
    behavior_type: str = Field(sa_type=Unicode(100))
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FaceRecognitionData(SQLModel, table=True):
    __tablename__ = "FaceRecognitionData"
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: Optional[int] = Field(default=None, foreign_key="Child.id")
    encoding_path: str = Field(sa_type=Unicode(500))

class AuditLog(SQLModel, table=True):
    __tablename__ = "AuditLog"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="User.id")
    action: str = Field(sa_type=Unicode(100))
    details: Optional[str] = Field(default=None, sa_type=Unicode(500))
    created_at: datetime = Field(default_factory=datetime.utcnow)
