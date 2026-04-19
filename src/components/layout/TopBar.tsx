import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Settings } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: 'student', label: '🎓 Student', color: 'bg-primary/15 text-primary' },
  { value: 'teacher', label: '👨‍🏫 Teacher', color: 'bg-accent/15 text-accent' },
];

const roleBadgeText: Record<UserRole, string> = {
  admin: 'ADMIN',
  teacher: 'O‘QITUVCHI',
  student: 'O‘QUVCHI',
};

export function TopBar() {
  const { role, setRole, theme, setSidebarOpen } = useAppContext();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName = localStorage.getItem('name') || 'User';
  const userEmail = localStorage.getItem('email') || 'user@example.com';
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    
    // Dispatch custom event for AppContext to reset to student
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: 'student' } }));
    
    // Redirect to login
    navigate('/login');
  };

  const handleNotificationsClick = () => {
    if (role === 'admin') {
      navigate('/admin/notifications');
      return;
    }
    if (role === 'student') {
      navigate('/student/notifications');
      return;
    }
    navigate('/teacher/notifications');
  };

  const handleOpenSettings = () => {
    setShowUserMenu(false);
    if (role === 'student') {
      navigate('/student/settings');
    }
  };

  return (
    <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Only show role switcher if NOT logged in (for demo purposes) */}
        {!token && (
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
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleNotificationsClick} className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </button>
        
        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors ml-2"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold">{userName}</span>
              <span className="text-[10px] text-muted-foreground">{roleBadgeText[role]}</span>
            </div>
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {role[0].toUpperCase()}
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-border/50 bg-muted/50">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              {role === 'student' && (
                <button
                  onClick={handleOpenSettings}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/40 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Sozlamalar (Settings)
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
