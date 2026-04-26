import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Send, ExternalLink, CheckCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function StudentSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [telegramPhone, setTelegramPhone] = useState('');
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramLink, setTelegramLink] = useState<null | {
    deep_link: string; student_name: string; expires_at: string;
  }>(null);

  const studentIdRaw = localStorage.getItem('user_id');
  const studentId = studentIdRaw ? parseInt(studentIdRaw, 10) : NaN;

  const handleSubmit = async () => {
    if (Number.isNaN(studentId)) { toast.error("Foydalanuvchi aniqlanmadi"); return; }
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) { toast.error("Barcha maydonlarni to'ldiring"); return; }
    if (newPassword.length < 6) { toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { toast.error("Yangi parol va tasdiqlash paroli mos emas"); return; }
    setSubmitting(true);
    try {
      await api.changeStudentPassword(studentId, currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success("Parol muvaffaqiyatli yangilandi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Parolni yangilashda xatolik");
    } finally { setSubmitting(false); }
  };

  const handleTelegramLink = async () => {
    if (!telegramPhone.trim()) { toast.error("Telefon raqamingizni kiriting"); return; }
    setTelegramLinking(true);
    try {
      const result = await api.requestTelegramLink(telegramPhone.trim());
      setTelegramLink(result);
      toast.success("Havola tayyor! Bot havolasini bosing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally { setTelegramLinking(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/15 shadow-[0_0_40px_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Sozlamalar</h1>
            <p className="text-slate-300 mt-2">Parol va Telegram bot sozlamalari.</p>
          </div>
          <ShieldCheck className="w-12 h-12 text-cyan-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/80 p-6 md:p-8 shadow-[0_0_30px_rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Telegram botni ulash
        </h2>
        <p className="text-slate-400 text-sm mb-6">Telefon raqamingizni kiriting (adminda saqlanganiga mos). Ulangandan keyin davomat, baho va to'lov xabarlari Telegram botga keladi.</p>
        {!telegramLink ? (
          <div className="flex gap-3 flex-col sm:flex-row">
            <input type="tel" value={telegramPhone} onChange={(e) => setTelegramPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTelegramLink()}
              className="flex-1 rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-blue-400"
              placeholder="+998901234567" />
            <button onClick={handleTelegramLink} disabled={telegramLinking}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60 whitespace-nowrap">
              {telegramLinking ? "So'ralyapti..." : "Havola olish"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <CheckCircle className="w-5 h-5" />
              {telegramLink.student_name} uchun havola tayyor
            </div>
            <p className="text-slate-400 text-xs">Muddati: {new Date(telegramLink.expires_at).toLocaleTimeString()} gacha (15 daqiqa)</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={telegramLink.deep_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white">
                <ExternalLink className="w-4 h-4" />
                Telegram Botni Ochish
              </a>
              <button onClick={() => { setTelegramLink(null); setTelegramPhone(''); }}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-slate-300">
                Bekor qilish
              </button>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3">
              <QrCode className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-400 break-all select-all">{telegramLink.deep_link}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/80 p-6 md:p-8 shadow-[0_0_30px_rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-300" />
          Parolni o'zgartirish
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Joriy parol</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Joriy parol" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Yangi parol</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Yangi parol" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Yangi parolni tasdiqlang</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Yangi parolni qayta kiriting" />
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60">
            {submitting ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
