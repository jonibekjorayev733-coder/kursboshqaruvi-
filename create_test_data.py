#!/usr/bin/env python
import sys
sys.path.insert(0, '/react Jonibek/vite-project')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import hashlib, secrets

# Database connection
DATABASE_URL = "postgresql://postgres:jonibek@localhost:5432/course"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Simple password hashing
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${password_hash.hex()}"

# Create models inline
from sqlalchemy import Column, Integer, String, Float, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Teacher(Base):
    __tablename__ = "teacher"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    avatar = Column(String)
    subject = Column(String)
    course_id = Column(Integer, nullable=True)

class Student(Base):
    __tablename__ = "student"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    avatar = Column(String)
    phone = Column(String, nullable=True)
    telegram = Column(String, nullable=True)

db = SessionLocal()

try:
    # Create test teacher
    teacher = Teacher(
        name="Mr. Ahad",
        email="teacher@test.com",
        password=hash_password("teacher123"),
        subject="Matematika"
    )
    db.add(teacher)

    # Create test student
    student = Student(
        name="Jonibek",
        email="student@test.com",
        password=hash_password("student123"),
        phone="998901234567",
        telegram="@jonibek"
    )
    db.add(student)

    db.commit()
    print("✅ Test accounts created successfully!")
    print("Teacher: teacher@test.com / teacher123")
    print("Student: student@test.com / student123")
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
