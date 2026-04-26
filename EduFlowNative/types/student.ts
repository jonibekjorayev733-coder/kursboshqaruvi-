export interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  avatar?: string;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  instructor?: string;
  duration?: string;
  level?: string;
  price?: number;
  color?: string;
  completed_lessons?: number;
  total_lessons?: number;
}

export interface Enrollment {
  id?: number;
  student_id: number;
  course_id: number;
  enrolled_at?: string;
}

export interface Attendance {
  id?: number;
  student_id: number;
  course_id: number;
  date: string;
  status: string;
  late_minutes?: number;
  grade?: number;
}

export interface Payment {
  id: number;
  student_id: number;
  course_id: number;
  amount: number;
  currency?: string;
  status: 'paid' | 'pending' | 'failed';
  due_date?: string;
  paid_date?: string;
  month: string;
  created_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at?: string;
}
