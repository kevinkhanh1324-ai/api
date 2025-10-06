import urllib.parse
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from functools import wraps, lru_cache
import io, os, uuid, asyncio
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine, Session, select
from passlib.context import CryptContext
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import DecodeError as JWTError
from models import (
    RegisterIn, User, Child, ClassRoom, Camera, DangerZone, Alert,
    BehaviorLog, FaceRecognitionData, AuditLog, Token, AuthIn, ResetPasswordIn,
    TokenWithRole
)

# ---------- Configuration ----------
security = HTTPBearer()
SECRET_KEY = os.getenv("SAFENEST_SECRET", "dev-secret-changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
# DB_URL = "mssql+pyodbc://@localhost/api_db?driver=ODBC+Driver+17+for+SQL+Server;Trusted_Connection=yes"
params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=apidb;"
    "Trusted_Connection=yes;"
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

# ---------- DB Init ----------
def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        if session.exec(select(User)).first() is None:
            # Tạo user
            test_users = {
                "admin": User(email='admin@example.com', full_name='Admin', hashed_password=hash_password('admin123'), role='admin'),
                "parent": User(email='parent@example.com', full_name='Parent', hashed_password=hash_password('parent123'), role='parent'),
                "school": User(email='school@example.com', full_name='School', hashed_password=hash_password('school123'), role='school'),
            }
            for user in test_users.values():
                session.add(user)
            session.commit()

            # Refresh để lấy ID
            for user in test_users.values():
                session.refresh(user)

            # Tạo lớp học
            classroom = ClassRoom(name='Class A')
            session.add(classroom)
            session.commit()
            session.refresh(classroom)

            # Tạo child Alice (gắn với parent)
            alice = Child(name='Alice', class_id=classroom.id, parent_id=test_users["parent"].id)
            session.add(alice)
            session.commit()

@app.on_event("startup")
def on_startup():
    init_db()

# ---------- Utilities ----------
def get_session():
    with Session(engine) as session:
        yield session

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
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

# ---------- Auth Dependencies ----------
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

# ---------- Auth Endpoints ----------
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

@app.post('/api/auth/login', response_model= TokenWithRole)
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

# ---------- WebSocket ----------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections: self.active_connections.remove(websocket)
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

# ---------- AI Endpoints ----------
@app.post('/api/ai/face-recognition')
def ai_face_recognition(child_id: Optional[int] = Form(None), file: UploadFile = File(...), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    out_dir = "face_data"
    os.makedirs(out_dir, exist_ok=True)
    fname = f"{uuid.uuid4().hex}_{file.filename}"
    fpath = os.path.join(out_dir, fname)
    with open(fpath, 'wb') as f: f.write(file.file.read())
    fr = FaceRecognitionData(child_id=child_id, encoding_path=fpath)
    session.add(fr); session.commit(); session.refresh(fr)
    asyncio.create_task(audit(user.id if user else None, "upload_face", details=f"{fr.id}"))
    return {"id": fr.id, "path": fpath}

@app.post('/api/ai/analyze-behavior')
def ai_analyze_behavior(video_file: UploadFile = File(...), user: User = Depends(get_current_user)):
    return {"events": [{"type":"running", "confidence": 0.8}], "note": "placeholder"}

@app.post('/api/ai/danger-detection')
def ai_danger_detection(stream_id: Optional[int] = Form(None), user: User = Depends(get_current_user)):
    return {"danger": False, "note": "not implemented"}

# ---------- Misc ----------
@app.get('/')
def index():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# ---------- IMPORT ROUTERS ----------
from api_parent import router as parent_router
from api_admin import router as admin_router
from api_school import router as school_router

app.include_router(parent_router)
app.include_router(admin_router)
app.include_router(school_router)