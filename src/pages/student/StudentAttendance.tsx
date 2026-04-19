import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useTranslation';
import { BookOpen, Check, X, Clock } from 'lucide-react';

export default function StudentAttendance() {
  const { t } = useLanguage();
  const [attends, setAttends] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // get current student from localStorage
  const currentStudentIdRaw = localStorage.getItem('user_id');
  const currentStudentId = currentStudentIdRaw ? parseInt(currentStudentIdRaw, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(currentStudentId)) {
      setAttends([]);
      setCourses([]);
      setLoading(false);
      return;
    }

    Promise.all([api.getAttendance(), api.getCourses()])
      .then(([att, crs]) => {
        setAttends(att.filter((a: any) => a.student_id === currentStudentId));
        setCourses(crs);
      })
      .finally(() => setLoading(false));
  }, [currentStudentId]);

  const courseMap = new Map(courses.map((c: any) => [c.id, c.name]));

  const statusConfig: Record<string, { label: string; icon: any; bg: string; text: string }> = {
    present: { label: 'Keldi', icon: Check, bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    absent:  { label: 'Kelmadi', icon: X,     bg: 'bg-red-500/20',     text: 'text-red-400' },
    late:    { label: 'Kech keldi', icon: Clock, bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  };

  // Summary stats
  const total   = attends.length;
  const present = attends.filter(a => a.status === 'present').length;
  const absent  = attends.filter(a => a.status === 'absent').length;
  const late    = attends.filter(a => a.status === 'late').length;

  if (loading) return (
    <div className="p-10 opacity-50 flex items-center justify-center">{t('status.loading')}</div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title={t('student.attendanceTitle')} subtitle={t('student.attendanceSubtitle')} />

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jami', value: total,   color: 'border-cyan-500/40 text-cyan-300' },
          { label: 'Keldi', value: present, color: 'border-emerald-500/40 text-emerald-300' },
          { label: 'Kelmadi', value: absent, color: 'border-red-500/40 text-red-300' },
          { label: 'Kech',  value: late,    color: 'border-yellow-500/40 text-yellow-300' },
        ].map(chip => (
          <div key={chip.label} className={`rounded-xl border bg-slate-800/60 px-4 py-3 ${chip.color}`}>
            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">{chip.label}</p>
            <p className="text-2xl font-black leading-6 mt-0.5">{chip.value}</p>
          </div>
        ))}
      </div>

      {/* Attendance list */}
      {attends.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-slate-700/50 bg-slate-800/30 text-slate-400">
          Hozircha davomat ma'lumoti yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {attends.sort((a, b) => b.date?.localeCompare(a.date)).map((att: any) => {
            const cfg = statusConfig[att.status] || statusConfig.absent;
            const StatusIcon = cfg.icon;
            const courseName = courseMap.get(att.course_id) || `Kurs #${att.course_id}`;
            return (
              <motion.div key={att.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 rounded-xl p-4 border ${cfg.bg} ${att.status === 'present' ? 'border-emerald-500/30' : att.status === 'late' ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                {/* Status icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      {courseName}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{att.date}</p>
                  {att.late_minutes ? (
                    <p className="text-yellow-400 text-xs mt-0.5">Kechikish: {att.late_minutes} daqiqa</p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
