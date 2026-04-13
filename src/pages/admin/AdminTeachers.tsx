import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { teachers, courses } from '@/data/mockData';
import type { Teacher } from '@/types';
import { toast } from 'sonner';

export default function AdminTeachers() {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const columns = [
    { key: 'name', label: 'Teacher', render: (t: Teacher) => (
      <div className="flex items-center gap-3">
        <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full" />
        <div>
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.email}</p>
        </div>
      </div>
    )},
    { key: 'specialization', label: 'Specialization' },
    { key: 'phone', label: 'Phone' },
    { key: 'courses', label: 'Courses', render: (t: Teacher) => (
      <div className="flex flex-wrap gap-1">
        {courses.filter(c => t.assignedCourses.includes(c.id)).map(c => (
          <span key={c.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: c.color + '20', color: c.color }}>
            {c.name}
          </span>
        ))}
      </div>
    )},
    { key: 'action', label: '', render: (t: Teacher) => (
      <button onClick={() => setSelectedTeacher(t.id)} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
        Manage
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Teachers" subtitle="Manage teacher assignments" />

      {/* Assignment panel */}
      {selectedTeacher && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Assign Courses — {teachers.find(t => t.id === selectedTeacher)?.name}</h3>
            <button onClick={() => setSelectedTeacher(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {courses.map(c => {
              const isAssigned = teachers.find(t => t.id === selectedTeacher)?.assignedCourses.includes(c.id);
              return (
                <button key={c.id} onClick={() => toast.success(`Course ${isAssigned ? 'removed' : 'assigned'}`)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                    isAssigned ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                  }`}>
                  <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <DataTable columns={columns} data={teachers} keyExtractor={t => t.id} />
    </div>
  );
}
