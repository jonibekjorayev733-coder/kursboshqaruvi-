import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, Course } from '@/services/api';
import { Plus, Edit, Trash2, Users, BookOpen, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<{ [key: number]: number }>({});
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'delete' | 'edit'; id?: number; name?: string; course?: Course }>({ open: false, type: 'delete' });
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    instructor: '',
    price: 0,
    duration: '',
    level: 'Beginner',
    image_url: '',
    color: '#3b82f6',
    syllabus: [],
    student_ids: [],
    completed_lessons: 0,
    total_lessons: 10,
    teacher_id: undefined as number | undefined
  });

  useEffect(() => {
    fetchCourses();
    api.getTeachers().then(setTeachers);
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
      setLoading(false);
      
      // Load enrollments for each course
      Promise.all(data.map(course => 
        api.getEnrollments(course.id).then(enrollments => ({
          courseId: course.id,
          count: enrollments.length
        }))
      )).then(results => {
        const enrollmentMap: { [key: number]: number } = {};
        results.forEach(result => {
          enrollmentMap[result.courseId] = result.count;
        });
        setCourseEnrollments(enrollmentMap);
      }).catch(e => console.error('Error loading enrollments:', e));
    } catch (error) {
      console.error('Courses fetch error:', error);
      setCourses([]);
      setLoading(false);
      toast.error('Kurslar yuklanishida xatolik');
    }
  };

  const handleCreate = async () => {
    if (!newCourse.name || !newCourse.teacher_id) {
      toast.error('Majburiy maydonlarni to\'ldiring');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === newCourse.teacher_id);
    const courseToCreate = {
      ...newCourse,
      instructor: selectedTeacher ? selectedTeacher.name : 'Unknown'
    };

    try {
      if (editingId) {
        await api.updateCourse(editingId, courseToCreate as Course);
        toast.success(`Kurs o'zgartirildi: "${newCourse.name}"`);
      } else {
        const created = await api.createCourse(courseToCreate as any);
        console.log('✅ Course created:', created);
        toast.success(`Kurs qo'shildi: "${newCourse.name}"`);
      }
    } catch (error: any) {
      console.error('❌ Error in handleCreate:', error);
      toast.error(`Xatolik: ${error.message}`);
      return;
    }
    
    // Close modal and refresh
    setShowModal(false);
    setEditingId(null);
    setNewCourse({
      name: '', description: '', instructor: '', price: 0, duration: '',
      level: 'Beginner', image_url: '', color: '#3b82f6', syllabus: [],
      student_ids: [], completed_lessons: 0, total_lessons: 10, teacher_id: undefined
    });
    
    // Refresh courses list
    await fetchCourses();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteCourse(id);
      toast.success('Kurs o\'chirildi');
      await fetchCourses();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      toast.error(`Xatolik: ${error.message}`);
    }
  };

  const handleEdit = (course: Course) => {
    setConfirmModal({ open: true, type: 'edit', id: course.id || undefined, name: course.name, course });
  };

  const doEdit = (course: Course) => {
    setNewCourse({
      name: course.name,
      description: course.description || '',
      instructor: course.instructor || '',
      price: course.price || 0,
      duration: course.duration || '',
      level: course.level || 'Beginner',
      image_url: course.image_url || '',
      color: course.color || '#3b82f6',
      syllabus: course.syllabus || [],
      student_ids: course.student_ids || [],
      completed_lessons: course.completed_lessons || 0,
      total_lessons: course.total_lessons || 10,
      teacher_id: course.teacher_id
    });
    setEditingId(course.id || null);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Kurslar Boshqaruvi</h1>
              <p className="text-cyan-300/80 text-lg font-medium">Barcha kurslarni boshqaring va monitoring qiling</p>
            </div>
            <BookOpen className="w-24 h-24 text-cyan-400 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white">Jami: {courses.length} kurs</h2>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingId(null);
            setNewCourse({
              name: '', description: '', instructor: '', price: 0, duration: '',
              level: 'Beginner', image_url: '', color: '#3b82f6', syllabus: [],
              student_ids: [], completed_lessons: 0, total_lessons: 10, teacher_id: undefined
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-black text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Yangi Kurs
        </motion.button>
      </motion.div>

      {/* COURSES GRID */}
      {courses.length === 0 ? (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-black">Kurs topilmadi</p>
        </motion.div>
      ) : (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => (
            <motion.div
              key={course.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 transition-all group"
            >
              {/* Color Top Bar */}
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-cyan-400" />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-white text-sm">{course.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(course)}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => course.id && setConfirmModal({ open: true, type: 'delete', id: course.id, name: course.name })}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="font-black text-cyan-300">{courseEnrollments[course.id] || 0} o'quvchi</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span className="font-black">{course.level}</span>
                  </div>
                  {course.duration && <p className="text-slate-400 text-xs">Davomiyligi: {course.duration}</p>}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="font-black">Daraja</span>
                    <span className="font-black">{Math.round(((course.completed_lessons || 0) / (course.total_lessons || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(((course.completed_lessons || 0) / (course.total_lessons || 1)) * 100)}%` }}
                      transition={{ delay: idx * 0.1, duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* Meta Info */}
                {course.created_at && (
                  <p className="text-[10px] text-slate-500">
                    {new Date(course.created_at).toLocaleDateString('uz-UZ')}
                  </p>
                )}
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
            setNewCourse({
              name: '', description: '', instructor: '', price: 0, duration: '',
              level: 'Beginner', image_url: '', color: '#3b82f6', syllabus: [],
              student_ids: [], completed_lessons: 0, total_lessons: 10, teacher_id: undefined
            });
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingId ? 'Kursni O\'zgartirish' : 'Yangi Kurs Qo\'shish'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Kurs Nomi *</label>
                <input
                  value={newCourse.name}
                  onChange={(e) => setNewCourse(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Kurs nomini kiriting"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Tavsif</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50 resize-none h-20"
                  placeholder="Kurs tavsifi..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">O'qituvchi *</label>
                  <select
                    value={newCourse.teacher_id || ''}
                    onChange={(e) => setNewCourse(p => ({ ...p, teacher_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="">Tanlang...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Daraja</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse(p => ({ ...p, level: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="Beginner">Boshlang'ich</option>
                    <option value="Intermediate">O'rtacha</option>
                    <option value="Advanced">Ilg'or</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Narx ($)</label>
                  <input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse(p => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Davomiyligi</label>
                  <input
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="e.g. 8 hafta"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Rang</label>
                <input
                  type="color"
                  value={newCourse.color}
                  onChange={(e) => setNewCourse(p => ({ ...p, color: e.target.value }))}
                  className="w-full h-12 rounded-xl cursor-pointer border border-cyan-500/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNewCourse({
                    name: '', description: '', instructor: '', price: 0, duration: '',
                    level: 'Beginner', image_url: '', color: '#3b82f6', syllabus: [],
                    student_ids: [], completed_lessons: 0, total_lessons: 10, teacher_id: undefined
                  });
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
          } else if (confirmModal.type === 'edit' && confirmModal.course) {
            doEdit(confirmModal.course);
          }
          setConfirmModal(p => ({ ...p, open: false }));
        }}
      />

    </motion.div>
  );
}
