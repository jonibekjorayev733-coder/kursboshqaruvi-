import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { students, teachers, courses, payments, revenueData } from '@/data/mockData';
import { useAppContext } from '@/contexts/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const { theme } = useAppContext();
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const totalRevenue = useMemo(() => payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), []);
  const unpaidTotal = useMemo(() => payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0), []);

  const revenueChart = {
    labels: revenueData.map(r => new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short' })),
    datasets: [
      { label: 'Revenue', data: revenueData.map(r => r.revenue), backgroundColor: 'hsl(199, 89%, 48%)', borderRadius: 8 },
      { label: 'Unpaid', data: revenueData.map(r => r.unpaid), backgroundColor: 'hsl(0, 84%, 60%)', borderRadius: 8 },
    ],
  };

  const courseDistribution = {
    labels: courses.map(c => c.name),
    datasets: [{
      data: courses.map(c => c.studentIds.length),
      backgroundColor: courses.map(c => c.color),
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of your education center" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Students" value={students.length} icon={<Users className="w-5 h-5" />} trend={{ value: 12, positive: true }} delay={0} />
        <StatCard title="Teachers" value={teachers.length} icon={<GraduationCap className="w-5 h-5" />} delay={0.1} />
        <StatCard title="Active Courses" value={courses.length} icon={<BookOpen className="w-5 h-5" />} delay={0.2} />
        <StatCard title="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: 8.3, positive: true }} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-1">Revenue Analytics</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly revenue breakdown</p>
          <div className="h-72">
            <Bar data={revenueChart} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', padding: 20 } } },
              scales: { y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => `$${v}` } }, x: { grid: { display: false }, ticks: { color: textColor } } },
            }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-1">Student Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">By course</p>
          <div className="h-60 flex items-center justify-center">
            <Doughnut data={courseDistribution} options={{
              responsive: true, maintainAspectRatio: false, cutout: '65%',
              plugins: { legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } },
            }} />
          </div>
        </motion.div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning/15 text-warning"><DollarSign className="w-4 h-4" /></div>
            <span className="text-sm font-medium">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-warning">${unpaidTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{payments.filter(p => p.status !== 'paid').length} unpaid invoices</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/15 text-success"><TrendingUp className="w-4 h-4" /></div>
            <span className="text-sm font-medium">Growth</span>
          </div>
          <p className="text-2xl font-bold text-success">+12%</p>
          <p className="text-xs text-muted-foreground mt-1">New enrollments this month</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/15 text-primary"><UserCheck className="w-4 h-4" /></div>
            <span className="text-sm font-medium">Avg Attendance</span>
          </div>
          <p className="text-2xl font-bold text-primary">87%</p>
          <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
        </motion.div>
      </div>
    </div>
  );
}
