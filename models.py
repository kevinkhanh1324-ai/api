from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel

# ---------- User & Auth ----------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str  # "admin", "school", "parent"

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
    role: str  # "admin", "school", "parent"

class ResetPasswordIn(BaseModel):
    token: str
    newPassword: str

# ---------- School & Children ----------
class ClassRoom(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

class Child(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    class_id: Optional[int] = Field(default=None, foreign_key="classroom.id")
    parent_id: Optional[int] = Field(default=None, foreign_key="user.id")

# ---------- Cameras & Danger Zones ----------
class Camera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    class_id: Optional[int] = Field(default=None, foreign_key="classroom.id")
    rtsp_url: Optional[str] = None
    active: bool = True

class DangerZone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    coords_json: str  # lưu dưới dạng JSON string, ví dụ: "[[x1,y1],[x2,y2],...]"
    severity: int = 1  # 1: low, 2: medium, 3: high

# ---------- Alerts & Logs ----------
class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="camera.id")
    danger_zone_id: Optional[int] = Field(default=None, foreign_key="dangerzone.id")
    alert_type: str  # "intrusion", "fall", "running", v.v.
    severity: int = 1
    acknowledged: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BehaviorLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int = Field(foreign_key="child.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="camera.id")
    behavior_type: str  # "sitting", "standing", "running", ...
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FaceRecognitionData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: Optional[int] = Field(default=None, foreign_key="child.id")
    encoding_path: str  # đường dẫn file lưu face encoding

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str  # "login", "register", "delete_account", ...
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)