import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DataTableProps<T> {
  columns: { key: string; label: string; render?: (item: T) => ReactNode }[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, keyExtractor, emptyMessage = 'No data found' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              {columns.map(col => (
                <th key={col.key} className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <motion.tr
                key={keyExtractor(item)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 text-sm">
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
