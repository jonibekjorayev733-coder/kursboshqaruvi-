import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';

export function DashboardLayout() {
  const { sidebarOpen } = useAppContext();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 relative overflow-hidden selection:bg-primary/30">
      {/* Refined Luxury Background (Udar 2.0) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '4s' }} />
        {/* Grain effect using CSS instead of external SVG */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
          backgroundImage: 'radial-gradient(1px 1px at 1px 1px, rgb(255,255,255) 1px, transparent 1px)',
          backgroundSize: '2px 2px'
        }} />
      </div>

      <AppSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (sidebarOpen ? 280 : 100) : 0,
        }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col min-h-screen relative z-10"
      >
        <TopBar />
        <main className="flex-1 p-6 sm:p-8 lg:p-12 overflow-x-hidden luxury-scroll animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
