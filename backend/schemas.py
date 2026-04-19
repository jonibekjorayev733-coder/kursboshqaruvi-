from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AdminBase(BaseModel):
    email: str
    name: str

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class Admin(AdminBase):
    id: int
    class Config: from_attributes = True

class TeacherBase(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None
    subject: Optional[str] = None

class TeacherCreate(BaseModel):
    name: str
    email: str
    password: str
    avatar: Optional[str] = None
    subject: Optional[str] = None

class Teacher(TeacherBase):
    id: int
    class Config: from_attributes = True

class StudentBase(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None

class StudentCreate(BaseModel):
    name: str
    email: str
    password: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None

class Student(StudentBase):
    id: int
    class Config: from_attributes = True

class CourseBase(BaseModel):
    name: str
    description: str
    instructor: str
    price: float
    duration: str
    level: str
    image_url: Optional[str] = None
    color: Optional[str] = "blue"
    syllabus: List[str] = []
    completed_lessons: int = 0
    total_lessons: int = 12
    teacher_id: Optional[int] = None

class CourseCreate(CourseBase): 
    pass

class Course(CourseBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True

class CourseEnrollmentBase(BaseModel):
    student_id: int
    course_id: int

class CourseEnrollmentCreate(CourseEnrollmentBase):
    pass

class CourseEnrollment(CourseEnrollmentBase):
    id: int
    enrolled_at: Optional[datetime] = None
    class Config: from_attributes = True

class AssignmentBase(BaseModel):
    title: str
    description: str
    course_id: int
    teacher_id: int
    student_id: Optional[int] = None  # null = assignment for entire course
    submitted: Optional[bool] = False
    submitted_at: Optional[datetime] = None

class AssignmentCreate(AssignmentBase): 
    pass

class Assignment(AssignmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config: from_attributes = True


class AssignmentStatusUpdateRequest(BaseModel):
    student_id: int
    status: str  # accepted | in_progress | completed


class AssignmentProgressBase(BaseModel):
    assignment_id: int
    teacher_id: int
    student_id: int
    course_id: int
    status: str
    seen_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    in_progress_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AssignmentProgress(AssignmentProgressBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class AttendanceBase(BaseModel):
    student_id: int
    course_id: int
    date: str
    status: str
    late_minutes: Optional[int] = None
    grade: Optional[float] = None

class AttendanceCreate(AttendanceBase): pass
class Attendance(AttendanceBase):
    id: int
    class Config: from_attributes = True

class PerformanceBase(BaseModel):
    student_id: int
    course_id: int
    date: str
    score: float
    type: str
    label: str

class PerformanceCreate(PerformanceBase): pass
class Performance(PerformanceBase):
    id: int
    class Config: from_attributes = True

class PaymentBase(BaseModel):
    student_id: int
    course_id: int
    amount: float
    currency: Optional[str] = "USD"
    status: str = "pending"
    payment_method: Optional[str] = None  # card, uzum, click, payme
    payment_details: Optional[dict] = None
    due_date: Optional[str] = None
    paid_date: Optional[str] = None
    month: str
    card_last4: Optional[str] = None

class PaymentCreate(PaymentBase): pass
class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_details: Optional[dict] = None
    paid_date: Optional[str] = None
    card_last4: Optional[str] = None

class Payment(PaymentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class StripeIntentRequest(BaseModel):
    student_id: int
    course_id: int
    amount: float
    payment_id: Optional[int] = None
    month: Optional[str] = None

class StripeConfirmRequest(BaseModel):
    payment_intent_id: str
    student_id: int
    course_id: int
    amount: Optional[float] = None
    payment_id: Optional[int] = None
    month: Optional[str] = None

class ClickInvoiceRequest(BaseModel):
    student_id: int
    course_id: int
    amount: float
    phone: str
    payment_id: Optional[int] = None
    month: Optional[str] = None

class ClickVerifyRequest(BaseModel):
    transaction_id: str
    student_id: int
    course_id: int
    amount: Optional[float] = None
    payment_id: Optional[int] = None
    month: Optional[str] = None

class PaymeReceiptRequest(BaseModel):
    student_id: int
    course_id: int
    amount: float
    phone: str
    payment_id: Optional[int] = None
    month: Optional[str] = None

class PaymeStatusRequest(BaseModel):
    receipt_id: str
    student_id: int
    course_id: int
    amount: Optional[float] = None
    payment_id: Optional[int] = None
    month: Optional[str] = None

class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    type: str  # assignment/payment/task status notification types
    assignment_id: Optional[int] = None
    read: Optional[bool] = False

class NotificationCreate(NotificationBase): 
    pass

class Notification(NotificationBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    name: str
    email: str
