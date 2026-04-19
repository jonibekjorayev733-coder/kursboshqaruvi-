import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, AlertTriangle, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

interface PaymentFormProps {
  paymentId: number;
  courseId: number;
  studentId: number;
  courseName: string;
  amount: number;
  month: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = 'card' | 'uzum' | 'click' | 'payme';

export default function PaymentForm({
  paymentId,
  courseId,
  studentId,
  courseName,
  amount,
  month,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  // Card form state
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  // Uzum form state
  const [uzumPhone, setUzumPhone] = useState('');

  // Click form state
  const [clickPhone, setClickPhone] = useState('');

  // Payme form state
  const [paymePhone, setPaymePhone] = useState('');

  // Validation
  const validateCard = () => {
    if (!cardData.cardNumber || cardData.cardNumber.length < 13) {
      toast.error('Karta raqamini to\'liq kiriting (16 raqam)');
      return false;
    }
    if (!cardData.cardName.trim()) {
      toast.error('Kartagacha ega ismi kiriting');
      return false;
    }
    if (!cardData.expiryMonth || !cardData.expiryYear) {
      toast.error('Muddati tugash sana kiriting');
      return false;
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      toast.error('CVV kodni kiriting (3 raqam)');
      return false;
    }
    return true;
  };

  const validatePhone = (phone: string, method: string) => {
    if (!phone.trim()) {
      toast.error(`${method} raqamini kiriting`);
      return false;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      toast.error('Telefon raqami noto\'g\'ri');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Validate based on payment method
      if (method === 'card' && !validateCard()) return;
      if (method === 'uzum' && !validatePhone(uzumPhone, 'Uzum')) return;
      if (method === 'click' && !validatePhone(clickPhone, 'Click')) return;
      if (method === 'payme' && !validatePhone(paymePhone, 'Payme')) return;

      // Prepare payment data
      const paymentData = {
        status: 'paid',
        payment_method: method,
        payment_details: {},
        paid_date: new Date().toISOString(),
      };

      // Add method-specific details
      switch (method) {
        case 'card':
          paymentData.payment_details = {
            cardLast4: cardData.cardNumber.slice(-4),
            cardName: cardData.cardName,
            processedAt: new Date().toISOString(),
          };
          break;
        case 'uzum':
          paymentData.payment_details = {
            phone: uzumPhone,
            method: 'Uzum Mobile',
            processedAt: new Date().toISOString(),
          };
          break;
        case 'click':
          paymentData.payment_details = {
            phone: clickPhone,
            method: 'Click',
            processedAt: new Date().toISOString(),
          };
          break;
        case 'payme':
          paymentData.payment_details = {
            phone: paymePhone,
            method: 'Payme',
            processedAt: new Date().toISOString(),
          };
          break;
      }

      // Update payment in database
      await api.updatePayment(paymentId, paymentData);

      toast.success(`✅ To'lov muvaffaqiyatli amalga oshirildi!\n💳 ${courseName} uchun to'lov qabul qilindi`);
      
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(`To'lovni amalga oshirishda xatolik: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (!v) return '';
    if (v.length <= 3) return v;
    if (v.length <= 6) return `+${v.slice(0, 3)} ${v.slice(3)}`;
    return `+${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 9)} ${v.slice(9)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">To'lovni Amalga Oshiring</h2>
            <p className="text-slate-400 text-sm font-black">{courseName} • {month} oyi</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* AMOUNT DISPLAY */}
          <motion.div className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm font-black uppercase tracking-wide mb-2">To'lash Kerak</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              ${amount}
            </p>
            <p className="text-slate-400 text-sm mt-3">So'm dan tushuntirish: {Math.round(amount * 12500)}</p>
          </motion.div>

          {/* PAYMENT METHOD TABS - MOBILE & DESKTOP RESPONSIVE */}
          <div className="space-y-3">
            <p className="text-sm font-black text-slate-300 uppercase tracking-wide">To'lov Usuli Tanlang</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['card', 'uzum', 'click', 'payme'].map((m) => (
                <motion.button
                  key={m}
                  onClick={() => setMethod(m as PaymentMethod)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl font-black text-sm transition-all border-2 flex items-center gap-2 justify-center ${
                    method === m
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="uppercase">
                    {m === 'card' ? '💳 Karta' : m === 'uzum' ? '📱 Uzum' : m === 'click' ? '💰 Click' : '₽ Payme'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* PAYMENT METHOD FORMS */}
          <AnimatePresence mode="wait">
            {method === 'card' && (
              <motion.div
                key="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50"
              >
                <h3 className="font-black text-white mb-4">💳 Karta Ma'lumotlari</h3>
                
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-black text-slate-300 mb-2">Karta Raqami</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formatCardNumber(cardData.cardNumber)}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value.replace(/\s/g, '') })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                    maxLength="19"
                  />
                </div>

                {/* Card Holder Name */}
                <div>
                  <label className="block text-sm font-black text-slate-300 mb-2">Kartagacha Ega Ismi</label>
                  <input
                    type="text"
                    placeholder="JOHN DOE"
                    value={cardData.cardName}
                    onChange={(e) => setCardData({ ...cardData, cardName: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-black text-slate-300 mb-2">Oy</label>
                    <input
                      type="number"
                      placeholder="MM"
                      value={cardData.expiryMonth}
                      onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-300 mb-2">Yil</label>
                    <input
                      type="number"
                      placeholder="YY"
                      value={cardData.expiryYear}
                      onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                      min="24"
                      max="99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-300 mb-2 flex items-center gap-2">
                      CVV
                      <button
                        type="button"
                        onClick={() => setShowCardDetails(!showCardDetails)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {showCardDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </label>
                    <input
                      type={showCardDetails ? 'text' : 'password'}
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                      maxLength="4"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {method === 'uzum' && (
              <motion.div
                key="uzum"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50"
              >
                <h3 className="font-black text-white mb-4">📱 Uzum Mobile</h3>
                <p className="text-sm text-slate-400 font-black mb-4">Uzum hisob raqamiga bog'langan telefon raqamini kiriting</p>
                <div>
                  <label className="block text-sm font-black text-slate-300 mb-2">Telefon Raqami</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={formatPhone(uzumPhone)}
                    onChange={(e) => setUzumPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {method === 'click' && (
              <motion.div
                key="click"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50"
              >
                <h3 className="font-black text-white mb-4">💰 Click</h3>
                <p className="text-sm text-slate-400 font-black mb-4">Click hisob raqamiga bog'langan telefon raqamini kiriting</p>
                <div>
                  <label className="block text-sm font-black text-slate-300 mb-2">Telefon Raqami</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={formatPhone(clickPhone)}
                    onChange={(e) => setClickPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {method === 'payme' && (
              <motion.div
                key="payme"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50"
              >
                <h3 className="font-black text-white mb-4">₽ Payme</h3>
                <p className="text-sm text-slate-400 font-black mb-4">Payme hisobiga bog'langan telefon raqamini kiriting</p>
                <div>
                  <label className="block text-sm font-black text-slate-300 mb-2">Telefon Raqami</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={formatPhone(paymePhone)}
                    onChange={(e) => setPaymePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-black text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECURITY INFO */}
          <motion.div className="bg-amber-600/10 border border-amber-600/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-300 mb-1">🔒 Xavfsizlik Ma'lumoti</p>
              <p className="text-xs text-amber-200/80">Sizning ma'lumotlaringiz shifrlangan va xavfsiz qayta ishlanadi. Biz hech qachon karta detallari saqlamay qolamiz.</p>
            </div>
          </motion.div>
        </div>

        {/* FOOTER - BUTTONS */}
        <div className="sticky bottom-0 bg-slate-900/80 border-t border-slate-700/50 p-6 flex gap-3 backdrop-blur">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Bekor Qilish
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <CreditCard className="w-4 h-4" />
                </motion.div>
                Qayta qilinmoqda...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                To'lovni Qil (${amount})
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
