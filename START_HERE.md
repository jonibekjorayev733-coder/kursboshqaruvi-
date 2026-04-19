# 🚀 START HERE - How to Use EduGrow Platform

**Read this first!** This guide shows you exactly how to start and use the platform.

---

## ✅ Prerequisites

Before starting, make sure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js/npm installed
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start Backend Server
Open Terminal 1 and run:

```bash
cd c:\react Jonibek\vite-project
cd backend
python main.py
```

**Wait for this message:**
```
✅ Test admin created
✅ Test teacher created
✅ Test student created
INFO: Uvicorn running on http://127.0.0.1:8000
```

**⚠️ IMPORTANT:** The backend MUST be running before frontend!

---

### Step 2: Start Frontend Server
Open Terminal 2 and run:

```bash
cd c:\react Jonibek\vite-project
npm run dev
```

**Wait for this message:**
```
  ➜  Local:   http://localhost:5173/
```

---

### Step 3: Open in Browser
Click the link or go to: **http://localhost:5173**

You will see the home page with a navigation bar at the top showing:
- **Kirish (Login)** ← Click this!
- Admin
- Teacher
- Student

---

## 📝 Login Page

When you click "Kirish (Login)", you'll see the login page with:
- Email input field
- Password input field
- Login button
- Test account credentials displayed

---

## 🔐 Test Accounts (Choose One)

You have 3 test accounts ready to use:

### 1️⃣ Admin Account
```
Email: admin@test.com
Password: admin123
```
**Can:** Create teachers, create students, create courses, view analytics

### 2️⃣ Teacher Account
```
Email: teacher@test.com
Password: teacher123
```
**Can:** View only assigned courses, create assignments, view student list

### 3️⃣ Student Account
```
Email: student@test.com
Password: student123
```
**Can:** View notifications, mark as read, delete notifications

---

## 🎓 Complete User Workflow

### Scenario: You're an Admin

1. **Go to login page:** http://localhost:5173/login
2. **Enter credentials:**
   - Email: `admin@test.com`
   - Password: `admin123`
3. **Click Login button**
4. **You're redirected to:** `/admin` (Admin Dashboard)

**In Admin Panel, you can:**
- Go to **Courses** → Click "New Course" → Create course with teacher
- Go to **Teachers** → Create new teachers
- Go to **Students** → Create new students
- View dashboard statistics

---

### Scenario: You're a Teacher

1. **Go to login page:** http://localhost:5173/login
2. **Enter credentials:**
   - Email: `teacher@test.com`
   - Password: `teacher123`
3. **Click Login button**
4. **You're redirected to:** `/teacher` (Teacher Dashboard)

**In Teacher Panel, you can:**
- Go to **Courses** → Click on "My Courses"
- **You see:** Only courses assigned to YOU (by admin)
- **Click a course** → Opens course details with 3 tabs:
  1. **Overview** - Course information
  2. **Assignments** - Create & manage tasks
  3. **Students** - View student list

**Create Assignment:**
- Click "Add Course-Wide Task" → Fill title & description → Click "Save and Send"
- **OR** Click "Add Student Task" → Select student → Fill task → Click "Save and Send"
- **Result:** Student receives SMS-style notification

---

### Scenario: You're a Student

1. **Go to login page:** http://localhost:5173/login
2. **Enter credentials:**
   - Email: `student@test.com`
   - Password: `student123`
3. **Click Login button**
4. **You're redirected to:** `/student` (Student Dashboard)

**In Student Panel, you can:**
- Go to **Notifications** → See all notifications from teachers
- **Each notification shows:**
  - Title of assignment
  - Description
  - Date/time received
  - Type (course task or personal task)

**Manage Notifications:**
- Click notification to **mark as read**
- Click trash icon to **delete**
- Click "Unread" filter to see only unread

---

## 🔓 Logout

**From any panel (Admin, Teacher, or Student):**

1. **Look at top-right corner**
2. **Click on your avatar/name** (shows your name and role)
3. **A dropdown appears** showing:
   - Your name
   - Your email
   - "Chiqish (Logout)" button
