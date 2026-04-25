import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { api, Course, Student } from '@/services/api';
import { Users, Plus, Trash2, CheckCircle, Circle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherStudents() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const isBulkEnrollmentRef = useRef(false);
  const userId = localStorage.getItem('user_id');
  const teacherId = userId ? parseInt(userId, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(teacherId) || teacherId <= 0) {
      setLoading(false);
      return;
    }

    Promise.all([api.getCourses(teacherId), api.getStudents()])
      .then(([c, s]) => {
        setCourses(c);
        setStudents(s);
        if (c.length > 0) {
          setSelectedCourse(c[0]);
          loadEnrollments(c[0].id as number);
        }
      })
      .catch(e => {
        console.error('Error loading data:', e);
        toast.error('Ma\'lumot yuklashda xatolik');
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const customEvent = event as CustomEvent<{ event?: string }>;
      const eventName = customEvent.detail?.event || '';
      if (!selectedCourse?.id) {
        return;
      }
      if (isBulkEnrollmentRef.current) {
        return;
      }
      if (eventName === 'enrollment.created' || eventName.startsWith('student.') || eventName.startsWith('course.')) {
        loadEnrollments(selectedCourse.id as number);
      }
    };

    window.addEventListener('edugrow-realtime-event', handleRealtime as EventListener);
    return () => window.removeEventListener('edugrow-realtime-event', handleRealtime as EventListener);
  }, [selectedCourse?.id]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));
      setEnrolledStudentIds(enrolledIds);
    } catch (e) {
      console.error('Error loading enrollments:', e);
    }
  };

  const assignedStudents = useMemo(() => {
    return students.filter(s => enrolledStudentIds.has(s.id as number));
  }, [enrolledStudentIds, students]);

  const unassignedStudents = useMemo(() => {
    return students
      .filter(s => !enrolledStudentIds.has(s.id as number))
      .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [enrolledStudentIds, students, searchTerm]);

  const handleToggleStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.size === unassignedStudents.length);
  };

  const handleToggleAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
      setSelectAll(false);
    } else {
      setSelectedStudents(new Set(unassignedStudents.map(s => s.id as number)));
      setSelectAll(true);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedCourse || selectedStudents.size === 0) {
      toast.error('Kurs va o\'quvchi tanlang');
      return;
    }

    try {
      setIsAddingStudents(true);
      isBulkEnrollmentRef.current = true;
      const courseId = selectedCourse.id as number;

      const selectedIds = Array.from(selectedStudents);
      let addedCount = 0;
      let alreadyEnrolledCount = 0;
      let failedCount = 0;
      const addedStudentIds: number[] = [];

      const results = await Promise.all(
        selectedIds.map(async (studentId) => {
          try {
            await api.createEnrollment(studentId, courseId);
            return { studentId, status: 'added' as const };
          } catch (err) {
            const message = err instanceof Error ? err.message.toLowerCase() : '';
            if (message.includes('already enrolled')) {
              return { studentId, status: 'already' as const };
            }
            console.error('Error enrolling student', studentId, ':', err);
            return { studentId, status: 'failed' as const };
          }
        }),
      );

      results.forEach((item) => {
        if (item.status === 'added') {
          addedCount += 1;
          addedStudentIds.push(item.studentId);
        } else if (item.status === 'already') {
          alreadyEnrolledCount += 1;
        } else {
          failedCount += 1;
        }
      });

      if (addedStudentIds.length > 0) {
        setEnrolledStudentIds((prev) => {
          const next = new Set(prev);
          addedStudentIds.forEach((studentId) => next.add(studentId));
          return next;
        });
      }

      await loadEnrollments(courseId);
      setSelectedStudents(new Set());
      setSelectAll(false);

      if (addedCount > 0) {
        toast.success(`${addedCount} ta o'quvchi qo'shildi`);
      }
      if (alreadyEnrolledCount > 0) {
        toast.info(`${alreadyEnrolledCount} ta o'quvchi avval qo'shilgan`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} ta o'quvchini qo'shishda xatolik yuz berdi`);
      }
    } catch (e) {
      console.error('Error adding students:', e);
      toast.error('Xatolik yuz berdi');
    } finally {
      isBulkEnrollmentRef.current = false;
      setIsAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedCourse) return;

    try {
      setRemovingStudentId(studentId);
      console.log('[LOG] Deleting enrollment for student', studentId);
      const courseId = selectedCourse.id as number;
      await api.deleteEnrollment(studentId, courseId);
      
      // Reload enrollments
      await loadEnrollments(courseId);
      toast.success('O\'quvchi o\'chirildi');
    } catch (e) {
      console.error('Error removing student:', e);
      toast.error('Xatolik yuz berdi');
    } finally {
      setRemovingStudentId(null);
    }
  };

  if (loading) return <div className="text-center py-20">Yuklanmoqda...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-6 sm:space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight leading-tight">O'quvchilar Boshqaruvi</h1>
              <p className="text-red-50 text-sm sm:text-base md:text-lg font-medium">Kursga o'quvchilar qo'shing va boshqaring</p>
            </div>
            <Users className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* COURSE SELECTOR */}
      {courses.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {courses.map(course => (
            <motion.button
              key={course.id}
              whileHover={{ y: -4 }}
              onClick={() => {
                setSelectedCourse(course);
                loadEnrollments(course.id as number);
              }}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
                selectedCourse?.id === course.id
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50'
                  : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:shadow-lg'
              }`}
            >
              <div className="relative z-10">
                <h3 className={`font-black text-base sm:text-lg mb-1.5 sm:mb-2 ${selectedCourse?.id === course.id ? 'text-white' : 'text-white'}`}>
                  {course.name}
                </h3>
                <p className={`text-xs sm:text-sm ${selectedCourse?.id === course.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {selectedCourse?.id === course.id ? enrolledStudentIds.size : assignedStudents.filter(s => s.id).length} o'quvchi
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* MAIN CONTENT */}
      {selectedCourse && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* LEFT PANEL - UNASSIGNED STUDENTS */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl max-h-[72vh] lg:max-h-none h-fit lg:h-[600px] overflow-y-auto">
            <div className="sticky top-0 z-10 mb-4 sm:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-800/80">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Mavjud O'quvchilar</h2>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="O'quvchi qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            {/* Select All */}
            {unassignedStudents.length > 0 && (
              <motion.button
                onClick={handleToggleAll}
                className="w-full mb-4 px-4 py-3.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm sm:text-base font-black transition-colors flex items-center justify-center gap-2"
              >
                {selectAll ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                Hammasini tanlash ({unassignedStudents.length})
              </motion.button>
            )}

            {/* Student List */}
            <div className="space-y-3">
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Qo'shish uchun o'quvchi yo'q</p>
                </div>
              ) : (
                unassignedStudents.map(student => (
                  <motion.div
                    key={student.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleToggleStudent(student.id as number)}
                    className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedStudents.has(student.id as number)
                        ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50 border border-purple-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {selectedStudents.has(student.id as number) ? (
                          <CheckCircle className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base sm:text-lg font-semibold truncate">{student.name}</p>
                        <p className="text-slate-400 text-xs sm:text-sm truncate">{student.email}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Add Button */}
            {unassignedStudents.length > 0 && (
              <div className="sticky bottom-0 mt-4 pt-3 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                <motion.button
                  onClick={handleAddStudents}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm sm:text-base font-black hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={selectedStudents.size === 0 || isAddingStudents}
                >
                  {isAddingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isAddingStudents ? 'Qo\'shilmoqda...' : `Qo'shish (${selectedStudents.size})`}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* RIGHT PANEL - ASSIGNED STUDENTS */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl max-h-[72vh] lg:max-h-none h-fit lg:h-[600px] overflow-y-auto">
            <div className="sticky top-0 z-10 mb-4 sm:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-800/80">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1 break-words">{selectedCourse.name}</h2>
              <p className="text-slate-400 text-sm">Qo'shilgan o'quvchilar: <span className="text-purple-400 font-black">{assignedStudents.length}</span></p>
            </div>

            {/* Assigned Student List */}
            <div className="space-y-3">
              {assignedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Hali o'quvchi qo'shilmagan</p>
                </div>
              ) : (
                assignedStudents.map(student => (
                  <motion.div
                    key={student.id}
                    whileHover={{ x: 4 }}
                    className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base sm:text-lg font-semibold truncate">{student.name}</p>
                        <p className="text-slate-400 text-xs sm:text-sm truncate">{student.email}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveStudent(student.id as number)}
                        disabled={removingStudentId === (student.id as number)}
                        className="p-2.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                      >
                        {removingStudentId === (student.id as number) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
