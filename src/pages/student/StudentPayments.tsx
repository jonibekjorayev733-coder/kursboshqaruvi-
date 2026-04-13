import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { payments, courses, students } from '@/data/mockData';
import type { Payment } from '@/types';
import { toast } from 'sonner';

const currentStudent = students[0];

export default function StudentPayments() {
  const [showCard, setShowCard] = useState<Record<string, boolean>>({});
  const [payModal, setPayModal] = useState<Payment | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [showCardInput, setShowCardInput] = useState(false);

  const myPayments = useMemo(
    () => payments.filter(p => p.studentId === currentStudent.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    []
  );

  const totalPaid = myPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = myPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const handlePay = () => {
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number');
      return;
    }
    toast.success('Payment processed successfully! Admin has been notified.');
    setPayModal(null);
    setCardNumber('');
  };

  const columns = [
    { key: 'month', label: 'Month', render: (p: Payment) => new Date(p.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) },
    { key: 'course', label: 'Course', render: (p: Payment) => courses.find(c => c.id === p.courseId)?.name || '' },
    { key: 'amount', label: 'Amount', render: (p: Payment) => <span className="font-semibold">${p.amount}</span> },
    { key: 'status', label: 'Status', render: (p: Payment) => <StatusBadge status={p.status} variant="dot" /> },
    { key: 'cardLast4', label: 'Card', render: (p: Payment) => {
      if (!p.cardLast4) return '—';
      const visible = showCard[p.id];
      return (
        <button onClick={() => setShowCard(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="flex items-center gap-1.5 text-xs font-mono">
          {visible ? `•••• •••• •••• ${p.cardLast4}` : '•••• •••• •••• ••••'}
          {visible ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      );
    }},
    { key: 'action', label: '', render: (p: Payment) => {
      if (p.status === 'paid') return <CheckCircle2 className="w-4 h-4 text-success" />;
      return (
        <button onClick={() => setPayModal(p)} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
          Pay Now
        </button>
      );
    }},
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Manage your course payments" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-success">${totalPaid}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-warning">${totalUnpaid}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5 flex items-center gap-3">
          {totalUnpaid > 0 && <AlertTriangle className="w-5 h-5 text-warning shrink-0" />}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="text-sm font-medium">{totalUnpaid > 0 ? 'Payments pending' : 'All caught up!'}</p>
          </div>
        </motion.div>
      </div>

      <DataTable columns={columns} data={myPayments} keyExtractor={p => p.id} />

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Make Payment">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Course</span><span className="font-medium">{courses.find(c => c.id === payModal.courseId)?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-lg">${payModal.amount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Due Date</span><span>{new Date(payModal.dueDate).toLocaleDateString()}</span></div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Card Number</label>
              <div className="relative">
                <input
                  type={showCardInput ? 'text' : 'password'}
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                  placeholder="•••• •••• •••• ••••"
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary outline-none border-0"
                />
                <button type="button" onClick={() => setShowCardInput(!showCardInput)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showCardInput ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <button onClick={handlePay} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Pay ${payModal.amount}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
