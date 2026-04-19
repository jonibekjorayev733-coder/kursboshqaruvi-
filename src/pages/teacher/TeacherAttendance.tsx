import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Course, Student } from '@/services/api';
import { toast } from 'sonner';
import { Check, X, Clock, Users, Calendar, CheckCircle, AlertCircle, History, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id?: number;
  student_id: number;
  course_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | null;
  timestamp?: string;
}

export default function TeacherAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<number, { status: 'present' | 'absent' | 'late' | null; timestamp?: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateAlreadySaved, setDateAlreadySaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'unmarked'>('all');
  const userId = localStorage.getItem('user_id');
  const teacherId = userId ? parseInt(userId, 10) : NaN;
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDate = selectedDate < todayStr;
  const isTodayDate = selectedDate === todayStr;
  const isFutureDate = selectedDate > todayStr;
  const canTakeAttendance = isTodayDate && !dateAlreadySaved;

  useEffect(() => {
    if (Number.isNaN(teacherId) || teacherId <= 0) {
      setLoading(false);
      return;
    }

    Promise.all([api.getCourses(teacherId), api.getStudents(), api.getAttendance()])
      .then(([c, s, att]) => {
        setCourses(c);
        setStudents(s);
        setAllAttendanceRecords(att);
        if (c.length > 0) {
          setSelectedCourse(c[0]);
          loadEnrollments(c[0].id as number);
        }
      })
      .catch(() => toast.error("Ma'lumot yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      setEnrolledStudentIds(new Set(enrollments.map((e: any) => e.student_id)));
    } catch { console.error('Error loading enrollments'); }
  };

  // Check if the selected date already has saved records in DB
  useEffect(() => {
    if (!selectedCourse) return;
    if (isFutureDate) {
      setDateAlreadySaved(false);
      setAttendance({});
      return;
    }

    const existing = allAttendanceRecords.filter(
      r => r.course_id === (selectedCourse.id as number) && r.date === selectedDate
    );
    if (existing.length > 0) {
      setDateAlreadySaved(true);
      // Populate with existing records
      const loaded: Record<number, { status: any; timestamp?: string }> = {};
      existing.forEach(r => { loaded[r.student_id] = { status: r.status, timestamp: r.timestamp }; });
      setAttendance(loaded);
    } else {
      setDateAlreadySaved(false);
      setAttendance({});
    }
  }, [selectedDate, selectedCourse, allAttendanceRecords, isFutureDate]);

  const courseStudents = useMemo(() => {
    return students.filter(s => enrolledStudentIds.has(s.id as number));
  }, [enrolledStudentIds, students]);

  // Attendance history grouped by date for the selected course
  const attendanceHistory = useMemo(() => {
    if (!selectedCourse) return {};
    const courseRecords = allAttendanceRecords.filter(r => r.course_id === (selectedCourse.id as number));
    const grouped: Record<string, AttendanceRecord[]> = {};
    courseRecords.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });
    return grouped;
  }, [allAttendanceRecords, selectedCourse]);

  const historyDates = useMemo(() => {
    return Object.keys(attendanceHistory).sort((a, b) => b.localeCompare(a));
  }, [attendanceHistory]);

  const todayAlreadySavedForCourse = useMemo(() => {
    if (!selectedCourse) return false;
    return allAttendanceRecords.some(
      r => r.course_id === (selectedCourse.id as number) && r.date === todayStr
    );
  }, [allAttendanceRecords, selectedCourse, todayStr]);

  const summary = useMemo(() => {
    const marks = Object.values(attendance);
    const present = marks.filter(m => m.status === 'present').length;
    const absent = marks.filter(m => m.status === 'absent').length;
    const late = marks.filter(m => m.status === 'late').length;
    const unmarked = Math.max(courseStudents.length - (present + absent + late), 0);
    return { present, absent, late, unmarked };
  }, [attendance, courseStudents.length]);

  const filteredStudents = useMemo(() => {
    if (isFutureDate) return [];
    const query = searchTerm.trim().toLowerCase();
    return courseStudents.filter(student => {
      const mark = attendance[student.id as number];
      const status = mark?.status ?? null;

      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unmarked' && !status) ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courseStudents, attendance, searchTerm, statusFilter, isFutureDate]);

  const handleMark = (studentId: number, status: 'present' | 'absent' | 'late') => {
    if (!canTakeAttendance) {
      if (isFutureDate) {
        toast.error('Kelajak sana uchun davomat olinmaydi');
      } else if (isPastDate) {
        toast.error('O\'tgan sana uchun yangi davomat olib bo\'lmaydi');
      } else {
        toast.error('Bugungi davomat allaqachon saqlangan');
      }
      return;
    }
    setAttendance(prev => ({ ...prev, [studentId]: { status, timestamp: new Date().toISOString() } }));
  };

  const handleSaveAttendance = async () => {
    if (!canTakeAttendance) {
      if (isFutureDate) {
        toast.error('Kelajak sana uchun davomat saqlab bo\'lmaydi');
      } else if (isPastDate) {
        toast.error('O\'tgan sana uchun yangi davomat saqlab bo\'lmaydi');
      } else {
        toast.error('Bugungi davomat allaqachon saqlangan');
      }
      return;
    }

    if (!selectedCourse || Object.keys(attendance).length === 0) {
      toast.error('Kurs tanlang va davomat belgilang');
      return;
    }
    setIsSaving(true);
    try {
      const records = Object.entries(attendance).map(([sid, data]) => ({
        student_id: parseInt(sid, 10),
        course_id: selectedCourse.id as number,
        date: selectedDate,
        status: data.status,
        timestamp: data.timestamp || new Date().toISOString()
      }));
      await Promise.all(records.map(r => api.createAttendance(r)));
      // Refresh all attendance records
      const fresh = await api.getAttendance();
      setAllAttendanceRecords(fresh);
      setDateAlreadySaved(true);
      toast.success(`${records.length} ta o'quvchining davomati saqlandi!`);
    } catch { toast.error('Davomat saqlanishda xatolik'); }
    finally { setIsSaving(false); }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (newDate > todayStr) {
      if (todayAlreadySavedForCourse) {
        toast.error('Bugun davomat olindi. Kelajak sana uchun davomat olinmaydi.');
      } else {
        toast.error('Kelajak sana uchun davomat olinmaydi.');
      }
    }
  };

  const handleCourseChange = (course: Course) => {
    setSelectedCourse(course);
    loadEnrollments(course.id as number);
    setAttendance({});
    setDateAlreadySaved(false);
    setSearchTerm('');
    setStatusFilter('all');
  };

  const markAllVisibleAs = (status: 'present' | 'absent' | 'late') => {
    if (isFutureDate) return;
    if (dateAlreadySaved) return;
    if (filteredStudents.length === 0) return;

    const timestamp = new Date().toISOString();
    setAttendance(prev => {
      const next = { ...prev };
      filteredStudents.forEach(student => {
        next[student.id as number] = { status, timestamp };
      });
      return next;
    });
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-28">

      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-teal-600 via-cyan-500 to-blue-500 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">Davomat Tekshiri</h1>
            <p className="text-blue-50 text-sm md:text-base font-medium">Ixcham rejim: qidirish, filtr, tez belgilash</p>
          </div>
          <Clock className="w-14 h-14 text-white opacity-70 hidden sm:block" />
        </div>
      </div>

      <AnimatePresence>
        {isFutureDate && (
          <motion.div key="future-date-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-black text-sm">
                {todayAlreadySavedForCourse
                  ? 'Bugun davomat olindi. Kelajak sana uchun davomat olinmaydi.'
                  : 'Bu sana hali kelmagan. Kelajak sana uchun davomat olinmaydi.'}
              </p>
            </div>
          </motion.div>
        )}

        {dateAlreadySaved && (
          <motion.div key="saved-date-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-black text-sm">{selectedDate} uchun davomat saqlangan (faqat ko'rish)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-2 z-20 rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700/60 p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-1 border-b border-slate-700/50">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Davomat boshqaruvi</h2>
          <p className="text-xs text-slate-400">1) Kurs/Sana tanlang → 2) Filtrlang → 3) Belgilang → 4) Saqlang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Kurs</label>
            <select
              value={selectedCourse?.id ?? ''}
              onChange={(e) => {
                const next = courses.find(c => String(c.id) === e.target.value);
                if (next) handleCourseChange(next);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-teal-500/70"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Sana</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                max={todayStr}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-teal-500/70"
              />
            </div>
          </div>

          <div className="flex items-end">
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => setShowHistory(!showHistory)}
              className="w-full h-[42px] flex items-center justify-between px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2 font-black text-sm">
                <History className="w-4 h-4 text-teal-400" /> Tarix ({historyDates.length})
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Kunlik holat</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <StatChip label="Jami" value={courseStudents.length} color="cyan" />
            <StatChip label="Keldi" value={summary.present} color="emerald" />
            <StatChip label="Kelmadi" value={summary.absent} color="red" />
            <StatChip label="Kech" value={summary.late} color="yellow" />
            <StatChip label="Belgilanmagan" value={summary.unmarked} color="slate" />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Qidiruv va filtr</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ism yoki email bo'yicha qidiring"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/70"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'present' | 'absent' | 'late' | 'unmarked')}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500/70"
          >
            <option value="all">Barchasi</option>
            <option value="present">Keldi</option>
            <option value="absent">Kelmadi</option>
            <option value="late">Kech keldi</option>
            <option value="unmarked">Belgilanmagan</option>
          </select>
          </div>
        </div>

        {canTakeAttendance && filteredStudents.length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Tez amallar (hozir ko'rinayotganlar)</p>
            <div className="flex flex-wrap gap-2">
              <QuickAction onClick={() => markAllVisibleAs('present')} label="Barchasini Keldi" color="emerald" />
              <QuickAction onClick={() => markAllVisibleAs('absent')} label="Barchasini Kelmadi" color="red" />
              <QuickAction onClick={() => markAllVisibleAs('late')} label="Barchasini Kech" color="yellow" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showHistory && historyDates.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {historyDates.map(date => {
                const dayRecords = attendanceHistory[date];
                const present = dayRecords.filter(r => r.status === 'present').length;
                const absent = dayRecords.filter(r => r.status === 'absent').length;
                const late = dayRecords.filter(r => r.status === 'late').length;
                return (
                  <button key={date}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      date === selectedDate ? 'bg-teal-500/20 border-teal-500/50' : 'bg-slate-700/30 border-slate-600/40 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-sm">{format(new Date(date), 'dd MMMM yyyy')}</span>
                      <span className="text-xs text-teal-400 font-black">{dayRecords.length > 0 ? Math.round((present / dayRecords.length) * 100) : 0}%</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-emerald-400">✓ {present}</span>
                      <span className="text-red-400">✕ {absent}</span>
                      <span className="text-yellow-400">⏰ {late}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCourse && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              Davomat ({filteredStudents.length}/{courseStudents.length})
            </h2>
            {dateAlreadySaved && <span className="text-xs text-amber-400 font-semibold">Ko'rish rejimi</span>}
          </div>

          <div className="hidden md:grid md:grid-cols-[1fr_280px_120px] gap-4 px-3 py-2 mb-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] uppercase tracking-widest text-slate-400 font-black">
            <span>O'quvchi</span>
            <span>Status tanlash</span>
            <span className="text-right">Natija</span>
          </div>

          {isFutureDate ? (
            <div className="text-center py-14 text-slate-300 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <p className="font-black text-base">Bu kun uchun davomat olinmaydi</p>
              <p className="text-xs text-slate-400 mt-1">Kelajak sana tanlangan. O'tgan kun yozuvlari yoki bugungi sana bilan ishlang.</p>
            </div>
          ) : isPastDate && !dateAlreadySaved ? (
            <div className="text-center py-14 text-slate-300 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <p className="font-black text-base">Bu o‘tgan sana uchun davomat topilmadi</p>
              <p className="text-xs text-slate-400 mt-1">O‘tgan sanalarda yangi davomat olinmaydi. Faqat avval saqlangan yozuvlar ko‘rsatiladi.</p>
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Bu kursda o'quvchi yo'q</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Qidiruv/filtr bo'yicha o'quvchi topilmadi</div>
          ) : (
            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
              {filteredStudents.map((student, idx) => {
                const mark = attendance[student.id as number];
                return (
                  <motion.div key={student.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.015 }}
                    className={`rounded-xl p-3 transition-all border ${
                      mark?.status === 'present' ? 'bg-emerald-500/10 border-emerald-500/40' :
                      mark?.status === 'absent' ? 'bg-red-500/10 border-red-500/40' :
                      mark?.status === 'late' ? 'bg-yellow-500/10 border-yellow-500/40' :
                      'bg-slate-800/40 border-slate-700/40'
                    }`}>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px_120px] gap-2 md:gap-4 items-center">
                      <div className="min-w-0">
                        <p className="text-white font-black text-sm truncate">{student.name}</p>
                        <p className="text-slate-400 text-xs truncate">{student.email}</p>
                        {mark?.timestamp && <p className="text-slate-500 text-[11px] mt-0.5">{format(new Date(mark.timestamp), 'HH:mm:ss')}</p>}
                      </div>

                      <div className="flex items-center gap-1.5 md:justify-start">
                        {[
                          { s: 'present' as const, label: 'Keldi', icon: <Check className="w-4 h-4" />, active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'text-slate-400 bg-slate-700/30 border-slate-600/30 hover:bg-emerald-500/20 hover:text-emerald-300' },
                          { s: 'absent' as const, label: 'Kelmadi', icon: <X className="w-4 h-4" />, active: 'bg-red-500 text-white border-red-500', inactive: 'text-slate-400 bg-slate-700/30 border-slate-600/30 hover:bg-red-500/20 hover:text-red-300' },
                          { s: 'late' as const, label: 'Kech', icon: <Clock className="w-4 h-4" />, active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'text-slate-400 bg-slate-700/30 border-slate-600/30 hover:bg-yellow-500/20 hover:text-yellow-300' },
                        ].map(opt => (
                          <button key={opt.s}
                            onClick={() => handleMark(student.id as number, opt.s)}
                            disabled={!canTakeAttendance}
                            className={`px-2.5 py-2 rounded-lg border transition-all inline-flex items-center gap-1.5 text-xs font-semibold ${mark?.status === opt.s ? opt.active : opt.inactive} ${!canTakeAttendance ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {opt.icon}
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {mark?.status && (
                        <span className={`justify-self-start md:justify-self-end md:text-right px-2.5 py-1 rounded-lg text-[11px] font-black ${
                          mark.status === 'present' ? 'bg-emerald-500/20 text-emerald-300' :
                          mark.status === 'absent' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {mark.status === 'present' ? 'KELDI' : mark.status === 'absent' ? 'KELMADI' : 'KECH'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedCourse && canTakeAttendance && Object.keys(attendance).length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(920px,calc(100%-2rem))] rounded-2xl bg-slate-900/95 border border-slate-700/70 p-3 backdrop-blur shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="text-xs text-slate-300 font-semibold sm:pr-2">
              Belgilangan: <span className="text-white font-black">{Object.keys(attendance).length}</span>
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black uppercase tracking-wider hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
            </button>
            <button
              onClick={() => setAttendance({})}
              className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-black uppercase tracking-wider hover:text-white"
            >
              Tozalash
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: 'emerald' | 'red' | 'yellow' | 'slate' | 'cyan' }) {
  const map = {
    emerald: 'bg-slate-800/70 border-emerald-500/30 text-emerald-300',
    red: 'bg-slate-800/70 border-red-500/30 text-red-300',
    yellow: 'bg-slate-800/70 border-yellow-500/30 text-yellow-300',
    slate: 'bg-slate-800/70 border-slate-500/40 text-slate-300',
    cyan: 'bg-slate-800/70 border-cyan-500/30 text-cyan-300',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${map[color]}`}>
      <p className="text-[10px] uppercase tracking-widest font-black opacity-80">{label}</p>
      <p className="text-lg font-black leading-5">{value}</p>
    </div>
  );
}

function QuickAction({ onClick, label, color }: { onClick: () => void; label: string; color: 'emerald' | 'red' | 'yellow' }) {
  const map = {
    emerald: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15',
    red: 'border-red-500/40 text-red-300 hover:bg-red-500/15',
    yellow: 'border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/15',
  };
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-lg border text-xs font-black transition-colors bg-slate-800/40 ${map[color]}`}>
      {label}
    </button>
  );
}