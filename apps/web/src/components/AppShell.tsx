import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Rocket,
  FileSearch,
  MessageSquare,
  CheckSquare,
  Mail,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/deals', label: 'Engagements', icon: Users },
  { path: '/properties', label: 'Off-Market DB', icon: Building2 },
  { path: '/agents', label: 'Agent Rocket', icon: Rocket },
  { path: '/due-diligence', label: 'Due Diligence', icon: FileSearch },
  { path: '/meetings', label: 'Meeting Notes', icon: MessageSquare },
  { path: '/compliance', label: 'Compliance', icon: CheckSquare },
  { path: '/email-templates', label: 'Email Templates', icon: Mail },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setDark = useThemeStore((s) => s.setDark);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync class on mount in case of SSR/hydration mismatch
  useEffect(() => {
    setDark(isDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-subtle)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[var(--sidebar-width)] flex-col bg-card border-r border-border transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-[var(--topbar-height)] items-center gap-3 px-4 border-b border-border shrink-0">
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Connect"
            className="h-8 w-auto object-contain"
          />
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-[var(--surface-tinted)] hover:text-foreground'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle + User section */}
        <div className="border-t border-border p-3 shrink-0 space-y-1 relative">
          {/* Theme toggle row */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--surface-tinted)] hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="flex-1 text-left">{isDark ? 'Light mode' : 'Dark mode'}</span>
            {/* Toggle pill */}
            <span
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200',
                isDark ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform duration-200',
                  isDark ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </span>
          </button>

          {/* User pill */}
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--surface-tinted)] transition-colors"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-foreground truncate text-xs">{currentUser?.name}</p>
              <p className="text-muted-foreground truncate text-xs capitalize">
                {currentUser?.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-md shadow-[var(--shadow-elevated)] z-10">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-tinted)] rounded-md transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="flex h-[var(--topbar-height)] items-center gap-3 px-4 bg-card border-b border-border lg:hidden shrink-0">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Connect"
            className="h-7 w-auto object-contain"
          />
          {/* Mobile theme toggle */}
          <button
            onClick={toggleTheme}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--surface-tinted)] hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}