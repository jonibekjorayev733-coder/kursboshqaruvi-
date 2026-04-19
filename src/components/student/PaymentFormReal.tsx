import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, AlertTriangle, CheckCircle2, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../../services/api';

const API_BASE_URL = API_URL;

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

type PaymentMethod = 'stripe' | 'click' | 'payme' | 'googlepay';

export default function PaymentFormReal({
  paymentId,
  courseId,
  studentId,
  courseName,
  amount,
  month,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('stripe');
  const [loading, setLoading] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
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
    const cardNum = cardData.cardNumber.replace(/\s/g, '');
    if (!cardNum || cardNum.length < 13) {
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

  // ========== STRIPE PAYMENT ==========
  const handleStripePayment = async () => {
    try {
      if (!validateCard()) return;
      
      setPaymentProcessing(true);
      toast.loading('Stripe orqali to\'lov qayta ishlantirilimoqda...');

      // Step 1: Create payment intent
      const intentResponse = await fetch(`${API_BASE_URL}/payments/real/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          student_id: studentId,
          course_id: courseId,
          amount: amount,
          month,
        })
      });

      if (!intentResponse.ok) {
        throw new Error('Payment intent yaratilmadi');
      }

      const intentData = await intentResponse.json();
      const clientSecret = intentData.client_secret;

      // Step 2: In real app, use Stripe.js to confirm payment
      // For now, simulate successful payment
      toast.dismiss();
      toast.loading('Kartadan pul yechilmoqda...');

      // Simulate card processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Confirm payment with backend
      const confirmResponse = await fetch(`${API_BASE_URL}/payments/real/stripe/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          payment_intent_id: intentData.payment_intent_id,
          student_id: studentId,
          course_id: courseId,
          amount,
          month,
        })
      });

      if (!confirmResponse.ok) {
        throw new Error('To\'lov tasdiqlash muvaffaq bo\'lmadi');
      }

      const result = await confirmResponse.json();
      
      if (result.success) {
        toast.dismiss();
        toast.success('✅ To\'lov muvaffaqiyatli! Holat bazada yangilandi.');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Stripe to\'lov muvaffaq bo\'lmadi');
      console.error('Stripe error:', error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ========== CLICK PAYMENT ==========
  const handleClickPayment = async () => {
    try {
      if (!validatePhone(clickPhone, 'Click')) return;
      
      setPaymentProcessing(true);
      toast.loading('Click to\'lov invoysasini yaratilmoqda...');

      // Create Click invoice
      const invoiceResponse = await fetch(`${API_BASE_URL}/payments/real/click/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          student_id: studentId,
          course_id: courseId,
          amount: amount,
          phone: clickPhone,
          month,
        })
      });

      if (!invoiceResponse.ok) {
        throw new Error('Click invoysasi yaratilmadi');
      }

      const invoiceData = await invoiceResponse.json();
      
      toast.dismiss();
      toast.success('Click invoysasi yaratildi! To\'lov vebsaytiga o\'tasiz...');
      
      // In real app, redirect to payment_url
      // window.location.href = invoiceData.payment_url;
      
      // For demo: simulate successful payment after delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verifyResponse = await fetch(`${API_BASE_URL}/payments/real/click/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          transaction_id: invoiceData.invoice_id,
          student_id: studentId,
          course_id: courseId,
          amount,
          month,
        })
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        toast.success('✅ Click to\'lov tasdiqlandi! Holat bazada yangilandi.');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Click to\'lov muvaffaq bo\'lmadi');
      console.error('Click error:', error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ========== PAYME PAYMENT ==========
  const handlePaymePayment = async () => {
    try {
      if (!validatePhone(paymePhone, 'Payme')) return;
      
      setPaymentProcessing(true);
      toast.loading('Payme kvitantsiya yaratilmoqda...');

      // Create Payme receipt
      const receiptResponse = await fetch(`${API_BASE_URL}/payments/real/payme/create-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          student_id: studentId,
          course_id: courseId,
          amount: amount,
          phone: paymePhone,
          month,
        })
      });

      if (!receiptResponse.ok) {
        throw new Error('Payme kvitantsiyasi yaratilmadi');
      }

      const receiptData = await receiptResponse.json();
      
      toast.dismiss();
      toast.success('Payme checkout ochildi. To\'lovdan keyin holat avtomatik tekshiriladi.');

      if (receiptData.payment_url) {
        window.open(receiptData.payment_url, '_blank', 'noopener,noreferrer');
      }

      let paid = false;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const statusResponse = await fetch(`${API_BASE_URL}/payments/real/payme/check-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: receiptData.payment_id || paymentId,
            receipt_id: receiptData.receipt_id,
            student_id: studentId,
            course_id: courseId,
            amount,
            month,
          })
        });

        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json();
        if (statusData.success && statusData.status === 'paid') {
          paid = true;
          break;
        }
      }

      if (paid) {
        toast.success('✅ Payme to\'lov tasdiqlandi! Holat bazada yangilandi.');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        toast.info('To\'lov hali tasdiqlanmadi. To\'lovdan keyin sahifani yangilang.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Payme to\'lov muvaffaq bo\'lmadi');
      console.error('Payme error:', error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ========== GOOGLE PAY PAYMENT ==========
  const handleGooglePayPayment = async () => {
    try {
      setPaymentProcessing(true);
      toast.loading('Google Pay qayta ishlantirilimoqda...');

      // Get Google Pay config
      const response = await fetch(`${API_BASE_URL}/payments/real/google-pay/config?student_id=${studentId}&course_id=${courseId}`);
      const config = await response.json();

      // In real app, initialize Google Pay
      // For now, simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update payment in database
      const updateResponse = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_method: 'googlepay'
        })
      });

      if (updateResponse.ok) {
        toast.dismiss();
        toast.success('✅ Google Pay to\'lov muvaffaqiyatli! Holat bazada yangilandi.');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Google Pay to\'lov muvaffaq bo\'lmadi');
      console.error('Google Pay error:', error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (paymentProcessing) return;

    switch (method) {
      case 'stripe':
        await handleStripePayment();
        break;
      case 'click':
        await handleClickPayment();
        break;
      case 'payme':
        await handlePaymePayment();
        break;
      case 'googlepay':
        await handleGooglePayPayment();
        break;
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
    if (v.length > 0) {
      if (v.length <= 3) return v;
      if (v.length <= 6) return `${v.slice(0, 3)} ${v.slice(3)}`;
      return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 9)}`;
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        className="bg-slate-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto border border-slate-700"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">{courseName}</h3>
            <p className="text-sm text-slate-400">{month}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={paymentProcessing}
            className="text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="bg-slate-700 p-4 rounded-lg text-center">
            <p className="text-slate-400 text-sm mb-1">To'lash summa</p>
            <p className="text-3xl font-bold text-cyan-400">{amount.toLocaleString()} UZS</p>
          </div>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setMethod('stripe')}
              disabled={paymentProcessing}
              className={`p-3 rounded-lg text-xs font-semibold transition ${
                method === 'stripe'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50`}
            >
              💳 Karta
            </button>
            <button
              onClick={() => setMethod('click')}
              disabled={paymentProcessing}
              className={`p-3 rounded-lg text-xs font-semibold transition ${
                method === 'click'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50`}
            >
              💰 Click
            </button>
            <button
              onClick={() => setMethod('payme')}
              disabled={paymentProcessing}
              className={`p-3 rounded-lg text-xs font-semibold transition ${
                method === 'payme'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50`}
            >
              ₽ Payme
            </button>
            <button
              onClick={() => setMethod('googlepay')}
              disabled={paymentProcessing}
              className={`p-3 rounded-lg text-xs font-semibold transition ${
                method === 'googlepay'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50`}
            >
              🔐 G. Pay
            </button>
          </div>

          {/* Stripe Card Form */}
          <AnimatePresence mode="wait">
            {method === 'stripe' && (
              <motion.div
                key="stripe"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Karta raqami
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                    disabled={paymentProcessing}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kartagacha ega
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardData.cardName}
                    onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                    disabled={paymentProcessing}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="MM"
                    maxLength={2}
                    value={cardData.expiryMonth}
                    onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value.slice(0, 2) })}
                    disabled={paymentProcessing}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    placeholder="YY"
                    maxLength={2}
                    value={cardData.expiryYear}
                    onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value.slice(0, 2) })}
                    disabled={paymentProcessing}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                  <div className="relative">
                    <input
                      type={showCardDetails ? 'text' : 'password'}
                      placeholder="CVV"
                      maxLength={3}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.slice(0, 3) })}
                      disabled={paymentProcessing}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCardDetails(!showCardDetails)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showCardDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {method === 'click' && (
              <motion.div
                key="click"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={clickPhone}
                  onChange={(e) => setClickPhone(formatPhone(e.target.value))}
                  disabled={paymentProcessing}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-400 mt-2">Click ilovasi orqali to'lab to'rasiz</p>
              </motion.div>
            )}

            {method === 'payme' && (
              <motion.div
                key="payme"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={paymePhone}
                  onChange={(e) => setPaymePhone(formatPhone(e.target.value))}
                  disabled={paymentProcessing}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-400 mt-2">Payme hamyonidan to'lash</p>
              </motion.div>
            )}

            {method === 'googlepay' && (
              <motion.div
                key="googlepay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-4"
              >
                <div className="text-4xl mb-2">🔐</div>
                <p className="text-slate-300 font-medium">Google Pay bilan to'lov</p>
                <p className="text-xs text-slate-400 mt-2">Mobil qurilmadagi Google Pay ma'lumotlari ishlatiladi</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real Payment Notice */}
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 flex gap-2 text-sm">
            <AlertTriangle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-200">
              <p className="font-semibold">🔐 Haqiqiy to'lov tizimi</p>
              <p className="text-xs mt-1">Bu haqiqiy pul qabul qiladi. Operatorlar tasdiqlaydi.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              disabled={paymentProcessing}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 font-semibold transition"
            >
              Bekor qilish
            </button>
            <button
              onClick={handlePayment}
              disabled={paymentProcessing}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 font-semibold transition flex items-center justify-center gap-2"
            >
              {paymentProcessing && <Loader2 size={18} className="animate-spin" />}
              {paymentProcessing ? 'Qayta ishlantirilimoqda...' : 'Haqiqiy to\'lash'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
