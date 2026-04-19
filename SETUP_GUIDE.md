# EduGrow Platform - Quick Setup Guide

## Prerequisites
- Python 3.8+ with FastAPI
- Node.js with npm/bun
- PostgreSQL or SQLite

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install fastapi sqlalchemy pydantic python-jose passlib
```

### 2. Configure Database
Edit `backend/database.py` to set your database URL:
```python
SQLDB = "sqlite:///./test.db"  # For SQLite
# OR
SQLDB = "postgresql://user:password@localhost/edugrow"  # For PostgreSQL
```

### 3. Initialize Database
```bash
python -m backend.init_db
```

### 4. Run Backend Server
```bash
python -m backend.main
```

**Important:** The backend automatically creates test accounts on startup:
```
✅ Test admin created
✅ Test teacher created
✅ Test student created
```

The API will be available at `http://localhost:8000`

You **do not** need to run `python backend/create_test_accounts.py` manually anymore.

### 5. Verify Test Accounts Created
Check the backend terminal for messages like:
```
✅ Test admin created
✅ Test teacher created
✅ Test student created
```

If these messages don't appear, the accounts already exist in the database.

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
# OR
bun install
```

### 2. Run Development Server
```bash
npm run dev
# OR
bun dev
```

The frontend will be available at `http://localhost:5173`

### 3. Update API URL (if different)
Edit `src/services/api.ts`:
```typescript
const API_URL = 'http://localhost:8000';  // Change if needed
```

## Testing the Application

### 1. Access Login Page
Navigate to `http://localhost:5173/login`

### 2. Test as Admin
- Email: `admin@test.com`
- Password: `admin123`
- Create teachers, students, and courses

### 3. Test as Teacher
- Email: `teacher@test.com`
- Password: `teacher123`
- View assigned courses
- Create and manage tasks
- View student list

### 4. Test as Student
- Email: `student@test.com`
- Password: `student123`
- View notifications
- See assigned tasks

## Key Features to Test

### Admin Panel
1. ✅ Go to `/admin/teachers` - Create a new teacher
2. ✅ Go to `/admin/students` - Create a new student
3. ✅ Go to `/admin/courses` - Create a course and assign teacher

### Teacher Panel
1. ✅ Log in with teacher email
2. ✅ Go to `/teacher/courses` - See assigned courses
3. ✅ Click on a course to open details
4. ✅ Click "Kurs vazifasi qo'sh" to create course-wide task
5. ✅ Click "Talaba vazifasi qo'sh" to assign to specific student
6. ✅ Delete tasks and verify notifications

### Student Panel
1. ✅ Log in with student email
2. ✅ Go to `/student/notifications` - See all notifications
3. ✅ Filter by "O'qilmagan" (Unread)
4. ✅ Click notifications to mark as read
5. ✅ Delete notifications

## API Endpoints Reference

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/verify` - Verify JWT token

### Courses
- `GET /courses/` - Get all courses (filter by ?teacher_id=)
- `POST /courses/` - Create course (admin only)
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course

### Teachers
- `GET /teachers/` - Get all teachers
- `POST /teachers/` - Create teacher (admin only)
- `PUT /teachers/{id}` - Update teacher
- `DELETE /teachers/{id}` - Delete teacher

### Students
- `GET /students/` - Get all students
- `POST /students/` - Create student (admin only)
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student

### Assignments
- `GET /assignments/` - Get assignments (filter by ?course_id=, ?teacher_id=, ?student_id=)
- `POST /assignments/` - Create assignment
- `PUT /assignments/{id}` - Update assignment
- `DELETE /assignments/{id}` - Delete assignment

### Notifications
- `GET /notifications/` - Get notifications (filter by ?user_id=)
- `POST /notifications/` - Create notification
- `PUT /notifications/{id}/read` - Mark as read

## Troubleshooting

### Backend Errors
- Make sure Python dependencies are installed: `pip install -r requirements.txt`
- Check if database is initialized
- Verify database connection string

### Frontend Errors
- Clear browser cache: `Ctrl+Shift+Delete`
- Clear node modules: `rm -rf node_modules && npm install`
- Check if backend is running on correct port

### CORS Issues
- Verify CORS is enabled in `backend/main.py`
- Check API_URL in `src/services/api.ts` matches backend URL

### Database Errors
- Delete old database file (if using SQLite): `rm test.db`
- Run `python -m backend.init_db` again
- Create test data: `python backend/create_test_accounts.py`

## File Structure

```
edugrow-platform/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database connection
│   ├── auth.py              # Password hashing & JWT
│   ├── init_db.py           # Database initialization
│   └── create_test_accounts.py  # Test data
├── src/
│   ├── pages/
│   │   ├── Login.tsx                    # Login page
│   │   ├── admin/AdminCourses.tsx       # Admin course management
│   │   ├── teacher/TeacherCourses.tsx   # Teacher course listing
│   │   └── student/StudentNotifications.tsx # Student notifications
│   ├── components/
│   │   ├── teacher/CourseDetailModal.tsx # Course details & task UI
│   │   └── layout/AppSidebar.tsx        # Navigation sidebar
│   └── services/
│       └── api.ts                       # API client
└── README.md
```

## Next Steps

1. Test all features thoroughly
2. Set up production database (PostgreSQL recommended)
3. Add environment variables for API URL
4. Implement real SMS/email notifications
5. Add task submission and grading
6. Deploy frontend to Vercel/Netlify
7. Deploy backend to Railway/Render/AWS

---

**Questions?** Refer to `IMPLEMENTATION_SUMMARY.md` for detailed feature documentation.
