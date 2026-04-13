import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { teachers, courses, students, performance, attendance } from '@/data/mockData';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const currentTeacher = teachers[0];

export default function TeacherReports() {
  const myCourses = useMemo(() => courses.filter(c => c.teacherId === currentTeacher.id), []);

  const reportData = useMemo(() => {
    return myCourses.flatMap(course => {
      return students
        .filter(s => course.studentIds.includes(s.id))
        .map(s => {
          const perfs = performance.filter(p => p.studentId === s.id && p.courseId === course.id);
          const atts = attendance.filter(a => a.studentId === s.id && a.courseId === course.id);
          const avgScore = perfs.length ? Math.round(perfs.reduce((sum, p) => sum + p.score, 0) / perfs.length) : 0;
          const attendanceRate = atts.length ? Math.round((atts.filter(a => a.status === 'present').length / atts.length) * 100) : 0;
          return { id: `${s.id}-${course.id}`, studentName: s.name, courseName: course.name, avgScore, attendanceRate, totalAssignments: perfs.length };
        });
    });
  }, [myCourses]);

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'courseName', label: 'Course' },
    { key: 'avgScore', label: 'Avg Score', render: (r: typeof reportData[0]) => (
      <span className={`font-semibold ${r.avgScore >= 70 ? 'text-success' : r.avgScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
        {r.avgScore}%
      </span>
    )},
    { key: 'attendanceRate', label: 'Attendance', render: (r: typeof reportData[0]) => `${r.attendanceRate}%` },
    { key: 'totalAssignments', label: 'Assignments' },
  ];

  const handleExport = (format: string) => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="View and export student reports">
        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
          <FileText className="w-4 h-4" /> PDF
        </button>
        <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors">
          <Download className="w-4 h-4" /> Excel
        </button>
      </PageHeader>

      <DataTable columns={columns} data={reportData} keyExtractor={r => r.id} />
    </div>
  );
}
