import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { BookOpen, TrendingUp, Clock, Award, AlertCircle, Check, ArrowUpRight, Zap, Users, GraduationCap } from 'lucide-react';
import { api, Course } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const { t } = useLanguage();
  const { theme } = useAppContext();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [perfs, setPerfs] = useState<any[]>([]);
  const [attends, setAttends] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<{ [key: number]: number }>({});
  const enrollmentCountsMetaRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });

  const currentStudentIdRaw = localStorage.getItem('user_id');
  const currentStudentId = currentStudentIdRaw ? parseInt(currentStudentIdRaw, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(currentStudentId)) {
      setMyCourses([]);
      setPerfs([]);
      setAttends([]);
      setAssignments([]);
      setCourseEnrollments({});
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const [courses, performance, attendance, assigns, studentEnrollments] = await Promise.all([
          api.getCourses(),
          api.getPerformance(),
          api.getAttendance(),
          api.getAssignments(),
          api.getStudentEnrollments(currentStudentId),
        ]);

        const enrolledCourseIds = new Set<number>(studentEnrollments.map((en: any) => en.course_id));
        const mine = courses.filter((course: any) => enrolledCourseIds.has(course.id));

        setMyCourses(mine);
        setPerfs(performance.filter((item: any) => item.student_id === currentStudentId));
        setAttends(attendance.filter((item: any) => item.student_id === currentStudentId));

        const myAssignments = assigns.filter((assign: any) => {
          if (assign.student_id === currentStudentId) return true;
          if (assign.student_id === null && enrolledCourseIds.has(assign.course_id)) return true;
          return false;
        });
        setAssignments(myAssignments);

        const courseKey = mine.map((course: any) => course.id).sort((a: number, b: number) => a - b).join(',');
        const now = Date.now();
        const shouldRefreshCounts =
          enrollmentCountsMetaRef.current.key !== courseKey ||
          now - enrollmentCountsMetaRef.current.at > 60000;

        if (shouldRefreshCounts && mine.length > 0) {
          const enrollmentCounts = await Promise.all(
            mine.map((course: any) =>
              api.getEnrollments(course.id).then((enrollments: any[]) => ({
                courseId: course.id,
                count: enrollments.length,
              }))
            )
          );

          const enrollmentMap: { [key: number]: number } = {};
          enrollmentCounts.forEach((entry) => {
            enrollmentMap[entry.courseId] = entry.count;
          });
          setCourseEnrollments(enrollmentMap);
          enrollmentCountsMetaRef.current = { key: courseKey, at: now };
        }
      } catch (error) {
        console.error('Student dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [currentStudentId]);

  const avgAttendance = useMemo(() => {
    if (attends.length === 0) return 0;
    return Math.round((attends.filter(a => a.status === 'present').length / attends.length) * 100);
  }, [attends]);

  const avgGrade = useMemo(() => {
    if (perfs.length === 0) return 0;
    return Math.round(perfs.reduce((s, p) => s + p.score, 0) / perfs.length);
  }, [perfs]);

  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const pendingCount = assignments.filter((a: any) => !a.submitted).length;

  const performanceChart = {
    labels: perfs.map((_, i) => `T${i + 1}`),
    datasets: [{
      label: 'Score',
      data: perfs.map(p => p.score),
      backgroundColor: 'hsl(142, 71%, 45%)',
    }],
  };

  const attendanceChart = {
    labels: [t('teacher.present'), t('teacher.late'), t('teacher.absent')],
    datasets: [{
      data: [
        attends.filter(a => a.status === 'present').length,
        attends.filter(a => a.status === 'late').length,
        attends.filter(a => a.status === 'absent').length,
      ],
      backgroundColor: ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(348, 83%, 47%)'],
      borderWidth: 0,
    }],
  };

  if (loading) return <div className="p-10 opacity-50 flex items-center justify-center text-center">{t('status.loading')}</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }} className="mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-8">
      
      {/* PREMIUM HEADER WITH GRADIENT */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 shadow-2xl sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">Xush Kelibsiz!</h1>
              <p className="text-sm font-medium text-emerald-50 sm:text-base md:text-lg">O'quv jarayonida siz olib borayotgan taraqqiyatingizni ko'ring</p>
            </div>
            <GraduationCap className="h-16 w-16 self-end text-white opacity-80 sm:h-20 sm:w-20 md:h-24 md:w-24 md:self-auto" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
              <p className="text-white font-semibold">{myCourses.length} kurs</p>
            </div>
            {pendingCount > 0 && <div className="px-4 py-2 rounded-full bg-red-500/30 backdrop-blur-md border border-red-400/50"><p className="text-white font-semibold">{pendingCount} vazifa kutmoqda</p></div>}
          </div>
        </div>
      </motion.div>

      {/* STATS CARDS - PRO DESIGN */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {[
          { title: t('student.enrolledCourses'), value: myCourses.length, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
          { title: t('student.averageGrade'), value: `${avgGrade}%`, icon: Award, color: 'from-emerald-500 to-teal-500' },
          { title: t('admin.attendanceRate'), value: `${avgAttendance}%`, icon: Clock, color: 'from-orange-500 to-red-500' },
          { title: t('student.tasksCompleted'), value: perfs.length, icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} className={`group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${stat.color} p-5 shadow-xl sm:p-6`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70 sm:text-sm">{stat.title}</span>
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md sm:p-3"><Icon className="h-5 w-5 text-white" /></div>
                </div>
                <p className="text-3xl font-black tracking-tight text-white sm:text-4xl">{stat.value}</p>
                <p className="text-white/60 text-xs mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Faoliyat koʻpayishi</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } }} className="group overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/20 sm:p-6 lg:col-span-2 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-black text-white sm:text-2xl">Faoliyat Traektoriyas</h3>
              <p className="text-slate-400 text-sm">O'quvchilik o'quv davomida baholash dinamikasi</p>
            </div>
            <Zap className="w-6 h-6 text-cyan-400 opacity-60" />
          </div>
          {perfs.length > 0 ? (
            <div className="h-72 overflow-hidden rounded-2xl sm:h-96">
              <Bar data={performanceChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { display: false } } }} />
            </div>
          ) : <p className="text-slate-400 py-20 text-center">{t('status.empty')}</p>}
        </motion.div>

        {/* Attendance Doughnut */}
        <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }} className="overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-black text-white sm:text-2xl">Davomatlik</h3>
              <p className="text-slate-400 text-sm">Sinfga qatnashish oʻzsiz</p>
            </div>
            <Users className="w-6 h-6 text-purple-400 opacity-60" />
          </div>
          {attends.length > 0 ? (
            <div className="flex h-56 items-center justify-center sm:h-64">
              <Doughnut data={attendanceChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }} />
            </div>
          ) : <p className="text-slate-400 py-20 text-center">{t('status.empty')}</p>}
        </motion.div>
      </div>

      {/* MY COURSES SECTION */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <div className="mb-6">
          <h2 className="text-3xl font-black text-white mb-2">Mening Kurslarim</h2>
          <p className="text-slate-400">Siz ro'yxatdan o'tgan kurslar va tayyorgarlik</p>
        </div>
        {myCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {myCourses.map((course, i) => (
              <motion.div key={course.id} whileHover={{ y: -6 }} className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="h-32 bg-gradient-to-br from-cyan-500 to-blue-600 p-6 flex items-end relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,.1) 75%)' }} />
                  <div className="relative z-10">
                    <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-2">KURS</p>
                    <h3 className="text-xl font-black text-white">{course.name}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center"><BookOpen className="w-4 h-4 text-white" /></div>
                      <span className="text-slate-300 text-sm font-semibold">{courseEnrollments[course.id] || 0} Talaba</span>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">Ko'rish</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : <p className="text-slate-400 py-12 text-center">{t('status.empty')}</p>}
      </motion.div>

      {/* PENDING ASSIGNMENTS - PRO DESIGN */}
      {pendingCount > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="rounded-3xl overflow-hidden bg-gradient-to-br from-red-900/30 via-orange-900/30 to-yellow-900/30 border-2 border-orange-500/50 shadow-2xl backdrop-blur-xl">
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/30 backdrop-blur-md"><AlertCircle className="w-8 h-8 text-orange-400" /></div>
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Diqqat: {pendingCount} Vazifa Kutmoqda</h3>
                <p className="text-orange-200/80 text-sm">Ushbu vazifalarni qabul qilish uchun tugmani bosing</p>
              </div>
            </div>
            <div className="space-y-3">
              {assignments.filter((a: any) => !a.submitted).map((assignment: any) => (
                <motion.div key={assignment.id} whileHover={{ x: 4 }} className="group flex flex-col gap-3 rounded-xl border border-orange-500/30 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/15 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white transition-colors group-hover:text-orange-300">{assignment.title}</p>
                    <p className="mt-1 text-sm text-orange-200/70">{assignment.description}</p>
                  </div>
                  <Button
                    className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 font-black text-white shadow-lg transition-all hover:from-orange-600 hover:to-red-700 hover:shadow-orange-500/50 sm:ml-4 sm:w-auto"
                    size="sm"
                    disabled={submittingId === assignment.id}
                    onClick={async () => {
                      setSubmittingId(assignment.id);
                      try {
                        await api.submitAssignment(assignment.id);
                        setAssignments(assignments.map(a => a.id === assignment.id ? { ...a, submitted: true } : a));
                      } catch (err) {
                        console.error('Error submitting assignment:', err);
                      } finally {
                        setSubmittingId(null);
                      }
                    }}
                  >
                    {submittingId === assignment.id ? (
                      <><span className="animate-spin">⏳</span>Jarayonda...</>
                    ) : (
                      <><Check className="w-4 h-4" />Qabul qilish</>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
