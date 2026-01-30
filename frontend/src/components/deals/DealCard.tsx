'use client';

import { memo } from 'react';
import {
  GripVertical,
  Trash2,
  Building2,
  Calendar,
  User,
  Phone,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Deal } from '@/types';

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  onClick: (deal: Deal) => void;
  onDelete: (dealId: string, e: React.MouseEvent) => void;
  onDragStart: (deal: Deal) => void;
  onDragEnd: () => void;
}

export const DealCard = memo(function DealCard({
  deal,
  isDragging = false,
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
}: DealCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all',
        isDragging && 'opacity-50'
      )}
      draggable
      onDragStart={() => onDragStart(deal)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(deal)}
    >
      {/* Drag handle & delete */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <GripVertical size={14} className="text-gray-300 cursor-grab mt-0.5" />
        <button
          className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
          onClick={(e) => onDelete(deal.id, e)}
          aria-label="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Lead/Contact Name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-[#8B4513]" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {deal.contactName || deal.title || deal.leadName}
          </p>
          {(deal.contactPhone || deal.leadMobile) && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone size={10} />
              {deal.contactPhone || deal.leadMobile}
            </p>
          )}
        </div>
      </div>

      {/* Property */}
      {(deal.propertyTitle || deal.propiedad) && (
        <div className="bg-gray-50 rounded p-2 mb-2">
          <div className="flex items-center gap-2">
            <Building2 size={12} className="text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600 truncate">
              {deal.propertyTitle || deal.propiedad}
            </p>
          </div>
        </div>
      )}

      {/* What they're looking for */}
      {deal.busca && (
        <p className="text-xs text-gray-500 mb-1 truncate">
          Busca: {deal.busca}
        </p>
      )}

      {/* Date */}
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        <Calendar size={10} />
        {formatRelativeTime(deal.createdAt)}
      </p>
    </div>
  );
});
