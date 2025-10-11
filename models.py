from __future__ import annotations
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from pydantic import BaseModel

# USER & AUTHENTICATION
class User(SQLModel, table=True):
    __tablename__ = "User"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str  # "admin", "teacher", "parent"
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    experience: Optional[str] = None
    education_level: Optional[str] = None
    relationship: Optional[str] = None  # "Mẹ", "Bố"

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
    role: str

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
    child_date_of_birth: str
    child_class_id: int

class TeacherCreate(BaseModel):
    email: str
    full_name: str
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    experience: Optional[str] = None
    education_level: Optional[str] = None
    class_id: Optional[int] = None

# CLASSROOM & CHILDREN
class ClassRoom(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    teacher_id: Optional[int] = Field(default=None, foreign_key="User.id")

class Child(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    date_of_birth: Optional[datetime] = Field(default=None)
    class_id: Optional[int] = Field(default=None, foreign_key="ClassRoom.id")
    parent_id: Optional[int] = Field(default=None, foreign_key="User.id")

# CAMERAS & DANGER ZONES
class Camera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    class_id: Optional[int] = Field(default=None, foreign_key="ClassRoom.id")
    rtsp_url: Optional[str] = None
    active: bool = True

class DangerZone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    coords_json: str  # JSON string: "[[x1,y1],[x2,y2],...]"
    severity: int = 1  # 1: low, 2: medium, 3: high

# ALERTS & SYSTEM LOGS
class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="Child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="Camera.id")
    danger_zone_id: Optional[int] = Field(default=None, foreign_key="DangerZone.id")
    alert_type: str  # "intrusion", "fall", "running", etc.
    severity: int = 1
    acknowledged: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BehaviorLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="Child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="Camera.id")
    behavior_type: str  # "sitting", "standing", "running", etc.
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FaceRecognitionData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: Optional[int] = Field(default=None, foreign_key="Child.id")
    encoding_path: str  # Đường dẫn file face encoding

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="User.id")
    action: str  # "login", "register", "delete_account", etc.
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)