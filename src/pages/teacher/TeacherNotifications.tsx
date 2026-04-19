import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { api, type TeacherTaskNotificationFeed, type TeacherTaskNotificationItem } from '@/services/api';
import { toast } from 'sonner';

const sections: Array<{ key: keyof TeacherTaskNotificationFeed; title: string; subtitle: string }> = [
  { key: 'accepted', title: 'Vazifani qabul qilganlar', subtitle: 'Studentlar vazifani qabul qilgan holati' },
  { key: 'in_progress', title: 'Vazifani qilayotganlar', subtitle: 'Studentlar bajarish jarayonida' },
  { key: 'completed', title: 'Vazifani tugatganlar', subtitle: 'Studentlar tugatgan vazifalar' },
];

const dateText = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function TaskRow({ item }: { item: TeacherTaskNotificationItem }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Student</p>
          <p className="text-lg font-black text-white">{item.student_name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Vazifa</p>
          <p className="font-bold text-slate-200">{item.assignment_title}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-300 md:grid-cols-4">
        <div><span className="text-slate-500">Ko'rgan vaqti:</span> {dateText(item.seen_at)}</div>
        <div><span className="text-slate-500">Qabul qilgan:</span> {dateText(item.accepted_at)}</div>
        <div><span className="text-slate-500">Jarayonda:</span> {dateText(item.in_progress_at)}</div>
        <div><span className="text-slate-500">Tugatgan:</span> {dateText(item.completed_at)}</div>
      </div>
    </div>
  );
}

export default function TeacherNotifications() {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<TeacherTaskNotificationFeed>({
    accepted: [],
    in_progress: [],
    completed: [],
  });
  const [knownProgressIds, setKnownProgressIds] = useState<Set<number>>(new Set());

  const teacherId = parseInt(localStorage.getItem('user_id') || '0', 10);

  const loadFeed = async () => {
    try {
      const response = await api.getTeacherTaskNotifications(teacherId);

      const allItems = [...response.accepted, ...response.in_progress, ...response.completed];
      const currentIds = new Set(allItems.map(item => item.progress_id));

      if (knownProgressIds.size > 0) {
        const newItems = allItems.filter(item => !knownProgressIds.has(item.progress_id));
        for (const item of newItems) {
          toast.success(`SMS: ${item.student_name} - ${item.assignment_title} (${item.status})`);
        }
      }

      setFeed(response);
      setKnownProgressIds(currentIds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const timer = setInterval(loadFeed, 20000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white">Bildirishnomalar</h1>
        <p className="text-slate-400">Studentlardan kelgan vazifa holati xabarlari</p>
      </div>

      {sections.map((section) => (
        <Card key={section.key} className="border-slate-700/60 bg-slate-800/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">{section.title}</h2>
              <p className="text-sm text-slate-400">{section.subtitle}</p>
            </div>
            <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-black text-primary">
              {(feed[section.key] || []).length}
            </span>
          </div>

          <div className="space-y-3">
            {(feed[section.key] || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">Hozircha ma'lumot yo'q</div>
            ) : (
              (feed[section.key] || []).map((item) => <TaskRow key={item.progress_id} item={item} />)
            )}
          </div>
        </Card>
      ))}
    </motion.div>
  );
}
