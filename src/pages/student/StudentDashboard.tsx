import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend
} from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { BookOpen, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { students, courses, performance, attendance, payments } from '@/data/mockData';
import { useAppContext } from '@/contexts/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const currentStudent = students[0];

export default function StudentDashboard() {
  const { theme } = useAppContext();
  const [selectedCourse, setSelectedCourse] = useState(currentStudent.enrolledCourses[0]);

  const enrolledCourses = useMemo(
    () => courses.filter(c => currentStudent.enrolledCourses.includes(c.id)),
    []
  );

  const coursePerf = useMemo(
    () => performance.filter(p => p.studentId === currentStudent.id && p.courseId === selectedCourse),
    [selectedCourse]
  );

  const attendanceRate = useMemo(() => {
    const records = attendance.filter(a => a.studentId === currentStudent.id);
    if (records.length === 0) return 0;
    return Math.round((records.filter(a => a.status === 'present').length / records.length) * 100);
  }, []);

  const unpaidCount = useMemo(
    () => payments.filter(p => p.studentId === currentStudent.id && p.status !== 'paid').length,
    []
  );

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name || '';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const chartData = {
    labels: coursePerf.map(p => p.label),
    datasets: [{
      label: 'Score',
      data: coursePerf.map(p => p.score),
      borderColor: 'hsl(199, 89%, 48%)',
      backgroundColor: 'hsla(199, 89%, 48%, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'hsl(199, 89%, 48%)',
      pointBorderColor: 'hsl(199, 89%, 48%)',
      pointRadius: 5,
      pointHoverRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'hsl(222, 47%, 11%)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8 } },
    scales: {
      y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45 } },
    },
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${currentStudent.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Enrolled Courses" value={enrolledCourses.length} icon={<BookOpen className="w-5 h-5" />} delay={0} />
        <StatCard title="Avg. Performance" value={`${coursePerf.length ? Math.round(coursePerf.reduce((s, p) => s + p.score, 0) / coursePerf.length) : 0}%`} icon={<TrendingUp className="w-5 h-5" />} trend={{ value: 5.2, positive: true }} delay={0.1} />
        <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<Calendar className="w-5 h-5" />} delay={0.2} />
        <StatCard title="Unpaid Invoices" value={unpaidCount} icon={<CreditCard className="w-5 h-5" />} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Performance</h3>
              <p className="text-sm text-muted-foreground">{selectedCourseName}</p>
            </div>
          </div>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Course List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-semibold text-lg mb-4">My Courses</h3>
          <div className="space-y-3">
            {enrolledCourses.map(course => {
              const progress = Math.round((course.completedLessons / course.totalLessons) * 100);
              const isSelected = course.id === selectedCourse;
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                    <span className="font-medium text-sm">{course.name}</span>
                  </div>
                  <div className="ml-6">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
