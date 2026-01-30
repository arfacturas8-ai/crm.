'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserPlus,
  Kanban,
  Calendar,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

const navItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Pipeline', href: '/deals', icon: Kanban },
  { name: 'Agenda', href: '/calendario', icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setSidebarOpen } = useUIStore();

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'mobile-nav-item flex-1',
                isActive && 'active'
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* More menu button */}
        <button
          className="mobile-nav-item flex-1"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">Más</span>
        </button>
      </div>
    </nav>
  );
}
