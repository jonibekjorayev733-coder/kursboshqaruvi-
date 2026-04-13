import { Student, Teacher, Course, Attendance, Performance, Payment, Notification } from '@/types';

const avatarUrl = (seed: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0ea5e9,7c3aed,22c55e,f59e0b&fontFamily=Inter`;

export const students: Student[] = [
  { id: 's1', userId: 'u1', name: 'Alex Johnson', email: 'alex@example.com', phone: '+1-555-0101', parentName: 'Robert Johnson', parentPhone: '+1-555-0102', avatar: avatarUrl('Alex Johnson'), enrolledCourses: ['c1', 'c2', 'c4'], enrollmentDate: '2024-09-01' },
  { id: 's2', userId: 'u2', name: 'Maria Garcia', email: 'maria@example.com', phone: '+1-555-0103', parentName: 'Carlos Garcia', parentPhone: '+1-555-0104', avatar: avatarUrl('Maria Garcia'), enrolledCourses: ['c1', 'c3'], enrollmentDate: '2024-09-01' },
  { id: 's3', userId: 'u3', name: 'James Chen', email: 'james@example.com', phone: '+1-555-0105', parentName: 'Wei Chen', parentPhone: '+1-555-0106', avatar: avatarUrl('James Chen'), enrolledCourses: ['c2', 'c3', 'c4'], enrollmentDate: '2024-10-15' },
  { id: 's4', userId: 'u4', name: 'Sophie Laurent', email: 'sophie@example.com', phone: '+1-555-0107', parentName: 'Pierre Laurent', parentPhone: '+1-555-0108', avatar: avatarUrl('Sophie Laurent'), enrolledCourses: ['c1', 'c4'], enrollmentDate: '2024-09-01' },
  { id: 's5', userId: 'u5', name: 'Omar Hassan', email: 'omar@example.com', phone: '+1-555-0109', parentName: 'Ahmed Hassan', parentPhone: '+1-555-0110', avatar: avatarUrl('Omar Hassan'), enrolledCourses: ['c2', 'c3'], enrollmentDate: '2024-11-01' },
  { id: 's6', userId: 'u6', name: 'Emma Wilson', email: 'emma@example.com', phone: '+1-555-0111', parentName: 'David Wilson', parentPhone: '+1-555-0112', avatar: avatarUrl('Emma Wilson'), enrolledCourses: ['c1', 'c2', 'c3', 'c4'], enrollmentDate: '2024-09-01' },
];

export const teachers: Teacher[] = [
  { id: 't1', userId: 'ut1', name: 'Dr. Sarah Mitchell', email: 'sarah@example.com', phone: '+1-555-0201', avatar: avatarUrl('Sarah Mitchell'), assignedCourses: ['c1', 'c4'], specialization: 'Mathematics' },
  { id: 't2', userId: 'ut2', name: 'Prof. David Kim', email: 'david@example.com', phone: '+1-555-0202', avatar: avatarUrl('David Kim'), assignedCourses: ['c2'], specialization: 'Computer Science' },
  { id: 't3', userId: 'ut3', name: 'Ms. Elena Rodriguez', email: 'elena@example.com', phone: '+1-555-0203', avatar: avatarUrl('Elena Rodriguez'), assignedCourses: ['c3'], specialization: 'Physics' },
];

export const courses: Course[] = [
  { id: 'c1', name: 'Advanced Mathematics', description: 'Calculus, Linear Algebra, and Statistics', teacherId: 't1', studentIds: ['s1', 's2', 's4', 's6'], schedule: 'Mon, Wed, Fri 9:00-10:30', color: '#0ea5e9', totalLessons: 48, completedLessons: 32 },
  { id: 'c2', name: 'Computer Science 101', description: 'Data Structures, Algorithms, and Python', teacherId: 't2', studentIds: ['s1', 's3', 's5', 's6'], schedule: 'Tue, Thu 10:00-12:00', color: '#7c3aed', totalLessons: 36, completedLessons: 20 },
  { id: 'c3', name: 'Physics Fundamentals', description: 'Mechanics, Thermodynamics, and Optics', teacherId: 't3', studentIds: ['s2', 's3', 's5', 's6'], schedule: 'Mon, Wed 14:00-15:30', color: '#22c55e', totalLessons: 40, completedLessons: 28 },
  { id: 'c4', name: 'Applied Statistics', description: 'Probability, Inference, and Data Analysis', teacherId: 't1', studentIds: ['s1', 's3', 's4', 's6'], schedule: 'Fri 13:00-15:00', color: '#f59e0b', totalLessons: 24, completedLessons: 15 },
];

function generateDates(start: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  for (let i = 0; i < count; i++) {
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

const attendanceDates = generateDates('2025-01-06', 90);

export const attendance: Attendance[] = [];
let aId = 1;
for (const s of students) {
  for (const cId of s.enrolledCourses) {
    for (const date of attendanceDates.slice(0, 40)) {
      const rand = Math.random();
      const status = rand > 0.85 ? 'absent' : rand > 0.75 ? 'late' : 'present';
      attendance.push({
        id: `a${aId++}`,
        studentId: s.id,
        courseId: cId,
        date,
        status,
        lateMinutes: status === 'late' ? Math.floor(Math.random() * 25) + 5 : undefined,
        grade: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 60 : undefined,
      });
    }
  }
}

export const performance: Performance[] = [];
let pId = 1;
const perfTypes: Array<{ type: Performance['type']; label: string }> = [
  { type: 'exam', label: 'Midterm Exam' },
  { type: 'quiz', label: 'Quiz 1' },
  { type: 'homework', label: 'Homework 1' },
  { type: 'quiz', label: 'Quiz 2' },
  { type: 'homework', label: 'Homework 2' },
  { type: 'project', label: 'Project 1' },
  { type: 'exam', label: 'Final Exam' },
  { type: 'quiz', label: 'Quiz 3' },
];
for (const s of students) {
  for (const cId of s.enrolledCourses) {
    for (let i = 0; i < perfTypes.length; i++) {
      performance.push({
        id: `p${pId++}`,
        studentId: s.id,
        courseId: cId,
        date: `2025-0${Math.min(i + 1, 4)}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        score: Math.floor(Math.random() * 35) + 65,
        type: perfTypes[i].type,
        label: perfTypes[i].label,
      });
    }
  }
}

