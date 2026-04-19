const DEFAULT_API_HOST = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '::1'
        ? '127.0.0.1'
        : window.location.hostname)
    : '127.0.0.1';
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? `http://${DEFAULT_API_HOST}:8001`;
export const BACKEND_STATUS_EVENT = 'edugrow-backend-status-change';

type BackendStatusDetail = { isDown: boolean };

const emitBackendStatus = (isDown: boolean) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<BackendStatusDetail>(BACKEND_STATUS_EVENT, {
        detail: { isDown },
    }));
};

const isBackendRequest = (input: RequestInfo | URL) => {
    const url = typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.toString()
            : input.url;

    return url.startsWith(API_URL) || url.includes(':8001/');
};

export const setupBackendStatusMonitoring = () => {
    if (typeof window === 'undefined') return;

    const monitoredWindow = window as Window & { __edugrowBackendMonitorInstalled?: boolean };
    if (monitoredWindow.__edugrowBackendMonitorInstalled) return;

    const originalFetch = window.fetch.bind(window);
    monitoredWindow.__edugrowBackendMonitorInstalled = true;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (!isBackendRequest(input)) {
            return originalFetch(input, init);
        }

        try {
            const response = await originalFetch(input, init);
            if (response.ok) {
                emitBackendStatus(false);
            } else if (response.status >= 500) {
                emitBackendStatus(true);
            }
            return response;
        } catch (error) {
            emitBackendStatus(true);
            throw error;
        }
    };
};

export const checkBackendConnection = async () => {
    try {
        const response = await fetch(`${API_URL}/`);
        emitBackendStatus(!response.ok);
        return response.ok;
    } catch {
        emitBackendStatus(true);
        return false;
    }
};

const STUDENT_ENROLLMENTS_CACHE_TTL_MS = 20000;
const studentEnrollmentsCache = new Map<number, { at: number; data: any[] }>();

export interface Course {
    id?: number;
    name: string;
    description: string;
    instructor: string;
    price: number;
    duration: string;
    level: string;
    image_url: string;
    color: string;
    syllabus: string[];
    student_ids: number[];
    completed_lessons: number;
    total_lessons: number;
    teacher_id?: number;
    created_at?: string;
}

export interface Teacher {
    id?: number;
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    subject?: string;
    course_id?: number;
}

export interface Student {
    id?: number;
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    phone?: string;
    telegram?: string;
}

export interface Assignment {
    id?: number;
    title: string;
    description: string;
    course_id: number;
    teacher_id: number;
    student_id?: number;
    submitted?: boolean;
    submitted_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Notification {
    id?: number;
    user_id: number;
    title: string;
    message: string;
    type: 'assignment_created' | 'assignment_updated' | 'assignment_deleted' | 'assignment_submitted' | 'payment_paid' | 'payment_received' | 'payment_reminder' | 'assignment_status_accepted' | 'assignment_status_in_progress' | 'assignment_status_completed';
    assignment_id?: number;
    read?: boolean;
    created_at?: string;
}

export interface AssignmentProgress {
    id?: number;
    assignment_id: number;
    teacher_id: number;
    student_id: number;
    course_id: number;
    status: 'accepted' | 'in_progress' | 'completed';
    seen_at?: string;
    accepted_at?: string;
    in_progress_at?: string;
    completed_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TeacherTaskNotificationItem {
    progress_id: number;
    assignment_id: number;
    assignment_title: string;
    student_id: number;
    student_name: string;
    course_id: number;
    status: 'accepted' | 'in_progress' | 'completed';
    seen_at?: string;
    accepted_at?: string;
    in_progress_at?: string;
    completed_at?: string;
    updated_at?: string;
}

export interface TeacherTaskNotificationFeed {
    accepted: TeacherTaskNotificationItem[];
    in_progress: TeacherTaskNotificationItem[];
    completed: TeacherTaskNotificationItem[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_id: number;
    role: 'admin' | 'teacher' | 'student';
    name: string;
    email: string;
}

export const api = {
    // Courses
    async getCourses(): Promise<Course[]> {
        const response = await fetch(`${API_URL}/courses/`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        return response.json();
    },

    async getCourse(id: number): Promise<Course> {
        const response = await fetch(`${API_URL}/courses/${id}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        return response.json();
    },

    async createCourse(course: Course): Promise<Course> {
        const response = await fetch(`${API_URL}/courses/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course),
        });
        if (!response.ok) throw new Error('Failed to create course');
        return response.json();
    },

