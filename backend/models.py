from sqlalchemy import Column, Integer, String, Float, JSON, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)

class Teacher(Base):
    __tablename__ = "teacher"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # hashed password
    avatar = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    
    # Relationships
    courses = relationship("Course", back_populates="teacher")
    assignments = relationship("Assignment", back_populates="teacher", foreign_keys="Assignment.teacher_id")

class Student(Base):
    __tablename__ = "student"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # hashed password
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    telegram = Column(String, nullable=True)
    
    # Relationships
    courses = relationship("CourseEnrollment", back_populates="student")
    assignments = relationship("Assignment", back_populates="student", foreign_keys="Assignment.student_id")

class Course(Base):
    __tablename__ = "course"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    instructor = Column(String)
    price = Column(Float)
    duration = Column(String)
    level = Column(String)
    image_url = Column(String, nullable=True)
    color = Column(String)
    syllabus = Column(JSON)
    completed_lessons = Column(Integer, default=0)
    total_lessons = Column(Integer, default=12)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="courses")
    enrollments = relationship("CourseEnrollment", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")

class CourseEnrollment(Base):
    __tablename__ = "course_enrollment"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"))
    course_id = Column(Integer, ForeignKey("course.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="courses")
    course = relationship("Course", back_populates="enrollments")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    course_id = Column(Integer)
    date = Column(String)
    status = Column(String)
    late_minutes = Column(Integer, nullable=True)
    grade = Column(Float, nullable=True)

class Performance(Base):
    __tablename__ = "performance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    course_id = Column(Integer)
    date = Column(String)
    score = Column(Float)
    type = Column(String)
    label = Column(String)

class Payment(Base):
    __tablename__ = "payment"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"))
    course_id = Column(Integer, ForeignKey("course.id"))
    amount = Column(Float)
    currency = Column(String, default="USD")
    status = Column(String, default="pending")  # pending, paid, failed
    payment_method = Column(String, nullable=True)  # card, uzum, click, payme
    payment_details = Column(JSON, nullable=True)  # card_last4, transaction_id, etc.
    due_date = Column(String)
    paid_date = Column(String, nullable=True)
    month = Column(String)
    card_last4 = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student")
    course = relationship("Course")

class Notification(Base):
    __tablename__ = "notification"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    message = Column(String)
    type = Column(String)  # "assignment_created", "assignment_updated", "assignment_deleted", "assignment_submitted"
    assignment_id = Column(Integer, ForeignKey("assignment.id"), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignment"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    course_id = Column(Integer, ForeignKey("course.id"))
    teacher_id = Column(Integer, ForeignKey("teacher.id"))
    student_id = Column(Integer, ForeignKey("student.id"), nullable=True)  # null = full course task
    submitted = Column(Boolean, default=False)  # Track if assignment was accepted/submitted
    submitted_at = Column(DateTime, nullable=True)  # When student accepted the assignment
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="assignments")
    teacher = relationship("Teacher", back_populates="assignments", foreign_keys=[teacher_id])
    student = relationship("Student", back_populates="assignments", foreign_keys=[student_id])


class AssignmentProgress(Base):
    __tablename__ = "assignment_progress"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_progress_assignment_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignment.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("course.id"), nullable=False)
    status = Column(String, default="accepted")  # accepted, in_progress, completed
    seen_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    in_progress_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
