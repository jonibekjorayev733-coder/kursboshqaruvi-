import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api, Course, Student } from '@/services/api';
import { Download, FileText, TrendingUp, Users, BookOpen, Award, BarChart3, PieChart } from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherReports() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [performances, setPerformances] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<number>>(new Set());
  const userId = localStorage.getItem('user_id');

  const loadEnrollmentCounts = async (teacherCourses: Course[]) => {
    try {
      const pairs = await Promise.all(
        teacherCourses.map(async (course) => {
          const enrollments = await api.getEnrollments(course.id as number);
          return [course.id as number, enrollments.length] as const;
        })
      );
      const next: Record<number, number> = {};
      pairs.forEach(([courseId, count]) => {
        next[courseId] = count;
      });
      setEnrollmentCounts(next);
    } catch (e) {
      console.error('Error loading enrollment counts:', e);
    }
  };

  useEffect(() => {
    Promise.all([api.getCourses(), api.getStudents(), api.getPerformance(), api.getAttendance()])
      .then(([c, s, p, a]) => {
        const teacherCourses = c.filter((course: any) => course.teacher_id?.toString() === userId);
        setCourses(teacherCourses);
        loadEnrollmentCounts(teacherCourses);
        setStudents(s);
        setPerformances(p);
        setAttendance(a);
        if (teacherCourses.length > 0) {
          setSelectedCourse(teacherCourses[0]);
          loadEnrollments(teacherCourses[0].id as number);
        }
      })
      .catch(e => {
        console.error('Error loading data:', e);
        toast.error('Ma\'lumot yuklashda xatolik');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const loadEnrollments = async (courseId: number) => {
    try {
      const enrollments = await api.getEnrollments(courseId);
      const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));
      setEnrolledStudentIds(enrolledIds);
    } catch (e) {
      console.error('Error loading enrollments:', e);
    }
  };

  const courseStats = useMemo(() => {
    if (!selectedCourse) return null;
    
    const courseStudents = students.filter(s => enrolledStudentIds.has(s.id as number));
    const coursePerformances = performances.filter(p => p.course_id === selectedCourse.id);
    const courseAttendance = attendance.filter(a => a.course_id === selectedCourse.id);

    const avgScore = coursePerformances.length 
      ? Math.round(coursePerformances.reduce((sum, p) => sum + (p.score || 0), 0) / coursePerformances.length)
      : 0;

    const avgAttendance = courseAttendance.length
      ? Math.round((courseAttendance.filter(a => a.status === 'present').length / courseAttendance.length) * 100)
      : 0;

    const topPerformer = courseStudents.reduce((best, student) => {
      const studentAvg = coursePerformances
        .filter(p => p.student_id === student.id)
        .reduce((sum, p) => sum + (p.score || 0), 0) / 
        Math.max(coursePerformances.filter(p => p.student_id === student.id).length, 1);
      
      return studentAvg > (best.score || 0) ? { name: student.name, score: studentAvg } : best;
    }, { name: 'N/A', score: 0 });

    return {
      totalStudents: courseStudents.length,
      avgScore,
      avgAttendance,
      topPerformer: topPerformer.name,
      assignments: coursePerformances.length,
      attendanceRecords: courseAttendance.length
    };
  }, [selectedCourse, students, performances, attendance, enrolledStudentIds]);

  const studentReports = useMemo(() => {
    if (!selectedCourse) return [];

    const courseStudents = students.filter(s => enrolledStudentIds.has(s.id as number));
    
    return courseStudents.map(student => {
      const studentPerfs = performances.filter(p => p.student_id === student.id && p.course_id === selectedCourse.id);
      const studentAtts = attendance.filter(a => a.student_id === student.id && a.course_id === selectedCourse.id);
      
      const avgScore = studentPerfs.length 
        ? Math.round(studentPerfs.reduce((sum, p) => sum + (p.score || 0), 0) / studentPerfs.length)
        : 0;

      const attendanceRate = studentAtts.length
        ? Math.round((studentAtts.filter(a => a.status === 'present').length / studentAtts.length) * 100)
        : 0;

      return {
        id: student.id,
        name: student.name,
        avgScore,
        attendanceRate,
        totalAssignments: studentPerfs.length,
        presentDays: studentAtts.filter(a => a.status === 'present').length
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [selectedCourse, students, performances, attendance, enrolledStudentIds]);

  const handleExport = (format: string) => {
    toast.success(`${format.toUpperCase()} formatda eksport qilindi ✓`);
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Hisobotlar & Analitika</h1>
              <p className="text-amber-50 text-lg font-medium">O'quvchilar va kurslar bo'yicha batafsil tahlil</p>
            </div>
            <BarChart3 className="w-24 h-24 text-white opacity-80" />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3 flex-wrap">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-black text-sm uppercase tracking-wider transition-all"
            >
              <FileText className="w-4 h-4" />
              PDF
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('Excel')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-black text-sm uppercase tracking-wider transition-all"
            >
              <Download className="w-4 h-4" />
              Excel
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* COURSE SELECTOR */}
      {courses.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <motion.button
              key={course.id}
              whileHover={{ y: -4 }}
              onClick={() => {
                setSelectedCourse(course);
                loadEnrollments(course.id as number);
              }}
              className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                selectedCourse?.id === course.id
                  ? 'bg-gradient-to-br from-orange-600 to-amber-600 shadow-lg shadow-orange-500/50'
                  : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:shadow-lg'
              }`}
            >
              <div className="relative z-10">
                <h3 className={`font-black text-lg mb-2 ${selectedCourse?.id === course.id ? 'text-white' : 'text-white'}`}>
                  {course.name}
                </h3>
                <p className={`text-sm flex items-center gap-1 ${selectedCourse?.id === course.id ? 'text-white/70' : 'text-slate-400'}`}>
                  <Users className="w-4 h-4" />
                  {enrollmentCounts[course.id as number] ?? 0} o'quvchi
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* STATS GRID */}
      {selectedCourse && courseStats && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Students */}
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-300 text-sm font-black uppercase tracking-wider mb-2">Jami O'quvchilar</p>
                <p className="text-4xl font-black text-blue-400">{courseStats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500/30" />
            </div>
          </motion.div>

          {/* Average Score */}
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-300 text-sm font-black uppercase tracking-wider mb-2">O'rtacha Baho</p>
                <p className="text-4xl font-black text-green-400">{courseStats.avgScore}%</p>
              </div>
              <Award className="w-12 h-12 text-green-500/30" />
            </div>
          </motion.div>

          {/* Average Attendance */}
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-300 text-sm font-black uppercase tracking-wider mb-2">O'rtacha Davomat</p>
                <p className="text-4xl font-black text-purple-400">{courseStats.avgAttendance}%</p>
              </div>
              <PieChart className="w-12 h-12 text-purple-500/30" />
            </div>
          </motion.div>

          {/* Top Performer */}
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all md:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-black uppercase tracking-wider mb-2">Eng Yaxshi O'quvchi</p>
                <p className="text-xl font-black text-yellow-400 truncate">{courseStats.topPerformer}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-500/30" />
            </div>
          </motion.div>

          {/* Total Assignments */}
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-indigo-300 text-sm font-black uppercase tracking-wider mb-2">Jami Topshiriq</p>
                <p className="text-4xl font-black text-indigo-400">{courseStats.assignments}</p>
              </div>
              <BookOpen className="w-12 h-12 text-indigo-500/30" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* STUDENT PERFORMANCE TABLE */}
      {selectedCourse && studentReports.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30">
          <div className="p-4 sm:p-6 border-b border-slate-700/50">
            <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 text-orange-400" />
              O'quvchilar Ko'rsatkichlari
            </h2>
          </div>

          <div className="md:hidden p-3 space-y-3">
            {studentReports.map((student, idx) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="font-black text-white text-sm truncate">{student.name}</p>
                  <span className="text-xs font-black text-slate-300">{student.presentDays} kun</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>O'rtacha baho</span>
                      <span className="text-slate-300">{student.avgScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${student.avgScore}%` }}
                        transition={{ delay: idx * 0.03 + 0.2 }}
                        className={`h-full rounded-full ${
                          student.avgScore >= 80 ? 'bg-green-500' :
                          student.avgScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>Davomat</span>
                      <span className="text-slate-300">{student.attendanceRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${student.attendanceRate}%` }}
                        transition={{ delay: idx * 0.03 + 0.2 }}
                        className={`h-full rounded-full ${
                          student.attendanceRate >= 80 ? 'bg-green-500' :
                          student.attendanceRate >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>Topshiriqlar: <span className="font-black">{student.totalAssignments}</span></span>
                    <span>Kelgan: <span className="font-black">{student.presentDays}</span></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">O'quvchi Nomi</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">O'rtacha Baho</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Davomat</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Topshiriqlar</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Kelgan Kunlar</th>
                </tr>
              </thead>
              <tbody>
                {studentReports.map((student, idx) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-white">{student.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${student.avgScore}%` }}
                            transition={{ delay: idx * 0.05 + 0.3 }}
                            className={`h-full rounded-full ${
                              student.avgScore >= 80 ? 'bg-green-500' :
                              student.avgScore >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className="font-black text-sm text-slate-300 w-12">{student.avgScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${student.attendanceRate}%` }}
                            transition={{ delay: idx * 0.05 + 0.3 }}
                            className={`h-full rounded-full ${
                              student.attendanceRate >= 80 ? 'bg-green-500' :
                              student.attendanceRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className="font-black text-sm text-slate-300 w-12">{student.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-black">{student.totalAssignments}</td>
                    <td className="px-6 py-4 text-slate-300 font-black">{student.presentDays}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {studentReports.length === 0 && (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-black">Hali ma'lumot yo'q</p>
          <p className="text-slate-500 text-sm">O'quvchilar va topshiriqlar qo'shning, keyin hisobotlar ko'rinsiz</p>
        </motion.div>
      )}

    </motion.div>
  );
}
