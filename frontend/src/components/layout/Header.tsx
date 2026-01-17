'use client';

import { Search, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/deals': 'Deals',
  '/enquiries': 'Búsquedas',
  '/settings': 'Configuración',
};

export function Header() {
  const pathname = usePathname();
  const { openModal } = useUIStore();

  // Get page title
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || 'HabitaCR';

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
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-black border-b border-[#e0ccb0] dark:border-[#3D2314] flex items-center justify-between px-4 md:px-6">
      {/* Page title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-black dark:text-white hidden md:block">{title}</h1>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B4513]" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 w-64 h-10 rounded-lg border border-[#e0ccb0] focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
          />
        </div>

        {/* Mobile search button */}
        <button className="p-2 hover:bg-[#f0e6d8] rounded-lg md:hidden">
          <Search size={20} className="text-[#8B4513]" />
        </button>

        {/* Quick action button */}
        {quickAction && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#8B4513] hover:bg-[#6b350f] text-white rounded-lg text-sm font-medium transition-colors"
            onClick={quickAction.action}
          >
            <Plus size={18} />
            <span className="hidden md:inline">{quickAction.label}</span>
          </button>
        )}
      </div>
    </header>
  );
}
