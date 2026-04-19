import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Users, BookOpen, TrendingUp, UserCheck, Zap, Award, Target } from 'lucide-react';
import { api, Course, Student } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [perfs, setPerfs] = useState<any[]>([]);
  const [attends, setAttends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [newScore, setNewScore] = useState('');
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const [courseEnrollments, setCourseEnrollments] = useState<{ [key: number]: number }>({});

  const currentTeacherId = parseInt(localStorage.getItem('user_id') || '0', 10);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getStudents(), api.getPerformance(), api.getAttendance()])
      .then(([allCourses, s, p, a]) => {
        const teacherCourses = allCourses.filter(course => course.teacher_id === currentTeacherId);
        setCourses(teacherCourses);
        setStudents(s);
        setPerfs(p);
        setAttends(a);
        if (teacherCourses.length > 0) {
          setSelectedCourse(teacherCourses[0].id?.toString() || '');
          loadEnrollments(teacherCourses[0].id as number);
          
          Promise.all(teacherCourses.map(course => 
            api.getEnrollments(course.id).then(enrollments => ({
              courseId: course.id,
              count: enrollments.length
            }))
          )).then(results => {
            const enrollmentMap: { [key: number]: number } = {};
            results.forEach(result => {
              enrollmentMap[result.courseId] = result.count;
            });
            setCourseEnrollments(enrollmentMap);
          }).catch(e => console.error('Error loading enrollments:', e));
        }
      }).finally(() => setLoading(false));
  }, [currentTeacherId]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));
      setEnrolledStudentIds(enrolledIds);
    } catch (e) {
      console.error('Error loading enrollments:', e);
    }
  };

  const courseStudents = useMemo(() => {
    return students.filter(s => enrolledStudentIds.has(s.id as number));
  }, [enrolledStudentIds, students]);

  const studentPerf = useMemo(() => {
    if (!selectedStudent || !selectedCourse) return [];
    return perfs.filter(p => p.student_id.toString() === selectedStudent && p.course_id.toString() === selectedCourse);
  }, [selectedStudent, selectedCourse, perfs]);

  const totalStudents = useMemo(() => {
    let totalIds = new Set<number>();
    courses.forEach(c => {
      enrolledStudentIds.forEach(id => totalIds.add(id));
    });
    return totalIds.size;
  }, [courses, enrolledStudentIds]);

  const avgPerformance = useMemo(() => {
    if (perfs.length === 0) return 0;
    return Math.round(perfs.reduce((s, p) => s + p.score, 0) / perfs.length);
  }, [perfs]);

  const todayAttendance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const records = attends.filter(a => a.date === today && courses.some(c => c.id === a.course_id));
    if (records.length === 0) return 0;
    return Math.round((records.filter(r => r.status === 'present').length / records.length) * 100);
  }, [courses, attends]);

  const chartData = {
    labels: studentPerf.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'Baho',
      data: studentPerf.map(p => p.score),
      borderColor: 'hsl(262, 83%, 58%)',
      backgroundColor: 'hsla(262, 83%, 58%, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'hsl(262, 83%, 58%)',
    }],
  };

  const handleAddScore = async () => {
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('0-100 orasida baho kiriting');
      return;
    }
    try {
      await api.createPerformance({
        student_id: parseInt(selectedStudent),
        course_id: parseInt(selectedCourse),
        score: score,
        date: new Date().toISOString().split('T')[0],
        type: 'exam',
        label: 'Kiritilgan'
      });
      setPerfs(prev => [...prev, { student_id: parseInt(selectedStudent), course_id: parseInt(selectedCourse), score }]);
      toast.success(`${score}% baho qo'shildi`);
      setNewScore('');
    } catch (e) {
      toast.error('Baho qo\'shishda xato');
    }
  };

  if (loading) return <div className="p-10 opacity-50 flex items-center justify-center text-white">{t('status.loading')}</div>;

  const stats = [
    { title: 'Kurslar', value: courses.length, icon: BookOpen, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { title: 'O\'quvchilar', value: totalStudents, icon: Users, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { title: 'Davomatligi', value: `${todayAttendance}%`, icon: UserCheck, color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { title: 'O\'rtacha Baho', value: `${avgPerformance}%`, icon: Award, color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pb-32 sm:pb-20">
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

          {/* TELEGRAM STYLE HEADER */}
          <motion.div variants={{ hidden: { opacity: 0, y: -15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 p-5 sm:p-7 md:p-10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-purple-100/70 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 sm:mb-2">O'qituvchi Paneli</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Salom, O'qituvchi!</h1>
                <p className="text-purple-100/60 text-xs sm:text-sm mt-1">O'quvchilaringizni boshqaring va kuzatib boring</p>
              </div>
              <Target className="w-10 h-10 sm:w-12 sm:h-12 text-white opacity-60 flex-shrink-0" />
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

          {/* MAIN CONTENT - Controls + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* LEFT: SCORING PANEL - Telegram Style */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="lg:col-span-1 rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur-sm h-fit">
              <h3 className="text-lg sm:text-xl font-black text-white mb-1 sm:mb-2">Baholash</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8">O'quvchiga baho berish</p>

              <div className="space-y-4 sm:space-y-5">
                {/* Course Dropdown */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Kurs</label>
                  <select
                    value={selectedCourse || ''}
                    onChange={e => {
                      const cid = e.target.value;
                      setSelectedCourse(cid);
                      loadEnrollments(parseInt(cid));
                      setSelectedStudent('');
                    }}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('teacher.selectCourse')}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Student Dropdown */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">O'quvchi</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">{t('teacher.selectStudent')}</option>
                    {courseStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Score Input */}
                <motion.div initial={false} animate={{ opacity: selectedStudent ? 1 : 0.5 }} className="space-y-3 sm:space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">Baho (0-100)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newScore}
                        onChange={e => setNewScore(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-center text-2xl sm:text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleAddScore}
                    disabled={!selectedStudent || !newScore}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Zap className="w-4 h-4 inline mr-2" />
                    Kiritish
                  </button>
                </motion.div>

                {/* Quick Info */}
                <div className="pt-4 sm:pt-6 border-t border-slate-700 space-y-2 sm:space-y-3">
                  {selectedCourse && (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-400">O'quvchilar:</span>
                        <span className="text-white font-bold">{courseStudents.length}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-400">Baholangan:</span>
                        <span className="text-white font-bold">{perfs.filter(p => p.course_id.toString() === selectedCourse).length}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* RIGHT: PERFORMANCE CHART */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-2 rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur-sm">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-black text-white mb-1">Baho Tahlili</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{selectedStudent ? 'Tanlangan o\'quvchi' : 'O\'quvchini tanlang'}</p>
              </div>
              {selectedStudent && studentPerf.length > 0 ? (
                <div className="h-48 sm:h-56 md:h-64">
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#fff', font: { size: 11, weight: 'bold' } } },
                        filler: { propagate: true }
                      },
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                          grid: { color: 'rgba(148, 163, 184, 0.1)' },
                          ticks: { color: '#cbd5e1', font: { size: 10 } }
                        },
                        x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10 } } }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center text-slate-400 text-sm">
                  {selectedStudent ? "Ma'lumot yo'q" : 'O\'quvchini tanlang'}
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
