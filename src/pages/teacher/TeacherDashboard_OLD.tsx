import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Users, BookOpen, TrendingUp, UserCheck, Zap, Award, BarChart3, Target } from 'lucide-react';
import { api, Course, Student } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function TeacherDashboard() {
  const { theme } = useAppContext();
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
          
          // Load enrollments for all courses
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

  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const chartData = {
    labels: studentPerf.map((_, i) => `Entry ${i + 1}`),
    datasets: [{
      label: 'Score',
      data: studentPerf.map(p => p.score),
      borderColor: 'hsl(262, 83%, 58%)',
      backgroundColor: 'hsla(262, 83%, 58%, 0.1)',
      fill: true, tension: 0.4, pointRadius: 5, pointHoverRadius: 8,
      pointBackgroundColor: 'hsl(262, 83%, 58%)',
    }],
  };

  const handleAddScore = async () => {
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > 100) { toast.error('Enter a valid score (0-100)'); return; }

    try {
      const data = await api.createPerformance({
        student_id: parseInt(selectedStudent),
        course_id: parseInt(selectedCourse),
        date: new Date().toISOString().split('T')[0],
        score: score,
        type: 'exam',
        label: 'Custom Entry'
      });
      setPerfs(prev => [...prev, data]);
      toast.success(`Score ${score}% added`);
      setNewScore('');
    } catch (e) {
      toast.error('Failed to log performance');
    }
  };

  if (loading) return <div className="p-10 opacity-50 flex items-center justify-center">{t('status.loading')}</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }} className="mx-auto w-full max-w-[1440px] space-y-4 sm:space-y-6 md:space-y-8">
      
      {/* PREMIUM HEADER - Mobile Optimized */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg sm:shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="mb-1 sm:mb-2 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">Xush Kelibsiz, O'qituvchi!</h1>
              <p className="text-xs sm:text-sm font-medium text-blue-50 md:text-base lg:text-lg">O'quvchilaringizning o'quv jarayonini boshqaring</p>
            </div>
            <Target className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-white opacity-80 self-end md:self-auto flex-shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* STATS CARDS - Mobile Responsive */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-4">
        {[
          { title: 'Aktiv Kurslar', value: courses.length, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
          { title: 'Jami O\'quvchilar', value: totalStudents, icon: Users, color: 'from-purple-500 to-pink-500' },
          { title: 'Bugun Davomatligi', value: `${todayAttendance}%`, icon: UserCheck, color: 'from-emerald-500 to-teal-500' },
          { title: 'O\'rtacha Baho', value: `${avgPerformance}%`, icon: Award, color: 'from-orange-500 to-red-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }} className={`group cursor-pointer overflow-hidden rounded-lg sm:rounded-2xl border border-white/10 bg-gradient-to-br ${stat.color} p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg sm:shadow-xl transition-all`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
              <div className="relative z-10">
                <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 md:text-sm">{stat.title}</span>
                  <div className="rounded-lg sm:rounded-xl bg-white/20 p-1.5 sm:p-2 md:p-2.5 backdrop-blur-md"><Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></div>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">{stat.value}</p>
                <p className="text-white/60 text-[10px] sm:text-xs mt-1.5 sm:mt-2 flex items-center gap-1"><Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Real vaqt kuzatish</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* MAIN CONTENT GRID - Mobile Stack */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:gap-6 lg:grid-cols-3">
        {/* LEFT: CONTROLS PANEL */}
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } }} className="h-fit overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl">
          <div className="mb-6 sm:mb-8">
              <h3 className="mb-1 sm:mb-2 text-lg sm:text-xl md:text-2xl font-black text-white">Baholash Paneli</h3>
            <p className="text-slate-400 text-xs sm:text-sm">O'quvchiga baho berish</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Course Select */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300">Kursni Tanlang</label>
              <div className="relative group">
                <select value={selectedCourse || ''} onChange={e => { 
                  const courseId = e.target.value;
                  setSelectedCourse(courseId); 
                  loadEnrollments(parseInt(courseId));
                  setSelectedStudent(''); 
                }} className="w-full bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-600/50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all font-semibold text-white appearance-none cursor-pointer hover:border-slate-500/80">
                  <option value="" className="bg-slate-900 text-white">{t('teacher.selectCourse')}</option>
                  {courses.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                </select>
                <BookOpen className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 opacity-50 pointer-events-none" />
              </div>
            </div>

            {/* Student Select */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300">O'quvchini Tanlang</label>
              <div className="relative group">
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-600/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-semibold text-white appearance-none cursor-pointer hover:border-slate-500/80">
                  <option value="" className="bg-slate-900 text-white">{t('teacher.selectStudent')}</option>
                  {courseStudents.map(s => <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>)}
                </select>
                <Users className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-purple-400 opacity-50 pointer-events-none" />
              </div>
            </div>

            {/* Score Input */}
            <motion.div initial={false} animate={{ opacity: selectedStudent ? 1 : 0.5, height: selectedStudent ? 'auto' : 0 }} className="space-y-3 sm:space-y-4 pt-2 overflow-hidden">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300">Baho (0-100)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} value={newScore} onChange={e => setNewScore(e.target.value)} placeholder="0" className="w-full bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xl sm:text-2xl font-black border border-slate-600/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white text-center" />
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm sm:text-base">%</span>
                </div>
              </div>

              <button onClick={handleAddScore} disabled={!selectedStudent || !newScore} className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 sm:px-5 py-2.5 sm:py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-700 hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                Baho Kiritish
              </button>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700/50 space-y-3 sm:space-y-4">
            <p className="text-slate-400 text-[9px] sm:text-xs font-semibold uppercase tracking-widest">Kurs Statistikasi</p>
            {selectedCourse && (
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">O'quvchilar:</span>
                  <span className="text-white font-bold">{courseStudents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Baholangan:</span>
                  <span className="text-white font-bold">{perfs.filter(p => p.course_id.toString() === selectedCourse).length}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT: CHART PANEL */}
        <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }} className="overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-2xl sm:p-6 lg:col-span-2 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-black text-white sm:text-2xl">Baholash Dinamikasi</h3>
              <p className="text-slate-400 text-sm">Tanlangan o'quvchining baho grafigi</p>
            </div>
            <BarChart3 className="w-6 h-6 text-purple-400 opacity-60" />
          </div>

          <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900/50 p-4 sm:h-96 sm:p-6">
            {studentPerf.length > 0 ? (
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { min: 0, max: 100, grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#cbd5e1', font: { weight: 'bold', size: 11 } } },
                  x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { weight: 'bold', size: 10 } } }
                },
              }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-semibold">{selectedStudent ? 'Ma\'lumot yo\'q' : 'O\'quvchini tanlang'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* COURSES LIST */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <div className="mb-6">
          <h2 className="text-3xl font-black text-white mb-2">Mening Kurslarim</h2>
          <p className="text-slate-400">Barcha faol kurslar va statistika</p>
        </div>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {courses.map((course) => (
              <motion.div key={course.id} whileHover={{ y: -6 }} className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex items-end relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,.1) 75%)' }} />
                  <div className="relative z-10">
                    <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-2">KURS</p>
                    <h3 className="text-xl font-black text-white">{course.name}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-slate-400 text-sm line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="text-xs text-slate-400">O'quvchilar</p>
                        <p className="text-white font-bold">{courseEnrollments[course.id] || 0}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">Boshqarish</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : <p className="text-slate-400 py-12 text-center">{t('status.empty')}</p>}
      </motion.div>

    </motion.div>
  );
}
