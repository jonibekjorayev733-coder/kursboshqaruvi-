from backend.database import SessionLocal
from backend.models import Admin, Student

db = SessionLocal()
print('admins:', [(a.id, a.email) for a in db.query(Admin).all()])
print('students:', [(s.id, s.email) for s in db.query(Student).all()])
db.close()
