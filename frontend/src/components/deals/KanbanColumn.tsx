'use client';

import { Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import { KanbanCardSkeleton } from '@/components/ui/Skeleton';
import type { Deal } from '@/types';

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  deals: Deal[];
  isLoading?: boolean;
  isDropTarget?: boolean;
  draggedDealId?: string | null;
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDealClick: (deal: Deal) => void;
  onDealDelete: (dealId: string, e: React.MouseEvent) => void;
  onDealDragStart: (deal: Deal) => void;
  onDealDragEnd: () => void;
  onAddClick: () => void;
}

export function KanbanColumn({
  id,
  label,
  color,
  deals,
  isLoading = false,
  isDropTarget = false,
  draggedDealId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDealClick,
  onDealDelete,
  onDealDragStart,
  onDealDragEnd,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        'w-72 lg:w-80 flex-shrink-0 bg-gray-50 rounded-lg flex flex-col',
        isDropTarget && 'ring-2 ring-[#8B4513]'
      )}
      style={{ maxHeight: 'calc(100vh - 380px)' }}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, id)}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <>
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
          </>
        ) : deals.length > 0 ? (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isDragging={draggedDealId === deal.id}
              onClick={onDealClick}
              onDelete={onDealDelete}
              onDragStart={onDealDragStart}
              onDragEnd={onDealDragEnd}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Building2 size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Sin registros</p>
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="p-2">
        <button
          className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-[#8B4513] hover:text-[#8B4513] transition-colors flex items-center justify-center gap-1 text-sm"
          onClick={onAddClick}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}
