import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, CheckCircle2, Clock, CreditCard, CheckCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api, connectRealtimeChannel } from '../../services/api';
import PaymentFormReal from '../../components/student/PaymentFormReal';

interface Payment {
  id: number;
  course_id: number;
  student_id: number;
  amount: number;
  month: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
  due_date?: string;
  paid_date?: string;
  created_at?: string;
  updated_at?: string;
  course_name?: string;
}

export default function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [now, setNow] = useState(new Date());
  
  // Get student ID from localStorage (set during login)
  const studentIdRaw = localStorage.getItem('user_id');
  const studentId = studentIdRaw ? parseInt(studentIdRaw, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(studentId)) {
      setLoading(false);
      setPayments([]);
      setEnrollmentCount(0);
      return;
    }

    fetchPayments();
    // Re-fetch payments every 30 seconds to sync with database
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [studentId]);

  useEffect(() => {
    if (Number.isNaN(studentId)) {
      return;
    }

    let reconnectId: number | null = null;
    let socketRef: { close: () => void } | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      socketRef = connectRealtimeChannel(
        `student:${studentId}`,
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
  }, [studentId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchPayments = async () => {
    if (Number.isNaN(studentId)) {
      setPayments([]);
      setEnrollmentCount(0);
      setLoading(false);
      return;
    }

    try {
      const [studentPayments, studentEnrollments, courses] = await Promise.all([
        api.getStudentPayments(studentId),
        api.getStudentEnrollments(studentId),
        api.getCourses(),
      ]);

      setEnrollmentCount(studentEnrollments.length);
      
      const enrichedPayments = studentPayments.map((payment: Payment) => {
        const course = courses.find((c: any) => c.id === payment.course_id);
        return {
          ...payment,
          course_name: course?.name || `Kurs #${payment.course_id}`,
        };
      });
      
      setPayments(enrichedPayments);
    } catch (error) {
      console.error('Payments fetch error:', error);
      toast.error('To\'lovlar yuklanishida xatolik - qaytadan urinib ko\'ring');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPaymentId(null);
    // Refresh payments list
    fetchPayments();
  };

  const stats = {
    totalDue: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    totalPaid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pendingCount: payments.filter(p => p.status === 'pending').length
  };

  const getPaymentTimeline = (dueDate?: string) => {
    const current = now;
    let due = dueDate ? new Date(dueDate) : new Date(current.getFullYear(), current.getMonth() + 1, 0);
    if (Number.isNaN(due.getTime())) {
      due = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    }

    const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
    const totalDays = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const passedDays = Math.max(0, Math.ceil((current.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const leftDays = Math.max(0, Math.ceil((due.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      passedDays: Math.min(passedDays, totalDays),
      leftDays,
      dueFormatted: due.toLocaleDateString('uz-UZ'),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <CreditCard className="w-8 h-8 text-cyan-500" />
        </motion.div>
        <span className="ml-3 text-slate-400 font-black">Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-cyan-600 via-blue-500 to-indigo-600 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Mening To'lovlarim</h1>
              <p className="text-blue-50 text-lg font-medium">Kurs to'lovlarini kuzating va amalga oshiring</p>
            </div>
            <CreditCard className="w-24 h-24 text-white opacity-80 hidden sm:block" />
          </div>
        </div>
      </motion.div>

      {/* KEY METRICS */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: "To'langan To'lovlar", value: `$${stats.totalPaid.toFixed(2)}`, color: 'from-green-600 to-emerald-600' },
          { icon: AlertTriangle, label: "To'lash Kerak", value: `$${stats.totalDue.toFixed(2)}`, color: 'from-amber-600 to-orange-600' },
          { icon: Clock, label: "Kutish Holatida", value: `${stats.pendingCount} ta kurs`, color: 'from-blue-600 to-cyan-600' }
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

      {/* PAYMENTS LIST */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-4">
        <h2 className="text-2xl font-black text-white">Barcha To'lovlar</h2>
        
        {payments.length === 0 ? (
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            {enrollmentCount === 0 ? (
              <>
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-slate-300 text-lg font-black">Birinchi kursga qo'shilishingiz kerak</p>
                <p className="text-slate-500 text-sm mt-2">Admin sizni kursga qo'shgandan keyin bu yerda to'lovlar chiqadi</p>
              </>
            ) : (
              <>
                <Clock className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                <p className="text-slate-300 text-lg font-black">To'lovlar tayyorlanmoqda</p>
                <p className="text-slate-500 text-sm mt-2">Iltimos, biroz kuting. Joriy oy uchun to'lovlar avtomatik yaratiladi</p>
              </>
            )}
          </motion.div>
        ) : (
          payments.map((payment, idx) => (
            <motion.div
              key={payment.id}
              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-2xl border transition-all overflow-hidden ${
                payment.status === 'paid' 
                  ? 'bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-600/30' 
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700/50 hover:border-blue-500/50'
              }`}
            >
              <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
                
                {/* LEFT - PAYMENT INFO */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div>
                      <h3 className="font-black text-white text-base md:text-lg">{payment.course_name}</h3>
                      <p className="text-slate-400 text-xs md:text-sm font-black mt-1">{payment.month} oyi</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-xs ${
                      payment.status === 'paid'
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-amber-600/20 text-amber-400'
                    }`}>
                      {payment.status === 'paid' ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tulangan
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Kutish Holatida
                        </>
                      )}
                    </div>
                  </div>

                  {payment.status === 'pending' && (() => {
                    const timeline = getPaymentTimeline(payment.due_date);
                    return (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-300 font-black">
                          📅 To'lov oyning oxirigacha: {timeline.dueFormatted}
                        </p>
                        <p className="text-xs text-cyan-300 font-black">
                          ⏱ {timeline.passedDays} kun o'tdi, {timeline.leftDays} kun qoldi
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* CENTER - AMOUNT (Hidden on mobile, shown on desktop) */}
                <div className="hidden md:block text-center">
                  <p className="text-slate-400 text-xs md:text-sm font-black uppercase tracking-wide mb-1">To'lash Kerak</p>
                  <p className="text-3xl md:text-4xl font-black text-white">${payment.amount}</p>
                </div>

                {/* MOBILE AMOUNT + ACTION */}
                <div className="md:hidden w-full">
                  <div className="text-center mb-3">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-wide mb-1">To'lash Kerak</p>
                    <p className="text-3xl font-black text-white">${payment.amount}</p>
                  </div>
                </div>

                {/* RIGHT - ACTION BUTTON */}
                <div className="w-full md:w-auto">
                  {payment.status === 'paid' ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-full md:w-auto px-6 py-3 rounded-xl bg-green-600/20 text-green-400 font-black text-sm flex flex-col items-center justify-center gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Tulangan {payment.payment_method ? `(${payment.payment_method})` : ''}
                      </div>
                      {payment.paid_date && (
                        <span className="text-xs text-green-500/80">
                          {new Date(payment.paid_date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPaymentId(payment.id)}
                      className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg shadow-blue-500/50 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      To'lovni Qil
                      <ArrowRight className="w-4 h-4 hidden sm:block" />
                    </motion.button>
                  )}
                </div>

              </div>

              {/* PROGRESS BAR */}
              {payment.status === 'paid' && (
                <div className="h-1 bg-gradient-to-r from-green-600 to-emerald-600" />
              )}
            </motion.div>
          ))
        )}
      </motion.div>

      {/* INFO SECTION */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6">
        <h3 className="font-black text-white text-lg mb-4">ⓘ Ma'lumot</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-cyan-400 font-black mt-1">✓</span>
            <span>Har bir o'quvchi uchun alohida to'lovlar ko'rsatiladi</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-cyan-400 font-black mt-1">✓</span>
            <span>To'lovni qilgandan so'ng avtomatik ravishda ma'lumot yangilanadi (F5 ni bosish shart emas)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-cyan-400 font-black mt-1">✓</span>
            <span>To'lov ma'lumotlaringiz shifrlangan va xavfsiz qayta ishlanadi</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-cyan-400 font-black mt-1">✓</span>
            <span>Admin tomonidan SMSda xabar yuborgan bo'lsa, u erda ko'rish mumkin</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-cyan-400 font-black mt-1">✓</span>
            <span>Muddati o'tgan to'lovlar uchun ogohlanish paydo bo'ladi</span>
          </li>
        </ul>
      </motion.div>

      {/* PAYMENT FORM MODAL */}
      {selectedPaymentId && (() => {
        const payment = payments.find(p => p.id === selectedPaymentId);
        if (!payment) return null;
        return (
          <PaymentFormReal
            key={selectedPaymentId}
            paymentId={selectedPaymentId}
            courseId={payment.course_id}
            studentId={studentId}
            courseName={payment.course_name || `Kurs #${payment.course_id}`}
            amount={payment.amount}
            month={payment.month}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setSelectedPaymentId(null)}
          />
        );
      })()}
    </motion.div>
  );
}

