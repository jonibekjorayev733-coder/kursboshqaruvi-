import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Plus,
  Save,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { api, Course, Lesson, LessonAttendanceEntry, Student } from '@/services/api';

type PenaltyValue = 0 | 2 | 4;
type StatusFilter = 'all' | '0' | '2' | '4' | 'unmarked';

const PENALTY_OPTIONS: Array<{ value: PenaltyValue; label: string; description: string; className: string }> = [
  { value: 0, label: '0', description: 'To‘liq qatnashdi', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  { value: 2, label: '2', description: 'Qisman qatnashdi', className: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  { value: 4, label: '4', description: 'To‘liq qatnashmadi', className: 'text-rose-300 bg-rose-500/15 border-rose-500/30' },
];

function penaltyFromAttendanceRecord(record: any): PenaltyValue {
  if (record?.penalty_hours === 0 || record?.penalty_hours === 2 || record?.penalty_hours === 4) {
    return record.penalty_hours as PenaltyValue;
  }
  if (record?.status === 'present') return 0;
  if (record?.status === 'late') return 2;
  return 4;
}

function monthKeyFromDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toLocalDatetimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function TeacherAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonTopic, setLessonTopic] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<number, PenaltyValue | null>>({});
  const [gradeMap, setGradeMap] = useState<Record<number, string>>({});
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedMonthKey, setSelectedMonthKey] = useState(monthKeyFromDate(new Date().toISOString()));
  const [lessonDateTime, setLessonDateTime] = useState(toLocalDatetimeInputValue(new Date()));

  const userId = localStorage.getItem('user_id');
  const teacherId = userId ? parseInt(userId, 10) : NaN;

  const currentMonthDate = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const currentMonthKey = useMemo(() => monthKeyFromDate(currentMonthDate.toISOString()), [currentMonthDate]);

  // Build month options: all months that have lessons + current month, up to current month only (no future)
  const monthOptions = useMemo(() => {
    const seenKeys = new Set<string>();
    const options: { key: string; label: string }[] = [];

    // Always include current month first
    const curKey = currentMonthKey;
    seenKeys.add(curKey);
    options.push({ key: curKey, label: format(currentMonthDate, 'MMMM yyyy') });

    // Add months from existing lessons (only if <= current month)
    lessons.forEach((lesson) => {
      const mk = monthKeyFromDate(lesson.created_at);
      if (!mk || seenKeys.has(mk) || mk > curKey) return;
      seenKeys.add(mk);
      options.push({ key: mk, label: format(new Date(mk + '-01'), 'MMMM yyyy') });
    });

    // Sort descending (newest first)
    options.sort((a, b) => b.key.localeCompare(a.key));
    return options;
  }, [currentMonthDate, currentMonthKey, lessons]);

  const isCurrentMonthSelected = selectedMonthKey === currentMonthKey;

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => monthKeyFromDate(lesson.created_at) === selectedMonthKey),
    [lessons, selectedMonthKey],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedMonthKey(currentMonthKey);
  }, [currentMonthKey]);

  useEffect(() => {
    if (!selectedLesson) {
      if (visibleLessons.length === 0) {
        setAttendanceMap({});
        setGradeMap({});
        setIsEditingMode(false);
        return;
      }
      void selectLesson(visibleLessons[0]);
      return;
    }

    const stillVisible = visibleLessons.some((lesson) => lesson.id === selectedLesson.id);
    if (!stillVisible) {
      if (visibleLessons.length === 0) {
        setSelectedLesson(null);
        setAttendanceMap({});
        setGradeMap({});
        setIsEditingMode(false);
        return;
      }
      void selectLesson(visibleLessons[0]);
    }
  }, [selectedLesson, visibleLessons]);

  useEffect(() => {
    if (Number.isNaN(teacherId) || teacherId <= 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([api.getCourses(teacherId), api.getStudents()])
      .then(async ([courseData, studentData]) => {
        if (cancelled) return;
        setCourses(courseData);
        setStudents(studentData);
        if (courseData.length > 0) {
          const course = courseData[0];
          setSelectedCourse(course);
          setLessonTopic('');
          setSearchTerm('');
          setStatusFilter('all');
          setGradeMap({});
          setStudents(studentData);
          const [enrollments, lessonData] = await Promise.all([
            api.getEnrollments(course.id as number),
            api.getLessons(course.id as number),
          ]);
          if (cancelled) return;
          setEnrolledStudentIds(new Set(
            enrollments
              .map((item: any) => item.student_id)
              .filter((sid: number | null | undefined): sid is number => typeof sid === 'number')
          ));
          setLessons(lessonData);
        }
      })
      .catch(() => toast.error("Davomat sahifasi uchun ma'lumotlarni yuklab bo'lmadi"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEnrollments = async (courseId: number) => {
    const enrollments = await api.getEnrollments(courseId);
    setEnrolledStudentIds(new Set(
      enrollments
        .map((item: any) => item.student_id)
        .filter((studentId: number | null | undefined): studentId is number => typeof studentId === 'number')
    ));
  };

  const selectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    const lessonAttendance = await api.getAttendance({ lessonId: lesson.id });
    const mapped: Record<number, PenaltyValue | null> = {};
    const mappedGrades: Record<number, string> = {};

    lessonAttendance.forEach((record: any) => {
      mapped[record.student_id] = penaltyFromAttendanceRecord(record);
      mappedGrades[record.student_id] = record?.grade === null || record?.grade === undefined ? '' : String(record.grade);
    });

    setAttendanceMap(mapped);
    setGradeMap(mappedGrades);
    setIsEditingMode(!lesson.attendance_saved);
  };

  const loadLessons = async (courseId: number, preferredLessonId?: number) => {
    const lessonData = await api.getLessons(courseId);
    setLessons(lessonData);

    if (preferredLessonId) {
      const nextLesson = lessonData.find((lesson) => lesson.id === preferredLessonId) ?? null;
      if (nextLesson) {
        await selectLesson(nextLesson);
        return;
      }
    }

    if (lessonData.length === 0) {
      setSelectedLesson(null);
      setAttendanceMap({});
      setGradeMap({});
      setIsEditingMode(false);
    }
  };

  const handleCourseChange = async (course: Course, preloadedStudents?: Student[]) => {
    setSelectedCourse(course);
    setLessonTopic('');
    setSearchTerm('');
    setStatusFilter('all');
    setGradeMap({});
    setSelectedLesson(null);
    setAttendanceMap({});
    setSelectedMonthKey(currentMonthKey);
    setLessonDateTime(toLocalDatetimeInputValue(new Date()));
    if (preloadedStudents) {
      setStudents(preloadedStudents);
    }
    await Promise.all([loadEnrollments(course.id as number), loadLessons(course.id as number)]);
  };

  const courseStudents = useMemo(() => {
    return students
      .filter((student) => enrolledStudentIds.has(student.id as number))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [enrolledStudentIds, students]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return courseStudents.filter((student) => {
      const penalty = attendanceMap[student.id as number];
      const searchMatches = !query || student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'unmarked' && (penalty === null || penalty === undefined)) ||
        String(penalty) === statusFilter;

      return searchMatches && statusMatches;
    });
  }, [attendanceMap, courseStudents, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const values = Object.values(attendanceMap);
    const zero = values.filter((item) => item === 0).length;
    const two = values.filter((item) => item === 2).length;
    const four = values.filter((item) => item === 4).length;
    const unmarked = Math.max(courseStudents.length - (zero + two + four), 0);
    return { zero, two, four, unmarked };
  }, [attendanceMap, courseStudents.length]);

  const hasMarkedAllStudents = courseStudents.length > 0 && courseStudents.every((student) => {
    const studentId = student.id as number;
    return attendanceMap[studentId] !== null && attendanceMap[studentId] !== undefined;
  });
  const canEditAttendance = Boolean(selectedLesson && selectedLesson.attendance_saved && !selectedLesson.attendance_edit_used && !isEditingMode);
  const isReadOnly = !selectedLesson || (selectedLesson.attendance_saved && !isEditingMode);

  const handleCreateLesson = async () => {
    if (!selectedCourse) {
      toast.error('Avval kurs tanlang');
      return;
    }

    if (!isCurrentMonthSelected) {
      toast.error('O‘tgan oylarga lesson qo‘shib bo‘lmaydi — faqat ko‘rish mumkin');
      return;
    }
    if (!topic) {
      toast.error('Lesson mavzusini kiriting');
      return;
    }

    if (!lessonDateTime) {
      toast.error('Lesson vaqtini kiriting');
      return;
    }

    const scheduledAt = new Date(lessonDateTime);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('Lesson vaqti noto‘g‘ri');
      return;
    }

    if (scheduledAt.getTime() < Date.now()) {
      toast.error('O‘tgan vaqtga lesson qo‘shib bo‘lmaydi');
      return;
    }

    try {
      setCreatingLesson(true);
      const createdLesson = await api.createLesson({
        course_id: selectedCourse.id as number,
        topic,
        lesson_datetime: scheduledAt.toISOString(),
      });
      setLessonTopic('');
      setLessonDateTime(toLocalDatetimeInputValue(new Date()));
      setSelectedMonthKey(monthKeyFromDate(createdLesson.created_at) || currentMonthKey);
      setIsLessonDrawerOpen(false);
      await loadLessons(selectedCourse.id as number, createdLesson.id);
      toast.success('Lesson yaratildi. Endi davomat olishingiz mumkin.');
    } catch (error: any) {
      toast.error(error?.message || 'Lesson yaratilmadi');
    } finally {
      setCreatingLesson(false);
    }
  };

  const handleSelectPenalty = (studentId: number, value: PenaltyValue) => {
    if (isReadOnly) return;
    setAttendanceMap((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleScoreChange = (studentId: number, value: string) => {
    if (isReadOnly) return;
    if (value !== '' && !/^\d{0,3}(\.\d{0,2})?$/.test(value)) return;
    setGradeMap((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleStartEdit = () => {
    if (!selectedLesson || selectedLesson.attendance_edit_used) return;
    setIsEditingMode(true);
    toast.message('Edit rejimi yoqildi. O‘zgartirib bo‘lgach Save bosing.');
  };

  const handleCancelEdit = async () => {
    if (!selectedLesson) return;
    await selectLesson(selectedLesson);
    setIsEditingMode(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedLesson) {
      toast.error('Avval lesson tanlang');
      return;
    }

    if (!hasMarkedAllStudents) {
      toast.error("Saqlashdan oldin barcha o'quvchilarga davomat kiriting");
      return;
    }

    const records: LessonAttendanceEntry[] = courseStudents.map((student) => {
      const gradeStr = gradeMap[student.id as number];
      const gradeVal = gradeStr !== undefined && gradeStr.trim() !== '' ? Number(gradeStr) : undefined;
      return {
        student_id: student.id as number,
        penalty_hours: attendanceMap[student.id as number] as PenaltyValue,
        score: gradeVal,
      };
    });

    try {
      setSaving(true);
      await api.saveLessonAttendance(selectedLesson.id as number, records);
      if (!selectedCourse) return;
      await loadLessons(selectedCourse.id as number, selectedLesson.id);
      setIsEditingMode(false);
      toast.success(selectedLesson.attendance_saved ? 'Davomat edit qilinib saqlandi' : 'Davomat saqlandi');
    } catch (error: any) {
      toast.error(error?.message || 'Davomat saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Davomat sahifasi yuklanmoqda...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-28">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-6 shadow-2xl shadow-cyan-950/40 md:p-8">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">Lesson asosida davomat</p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Universitet usulida davomat</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
              Real-time vaqt bilan ishlaydi: lessonni hozirgi yoki kelajak vaqtga qo‘shasiz, o‘tgan vaqtga qo‘sha olmaysiz. Oylik filtr orqali shu oy va oldingi oy lessonlarini tanlab ko‘rishingiz mumkin.
            </p>
          </div>
          <GraduationCap className="hidden h-16 w-16 text-cyan-300/60 sm:block" />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/20 md:p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Kurs tanlash</label>
            <select
              value={selectedCourse?.id ?? ''}
              onChange={(event) => {
                const next = courses.find((course) => String(course.id) === event.target.value);
                if (next) {
                  void handleCourseChange(next);
                }
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base font-bold text-white outline-none transition focus:border-cyan-500/60"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="O‘quvchilar" value={courseStudents.length} accent="cyan" />
          <StatCard label="0 qo‘yildi" value={summary.zero} accent="emerald" />
          <StatCard label="2 qo‘yildi" value={summary.two} accent="amber" />
          <StatCard label="4 qo‘yildi" value={summary.four} accent="rose" />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/20 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xl font-black text-white">Lessonlar</p>
            <p className="text-sm text-slate-400">Tanlangan oy bo‘yicha lessonlarni ko‘rasiz va xohlaganini ochib davomatni tekshirasiz.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              {visibleLessons.length} ta lesson
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-cyan-200">
              Hozir: {format(now, 'dd MMM yyyy • HH:mm:ss')}
            </div>
            <select
              value={selectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-cyan-500/60"
            >
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!isCurrentMonthSelected) {
                  toast.error('O‘tgan oylarga lesson qo‘shib bo‘lmaydi — faqat ko‘rish mumkin');
                  return;
                }
                setLessonDateTime(toLocalDatetimeInputValue(new Date()));
                setIsLessonDrawerOpen(true);
              }}
              disabled={!selectedCourse}
              title={!isCurrentMonthSelected ? 'O‘tgan oy — faqat ko‘rish' : 'Yangi lesson qo‘shish'}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 ${
                isCurrentMonthSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-700/30'
                  : 'bg-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="h-4 w-4" />
              {isCurrentMonthSelected ? 'Lesson add' : 'Faqat ko‘rish'}
            </button>
          </div>
        </div>

        {visibleLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="text-lg font-black text-white">Tanlangan oyda lesson topilmadi</p>
            <p className="mt-2 text-sm text-slate-400">Boshqa oyni tanlang yoki yangi lesson qo‘shing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleLessons.map((lesson) => {
              const isActive = selectedLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => void selectLesson(lesson)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-cyan-500/60 bg-cyan-500/10 shadow-lg shadow-cyan-800/20'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white">{lesson.topic}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lesson.created_at ? format(new Date(lesson.created_at), 'dd MMM yyyy • HH:mm') : 'Vaqt avtomatik'}
                      </p>
                    </div>
                    <LessonBadge lesson={lesson} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedLesson && (
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/20 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-2xl font-black text-white">{selectedLesson.topic}</p>
              <p className="mt-1 text-sm text-slate-400">
                {selectedLesson.created_at ? format(new Date(selectedLesson.created_at), 'dd MMMM yyyy • HH:mm') : 'Vaqt avtomatik yaratiladi'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ism yoki email qidiring"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/60"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-500/60"
              >
                <option value="all">Barchasi</option>
                <option value="0">0 soat</option>
                <option value="2">2 soat</option>
                <option value="4">4 soat</option>
                <option value="unmarked">Belgilanmagan</option>
              </select>
            </div>
          </div>

          {!selectedLesson.attendance_saved ? (
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-cyan-300" />
              <p className="text-sm font-semibold">Bu lesson uchun davomat hali saqlanmagan. Barcha o‘quvchilarga 0/2/4 va baho kiritib, so‘ng Save bosing.</p>
            </div>
          ) : isEditingMode ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
              <Edit3 className="h-5 w-5 flex-shrink-0 text-amber-300" />
              <p className="text-sm font-semibold">Edit rejimi yoqilgan. Bu lesson davomatini faqat bir marta qayta saqlash mumkin.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" />
              <p className="text-sm font-semibold">
                Davomat saqlangan. {selectedLesson.attendance_edit_used ? 'Edit limiti tugagan.' : 'Kerak bo‘lsa bir marta edit qilishingiz mumkin.'}
              </p>
            </div>
          )}

          {courseStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center text-slate-300">
              Bu kursda hali o‘quvchi yo‘q.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center text-slate-300">
              Filtr bo‘yicha o‘quvchi topilmadi.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[1.2fr_220px_140px_120px] gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
                <span>O‘quvchi</span>
                <span>Davomat tanlash</span>
                <span>Baho</span>
                <span className="text-right">Natija</span>
              </div>

              <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
                {filteredStudents.map((student) => {
                  const penalty = attendanceMap[student.id as number];
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`grid grid-cols-1 gap-3 rounded-2xl border p-4 transition-all md:grid-cols-[1.2fr_220px_140px_120px] ${
                        penalty === 0
                          ? 'border-emerald-500/35 bg-emerald-500/10'
                          : penalty === 2
                            ? 'border-amber-500/35 bg-amber-500/10'
                            : penalty === 4
                              ? 'border-rose-500/35 bg-rose-500/10'
                              : 'border-slate-800 bg-slate-900/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-white">{student.name}</p>
                        <p className="truncate text-sm text-slate-400">{student.email}</p>
                      </div>

                      <select
                        value={penalty ?? ''}
                        onChange={(event) => handleSelectPenalty(student.id as number, Number(event.target.value) as PenaltyValue)}
                        disabled={isReadOnly}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black outline-none transition ${
                          isReadOnly
                            ? 'cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-400'
                            : 'border-slate-700 bg-slate-900 text-white focus:border-cyan-500/60'
                        }`}
                      >
                        <option value="">Tanlang</option>
                        <option value="0">0 — to‘liq keldi</option>
                        <option value="2">2 — qisman qatnashdi</option>
                        <option value="4">4 — qatnashmadi</option>
                      </select>

                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={gradeMap[student.id as number] ?? ''}
                          onChange={(event) => handleScoreChange(student.id as number, event.target.value)}
                          disabled={isReadOnly}
                          placeholder="Baho"
                          className={`w-full rounded-2xl border px-4 py-3 text-sm font-black outline-none transition ${
                            isReadOnly
                              ? 'cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-400'
                              : 'border-slate-700 bg-slate-900 text-white focus:border-cyan-500/60'
                          }`}
                        />
                      </div>

                      <div className="md:justify-self-end">
                        {penalty === null || penalty === undefined ? (
                          <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-400">Belgilanmagan</span>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-2">
                            <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${PENALTY_OPTIONS.find((item) => item.value === penalty)?.className}`}>
                              {penalty} soat
                            </span>
                            {(gradeMap[student.id as number] ?? '') !== '' && (
                              <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-black text-cyan-200">
                                Baho: {gradeMap[student.id as number]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-300 md:text-sm">
                    <span>Lesson: <span className="font-black text-white">{selectedLesson.topic}</span></span>
                    <span className="hidden text-slate-600 md:inline">•</span>
                    <span>Belgilangani: <span className="font-black text-white">{Object.values(attendanceMap).filter((value) => value !== null && value !== undefined).length}</span> / {courseStudents.length}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canEditAttendance && (
                      <button
                        onClick={handleStartEdit}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-500/20"
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                    )}

                    {isEditingMode && selectedLesson.attendance_saved && (
                      <button
                        onClick={() => void handleCancelEdit()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-slate-600"
                      >
                        Bekor qilish
                      </button>
                    )}

                    {(!selectedLesson.attendance_saved || isEditingMode) && (
                      <button
                        onClick={() => void handleSaveAttendance()}
                        disabled={saving || !hasMarkedAllStudents}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saqlanmoqda...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isLessonDrawerOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLessonDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cyan-500/20 bg-slate-950 shadow-2xl shadow-black/50"
            >
              <div className="border-b border-slate-800 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Yangi lesson</p>
                <h3 className="mt-2 text-2xl font-black text-white">Lesson qo‘shish</h3>
                <p className="mt-2 text-sm text-slate-400">Mavzu va vaqt kiriting. O‘tgan vaqtga lesson qo‘shib bo‘lmaydi, faqat ko‘rish mumkin.</p>
              </div>

              <div className="flex-1 space-y-4 p-5">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Kurs</label>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-base font-black text-white">
                    {selectedCourse?.name || 'Kurs tanlanmagan'}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Mavzu nomi</label>
                  <textarea
                    value={lessonTopic}
                    onChange={(event) => setLessonTopic(event.target.value)}
                    placeholder="Masalan: JavaScript object methods"
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Lesson vaqti</label>
                  <input
                    type="datetime-local"
                    value={lessonDateTime}
                    min={toLocalDatetimeInputValue(now)}
                    onChange={(event) => setLessonDateTime(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base font-semibold text-white outline-none transition focus:border-cyan-500/60"
                  />
                  <p className="mt-2 text-xs text-slate-500">Faqat hozirgi yoki kelajak vaqtga lesson qo‘shiladi.</p>
                </div>
              </div>

              <div className="border-t border-slate-800 p-5">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLessonDrawerOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-slate-600"
                  >
                    Yopish
                  </button>
                  <button
                    onClick={handleCreateLesson}
                    disabled={!selectedCourse || creatingLesson}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {creatingLesson ? 'Yaratilmoqda...' : 'Lesson add'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LessonBadge({ lesson }: { lesson: Lesson }) {
  if (!lesson.attendance_saved) {
    return <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">Yangi</span>;
  }

  if (!lesson.attendance_edit_used) {
    return <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-200">Edit bor</span>;
  }

  return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-200">Yakunlangan</span>;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  const accentMap = {
    cyan: 'border-cyan-500/30 text-cyan-300',
    emerald: 'border-emerald-500/30 text-emerald-300',
    amber: 'border-amber-500/30 text-amber-300',
    rose: 'border-rose-500/30 text-rose-300',
  };

  return (
    <div className={`rounded-2xl border bg-slate-900/70 px-4 py-3 ${accentMap[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}