from backend.database import SessionLocal
from backend.models import Teacher

db = SessionLocal()
rows = db.query(Teacher).all()
for t in rows:
    p = t.password or ''
    print(t.id, t.email, len(p), 'has_dollar' if '$' in p else 'no_dollar', p[:20])
db.close()
