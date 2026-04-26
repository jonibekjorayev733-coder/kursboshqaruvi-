import type { Attendance, Course, Enrollment, Notification, Payment, Student } from '@/types/student';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://kursboshqaruvi-backend.onrender.com';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const json = await response.json();
      if (json?.detail) {
        message = String(json.detail);
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  return parseResponse<T>(response);
}

async function putJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response);
}

export const studentApi = {
  apiUrl: API_URL,

  getStudents: () => getJson<Student[]>('/students/'),

  getStudentById: async (studentId: number) => {
    const students = await getJson<Student[]>('/students/');
    return students.find((student) => student.id === studentId) ?? null;
  },

  getCourses: () => getJson<Course[]>('/courses/'),

  getStudentEnrollments: (studentId: number) =>
    getJson<Enrollment[]>(`/enrollments/student/${studentId}`),

  getStudentCourses: async (studentId: number) => {
    const [courses, enrollments] = await Promise.all([
      getJson<Course[]>('/courses/'),
      getJson<Enrollment[]>(`/enrollments/student/${studentId}`),
    ]);

    const courseIdSet = new Set(enrollments.map((item) => item.course_id));
    return courses.filter((course) => course.id != null && courseIdSet.has(course.id));
  },

  getStudentAttendance: (studentId: number) =>
    getJson<Attendance[]>(`/attendance/?student_id=${studentId}`),

  getStudentPayments: (studentId: number) =>
    getJson<Payment[]>(`/payments/student/${studentId}`),

  getNotifications: (studentId: number) =>
    getJson<Notification[]>(`/notifications/?user_id=${studentId}`),

  markNotificationRead: (notificationId: number) =>
    putJson<Notification>(`/notifications/${notificationId}/read`, {}),
};
