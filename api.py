from functools import wraps, lru_cache
import io, os, uuid, asyncio
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import BackgroundTasks
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select
from passlib.context import CryptContext
from pydantic import BaseModel
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import DecodeError as JWTError

# ---------- Configuration ----------
security = HTTPBearer()
SECRET_KEY = os.getenv("SAFENEST_SECRET", "dev-secret-changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
DB_URL = "sqlite:///safenest.db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app = FastAPI(title="SafeNest AI - Demo API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine(DB_URL, echo=False)

# ---------- Models ----------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    full_name: Optional[str]
    hashed_password: str
    role: str  # 'admin' or 'parent'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Child(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    class_id: Optional[int]
    parent_id: Optional[int]

class ClassRoom(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

class Camera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    class_id: Optional[int]
    rtsp_url: Optional[str]
    active: bool = True

class DangerZone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    coords_json: str
    severity: int = 1

class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: Optional[int]
    type: str
    severity: int
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False

class BehaviorLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: int
    behavior: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FaceRecognitionData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    child_id: Optional[int]
    encoding_path: Optional[str]

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int]
    action: str
    details: Optional[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ---------- Schemas ----------
class Token(BaseModel):
    access_token: str
    token_type: str

class AuthIn(BaseModel):
    email: str
    password: str
    role: Optional[str] = "parent"

class RegisterIn(BaseModel):
    email: str
    password: str
    fullName: Optional[str]
    role: str

class ResetPasswordIn(BaseModel):
    token: str
    newPassword: str

# ---------- DB Init ----------
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

create_db_and_tables()

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

# ---------- Simple Rate Limiter ----------
RATE_LIMIT_STORE = {}
RATE_LIMIT = 100
RATE_WINDOW = 60

def rate_limiter(ip: str):
    now = int(datetime.utcnow().timestamp())
    bucket = RATE_LIMIT_STORE.get(ip)
    if not bucket or now - bucket[0] > RATE_WINDOW:
        RATE_LIMIT_STORE[ip] = [now, 1]
        return True
    if bucket[1] >= RATE_LIMIT:
        return False
    bucket[1] += 1
    return True

# ---------- Auth Dependencies ----------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials  # lấy token từ header "Authorization: Bearer <token>"
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

    # chạy audit ở background
    background_tasks.add_task(audit, user.id, "register", f"role={user.role}")

    return {"msg": "registered", "user_id": user.id}

@app.post('/api/auth/login', response_model=Token)
def login(payload: AuthIn, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    token = create_access_token({"user_id": user.id, "role": user.role})
    background_tasks.add_task(audit, user.id, "login")
    return {"access_token": token, "token_type": "bearer"}

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
    session.add(user); session.commit()
    background_tasks.add_task(audit, user.id, "reset_password")
    return {"msg": "Password updated"}

# ---------- Parent APIs ----------
@app.get('/api/parent/dashboard')
def parent_dashboard(user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    children = session.exec(select(Child).where(Child.parent_id == user.id)).all()
    child_ids = [c.id for c in children] if children else [0]
    alerts = session.exec(select(Alert).where(Alert.child_id.in_(child_ids)).order_by(Alert.created_at.desc()).limit(10)).all()
    return {"children": children, "recent_alerts": alerts}

@app.get('/api/parent/children/{child_id}')
def get_child(child_id: int, user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=404, detail='Child not found')
    alerts = session.exec(select(Alert).where(Alert.child_id == child_id).order_by(Alert.created_at.desc())).all()
    return {"child": child, "alerts": alerts}

@app.get('/api/parent/live-view/{child_id}')
def parent_live_view(child_id: int, user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    child = session.get(Child, child_id)
    if not child or child.parent_id != user.id:
        raise HTTPException(status_code=404, detail='Child not found')
    cameras = session.exec(select(Camera).where(Camera.class_id == child.class_id, Camera.active == True)).all()
    return {"cameras": cameras}

@app.get('/api/parent/alerts')
def parent_alerts(type: Optional[str] = None, severity: Optional[int] = None, user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    children = session.exec(select(Child).where(Child.parent_id == user.id)).all()
    child_ids = [c.id for c in children] if children else [0]
    q = select(Alert).where(Alert.child_id.in_(child_ids))
    if type: q = q.where(Alert.type == type)
    if severity: q = q.where(Alert.severity == severity)
    return session.exec(q.order_by(Alert.created_at.desc())).all()

@app.post('/api/parent/alerts/{alert_id}/confirm')
def confirm_alert(alert_id: int, notes: Optional[str] = Form(None), user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail='Alert not found')
    alert.acknowledged = True
    session.add(alert); session.commit()
    asyncio.create_task(audit(user.id, "confirm_alert", details=f"alert={alert_id} notes={notes}"))
    return {"msg": "acknowledged"}

@app.get('/api/parent/reports/behavior')
def parent_behavior_reports(timeRange: str = 'weekly', user: User = Depends(require_role('parent'))):
    @lru_cache(maxsize=32)
    def compute(child_ids_tuple, tr):
        with Session(engine) as s:
            children_ids = list(child_ids_tuple)
            logs = s.exec(select(BehaviorLog).where(BehaviorLog.child_id.in_(children_ids))).all()
            return {"count": len(logs)}
    with Session(engine) as s:
        children = s.exec(select(Child).where(Child.parent_id == user.id)).all()
    ids = tuple([c.id for c in children])
    return compute(ids, timeRange)

@app.get('/api/parent/danger-zones')
def parent_danger_zones(user: User = Depends(require_role('parent')), session: Session = Depends(get_session)):
    return session.exec(select(DangerZone)).all()

# ---------- Admin APIs ----------
@app.get('/api/admin/dashboard')
def admin_dashboard(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    stats = {
        "users": session.exec(select(User)).count(),
        "children": session.exec(select(Child)).count(),
        "alerts": session.exec(select(Alert)).count()
    }
    return stats

# Account management
@app.get('/api/admin/accounts')
def admin_get_accounts(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@app.post('/api/admin/accounts')
def admin_create_account(payload: RegisterIn, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing: raise HTTPException(status_code=400, detail="Email exists")
    u = User(email=payload.email, hashed_password=hash_password(payload.password), role=payload.role, full_name=payload.fullName)
    session.add(u); session.commit(); session.refresh(u)
    asyncio.create_task(audit(user.id, "create_account", details=f"created {u.id}"))
    return u

@app.put('/api/admin/accounts/{id}')
def admin_update_account(id: int, fullName: Optional[str] = Form(None), role: Optional[str] = Form(None), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    u = session.get(User, id)
    if not u: raise HTTPException(status_code=404, detail='Not found')
    if fullName: u.full_name = fullName
    if role: u.role = role
    session.add(u); session.commit()
    asyncio.create_task(audit(user.id, "update_account", details=f"{id}"))
    return u

@app.delete('/api/admin/accounts/{id}')
def admin_delete_account(id: int, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    u = session.get(User, id)
    if not u: raise HTTPException(status_code=404, detail='Not found')
    session.delete(u); session.commit()
    asyncio.create_task(audit(user.id, "delete_account", details=f"{id}"))
    return {"msg": "deleted"}
# ---------- School APIs ----------

@app.get("/api/school/dashboard")
def school_dashboard(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    classes = session.exec(select(ClassRoom)).all()
    cameras = session.exec(select(Camera)).all()
    children = session.exec(select(Child)).all()
    return {
        "msg": f"Welcome school user {user.email}",
        "stats": {
            "classes": len(classes),
            "cameras": len(cameras),
            "children": len(children),
        }
    }

# --- Quản lý lớp học (School scope) ---
@app.get("/api/school/classes")
def school_get_classes(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom)).all()

@app.post("/api/school/classes")
def school_create_class(name: str = Form(...), user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    c = ClassRoom(name=name)
    session.add(c); session.commit(); session.refresh(c)
    return c

# --- Quản lý học sinh ---
@app.get("/api/school/children")
def school_get_children(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Child)).all()

@app.post("/api/school/children")
def school_create_child(name: str = Form(...), class_id: Optional[int] = Form(None), parent_id: Optional[int] = Form(None),
                        user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    child = Child(name=name, class_id=class_id, parent_id=parent_id)
    session.add(child); session.commit(); session.refresh(child)
    return child

# --- Quản lý camera ---
@app.get("/api/school/cameras")
def school_get_cameras(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Camera)).all()

@app.post("/api/school/cameras")
def school_create_camera(name: str = Form(...), class_id: Optional[int] = Form(None), rtsp_url: Optional[str] = Form(None),
                         user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam); session.commit(); session.refresh(cam)
    return cam

# --- Xem danh sách cảnh báo ---
@app.get("/api/school/alerts")
def school_get_alerts(user: User = Depends(require_role("school")), session: Session = Depends(get_session)):
    return session.exec(select(Alert).order_by(Alert.created_at.desc())).all()

# ---------- CRUD for Classes, Cameras, DangerZones ----------
# Classes
@app.get('/api/admin/classes')
def admin_get_classes(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(ClassRoom)).all()

@app.post('/api/admin/classes')
def admin_create_class(name: str = Form(...), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    c = ClassRoom(name=name)
    session.add(c); session.commit(); session.refresh(c)
    return c

@app.put('/api/admin/classes/{id}')
def admin_update_class(id: int, name: str = Form(...), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    c = session.get(ClassRoom, id)
    if not c: raise HTTPException(status_code=404, detail='Not found')
    c.name = name
    session.add(c); session.commit()
    return c

@app.delete('/api/admin/classes/{id}')
def admin_delete_class(id: int, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    c = session.get(ClassRoom, id)
    if not c: raise HTTPException(status_code=404, detail='Not found')
    session.delete(c); session.commit()
    return {"msg":"deleted"}

# Cameras
@app.get('/api/admin/cameras')
def admin_get_cameras(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(Camera)).all()

@app.post('/api/admin/cameras')
def admin_create_camera(name: str = Form(...), class_id: Optional[int] = Form(None), rtsp_url: Optional[str] = Form(None), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    cam = Camera(name=name, class_id=class_id, rtsp_url=rtsp_url)
    session.add(cam); session.commit(); session.refresh(cam)
    return cam

@app.put('/api/admin/cameras/{id}')
def admin_update_camera(id: int, name: Optional[str] = Form(None), active: Optional[bool] = Form(None), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    cam = session.get(Camera, id)
    if not cam: raise HTTPException(status_code=404, detail='Not found')
    if name: cam.name = name
    if active is not None: cam.active = active
    session.add(cam); session.commit()
    return cam

@app.delete('/api/admin/cameras/{id}')
def admin_delete_camera(id: int, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    cam = session.get(Camera, id)
    if not cam: raise HTTPException(status_code=404, detail='Not found')
    session.delete(cam); session.commit()
    return {"msg":"deleted"}

# Danger Zones
@app.get('/api/admin/danger-zones')
def admin_get_zones(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(DangerZone)).all()

@app.post('/api/admin/danger-zones')
def admin_create_zone(name: str = Form(...), coords_json: str = Form(...), severity: int = Form(1), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    z = DangerZone(name=name, coords_json=coords_json, severity=severity)
    session.add(z); session.commit(); session.refresh(z)
    return z

@app.put('/api/admin/danger-zones/{id}')
def admin_update_zone(id: int, name: Optional[str] = Form(None), coords_json: Optional[str] = Form(None), severity: Optional[int] = Form(None), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    z = session.get(DangerZone, id)
    if not z: raise HTTPException(status_code=404, detail='Not found')
    if name: z.name = name
    if coords_json: z.coords_json = coords_json
    if severity is not None: z.severity = severity
    session.add(z); session.commit()
    return z

@app.delete('/api/admin/danger-zones/{id}')
def admin_delete_zone(id: int, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    z = session.get(DangerZone, id)
    if not z: raise HTTPException(status_code=404, detail='Not found')
    session.delete(z); session.commit()
    return {"msg":"deleted"}

# Reports & Alerts
@app.get('/api/admin/reports')
def admin_reports(type: Optional[str] = None, timeRange: Optional[str] = None, user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return {"alerts_count": session.exec(select(Alert)).count()}

@app.get('/api/admin/alerts')
def admin_get_alerts(user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    return session.exec(select(Alert).order_by(Alert.created_at.desc())).all()

@app.put('/api/admin/alerts/{id}')
def admin_update_alert(id: int, acknowledged: Optional[bool] = Form(None), user: User = Depends(require_role('admin')), session: Session = Depends(get_session)):
    a = session.get(Alert, id)
    if not a: raise HTTPException(status_code=404, detail='Not found')
    if acknowledged is not None: a.acknowledged = acknowledged
    session.add(a); session.commit()
    return a

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

# ---------- Startup sample data ----------
@app.on_event('startup')
def startup_populate():
    with Session(engine) as s:
        if not s.exec(select(User)).first():
            admin = User(email='admin@example.com', full_name='Admin', hashed_password=hash_password('admin123'), role='admin')
            parent = User(email='parent@example.com', full_name='Parent', hashed_password=hash_password('parent123'), role='parent')
            school = User(email="school@example.com", full_name='School', hashed_password=hash_password("school123"), role="school")
            s.add(admin); s.add(parent);s.add(school); s.commit()
            s.commit()
            c = ClassRoom(name='Class A'); s.add(c); s.commit(); s.refresh(c)
            child = Child(name='Alice', class_id=c.id, parent_id=parent.id); s.add(child); s.commit()