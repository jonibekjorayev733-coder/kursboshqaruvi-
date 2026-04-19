import { motion } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
  delay?: number;
}

export function StatCard({ title, value, subtitle, icon, trend, delay = 0 }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation (Refined 3D Tilt)
    const rotateX = ((y / rect.height) - 0.5) * -10;
    const rotateY = ((x / rect.width) - 0.5) * 10;

    cardRef.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
      className="udar-card-v2 group cursor-default udar-shimmer"
    >
      <div className="flex items-start justify-between relative z-10 transition-transform duration-500 group-hover:translate-z-20">
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground/40 font-black leading-none">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black italic tracking-tighter text-glow drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {value}
            </h3>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground/60 font-medium tracking-tight">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className="flex items-center px-2 py-1 rounded-full bg-current/10 border border-current/20 shadow-xl">
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="opacity-20 uppercase">Trend Performance</span>
            </div>
          )}
        </div>
        <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-primary shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 blur-xl group-hover:opacity-100 opacity-0 transition-opacity" />
          <div className="relative z-10">{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}
