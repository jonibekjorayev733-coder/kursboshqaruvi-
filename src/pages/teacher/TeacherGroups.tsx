import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { api, Course, Student } from '@/services/api';
import { Users, Phone, User } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';

export default function TeacherGroups() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const teacherId = parseInt(localStorage.getItem('user_id') || '0', 10);

  useEffect(() => {
    Promise.all([api.getCourses(teacherId), api.getStudents()]).then(([c, s]) => {
      setCourses(c);
      setStudents(s);
      if (c.length > 0) {
        setSelectedCourse(c[0].id?.toString() || '');
        loadEnrollments(c[0].id as number);
      }
    }).finally(() => setLoading(false));
  }, [teacherId]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));
      setEnrolledStudentIds(enrolledIds);
    } catch (e) {
      console.error('Error loading enrollments:', e);
    }
  };

  const groupStudents = useMemo(() => {
    return students.filter(s => enrolledStudentIds.has(s.id as number));
  }, [enrolledStudentIds, students]);

  if (loading) return <div>{t('status.loading')}</div>;

  return (
    <div>
      <PageHeader title={t('admin.groups')} subtitle={t('admin.groupsSubtitle')} />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => {
            setSelectedCourse(c.id?.toString() || '');
            loadEnrollments(c.id as number);
          }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCourse === c.id?.toString() ? 'gradient-primary text-primary-foreground shadow-md' : 'glass hover:bg-muted/50'
              }`}>
            {c.name}
            <span className="ml-2 text-xs opacity-75">({enrolledStudentIds.size})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupStudents.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <img src={s.avatar || 'https://i.pravatar.cc/150'} alt={s.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {groupStudents.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No students in this group</p>
        </div>
      )}
    </div>
  );
}
