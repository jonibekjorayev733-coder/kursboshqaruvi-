import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { teachers, courses, students } from '@/data/mockData';
import { UserPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const currentTeacher = teachers[0];

export default function TeacherStudents() {
  const myCourses = useMemo(() => courses.filter(c => c.teacherId === currentTeacher.id), []);
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || '');

  const assignedStudents = useMemo(
    () => students.filter(s => myCourses.find(c => c.id === selectedCourse)?.studentIds.includes(s.id)),
    [selectedCourse, myCourses]
  );

  const unassignedStudents = useMemo(
    () => students.filter(s => !myCourses.find(c => c.id === selectedCourse)?.studentIds.includes(s.id)),
    [selectedCourse, myCourses]
  );

  const handleAssign = (studentName: string) => {
    toast.success(`${studentName} assigned to ${myCourses.find(c => c.id === selectedCourse)?.name}`);
  };

  return (
    <div>
      <PageHeader title="Students" subtitle="Manage student assignments" />

      <div className="mb-6">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
          {myCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Available Students</h3>
          <div className="space-y-2">
            {unassignedStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </div>
                <button onClick={() => handleAssign(s.name)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {unassignedStudents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">All students assigned</p>}
          </div>
        </motion.div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ArrowRight className="w-6 h-6 text-muted-foreground" />
        </div>

        {/* Assigned */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-1">Enrolled Students</h3>
          <p className="text-xs text-muted-foreground mb-4">{assignedStudents.length} students in this course</p>
          <div className="space-y-2">
            {assignedStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.phone}</p>
                </div>
                <span className="text-xs bg-success/15 text-success px-2 py-1 rounded-full">Enrolled</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
