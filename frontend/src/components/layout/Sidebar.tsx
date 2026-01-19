'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Deals', href: '/deals', icon: Kanban },
  { name: 'Búsquedas', href: '/enquiries', icon: Search },
];

const adminNavigation = [
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();
  const { user, logout, hasMinimumRole } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        className="fixed top-5 left-4 z-[100] md:hidden flex items-center justify-center w-12 h-12 bg-[#8B4513] text-white shadow-lg rounded-full"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar fixed md:relative z-50 md:z-0',
          sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#e0ccb0] dark:border-[#3D2314]">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/images/habita-logo.jpg"
                alt="HabitaCR"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-semibold text-lg text-black dark:text-white">HabitaCR</span>
            </Link>
          )}

          {/* Collapse button (desktop only) */}
          <button
            className="hidden md:flex btn btn-ghost btn-icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'sidebar-link',
                  isActive && 'sidebar-link-active'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className={cn('pt-4 pb-2', sidebarCollapsed && 'hidden')}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'sidebar-link',
                      isActive && 'sidebar-link-active'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={20} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'agent'}</p>
              </div>
            )}
          </div>

          <button
            className={cn(
              'sidebar-link mt-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full',
              sidebarCollapsed && 'justify-center'
            )}
            onClick={logout}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
