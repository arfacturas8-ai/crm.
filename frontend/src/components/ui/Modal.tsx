'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

interface ModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-5xl md:max-w-6xl',
};

export function Modal({ id, title, children, size = 'md', showCloseButton = true }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full mx-4 animate-slide-in max-h-[90vh] overflow-hidden flex flex-col',
          sizeClasses[size]
        )}
      >
        {/* Header - only show if title is provided */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            {showCloseButton && (
              <button
                onClick={closeModal}
                className="btn btn-ghost btn-icon"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn('flex-1 overflow-y-auto', title ? 'p-4' : 'p-0')}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal footer for action buttons
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 p-4 border-t bg-gray-50 dark:bg-gray-800', className)}>
      {children}
    </div>
  );
}
