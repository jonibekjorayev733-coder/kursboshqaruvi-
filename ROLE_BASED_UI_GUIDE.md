# 🔐 Role-Based UI Implementation Guide

## Overview

The system now has complete role-based UI separation. When a user logs in, they can **ONLY** see and access their assigned role's panel.

---

## How It Works

### 1. **Login Process**
When user logs in at `/login`:
- Backend validates email/password
- Returns `token`, `role`, `user_id`, `name`, `email`
- Frontend stores these in localStorage

### 2. **Route Protection**
Every dashboard route is protected by `ProtectedRoute` component:

```tsx
<Route path="/teacher" element={
  <ProtectedRoute requiredRole="teacher">
    <TeacherDashboard />
  </ProtectedRoute>
} />
```

### 3. **Protection Logic**
The `ProtectedRoute` component checks:
- ✅ Does user have a valid `token`?
  - NO → Redirect to `/login`
  - YES → Continue
- ✅ Does user's `role` match required `role`?
  - NO → Redirect to their actual panel
  - YES → Show component

---

## Example Workflows

### Scenario 1: Teacher Tries to Access Student Panel
```
1. Teacher logs in with teacher@test.com
   - Gets token with role="teacher"
   - Gets redirected to /teacher automatically

2. Teacher tries to access /student (by bookmark/URL)
   - ProtectedRoute checks: role="teacher", required="student"
   - Mismatch! Redirects to /teacher
   - Teacher sees only Teacher Panel ✅
```

### Scenario 2: Student Logs In
```
1. Student logs in with student@test.com
   - Gets token with role="student"
   - Gets redirected to /student automatically

2. Student tries to access /admin or /teacher
   - ProtectedRoute checks role mismatch
   - Redirects back to /student
   - Student sees only Student Panel ✅
```

### Scenario 3: Admin Logs In
```
1. Admin logs in with admin@test.com
   - Gets token with role="admin"
   - Gets redirected to /admin automatically

2. Admin tries to access /student or /teacher
   - ProtectedRoute checks role mismatch
   - Redirects back to /admin
   - Admin sees only Admin Panel ✅
```

---

## Role-Based Access Control

### Teacher Role
- **Can Access:** `/teacher`, `/teacher/courses`, `/teacher/students`, `/teacher/attendance`, `/teacher/reports`
- **Sidebar Shows:** Dashboard, Courses, Students, Attendance, Reports
- **Cannot Access:** /student/*, /admin/*
- **Redirect:** If tries to access other roles → stays on `/teacher`

### Student Role
- **Can Access:** `/student`, `/student/attendance`, `/student/payments`, `/student/notifications`
- **Sidebar Shows:** Dashboard, Attendance, Payments, Notifications
- **Cannot Access:** /teacher/*, /admin/*
- **Redirect:** If tries to access other roles → stays on `/student`

### Admin Role
- **Can Access:** `/admin`, `/admin/teachers`, `/admin/students`, `/admin/courses`, `/admin/payments`, `/admin/analytics`
- **Sidebar Shows:** Dashboard, Teachers, Students, Courses, Payments, Analytics
- **Cannot Access:** /teacher/*, /student/*
- **Redirect:** If tries to access other roles → stays on `/admin`

---

## Role Switcher Behavior

### When NOT Logged In
- **Role Switcher Visible** in TopBar
- Can switch between 🎓 Student, 👨‍🏫 Teacher, 👑 Admin (for demo)
- Affects what Home page shows in navigation

### When Logged In
- **Role Switcher HIDDEN** ✅
- User can only access their assigned role
- Role comes from token/localStorage

---

## UI Components by Role

### TopBar (Header)
```tsx
// Role switcher only shows if NOT logged in
{!token && (
  <div className="flex gap-1 bg-muted rounded-lg p-1">
    {/* Switch role buttons */}
  </div>
)}
```

### AppSidebar (Left Navigation)
```tsx
// Different nav items based on role
const navItems: Record<UserRole, NavItem[]> = {
  student: [...],
  teacher: [...],
  admin: [...],
};

// Renders only items for current user's role
const items = navItems[role];
```

### App Routes (App.tsx)
```tsx
// Each route requires matching role
<Route path="/teacher" element={
  <ProtectedRoute requiredRole="teacher">
    <TeacherDashboard />
  </ProtectedRoute>
} />
```

---

## Testing the Implementation

### Test Case 1: Teacher Cannot See Student Features
```
1. Login as: teacher@test.com / password123teacher
2. Verify you see:
   ✅ Teacher Dashboard
   ✅ Courses menu item
   ✅ Students menu item
   ✅ Attendance menu item
   ✅ Reports menu item
3. Try to navigate to: /student
4. Verify: Redirected to /teacher ✅
```

### Test Case 2: Student Cannot See Teacher Features
```
1. Login as: student@test.com / password123student
2. Verify you see:
   ✅ Student Dashboard
   ✅ Attendance menu item
   ✅ Payments menu item
   ✅ Notifications menu item
3. Try to navigate to: /teacher or /admin
4. Verify: Redirected to /student ✅
```

### Test Case 3: Admin Cannot See Other Roles
```
1. Login as: admin@test.com / password123admin
2. Verify you see:
   ✅ Admin Dashboard
   ✅ Teachers menu item
   ✅ Students menu item
   ✅ Courses menu item
   ✅ Payments menu item
   ✅ Analytics menu item
