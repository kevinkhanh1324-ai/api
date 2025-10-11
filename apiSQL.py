import urllib.parse
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import asyncio
from fastapi import (
    BackgroundTasks, Depends, FastAPI, HTTPException, status,
    WebSocket, WebSocketDisconnect, UploadFile, File, Form
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import jwt
from jwt import DecodeError as JWTError
from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy import text
from models import (
    RegisterIn, User, Child, ClassRoom, Camera, DangerZone, Alert,
    BehaviorLog, FaceRecognitionData, AuditLog, Token, AuthIn, ResetPasswordIn,
    TokenWithRole
)

# CONFIGURATION
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

security = HTTPBearer()
SECRET_KEY = os.getenv("SAFENEST_SECRET", "dev-secret-changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=apidb;"
    "Trusted_Connection=yes;"
    "charset=utf8;"
)
DB_URL = f"mssql+pyodbc:///?odbc_connect={params}"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="SafeNest AI - Demo API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine(DB_URL, echo=False)

# DATABASE INIT
def init_db():
    """Chỉ thêm dữ liệu mẫu nếu chưa có"""
    with engine.connect() as conn:
        # User
        result = conn.execute(text("SELECT COUNT(*) FROM [User]"))
        if result.scalar() == 0:
            admin_pw = hash_password('admin123')
            parent_pw = hash_password('parent123')
            teacher_pw = hash_password('teacher123')
            conn.execute(text("""
                INSERT INTO [User] (email, full_name, hashed_password, role, phone, address, emergency_contact, experience, relationship, education_level)
                VALUES 
                ('admin@example.com', N'Admin User', :admin_pw, 'admin', '+8400000000', N'1 Admin St, City', NULL, NULL, NULL, NULL),
                ('parent@example.com', N'Nguyễn Văn A', :parent_pw, 'parent', '+84123456789', N'123 Lê Lợi, Q1, HCM', N'Nguyễn Thị B - 0909123456', NULL, N'Bố', NULL),
                ('teacher@example.com', N'Teacher Admin', :teacher_pw, 'teacher', '+84987654321', N'456 Trần Hưng Đạo, Q1, HCM', NULL, N'5 năm kinh nghiệm', NULL, N'Tốt nghiệp Đại học Sư phạm')
            """), {
                "admin_pw": admin_pw,
                "parent_pw": parent_pw,
                "teacher_pw": teacher_pw
            })
            conn.commit()
        # ClassRoom
        result = conn.execute(text("SELECT COUNT(*) FROM ClassRoom"))
        if result.scalar() == 0:
            conn.execute(text("""
                INSERT INTO ClassRoom (name, teacher_id)
                SELECT 'Class A', id FROM [User] WHERE email = 'teacher@example.com'
            """))
            conn.commit()
        # Child
        result = conn.execute(text("SELECT COUNT(*) FROM Child"))
        if result.scalar() == 0:
            conn.execute(text("""
                INSERT INTO Child (name, date_of_birth, class_id, parent_id)
                SELECT N'Alice', '2013-05-26', cr.id, u.id
                FROM ClassRoom cr, [User] u
                WHERE cr.name = 'Class A' AND u.email = 'parent@example.com'
            """))
            conn.commit()

@app.on_event("startup")
def on_startup():
    init_db()

# UTILITIES
def get_session():
    with Session(engine) as session:
        yield session

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def audit(user_id: Optional[int], action: str, details: Optional[str] = None):
    try:
        with Session(engine) as s:
            s.add(AuditLog(user_id=user_id, action=action, details=details))
            s.commit()
    except Exception as e:
        print("Audit log failed:", e)

# AUTHENTICATION DEPENDENCIES
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(required_role: str):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return role_checker

# AUTH ENDPOINTS
@app.post('/api/auth/register')
def register(payload: RegisterIn, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.fullName,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    background_tasks.add_task(audit, user.id, "register", f"role={user.role}")
    return {"msg": "registered", "user_id": user.id}

@app.post('/api/auth/login', response_model=TokenWithRole)
def login(payload: AuthIn, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    
    token = create_access_token({"user_id": user.id, "role": user.role})
    background_tasks.add_task(audit, user.id, "login")
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }

@app.post('/api/auth/forgot-password')
def forgot_password(background_tasks: BackgroundTasks, email: str = Form(...), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return {"msg": "If the email exists, a reset link was sent"}
    reset_token = create_access_token({"user_id": user.id, "pw": True}, expires_delta=timedelta(minutes=15))
    background_tasks.add_task(audit, user.id, "forgot_password")
    return {"reset_token": reset_token}

@app.put('/api/auth/reset-password')
def reset_password(payload: ResetPasswordIn, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    try:
        payload_decoded = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid token')
    if not payload_decoded.get('pw'):
        raise HTTPException(status_code=400, detail='Invalid reset token')
    user_id = payload_decoded.get('user_id')
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user.hashed_password = hash_password(payload.newPassword)
    session.add(user)
    session.commit()
    background_tasks.add_task(audit, user.id, "reset_password")
    return {"msg": "Password updated"}

# WEBSOCKETS
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for conn in list(self.active_connections):
            try:
                await conn.send_text(message)
            except Exception:
                pass

camera_manager = ConnectionManager()
alerts_manager = ConnectionManager()

@app.websocket('/api/streaming/alerts')
async def ws_alerts(ws: WebSocket):
    await alerts_manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(f"pong: {data}")
    except WebSocketDisconnect:
        alerts_manager.disconnect(ws)

@app.websocket('/api/streaming/camera/{camera_id}')
async def ws_camera(ws: WebSocket, camera_id: int):
    await camera_manager.connect(ws)
    try:
        while True:
            await asyncio.sleep(1)
            await ws.send_text(f"camera:{camera_id} ts={datetime.utcnow().isoformat()}")
    except WebSocketDisconnect:
        camera_manager.disconnect(ws)

# AI ENDPOINTS
@app.post('/api/ai/face-recognition')
def ai_face_recognition(
    child_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    out_dir = "face_data"
    os.makedirs(out_dir, exist_ok=True)
    fname = f"{uuid.uuid4().hex}_{file.filename}"
    fpath = os.path.join(out_dir, fname)
    with open(fpath, 'wb') as f:
        f.write(file.file.read())
    fr = FaceRecognitionData(child_id=child_id, encoding_path=fpath)
    session.add(fr)
    session.commit()
    session.refresh(fr)
    asyncio.create_task(audit(user.id if user else None, "upload_face", details=f"{fr.id}"))
    return {"id": fr.id, "path": fpath}

@app.post('/api/ai/analyze-behavior')
def ai_analyze_behavior(video_file: UploadFile = File(...), user: User = Depends(get_current_user)):
    return {"events": [{"type": "running", "confidence": 0.8}], "note": "placeholder"}

@app.post('/api/ai/danger-detection')
def ai_danger_detection(stream_id: Optional[int] = Form(None), user: User = Depends(get_current_user)):
    return {"danger": False, "note": "not implemented"}

# MISC
@app.get('/')
def index():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# ROUTERS
from api_parent import router as parent_router
from api_admin import router as admin_router
from api_teacher import router as teacher_router

app.include_router(parent_router)
app.include_router(admin_router)
app.include_router(teacher_router)