4. **Click "Chiqish"**
5. **Result:** 
   - Session is cleared
   - Redirected to login page
   - You must login again to access panels

---

## 🎬 Example: Create Course and Assign Task (Complete Workflow)

### As Admin:

1. Login: `admin@test.com` / `admin123`
2. Go to Admin → Courses
3. Click "New Course" button
4. Fill:
   - Name: "Advanced React"
   - Description: "Learn React patterns"
   - Select Instructor: "Mr. Teacher"
   - Duration: "8 weeks"
   - Price: 99
   - Level: "Advanced"
5. Click "Create Course"
6. ✅ Course created with timestamp

### As Teacher:

1. Logout from admin
2. Login: `teacher@test.com` / `teacher123`
3. Go to Teacher → Courses
4. ✅ See "Advanced React" (your course)
5. Click on it
6. Go to "Assignments" tab
7. Click "Add Course-Wide Task"
8. Fill:
   - Title: "Module 1 Quiz"
   - Description: "Complete the module 1 quiz"
9. Click "Save and Send"
10. ✅ Task created, notifications sent

### As Student:

1. Logout from teacher
2. Login: `student@test.com` / `student123`
3. Go to Student → Notifications
4. ✅ See notification: "New Course Task - Module 1 Quiz"
5. Click notification to mark as read
6. Click trash to delete

---

## 🛠️ Troubleshooting

### Problem: "Cannot connect to http://localhost:8000"
**Solution:** Backend is not running
- Check Terminal 1 where you started backend
- If it's not running, run `python main.py` again
- Make sure you're in `backend` folder

### Problem: Page is blank / nothing shows
**Solution:** Frontend is not running
- Check Terminal 2 where you started frontend
- If it's not running, run `npm run dev` again
- Make sure you're in main project folder

### Problem: Login page shows but can't login
**Solution:** Test accounts not created
- Check backend terminal for messages like "✅ Test admin created"
- If you don't see them, backend needs to be restarted
- Stop backend (Ctrl+C) and run `python main.py` again

### Problem: Can't see courses in teacher panel
**Solution:** Teacher not assigned to any courses
- Login as admin
- Go to Courses
- Create a new course and select the teacher
- Logout and login as teacher
- Now you should see the course

### Problem: No notifications showing
**Solution:** Create an assignment first
- Login as teacher
- Go to your course
- Create an assignment
- Logout and login as student
- Go to notifications
- You should see it now

---

## 📱 What Each Page Shows

### Home Page (/)
- Navigation bar with Login, Admin, Teacher, Student links
- Welcome message

### Login Page (/login)
- Email input
- Password input
- Login button
- Test account information

### Admin Dashboard (/admin)
- Statistics (Students, Teachers, Courses)
- Revenue chart
- Course distribution chart

### Teacher Dashboard (/teacher)
- List of MY courses (not all courses)
- Course cards with info
- Click to open course detail modal

### Student Dashboard (/student)
- Notifications list
- Filter (All / Unread)
- Mark as read button
- Delete button

---

## 🎯 Key Points to Remember

1. **Backend must run first** - It creates the database and test accounts
2. **Frontend runs second** - It connects to backend
3. **Login page is mandatory** - All panels require authentication
4. **Each user sees only their data:**
   - Teachers see only their courses
   - Students see only their notifications
   - Admins see everything
5. **Logout clears session** - You must login again to access panels
6. **Notifications are automatic** - Created when teacher assigns tasks

---

## 🔗 Important URLs

| Page | URL |
|------|-----|
| Home | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Admin | http://localhost:5173/admin |
| Teacher | http://localhost:5173/teacher |
| Student | http://localhost:5173/student |
| API | http://localhost:8000 |

---

## ✨ That's It!

You now know how to use the entire EduGrow platform!

**Next Steps:**
1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Open: http://localhost:5173
4. Click: "Kirish (Login)"
5. Try: `admin@test.com` / `admin123`
6. Explore: Each panel and feature

**Enjoy!** 🎉

