import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BookOpen, TrendingUp, Clock, Award, AlertCircle, Check, ArrowUpRight, Zap, Users } from 'lucide-react';
import { api, Course } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';

export default function StudentDashboard() {
  const { t } = useLanguage();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [perfs, setPerfs] = useState<any[]>([]);
  const [attends, setAttends] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseEnrollments, setCourseEnrollments] = useState<{ [key: number]: number }>({});

  const currentStudentIdRaw = localStorage.getItem('user_id');
  const currentStudentId = currentStudentIdRaw ? parseInt(currentStudentIdRaw, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(currentStudentId)) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
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
      } catch (error) {
        console.error('Student dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [currentStudentId]);

  const avgScore = useMemo(() => {
    if (perfs.length === 0) return 0;
    return Math.round(perfs.reduce((s, p) => s + p.score, 0) / perfs.length);
  }, [perfs]);

  const totalAttended = useMemo(() => {
    return attends.filter(a => a.status === 'present').length;
  }, [attends]);

  const attendanceRate = useMemo(() => {
    if (attends.length === 0) return 0;
    return Math.round((totalAttended / attends.length) * 100);
  }, [attends, totalAttended]);

  const completedAssignments = useMemo(() => {
    return assignments.filter(a => a.status === 'completed').length;
  }, [assignments]);

  if (loading) return <div className="p-10 opacity-50 flex items-center justify-center text-white">{t('status.loading')}</div>;

  const stats = [
    { title: 'Kurslar', value: myCourses.length, icon: BookOpen, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { title: 'O\'rtacha Baho', value: `${avgScore}%`, icon: Award, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { title: 'Davomatligi', value: `${attendanceRate}%`, icon: Check, color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { title: 'Topshiriqlar', value: `${completedAssignments}/${assignments.length}`, icon: Zap, color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pb-32 sm:pb-20">
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

          {/* PREMIUM HEADER - Mobile App Style */}
          <motion.div variants={{ hidden: { opacity: 0, y: -15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 sm:p-7 md:p-10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-emerald-100/70 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 sm:mb-2">O'quvchi Paneli</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Salom!</h1>
                <p className="text-emerald-100/60 text-xs sm:text-sm mt-1">O'quv progressingizni kuzatib boring</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2">Dars Sanasi</p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-white">{new Date().toLocaleDateString('uz-UZ')}</p>
              </div>
            </div>
          </motion.div>

          {/* STATS GRID - 2x2 Mobile, 4 Desktop */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -2 }} className={`rounded-2xl bg-gradient-to-br ${stat.color} border border-white/10 p-4 sm:p-5 md:p-6 shadow-lg backdrop-blur-sm`}>
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${stat.iconColor} opacity-80`} />
                  </div>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* MY COURSES - Cards */}
          {myCourses.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="space-y-3 sm:space-y-4">
              <div className="px-0.5">
                <h2 className="text-lg sm:text-xl font-black text-white mb-1">Mening Kurslar</h2>
                <p className="text-slate-400 text-xs sm:text-sm">{myCourses.length} ta kursga yozilgansiz</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {myCourses.map((course, i) => (
                  <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } }} whileHover={{ y: -2 }} className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-700/50 p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-black text-white mb-1 line-clamp-2">{course.name}</h3>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <p className="text-xs text-slate-400">{courseEnrollments[course.id] || 0} o'quvchi</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-black text-cyan-400">{perfs.filter(p => p.course_id === course.id).length}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">baholangan</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (perfs.filter(p => p.course_id === course.id).length / 10) * 100)}%` }}
                        transition={{ duration: 1.5, delay: 0.3 + i * 0.1 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PERFORMANCE CHART */}
          {perfs.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur-sm">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-black text-white mb-1">Baho Statistikasi</h3>
                <p className="text-slate-400 text-xs sm:text-sm">Jami {perfs.length} ta baho</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-48 sm:h-64">
                  <Doughnut
                    data={{
                      labels: ['85-100', '70-84', '60-69', '< 60'],
                      datasets: [{
                        data: [
                          perfs.filter(p => p.score >= 85).length,
                          perfs.filter(p => p.score >= 70 && p.score < 85).length,
                          perfs.filter(p => p.score >= 60 && p.score < 70).length,
                          perfs.filter(p => p.score < 60).length,
                        ],
                        backgroundColor: ['hsl(142, 71%, 45%)', 'hsl(199, 89%, 48%)', 'hsl(39, 100%, 50%)', 'hsl(0, 84%, 60%)'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#cbd5e1', font: { size: 11, weight: 'bold' }, padding: 12 }
                        }
                      }
                    }}
                  />
                </div>
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <div className="space-y-3 sm:space-y-4 w-full">
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                      <p className="text-slate-400 text-xs sm:text-sm mb-1">Eng Yuqori Baho</p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400">{Math.max(...perfs.map(p => p.score))}%</p>
                    </div>
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                      <p className="text-slate-400 text-xs sm:text-sm mb-1">O'rtacha Baho</p>
                      <p className="text-2xl sm:text-3xl font-black text-cyan-400">{avgScore}%</p>
                    </div>
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                      <p className="text-slate-400 text-xs sm:text-sm mb-1">Eng Quyi Baho</p>
                      <p className="text-2xl sm:text-3xl font-black text-purple-400">{Math.min(...perfs.map(p => p.score))}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ASSIGNMENTS - List */}
          {assignments.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur-sm">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-black text-white mb-1">Topshiriqlar</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{completedAssignments} / {assignments.length} bajarildi</p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {assignments.map((assignment, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 transition-colors group cursor-pointer">
                    <button
                      onClick={() => {
                        if (currentStudentId && !Number.isNaN(currentStudentId)) {
                          const nextStatus = 
                            assignment.status === 'completed' ? 'in_progress' :
                            assignment.status === 'in_progress' ? 'accepted' : 'in_progress';
                          api.updateAssignmentStatus(assignment.id, currentStudentId, nextStatus)
                            .then(() => {
                              setAssignments(prev => prev.map(a => 
                                a.id === assignment.id ? { ...a, status: nextStatus } : a
                              ));
                            })
                            .catch(err => console.error('Status update error:', err));
                        }
                      }}
                      className="flex-shrink-0 focus:outline-none"
                    >
                      {assignment.status === 'completed' ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/30 border border-emerald-500 flex items-center justify-center group-hover:bg-emerald-500/50 transition-colors">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                        </div>
                      ) : assignment.status === 'in_progress' ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-500/30 border border-cyan-500 flex items-center justify-center group-hover:bg-cyan-500/50 transition-colors">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-600/30 border border-slate-500 flex items-center justify-center group-hover:bg-slate-500/50 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{assignment.title || 'Topshiriq'}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">Topshiriq: {assignment.date || 'Belgilanmagan'}</p>
                    </div>
                    {assignment.status === 'completed' && (
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-400 flex-shrink-0">BAJARILDI</span>
                    )}
                    {assignment.status === 'in_progress' && (
                      <span className="text-[10px] sm:text-xs font-bold text-cyan-400 flex-shrink-0">JARAYONDA</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
