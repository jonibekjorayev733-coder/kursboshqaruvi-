import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useTranslation';
import { Award, BookOpen, CheckCircle2, Clock3, GraduationCap, XCircle } from 'lucide-react';

type PenaltyValue = 0 | 2 | 4;

function getPenaltyValue(attendance: any): PenaltyValue {
  if (attendance?.penalty_hours === 0 || attendance?.penalty_hours === 2 || attendance?.penalty_hours === 4) {
    return attendance.penalty_hours as PenaltyValue;
  }
  if (attendance?.status === 'present') return 0;
  if (attendance?.status === 'late') return 2;
  return 4;
}

export default function StudentAttendance() {
  const { t } = useLanguage();
  const [attends, setAttends] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentStudentIdRaw = localStorage.getItem('user_id');
  const currentStudentId = currentStudentIdRaw ? parseInt(currentStudentIdRaw, 10) : NaN;

  const loadAttendanceData = async () => {
    if (Number.isNaN(currentStudentId)) {
      setAttends([]);
      setCourses([]);
      setLessons([]);
      setLoading(false);
      return;
    }

    const [att, crs, lessonData] = await Promise.all([
      api.getAttendance({ studentId: currentStudentId }),
      api.getCourses(),
      api.getLessons(),
    ]);
    setAttends(att);
    setCourses(crs);
    setLessons(lessonData);
  };

  useEffect(() => {
    loadAttendanceData().finally(() => setLoading(false));
  }, [currentStudentId]);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const customEvent = event as CustomEvent<{ event?: string }>;
      const eventName = customEvent.detail?.event || '';

      if (eventName.startsWith('attendance.') || eventName === 'lesson.created' || eventName === 'notification.created') {
        loadAttendanceData().catch(() => undefined);
      }
    };

    window.addEventListener('edugrow-realtime-event', handleRealtime as EventListener);
    return () => window.removeEventListener('edugrow-realtime-event', handleRealtime as EventListener);
  }, [currentStudentId]);

  const courseMap = new Map(courses.map((course: any) => [course.id, course.name]));
  const lessonMap = new Map(lessons.map((lesson: any) => [lesson.id, lesson]));

  const statusConfig: Record<PenaltyValue, { label: string; icon: any; card: string; pill: string; text: string }> = {
    0: { label: '0 soat', icon: CheckCircle2, card: 'bg-emerald-500/10 border-emerald-500/30', pill: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-300' },
    2: { label: '2 soat', icon: Clock3, card: 'bg-amber-500/10 border-amber-500/30', pill: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-300' },
    4: { label: '4 soat', icon: XCircle, card: 'bg-rose-500/10 border-rose-500/30', pill: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-300' },
  };

  const sortedAttendance = useMemo(() => {
    return [...attends].sort((left, right) => {
      const leftLesson = lessonMap.get(left.lesson_id);
      const rightLesson = lessonMap.get(right.lesson_id);
      const leftStamp = leftLesson?.created_at || left.date || '';
      const rightStamp = rightLesson?.created_at || right.date || '';
      return String(rightStamp).localeCompare(String(leftStamp));
    });
  }, [attends, lessonMap]);

  const summary = useMemo(() => {
    const penalties = attends.map(getPenaltyValue);
    const zero = penalties.filter((value) => value === 0).length;
    const two = penalties.filter((value) => value === 2).length;
    const four = penalties.filter((value) => value === 4).length;
    const grades = attends
      .map((item) => item.grade)
      .filter((value) => typeof value === 'number' && !Number.isNaN(value));
    const averageGrade = grades.length > 0
      ? (grades.reduce((sum, value) => sum + value, 0) / grades.length).toFixed(1)
      : null;

    return {
      total: attends.length,
      zero,
      two,
      four,
      averageGrade,
    };
  }, [attends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 opacity-50">{t('status.loading')}</div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title={t('student.attendanceTitle')} subtitle={t('student.attendanceSubtitle')} />

      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Lesson asosida davomat</p>
            <h2 className="text-3xl font-black tracking-tight text-white">Mening lesson tarixim</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Har bir lesson uchun davomat holati, jarima soati va qo‘yilgan bahoni ko‘rib borasiz.</p>
          </div>
          <GraduationCap className="hidden h-16 w-16 text-cyan-300/60 sm:block" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Jami', value: summary.total, color: 'border-cyan-500/40 text-cyan-300' },
          { label: '0 soat', value: summary.zero, color: 'border-emerald-500/40 text-emerald-300' },
          { label: '2 soat', value: summary.two, color: 'border-amber-500/40 text-amber-300' },
          { label: '4 soat', value: summary.four, color: 'border-rose-500/40 text-rose-300' },
          { label: 'O‘rtacha baho', value: summary.averageGrade ?? '-', color: 'border-violet-500/40 text-violet-300' },
        ].map((chip) => (
          <div key={chip.label} className={`rounded-xl border bg-slate-800/60 px-4 py-3 ${chip.color}`}>
            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">{chip.label}</p>
            <p className="mt-0.5 text-2xl font-black leading-6">{chip.value}</p>
          </div>
        ))}
      </div>

      {sortedAttendance.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 py-14 text-center text-slate-400">
          Hozircha davomat ma'lumoti yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAttendance.map((attendance: any) => {
            const penalty = getPenaltyValue(attendance);
            const config = statusConfig[penalty];
            const StatusIcon = config.icon;
            const courseName = courseMap.get(attendance.course_id) || `Kurs #${attendance.course_id}`;
            const lesson = lessonMap.get(attendance.lesson_id);
            const lessonTitle = lesson?.topic || 'Lesson nomi topilmadi';
            const lessonDate = lesson?.created_at || attendance.date;

            return (
              <motion.div
                key={attendance.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-4 ${config.card}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.pill}`}>
                    <StatusIcon className={`h-5 w-5 ${config.text}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${config.pill} ${config.text}`}>
                          {config.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                          {courseName}
                        </span>
                      </div>

                      {typeof attendance.grade === 'number' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-black text-violet-200">
                          <Award className="h-3.5 w-3.5" />
                          {attendance.grade} ball
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-base font-black text-white">{lessonTitle}</p>
                    <p className="mt-1 text-xs text-slate-400">{lessonDate ? String(lessonDate).slice(0, 16).replace('T', ' • ') : attendance.date}</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-black text-slate-300">
                        Jarima: {penalty} soat
                      </span>
                      {attendance.late_minutes ? (
                        <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-200">
                          Kechikish: {attendance.late_minutes} daqiqa
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
