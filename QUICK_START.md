# EduGrow Platform - Quick Start Guide

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd backend
python main.py
```

**Expected Output:**
```
✅ Test admin created
✅ Test teacher created
✅ Test student created
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 2: Start the Frontend
```bash
npm run dev
# or
bun run dev
```

**Expected Output:**
```
  ➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser
- Navigate to `http://localhost:5173/`
- You'll see the home page with navigation
- Click "Login" or navigate to `http://localhost:5173/login`

---

## 👥 Test Accounts

All test accounts are automatically created when the backend starts.

### Admin Account
- **Email:** admin@test.com
- **Password:** admin123
- **Dashboard:** http://localhost:5173/admin

### Teacher Account
- **Email:** teacher@test.com
- **Password:** teacher123
- **Dashboard:** http://localhost:5173/teacher

### Student Account
- **Email:** student@test.com
- **Password:** student123
- **Dashboard:** http://localhost:5173/student

---

## 🎯 Quick Workflow

### As Admin:
1. Login with admin@test.com / admin123
2. Go to `/admin/courses`
3. Create a new course
4. Select teacher from dropdown
5. Click "Create Course"

### As Teacher:
1. Login with teacher@test.com / teacher123
2. Go to `/teacher/courses`
3. Click on your course
4. Add assignments:
   - "Course-wide task" tab: Task for all students
   - "Student task" tab: Task for specific student
5. Click "Save and Send"

### As Student:
1. Login with student@test.com / student123
2. Go to `/student/notifications`
3. View all assignment notifications
4. Mark as read or delete notifications

---

## 🔐 Logout

From any panel (admin, teacher, student):
1. Click on your avatar in the top-right corner
2. Click "Chiqish (Logout)"
3. Redirected to login page
4. Session cleared from localStorage

---

## 🗂️ File Structure

```
edugrow-platform/
├── backend/
│   ├── main.py           # FastAPI app with startup test data
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # Authentication functions
│   ├── database.py       # Database connection
│   └── database.db       # SQLite database
├── src/
│   ├── pages/
│   │   ├── Login.tsx     # Login page
│   │   ├── admin/        # Admin pages
│   │   ├── teacher/      # Teacher pages
│   │   └── student/      # Student pages
│   ├── components/
│   │   ├── layout/       # TopBar, Sidebar, DashboardLayout
│   │   ├── teacher/      # CourseDetailModal
│   │   └── shared/       # Reusable components
│   ├── services/api.ts   # API client
│   └── App.tsx           # Routes and ProtectedRoute
├── VERIFICATION_CHECKLIST.md  # Complete feature checklist
├── QUICK_START.md              # This file
└── package.json                # Dependencies
```

---

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/verify` - Verify token

### Courses
- `GET /courses/` - Get all courses
- `POST /courses/` - Create course (admin only)
- `GET /courses/{id}` - Get course details
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course

### Assignments
- `GET /assignments/` - Get all assignments
- `POST /assignments/` - Create assignment (auto-sends notifications)
- `PUT /assignments/{id}` - Update assignment (auto-sends notifications)
- `DELETE /assignments/{id}` - Delete assignment (auto-sends notifications)

### Notifications
- `GET /notifications/` - Get notifications for user
- `POST /notifications/` - Create notification
- `PUT /notifications/{id}/read` - Mark as read

### Teachers
- `GET /teachers/` - List all teachers
- `POST /teachers/` - Create teacher

### Students
- `GET /students/` - List all students
- `POST /students/` - Create student

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running (if using PostgreSQL)
- Check port 8000 is not in use: `netstat -an | findstr 8000`
- Delete `database.db` and restart backend

### Frontend won't load
- Check Node.js is installed: `node --version`
- Check API_URL in `src/services/api.ts` points to backend
- Clear browser cache: Ctrl+Shift+Delete

### Can't login
- Verify test accounts were created (check backend logs)
- Check backend is running on http://localhost:8000
- Clear browser localStorage: DevTools → Application → LocalStorage

### No courses visible in teacher panel
- Verify teacher_id is set on the course
- Create a new course through admin panel
- Ensure correct teacher is selected

### No notifications appearing
- Verify assignment was created successfully
- Check student is receiving assignments
- Refresh page to reload notifications

---

## 📝 Notes

- All data is stored in `database.db` (SQLite)
- Test accounts are created automatically on backend startup
- Logout clears all localStorage data
- Notifications are SMS-style cards with timestamps
- Teachers only see their own courses
- Students see all assignments for their enrolled courses

---

**Last Updated:** April 15, 2026
**Platform:** EduGrow Educational Management System
