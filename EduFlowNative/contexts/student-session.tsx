import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Student } from '@/types/student';
import { studentApi } from '@/services/api';

const STUDENT_STORAGE_KEY = 'eduflow.studentUser';
const STUDENT_TOKEN_KEY = 'eduflow.studentToken';

type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: number;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  email: string;
};

type StudentSessionContextValue = {
  user: Student | null;
  token: string | null;
  isBootstrapping: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const StudentSessionContext = createContext<StudentSessionContextValue | null>(null);

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const [rawUser, rawToken] = await Promise.all([
          AsyncStorage.getItem(STUDENT_STORAGE_KEY),
          AsyncStorage.getItem(STUDENT_TOKEN_KEY),
        ]);
        if (!mounted) return;
        if (!rawUser) return;
        const parsed = JSON.parse(rawUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
        if (rawToken) {
          setToken(rawToken);
        }
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${studentApi.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });
      if (!res.ok) {
        let msg = 'Login failed';
        try {
          const data = await res.json();
          if (data?.detail) msg = String(data.detail);
        } catch {}
        setError(msg);
        setLoading(false);
        return false;
      }
      const data = await res.json() as LoginResponse;
      if (data.role !== 'student') {
        setError('Bu mobil ilova faqat studentlar uchun');
        setLoading(false);
        return false;
      }

      const sessionUser: Student = {
        id: data.user_id,
        name: data.name,
        email: data.email,
      };

      setUser(sessionUser);
      setToken(data.access_token);
      await Promise.all([
        AsyncStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(sessionUser)),
        AsyncStorage.setItem(STUDENT_TOKEN_KEY, data.access_token),
      ]);
      setLoading(false);
      return true;
    } catch (e: any) {
      setError(e?.message || 'Login error');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([
      AsyncStorage.removeItem(STUDENT_STORAGE_KEY),
      AsyncStorage.removeItem(STUDENT_TOKEN_KEY),
    ]);
  };

  const contextValue = useMemo<StudentSessionContextValue>(() => ({
    user,
    token,
    isBootstrapping,
    loading,
    error,
    login,
    logout,
  }), [user, token, isBootstrapping, loading, error]);

  return <StudentSessionContext.Provider value={contextValue}>{children}</StudentSessionContext.Provider>;
}



export function useStudentSession() {
  const context = useContext(StudentSessionContext);
  if (!context) {
    throw new Error('useStudentSession must be used within StudentSessionProvider');
  }
  return context;
}
