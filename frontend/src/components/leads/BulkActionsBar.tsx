'use client';

import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  isDeleting = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 shadow-lg z-40 animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-9"
            aria-label="Deseleccionar todos"
          >
            <X size={16} className="mr-1" />
            <span className="hidden sm:inline">Cancelar</span>
          </Button>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          {!allSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="h-9 text-[#8B4513]"
            >
              <CheckSquare size={16} className="mr-1" />
              <span className="hidden sm:inline">Seleccionar todos ({totalCount})</span>
              <span className="sm:hidden">Todos</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            isLoading={isDeleting}
            className="h-9"
          >
            <Trash2 size={16} className="mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
