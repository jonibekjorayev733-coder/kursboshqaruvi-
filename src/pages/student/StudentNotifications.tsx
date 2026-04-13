import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { Bell, CreditCard, BookOpen, Calendar, Settings2, Check } from 'lucide-react';
import { notifications } from '@/data/mockData';

const iconMap: Record<string, React.ReactNode> = {
  payment: <CreditCard className="w-4 h-4" />,
  course: <BookOpen className="w-4 h-4" />,
  attendance: <Calendar className="w-4 h-4" />,
  system: <Settings2 className="w-4 h-4" />,
};

const colorMap: Record<string, string> = {
  payment: 'bg-warning/15 text-warning',
  course: 'bg-primary/15 text-primary',
  attendance: 'bg-destructive/15 text-destructive',
  system: 'bg-muted text-muted-foreground',
};

export default function StudentNotifications() {
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter(n => !n.read);
    return items.filter(n => n.type === filter);
  }, [items, filter]);

  const markRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = items.filter(n => !n.read).length;

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread (${unreadCount})` },
    { value: 'payment', label: 'Payment' },
    { value: 'course', label: 'Course' },
    { value: 'attendance', label: 'Attendance' },
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread`}>
        <button onClick={markAllRead} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
          <Check className="w-4 h-4" /> Mark all read
        </button>
      </PageHeader>

      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => markRead(n.id)}
            className={`glass rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-l-2 border-l-primary' : 'opacity-70'}`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${colorMap[n.type]}`}>
              {iconMap[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
