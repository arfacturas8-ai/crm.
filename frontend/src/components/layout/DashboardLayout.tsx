'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Notifications } from '../ui/Notifications';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('auth_token');
    if (!token && !isLoading) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, router, setLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex">
        <Sidebar />

        {/* Main content */}
        <main
          className={cn(
            'flex-1 min-h-screen transition-all duration-300',
            'ml-0 md:ml-0' // Sidebar handles its own positioning
          )}
        >
          <Header />

          <div className="p-4 md:p-6 pt-20 md:pt-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global notifications */}
      <Notifications />
    </div>
  );
}
