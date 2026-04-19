import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function StudentSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const studentIdRaw = localStorage.getItem('user_id');
  const studentId = studentIdRaw ? parseInt(studentIdRaw, 10) : NaN;

  const handleSubmit = async () => {
    if (Number.isNaN(studentId)) {
      toast.error('Foydalanuvchi aniqlanmadi');
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Barcha maydonlarni to‘ldiring');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yangi parol va tasdiqlash paroli mos emas');
      return;
    }

    setSubmitting(true);
    try {
      await api.changeStudentPassword(studentId, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Parol muvaffaqiyatli yangilandi');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Parolni yangilashda xatolik';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/15 shadow-[0_0_40px_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Sozlamalar</h1>
            <p className="text-slate-300 mt-2">Bu yerda faqat parolingizni xavfsiz o‘zgartira olasiz.</p>
          </div>
          <ShieldCheck className="w-12 h-12 text-cyan-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/80 p-6 md:p-8 shadow-[0_0_30px_rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-300" />
          Parolni o‘zgartirish
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Joriy parol</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="Joriy parol"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Yangi parol</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="Yangi parol"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Yangi parolni tasdiqlang</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="Yangi parolni qayta kiriting"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
          >
            {submitting ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
