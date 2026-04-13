import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { Modal } from '@/components/shared/Modal';
import { courses, teachers, students } from '@/data/mockData';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCourses() {
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', description: '', teacherId: '', schedule: '' });

  const handleCreate = () => {
    if (!newCourse.name || !newCourse.teacherId) { toast.error('Fill required fields'); return; }
    toast.success(`Course "${newCourse.name}" created`);
    setShowCreate(false);
    setNewCourse({ name: '', description: '', teacherId: '', schedule: '' });
  };

  return (
    <div>
      <PageHeader title="Courses" subtitle="Manage all courses">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((c, i) => {
          const teacher = teachers.find(t => t.id === c.teacherId);
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-2" style={{ backgroundColor: c.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toast.success('Course deleted')} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <img src={teacher?.avatar} alt="" className="w-5 h-5 rounded-full" />
                    <span>{teacher?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{c.studentIds.length} students</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.schedule}</p>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.round((c.completedLessons / c.totalLessons) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(c.completedLessons / c.totalLessons) * 100}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Course">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Course Name *</label>
            <input value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Advanced Mathematics" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none resize-none h-20" placeholder="Course description..." />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Teacher *</label>
            <select value={newCourse.teacherId} onChange={e => setNewCourse(p => ({ ...p, teacherId: e.target.value }))}
              className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Schedule</label>
            <input value={newCourse.schedule} onChange={e => setNewCourse(p => ({ ...p, schedule: e.target.value }))}
              className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border-0 focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Mon, Wed 10:00-12:00" />
          </div>
          <button onClick={handleCreate} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">Create Course</button>
        </div>
      </Modal>
    </div>
  );
}
