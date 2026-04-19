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
    { label: 'Courses', path: '/teacher/courses', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Attendance', path: '/teacher/attendance', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Notifications', path: '/teacher/notifications', icon: <Bell className="w-5 h-5" /> },
    { label: 'Reports', path: '/teacher/reports', icon: <FileText className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Teachers', path: '/admin/teachers', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'Students', path: '/admin/students', icon: <Users className="w-5 h-5" /> },
    { label: 'Course Students', path: '/admin/course-students', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Courses', path: '/admin/courses', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Notifications', path: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
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
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 100 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed left-0 top-0 h-full z-50 flex flex-col border-r border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.75)] transition-transform duration-500
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(8,8,10,0.98) 0%, rgba(4,4,6,0.98) 100%)',
          backdropFilter: 'blur(24px)'
        }}
      >
        {/* Diamond-Cut Logo Area */}
        <div className="h-28 flex items-center px-6 gap-4 shrink-0 border-b border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <motion.div
            whileHover={{ scale: 1.15, rotate: 12 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-400/20 flex items-center justify-center shrink-0 shadow-[0_10px_30px_rgba(0,180,255,0.25)] relative z-10"
          >
            <GraduationCap className="w-6 h-6 text-cyan-300" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col relative z-10"
              >
                <span className="text-2xl font-black tracking-tight text-white">EduFlow</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300/70">Ultra Pro Max</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role Identity - Refined */}
        <div className="px-4 py-5">
          <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3 relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <AnimatePresence>
              {sidebarOpen ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 truncate relative z-10"
                >
                  {roleLabels[role]} Command
                </motion.span>
              ) : (
                <span className="text-xs font-bold text-cyan-300 relative z-10">{role[0].toUpperCase()}</span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Liquid Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto py-4 luxury-scroll relative">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={`h-12 flex items-center gap-3 px-3 rounded-xl border transition-all relative group overflow-hidden
                  ${isActive
                    ? 'text-cyan-200 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-400/30 shadow-[0_10px_25px_rgba(0,145,255,0.22)]'
                    : 'text-slate-300 border-transparent hover:text-white hover:bg-white/[0.05] hover:border-white/10'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="liquid-active-marker"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                  />
                )}

                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 ${
                  isActive
                    ? 'bg-cyan-400/15 text-cyan-200'
                    : 'bg-white/[0.04] text-slate-300 group-hover:bg-white/[0.08] group-hover:text-white'
                }`}>
                  {item.icon}
                </span>

                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="whitespace-nowrap overflow-hidden text-sm font-semibold relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="active-dot-luxury"
                    className="absolute right-4 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Refined Collapse Toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all group overflow-hidden relative"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              className="relative z-10"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-cyan-200" /> : <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-200" />}
            </motion.div>
            {sidebarOpen && <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 group-hover:text-cyan-200 relative z-10">Conceal Interface</span>}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </motion.aside>
    </>
  );
}
