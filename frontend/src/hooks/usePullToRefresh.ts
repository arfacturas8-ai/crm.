'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only enable if scrolled to top
    if (container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (startY.current === 0) return;

    const container = containerRef.current;
    if (!container) return;

    // Only pull if at top of scroll
    if (container.scrollTop > 0) {
      startY.current = 0;
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);

    // Apply resistance
    const resistance = 0.5;
    const pullWithResistance = Math.min(distance * resistance, threshold * 1.5);

    setPullDistance(pullWithResistance);

    // Prevent default scroll when pulling
    if (pullWithResistance > 0) {
      e.preventDefault();
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    const shouldRefresh = pullDistance >= threshold;

    if (shouldRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    startY.current = 0;
    currentY.current = 0;
    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isRefreshing,
    pullDistance,
    containerRef,
  };
}
