'use client';

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function Notifications() {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 md:px-0">
      {notifications.map((notification) => {
        const Icon = icons[notification.type];

        return (
          <div
            key={notification.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in',
              colors[notification.type]
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[notification.type])} />

            <div className="flex-1 min-w-0">
              <p className="font-medium">{notification.title}</p>
              {notification.message && (
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              )}
            </div>

            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
