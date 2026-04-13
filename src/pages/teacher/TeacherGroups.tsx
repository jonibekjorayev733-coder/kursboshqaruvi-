import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { teachers, courses, students } from '@/data/mockData';
import { Users, Phone, User } from 'lucide-react';

const currentTeacher = teachers[0];

export default function TeacherGroups() {
  const myCourses = useMemo(() => courses.filter(c => c.teacherId === currentTeacher.id), []);
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || '');

  const groupStudents = useMemo(
    () => students.filter(s => myCourses.find(c => c.id === selectedCourse)?.studentIds.includes(s.id)),
    [selectedCourse, myCourses]
  );

  return (
    <div>
      <PageHeader title="Groups" subtitle="View students by course group" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {myCourses.map(c => (
          <button key={c.id} onClick={() => setSelectedCourse(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCourse === c.id ? 'gradient-primary text-primary-foreground shadow-md' : 'glass hover:bg-muted/50'
            }`}>
            {c.name}
            <span className="ml-2 text-xs opacity-75">({c.studentIds.length})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupStudents.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" /><span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" /><span>Parent: {s.parentName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" /><span>Parent: {s.parentPhone}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {groupStudents.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No students in this group</p>
        </div>
      )}
    </div>
  );
}
