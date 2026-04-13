import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useAppContext } from '@/contexts/AppContext';

export function DashboardLayout() {
  const { sidebarOpen } = useAppContext();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col min-h-screen ml-0 lg:ml-[72px]"
      >
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
