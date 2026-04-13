import { useAppContext } from '@/contexts/AppContext';
import { Sun, Moon, Menu, Bell } from 'lucide-react';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: 'student', label: '🎓 Student', color: 'bg-primary/15 text-primary' },
  { value: 'teacher', label: '👨‍🏫 Teacher', color: 'bg-accent/15 text-accent' },
  { value: 'admin', label: '👑 Admin', color: 'bg-warning/15 text-warning' },
];

export function TopBar() {
  const { role, setRole, theme, toggleTheme, setSidebarOpen } = useAppContext();

  return (
    <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Switch role:</span>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {roleOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  role === opt.value ? opt.color : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </button>
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ml-2">
          {role[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
