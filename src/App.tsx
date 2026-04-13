import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentPayments from "./pages/student/StudentPayments";
import StudentNotifications from "./pages/student/StudentNotifications";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherGroups from "./pages/teacher/TeacherGroups";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherReports from "./pages/teacher/TeacherReports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<DashboardLayout />}>
              {/* Student */}
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/payments" element={<StudentPayments />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              {/* Teacher */}
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/groups" element={<TeacherGroups />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/reports" element={<TeacherReports />} />
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/teachers" element={<AdminTeachers />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