const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
export const payments: Payment[] = [];
let payId = 1;
for (const s of students) {
  for (const cId of s.enrolledCourses) {
    for (const m of months) {
      const isPaid = Math.random() > 0.25;
      const isOverdue = !isPaid && m < '2025-04';
      payments.push({
        id: `pay${payId++}`,
        studentId: s.id,
        courseId: cId,
        amount: 150 + Math.floor(Math.random() * 100),
        currency: 'USD',
        status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid',
        dueDate: `${m}-05`,
        paidDate: isPaid ? `${m}-0${Math.floor(Math.random() * 4) + 1}` : undefined,
        month: m,
        cardLast4: isPaid ? `${Math.floor(Math.random() * 9000) + 1000}` : undefined,
      });
    }
  }
}

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Payment Due', message: 'Your payment for Advanced Mathematics is due on April 5th.', type: 'payment', read: false, createdAt: '2025-04-01T10:00:00Z' },
  { id: 'n2', userId: 'u1', title: 'New Assignment', message: 'Homework 3 has been posted for Computer Science 101.', type: 'course', read: false, createdAt: '2025-04-02T14:30:00Z' },
  { id: 'n3', userId: 'u1', title: 'Attendance Warning', message: 'You have missed 3 classes in Applied Statistics this month.', type: 'attendance', read: true, createdAt: '2025-03-28T09:15:00Z' },
  { id: 'n4', userId: 'u1', title: 'System Update', message: 'The platform will undergo maintenance on April 10th.', type: 'system', read: true, createdAt: '2025-03-25T16:00:00Z' },
  { id: 'n5', userId: 'u1', title: 'Payment Received', message: 'Your payment of $200 for Physics has been received.', type: 'payment', read: true, createdAt: '2025-03-20T11:00:00Z' },
  { id: 'n6', userId: 'u1', title: 'Grade Posted', message: 'Your midterm grade for Advanced Mathematics is now available.', type: 'course', read: false, createdAt: '2025-04-03T08:00:00Z' },
];

// Revenue data for admin
export const revenueData = months.map(m => ({
  month: m,
  revenue: payments.filter(p => p.month === m && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  unpaid: payments.filter(p => p.month === m && p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0),
}));
