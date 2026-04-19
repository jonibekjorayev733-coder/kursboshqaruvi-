export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  telegram?: string;
  parentName: string;
  parentPhone: string;
  avatar: string;
  enrolledCourses: string[];
  enrollmentDate: string;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  assignedCourses: string[];
  specialization: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  studentIds: string[];
  schedule: string;
  color: string;
  progress?: number;
  totalLessons: number;
  completedLessons: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  lateMinutes?: number;
  grade?: number;
  note?: string;
}

export interface Performance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  score: number;
  type: 'exam' | 'homework' | 'quiz' | 'project';
  label: string;
}

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  month: string;
  cardLast4?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'payment' | 'course' | 'attendance' | 'system';
  read: boolean;
  createdAt: string;
}
