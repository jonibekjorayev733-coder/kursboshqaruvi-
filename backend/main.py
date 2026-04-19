from fastapi import FastAPI, Depends, HTTPException, status, Header, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import List, Optional, Dict, Set
from datetime import datetime
import asyncio
import calendar
import os
import json
import urllib.request
import base64
import hmac
import hashlib
import uuid

try:
    import models, schemas
    from database import engine, get_db
    from auth import hash_password, verify_password, create_access_token, decode_access_token
    from payment_gateways import PaymentProcessor, StripePaymentService
except ImportError:
    from . import models, schemas
    from .database import engine, get_db
    from .auth import hash_password, verify_password, create_access_token, decode_access_token
    from .payment_gateways import PaymentProcessor, StripePaymentService

# Create tables
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduGrow Platform API")

# Configure CORS
default_allowed_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://kursboshqaruvi-frontend.onrender.com",
]

env_allowed_origins_raw = os.getenv("CORS_ORIGINS", "")
env_allowed_origins = [origin.strip() for origin in env_allowed_origins_raw.split(",") if origin.strip()]
allowed_origins = list(dict.fromkeys(default_allowed_origins + env_allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"(https?://(localhost|127\.0\.0\.1)(:\d+)?$)|(https://[a-zA-Z0-9\-]+\.onrender\.com$)",
)


class NotificationConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        user_connections = self.active_connections.setdefault(user_id, set())
        user_connections.add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        user_connections = self.active_connections.get(user_id)
        if not user_connections:
            return
        user_connections.discard(websocket)
        if not user_connections:
            self.active_connections.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        user_connections = self.active_connections.get(user_id)
        return bool(user_connections)

    async def broadcast_to_user(self, user_id: int, payload: dict):
        user_connections = self.active_connections.get(user_id)
        if not user_connections:
            return

        disconnected: List[WebSocket] = []
        for connection in list(user_connections):
            try:
                await connection.send_json(payload)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(user_id, connection)


notification_manager = NotificationConnectionManager()


class RealtimeChannelManager:
    def __init__(self):
        self.channels: Dict[str, Set[WebSocket]] = {}

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        listeners = self.channels.setdefault(channel, set())
        listeners.add(websocket)

    def disconnect(self, channel: str, websocket: WebSocket):
        listeners = self.channels.get(channel)
        if not listeners:
            return
        listeners.discard(websocket)
        if not listeners:
            self.channels.pop(channel, None)

    async def broadcast(self, channel: str, payload: dict):
        listeners = self.channels.get(channel)
        if not listeners:
            return

        broken: List[WebSocket] = []
        for socket in list(listeners):
            try:
                await socket.send_json(payload)
            except Exception:
                broken.append(socket)

        for socket in broken:
            self.disconnect(channel, socket)


realtime_manager = RealtimeChannelManager()


def schedule_realtime(channel: str, event: str, data: dict):
    payload = {
        "event": event,
        "channel": channel,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
    }
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(realtime_manager.broadcast(channel, payload))
    except RuntimeError:
        pass


def emit_role_events(role: str, event: str, data: dict, user_id: Optional[int] = None):
    if user_id is not None and role in {"student", "teacher"}:
        schedule_realtime(f"{role}:{user_id}", event, data)
        return

    schedule_realtime(role, event, data)
    if user_id is not None:
        schedule_realtime(f"{role}:{user_id}", event, data)


def notification_to_payload(notification: models.Notification) -> dict:
    created_at_value = notification.created_at.isoformat() if notification.created_at else None
    return {
        "event": "notification.created",
        "notification": {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "assignment_id": notification.assignment_id,
            "read": notification.read,
            "created_at": created_at_value,
        },
    }


def send_sms_via_webhook(phone: Optional[str], message: str) -> bool:
    if not phone:
        return False

    sms_api_url = os.getenv("SMS_API_URL", "").strip()
    sms_api_token = os.getenv("SMS_API_TOKEN", "").strip()

    if not sms_api_url:
        return False

    payload = json.dumps({"phone": phone, "message": message}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if sms_api_token:
        headers["Authorization"] = f"Bearer {sms_api_token}"

    try:
        request = urllib.request.Request(sms_api_url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(request, timeout=8) as response:
            return 200 <= response.status < 300
    except Exception as exc:
        print(f"[WARNING] SMS webhook send failed: {exc}")
        return False


def build_payme_checkout_url(payment_id: int, amount: float) -> str:
    merchant_id = os.getenv("PAYME_MERCHANT_ID", "").strip()
    checkout_base = os.getenv("PAYME_CHECKOUT_BASE", "https://checkout.paycom.uz")
    amount_tiyin = int(round(float(amount) * 100))

    if not merchant_id:
        return ""

    account = {
        "payment_id": str(payment_id),
    }
    account_json = json.dumps(account, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    account_encoded = base64.urlsafe_b64encode(account_json).decode("utf-8").rstrip("=")
    return f"{checkout_base}/?m={merchant_id}&ac={account_encoded}&a={amount_tiyin}"


def verify_payme_callback_signature(raw_body: bytes, signature: str) -> bool:
    secret = os.getenv("PAYME_CALLBACK_SECRET", "").strip()
    allow_unsafe = os.getenv("PAYME_ALLOW_UNSAFE_CALLBACK", "false").lower() == "true"
    if allow_unsafe and not secret:
        return True
    if not secret:
        return False
    if not signature:
        return False

    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@app.websocket("/ws/notifications/{user_id}")
async def notifications_ws(websocket: WebSocket, user_id: int):
    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)
    except Exception:
        notification_manager.disconnect(user_id, websocket)


@app.websocket("/ws/events/{channel}")
async def realtime_events_ws(websocket: WebSocket, channel: str):
    await realtime_manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(channel, websocket)
    except Exception:
        realtime_manager.disconnect(channel, websocket)

# Initialize test data on startup
# Data already initialized via init_db.py
# This is commented out to avoid startup crashes


def ensure_legacy_schema_compatibility():
    """Add missing columns for legacy databases so endpoints do not crash."""
    statements = [
        "ALTER TABLE IF EXISTS payment ADD COLUMN IF NOT EXISTS payment_method VARCHAR",
        "ALTER TABLE IF EXISTS payment ADD COLUMN IF NOT EXISTS payment_details JSON",
        "ALTER TABLE IF EXISTS payment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP",
        "ALTER TABLE IF EXISTS payment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE IF EXISTS assignment ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
        "ALTER TABLE IF EXISTS notification ADD COLUMN IF NOT EXISTS assignment_id INTEGER",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'accepted'",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP",
        "ALTER TABLE IF EXISTS assignment_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
    ]

    try:
        with engine.begin() as conn:
            for statement in statements:
                conn.execute(text(statement))
    except SQLAlchemyError as exc:
        print(f"Schema compatibility migration warning: {exc}")


def sync_table_id_sequence_with_connection(conn, table_name: str):
    """Sync a table's id sequence to max(id)+1 using an open SQLAlchemy connection."""
    try:
        seq_name = conn.execute(
            text(f"SELECT pg_get_serial_sequence('{table_name}', 'id')")
        ).scalar()

        if not seq_name:
            return

        conn.execute(
            text(
                f"""
                SELECT setval(
                    CAST(:seq_name AS regclass),
                    COALESCE((SELECT MAX(id) FROM {table_name}), 0) + 1,
                    false
                )
                """
            ),
            {"seq_name": seq_name},
        )
    except SQLAlchemyError as exc:
        print(f"{table_name} sequence sync warning: {exc}")


def sync_table_id_sequence(db: Session, table_name: str):
    """Session-level id sequence sync for safe inserts."""
    try:
        seq_name = db.execute(
            text(f"SELECT pg_get_serial_sequence('{table_name}', 'id')")
        ).scalar()

        if not seq_name:
            return

        db.execute(
            text(
                f"""
                SELECT setval(
                    CAST(:seq_name AS regclass),
                    COALESCE((SELECT MAX(id) FROM {table_name}), 0) + 1,
                    false
                )
                """
            ),
            {"seq_name": seq_name},
        )
        db.flush()  # Flush but don't commit - let caller decide
    except Exception as exc:
        print(f"Warning: {table_name} sequence sync failed (non-critical): {exc}")
        pass  # Continue even if sync fails


def sync_critical_sequences_with_connection(conn):
    for table_name in ("notification", "attendance", "assignment_progress", "course_enrollment", "course", "student", "payment"):
        sync_table_id_sequence_with_connection(conn, table_name)


def sync_critical_sequences(db: Session):
    for table_name in ("notification", "attendance", "assignment_progress", "course_enrollment", "course", "student", "payment"):
        sync_table_id_sequence(db, table_name)


def sync_notification_id_sequence_with_connection(conn):
    """Sync notification.id sequence to current max(id) to avoid duplicate key errors."""
    sync_table_id_sequence_with_connection(conn, "notification")


def sync_notification_id_sequence(db: Session):
    """Session-level sequence sync for safety before notification inserts."""
    sync_table_id_sequence(db, "notification")


@app.on_event("startup")
def startup_schema_compatibility():
    """Keep startup non-blocking so Render can detect an open port quickly."""
    pass


ALLOWED_ASSIGNMENT_STATUSES = {"accepted", "in_progress", "completed"}


def create_teacher_status_notification(
    db: Session,
    teacher_id: int,
    assignment_id: int,
    assignment_title: str,
    student_name: str,
    status_value: str,
):
    status_title_map = {
        "accepted": "Vazifa qabul qilindi",
        "in_progress": "Vazifa bajarilmoqda",
        "completed": "Vazifa tugatildi",
    }

    status_message_map = {
        "accepted": f"{student_name} vazifani qabul qildi: {assignment_title}",
        "in_progress": f"{student_name} vazifani bajarish jarayonida: {assignment_title}",
        "completed": f"{student_name} vazifani tugatdi: {assignment_title}",
    }

    db.add(models.Notification(
        user_id=teacher_id,
        title=status_title_map.get(status_value, "Vazifa holati yangilandi"),
        message=status_message_map.get(status_value, f"{student_name}: {assignment_title}"),
        type=f"assignment_status_{status_value}",
        assignment_id=assignment_id,
    ))

@app.get("/")
def read_root(): return {"message": "Welcome to EduGrow Platform API"}

# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/auth/login", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Login for admin, teacher or student"""
    normalized_email = request.email.strip().lower()
    normalized_password = request.password.strip()

    # Check admin
    db_admin = db.query(models.Admin).filter(func.lower(models.Admin.email) == normalized_email).first()
    if db_admin and verify_password(normalized_password, db_admin.password):
        access_token = create_access_token({"user_id": db_admin.id, "role": "admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_admin.id,
            "role": "admin",
            "name": db_admin.name,
            "email": db_admin.email
        }
    
    # Check teacher
    db_teacher = db.query(models.Teacher).filter(func.lower(models.Teacher.email) == normalized_email).first()
    if db_teacher and verify_password(normalized_password, db_teacher.password):
        access_token = create_access_token({"user_id": db_teacher.id, "role": "teacher"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_teacher.id,
            "role": "teacher",
            "name": db_teacher.name,
            "email": db_teacher.email
        }
    
    # Check student
    db_student = db.query(models.Student).filter(func.lower(models.Student.email) == normalized_email).first()
    if db_student and verify_password(normalized_password, db_student.password):
        access_token = create_access_token({"user_id": db_student.id, "role": "student"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_student.id,
            "role": "student",
            "name": db_student.name,
            "email": db_student.email
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/verify")
def verify_token(authorization: Optional[str] = Header(None)):
    """Verify and decode JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

# ========== ADMIN MANAGEMENT ==========

@app.get("/admins/", response_model=List[schemas.Admin])
def read_admins(db: Session = Depends(get_db)): 
    return db.query(models.Admin).all()

@app.post("/admins/", response_model=schemas.Admin)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(admin.password)
    db_admin = models.Admin(
        email=admin.email,
        password=hashed_password,
        name=admin.name
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# Courses
@app.post("/courses/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    if not course.teacher_id:
        raise HTTPException(status_code=400, detail="teacher_id is required")

    teacher = db.query(models.Teacher).filter(models.Teacher.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    emit_role_events("admin", "course.created", {"course_id": db_course.id, "name": db_course.name})
    emit_role_events("teacher", "course.created", {"course_id": db_course.id, "name": db_course.name}, user_id=db_course.teacher_id)
    return db_course

@app.get("/courses/", response_model=List[schemas.Course])
def read_courses(skip: int = 0, limit: int = 100, teacher_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Course)
    if teacher_id:
        query = query.filter(models.Course.teacher_id == teacher_id)
    return query.offset(skip).limit(limit).all()

@app.put("/courses/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course is None: raise HTTPException(status_code=404)
    for key, value in course.model_dump().items(): setattr(db_course, key, value)
    db.commit()
    db.refresh(db_course)

    emit_role_events("admin", "course.updated", {"course_id": db_course.id, "name": db_course.name})
    emit_role_events("teacher", "course.updated", {"course_id": db_course.id, "name": db_course.name}, user_id=db_course.teacher_id)
    return db_course

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course is None: raise HTTPException(status_code=404)
    deleted_payload = {"course_id": db_course.id, "name": db_course.name, "teacher_id": db_course.teacher_id}
    db.delete(db_course)
    db.commit()
    emit_role_events("admin", "course.deleted", deleted_payload)
    if deleted_payload.get("teacher_id"):
        emit_role_events("teacher", "course.deleted", deleted_payload, user_id=deleted_payload["teacher_id"])
    return {"message": "deleted"}

# Course Enrollments
@app.post("/enrollments/")
async def create_enrollment(enrollment: schemas.CourseEnrollmentCreate, db: Session = Depends(get_db)):
    try:
        sync_table_id_sequence(db, "course_enrollment")
        sync_table_id_sequence(db, "payment")

        existing = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.student_id == enrollment.student_id,
            models.CourseEnrollment.course_id == enrollment.course_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Student already enrolled in this course")
        
        db_enrollment = models.CourseEnrollment(**enrollment.model_dump())
        db.add(db_enrollment)
        db.flush()

        now = datetime.utcnow()
        current_month = now.strftime("%B")
        last_day = calendar.monthrange(now.year, now.month)[1]
        due_date = now.replace(day=last_day).strftime("%Y-%m-%d")

        existing_payment = db.query(models.Payment).filter(
            models.Payment.student_id == enrollment.student_id,
            models.Payment.course_id == enrollment.course_id,
            models.Payment.month == current_month,
        ).first()

        course = db.query(models.Course).filter(models.Course.id == enrollment.course_id).first()

        if not existing_payment:
            db.add(models.Payment(
                student_id=enrollment.student_id,
                course_id=enrollment.course_id,
                amount=course.price if course else 0,
                currency="USD",
                status="pending",
                due_date=due_date,
                month=current_month,
            ))

        student = db.query(models.Student).filter(models.Student.id == enrollment.student_id).first()
        course_name = course.name if course else f"Kurs #{enrollment.course_id}"
        student_name = student.name if student else f"Student #{enrollment.student_id}"
        notification_message = f"Siz {course_name} guruhiga qo'shildingiz. Admin: dars jadvali va vazifalarni tekshiring."

        sync_notification_id_sequence(db)
        db_notification = models.Notification(
            user_id=enrollment.student_id,
            title="📚 Guruhga qo'shildingiz",
            message=notification_message,
            type="enrollment_added",
        )
        db.add(db_notification)

        db.commit()
        db.refresh(db_enrollment)
        db.refresh(db_notification)

        await notification_manager.broadcast_to_user(
            enrollment.student_id,
            notification_to_payload(db_notification),
        )

        event_payload = {
            "student_id": enrollment.student_id,
            "course_id": enrollment.course_id,
            "course_name": course_name,
            "notification_id": db_notification.id,
        }
        emit_role_events("admin", "enrollment.created", event_payload)
        emit_role_events("teacher", "enrollment.created", event_payload)
        emit_role_events("student", "enrollment.created", event_payload, user_id=enrollment.student_id)

        if not notification_manager.is_online(enrollment.student_id):
            send_sms_via_webhook(
                student.phone if student else None,
                f"{student_name}, {notification_message}",
            )

        return db_enrollment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] create_enrollment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enrollment creation failed: {str(e)}")

@app.delete("/enrollments/{student_id}/{course_id}")
def delete_enrollment(student_id: int, course_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id,
        models.CourseEnrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    db.delete(enrollment)
    db.commit()
    return {"message": "Enrollment deleted"}

@app.get("/enrollments/{course_id}")
def get_course_enrollments(course_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.course_id == course_id
    ).all()
    return enrollments


@app.get("/students/{student_id}/enrollments")
def get_student_enrollments_v2(student_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id
    ).all()
    return enrollments


@app.get("/enrollments/student/{student_id}")
def get_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id
    ).all()
    return enrollments

# Teachers
@app.get("/teachers/", response_model=List[schemas.Teacher])
def read_teachers(db: Session = Depends(get_db)): return db.query(models.Teacher).all()

@app.post("/teachers/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(teacher.password)
    db_teacher = models.Teacher(
        name=teacher.name,
        email=teacher.email,
        password=hashed_password,
        avatar=teacher.avatar,
        subject=teacher.subject
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)

    emit_role_events("admin", "teacher.created", {"teacher_id": db_teacher.id, "name": db_teacher.name})
    emit_role_events("teacher", "teacher.created", {"teacher_id": db_teacher.id, "name": db_teacher.name}, user_id=db_teacher.id)

    return {
        "id": db_teacher.id,
        "name": db_teacher.name,
        "email": db_teacher.email,
        "avatar": db_teacher.avatar,
        "subject": db_teacher.subject
    }

@app.put("/teachers/{teacher_id}", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if db_teacher is None: raise HTTPException(status_code=404)
    for key, value in teacher.model_dump().items(): setattr(db_teacher, key, value)
    db.commit()
    db.refresh(db_teacher)
    emit_role_events("admin", "teacher.updated", {"teacher_id": db_teacher.id, "name": db_teacher.name})
    emit_role_events("teacher", "teacher.updated", {"teacher_id": db_teacher.id, "name": db_teacher.name}, user_id=db_teacher.id)
    return db_teacher

@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if db_teacher is None: raise HTTPException(status_code=404)
    payload = {"teacher_id": db_teacher.id, "name": db_teacher.name}
    db.delete(db_teacher)
    db.commit()
    emit_role_events("admin", "teacher.deleted", payload)
    emit_role_events("teacher", "teacher.deleted", payload, user_id=payload["teacher_id"])
    return {"message": "deleted"}

# Students
@app.get("/students/", response_model=List[schemas.Student])
def read_students(db: Session = Depends(get_db)): return db.query(models.Student).all()

@app.post("/students/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(models.Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")

    hashed_password = hash_password(student.password)
    db_student = models.Student(
        name=student.name,
        email=student.email,
        password=hashed_password,
        avatar=student.avatar,
        phone=student.phone,
        telegram=student.telegram
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    emit_role_events("admin", "student.created", {"student_id": db_student.id, "name": db_student.name})
    emit_role_events("student", "student.created", {"student_id": db_student.id, "name": db_student.name}, user_id=db_student.id)

    return {
        "id": db_student.id,
        "name": db_student.name,
        "email": db_student.email,
        "avatar": db_student.avatar,
        "phone": db_student.phone,
        "telegram": db_student.telegram
    }

@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student is None: raise HTTPException(status_code=404)
    for key, value in student.model_dump().items(): setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    emit_role_events("admin", "student.updated", {"student_id": db_student.id, "name": db_student.name})
    emit_role_events("student", "student.updated", {"student_id": db_student.id, "name": db_student.name}, user_id=db_student.id)
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student is None: raise HTTPException(status_code=404)
    payload = {"student_id": db_student.id, "name": db_student.name}
    db.delete(db_student)
    db.commit()
    emit_role_events("admin", "student.deleted", payload)
    emit_role_events("student", "student.deleted", payload, user_id=payload["student_id"])
    return {"message": "deleted"}

# Attendance
@app.get("/attendance/", response_model=List[schemas.Attendance])
def read_attendance(
    course_id: Optional[int] = None,
    student_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Attendance).filter(
        models.Attendance.student_id.isnot(None),
        models.Attendance.course_id.isnot(None),
        models.Attendance.date.isnot(None),
        models.Attendance.status.isnot(None),
    )
    if course_id is not None:
        query = query.filter(models.Attendance.course_id == course_id)
    if student_id is not None:
        query = query.filter(models.Attendance.student_id == student_id)
    if date is not None:
        query = query.filter(models.Attendance.date == date)
    return query.all()

@app.post("/attendance/", response_model=schemas.Attendance)
def create_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    try:
        allowed_statuses = {"present", "absent", "late"}
        if attendance.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid attendance status")

        if not attendance.date or not attendance.date.strip():
            raise HTTPException(status_code=400, detail="Attendance date is required")

        student_exists = db.query(models.Student.id).filter(models.Student.id == attendance.student_id).first()
        if not student_exists:
            raise HTTPException(status_code=404, detail="Student not found")

        course_exists = db.query(models.Course.id).filter(models.Course.id == attendance.course_id).first()
        if not course_exists:
            raise HTTPException(status_code=404, detail="Course not found")

        existing = db.query(models.Attendance).filter(
            models.Attendance.student_id == attendance.student_id,
            models.Attendance.course_id == attendance.course_id,
            models.Attendance.date == attendance.date,
        ).first()

        if existing:
            existing.status = attendance.status
            existing.late_minutes = attendance.late_minutes
            existing.grade = attendance.grade
            db.commit()
            db.refresh(existing)
            return existing

        sync_table_id_sequence(db, "attendance")
        db_attendance = models.Attendance(**attendance.model_dump())
        db.add(db_attendance)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            sync_table_id_sequence(db, "attendance")
            db_attendance = models.Attendance(**attendance.model_dump())
            db.add(db_attendance)
            db.commit()

        db.refresh(db_attendance)
        return db_attendance
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print(f"Attendance create error: {exc}")
        raise HTTPException(status_code=500, detail=f"Attendance save failed: {exc}")

@app.put("/attendance/{attendance_id}", response_model=schemas.Attendance)
def update_attendance(attendance_id: int, attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance not found")

    for key, value in attendance.model_dump().items():
        setattr(db_attendance, key, value)

    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@app.delete("/attendance/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance not found")

    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance deleted"}

# Performance
@app.get("/performance/", response_model=List[schemas.Performance])
def read_performance(db: Session = Depends(get_db)): return db.query(models.Performance).all()

@app.post("/performance/", response_model=schemas.Performance)
def create_performance(p: schemas.PerformanceCreate, db: Session = Depends(get_db)):
    db_p = models.Performance(**p.model_dump())
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p

# Payment
def ensure_current_month_payments(db: Session):
    """Automatically create current-month payment rows for all active enrollments."""
    now = datetime.utcnow()
    current_month = now.strftime("%B")
    last_day = calendar.monthrange(now.year, now.month)[1]
    default_due_date = now.replace(day=last_day).strftime("%Y-%m-%d")

    enrollments = db.query(models.CourseEnrollment).all()
    created = False

    for enrollment in enrollments:
        if enrollment.student_id is None or enrollment.course_id is None:
            continue

        existing = db.query(models.Payment).filter(
            models.Payment.student_id == enrollment.student_id,
            models.Payment.course_id == enrollment.course_id,
            models.Payment.month == current_month,
        ).first()

        if existing:
            continue

        course = db.query(models.Course).filter(models.Course.id == enrollment.course_id).first()
        db.add(models.Payment(
            student_id=enrollment.student_id,
            course_id=enrollment.course_id,
            amount=course.price if course else 0,
            currency="USD",
            status="pending",
            due_date=default_due_date,
            month=current_month,
        ))
        created = True

    if created:
        db.commit()


@app.get("/payments/", response_model=List[schemas.Payment])
def read_payments(db: Session = Depends(get_db)):
    ensure_current_month_payments(db)
    return db.query(models.Payment).all()

@app.get("/payments/course/{course_id}", response_model=List[schemas.Payment])
def read_course_payments(course_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific course"""
    ensure_current_month_payments(db)
    payments = db.query(models.Payment).filter(models.Payment.course_id == course_id).all()
    return payments

@app.get("/payments/course/{course_id}/month/{month}", response_model=List[schemas.Payment])
def read_course_payments_by_month(course_id: int, month: str, db: Session = Depends(get_db)):
    """Get payments for a course in a specific month"""
    ensure_current_month_payments(db)
    payments = db.query(models.Payment).filter(
        models.Payment.course_id == course_id,
        models.Payment.month == month
    ).all()
    return payments

@app.get("/payments/student/{student_id}", response_model=List[schemas.Payment])
def read_student_payments(student_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific student"""
    ensure_current_month_payments(db)
    payments = db.query(models.Payment).filter(models.Payment.student_id == student_id).all()
    return payments

@app.get("/payments/student/{student_id}/course/{course_id}", response_model=schemas.Payment)
def read_student_course_payment(student_id: int, course_id: int, db: Session = Depends(get_db)):
    """Get specific payment for student-course combination"""
    payment = db.query(models.Payment).filter(
        models.Payment.student_id == student_id,
        models.Payment.course_id == course_id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    """Create a new payment record"""
    # Check if payment already exists for this student-course combination
    existing = db.query(models.Payment).filter(
        models.Payment.student_id == payment.student_id,
        models.Payment.course_id == payment.course_id,
        models.Payment.month == payment.month
    ).first()
    
    if existing:
        # Update existing payment instead
        for key, value in payment.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.put("/payments/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    """Update payment status and details"""
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payment, key, value)
    
    db.commit()
    db.refresh(db_payment)

    emit_role_events(
        "student",
        "payment.updated",
        {"payment_id": db_payment.id, "status": db_payment.status, "course_id": db_payment.course_id},
        user_id=db_payment.student_id,
    )
    emit_role_events(
        "admin",
        "payment.updated",
        {"payment_id": db_payment.id, "status": db_payment.status, "course_id": db_payment.course_id},
    )
    emit_role_events(
        "teacher",
        "payment.updated",
        {"payment_id": db_payment.id, "status": db_payment.status, "course_id": db_payment.course_id},
    )

    return db_payment

@app.post("/payments/{payment_id}/send-sms")
def send_payment_sms(payment_id: int, db: Session = Depends(get_db)):
    """Send payment reminder notification for student panel"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Get student info
    student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = db.query(models.Course).filter(models.Course.id == payment.course_id).first()
    course_name = course.name if course else f"Kurs #{payment.course_id}"

    # Create DB notification shown in student panel
    print(f"🔔 Payment reminder sent to student {student.id} for course {payment.course_id}")

    db.add(models.Notification(
        user_id=student.id,
        title="💳 To'lov qiling",
        message=f"{course_name} kursi uchun to'lovni amalga oshiring. Miqdor: ${payment.amount}",
        type="payment_reminder",
    ))
    db.commit()

    return {"message": "Notification sent", "student_name": student.name}

@app.post("/payments/send-bulk-notification")
def send_bulk_payment_notification(payload: dict, db: Session = Depends(get_db)):
    """Send payment reminder notifications to multiple students
    
    payload: {
        "payment_ids": [1, 2, 3, ...],  # List of payment IDs to send notifications for
        "message_override": "Optional custom message"
    }
    """
    payment_ids = payload.get("payment_ids", [])
    message_override = payload.get("message_override", None)
    
    if not payment_ids:
        raise HTTPException(status_code=400, detail="No payment IDs provided")
    
    sent_count = 0
    failed_payments = []
    
    for payment_id in payment_ids:
        try:
            payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
            if not payment:
                failed_payments.append({"id": payment_id, "error": "Payment not found"})
                continue
            
            student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
            course = db.query(models.Course).filter(models.Course.id == payment.course_id).first()
            
            if not student:
                failed_payments.append({"id": payment_id, "error": "Student not found"})
                continue
            
            course_name = course.name if course else f"Kurs #{payment.course_id}"
            
            # Determine message based on payment status
            if message_override:
                message = message_override
            elif payment.status == "pending":
                message = f"{course_name} kursi uchun to'lovni amalga oshiring. Miqdor: ${payment.amount}"
            elif payment.status == "paid":
                message = f"{course_name} kursi uchun to'lovni qabul qildik. Rahmat!"
            else:
                message = f"{course_name} kursi uchun to'lov statusini tekshiring."
            
            # Create notification
            db.add(models.Notification(
                user_id=student.id,
                title="💳 To'lov xabarnomasla",
                message=message,
                type="payment_reminder",
            ))
            
            sent_count += 1
        except Exception as e:
            failed_payments.append({"id": payment_id, "error": str(e)})
    
    db.commit()
    
    return {
        "success": True,
        "sent_count": sent_count,
        "failed_count": len(failed_payments),
        "failed_payments": failed_payments if failed_payments else None
    }

# ========== REAL PAYMENT GATEWAY ENDPOINTS ==========

@app.post("/payments/real/stripe/create-intent")
def create_stripe_payment_intent(
    payload: schemas.StripeIntentRequest,
    db: Session = Depends(get_db)
):
    """Create Stripe payment intent for real card payment"""
    # Verify student and course exist
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    course = db.query(models.Course).filter(models.Course.id == payload.course_id).first()
    
    if not student or not course:
        raise HTTPException(status_code=404, detail="Student or course not found")
    
    # Create payment intent
    result = StripePaymentService.create_payment_intent(
        payload.amount * 100,
        payload.student_id,
        payload.course_id
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return {
        "client_secret": result["client_secret"],
        "payment_intent_id": result["payment_intent_id"],
        "amount": payload.amount,
        "currency": "UZS",
        "status": "pending"
    }

@app.post("/payments/real/stripe/confirm")
def confirm_stripe_payment(
    payload: schemas.StripeConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm Stripe payment after client-side processing"""
    # Verify the payment with Stripe
    result = StripePaymentService.confirm_payment(payload.payment_intent_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    # Update payment in database
    payment = None
    if payload.payment_id is not None:
        payment = db.query(models.Payment).filter(models.Payment.id == payload.payment_id).first()

    if not payment:
        payment = db.query(models.Payment).filter(
            (models.Payment.student_id == payload.student_id) &
            (models.Payment.course_id == payload.course_id)
        ).first()
    
    if payment:
        payment.status = "paid"
        payment.payment_method = "stripe"
        payment.payment_details = {
            "payment_intent_id": payload.payment_intent_id,
            "charges": result.get("charges", [])
        }
        payment.paid_date = datetime.utcnow().isoformat()
        if payload.amount is not None:
            payment.amount = payload.amount
    else:
        payment = models.Payment(
            student_id=payload.student_id,
            course_id=payload.course_id,
            amount=payload.amount or 0,
            currency="UZS",
            status="paid",
            payment_method="stripe",
            payment_details={
                "payment_intent_id": payload.payment_intent_id,
                "charges": result.get("charges", [])
            },
            month=payload.month or datetime.utcnow().strftime("%Y-%m"),
            paid_date=datetime.utcnow().isoformat()
        )
        db.add(payment)
    
    db.commit()
    db.refresh(payment)
    
    # Create notifications for student and all admins
    student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
    course = db.query(models.Course).filter(models.Course.id == payment.course_id).first()
    student_name = student.name if student else f"Student #{payment.student_id}"
    course_name = course.name if course else f"Kurs #{payment.course_id}"
    paid_time = datetime.utcnow().strftime("%d.%m.%Y %H:%M")
    # Notify student
    db.add(models.Notification(
        user_id=payment.student_id,
        title="✅ To'lov qabul qilindi",
        message=f"{course_name} kursi uchun ${payment.amount} to'lov Stripe orqali qabul qilindi. Sana: {paid_time}",
        type="payment_paid"
    ))
    # Notify all admins
    from models import Admin
    for adm in db.query(Admin).all():
        db.add(models.Notification(
            user_id=adm.id,
            title="💳 Yangi to'lov keldi",
            message=f"{student_name} → {course_name}: ${payment.amount} (Stripe) • {paid_time}",
            type="payment_received"
        ))
    db.commit()
    
    emit_role_events(
        "student",
        "payment.updated",
        {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
        user_id=payment.student_id,
    )
    emit_role_events(
        "admin",
        "payment.updated",
        {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
    )
    emit_role_events(
        "teacher",
        "payment.updated",
        {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
    )

    return {
        "success": True,
        "payment_id": payment.id,
        "status": "paid",
        "amount": result.get("amount"),
        "message": "Payment successful. Payment status updated."
    }

@app.post("/payments/real/click/create-invoice")
async def create_click_invoice(
    payload: schemas.ClickInvoiceRequest,
    db: Session = Depends(get_db)
):
    """Create Click payment invoice for Uzbekistan"""
    # Verify student and course
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    course = db.query(models.Course).filter(models.Course.id == payload.course_id).first()
    
    if not student or not course:
        raise HTTPException(status_code=404, detail="Student or course not found")
    
    # Create Click invoice
    from payment_gateways import ClickPaymentService
    result = await ClickPaymentService.create_invoice(
        payload.amount,
        payload.student_id,
        payload.course_id,
        payload.phone,
        f"Course payment: {course.name}"
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return {
        "invoice_id": result.get("invoice_id"),
        "payment_url": result.get("payment_url"),
        "amount": payload.amount,
        "phone": payload.phone,
        "message": "Click invoice created. Redirect user to payment_url"
    }

@app.post("/payments/real/click/verify")
async def verify_click_payment(
    payload: schemas.ClickVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify Click payment status"""
    from payment_gateways import ClickPaymentService
    
    result = await ClickPaymentService.verify_payment(payload.transaction_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    # Update payment in database if verified
    if result.get("status") == "completed":
        payment = None
        if payload.payment_id is not None:
            payment = db.query(models.Payment).filter(models.Payment.id == payload.payment_id).first()

        if not payment:
            payment = db.query(models.Payment).filter(
                (models.Payment.student_id == payload.student_id) &
                (models.Payment.course_id == payload.course_id)
            ).first()
        
        if payment:
            payment.status = "paid"
            payment.payment_method = "click"
            payment.payment_details = {"transaction_id": payload.transaction_id}
            payment.paid_date = datetime.utcnow().isoformat()
            if payload.amount is not None:
                payment.amount = payload.amount
        else:
            payment = models.Payment(
                student_id=payload.student_id,
                course_id=payload.course_id,
                amount=payload.amount or 0,
                currency="UZS",
                status="paid",
                payment_method="click",
                payment_details={"transaction_id": payload.transaction_id},
                month=payload.month or datetime.utcnow().strftime("%Y-%m"),
                paid_date=datetime.utcnow().isoformat()
            )
            db.add(payment)
        
        db.commit()
        db.refresh(payment)
        
        # Create notifications
        student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
        course = db.query(models.Course).filter(models.Course.id == payment.course_id).first()
        student_name = student.name if student else f"Student #{payment.student_id}"
        course_name = course.name if course else f"Kurs #{payment.course_id}"
        paid_time = datetime.utcnow().strftime("%d.%m.%Y %H:%M")
        db.add(models.Notification(
            user_id=payment.student_id,
            title="✅ To'lov qabul qilindi",
            message=f"{course_name} kursi uchun ${payment.amount} to'lov Click orqali qabul qilindi. Sana: {paid_time}",
            type="payment_paid"
        ))
        from models import Admin
        for adm in db.query(Admin).all():
            db.add(models.Notification(
                user_id=adm.id,
                title="💳 Yangi to'lov keldi",
                message=f"{student_name} → {course_name}: ${payment.amount} (Click) • {paid_time}",
                type="payment_received"
            ))
        db.commit()

        emit_role_events(
            "student",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
            user_id=payment.student_id,
        )
        emit_role_events(
            "admin",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
        )
        emit_role_events(
            "teacher",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
        )
        
        return {
            "success": True,
            "payment_id": payment.id,
            "status": "paid",
            "message": "Click payment verified. Payment status updated."
        }
    
    return {
        "success": False,
        "status": result.get("status"),
        "message": "Payment not yet completed"
    }

@app.post("/payments/real/payme/create-receipt")
async def create_payme_receipt(
    payload: schemas.PaymeReceiptRequest,
    db: Session = Depends(get_db)
):
    """Create Payme checkout session URL for a course payment."""
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    course = db.query(models.Course).filter(models.Course.id == payload.course_id).first()

    if not student or not course:
        raise HTTPException(status_code=404, detail="Student or course not found")

    payment = None
    if payload.payment_id is not None:
        payment = db.query(models.Payment).filter(models.Payment.id == payload.payment_id).first()

    if not payment:
        payment = db.query(models.Payment).filter(
            (models.Payment.student_id == payload.student_id) &
            (models.Payment.course_id == payload.course_id) &
            (models.Payment.month == (payload.month or datetime.utcnow().strftime("%Y-%m")))
        ).first()

    if not payment:
        sync_table_id_sequence(db, "payment")
        payment = models.Payment(
            student_id=payload.student_id,
            course_id=payload.course_id,
            amount=payload.amount,
            currency="UZS",
            status="pending",
            payment_method="payme",
            payment_details={},
            month=payload.month or datetime.utcnow().strftime("%Y-%m"),
        )
        db.add(payment)
        db.flush()

    checkout_url = build_payme_checkout_url(payment.id, payload.amount)
    if not checkout_url:
        raise HTTPException(status_code=500, detail="PAYME_MERCHANT_ID is not configured")

    session_token = f"payme_{uuid.uuid4().hex}"
    details = payment.payment_details or {}
    details.update({
        "receipt_id": session_token,
        "checkout_url": checkout_url,
        "phone": payload.phone,
        "payme_status": "pending",
        "updated_at": datetime.utcnow().isoformat(),
    })

    payment.payment_method = "payme"
    payment.status = "pending"
    payment.amount = payload.amount
    payment.payment_details = details
    db.commit()

    return {
        "receipt_id": session_token,
        "payment_id": payment.id,
        "payment_url": checkout_url,
        "amount": payload.amount,
        "phone": payload.phone,
        "message": "Payme checkout session created"
    }

@app.post("/payments/real/payme/check-status")
async def check_payme_status(
    payload: schemas.PaymeStatusRequest,
    db: Session = Depends(get_db)
):
    """Check Payme payment status from local DB state (updated by callback)."""
    payment = None
    if payload.payment_id is not None:
        payment = db.query(models.Payment).filter(models.Payment.id == payload.payment_id).first()

    if not payment:
        payment = db.query(models.Payment).filter(
            (models.Payment.student_id == payload.student_id) &
            (models.Payment.course_id == payload.course_id)
        ).order_by(models.Payment.updated_at.desc()).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    details = payment.payment_details or {}
    receipt_id = details.get("receipt_id")
    if receipt_id and payload.receipt_id and receipt_id != payload.receipt_id:
        raise HTTPException(status_code=400, detail="Invalid receipt id")

    if payment.status == "paid":
        return {
            "success": True,
            "payment_id": payment.id,
            "status": "paid",
            "message": "Payme payment confirmed",
        }

    return {
        "success": False,
        "payment_id": payment.id,
        "status": payment.status,
        "message": "Payment not yet completed"
    }


@app.post("/payments/real/payme/webhook")
async def payme_webhook(
    request: Request,
    x_payme_signature: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Payme callback endpoint. Verifies signature and marks payment as paid."""
    raw_body = await request.body()
    if not verify_payme_callback_signature(raw_body, x_payme_signature or ""):
        raise HTTPException(status_code=401, detail="Invalid Payme callback signature")

    payload = await request.json()
    payment_id_raw = payload.get("payment_id")
    status_value = str(payload.get("status", "")).lower()
    transaction_id = payload.get("transaction_id")

    if payment_id_raw is None:
        raise HTTPException(status_code=400, detail="payment_id is required")

    try:
        payment_id = int(payment_id_raw)
    except Exception:
        raise HTTPException(status_code=400, detail="payment_id must be integer")

    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    details = payment.payment_details or {}
    details.update({
        "payme_status": status_value,
        "transaction_id": transaction_id,
        "webhook_received_at": datetime.utcnow().isoformat(),
    })
    payment.payment_details = details

    if status_value in {"paid", "success", "completed", "2"}:
        payment.status = "paid"
        payment.payment_method = "payme"
        payment.paid_date = datetime.utcnow().isoformat()

        student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
        course = db.query(models.Course).filter(models.Course.id == payment.course_id).first()
        course_name = course.name if course else f"Kurs #{payment.course_id}"
        student_name = student.name if student else f"Student #{payment.student_id}"
        paid_time = datetime.utcnow().strftime("%d.%m.%Y %H:%M")

        sync_notification_id_sequence(db)
        db.add(models.Notification(
            user_id=payment.student_id,
            title="✅ To'lov qabul qilindi",
            message=f"{course_name} kursi uchun {payment.amount} UZS to'lov Payme orqali qabul qilindi. Sana: {paid_time}",
            type="payment_paid"
        ))

        from models import Admin
        for adm in db.query(Admin).all():
            db.add(models.Notification(
                user_id=adm.id,
                title="💳 Yangi to'lov keldi",
                message=f"{student_name} → {course_name}: {payment.amount} UZS (Payme) • {paid_time}",
                type="payment_received"
            ))

        emit_role_events(
            "student",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
            user_id=payment.student_id,
        )
        emit_role_events(
            "admin",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
        )
        emit_role_events(
            "teacher",
            "payment.updated",
            {"payment_id": payment.id, "status": "paid", "course_id": payment.course_id},
        )

    db.commit()

    return {"success": True}

@app.get("/payments/real/google-pay/config")
def get_google_pay_config(student_id: int, course_id: int):
    """Get Google Pay configuration for mobile payments"""
    from payment_gateways import GooglePayService
    
    # This would be called from mobile app to get payment config
    # Amount would come from database query in real implementation
    config = GooglePayService.create_payment_request(
        amount=50000.00,  # Example amount
        currency="UZS",
        description=f"Course payment for student {student_id}"
    )
    
    return config

# Notification
@app.get("/notifications/")
def read_notifications(user_id: Optional[int] = None, db: Session = Depends(get_db)): 
    query = db.query(models.Notification)
    if user_id is not None:
        query = query.filter(models.Notification.user_id == user_id)
    return query.order_by(models.Notification.created_at.desc()).all()

@app.post("/notifications/", response_model=schemas.Notification)
async def create_notification(notification: schemas.NotificationCreate, db: Session = Depends(get_db)):
    sync_notification_id_sequence(db)
    db_n = models.Notification(**notification.model_dump())
    db.add(db_n)
    db.commit()
    db.refresh(db_n)

    await notification_manager.broadcast_to_user(
        db_n.user_id,
        notification_to_payload(db_n),
    )

    if not notification_manager.is_online(db_n.user_id):
        student = db.query(models.Student).filter(models.Student.id == db_n.user_id).first()
        send_sms_via_webhook(student.phone if student else None, db_n.message)

    emit_role_events(
        "student",
        "notification.created",
        {
            "notification_id": db_n.id,
            "user_id": db_n.user_id,
            "type": db_n.type,
        },
        user_id=db_n.user_id,
    )

    return db_n

@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    db_n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if db_n is None: raise HTTPException(status_code=404)
    db_n.read = True
    db.commit()
    db.refresh(db_n)
    return db_n

# ========== ASSIGNMENTS ==========

@app.get("/assignments/")
def read_assignments(course_id: int = None, teacher_id: int = None, student_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Assignment)

    if course_id is not None:
        query = query.filter(models.Assignment.course_id == course_id)
    if teacher_id is not None:
        query = query.filter(models.Assignment.teacher_id == teacher_id)
    if student_id is not None:
        query = query.filter(
            (models.Assignment.student_id == student_id) |
            (models.Assignment.student_id.is_(None))
        )

    return query.order_by(models.Assignment.created_at.desc()).all()

@app.post("/assignments/", response_model=schemas.Assignment)
def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    db_assignment = models.Assignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    # Create notifications
    if db_assignment.student_id:
        # Notify specific student
        db_n = models.Notification(
            user_id=db_assignment.student_id,
            title="Yangi vazifa",
            message=f"Sizga yangi vazifa berildi: {db_assignment.title}",
            type="assignment_created",
            assignment_id=db_assignment.id
        )
        db.add(db_n)
    else:
        # Notify all students in course
        enrollments = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == db_assignment.course_id
        ).all()
        for enrollment in enrollments:
            db_n = models.Notification(
                user_id=enrollment.student_id,
                title="Yangi kurs vazifasi",
                message=f"Kursga yangi vazifa berildi: {db_assignment.title}",
                type="assignment_created",
                assignment_id=db_assignment.id
            )
            db.add(db_n)
    
    db.commit()

    assignment_event = {
        "assignment_id": db_assignment.id,
        "course_id": db_assignment.course_id,
        "teacher_id": db_assignment.teacher_id,
        "student_id": db_assignment.student_id,
        "title": db_assignment.title,
    }
    emit_role_events("teacher", "assignment.created", assignment_event, user_id=db_assignment.teacher_id)
    if db_assignment.student_id:
        emit_role_events("student", "assignment.created", assignment_event, user_id=db_assignment.student_id)
    else:
        emit_role_events("student", "assignment.created", assignment_event)

    return db_assignment

@app.put("/assignments/{assignment_id}", response_model=schemas.Assignment)
def update_assignment(assignment_id: int, assignment: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if db_assignment is None: raise HTTPException(status_code=404)
    
    # Store old student_id to notify both old and new students
    old_student_id = db_assignment.student_id
    
    for key, value in assignment.model_dump().items(): 
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    
    # Notify students about the update
    if db_assignment.student_id:
        db_n = models.Notification(
            user_id=db_assignment.student_id,
            title="Vazifa o'zgartirildi",
            message=f"Sizning vazifangiz o'zgartirildi: {db_assignment.title}",
            type="assignment_updated",
            assignment_id=db_assignment.id
        )
        db.add(db_n)
    else:
        # Notify all students in course
        enrollments = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == db_assignment.course_id
        ).all()
        for enrollment in enrollments:
            db_n = models.Notification(
                user_id=enrollment.student_id,
                title="Kurs vazifasi o'zgartirildi",
                message=f"Kurs vazifasi o'zgartirildi: {db_assignment.title}",
                type="assignment_updated",
                assignment_id=db_assignment.id
            )
            db.add(db_n)
    
    db.commit()

    update_event = {
        "assignment_id": db_assignment.id,
        "course_id": db_assignment.course_id,
        "teacher_id": db_assignment.teacher_id,
        "student_id": db_assignment.student_id,
        "title": db_assignment.title,
    }
    emit_role_events("teacher", "assignment.updated", update_event, user_id=db_assignment.teacher_id)
    if db_assignment.student_id:
        emit_role_events("student", "assignment.updated", update_event, user_id=db_assignment.student_id)
    else:
        emit_role_events("student", "assignment.updated", update_event)

    return db_assignment

@app.post("/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Mark assignment as submitted by student"""
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if db_assignment is None: 
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    from datetime import datetime
    db_assignment.submitted = True
    db_assignment.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(db_assignment)
    
    # Notify teacher about submission
    if db_assignment.teacher_id:
        student = db.query(models.Student).filter(models.Student.id == db_assignment.student_id).first()
        student_name = student.name if student else "Unknown"
        db_n = models.Notification(
            user_id=db_assignment.teacher_id,
            title="Vazifa topshirildi",
            message=f"{student_name} vazifani topshirdi: {db_assignment.title}",
            type="assignment_submitted",
            assignment_id=db_assignment.id
        )
        db.add(db_n)
        db.commit()
    
    return db_assignment


@app.post("/assignments/{assignment_id}/status", response_model=schemas.AssignmentProgress)
def update_assignment_status(
    assignment_id: int,
    payload: schemas.AssignmentStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    try:
        db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
        if db_assignment is None:
            raise HTTPException(status_code=404, detail="Assignment not found")

        if payload.status not in ALLOWED_ASSIGNMENT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")

        student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if db_assignment.student_id is not None and db_assignment.student_id != payload.student_id:
            raise HTTPException(status_code=403, detail="Student is not assigned to this task")

        if db_assignment.student_id is None:
            enrollment = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.student_id == payload.student_id,
                models.CourseEnrollment.course_id == db_assignment.course_id,
            ).first()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Student is not enrolled in this course")

        progress = db.query(models.AssignmentProgress).filter(
            models.AssignmentProgress.assignment_id == assignment_id,
            models.AssignmentProgress.student_id == payload.student_id,
        ).first()

        now = datetime.utcnow()

        if progress is None:
            sync_table_id_sequence(db, "assignment_progress")
            progress = models.AssignmentProgress(
                assignment_id=assignment_id,
                teacher_id=db_assignment.teacher_id,
                student_id=payload.student_id,
                course_id=db_assignment.course_id,
                status=payload.status,
                seen_at=now,
                accepted_at=now if payload.status == "accepted" else None,
                in_progress_at=now if payload.status == "in_progress" else None,
                completed_at=now if payload.status == "completed" else None,
            )
            db.add(progress)
        else:
            progress.status = payload.status
            progress.seen_at = progress.seen_at or now
            if payload.status == "accepted" and progress.accepted_at is None:
                progress.accepted_at = now
            if payload.status == "in_progress" and progress.in_progress_at is None:
                progress.in_progress_at = now
            if payload.status == "completed" and progress.completed_at is None:
                progress.completed_at = now

        if payload.status == "accepted":
            db_assignment.submitted = True
            db_assignment.submitted_at = now

        sync_table_id_sequence(db, "notification")
        create_teacher_status_notification(
            db=db,
            teacher_id=db_assignment.teacher_id,
            assignment_id=db_assignment.id,
            assignment_title=db_assignment.title,
            student_name=student.name,
            status_value=payload.status,
        )

        try:
            db.commit()
        except IntegrityError as ie:
            db.rollback()
            sync_table_id_sequence(db, "notification")
            raise HTTPException(
                status_code=409,
                detail="Notification sequence out of sync. Please retry.",
            )

        db.refresh(progress)

        status_event = {
            "assignment_id": assignment_id,
            "student_id": payload.student_id,
            "teacher_id": db_assignment.teacher_id,
            "course_id": db_assignment.course_id,
            "status": payload.status,
            "progress_id": progress.id,
        }
        emit_role_events("teacher", "assignment.status_changed", status_event, user_id=db_assignment.teacher_id)
        emit_role_events("admin", "assignment.status_changed", status_event)
        emit_role_events("student", "assignment.status_changed", status_event, user_id=payload.student_id)

        return progress
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating assignment status: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/assignment-progress/", response_model=List[schemas.AssignmentProgress])
def get_assignment_progresses(student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.AssignmentProgress)
    if student_id is not None:
        query = query.filter(models.AssignmentProgress.student_id == student_id)
    return query.order_by(models.AssignmentProgress.updated_at.desc()).all()


@app.get("/teacher/{teacher_id}/task-notifications")
def get_teacher_task_notifications(teacher_id: int, db: Session = Depends(get_db)):
    progresses = db.query(models.AssignmentProgress).filter(
        models.AssignmentProgress.teacher_id == teacher_id
    ).order_by(models.AssignmentProgress.updated_at.desc()).all()

    if not progresses:
        return {
            "accepted": [],
            "in_progress": [],
            "completed": [],
        }

    student_ids = list({p.student_id for p in progresses})
    assignment_ids = list({p.assignment_id for p in progresses})

    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    assignments = db.query(models.Assignment).filter(models.Assignment.id.in_(assignment_ids)).all()

    students_by_id = {s.id: s for s in students}
    assignments_by_id = {a.id: a for a in assignments}

    grouped = {
        "accepted": [],
        "in_progress": [],
        "completed": [],
    }

    for item in progresses:
        status_key = item.status if item.status in grouped else "accepted"
        student = students_by_id.get(item.student_id)
        assignment = assignments_by_id.get(item.assignment_id)
        grouped[status_key].append({
            "progress_id": item.id,
            "assignment_id": item.assignment_id,
            "assignment_title": assignment.title if assignment else "Vazifa",
            "student_id": item.student_id,
            "student_name": student.name if student else f"Student #{item.student_id}",
            "course_id": item.course_id,
            "status": item.status,
            "seen_at": item.seen_at,
            "accepted_at": item.accepted_at,
            "in_progress_at": item.in_progress_at,
            "completed_at": item.completed_at,
            "updated_at": item.updated_at,
        })

    return grouped

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if db_assignment is None: raise HTTPException(status_code=404)
    
    # Create notifications before deleting
    if db_assignment.student_id:
        db_n = models.Notification(
            user_id=db_assignment.student_id,
            title="Vazifa bekor qilindi",
            message=f"Sizning vazifangiz bekor qilindi: {db_assignment.title}",
            type="assignment_deleted",
            assignment_id=db_assignment.id
        )
        db.add(db_n)
    else:
        # Notify all students in course
        enrollments = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == db_assignment.course_id
        ).all()
        for enrollment in enrollments:
            db_n = models.Notification(
                user_id=enrollment.student_id,
                title="Kurs vazifasi bekor qilindi",
                message=f"Kurs vazifasi bekor qilindi: {db_assignment.title}",
                type="assignment_deleted",
                assignment_id=db_assignment.id
            )
            db.add(db_n)
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}

