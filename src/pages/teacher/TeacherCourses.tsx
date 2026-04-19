import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Course, Student, Assignment } from '@/services/api';
import { BookOpen, ArrowLeft, Calendar, Users, Send, Check, UserCheck, Globe, Pencil, Trash2, Save, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

type Mode = 'courses' | 'all' | 'individual';

export default function TeacherCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [mode, setMode] = useState<Mode>('courses');
  const [allTitle, setAllTitle] = useState('');
  const [allTask, setAllTask] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [indTitle, setIndTitle] = useState('');
  const [indTask, setIndTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTask, setEditTask] = useState('');
  const [sentAllCourseIds, setSentAllCourseIds] = useState<Set<number>>(new Set());
  const [sentIndStudentIds, setSentIndStudentIds] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'delete' | 'edit'; id?: number; title?: string }>({ open: false, type: 'delete' });

  const teacherId = parseInt(localStorage.getItem('user_id') || '0', 10);

  useEffect(() => {
    Promise.all([api.getCourses(teacherId), api.getStudents()])
      .then(([c, s]) => {
        setCourses(c);
        setStudents(s);
      })
      .catch(() => toast.error('Kurslarni yuklashda xatolik'))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      const ids = new Set<number>(enrollments.map((e: any) => e.student_id));
      setEnrolledStudentIds(ids);
      setEnrolledStudents(students.filter(s => ids.has(s.id as number)));
    } catch {
      console.error('Error loading enrollments');
    }
  };

  const loadAssignments = async (courseId: number) => {
    setLoadingAssignments(true);
    try {
      const data = await api.getAssignments(courseId, teacherId);
      setAssignments(data);
    } catch {
      toast.error('Vazifalarni yuklashda xatolik');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    loadEnrollments(course.id as number);
    loadAssignments(course.id as number);
    setMode('all');
    setAllTitle(''); setAllTask('');
    setIndTitle(''); setIndTask('');
    setSelectedStudentId(null);
    setEditingAssignmentId(null);
    // Reset sent state for new course context
    setSentAllCourseIds(new Set());
    setSentIndStudentIds(new Set());
  };

  const handleSendAll = async () => {
    if (!allTitle.trim() || !allTask.trim()) { toast.error("Mavzu va vazifani to'liq kiriting"); return; }
    setIsSubmitting(true);
    try {
      await api.createAssignment({
        title: allTitle,
        description: allTask,
        course_id: selectedCourse!.id as number,
        teacher_id: teacherId,
        student_id: null as any,
      });
      await loadAssignments(selectedCourse!.id as number);
      toast.success(`Vazifa barcha ${enrolledStudentIds.size} o'quvchiga yuborildi!`);
      setSentAllCourseIds(prev => new Set([...prev, selectedCourse!.id as number]));
      setAllTitle(''); setAllTask('');
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setIsSubmitting(false); }
  };

  const handleSendIndividual = async () => {
    if (!selectedStudentId) { toast.error("O'quvchi tanlang"); return; }
    if (!indTitle.trim() || !indTask.trim()) { toast.error('Mavzu va vazifani kiriting'); return; }
    setIsSubmitting(true);
    try {
      const student = enrolledStudents.find(s => s.id === selectedStudentId);
      await api.createAssignment({
        title: indTitle,
        description: indTask,
        course_id: selectedCourse!.id as number,
        teacher_id: teacherId,
        student_id: selectedStudentId,
      });
      await loadAssignments(selectedCourse!.id as number);
      toast.success(`Vazifa ${student?.name} ga yuborildi!`);
      setSentIndStudentIds(prev => new Set([...prev, `${selectedCourse!.id}-${selectedStudentId}`]));
      setIndTitle(''); setIndTask(''); setSelectedStudentId(null);
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setIsSubmitting(false); }
  };

  const startEditAssignment = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id as number);
    setEditTitle(assignment.title);
    setEditTask(assignment.description);
  };

  const cancelEditAssignment = () => {
    setEditingAssignmentId(null);
    setEditTitle('');
    setEditTask('');
  };

  const saveEditAssignment = async () => {
    if (!selectedCourse || !editingAssignmentId) return;
    if (!editTitle.trim() || !editTask.trim()) {
      toast.error('Mavzu va vazifa bo\'sh bo\'lmasin');
      return;
    }

    const existing = assignments.find(a => a.id === editingAssignmentId);
    if (!existing) return;

    try {
      await api.updateAssignment(editingAssignmentId, {
        ...existing,
        title: editTitle,
        description: editTask,
        course_id: selectedCourse.id as number,
        teacher_id: teacherId,
      });
      toast.success('Vazifa yangilandi');
      cancelEditAssignment();
      await loadAssignments(selectedCourse.id as number);
    } catch {
      toast.error('Vazifani yangilashda xatolik');
    }
  };

  const deleteAssignment = async (assignmentId: number) => {
    if (!selectedCourse) return;
    try {
      await api.deleteAssignment(assignmentId);
      toast.success('Vazifa o\'chirildi');
      if (editingAssignmentId === assignmentId) cancelEditAssignment();
      await loadAssignments(selectedCourse.id as number);
    } catch {
      toast.error('Vazifani o\'chirishda xatolik');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
        <BookOpen className="w-8 h-8 text-cyan-500" />
      </motion.div>
      <span className="ml-3 text-slate-400 font-black">Yuklanmoqda...</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            {mode !== 'courses' && (
              <motion.button whileHover={{ x: -3 }} onClick={() => setMode('courses')}
                className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 font-black transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kurslarga qaytish
              </motion.button>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              {mode === 'courses' ? 'Mening Kurslarim' : selectedCourse?.name}
            </h1>
            <p className="text-cyan-50 text-lg font-medium">
              {mode === 'courses' ? "O'qituvchi sifatida biriktirilgan kurslar" : `${enrolledStudentIds.size} o'quvchi ro'yxatda`}
            </p>
          </div>
          <BookOpen className="w-20 h-20 text-white opacity-70 hidden sm:block" />
        </div>
      </div>

      {mode === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-black">Hozircha kurs yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => (
                <CourseCard key={course.id} course={course} index={idx} onSelect={handleSelectCourse} />
              ))}
            </div>
          )}
        </div>
      )}

      {(mode === 'all' || mode === 'individual') && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex gap-3">
            <button onClick={() => setMode('all')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase transition-all ${
                mode === 'all' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'}`}>
              <Globe className="w-4 h-4" /> Hammaga Yuborish
            </button>
            <button onClick={() => setMode('individual')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase transition-all ${
                mode === 'individual' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'}`}>
              <UserCheck className="w-4 h-4" /> Alohida Yuborish
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'all' && (
              <motion.div key="all" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 p-8 space-y-5 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">Barcha O'quvchilarga Vazifa</h3>
                    <p className="text-slate-400 text-sm">{enrolledStudentIds.size} ta o'quvchi bildirishnoma oladi</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vazifa Mavzusi</label>
                  <input type="text" value={allTitle} onChange={e => setAllTitle(e.target.value)}
                    placeholder="Masalan: O'zbekiston tarixi mavzusidagi topshiriq"
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vazifa Mazmuni</label>
                  <textarea value={allTask} onChange={e => setAllTask(e.target.value)}
                    placeholder="Vazifaning batafsil mazmunini yozing..." rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 transition-colors resize-none" />
                </div>
                {sentAllCourseIds.has(selectedCourse?.id as number) ? (
                  <div className="w-full py-4 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-black uppercase tracking-wider flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Yuborildi (qayta yuborib bo'lmaydi)
                  </div>
                ) : (
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleSendAll}
                    disabled={isSubmitting || !allTitle.trim() || !allTask.trim()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isSubmitting ? 'Yuborilmoqda...' : `Hammaga Yuborish (${enrolledStudentIds.size} kishi)`}
                  </motion.button>
                )}
              </motion.div>
            )}

            {mode === 'individual' && (
              <motion.div key="ind" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-violet-500/30 p-8 space-y-5 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
                    <UserCheck className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">Alohida O'quvchiga Vazifa</h3>
                    <p className="text-slate-400 text-sm">Tanlagan o'quvchingizga maxsus vazifa yuboring</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">O'quvchi Tanlang</label>
                  {enrolledStudents.length === 0 ? (
                    <p className="text-slate-500 text-sm py-3">Bu kursda o'quvchi yo'q</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                      {enrolledStudents.map(s => (
                        <motion.button key={s.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedStudentId(s.id === selectedStudentId ? null : s.id as number)}
                          className={`relative p-3 rounded-xl text-left transition-all border ${
                            selectedStudentId === s.id
                              ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/30 border-violet-500/60 text-white'
                              : 'bg-slate-700/30 border-slate-600/40 text-slate-300 hover:border-slate-500'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${selectedStudentId === s.id ? 'bg-violet-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-xs truncate">{s.name}</span>
                          </div>
                          {selectedStudentId === s.id && <Check className="w-3.5 h-3.5 text-violet-400 absolute top-2 right-2" />}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {selectedStudentId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                        <Check className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-300 font-black text-sm">
                          Tanlandi: {enrolledStudents.find(s => s.id === selectedStudentId)?.name}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vazifa Mavzusi</label>
                        <input type="text" value={indTitle} onChange={e => setIndTitle(e.target.value)}
                          placeholder="Masalan: Shaxsiy topshiriq"
                          className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/70 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vazifa Mazmuni</label>
                        <textarea value={indTask} onChange={e => setIndTask(e.target.value)}
                          placeholder="Bu o'quvchi uchun maxsus vazifa..." rows={5}
                          className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/70 transition-colors resize-none" />
                      </div>
                      {selectedStudentId && sentIndStudentIds.has(`${selectedCourse?.id}-${selectedStudentId}`) ? (
                        <div className="w-full py-4 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-black uppercase tracking-wider flex items-center justify-center gap-2">
                          <Check className="w-5 h-5" /> Yuborildi (qayta yuborib bo'lmaydi)
                        </div>
                      ) : (
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleSendIndividual}
                          disabled={isSubmitting || !indTitle.trim() || !indTask.trim()}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-3xl bg-slate-900/60 border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-lg">Saqlangan Vazifalar</h3>
              <span className="text-xs text-slate-400 font-semibold">Jami: {assignments.length}</span>
            </div>

            {loadingAssignments ? (
              <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
            ) : assignments.length === 0 ? (
              <p className="text-slate-500 text-sm">Bu kurs uchun hozircha vazifa yo'q</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {assignments.map((assignment) => {
                  const isEditing = editingAssignmentId === assignment.id;
                  const targetStudent = assignment.student_id
                    ? students.find(s => s.id === assignment.student_id)?.name || `Student #${assignment.student_id}`
                    : null;

                  return (
                    <div key={assignment.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
                      {isEditing ? (
                        <>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600/60 text-white focus:outline-none focus:border-cyan-500/60"
                          />
                          <textarea
                            value={editTask}
                            onChange={(e) => setEditTask(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600/60 text-white focus:outline-none focus:border-cyan-500/60 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEditAssignment} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase inline-flex items-center gap-1.5">
                              <Save className="w-3.5 h-3.5" /> Saqlash
                            </button>
                            <button onClick={cancelEditAssignment} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-black uppercase inline-flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" /> Bekor
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-white font-black truncate">{assignment.title}</p>
                              <p className="text-slate-300 text-sm mt-1 line-clamp-3">{assignment.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => startEditAssignment(assignment)} className="px-2.5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 inline-flex items-center gap-1 text-xs font-black">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button onClick={() => setConfirmModal({ open: true, type: 'delete', id: assignment.id as number, title: assignment.title })} className="px-2.5 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 inline-flex items-center gap-1 text-xs font-black">
                                <Trash2 className="w-3.5 h-3.5" /> O'chirish
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2 py-1 rounded-md bg-slate-700/60 text-slate-200 font-semibold">
                              {targetStudent ? `Alohida: ${targetStudent}` : 'Hammaga yuborilgan'}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-slate-700/60 text-slate-400">
                              {assignment.created_at ? new Date(assignment.created_at).toLocaleString('uz-UZ') : 'Sana yo\'q'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirmModal.open}
        type={confirmModal.type}
        title={confirmModal.title}
        onCancel={() => setConfirmModal(p => ({ ...p, open: false }))}
        onConfirm={() => {
          if (confirmModal.type === 'delete' && confirmModal.id) {
            deleteAssignment(confirmModal.id);
          }
          setConfirmModal(p => ({ ...p, open: false }));
        }}
      />
    </motion.div>
  );
}

function CourseCard({ course, index, onSelect }: { course: Course; index: number; onSelect: (c: Course) => void }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api.getEnrollments(course.id as number)
      .then(e => setCount(e.length))
      .catch(() => setCount(0));
  }, [course.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
      className="cursor-pointer group" onClick={() => onSelect(course)}>
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 h-full transition-all group-hover:border-cyan-500/40">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-cyan-400 rounded-3xl transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              course.level === 'Beginner' ? 'bg-green-500/20 text-green-300' :
              course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'}`}>{course.level || 'Standard'}</span>
          </div>
          <h3 className="text-xl font-black text-white mb-2">{course.name}</h3>
          <p className="text-slate-400 text-sm mb-6 line-clamp-2">{course.description}</p>
          <div className="space-y-2 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {course.created_at ? new Date(course.created_at).toLocaleDateString('uz-UZ') : '-'}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" />
              {count === null ? <span className="animate-pulse text-slate-500">Yuklanmoqda...</span> : `${count} o'quvchi`}
            </div>
          </div>
          <div className="w-full mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-sm uppercase tracking-wider text-center hover:shadow-lg transition-all">
            Vazifa Berish
          </div>
        </div>
      </div>
    </motion.div>
  );
}