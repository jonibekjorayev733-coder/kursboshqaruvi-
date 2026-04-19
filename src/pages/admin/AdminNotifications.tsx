import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, CreditCard, Trash2, AlertCircle, Check } from 'lucide-react';
import { api } from '../../services/api';
import type { Notification } from '../../services/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const adminId = parseInt(localStorage.getItem('user_id') || '0', 10);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(adminId);
      const onlyPayments = Array.isArray(data)
        ? data.filter(n => n.type === 'payment_received' || n.type === 'payment_paid' || n.type === 'payment_reminder')
        : [];
      setNotifications(onlyPayments);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read && n.id);
    await Promise.all(unread.map(n => api.markNotificationRead(n.id!).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    if (type === 'payment_received' || type === 'payment_paid') return <CreditCard className="w-5 h-5 text-green-500" />;
    if (type === 'assignment_submitted') return <Check className="w-5 h-5 text-blue-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <Bell className="w-8 h-8 text-amber-500" />
        </motion.div>
        <span className="ml-3 text-slate-400 font-black">Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* HEADER */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Bildirishnomalar</h1>
            <p className="text-violet-100 font-medium">Faqat to'lov xabarlari</p>
          </div>
          <div className="relative">
            <Bell className="w-20 h-20 text-white opacity-80" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-sm"
              >
                {unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-200 border border-slate-700/50 font-black text-sm uppercase">
          To'lovlar ({notifications.length})
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/20 text-green-400 hover:bg-green-600/30 font-black text-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Barchasini o'qildi
          </button>
        )}
      </motion.div>

      {/* NOTIFICATIONS LIST */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="space-y-3">
        {notifications.length === 0 ? (
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50"
          >
            <Bell className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 font-black">Bildirishnomalar yo'q</p>
          </motion.div>
        ) : (
          notifications.map((notif, idx) => (
            <motion.div
              key={notif.id || idx}
              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-2xl border p-4 flex items-start gap-4 transition-all ${
                notif.read
                  ? 'bg-slate-800/30 border-slate-700/50 opacity-70'
                  : notif.type === 'payment_received'
                  ? 'bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-500/40'
                  : 'bg-slate-800/60 border-violet-500/30'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>

              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                  {notif.title}
                </p>
                <p className={`text-sm mt-0.5 ${notif.read ? 'text-slate-500' : 'text-slate-300'}`}>
                  {notif.message}
                </p>
                {notif.created_at && (
                  <p className="text-xs text-slate-500 mt-1">
                    🕐 {new Date(notif.created_at).toLocaleString('uz-UZ', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!notif.read && notif.id && (
                  <button
                    onClick={() => handleMarkRead(notif.id!)}
                    className="p-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-all"
                    title="O'qildi deb belgilash"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => notif.id && handleDelete(notif.id)}
                  className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-all"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
