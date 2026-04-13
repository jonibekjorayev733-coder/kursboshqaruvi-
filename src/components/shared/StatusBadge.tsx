interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'dot';
}

const statusColors: Record<string, string> = {
  present: 'bg-success/15 text-success border-success/30',
  absent: 'bg-destructive/15 text-destructive border-destructive/30',
  late: 'bg-warning/15 text-warning border-warning/30',
  paid: 'bg-success/15 text-success border-success/30',
  unpaid: 'bg-warning/15 text-warning border-warning/30',
  overdue: 'bg-destructive/15 text-destructive border-destructive/30',
  active: 'bg-success/15 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-border',
};

const dotColors: Record<string, string> = {
  present: 'bg-success',
  absent: 'bg-destructive',
  late: 'bg-warning',
  paid: 'bg-success',
  unpaid: 'bg-warning',
  overdue: 'bg-destructive',
};

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-muted text-muted-foreground border-border';
  const dotColor = dotColors[status] || 'bg-muted-foreground';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {variant === 'dot' && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
