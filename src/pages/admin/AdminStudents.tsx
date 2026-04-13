import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { students, courses } from '@/data/mockData';
import type { Student } from '@/types';
import { Search } from 'lucide-react';

export default function AdminStudents() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const columns = [
    { key: 'name', label: 'Student', render: (s: Student) => (
      <div className="flex items-center gap-3">
        <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
        <div>
          <p className="font-medium">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'parentName', label: 'Parent' },
    { key: 'courses', label: 'Courses', render: (s: Student) => (
      <div className="flex flex-wrap gap-1">
        {s.enrolledCourses.map(cId => {
          const c = courses.find(co => co.id === cId);
          return c ? <span key={cId} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: c.color + '20', color: c.color }}>{c.name}</span> : null;
        })}
      </div>
    )},
    { key: 'enrollmentDate', label: 'Enrolled', render: (s: Student) => new Date(s.enrollmentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
  ];

  return (
    <div>
      <PageHeader title="Students" subtitle={`${students.length} total students`}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
            className="bg-muted rounded-lg pl-9 pr-4 py-2 text-sm border-0 focus:ring-2 focus:ring-primary outline-none w-64" />
        </div>
      </PageHeader>

      <DataTable columns={columns} data={filtered} keyExtractor={s => s.id} />
    </div>
  );
}
