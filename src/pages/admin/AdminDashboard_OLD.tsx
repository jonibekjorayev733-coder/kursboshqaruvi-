import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, UserCheck, Activity, Zap, Target, ArrowUpRight } from 'lucide-react';
import { payments, revenueData } from '@/data/mockData';
import { api, Course } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const { theme } = useAppContext();
  const { t } = useLanguage();
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const [counts, setCounts] = useState({ students: 0, teachers: 0, courses: 0 });
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    Promise.all([
      api.getStudents(),
      api.getTeachers(),
      api.getCourses(),
      api.getPayments()
    ]).then(([s, t, c, p]) => {
      setCounts({ students: s.length, teachers: t.length, courses: c.length });
      setCoursesList(c);
      setAllPayments(p);
      
      // Load enrollments for each course
      Promise.all(c.map(course => 
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
    }).catch(e => console.error(e));
  }, []);

  const totalRevenue = useMemo(() => allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [allPayments]);
  const unpaidTotal = useMemo(() => allPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0), [allPayments]);

  const revenueChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { 
        label: 'Daromad', 
        data: [
          allPayments.filter(p => p.status === 'paid' && p.month === 'January').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status === 'paid' && p.month === 'February').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status === 'paid' && p.month === 'March').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status === 'paid' && p.month === 'April').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status === 'paid' && p.month === 'May').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status === 'paid' && p.month === 'June').reduce((s, p) => s + p.amount, 0),
        ],
        backgroundColor: 'hsl(199, 89%, 48%)', 
        borderRadius: 8 
      },
      { 
        label: 'To\'liq bo\'lmagan', 
        data: [
          allPayments.filter(p => p.status !== 'paid' && p.month === 'January').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status !== 'paid' && p.month === 'February').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status !== 'paid' && p.month === 'March').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status !== 'paid' && p.month === 'April').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status !== 'paid' && p.month === 'May').reduce((s, p) => s + p.amount, 0),
          allPayments.filter(p => p.status !== 'paid' && p.month === 'June').reduce((s, p) => s + p.amount, 0),
        ],
        backgroundColor: 'hsl(0, 84%, 60%)', 
        borderRadius: 8 
      },
    ],
  };

  const courseDistribution = {
    labels: coursesList.map(c => c.name),
    datasets: [{
      data: coursesList.map(c => courseEnrollments[c.id] || 0),
      backgroundColor: ['hsl(199, 89%, 48%)', 'hsl(280, 85%, 65%)', 'hsl(39, 100%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(348, 83%, 47%)'],
      borderWidth: 0,
    }],
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      
      {/* SAFE AREA - Mobile Safe Padding */}
      <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8">
        
        {/* HEADER CARD - Bank Style */}
        <motion.div variants={{ hidden: { opacity: 0, y: -15 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-slate-700 p-6 sm:p-8 md:p-10 shadow-2xl mb-6 sm:mb-8">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-cyan-100/70 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">Admin Panel</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2">Bosh Boshqarma</h1>
                <p className="text-cyan-100/60 text-xs sm:text-sm max-w-sm">Barcha statistika va faoliyat birgalikda</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1">Jami Daromad</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUICK STATS - 2 Column Mobile, 4 Desktop */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { title: 'Jami O\'quvchilar', value: counts.students, icon: Users, color: 'from-cyan-500/20 to-cyan-500/10' },
          { title: 'O\'qituvchilar', value: counts.teachers, icon: GraduationCap, color: 'from-cyan-500/20 to-cyan-500/10' },
          { title: 'Aktiv Kurslar', value: counts.courses, icon: BookOpen, color: 'from-cyan-500/20 to-cyan-500/10' },
          { title: 'Umumiy Daromad', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-cyan-500/20 to-cyan-500/10' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }} className={`group cursor-pointer overflow-hidden rounded-lg sm:rounded-2xl border border-white/10 bg-gradient-to-br ${stat.color} p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg sm:shadow-xl transition-all`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 md:text-sm">{stat.title}</span>
                  <div className="rounded-lg sm:rounded-xl bg-white/20 p-1.5 sm:p-2 md:p-2.5 backdrop-blur-md"><Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></div>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">{stat.value}</p>
                <p className="text-white/60 text-[10px] sm:text-xs mt-1.5 sm:mt-2 flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Real vaqt ma'lumot</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CHARTS SECTION - Mobile Responsive Stack */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } }} className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:shadow-cyan-500/20 lg:col-span-2">
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="mb-0.5 sm:mb-1 text-lg sm:text-xl md:text-2xl font-black text-white">Daromad Tahlili</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Oylik daromad va to'liq bo'lmagan to'lovlar</p>
            </div>
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 opacity-60" />
          </div>
          <div className="h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden rounded-xl sm:rounded-2xl">
            <Bar data={revenueChart} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: 'white', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { weight: 'bold', size: 9 } } } },
              scales: { 
                y: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#cbd5e1', font: { weight: 'bold', size: 8 }, callback: v => `$${v}` } }, 
                x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { weight: 'bold', size: 8 } } } 
              },
            }} />
          </div>
        </motion.div>

        {/* Course Distribution */}
        <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }} className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:shadow-cyan-500/20">
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="mb-0.5 sm:mb-1 text-lg sm:text-xl md:text-2xl font-black text-white">Kurslar Taqsimi</h3>
              <p className="text-slate-400 text-xs sm:text-sm">O'quvchi sonining taqsimi</p>
            </div>
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 opacity-60" />
          </div>
          {coursesList.length > 0 ? (
            <div className="flex h-48 sm:h-56 md:h-64 lg:h-72 items-center justify-center">
              <Doughnut data={courseDistribution} options={{
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', usePointStyle: true, pointStyle: 'circle', padding: 8, font: { size: 8, weight: 'bold' } } } },
              }} />
            </div>
          ) : <div className="text-slate-400 py-12 sm:py-16 md:py-20 text-center text-sm">{t('status.empty')}</div>}
        </motion.div>
      </div>

      {/* KEY METRICS PANELS - Mobile Optimized */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:grid-cols-3">
        {/* Outstanding Payments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="group relative overflow-hidden rounded-lg sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30">
          <div className="absolute inset-0 rounded-lg sm:rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-2.5 md:p-3.5 rounded-lg sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/30"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400" /></div>
              <div className="flex-1">
                <p className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-400">To'liq bo'lmagan</p>
                <h4 className="text-sm sm:text-base md:text-lg font-black text-white">To'lov Qarz</h4>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 mb-3 sm:mb-4">${unpaidTotal.toLocaleString()}</p>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-[9px] sm:text-xs font-semibold text-slate-400">
                <span>{allPayments.filter(p => p.status !== 'paid').length} invoices</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '34%' }} transition={{ duration: 1.5, delay: 0.8 }} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Growth Rate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="group relative overflow-hidden rounded-lg sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30">
          <div className="absolute inset-0 rounded-lg sm:rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-2.5 md:p-3.5 rounded-lg sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/30"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400" /></div>
              <div className="flex-1">
                <p className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Faoliyat</p>
                <h4 className="text-sm sm:text-base md:text-lg font-black text-white">O'sish Sur'ati</h4>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 mb-3 sm:mb-4">+12%</p>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-[9px] sm:text-xs font-semibold text-slate-400">
                <span>Yangi o'quv qismlari</span>
                <span>82%</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, delay: 0.9 }} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="group relative overflow-hidden rounded-lg sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30">
          <div className="absolute inset-0 rounded-lg sm:rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-2.5 md:p-3.5 rounded-lg sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/30"><UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400" /></div>
              <div className="flex-1">
                <p className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Saqlanish</p>
                <h4 className="text-sm sm:text-base md:text-lg font-black text-white">Davomatligi</h4>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 mb-3 sm:mb-4">87%</p>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-[9px] sm:text-xs font-semibold text-slate-400">
                <span>Barcha kurslar orqali</span>
                <span>Barqaror</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ duration: 1.5, delay: 1 }} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      </div>
    </motion.div>
  );
}
