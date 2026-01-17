'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/deals': 'Deals',
  '/enquiries': 'Búsquedas',
  '/messages/whatsapp': 'WhatsApp',
  '/messages/email': 'Correos',
  '/settings': 'Configuración',
};

export function Header() {
  const pathname = usePathname();
  const { openModal } = useUIStore();

  // Get page title
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || 'CRM';

  // Determine quick action based on current page
  const getQuickAction = () => {
    if (pathname.startsWith('/leads')) {
      return { label: 'Nuevo Lead', action: () => openModal('create-lead') };
    }
    if (pathname.startsWith('/deals')) {
      return { label: 'Nuevo Deal', action: () => openModal('create-deal') };
    }
    if (pathname.startsWith('/enquiries')) {
      return { label: 'Nueva Búsqueda', action: () => openModal('create-enquiry') };
    }
    return null;
  };

  const quickAction = getQuickAction();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4 md:px-6">
      {/* Page title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold hidden md:block ml-0 md:ml-0">{title}</h1>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="input pl-10 w-64"
          />
        </div>

        {/* Mobile search button */}
        <button className="btn btn-ghost btn-icon md:hidden">
          <Search size={20} />
        </button>

        {/* Quick action button */}
        {quickAction && (
          <button
            className="btn btn-primary btn-sm md:btn-md"
            onClick={quickAction.action}
          >
            <Plus size={18} className="md:mr-2" />
            <span className="hidden md:inline">{quickAction.label}</span>
          </button>
        )}

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