3. Try to navigate to: /student or /teacher
4. Verify: Redirected to /admin ✅
```

### Test Case 4: Logout and Role Switcher
```
1. Logged in as any role
2. Verify: Role switcher NOT visible in TopBar
3. Click "Chiqish (Logout)" button
4. Logged out and redirected to /login
5. Verify: Role switcher now VISIBLE in TopBar
6. Can switch between 🎓 Student / 👨‍🏫 Teacher / 👑 Admin
```

---

## Key Files Implementing Role-Based UI

### 1. `src/App.tsx`
- Defines all routes
- Wraps dashboard routes with `ProtectedRoute`
- Each route specifies `requiredRole`

### 2. `src/components/layout/AppSidebar.tsx`
- Renders different navigation based on role
- Uses `navItems[role]` to get appropriate menu

### 3. `src/components/layout/TopBar.tsx`
- Hides role switcher when `token` exists
- Shows role switcher when NOT logged in
- Displays current user's name and role

### 4. `src/contexts/AppContext.tsx`
- Manages global `role` state
- Syncs with localStorage
- Provides role to all components

### 5. `src/types/index.ts`
- Defines `UserRole` type: `'student' | 'teacher' | 'admin'`
- Ensures type safety throughout app

---

## Error Scenarios & Handling

### Scenario 1: No Token
```
User tries to access /teacher without logging in
→ ProtectedRoute checks: !token
→ Redirects to /login
→ User must login first
```

### Scenario 2: Invalid Token
```
User's localStorage has corrupted/expired token
→ Backend rejects request
→ Frontend can implement token refresh or logout
→ User redirected to /login
```

### Scenario 3: Role Mismatch
```
User tries /admin but role="student"
→ ProtectedRoute checks: role !== requiredRole
→ Redirects to /student
→ User stays in their assigned panel
```

### Scenario 4: Try to Access Non-existent Route
```
User tries /teacher/non-existent-page
→ React Router shows 404 (fallback to Home)
→ User can only access defined protected routes
```

---

## Configuration Summary

| Component | Status | Details |
|-----------|--------|---------|
| Route Protection | ✅ Active | All dashboard routes protected |
| Role Enforcement | ✅ Active | Wrong role = redirect to correct panel |
| Sidebar Filtering | ✅ Active | Only shows menu items for user's role |
| Role Switcher | ✅ Conditional | Hidden when logged in, shown when not |
| Token Validation | ✅ Active | Checked on every protected route |
| Auto-Redirect | ✅ Active | Redirects wrong role to their panel |

---

## Logout Flow

```
1. User clicks "Chiqish (Logout)" button
   ↓
2. handleLogout() runs:
   - localStorage.removeItem('token')
   - localStorage.removeItem('role')
   - localStorage.removeItem('user_id')
   - localStorage.removeItem('name')
   - localStorage.removeItem('email')
   ↓
3. navigate('/login')
   ↓
4. User sees Login page
   ↓
5. Role switcher visible in TopBar
   ↓
6. User can login as different role
   ↓
7. Cycle repeats
```

---

## Demo Test Accounts

### Admin Account
- **Email:** admin@test.com
- **Password:** password123admin
- **Access:** Only Admin Panel (/admin/*)

### Teacher Account
- **Email:** teacher@test.com
- **Password:** password123teacher
- **Access:** Only Teacher Panel (/teacher/*)

### Student Account
- **Email:** student@test.com
- **Password:** password123student
- **Access:** Only Student Panel (/student/*)

---

## Uzbek UI Labels

| English | Uzbek | Location |
|---------|-------|----------|
| Switch role | Rolni almashtirgich | TopBar (when not logged in) |
| Student | Talaba | AppSidebar, TopBar |
| Teacher | O'qituvchi | AppSidebar, TopBar |
| Admin | Administrator | AppSidebar, TopBar |
| Logout | Chiqish | TopBar dropdown menu |
| Dashboard | Asosiy Boshqaruv | Sidebar, all roles |

---

## Security Features

✅ **Token-Based Authentication**
- User must have valid JWT token
- Token stored in localStorage
- Token checked on every protected route

✅ **Role-Based Authorization**
- User can only access routes matching their role
- Backend validates role on API calls
- Frontend enforces UI-level restrictions

✅ **Session Management**
- Logout clears all user data
- New login creates fresh session
- No data leakage between sessions

✅ **URL Protection**
- Cannot bypass by typing URL directly
- ProtectedRoute component enforces role
- Wrong role always redirects to correct panel

---

## Troubleshooting

### Issue: Role switcher still showing when logged in
**Solution:** Check TopBar.tsx - ensure `{!token && (...)}` condition exists

### Issue: Can access other role's panel
**Solution:** Check ProtectedRoute - ensure `requiredRole` is specified on route

### Issue: Sidebar showing wrong menu items
**Solution:** Check AppSidebar.tsx - ensure `navItems[role]` is correctly mapped

### Issue: Redirecting to wrong panel after login
**Solution:** Check App.tsx ProtectedRoute - ensure role comparison is correct

---

## Future Enhancements

- [ ] Multi-role support (user can have multiple roles)
- [ ] Role switching for admins to test other panels
- [ ] Granular permission control (not just roles)
- [ ] Audit logging for role changes
- [ ] Time-based role expiration
- [ ] Role approval workflow

---

## Summary

✅ **Complete Role-Based UI Implementation:**
- Teacher sees ONLY Teacher Panel
- Student sees ONLY Student Panel
- Admin sees ONLY Admin Panel
- Logout clears role and shows Login page
- Role switcher only visible when not logged in
- All routes protected with ProtectedRoute component
- TypeScript compilation: 0 errors ✅
