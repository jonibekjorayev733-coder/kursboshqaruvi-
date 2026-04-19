import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Circle, Clock3, CreditCard, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type Assignment, type Notification } from '@/services/api';
import { toast } from 'sonner';

const paymentTypes = new Set(['payment_paid', 'payment_received', 'payment_reminder']);
const assignmentTypes = new Set(['assignment_created', 'assignment_updated', 'assignment_deleted']);

type TaskTab = 'payments' | 'tasks';
type TaskStatus = 'accepted' | 'in_progress' | 'completed';

const statusMeta: Record<TaskStatus, { label: string; icon: JSX.Element; buttonLabel: string }> = {
  accepted: {
    label: 'Qabul qildim',
    icon: <CheckCircle2 className="h-4 w-4" />,
    buttonLabel: 'Qabul qildim',
  },
  in_progress: {
    label: 'Tayyorlanish jarayonida',
    icon: <Clock3 className="h-4 w-4" />,
    buttonLabel: 'Tayyorlanmoqda',
  },
  completed: {
    label: 'Vazifa tayyor',
    icon: <Circle className="h-4 w-4" />,
    buttonLabel: 'Vazifa tayyor',
  },
};

export default function StudentNotificationsV2() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskTab>('payments');
  const [selectedStatus, setSelectedStatus] = useState<Record<number, TaskStatus>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptedMap, setAcceptedMap] = useState<Record<number, boolean>>({});

  const studentId = parseInt(localStorage.getItem('user_id') || '0', 10);

  const loadData = async () => {
    try {
      const [notifRes, assignmentRes, progressRes] = await Promise.all([
        api.getNotifications(studentId),
        api.getAssignments(undefined, undefined, studentId),
        api.getStudentAssignmentProgress(studentId),
      ]);

      setNotifications(Array.isArray(notifRes) ? notifRes : []);
      setAssignments(Array.isArray(assignmentRes) ? assignmentRes : []);

      const acceptedState: Record<number, boolean> = {};
      for (const progress of Array.isArray(progressRes) ? progressRes : []) {
        const isAcceptedStatus = progress.status === 'accepted' || progress.status === 'in_progress' || progress.status === 'completed';
        acceptedState[progress.assignment_id] = isAcceptedStatus;
      }
      setAcceptedMap(acceptedState);
    } catch {
      setNotifications([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const paymentNotifications = useMemo(
    () => notifications.filter((n) => paymentTypes.has(n.type)),
    [notifications]
  );

  const taskNotifications = useMemo(
    () => notifications.filter((n) => assignmentTypes.has(n.type)),
    [notifications]
  );

  const markRead = async (id?: number) => {
    if (!id) return;
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    toast.success("SMS: Xabar o'qildi deb belgilandi");
  };

  const handleAccept = async (assignmentId: number, notificationId?: number) => {
    if (acceptedMap[assignmentId]) {
      return;
    }

    setAcceptingId(assignmentId);
    try {
      await api.updateAssignmentStatus(assignmentId, studentId, 'accepted');
      setAcceptedMap((prev) => ({ ...prev, [assignmentId]: true }));
      setSelectedStatus((prev) => ({ ...prev, [assignmentId]: 'in_progress' }));

      if (notificationId) {
        await markRead(notificationId);
      }

      toast.success("SMS: Vazifa qabul qilindi va o'qituvchiga yuborildi");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Holatni yuborishda xatolik yuz berdi';
      toast.error(`SMS: ${message}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const sendTaskStatus = async (assignment: Assignment) => {
    if (!assignment.id) return;

    const alreadyAccepted = Boolean(acceptedMap[assignment.id]);
    if (!alreadyAccepted) {
      toast.warning("Avval 'Qabul qildim' tugmasini bosing");
      return;
    }

    const status = selectedStatus[assignment.id] ?? 'in_progress';
    if (status === 'accepted') {
      toast.warning("Qabul qildim allaqachon yuborilgan. Endi qolgan holatni yuboring.");
      return;
    }

    setSendingId(assignment.id);
    try {
      await api.updateAssignmentStatus(assignment.id, studentId, status);
      await loadData();
      toast.success(`SMS: ${statusMeta[status].label} holati yuborildi`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Holatni yuborishda xatolik yuz berdi';
      toast.error(`SMS: ${message}`);
    } finally {
      setSendingId(null);
    }
  };

  const renderNotificationCard = (notification: Notification, isTask = false) => {
    const linkedAssignment = isTask
      ? assignments.find((assignment) => assignment.id === notification.assignment_id)
      : undefined;

    const isAccepted = linkedAssignment?.id ? Boolean(acceptedMap[linkedAssignment.id]) : false;

    return (
      <Card
        key={notification.id}
        className={`p-4 border transition-all ${
          notification.read
            ? 'bg-slate-800/30 border-slate-700/50 opacity-70'
            : isTask
            ? 'bg-blue-500/10 border-blue-400/40'
            : 'bg-emerald-500/10 border-emerald-400/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {isTask ? <Bell className="mt-0.5 h-5 w-5 text-blue-300" /> : <CreditCard className="mt-0.5 h-5 w-5 text-emerald-300" />}
            <div>
              <p className="font-black text-white">{notification.title}</p>
              <p className="text-sm text-slate-300">{notification.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {notification.created_at
                  ? new Date(notification.created_at).toLocaleString('uz-UZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!notification.read && (
              <Button size="sm" variant="ghost" onClick={() => markRead(notification.id)}>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </Button>
            )}
          </div>
        </div>

        {isTask && linkedAssignment?.id && (
          <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 mb-2">Holat tanlang va yuboring</p>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={isAccepted || acceptingId === linkedAssignment.id}
                onClick={() => handleAccept(linkedAssignment.id as number, notification.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                  isAccepted
                    ? 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300 cursor-not-allowed'
                    : 'border-primary bg-primary/20 text-primary'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {statusMeta.accepted.icon}
                  {acceptingId === linkedAssignment.id ? 'Yuborilmoqda...' : statusMeta.accepted.buttonLabel}
                </span>
              </button>

              {(['in_progress', 'completed'] as TaskStatus[]).map((status) => {
                const active = (selectedStatus[linkedAssignment.id!] ?? 'in_progress') === status;
                const isLocked = !isAccepted;
                return (
                  <button
                    key={status}
                    disabled={isLocked}
                    onClick={() =>
                      setSelectedStatus((prev) => ({
                        ...prev,
                        [linkedAssignment.id!]: status,
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                      active
                        ? 'border-primary bg-primary/20 text-primary'
                        : isLocked
                        ? 'border-slate-800 bg-slate-900/60 text-slate-600 cursor-not-allowed'
                        : 'border-slate-700 bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">{statusMeta[status].icon}{statusMeta[status].buttonLabel}</span>
                  </button>
                );
              })}

              <Button
                className="ml-auto"
                onClick={() => sendTaskStatus(linkedAssignment)}
                disabled={sendingId === linkedAssignment.id || !isAccepted}
              >
                <Send className="mr-1 h-4 w-4" />
                {sendingId === linkedAssignment.id ? 'Yuborilmoqda...' : 'Yuborish'}
              </Button>
            </div>
            {!isAccepted && (
              <p className="mt-2 text-xs text-amber-400">Avval `Qabul qildim`ni bosing. Shundan keyin qolgan 2 tugma ochiladi.</p>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Yuklanmoqda...</div>;

  const items = activeTab === 'payments' ? paymentNotifications : taskNotifications;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white">Bildirishnomalar</h1>
        <p className="text-slate-400">To'lovlar va vazifalar bo'yicha xabarlar</p>
      </div>

      <div className="flex gap-2">
        <Button variant={activeTab === 'payments' ? 'default' : 'outline'} onClick={() => setActiveTab('payments')}>
          To'lovlar ({paymentNotifications.length})
        </Button>
        <Button variant={activeTab === 'tasks' ? 'default' : 'outline'} onClick={() => setActiveTab('tasks')}>
          Vazifalar ({taskNotifications.length})
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="p-10 text-center text-slate-400">Ma'lumot topilmadi</Card>
        ) : (
          items.map((notification) => renderNotificationCard(notification, activeTab === 'tasks'))
        )}
      </div>
    </motion.div>
  );
}
