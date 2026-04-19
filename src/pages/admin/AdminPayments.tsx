import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertTriangle, CheckCircle2, Clock, Send, Download, TrendingUp, X, Mail, Phone, MessageCircle, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, connectRealtimeChannel } from '../../services/api';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  avatar?: string;
  courses?: number[];
}

interface Payment {
  id: number;
  student_id: number;
  course_id: number;
  amount: number;
  month: string;
  status: 'paid' | 'pending' | 'failed';
  due_date?: string;
  paid_date?: string;
  created_at?: string;
  student_name?: string;
  course_name?: string;
  student?: Student;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReminder, setShowReminder] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<number>>(new Set());
  const [sendingBulk, setSendingBulk] = useState(false);
  const [customReminderMessage, setCustomReminderMessage] = useState('');

  const buildReminderTemplate = (payment: Payment) => {
    const studentName = payment.student?.name || payment.student_name || 'O\'quvchi';
    const courseName = payment.course_name || `Kurs #${payment.course_id}`;
    return `Assalomu alaykum, ${studentName}. ${courseName} kursi uchun ${payment.month} oy to'lovi ($${payment.amount}) kutilmoqda. Iltimos, imkon qadar tezroq to'lovni amalga oshiring.`;
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let reconnectId: number | null = null;
    let socketRef: { close: () => void } | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      socketRef = connectRealtimeChannel(
        'admin',
        (event) => {
          if (event.event === 'payment.updated' || event.event === 'enrollment.created') {
            fetchPayments();
          }
        },
        (connected) => {
          if (!connected && !disposed) {
            reconnectId = window.setTimeout(connect, 3000);
          }
        },
      );
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectId !== null) {
        window.clearTimeout(reconnectId);
      }
      socketRef?.close();
    };
  }, []);

  const fetchPayments = async () => {
    try {
      const [data, students, coursesData] = await Promise.all([
        api.getPayments(),
        api.getStudents(),
        api.getCourses(),
      ]);

      const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const enrollmentsByCourse = await Promise.all(
        coursesData.map(async (course: { id: number; name: string; price?: number }) => {
          const enrollments = await api.getEnrollments(course.id);
          return enrollments.map((enrollment: any) => ({
            student_id: enrollment.student_id,
            course_id: course.id,
            amount: Number(course.price || 0),
          }));
        })
      );

      const existingPaymentKey = new Set(
        data
          .filter((payment: Payment) => payment.month === currentMonth)
          .map((payment: Payment) => `${payment.student_id}-${payment.course_id}-${payment.month}`)
      );

      const missingPayments = enrollmentsByCourse
        .flat()
        .filter((enrollment) => {
          const validStudentId = Number.isInteger(enrollment.student_id) && enrollment.student_id > 0;
          const validCourseId = Number.isInteger(enrollment.course_id) && enrollment.course_id > 0;
          if (!validStudentId || !validCourseId) {
            return false;
          }
          return !existingPaymentKey.has(`${enrollment.student_id}-${enrollment.course_id}-${currentMonth}`);
        });

      let createdPayments: Payment[] = [];
      if (missingPayments.length > 0) {
        const createResults = await Promise.allSettled(
          missingPayments.map((item) =>
            api.createPayment({
              student_id: item.student_id,
              course_id: item.course_id,
              amount: item.amount,
              currency: 'USD',
              status: 'pending',
              due_date: dueDate,
              month: currentMonth,
            })
          )
        );

        createdPayments = createResults
          .filter((result): result is PromiseFulfilledResult<Payment> => result.status === 'fulfilled')
          .map((result) => result.value);
      }

      const allPayments = [...data, ...createdPayments];
      
      setCourses(coursesData);
      
      const enrichedPayments = allPayments.map((p: Payment) => {
        const student = students.find((s: Student) => s.id === p.student_id);
        const course = coursesData.find((c: { id: number; name: string }) => c.id === p.course_id);
        return {
          ...p,
          student_name: student?.name || `#${p.student_id}`,
          course_name: course?.name || `Kurs #${p.course_id}`,
          student: student,
        };
      });
      setPayments(enrichedPayments);
      setLoading(false);
    } catch (error) {
      console.error('Payments fetch error:', error);
      setPayments([]);
      setLoading(false);
      toast.info('To\'lovlar yuklanishida xatolik - backend tekshirilsin');
    }
  };

  const handleReminder = async (paymentId: number) => {
    try {
      setSendingId(paymentId);

      const trimmedMessage = customReminderMessage.trim();
      if (trimmedMessage.length > 0) {
        await api.sendBulkNotifications([paymentId], trimmedMessage);
      } else {
        await api.sendSMS(paymentId);
      }
      
      // Update payment status
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, status: 'pending' } : p
      ));
      
      toast.success('📱 Xabar yuborildi');
      setCustomReminderMessage('');
      
    } catch (error) {
      console.error('Notification error:', error);
      toast.error(error instanceof Error ? error.message : 'Xabar yuborishda xatolik');
    } finally {
      setSendingId(null);
      setShowReminder(null);
    }
  };

  const handleSendBulkNotifications = async () => {
    if (selectedPaymentIds.size === 0) {
      toast.error('Hech qanday to\'lov tanlanmadi');
      return;
    }

    try {
      setSendingBulk(true);
      const result = await api.sendBulkNotifications(Array.from(selectedPaymentIds));
      toast.success(`✅ ${result.sent_count} ta habarnomasla yuborildi`);
      setSelectedPaymentIds(new Set());
    } catch (error) {
      console.error('Bulk notification error:', error);
      toast.error('Habarnomasla yuborishda xatolik');
    } finally {
      setSendingBulk(false);
    }
  };

  const togglePaymentSelection = (paymentId: number) => {
    setSelectedPaymentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const toggleAllPayments = () => {
    if (selectedPaymentIds.size === filteredPayments.length) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(filteredPayments.map(p => p.id)));
    }
  };

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const statusAndCourseFiltered = payments.filter(p => {
    const matchStatus = filterStatus === 'all' ? true : p.status === filterStatus;
    const matchCourse = selectedCourse === null ? true : p.course_id === selectedCourse;
    return matchStatus && matchCourse;
  });

  const availableMonths = Array.from(new Set(statusAndCourseFiltered.map(p => p.month))).sort((a, b) => {
    const aIndex = monthOrder.indexOf(a);
    const bIndex = monthOrder.indexOf(b);
    return bIndex - aIndex;
  });

  const effectiveCurrentMonth = availableMonths.includes(currentMonth)
    ? currentMonth
    : (availableMonths[0] || currentMonth);

  const filteredPayments = statusAndCourseFiltered.filter(p => {
    const matchMonth = selectedMonth === 'current'
      ? p.month === effectiveCurrentMonth
      : p.month !== effectiveCurrentMonth;
    return matchMonth;
  });
  
  const stats = {
    totalRevenue: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    failedAmount: payments.filter(p => p.status === 'failed').reduce((s, p) => s + p.amount, 0),
    paidCount: payments.filter(p => p.status === 'paid').length
  };

  const statusColors = {
    paid: { bg: 'from-green-600 to-emerald-600', icon: CheckCircle2, text: 'Tulangan' },
    pending: { bg: 'from-yellow-600 to-amber-600', icon: Clock, text: 'Kutish Holatida' },
    failed: { bg: 'from-red-600 to-rose-600', icon: AlertTriangle, text: 'Muvaffaqiyatsiz' }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">To'lovlar va Moliyaviy</h1>
              <p className="text-amber-50 text-lg font-medium">Barcha to'lovlarni boshqaring va kuzating</p>
            </div>
            <div className="relative">
              <DollarSign className="w-24 h-24 text-white opacity-80" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* KEY METRICS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Jami To'lovlar", value: `$${stats.totalRevenue}`, color: 'from-green-600 to-emerald-600' },
          { icon: Clock, label: "Kutish Holatida", value: `$${stats.pendingAmount}`, color: 'from-yellow-600 to-amber-600' },
          { icon: AlertTriangle, label: "Muvaffaqiyatsiz", value: `$${stats.failedAmount}`, color: 'from-red-600 to-rose-600' },
          { icon: CheckCircle2, label: "Tulanganlar", value: `${stats.paidCount}`, color: 'from-blue-600 to-cyan-600' }
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${metric.color} shadow-lg`}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <metric.icon className="w-8 h-8 text-white/80 mb-4" />
              <p className="text-white/80 text-sm font-black uppercase tracking-wide">{metric.label}</p>
              <p className="text-3xl font-black text-white mt-2">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* TOOLBAR */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-4">
        {/* Status Filter & Course Selector */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {(['all', 'paid', 'pending', 'failed'] as const).map(status => (
              <motion.button
                key={status}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-black text-sm uppercase transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                {status === 'all' ? 'Barchasi' : status === 'paid' ? 'Tulanganlar' : status === 'pending' ? 'Kutish' : 'Muvaffaqiyatsiz'}
              </motion.button>
            ))}
          </div>

          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 rounded-xl bg-slate-800/50 text-white border border-slate-700/50 font-black text-sm focus:outline-none focus:border-amber-600"
          >
            <option value="">📚 Barcha Kurslar</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-white font-black text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Yuklab Olish
          </motion.button>
        </div>

        {/* Month Tabs & Bulk Actions */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMonth('current')}
              className={`px-4 py-2 rounded-xl font-black text-sm uppercase transition-all ${
                selectedMonth === 'current'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              📅 Joriy Oy
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMonth('history')}
              className={`px-4 py-2 rounded-xl font-black text-sm uppercase transition-all ${
                selectedMonth === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              📜 Tarix
            </motion.button>
          </div>

          {selectedPaymentIds.size > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendBulkNotifications}
              disabled={sendingBulk}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-sm transition-all disabled:opacity-50"
            >
              {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {sendingBulk ? 'Yuborilmoqda...' : `${selectedPaymentIds.size} ta Habarnomasla Yuborish`}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* PAYMENTS TABLE */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                  <input
                    type="checkbox"
                    checked={selectedPaymentIds.size === filteredPayments.length && filteredPayments.length > 0}
                    onChange={toggleAllPayments}
                    className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">O'quvchi</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Kurs</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Summa</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Oy</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Sana</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Amal</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-black">To'lovlar topilmadi</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, idx) => {
                    const statusInfo = statusColors[payment.status];
                    const StatusIcon = statusInfo.icon;
                    const isSelected = selectedPaymentIds.has(payment.id);

                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border-b border-slate-700/30 transition-colors group ${isSelected ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
                      >
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePaymentSelection(payment.id)}
                            className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-white font-black text-sm cursor-pointer" onClick={() => setSelectedPayment(payment)}>{payment.student_name || `#${payment.student_id}`}</td>
                        <td className="px-6 py-4 text-slate-300 font-black text-sm cursor-pointer" onClick={() => setSelectedPayment(payment)}>{payment.course_name || `Kurs #${payment.course_id}`}</td>
                        <td className="px-6 py-4 text-white font-black text-sm cursor-pointer" onClick={() => setSelectedPayment(payment)}>${payment.amount}</td>
                        <td className="px-6 py-4 text-slate-300 font-black text-sm cursor-pointer" onClick={() => setSelectedPayment(payment)}>{payment.month}</td>
                        <td className="px-6 py-4 text-slate-400 font-black text-xs cursor-pointer" onClick={() => setSelectedPayment(payment)}>
                          {payment.status === 'paid' && payment.paid_date
                            ? new Date(payment.paid_date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString('uz-UZ')
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <motion.div whileHover={{ scale: 1.05 }} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${statusInfo.bg} text-white font-black text-xs`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.text}
                          </motion.div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {payment.status !== 'paid' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReminder(payment.id)}
                              disabled={sendingId === payment.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 text-xs font-black transition-all"
                            >
                              {sendingId === payment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              {sendingId === payment.id ? 'Yuborilmoqda...' : 'Eslatma'}
                            </motion.button>
                          )}
                          {payment.status === 'paid' && (
                            <span className="text-xs text-slate-500 font-black">✓ Tulanган</span>
                          )}
                        </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SUMMARY CARDS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <h3 className="font-black text-white text-sm mb-4 uppercase tracking-widest">Kunlik Statsika</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Bugun Tulanganlar</span>
              <span className="font-black text-white">$850</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Bugun Yangi Buyurtmalar</span>
              <span className="font-black text-white">5</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <h3 className="font-black text-white text-sm mb-4 uppercase tracking-widest">Oysiga Ma'lumot</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Jami Daromad</span>
              <span className="font-black text-white">${stats.totalRevenue + stats.pendingAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">O'rtacha To'lov</span>
              <span className="font-black text-white">${Math.round((stats.totalRevenue + stats.pendingAmount) / payments.length)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6"
        >
          <h3 className="font-black text-white text-sm mb-4 uppercase tracking-widest">Dikkat Talabi</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Muddati O'tgan</span>
              <span className="font-black text-red-400">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Eslatma Yuboriladigan</span>
              <span className="font-black text-yellow-400">{payments.filter(p => p.status === 'pending').length}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* STUDENT DETAILS SIDEBAR */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPayment(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          >
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl"
            >
              {/* HEADER */}
              <div className="relative overflow-hidden p-6 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 border-b border-slate-700/50">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white">To'lov Ma'lumoti</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPayment(null)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* STUDENT INFO */}
              <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
                
                {/* STUDENT CARD */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-slate-700/30 border border-slate-600/50 p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-xl">
                      {selectedPayment.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-black text-white">{selectedPayment.student?.name || selectedPayment.student_name}</p>
                      <p className="text-xs text-slate-400">ID: #{selectedPayment.student_id}</p>
                    </div>
                  </div>
                  
                  {/* CONTACT INFO */}
                  {selectedPayment.student?.email && (
                    <div className="flex items-center gap-3 mb-2 text-sm">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <a href={`mailto:${selectedPayment.student.email}`} className="text-cyan-300 hover:text-cyan-200">{selectedPayment.student.email}</a>
                    </div>
                  )}
                  {selectedPayment.student?.phone && (
                    <div className="flex items-center gap-3 mb-2 text-sm">
                      <Phone className="w-4 h-4 text-green-400" />
                      <a href={`tel:${selectedPayment.student.phone}`} className="text-green-300 hover:text-green-200">{selectedPayment.student.phone}</a>
                    </div>
                  )}
                  {selectedPayment.student?.telegram && (
                    <div className="flex items-center gap-3 text-sm">
                      <MessageCircle className="w-4 h-4 text-sky-400" />
                      <a href={`https://t.me/${selectedPayment.student.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200">{selectedPayment.student.telegram}</a>
                    </div>
                  )}
                </motion.div>

                {/* PAYMENT DETAILS */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-slate-700/30 border border-slate-600/50 p-4 space-y-3">
                  <h3 className="font-black text-white text-sm uppercase tracking-wide">To'lov Ma'lumotlari</h3>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-600/50">
                    <span className="text-slate-400 font-black text-sm">Kurs</span>
                    <span className="text-white font-black">{selectedPayment.course_name || `Kurs #${selectedPayment.course_id}`}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-600/50">
                    <span className="text-slate-400 font-black text-sm">Oy</span>
                    <span className="text-white font-black">{selectedPayment.month}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-600/50">
                    <span className="text-slate-400 font-black text-sm">Summa</span>
                    <span className="text-2xl font-black text-yellow-400">${selectedPayment.amount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black text-sm">Status</span>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${statusColors[selectedPayment.status].bg} text-white font-black text-xs`}>
                      {(() => {
                        const IconComponent = statusColors[selectedPayment.status].icon;
                        return <IconComponent className="w-3.5 h-3.5" />;
                      })()}
                      {statusColors[selectedPayment.status].text}
                    </div>
                  </div>

                  {selectedPayment.status === 'paid' && selectedPayment.paid_date && (
                    <div className="flex justify-between items-center pt-3 border-t border-slate-600/50">
                      <span className="text-slate-400 font-black text-sm">To'langan vaqt</span>
                      <span className="text-green-400 font-black text-sm">
                        {new Date(selectedPayment.paid_date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* SEND NOTIFICATION BUTTON */}
                {selectedPayment.status !== 'paid' && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      <p className="text-xs font-black uppercase tracking-wider">Xabar yuborish markazi</p>
                    </div>
                    <textarea
                      value={customReminderMessage}
                      onChange={(e) => setCustomReminderMessage(e.target.value)}
                      placeholder={buildReminderTemplate(selectedPayment)}
                      className="min-h-[116px] w-full rounded-xl border border-slate-600/60 bg-slate-900/70 p-3 text-sm text-white outline-none focus:border-amber-500/60"
                    />
                    <p className="text-[11px] text-slate-400">Matn bo'sh bo'lsa avtomatik xabar yuboriladi.</p>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReminder(selectedPayment.id)}
                      disabled={sendingId === selectedPayment.id}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black uppercase text-sm flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {sendingId === selectedPayment.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Xabar yuborilmoqda...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Xabar yuborish
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {selectedPayment.status === 'paid' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black uppercase text-sm flex items-center justify-center gap-2">
                    <CheckCheck className="w-5 h-5" />
                    To'lov qabul qilindi
                  </motion.div>
                )}

                {/* MESSAGE TEMPLATE */}
                {selectedPayment.status !== 'paid' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-slate-700/50 border border-slate-600/50 p-3">
                    <p className="text-xs text-slate-400 font-black mb-2">HABARNOMA MATNI:</p>
                    <p className="text-sm text-white p-2 bg-slate-800/50 rounded border border-slate-600/50 font-mono">
                      {customReminderMessage.trim() || buildReminderTemplate(selectedPayment)}
                    </p>
                  </motion.div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
