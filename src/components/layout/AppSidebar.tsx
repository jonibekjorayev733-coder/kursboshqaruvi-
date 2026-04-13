import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import {
  LayoutDashboard, Users, BookOpen, Calendar, CreditCard, Bell, Settings,
  UserCheck, FileText, BarChart3, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Attendance', path: '/student/attendance', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Payments', path: '/student/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Notifications', path: '/student/notifications', icon: <Bell className="w-5 h-5" /> },
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Students', path: '/teacher/students', icon: <Users className="w-5 h-5" /> },
    { label: 'Groups', path: '/teacher/groups', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Attendance', path: '/teacher/attendance', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Reports', path: '/teacher/reports', icon: <FileText className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Teachers', path: '/admin/teachers', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'Students', path: '/admin/students', icon: <Users className="w-5 h-5" /> },
    { label: 'Courses', path: '/admin/courses', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
};

export function AppSidebar() {
  const { role, sidebarOpen, setSidebarOpen } = useAppContext();
  const location = useLocation();
  const items = navItems[role];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 h-full bg-sidebar z-50 flex flex-col border-r border-sidebar-border
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
              >
                EduFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          {sidebarOpen ? (
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              {roleLabels[role]} Panel
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-muted">
                {role[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group
                  ${isActive
                    ? 'bg-sidebar-primary/15 text-sidebar-primary'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <span className="shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-sidebar-border hidden lg:block">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
