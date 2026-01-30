'use client';

import { useEffect, useRef } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

interface ModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  mobileFullScreen?: boolean;
}

const sizeClasses = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
  full: 'md:max-w-5xl lg:max-w-6xl',
};

export function Modal({
  id,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  mobileFullScreen = true,
}: ModalProps) {
  const { modalOpen, closeModal } = useUIStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const isOpen = modalOpen === id;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={closeModal}
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white shadow-xl w-full animate-slide-up md:animate-slide-in flex flex-col',
          // Mobile: full screen or bottom sheet style
          mobileFullScreen
            ? 'h-[100dvh] max-h-[100dvh] rounded-none'
            : 'h-auto max-h-[85dvh] rounded-t-2xl',
          // Desktop: normal modal behavior
          'md:h-auto md:max-h-[90vh] md:rounded-lg md:mx-4',
          sizeClasses[size]
        )}
      >
        {/* Header - Mobile optimized with back button */}
        {title && (
          <div className="flex items-center gap-3 p-3 md:p-4 border-b bg-white sticky top-0 z-10 min-h-[56px] md:min-h-[60px]">
            {/* Mobile back button */}
            <button
              onClick={closeModal}
              className="md:hidden p-2 -ml-1 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <h2 className="text-base md:text-lg font-semibold flex-1 truncate">
              {title}
            </h2>

            {/* Desktop close button */}
            {showCloseButton && (
              <button
                onClick={closeModal}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content - Better padding for mobile */}
        <div className={cn(
          'flex-1 overflow-y-auto overscroll-contain',
          title ? 'p-4 md:p-6' : 'p-0'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal footer for action buttons - Mobile optimized
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-3 p-4 border-t bg-gray-50',
      // Safe area for devices with home indicator
      'pb-safe',
      className
    )}>
      {children}
    </div>
  );
}
