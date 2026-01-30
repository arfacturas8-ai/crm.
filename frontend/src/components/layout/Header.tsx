'use client';

import { Search, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/deals': 'Seguimiento',
  '/enquiries': 'Búsquedas',
  '/settings': 'Configuración',
  '/calendario': 'Calendario',
  '/agentes': 'Agentes',
  '/panel-agentes': 'Panel Agentes',
  '/panel-accion': 'Panel Acción',
  '/propietario': 'Propietario',
};

export function Header() {
  const pathname = usePathname();
  const { openModal } = useUIStore();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Get page title
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || 'HabitaCR';

  // Determine quick action based on current page
  const getQuickAction = () => {
    if (pathname.startsWith('/leads')) {
      return { label: 'Nuevo Lead', shortLabel: 'Nuevo', action: () => openModal('create-lead') };
    }
    if (pathname.startsWith('/deals')) {
      return { label: 'Nuevo Seguimiento', shortLabel: 'Nuevo', action: () => openModal('create-deal') };
    }
    if (pathname.startsWith('/enquiries')) {
      return { label: 'Nueva Búsqueda', shortLabel: 'Nueva', action: () => openModal('create-enquiry') };
    }
    return null;
  };

  const quickAction = getQuickAction();

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-white border-b border-[#e0ccb0]',
      'h-14 md:h-16',
      'flex items-center justify-between',
      'px-4 md:px-6'
    )}>
      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-white z-10 flex items-center px-4 gap-3 md:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              autoFocus
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent text-base"
            />
          </div>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200"
            onClick={() => setShowMobileSearch(false)}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
      )}

      {/* Page title - visible on mobile */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-semibold text-black">{title}</h1>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Desktop search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B4513]" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 w-64 h-10 rounded-lg border border-[#e0ccb0] focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
          />
        </div>

        {/* Mobile search button */}
        <button
          className="p-2.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 md:hidden"
          onClick={() => setShowMobileSearch(true)}
          aria-label="Buscar"
        >
          <Search size={20} className="text-[#8B4513]" />
        </button>

        {/* Quick action button */}
        {quickAction && (
          <button
            className={cn(
              'flex items-center justify-center gap-2',
              'bg-[#8B4513] hover:bg-[#6b350f] active:bg-[#5a3810]',
              'text-white rounded-lg font-medium transition-colors',
              // Mobile: icon only, larger touch target
              'h-10 w-10 md:h-10 md:w-auto md:px-4',
              'text-sm'
            )}
            onClick={quickAction.action}
            aria-label={quickAction.label}
          >
            <Plus size={20} />
            <span className="hidden md:inline">{quickAction.label}</span>
          </button>
        )}
      </div>
    </header>
  );
}
