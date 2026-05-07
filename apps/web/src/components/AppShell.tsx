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
          className="fixed inset-0 z-20 bg-[var(--blue-midnight)]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[var(--sidebar-width)] flex-col transition-transform duration-200',
          'shadow-[var(--shadow-sidebar)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0'
        )}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Logo area */}
        <div
          className="flex h-[var(--topbar-height)] items-center gap-3 px-4 shrink-0"
          style={{
            background: 'var(--sidebar-logo-bg)',
            borderBottom: '1px solid var(--sidebar-border)',
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
              alt="Martelli Connect"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>
          <button
            className="ml-auto lg:hidden"
            style={{ color: 'var(--sidebar-text-muted)' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav label */}
        <div className="px-4 pt-5 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sidebar-text-muted)' }}>
            Navigation
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'sidebar-nav-active'
                    : 'hover:bg-[var(--sidebar-hover)]'
                )
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-2 h-px" style={{ background: 'var(--sidebar-border)' }} />

        {/* Bottom section: theme + user */}
        <div className="px-3 pb-4 shrink-0 space-y-1 relative">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150"
            style={{ color: 'var(--sidebar-text)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Toggle theme"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="flex-1 text-left">{isDark ? 'Light mode' : 'Dark mode'}</span>
            <span
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200',
                isDark ? 'bg-[var(--blue-bright)]' : 'bg-[var(--sidebar-text-muted)]/40'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200',
                  isDark ? 'translate-x-4' : 'translate-x-0'
                )}
                style={{ background: 'var(--sidebar-active-text)' }}
              />
            </span>
          </button>

          {/* User pill */}
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150"
            style={{ color: 'var(--sidebar-text)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: 'var(--gradient-cta)',
                color: 'hsl(0 0% 100%)',
                boxShadow: 'var(--shadow-cta)',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold truncate text-xs" style={{ color: 'hsl(0 0% 100% / 0.9)' }}>
                {currentUser?.name}
              </p>
              <p className="truncate text-xs capitalize" style={{ color: 'var(--sidebar-text-muted)' }}>
                {currentUser?.role}
              </p>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--sidebar-text-muted)' }} />
          </button>

          {userMenuOpen && (
            <div
              className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border shadow-[var(--shadow-elevated)] z-10 overflow-hidden"
              style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
            >
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--sidebar-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header
          className="flex h-[var(--topbar-height)] items-center gap-3 px-4 lg:hidden shrink-0"
          style={{
            background: 'var(--sidebar-bg)',
            borderBottom: '1px solid var(--sidebar-border)',
          }}
        >
          <button
            style={{ color: 'var(--sidebar-text)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Connect"
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <button
            onClick={toggleTheme}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Blue accent strip at top of content */}
        <div className="accent-strip shrink-0" />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}