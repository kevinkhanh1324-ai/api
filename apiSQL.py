import urllib.parse
import os
import sys
import uuid
import asyncio
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import (
    BackgroundTasks, Depends, FastAPI, HTTPException, Request,
    WebSocket, WebSocketDisconnect, UploadFile, File, Form, Body
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from passlib.context import CryptContext
import jwt
from jwt import DecodeError as JWTError
from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy import text
from models import (
    User, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn,
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog, Package, Payment
)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")  # Load .env.local first
    load_dotenv()  # Then load .env as fallback
except ImportError:
    pass

# 🔹 Cấu hình
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

security = HTTPBearer()
SECRET_KEY = os.getenv("SAFENEST_SECRET", "dev-secret-changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Database configuration - MySQL Railway
# Use MYSQL_PUBLIC_URL from Railway environment
# Format: mysql://root:PASSWORD@HOST:PORT/DATABASE

MYSQL_PUBLIC_URL = os.getenv("MYSQL_PUBLIC_URL")

if not MYSQL_PUBLIC_URL:
    # Fallback: build from individual env vars
    DB_HOST = os.getenv("MYSQLHOST", "localhost")
    DB_USER = os.getenv("MYSQLUSER", "root")
    DB_PASSWORD = os.getenv("MYSQLPASSWORD", "")
    DB_NAME = os.getenv("MYSQLDATABASE", "railway")
    DB_PORT = os.getenv("MYSQLPORT", "3306")
    MYSQL_PUBLIC_URL = f"mysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Convert to SQLAlchemy format
DB_URL = MYSQL_PUBLIC_URL.replace("mysql://", "mysql+pymysql://")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
app = FastAPI(title="SafeNest AI - Demo API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tạo engine cho MySQL
engine = create_engine(DB_URL, echo=False, pool_pre_ping=True)

# 🔹 Tiện ích
def get_session():
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        print(f"Database session error: {e}")
        # Không yield None, để endpoint tự xử lý lỗi
        raise

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def audit(user_id: Optional[int], action: str, details: Optional[str] = None):
    try:
        with Session(engine) as s:
            s.add(AuditLog(user_id=user_id, action=action, details=details))
            s.commit()
    except Exception as e:
        print("Audit log failed:", e)

# 🔹 Xác thực
def get_current_user(
    cred: HTTPBearer = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_current_user_optional(
    request: Request,
    session: Session = Depends(get_session),
) -> User | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
    except JWTError:
        return None
    return session.get(User, user_id)

def require_role(role: str):
    def checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return checker

# 🔹 Khởi tạo DB
def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # Create users
        if not session.exec(select(User)).first():
            admin = User(
                email='admin@example.com',
                full_name='Admin User',
                hashed_password=hash_password('admin123'),
                role='admin',
                phone='+8400000000',
                address='1 Admin St, City'
            )
            parent = User(
                email='parent@example.com',
                full_name='Nguyễn Văn A',
                hashed_password=hash_password('parent123'),
                role='parent',
                phone='+84123456789',
                address='123 Lê Lợi, Q1, HCM',
                emergency_contact='Nguyễn Thị B - 0909123456',
                relationship='Bố'
            )
            school = User(
                email='school@example.com',
                full_name='School Admin',
                hashed_password=hash_password('school123'),
                role='school',
                phone='+84987654321',
                address='456 Trần Hưng Đạo, Q1, HCM'
            )
            session.add(admin)
            session.add(parent)
            session.add(school)
            session.commit()
            session.refresh(admin)
            session.refresh(parent)
            session.refresh(school)
        else:
            admin = session.exec(select(User).where(User.email == 'admin@example.com')).first()
            parent = session.exec(select(User).where(User.email == 'parent@example.com')).first()
            school = session.exec(select(User).where(User.email == 'school@example.com')).first()

        # Create teacher
        if not session.exec(select(Teacher)).first():
            teacher = Teacher(
                email='teacher@example.com',
                full_name='Trần Thị C',
                hashed_password=hash_password('teacher123'),
                phone='+840912345678',
                address='789 Phạm Ngũ Lão, Q1, HCM',
                emergency_contact='Lê Văn D - 0909988776',
                experience='5 năm',
                education_level='Cao đẳng Sư phạm',
                school_id=school.id if school else None
            )
            session.add(teacher)
            session.commit()
            session.refresh(teacher)
        else:
            teacher = session.exec(select(Teacher)).first()

        # Create classroom
        if not session.exec(select(ClassRoom)).first() and teacher:
            classroom = ClassRoom(
                name='Class A',
                teacher_id=teacher.id,
                school_id=school.id if school else None
            )
            session.add(classroom)
            session.commit()
            session.refresh(classroom)
        else:
            classroom = session.exec(select(ClassRoom)).first()

        # Create child
        if not session.exec(select(Child)).first() and classroom and parent:
            from datetime import datetime as dt
            child = Child(
                full_name='Nguyễn Văn B',
                date_of_birth=dt.strptime('2013-05-26', '%Y-%m-%d').date(),
                class_id=classroom.id,
                parent_id=parent.id
            )
            session.add(child)
            session.commit()
            session.refresh(child)

        # Create package
        if not session.exec(select(Package)).first():
            package = Package(
                name='Gói Dịch Vụ Trẻ Em',
                price=3000,
                duration_days=30,
                camera_limit=1,
                ai_features='["Phát hiện bạo lực", "Nhận diện khuôn mặt", "Theo dõi an toàn"]',
                storage_days=7,
                description='Gói dịch vụ chuyên biệt cho trẻ em với tính năng AI tiên tiến',
                is_active=True,
                created_at=datetime.utcnow()
            )
            session.add(package)
            session.commit()
            session.refresh(package)
        else:
            package = session.exec(select(Package)).first()

        # Create payment
        if not session.exec(select(Payment)).first() and package and parent:
            payment = Payment(
                user_id=parent.id,
                package_id=package.id,
                amount=package.price,
                method='PayPOS',
                status='Success',
                transaction_id=f'PAYPOS_{parent.id}_{package.id}_001',
                transaction_date=datetime.utcnow(),
                expiry_date=datetime.utcnow() + timedelta(days=20)
            )
            session.add(payment)
            session.commit()

        # Create camera
        if not session.exec(select(Camera)).first():
            camera = Camera(
                name='Default Camera',
                rtsp_url=None,
                active=True
            )
            session.add(camera)
            session.commit()

@app.on_event("startup")
def on_startup():
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Warning: Database initialization failed: {e}")
        print("⚠️ Running without database. Some endpoints may not work.")
        print("⚠️ To connect to SQL Server:")
        print("   1. Start SQL Server (or use Azure SQL)")
        print("   2. For Render production: set environment variable USE_PYMSSQL=true")

# 🔹 Endpoints xác thực
@app.post('/api/auth/register')
def register(payload: RegisterIn, bg: BackgroundTasks, session: Session = Depends(get_session)):
    try:
        if session.exec(select(User).where(User.email == payload.email)).first():
            raise HTTPException(400, "Email already registered")
        user = User(email=payload.email, full_name=payload.fullName,
                    hashed_password=hash_password(payload.password), role=payload.role)
        session.add(user)
        session.commit()
        session.refresh(user)
        bg.add_task(audit, user.id, "register", f"role={user.role}")
        return {"msg": "registered", "user_id": user.id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(503, "Database unavailable")

@app.post('/api/auth/login', response_model=TokenWithRole)
def login(payload: AuthIn, bg: BackgroundTasks, session: Session = Depends(get_session)):
    try:
        user = session.exec(select(User).where(User.email == payload.email)).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(401, 'Invalid email or password')
        token = create_access_token({"user_id": user.id, "role": user.role})
        bg.add_task(audit, user.id, "login")
        return {"access_token": token, "token_type": "bearer", "role": user.role}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(503, "Database unavailable")

@app.post('/api/auth/forgot-password')
def forgot_password(bg: BackgroundTasks, email: str = Form(...), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        token = create_access_token({"user_id": user.id, "pw": True}, timedelta(minutes=15))
        bg.add_task(audit, user.id, "forgot_password")
        return {"reset_token": token}
    return {"msg": "If the email exists, a reset link was sent"}

@app.put('/api/auth/reset-password')
def reset_password(payload: ResetPasswordIn, bg: BackgroundTasks, session: Session = Depends(get_session)):
    try:
        decoded = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if not decoded.get('pw'):
            raise HTTPException(400, 'Invalid reset token')
        user = session.get(User, decoded['user_id'])
        if not user:
            raise HTTPException(404, 'User not found')
        user.hashed_password = hash_password(payload.newPassword)
        session.add(user)
        session.commit()
        bg.add_task(audit, user.id, "reset_password")
        return {"msg": "Password updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(503, "Database unavailable")

# 🔹 WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)
    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)
    async def broadcast(self, msg: str):
        for conn in list(self.active_connections):
            try: await conn.send_text(msg)
            except: pass

alerts_manager = ConnectionManager()
camera_manager = ConnectionManager()

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

# 🔹 AI Endpoints
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
    audit(user.id, "upload_face", f"{fr.id}")
    return {"id": fr.id, "path": fpath}

@app.post('/api/ai/analyze-behavior')
def ai_analyze_behavior(video_file: UploadFile = File(...), user: User = Depends(get_current_user)):
    return {"events": [{"type": "running", "confidence": 0.8}], "note": "placeholder"}

@app.post('/api/ai/danger-detection')
def ai_danger_detection(stream_id: Optional[int] = Form(None), user: User = Depends(get_current_user)):
    return {"danger": False, "note": "not implemented"}

class AlertCreateRequest(BaseModel):
    child_id: int
    camera_id: Optional[int] = None
    alert_type: str = "violence"
    severity: int = 2

# 🔹 Internal AI Alert Endpoint
@app.post("/internal/alert/create")
def create_alert_from_ai(
    child_id: int = Body(...),
    camera_id: Optional[int] = Body(None),  # ← Cho phép None
    alert_type: str = Body("violence"),
    severity: int = Body(2),
    session: Session = Depends(get_session)
):
    # Kiểm tra child_id có tồn tại không
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(400, "Child not found")

    # Kiểm tra camera_id (nếu có)
    if camera_id is not None:
        camera = session.get(Camera, camera_id)
        if not camera:
            raise HTTPException(400, f"Camera ID {camera_id} not found")

    alert = Alert(
        child_id=child_id,
        camera_id=camera_id,  # ← Có thể là None
        danger_zone_id=None,
        alert_type=alert_type,
        severity=severity,
        acknowledged=False,
        created_at=datetime.utcnow()
    )
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return {"alert_id": alert.id, "status": "created"}

# 🔹 Cơ bản
@app.get('/')
def index():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# 🔹 Router
from api_parent import router as parent_router
from api_admin import router as admin_router
from api_school import router as school_router
from api_package_service import router as package_service_router
from api_package import router as package_router
from api_payment import router as payment_router
from api_payment_paypos import router as payment_paypos_router

app.include_router(parent_router)
app.include_router(admin_router)
app.include_router(school_router)
app.include_router(package_service_router)
app.include_router(package_router)
app.include_router(payment_router)
app.include_router(payment_paypos_router)