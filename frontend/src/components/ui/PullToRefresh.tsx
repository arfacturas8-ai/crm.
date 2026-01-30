'use client';

import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh({
    onRefresh,
    disabled,
    threshold: 80,
  });

  const progress = Math.min(pullDistance / 80, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 flex items-center justify-center transition-all duration-200 z-10 pointer-events-none',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center',
            isRefreshing && 'animate-pulse'
          )}
        >
          <RefreshCw
            size={20}
            className={cn(
              'text-[#8B4513] transition-transform',
              isRefreshing && 'animate-spin'
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
