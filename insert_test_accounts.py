import psycopg2
import hashlib
import secrets

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${password_hash.hex()}"

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="course",
    user="postgres",
    password="jonibek"
)
cursor = conn.cursor()

try:
    # Create test teacher
    teacher_password = hash_password("teacher123")
    cursor.execute(
        "INSERT INTO teacher (name, email, password, subject) VALUES (%s, %s, %s, %s)",
        ("Mr. Ahad", "teacher@test.com", teacher_password, "Matematika")
    )
    
    # Create test student
    student_password = hash_password("student123")
    cursor.execute(
        "INSERT INTO student (name, email, password, phone, telegram) VALUES (%s, %s, %s, %s, %s)",
        ("Jonibek", "student@test.com", student_password, "998901234567", "@jonibek")
    )
    
    conn.commit()
    print("✅ Test accounts created successfully!")
    print("Teacher: teacher@test.com / teacher123")
    print("Student: student@test.com / student123")
except psycopg2.IntegrityError as e:
    conn.rollback()
    print(f"⚠️  Account already exists: {e}")
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
