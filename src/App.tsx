import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import { AppProvider } from './contexts/AppContext'
import { LanguageProvider } from './hooks/useTranslation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AlertTriangle } from 'lucide-react'
import { Toaster } from 'sonner'
import { BACKEND_STATUS_EVENT, checkBackendConnection } from './services/api'
import './index.css'

// App Panels - Teachers
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherAttendance from './pages/teacher/TeacherAttendance'
import TeacherReports from './pages/teacher/TeacherReports'
import TeacherNotifications from './pages/teacher/TeacherNotifications'

// App Panels - Students
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentPayments from './pages/student/StudentPayments'
import StudentNotifications from './pages/student/StudentNotificationsV2'

// App Panels - Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminStudents from './pages/admin/AdminStudents'
import AdminCourses from './pages/admin/AdminCourses'
import AdminPayments from './pages/admin/AdminPayments'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminNotifications from './pages/admin/AdminNotifications'

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: JSX.Element; requiredRole?: string }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student'} />;
  }

  return children;
}

function App() {
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    checkBackendConnection();

    const handleBackendStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDown: boolean }>;
      setBackendDown(Boolean(customEvent.detail?.isDown));
    };

    window.addEventListener(BACKEND_STATUS_EVENT, handleBackendStatus as EventListener);
    return () => {
      window.removeEventListener(BACKEND_STATUS_EVENT, handleBackendStatus as EventListener);
    };
  }, []);

  return (
    <AppProvider>
      <LanguageProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="flex flex-col min-h-screen bg-black">
            <Navbar />
            {backendDown && (
              <div className="sticky top-0 z-[120] border-y border-red-500/40 bg-red-950/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 text-red-100 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-300" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide">Server ishlamayapti</p>
                      <p className="text-xs text-red-200/80">Backenddan ma'lumot kelmayapti. Serverni ishga tushiring yoki qayta urinib ko'ring.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkBackendConnection()}
                    className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-100 transition-colors hover:bg-red-500/20"
                  >
                    Qayta tekshirish
                  </button>
                </div>
              </div>
            )}
            <main className="flex-grow pt-0 relative z-10">
              <Routes>
                {/* Marketing / Landing Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Dashboard Layout Routes */}
                <Route element={<DashboardLayout />}>
                  {/* Admin */}
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/teachers" element={<ProtectedRoute requiredRole="admin"><AdminTeachers /></ProtectedRoute>} />
                  <Route path="/admin/students" element={<ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>} />
                  <Route path="/admin/course-students" element={<ProtectedRoute requiredRole="admin"><TeacherStudents /></ProtectedRoute>} />
                  <Route path="/admin/courses" element={<ProtectedRoute requiredRole="admin"><AdminCourses /></ProtectedRoute>} />
                  <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><AdminNotifications /></ProtectedRoute>} />
                  
                  {/* Teacher */}
                  <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
                  <Route path="/teacher/courses" element={<ProtectedRoute requiredRole="teacher"><TeacherCourses /></ProtectedRoute>} />
                  <Route path="/teacher/attendance" element={<ProtectedRoute requiredRole="teacher"><TeacherAttendance /></ProtectedRoute>} />
                  <Route path="/teacher/notifications" element={<ProtectedRoute requiredRole="teacher"><TeacherNotifications /></ProtectedRoute>} />
                  <Route path="/teacher/reports" element={<ProtectedRoute requiredRole="teacher"><TeacherReports /></ProtectedRoute>} />
                  
                  {/* Student */}
                  <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
                  <Route path="/student/attendance" element={<ProtectedRoute requiredRole="student"><StudentAttendance /></ProtectedRoute>} />
                  <Route path="/student/payments" element={<ProtectedRoute requiredRole="student"><StudentPayments /></ProtectedRoute>} />
                  <Route path="/student/notifications" element={<ProtectedRoute requiredRole="student"><StudentNotifications /></ProtectedRoute>} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <Toaster position="top-right" richColors closeButton duration={2800} />
          </div>
        </Router>
      </LanguageProvider>
    </AppProvider>
  )
}

export default App