    async updateCourse(id: number, course: Course): Promise<Course> {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course),
        });
        if (!response.ok) throw new Error('Failed to update course');
        return response.json();
    },

    async deleteCourse(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete course');
    },

    // Enrollments
    async createEnrollment(studentId: number, courseId: number): Promise<any> {
        const response = await fetch(`${API_URL}/enrollments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, course_id: courseId }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        return response.json();
    },

    async deleteEnrollment(studentId: number, courseId: number): Promise<void> {
        const response = await fetch(`${API_URL}/enrollments/${studentId}/${courseId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete enrollment');
    },

    async getEnrollments(courseId: number): Promise<any[]> {
        const response = await fetch(`${API_URL}/enrollments/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch enrollments');
        return response.json();
    },

    async getStudentEnrollments(studentId: number): Promise<any[]> {
        const cached = studentEnrollmentsCache.get(studentId);
        const now = Date.now();
        if (cached && now - cached.at < STUDENT_ENROLLMENTS_CACHE_TTL_MS) {
            return cached.data;
        }

        const coursesResponse = await fetch(`${API_URL}/courses/`);
        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch student enrollments');
        }

        const courses = await coursesResponse.json();
        const enrollmentsByCourse = await Promise.all(
            courses.map(async (course: any) => {
                const response = await fetch(`${API_URL}/enrollments/${course.id}`);
                if (!response.ok) return [];
                return response.json();
            })
        );

        const data = enrollmentsByCourse
            .flat()
            .filter((enrollment: any) => enrollment.student_id === studentId);

        studentEnrollmentsCache.set(studentId, { at: now, data });
        return data;
    },

    // Teachers
    async getTeachers(): Promise<Teacher[]> {
        const response = await fetch(`${API_URL}/teachers/`);
        if (!response.ok) throw new Error('Failed to fetch teachers');
        return response.json();
    },

    async createTeacher(teacher: Teacher): Promise<Teacher> {
        const response = await fetch(`${API_URL}/teachers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher),
        });
        if (!response.ok) throw new Error('Failed to create teacher');
        return response.json();
    },

    async updateTeacher(id: number, teacher: Teacher): Promise<Teacher> {
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher),
        });
        if (!response.ok) throw new Error('Failed to update teacher');
        return response.json();
    },

    async deleteTeacher(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete teacher');
    },

    // Students
    async getStudents(): Promise<Student[]> {
        const response = await fetch(`${API_URL}/students/`);
        if (!response.ok) throw new Error('Failed to fetch students');
        return response.json();
    },

    async createStudent(student: Student): Promise<Student> {
        const response = await fetch(`${API_URL}/students/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API Error Response:', response.status, error);
            throw new Error(`Failed to create student: ${response.status} ${error}`);
        }
        const data = await response.json();
        console.log('✅ Student created successfully:', data);
        return data;
    },

    async updateStudent(id: number, student: Student): Promise<Student> {
        const response = await fetch(`${API_URL}/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student),
        });
        if (!response.ok) throw new Error('Failed to update student');
        return response.json();
    },

    async deleteStudent(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/students/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete student');
    },

    // Attendance
    async getAttendance(filters?: { courseId?: number; studentId?: number; date?: string }): Promise<any[]> {
        const params = new URLSearchParams();
        if (filters?.courseId !== undefined) params.append('course_id', String(filters.courseId));
        if (filters?.studentId !== undefined) params.append('student_id', String(filters.studentId));
        if (filters?.date) params.append('date', filters.date);
        const suffix = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`${API_URL}/attendance/${suffix}`);
        if (!response.ok) throw new Error('Failed to fetch attendance');
        return response.json();
    },

    async createAttendance(attendance: any): Promise<any> {
        const response = await fetch(`${API_URL}/attendance/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendance),
        });
        if (!response.ok) {
            let errorMessage = 'Failed to create attendance';
            try {
                const errorBody = await response.json();
                if (errorBody?.detail) {
                    errorMessage = String(errorBody.detail);
                }
            } catch {
                const raw = await response.text();
                if (raw) errorMessage = raw;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async updateAttendance(id: number, attendance: any): Promise<any> {
        const response = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendance),
        });
        if (!response.ok) throw new Error('Failed to update attendance');
        return response.json();
    },

    async deleteAttendance(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete attendance');
    },

    // Performance
    async getPerformance(): Promise<any[]> {
        const response = await fetch(`${API_URL}/performance/`);
        if (!response.ok) throw new Error('Failed to fetch performance');
        return response.json();
    },

    async createPerformance(performance: any): Promise<any> {
        const response = await fetch(`${API_URL}/performance/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(performance),
        });
        if (!response.ok) throw new Error('Failed to create performance');
        return response.json();
    },

    // Payments
    async getPayments(): Promise<any[]> {
        const response = await fetch(`${API_URL}/payments/`);
        if (!response.ok) throw new Error('Failed to fetch payments');
        return response.json();
    },

    async getStudentPayments(studentId: number): Promise<any[]> {
        const response = await fetch(`${API_URL}/payments/student/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch student payments');
        return response.json();
    },

    async getStudentCoursePayment(studentId: number, courseId: number): Promise<any> {
        const response = await fetch(`${API_URL}/payments/student/${studentId}/course/${courseId}`);
        if (!response.ok) throw new Error('Payment not found');
        return response.json();
    },

    async createPayment(payment: any): Promise<any> {
        const response = await fetch(`${API_URL}/payments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment),
        });
        if (!response.ok) throw new Error('Failed to create payment');
        return response.json();
    },

    async updatePayment(paymentId: number, updates: any): Promise<any> {
        const response = await fetch(`${API_URL}/payments/${paymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update payment');
        return response.json();
    },

    async sendSMS(paymentId: number): Promise<any> {
        const response = await fetch(`${API_URL}/payments/${paymentId}/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to send SMS');
        return response.json();
    },

    async sendBulkNotifications(paymentIds: number[], message?: string): Promise<any> {
        const response = await fetch(`${API_URL}/payments/send-bulk-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_ids: paymentIds,
                message_override: message || null,
            }),
        });
        if (!response.ok) throw new Error('Failed to send bulk notifications');
        return response.json();
    },

    // Notifications
    async getNotifications(userId?: number): Promise<Notification[]> {
        const params = userId ? `?user_id=${userId}` : '';
        const response = await fetch(`${API_URL}/notifications/${params}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        // Handle both array and object responses (from disabled endpoint)
        if (Array.isArray(data)) return data;
        if (data.notifications && Array.isArray(data.notifications)) return data.notifications;
        return [];
    },

    async createNotification(notification: Notification): Promise<Notification> {
        const response = await fetch(`${API_URL}/notifications/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification),
        });
        if (!response.ok) throw new Error('Failed to create notification');
        return response.json();
    },

    async markNotificationRead(notificationId: number): Promise<Notification> {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return response.json();
    },

    // Assignments
    async getAssignments(courseId?: number, teacherId?: number, studentId?: number): Promise<Assignment[]> {
        const params = new URLSearchParams();
        if (courseId) params.append('course_id', courseId.toString());
        if (teacherId) params.append('teacher_id', teacherId.toString());
        if (studentId) params.append('student_id', studentId.toString());
        const url = `${API_URL}/assignments/?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        // Handle both array and object responses (from disabled endpoint)
        if (Array.isArray(data)) return data;
        if (data.assignments && Array.isArray(data.assignments)) return data.assignments;
        return [];
    },

    async createAssignment(assignment: Assignment): Promise<Assignment> {
        const response = await fetch(`${API_URL}/assignments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment),
        });
        if (!response.ok) throw new Error('Failed to create assignment');
        return response.json();
    },

    async updateAssignment(id: number, assignment: Assignment): Promise<Assignment> {
        const response = await fetch(`${API_URL}/assignments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment),
        });
        if (!response.ok) throw new Error('Failed to update assignment');
        return response.json();
    },

    async deleteAssignment(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/assignments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete assignment');
    },

    async submitAssignment(id: number): Promise<Assignment> {
        const response = await fetch(`${API_URL}/assignments/${id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to submit assignment');
        return response.json();
    },

    async updateAssignmentStatus(assignmentId: number, studentId: number, status: 'accepted' | 'in_progress' | 'completed'): Promise<AssignmentProgress> {
        const response = await fetch(`${API_URL}/assignments/${assignmentId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, status }),
        });
        if (!response.ok) {
            let errorMessage = 'Failed to update assignment status';
            try {
                const errorBody = await response.json();
                if (errorBody?.detail) {
                    errorMessage = String(errorBody.detail);
                }
            } catch {
                const raw = await response.text();
                if (raw) errorMessage = raw;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async getStudentAssignmentProgress(studentId: number): Promise<AssignmentProgress[]> {
        const response = await fetch(`${API_URL}/assignment-progress/?student_id=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch assignment progress');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    async getTeacherTaskNotifications(teacherId: number): Promise<TeacherTaskNotificationFeed> {
        const response = await fetch(`${API_URL}/teacher/${teacherId}/task-notifications`);
        if (!response.ok) throw new Error('Failed to fetch teacher task notifications');
        const data = await response.json();
        return {
            accepted: Array.isArray(data?.accepted) ? data.accepted : [],
            in_progress: Array.isArray(data?.in_progress) ? data.in_progress : [],
            completed: Array.isArray(data?.completed) ? data.completed : [],
        };
    },

    // Authentication
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const errorBody = await response.json();
                if (errorBody?.detail) {
                    errorMessage = String(errorBody.detail);
                }
            } catch {
                errorMessage = 'Login failed';
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async verifyToken(token: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Token verification failed');
        return response.json();
    },
};
