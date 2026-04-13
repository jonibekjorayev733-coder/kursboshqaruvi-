import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Users, BookOpen, TrendingUp, UserCheck } from 'lucide-react';
import { teachers, courses, students, performance, attendance } from '@/data/mockData';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const currentTeacher = teachers[0];

export default function TeacherDashboard() {
  const { theme } = useAppContext();
  const myCourses = useMemo(() => courses.filter(c => c.teacherId === currentTeacher.id), []);
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || '');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [newScore, setNewScore] = useState('');

  const courseStudents = useMemo(
    () => students.filter(s => myCourses.find(c => c.id === selectedCourse)?.studentIds.includes(s.id)),
    [selectedCourse, myCourses]
  );

  const studentPerf = useMemo(
    () => selectedStudent ? performance.filter(p => p.studentId === selectedStudent && p.courseId === selectedCourse) : [],
    [selectedStudent, selectedCourse]
  );

  const totalStudents = useMemo(() => {
    const ids = new Set(myCourses.flatMap(c => c.studentIds));
    return ids.size;
  }, [myCourses]);

  const todayAttendance = useMemo(() => {
    const today = '2025-03-31';
    const records = attendance.filter(a => a.date === today && myCourses.some(c => c.id === a.courseId));
    if (records.length === 0) return 0;
    return Math.round((records.filter(r => r.status === 'present').length / records.length) * 100);
  }, [myCourses]);

  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const chartData = {
    labels: studentPerf.map(p => p.label),
    datasets: [{
      label: 'Score',
      data: studentPerf.map(p => p.score),
      borderColor: 'hsl(262, 83%, 58%)',
      backgroundColor: 'hsla(262, 83%, 58%, 0.1)',
      fill: true, tension: 0.4, pointRadius: 5, pointHoverRadius: 8,
      pointBackgroundColor: 'hsl(262, 83%, 58%)',
    }],
  };

  const handleAddScore = () => {
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > 100) { toast.error('Enter a valid score (0-100)'); return; }
    toast.success(`Score ${score}% added for ${students.find(s => s.id === selectedStudent)?.name}`);
    setNewScore('');
  };

  return (
    <div>
      <PageHeader title="Teacher Dashboard" subtitle={`Welcome, ${currentTeacher.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Courses" value={myCourses.length} icon={<BookOpen className="w-5 h-5" />} delay={0} />
        <StatCard title="Total Students" value={totalStudents} icon={<Users className="w-5 h-5" />} delay={0.1} />
        <StatCard title="Today's Attendance" value={`${todayAttendance}%`} icon={<UserCheck className="w-5 h-5" />} delay={0.2} />
        <StatCard title="Avg Performance" value="78%" icon={<TrendingUp className="w-5 h-5" />} trend={{ value: 3.1, positive: true }} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Input Performance</h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Course</label>
            <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedStudent(''); }}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
              {myCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select student</option>
              {courseStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {selectedStudent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Score (%)</label>
                <input type="number" min={0} max={100} value={newScore} onChange={e => setNewScore(e.target.value)}
                  placeholder="Enter score" className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <button onClick={handleAddScore} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Submit Score
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Performance Graph</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedStudent ? students.find(s => s.id === selectedStudent)?.name : 'Select a student to view performance'}
          </p>
          <div className="h-72">
            {studentPerf.length > 0 ? (
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45 } } },
              }} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {selectedStudent ? 'No performance data' : 'Select a student to view their graph'}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
