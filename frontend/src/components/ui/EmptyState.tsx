'use client';

import { ReactNode } from 'react';
import {
  Users,
  Building2,
  FileText,
  Search,
  Inbox,
  type LucideIcon
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    container: 'py-6',
    iconSize: 32,
    iconWrapper: 'w-12 h-12 mb-3',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'py-8',
    iconSize: 40,
    iconWrapper: 'w-16 h-16 mb-4',
    title: 'text-base font-medium',
    description: 'text-sm',
  },
  lg: {
    container: 'py-12',
    iconSize: 48,
    iconWrapper: 'w-20 h-20 mb-4',
    title: 'text-lg font-semibold',
    description: 'text-base',
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn('text-center', styles.container, className)}>
      <div className={cn(
        'mx-auto rounded-full bg-gray-100 flex items-center justify-center',
        styles.iconWrapper
      )}>
        <Icon size={styles.iconSize} className="text-gray-400" />
      </div>
      <h3 className={cn('text-gray-900', styles.title)}>{title}</h3>
      {description && (
        <p className={cn('text-gray-500 mt-1 max-w-sm mx-auto', styles.description)}>
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export function EmptyLeads({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No se encontraron leads"
      description="Comienza agregando tu primer lead al sistema"
      action={onCreateClick ? { label: 'Crear primer lead', onClick: onCreateClick } : undefined}
    />
  );
}

export function EmptyDeals({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      icon={Building2}
      title="Sin registros"
      description="No hay seguimientos en esta etapa"
      action={onCreateClick ? { label: 'Nuevo seguimiento', onClick: onCreateClick } : undefined}
      size="sm"
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      icon={Search}
      title="Sin resultados"
      description="Intenta con otros términos de búsqueda"
      size="sm"
    />
  );
}

export function EmptyNotes() {
  return (
    <EmptyState
      icon={FileText}
      title="Sin notas"
      description="Agrega una nota para registrar información importante"
      size="sm"
    />
  );
}
