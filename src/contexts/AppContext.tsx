import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { UserRole } from '@/types';

export interface PaymentNotification {
  id: string;
  type: 'sms_sent' | 'payment_made';
  message: string;
  paymentId: number;
  studentName?: string;
  timestamp: number;
  read: boolean;
}

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  paymentNotifications: PaymentNotification[];
  addPaymentNotification: (notification: Omit<PaymentNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('role') as UserRole) || 'student';
    }
    return 'student';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lms-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);

  const addPaymentNotification = useCallback((notification: Omit<PaymentNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: PaymentNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      read: false
    };
    setPaymentNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setPaymentNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setPaymentNotifications([]);
  }, []);

  const unreadCount = paymentNotifications.filter(n => !n.read).length;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('lms-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('role', role);
    }
  }, [role]);

  // Listen for custom role change events (from login)
  useEffect(() => {
    const handleRoleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.role) {
        setRole(customEvent.detail.role);
      }
    };

    window.addEventListener('roleChanged', handleRoleChange);
    return () => window.removeEventListener('roleChanged', handleRoleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <AppContext.Provider value={{ role, setRole, theme, toggleTheme, sidebarOpen, setSidebarOpen, paymentNotifications, addPaymentNotification, markNotificationAsRead, clearNotifications, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
