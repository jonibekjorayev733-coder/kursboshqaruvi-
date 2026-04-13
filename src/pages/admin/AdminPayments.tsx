import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { payments, students, courses } from '@/data/mockData';
import { Send, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayments() {
  const unpaidPayments = useMemo(
    () => payments.filter(p => p.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    []
  );

  const allPayments = useMemo(
    () => [...payments].sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    []
  );

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const handleReminder = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    toast.success(`SMS reminder sent to ${student?.name} (${student?.phone})`);
  };

  type PaymentRow = typeof allPayments[0];

  const columns = [
    { key: 'student', label: 'Student', render: (p: PaymentRow) => {
      const s = students.find(st => st.id === p.studentId);
      return s ? (
        <div className="flex items-center gap-2">
          <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full" />
          <span className="font-medium text-sm">{s.name}</span>
        </div>
      ) : '—';
    }},
    { key: 'course', label: 'Course', render: (p: PaymentRow) => courses.find(c => c.id === p.courseId)?.name || '' },
    { key: 'amount', label: 'Amount', render: (p: PaymentRow) => <span className="font-semibold">${p.amount}</span> },
    { key: 'month', label: 'Month', render: (p: PaymentRow) => new Date(p.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) },
    { key: 'status', label: 'Status', render: (p: PaymentRow) => <StatusBadge status={p.status} variant="dot" /> },
    { key: 'action', label: '', render: (p: PaymentRow) => p.status !== 'paid' ? (
      <button onClick={() => handleReminder(p.studentId)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors">
        <Send className="w-3 h-3" /> Remind
      </button>
    ) : null },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track and manage all payments" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-success" /><span className="text-sm text-muted-foreground">Total Collected</span></div>
          <p className="text-2xl font-bold text-success">${totalPaid.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-warning" /><span className="text-sm text-muted-foreground">Outstanding</span></div>
          <p className="text-2xl font-bold text-warning">${totalUnpaid.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Send className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">Overdue</span></div>
          <p className="text-2xl font-bold text-destructive">{payments.filter(p => p.status === 'overdue').length}</p>
        </motion.div>
      </div>

      <DataTable columns={columns} data={allPayments} keyExtractor={p => p.id} />
    </div>
  );
}
