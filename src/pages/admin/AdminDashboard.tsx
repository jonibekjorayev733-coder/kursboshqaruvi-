import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, UserCheck, Zap, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, Course } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { useLanguage } from '@/hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async () => {
      const [students, teachers, courses, payments] = await Promise.all([
        api.getStudents(),
        api.getTeachers(),
        api.getCourses(),
        api.getPayments(),
      ]);
      const courseEnrollments = await api.getEnrollmentCounts(courses.map((course) => course.id as number));
      return { students, teachers, courses, payments, courseEnrollments };
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const customEvent = event as CustomEvent<{ event?: string }>;
      const eventName = customEvent.detail?.event || '';

      if (
        eventName.startsWith('course.')
        || eventName.startsWith('teacher.')
        || eventName.startsWith('student.')
        || eventName.startsWith('enrollment.')
        || eventName.startsWith('payment.')
        || eventName.startsWith('attendance.')
        || eventName.startsWith('lesson.')
      ) {
        void refetch();
      }
    };

    window.addEventListener('edugrow-realtime-event', handleRealtime as EventListener);
    return () => window.removeEventListener('edugrow-realtime-event', handleRealtime as EventListener);
  }, [refetch]);

  const counts = {
    students: data?.students.length ?? 0,
    teachers: data?.teachers.length ?? 0,
    courses: data?.courses.length ?? 0,
  };
  const coursesList: Course[] = data?.courses ?? [];
  const allPayments = data?.payments ?? [];
  const courseEnrollments = data?.courseEnrollments ?? {};

  const totalRevenue = useMemo(() => allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [allPayments]);
  const unpaidTotal = useMemo(() => allPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0), [allPayments]);

  if (isLoading) {
    return <div className="p-10 opacity-50 flex items-center justify-center text-white">{t('status.loading')}</div>;
  }

  const revenueChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { 
        label: 'Daromad', 
        data: [2500, 3200, 2800, 4100, 3700, 4200],
        backgroundColor: 'hsl(199, 89%, 48%)',
        borderRadius: 8,
        borderSkipped: false
      },
      { 
        label: 'To\'liq bo\'lmagan', 
        data: [800, 600, 700, 500, 600, 400],
        backgroundColor: 'hsl(0, 84%, 60%)',
        borderRadius: 8,
        borderSkipped: false
      },
    ],
  };

  const courseDistribution = {
    labels: coursesList.slice(0, 5).map(c => c.name.substring(0, 10)),
    datasets: [{
      data: coursesList.slice(0, 5).map(c => courseEnrollments[c.id] || 0),
      backgroundColor: ['hsl(199, 89%, 48%)', 'hsl(280, 85%, 65%)', 'hsl(39, 100%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(348, 83%, 47%)'],
      borderWidth: 0,
    }],
  };

  const statItems = [
    { title: 'O\'quvchilar', value: counts.students, icon: Users, bg: 'from-slate-900/90 to-blue-950/70', color: 'text-cyan-300' },
    { title: 'O\'qituvchilar', value: counts.teachers, icon: GraduationCap, bg: 'from-slate-900/90 to-blue-950/70', color: 'text-blue-300' },
    { title: 'Kurslar', value: counts.courses, icon: BookOpen, bg: 'from-slate-900/90 to-blue-950/70', color: 'text-indigo-300' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pb-32 sm:pb-20">
      
      {/* SAFE PADDING CONTAINER */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

          {/* PREMIUM HEADER CARD - Bank Style */}
          <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 p-5 sm:p-7 md:p-10 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-8">
              <div className="flex-1">
                <p className="text-cyan-100/70 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">Admin Panel</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">Bosh Boshqarma</h1>
                <p className="text-cyan-100/60 text-xs sm:text-sm mt-1">Barcha statistika va ma'lumotlar birgalikda</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2">Jami Daromad</p>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          {/* QUICK STATS - 3 Column Mobile Cards */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-3 gap-3 sm:gap-4">
            {statItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -2 }} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bg} border border-white/10 p-4 sm:p-5 md:p-6 shadow-lg backdrop-blur-sm`}>
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${stat.color} opacity-80`} />
                  </div>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CHARTS - Full Width Responsive */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-1">Daromad Tahlili</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Oylik daromad statistikasi</p>
            </div>
            <div className="h-48 sm:h-56 md:h-72 overflow-hidden rounded-xl">
              <Bar data={revenueChart} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#fff', font: { size: 11, weight: 'bold' }, padding: 15 } }
                },
                scales: {
                  y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#cbd5e1', font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10 } } }
                }
              }} />
            </div>
          </motion.div>

          {/* BOTTOM METRICS - 3 Cards */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Outstanding Payments */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/70 border border-blue-500/20 p-5 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">To'lov Qarz</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-300">${unpaidTotal.toLocaleString()}</p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-blue-300 opacity-50" />
              </div>
              <div className="h-1 bg-blue-500/30 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-blue-500" />
              </div>
            </motion.div>

            {/* Active Users */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/70 border border-blue-500/20 p-5 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Aktiv Foydalanuvchilar</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400">{counts.students + counts.teachers}</p>
                </div>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 opacity-50" />
              </div>
              <div className="h-1 bg-cyan-500/30 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 1.5, delay: 0.6 }} className="h-full bg-cyan-500" />
              </div>
            </motion.div>

            {/* Completion Rate */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/70 border border-blue-500/20 p-5 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Dars Bajarilishi</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-300">92%</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300 opacity-50" />
              </div>
              <div className="h-1 bg-indigo-500/30 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-indigo-500" />
              </div>
            </motion.div>

          </motion.div>

          {/* COURSE DISTRIBUTION */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-800/50 border border-slate-700/50 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-1">Kurslar Taqsimi</h3>
              <p className="text-slate-400 text-xs sm:text-sm">O'quvchi soni bo'yicha taqsim</p>
            </div>
            {coursesList.length > 0 ? (
              <div className="h-48 sm:h-56 md:h-72 flex items-center justify-center">
                <Doughnut data={courseDistribution} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#cbd5e1', font: { size: 10, weight: 'bold' }, padding: 10 }
                    }
                  }
                }} />
              </div>
            ) : (
              <div className="h-48 sm:h-56 md:h-72 flex items-center justify-center text-slate-400 text-sm">{t('status.empty')}</div>
            )}
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
