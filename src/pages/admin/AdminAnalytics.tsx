import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { students, courses, payments, attendance, revenueData } from '@/data/mockData';
import { useAppContext } from '@/contexts/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AdminAnalytics() {
  const { theme } = useAppContext();
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const enrollmentData = {
    labels: courses.map(c => c.name),
    datasets: [{
      label: 'Students',
      data: courses.map(c => c.studentIds.length),
      backgroundColor: courses.map(c => c.color),
      borderRadius: 8,
    }],
  };

  const growthData = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Students',
      data: [3, 4, 5, 5, 6, 6, 6, 6],
      borderColor: 'hsl(199, 89%, 48%)',
      backgroundColor: 'hsla(199, 89%, 48%, 0.1)',
      fill: true, tension: 0.4,
    }],
  };

  const attendanceByDay = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Attendance %',
      data: [92, 88, 85, 90, 78],
      backgroundColor: 'hsl(142, 71%, 45%)',
      borderRadius: 8,
    }],
  };

  const opts = (yLabel?: string) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } },
  });

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Detailed insights and reports" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Enrollment by Course</h3>
          <p className="text-sm text-muted-foreground mb-4">Number of students per course</p>
          <div className="h-64"><Bar data={enrollmentData} options={opts()} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Student Growth</h3>
          <p className="text-sm text-muted-foreground mb-4">Total enrollment over time</p>
          <div className="h-64"><Line data={growthData} options={opts()} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Attendance by Day</h3>
          <p className="text-sm text-muted-foreground mb-4">Average attendance rate per weekday</p>
          <div className="h-64"><Bar data={attendanceByDay} options={opts()} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Revenue per Course</h3>
          <p className="text-sm text-muted-foreground mb-4">Total collected revenue</p>
          <div className="h-64">
            <Bar data={{
              labels: courses.map(c => c.name),
              datasets: [{
                label: 'Revenue',
                data: courses.map(c => payments.filter(p => p.courseId === c.id && p.status === 'paid').reduce((s, p) => s + p.amount, 0)),
                backgroundColor: courses.map(c => c.color),
                borderRadius: 8,
              }],
            }} options={opts()} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
