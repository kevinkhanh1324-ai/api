import urllib.parse
import os
import sys
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Optional, List  # ← THÊM List ở đây
from fastapi import (
    BackgroundTasks, Depends, FastAPI, HTTPException, Request,
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
    User, TokenWithRole, AuthIn, RegisterIn, ResetPasswordIn,
    ParentCreate, Teacher, ClassRoom, Child, Camera, DangerZone,
    Alert, BehaviorLog, FaceRecognitionData, AuditLog
)

# 🔹 CẤU HÌNH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

security = HTTPBearer()
SECRET_KEY = os.getenv("SAFENEST_SECRET", "dev-secret-changeme")
print(f"Using SECRET_KEY: {SECRET_KEY}")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# Sử dụng tài khoản sa, mật khẩu, instance SQLEXPRESS
# Thay YOUR_PASSWORD bằng mật khẩu thực tế
DB_URL = (
    "mssql+pyodbc://sa:12345@localhost\\SQLEXPRESS/apidb"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&TrustServerCertificate=yes"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="SafeNest AI - Demo API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine(DB_URL, echo=False, pool_pre_ping=True)

# 🔹 KHỞI TẠO DB
def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # User mẫu
        if not session.exec(select(User)).first():
            pw_admin = hash_password('admin123')
            pw_parent = hash_password('parent123')
            pw_school = hash_password('school123')
            session.execute(text("""
                INSERT INTO [User] (email, full_name, hashed_password, role, phone, address, emergency_contact, relationship)
                VALUES 
                ('admin@example.com', N'Admin User', :pw_admin, 'admin', '+8400000000', N'1 Admin St, City', NULL, NULL),
                ('parent@example.com', N'Nguyễn Văn A', :pw_parent, 'parent', '+84123456789', N'123 Lê Lợi, Q1, HCM', N'Nguyễn Thị B - 0909123456', N'Bố'),
                ('school@example.com', N'School Admin', :pw_school, 'school', '+84987654321', N'456 Trần Hưng Đạo, Q1, HCM', NULL, NULL)
            """), {"pw_admin": pw_admin, "pw_parent": pw_parent, "pw_school": pw_school})
            session.commit()

        # Teacher mẫu
        if not session.exec(select(Teacher)).first():
            pw_teacher = hash_password('teacher123')
            session.execute(text("""
                INSERT INTO Teacher (email, full_name, hashed_password, phone, address, emergency_contact, experience, education_level, school_id)
                VALUES ('teacher@example.com', N'Trần Thị C', :pw_teacher, '+840912345678', N'789 Phạm Ngũ Lão, Q1, HCM', N'Lê Văn D - 0909988776', N'5 năm', N'Cao đẳng Sư phạm', (SELECT id FROM [User] WHERE email = 'school@example.com'))
            """), {"pw_teacher": pw_teacher})
            session.commit()

        # ClassRoom mẫu
        if not session.exec(select(ClassRoom)).first():
            session.execute(text("""
                INSERT INTO ClassRoom (name, teacher_id, school_id)
                SELECT 'Class A', t.id, u.id
                FROM Teacher t, [User] u
                WHERE t.email = 'teacher@example.com' AND u.email = 'school@example.com'
            """))
            session.commit()

        # Child mẫu
        if not session.exec(select(Child)).first():
            session.execute(text("""
                INSERT INTO Child (full_name, date_of_birth, class_id, parent_id)
                SELECT N'Nguyễn Văn B', '2013-05-26', cr.id, u.id
                FROM ClassRoom cr, [User] u
                WHERE cr.name = 'Class A' AND u.email = 'parent@example.com'
            """))
            session.commit()

        # Package mẫu (giống máy dev chính)
        if not session.exec(select(Package)).first():
            session.execute(text("""
                INSERT INTO [Package] (name, price, duration_days, camera_limit, ai_features, storage_days, description, is_active, created_at) VALUES
                (N'Gói Dịch Vụ Trẻ Em', 3000, 30, 1, N'["Phát hiện bạo lực", "Nhận diện khuôn mặt", "Theo dõi an toàn"]', 7, N'Gói dịch vụ chuyên biệt cho trẻ em với tính năng AI tiên tiến', 1, '2025-10-15 10:45:12.117'),
                """))
            session.commit()

        # Payment mẫu (giống máy dev chính)
        if not session.exec(select(Payment)).first():
            session.execute(text("""
                INSERT INTO [Payment] (user_id, package_id, amount, method, status, transaction_id, transaction_date, expiry_date)
                SELECT 
                    u.id as user_id,
                    p.id as package_id,
                    p.price as amount,
                    N'PayPOS' as method,
                    N'Success' as status,
                    N'PAYPOS_' + CAST(u.id AS VARCHAR) + '_' + CAST(p.id AS VARCHAR) + '_001' as transaction_id,
                    DATEADD(day, -10, GETDATE()) as transaction_date,
                    DATEADD(day, 20, GETDATE()) as expiry_date
                FROM [User] u, [Package] p
                WHERE u.email = 'parent@example.com' AND p.name = N'Gói Dịch Vụ Trẻ Em'
                
                UNION ALL
                
                SELECT 
                    u.id as user_id,
                    p.id as package_id,
                    p.price as amount,
                    N'PayPOS' as method,
                    N'Success' as status,
                    N'PAYPOS_' + CAST(u.id AS VARCHAR) + '_' + CAST(p.id AS VARCHAR) + '_002' as transaction_id,
                    DATEADD(day, -5, GETDATE()) as transaction_date,
                    DATEADD(day, 15, GETDATE()) as expiry_date
                FROM [User] u, [Package] p
                WHERE u.email = 'school@example.com' AND p.name = N'test'
                
                UNION ALL
                
                SELECT 
                    u.id as user_id,
                    p.id as package_id,
                    p.price as amount,
                    N'PayPOS' as method,
                    N'Pending' as status,
                    N'PAYPOS_' + CAST(u.id AS VARCHAR) + '_' + CAST(p.id AS VARCHAR) + '_003' as transaction_id,
                    GETDATE() as transaction_date,
                    NULL as expiry_date
                FROM [User] u, [Package] p
                WHERE u.email = 'parent@example.com' AND p.name = N'test'
                
                UNION ALL
                
                SELECT 
                    u.id as user_id,
                    p.id as package_id,
                    p.price as amount,
                    N'PayPOS' as method,
                    N'Failed' as status,
                    N'PAYPOS_' + CAST(u.id AS VARCHAR) + '_' + CAST(p.id AS VARCHAR) + '_004' as transaction_id,
                    DATEADD(day, -3, GETDATE()) as transaction_date,
                    NULL as expiry_date
                FROM [User] u, [Package] p
                WHERE u.email = 'admin@example.com' AND p.name = N'Gói Dịch Vụ Trẻ Em'
            """))
            session.commit()

            # Cập nhật User package info
            session.execute(text("""
                UPDATE [User] 
                SET 
                    active_package_id = (SELECT id FROM [Package] WHERE name = N'Gói Dịch Vụ Trẻ Em'),
                    package_expiry_date = DATEADD(day, 20, GETDATE()),
                    is_active_package = 1
                WHERE email = 'parent@example.com'
            """))
            session.commit()

            session.execute(text("""
                UPDATE [User] 
                SET 
                    active_package_id = (SELECT id FROM [Package] WHERE name = N'test'),
                    package_expiry_date = DATEADD(day, 15, GETDATE()),
                    is_active_package = 1
                WHERE email = 'school@example.com'
            """))
            session.commit()

@app.on_event("startup")
def on_startup():
    init_db()

# 🔹 TIỆN ÍCH
def get_session():
    with Session(engine) as session:
        yield session

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    print(f"SECRET_KEY: {SECRET_KEY}")
    print(f"ALGORITHM: {ALGORITHM}")
    print(f"Token data to encode: {to_encode}")
    print(f"Expire time: {expire}")
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Encoded token: {token[:50]}...")
    return token

# 🔹 GHI NHẬT KÝ (dùng BackgroundTasks thay vì asyncio.create_task)
def audit(user_id: Optional[int], action: str, details: Optional[str] = None):
    try:
        with Session(engine) as s:
            s.add(AuditLog(user_id=user_id, action=action, details=details))
            s.commit()
    except Exception as e:
        print("Audit log failed:", e)

# 🔹 XÁC THỰC
def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    try:
        print(f"Token received: {cred.credentials[:50]}...")
        print(f"SECRET_KEY for decode: {SECRET_KEY}")
        print(f"ALGORITHM for decode: {ALGORITHM}")
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token payload: {payload}")
        user_id = payload.get("user_id")
        if not user_id:
            print("No user_id in token payload")
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        print(f"JWT decode error: {e}")
        print(f"Token that failed: {cred.credentials}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = session.get(User, user_id)
    if not user:
        print(f"User not found with ID: {user_id}")
        raise HTTPException(status_code=401, detail="User not found")
    print(f"User found: {user.email}, role: {user.role}")
    return user

def get_current_user_optional(
    request: Request,
    session: Session = Depends(get_session),
) -> Optional[User]:
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
    
    user = session.get(User, user_id)
    return user

def require_role(role: str):
    def checker(user: User = Depends(get_current_user)):
        print(f"User role: {user.role}, Required role: {role}")
        if user.role != role:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return checker

# 🔹 ENDPOINTS XÁC THỰC
@app.post('/api/auth/register')
def register(payload: RegisterIn, bg: BackgroundTasks, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.email == payload.email)).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.fullName,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    bg.add_task(audit, user.id, "register", f"role={user.role}")
    return {"msg": "registered", "user_id": user.id}

@app.post('/api/auth/login', response_model=TokenWithRole)
def login(payload: AuthIn, bg: BackgroundTasks, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, 'Invalid email or password')
    token_data = {"user_id": user.id, "role": user.role}
    print(f"Creating token with data: {token_data}")
    token = create_access_token(token_data)
    print(f"Created token: {token[:50]}...")
    bg.add_task(audit, user.id, "login")
    return {"access_token": token, "token_type": "bearer", "role": user.role}

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
    except Exception:
        raise HTTPException(400, 'Invalid token')

# 🔹 WEBSOCKETS
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
            try:
                await conn.send_text(msg)
            except:
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

# 🔹 AI ENDPOINTS
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
    # Dùng BackgroundTasks nếu gọi từ endpoint có bg, nhưng ở đây không có → gọi trực tiếp
    audit(user.id, "upload_face", f"{fr.id}")
    return {"id": fr.id, "path": fpath}

@app.post('/api/ai/analyze-behavior')
def ai_analyze_behavior(video_file: UploadFile = File(...), user: User = Depends(get_current_user)):
    return {"events": [{"type": "running", "confidence": 0.8}], "note": "placeholder"}

@app.post('/api/ai/danger-detection')
def ai_danger_detection(stream_id: Optional[int] = Form(None), user: User = Depends(get_current_user)):
    return {"danger": False, "note": "not implemented"}

# 🔹 CƠ BẢN
@app.get('/')
def index():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# 🔹 ROUTER
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