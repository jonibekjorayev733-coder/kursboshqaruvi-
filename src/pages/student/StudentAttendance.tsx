import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { attendance, courses, students } from '@/data/mockData';
import type { Attendance } from '@/types';

const currentStudent = students[0];

type Filter = 'all' | 'today' | 'week' | 'month';

export default function StudentAttendance() {
  const [filter, setFilter] = useState<Filter>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const records = useMemo(() => {
    let data = attendance.filter(a => a.studentId === currentStudent.id);
    if (courseFilter !== 'all') data = data.filter(a => a.courseId === courseFilter);

    const now = new Date('2025-04-01');
    if (filter === 'today') {
      const today = now.toISOString().split('T')[0];
      data = data.filter(a => a.date === today);
    } else if (filter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      data = data.filter(a => new Date(a.date) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
      data = data.filter(a => new Date(a.date) >= monthAgo);
    }
    return data.sort((a, b) => b.date.localeCompare(a.date));
  }, [filter, courseFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    return { total, present, absent, late, rate: total ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  const enrolledCourses = courses.filter(c => currentStudent.enrolledCourses.includes(c.id));
  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' }, { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' },
  ];

  const columns = [
    { key: 'date', label: 'Date', render: (a: Attendance) => new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
    { key: 'course', label: 'Course', render: (a: Attendance) => courses.find(c => c.id === a.courseId)?.name || '' },
    { key: 'status', label: 'Status', render: (a: Attendance) => <StatusBadge status={a.status} variant="dot" /> },
    { key: 'lateMinutes', label: 'Late (min)', render: (a: Attendance) => a.lateMinutes ? `${a.lateMinutes} min` : '—' },
    { key: 'grade', label: 'Grade', render: (a: Attendance) => a.grade ? <span className="font-medium">{a.grade}%</span> : '—' },
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Track your class attendance" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Present', value: stats.present, color: 'text-success' },
          { label: 'Absent', value: stats.absent, color: 'text-destructive' },
          { label: 'Late', value: stats.late, color: 'text-warning' },
          { label: 'Rate', value: `${stats.rate}%`, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="bg-muted border-0 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary">
          <option value="all">All Courses</option>
          {enrolledCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={records} keyExtractor={a => a.id} emptyMessage="No attendance records found" />
    </div>
  );
}
