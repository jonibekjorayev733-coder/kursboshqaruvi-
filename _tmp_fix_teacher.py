from backend.database import SessionLocal
from backend.models import Teacher
from backend.auth import hash_password

db = SessionLocal()
teacher = db.query(Teacher).filter(Teacher.id == 1).first()
if not teacher:
    teacher = Teacher(name='Mr. Ahad', email='teacher@test.com', password=hash_password('teacher123'), subject='Matematika')
    db.add(teacher)
    db.commit()
    print('created teacher id=', teacher.id)
else:
    teacher.email = 'teacher@test.com'
    teacher.password = hash_password('teacher123')
    if not teacher.name:
        teacher.name = 'Mr. Ahad'
    db.commit()
    print('updated teacher id=', teacher.id)

db.close()
