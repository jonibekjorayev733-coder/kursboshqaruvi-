import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen, DollarSign, Activity, PieChart, LineChart as LineChartIcon, BarChart3, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { LineChart, Line, BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: number;
  studentGrowth: Array<{ month: string; count: number }>;
  courseEnrollment: Array<{ name: string; value: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  activeUsers: number;
  completionRate: number;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const students = await api.getStudents().then(s => s.length);
      const teachers = await api.getTeachers().then(t => t.length);
      const courses = await api.getCourses().then(c => c.length);
      
      const mockData: AnalyticsData = {
        totalStudents: students,
        totalTeachers: teachers,
        totalCourses: courses,
        totalRevenue: 45000,
        studentGrowth: [
          { month: 'Yan', count: 120 },
          { month: 'Fev', count: 150 },
          { month: 'Mar', count: 180 },
          { month: 'Apr', count: 220 },
          { month: 'May', count: 280 },
          { month: 'Iyn', count: students }
        ],
        courseEnrollment: [
          { name: 'React', value: 45 },
          { name: 'Python', value: 38 },
          { name: 'JavaScript', value: 52 },
          { name: 'TypeScript', value: 41 }
        ],
        revenueByMonth: [
          { month: 'Yan', revenue: 5000 },
          { month: 'Fev', revenue: 6500 },
          { month: 'Mar', revenue: 7200 },
          { month: 'Apr', revenue: 8100 },
          { month: 'May', revenue: 9500 },
          { month: 'Iyn', revenue: 9200 }
        ],
        activeUsers: Math.round(students * 0.75),
        completionRate: 68
      };

      setAnalytics(mockData);
    } catch (error) {
      toast.error('Analitika yuklanishida xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    toast.success(`Analitika ${format.toUpperCase()} formatida yuklab olinmoqda...`);
  };

  if (loading || !analytics) {
    return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Analitika va Hisobotlar</h1>
              <p className="text-cyan-50 text-lg font-medium">Platforma faoliyatini real vaqt rejimida monitor qiling</p>
            </div>
            <Activity className="w-24 h-24 text-white opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-white font-black text-sm focus:outline-none"
            >
              <option value="week">Bu hafta</option>
              <option value="month">Bu oy</option>
              <option value="quarter">Bu chorak</option>
              <option value="year">Bu yil</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-white font-black text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-white font-black text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            CSV
          </motion.button>
        </div>
      </motion.div>

      {/* KEY METRICS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Jami O'quvchilar", value: analytics.totalStudents, color: 'from-blue-600 to-blue-500' },
          { icon: BookOpen, label: "Jami O'qituvchilar", value: analytics.totalTeachers, color: 'from-purple-600 to-purple-500' },
          { icon: BarChart3, label: "Jami Kurslar", value: analytics.totalCourses, color: 'from-green-600 to-green-500' },
          { icon: DollarSign, label: "Jami Daromad", value: `$${analytics.totalRevenue.toLocaleString()}`, color: 'from-amber-600 to-amber-500' }
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${metric.color} shadow-lg`}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <metric.icon className="w-8 h-8 text-white/80 mb-4" />
              <p className="text-white/80 text-sm font-black uppercase tracking-wide">{metric.label}</p>
              <p className="text-3xl font-black text-white mt-2">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* PERFORMANCE INDICATORS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg">Faol Foydalanuvchilar</h3>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-4xl font-black text-white mb-2">{analytics.activeUsers}</p>
          <p className="text-sm text-slate-400">Bugun faolda</p>
          <div className="mt-4 h-2 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(analytics.activeUsers / analytics.totalStudents) * 100}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{Math.round((analytics.activeUsers / analytics.totalStudents) * 100)}% faollik</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg">Kurs Tugallash Nisbati</h3>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-4xl font-black text-white mb-2">{analytics.completionRate}%</p>
          <p className="text-sm text-slate-400">O'quvchilar tugatganlar</p>
          <div className="mt-4 h-2 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analytics.completionRate}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Yaxshi ko'rsatkich</p>
        </motion.div>
      </motion.div>

      {/* CHARTS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Student Growth Chart */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <LineChartIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-black text-white text-lg">O'quvchilar O'sishi</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.studentGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis stroke="#94a3b8" dataKey="month" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={{ fill: '#3b82f6', r: 4 }} strokeWidth={2} name="O'quvchilar soni" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-lg">Daromad Trendi</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis stroke="#94a3b8" dataKey="month" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Daromad ($)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Course Enrollment */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-green-400" />
            <h3 className="font-black text-white text-lg">Kurs Yozilganlar</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChartComponent>
              <Pie
                data={analytics.courseEnrollment}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.courseEnrollment.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9' }} />
            </PieChartComponent>
          </ResponsiveContainer>
        </motion.div>

        {/* Additional Metrics Table */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <h3 className="font-black text-white text-lg mb-6">Muqim Ko'rsatkichlar</h3>
          <div className="space-y-4">
            {[
              { label: "O'rtacha Kurs Narxi", value: "$15", trend: "+2.5%" },
              { label: "Yangi Yozilganlar", value: "+45", trend: "+12%" },
              { label: "O'qituvchi Samimiylik", value: "4.8/5", trend: "+0.3" },
              { label: "Platform Foydalanish", value: "89%", trend: "+5%" }
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <span className="text-slate-300 font-black text-sm">{metric.label}</span>
                <div className="text-right">
                  <p className="font-black text-white">{metric.value}</p>
                  <p className="text-xs text-green-400 font-black">{metric.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

    </motion.div>
  );
}
