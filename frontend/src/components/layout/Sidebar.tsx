'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserPlus,
  Kanban,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  UserCog,
  Home,
  Users,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Seguimiento', href: '/deals', icon: Kanban },
  { name: 'Panel Agentes', href: '/panel-agentes', icon: Users },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  { name: 'Propietario', href: '/propietario', icon: Home },
];

const adminNavigation = [
  { name: 'Agentes', href: '/agentes', icon: UserCog },
  { name: 'Panel Acción', href: '/panel-accion', icon: ClipboardList },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();
  const { user, logout, isAdmin } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar fixed md:relative z-50 md:z-0',
          sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
          // Mobile: slide in from left
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Mobile: full height with safe area
          'md:h-screen'
        )}
        style={{
          // Safe area for notched devices
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {/* Mobile close button */}
          <button
            className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={24} className="text-gray-600" />
          </button>

          {!sidebarCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <img
                src="/images/habita-logo.jpg"
                alt="HabitaCR"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-semibold text-lg text-gray-900">HabitaCR</span>
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
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto scrollbar-thin scroll-touch">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'sidebar-link min-h-[44px]', // Touch target
                  isActive && 'sidebar-link-active'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin-only navigation */}
          {isAdmin() && (
            <>
              {!sidebarCollapsed && (
                <div className="pt-4 pb-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3">
                    Admin
                  </p>
                </div>
              )}
              {adminNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'sidebar-link min-h-[44px]',
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
        <div className="p-4 border-t" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
              'sidebar-link mt-3 text-red-600 hover:bg-red-50 w-full min-h-[44px]',
              sidebarCollapsed && 'justify-center'
            )}
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
