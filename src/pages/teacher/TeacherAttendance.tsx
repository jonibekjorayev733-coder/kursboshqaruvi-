import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { teachers, courses, students, attendance } from '@/data/mockData';
import { toast } from 'sonner';
import { Check, X, Clock } from 'lucide-react';

const currentTeacher = teachers[0];

export default function TeacherAttendance() {
  const myCourses = useMemo(() => courses.filter(c => c.teacherId === currentTeacher.id), []);
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || '');
  const [selectedDate] = useState('2025-04-01');
  const [marks, setMarks] = useState<Record<string, { status: string; grade?: number }>>({});

  const courseStudents = useMemo(
    () => students.filter(s => myCourses.find(c => c.id === selectedCourse)?.studentIds.includes(s.id)),
    [selectedCourse, myCourses]
  );

  const handleMark = (studentId: string, status: string) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleGrade = (studentId: string, grade: number) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], grade } }));
  };

  const handleSave = () => {
    toast.success(`Attendance saved for ${Object.keys(marks).length} students`);
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily attendance and grades">
        <button onClick={handleSave} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
          Save Attendance
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
          {myCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={selectedDate} readOnly className="bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none" />
      </div>

      <div className="space-y-2">
        {courseStudents.map((s, i) => {
          const mark = marks[s.id];
          return (
            <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { status: 'present', icon: <Check className="w-4 h-4" />, color: 'bg-success/15 text-success hover:bg-success/25' },
                  { status: 'absent', icon: <X className="w-4 h-4" />, color: 'bg-destructive/15 text-destructive hover:bg-destructive/25' },
                  { status: 'late', icon: <Clock className="w-4 h-4" />, color: 'bg-warning/15 text-warning hover:bg-warning/25' },
                ].map(opt => (
                  <button key={opt.status} onClick={() => handleMark(s.id, opt.status)}
                    className={`p-2.5 rounded-lg transition-all ${mark?.status === opt.status ? opt.color + ' ring-2 ring-offset-1 ring-offset-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                    {opt.icon}
                  </button>
                ))}
              </div>

              <div className="w-24">
                <input type="number" min={0} max={100} placeholder="Grade"
                  value={mark?.grade ?? ''}
                  onChange={e => handleGrade(s.id, parseInt(e.target.value))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-primary outline-none" />
              </div>

              {mark?.status && <StatusBadge status={mark.status} variant="dot" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
