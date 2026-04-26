import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, Teacher, Course } from '@/services/api';
import { Plus, Trash2, Edit, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'delete' | 'edit'; id?: number; name?: string; teacher?: Teacher }>({ open: false, type: 'delete' });
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    avatar: 'https://i.pravatar.cc/150?img=1',
    subject: '',
    course_id: undefined as number | undefined
  });

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Kurslar yuklanishida xatolik:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (error) {
      toast.error('O\'qituvchilar yuklanishida xatolik');
    } finally {
      setLoading(false);
    }
  };

  const linkTeacherToCourse = async (teacherId: number, teacherName: string, courseId?: number) => {
    if (!courseId) return;
    const targetCourse = courses.find((course) => course.id === courseId);
    if (!targetCourse) return;

    await api.updateCourse(courseId, {
      ...targetCourse,
      teacher_id: teacherId,
      instructor: teacherName,
    });
  };

  const handleCreate = async () => {
    if (!newTeacher.name || !newTeacher.email || (!editingId && !newTeacher.password) || !newTeacher.course_id) {
      toast.error('Majburiy maydonlarni to\'ldiring');
      return;
    }
    try {
      if (editingId) {
        const updatedTeacher = await api.updateTeacher(editingId, newTeacher);
        await linkTeacherToCourse(updatedTeacher.id as number, updatedTeacher.name, newTeacher.course_id);
        toast.success(`O'qituvchi o'zgartirildi: "${newTeacher.name}"`);
      } else {
        const createdTeacher = await api.createTeacher(newTeacher);
        await linkTeacherToCourse(createdTeacher.id as number, createdTeacher.name, newTeacher.course_id);
        toast.success(`O'qituvchi qo'shildi: "${newTeacher.name}"`);
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error(`Xatolik: ${error.message}`);
      return;
    }
    
    // Close modal and reset
    setShowModal(false);
    setEditingId(null);
    setNewTeacher({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), subject: '', course_id: undefined });
    
    // Refresh list
    await fetchTeachers();
    await fetchCourses();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTeacher(id);
      toast.success('O\'qituvchi o\'chirildi');
      await fetchTeachers();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      toast.error(`Xatolik: ${error.message}`);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setConfirmModal({ open: true, type: 'edit', id: teacher.id || undefined, name: teacher.name, teacher });
  };

  const doEdit = (teacher: Teacher) => {
    const assignedCourse = courses.find((course) => course.teacher_id === teacher.id);
    setNewTeacher({
      name: teacher.name,
      email: teacher.email,
      password: '',
      avatar: teacher.avatar || '',
      subject: teacher.subject || '',
      course_id: assignedCourse?.id
    });
    setEditingId(teacher.id || null);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  const teacherCourseMap = new Map<number, string[]>(
    teachers
      .filter((teacher) => teacher.id !== undefined)
      .map((teacher) => [
        teacher.id as number,
        courses
          .filter((course) => course.teacher_id === teacher.id)
          .map((course) => course.name),
      ])
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">O'qituvchilar Boshqaruvi</h1>
              <p className="text-cyan-300/80 text-lg font-medium">Barcha o'qituvchilarni boshqaring va kurslarni tayinlang</p>
            </div>
            <Users className="w-24 h-24 text-cyan-400 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white">Jami: {teachers.length} o'qituvchi</h2>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingId(null);
            setNewTeacher({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), subject: '', course_id: undefined });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-black text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Yangi O'qituvchi
        </motion.button>
      </motion.div>

      {/* TEACHERS GRID */}
      {teachers.length === 0 ? (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-black">O'qituvchi topilmadi</p>
        </motion.div>
      ) : (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher, idx) => (
            <motion.div
              key={teacher.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={teacher.avatar || 'https://i.pravatar.cc/150'}
                  alt={teacher.name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-500/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm">{teacher.name}</p>
                  <p className="text-slate-400 text-xs">{teacher.email}</p>
                  {teacher.subject && <p className="text-cyan-400 text-xs font-black mt-1">{teacher.subject}</p>}
                </div>
              </div>

              {/* Course Info */}
              <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300 font-black">
                    {(teacherCourseMap.get(teacher.id as number) || []).length > 0
                      ? (teacherCourseMap.get(teacher.id as number) || []).join(', ')
                      : 'Kurs tanlanmagan'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(teacher)}
                  className="flex-1 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-black text-xs uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  O'zgartirish
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmModal({ open: true, type: 'delete', id: teacher.id as number, name: teacher.name })}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-black text-xs uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  O'chirish
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* MODAL */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setShowModal(false);
            setEditingId(null);
            setNewTeacher({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), subject: '', course_id: undefined });
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-cyan-500/30 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingId ? 'O\'qituvchini O\'zgartirish' : 'Yangi O\'qituvchi Qo\'shish'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">O'qituvchi Nomi *</label>
                <input
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Ism va Familiya"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Email *</label>
                <input
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="email@example.com"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Parol *</label>
                  <input
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Predmet</label>
                <input
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="e.g. Matematika"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Kurs *</label>
                <select
                  value={newTeacher.course_id || ''}
                  onChange={(e) => setNewTeacher(p => ({ ...p, course_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                >
                  <option value="">Kurs tanlang...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNewTeacher({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), subject: '', course_id: undefined });
                }}
                className="flex-1 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-white font-black uppercase transition-colors"
              >
                Bekor Qilish
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-black uppercase hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                {editingId ? 'O\'zgartirish' : 'Qo\'shish'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirmModal.open}
        type={confirmModal.type}
        title={confirmModal.name}
        onCancel={() => setConfirmModal(p => ({ ...p, open: false }))}
        onConfirm={() => {
          if (confirmModal.type === 'delete' && confirmModal.id) {
            handleDelete(confirmModal.id);
          } else if (confirmModal.type === 'edit' && confirmModal.teacher) {
            doEdit(confirmModal.teacher);
          }
          setConfirmModal(p => ({ ...p, open: false }));
        }}
      />

    </motion.div>
  );
}
