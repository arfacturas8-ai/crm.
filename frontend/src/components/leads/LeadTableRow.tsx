'use client';

import { MessageSquare, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import { Badge, getLeadStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getWhatsAppLink, formatPhoneDisplay, formatRelativeTime } from '@/lib/utils';
import { getLeadStatusLabel, getLeadSourceLabel } from '@/lib/constants';
import type { Lead } from '@/types';

interface LeadTableRowProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  showDeleteButton?: boolean;
}

export function LeadTableRow({
  lead,
  onView,
  onEdit,
  onDelete,
  showDeleteButton = false,
}: LeadTableRowProps) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      {/* Name */}
      <td className="p-3 lg:p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#8B4513] font-medium text-sm">
              {lead.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">{lead.name}</p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="p-3 lg:p-4">
        <div className="space-y-1">
          {lead.mobile && (
            <div className="flex items-center gap-1.5">
              <a
                href={getWhatsAppLink(lead.mobile)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs lg:text-sm hover:text-[#25D366] transition-colors"
              >
                <MessageSquare size={12} className="text-[#25D366]" />
                {formatPhoneDisplay(lead.mobile)}
              </a>
            </div>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1 text-xs lg:text-sm text-gray-500 hover:text-[#8B4513] transition-colors"
            >
              <Mail size={12} />
              <span className="truncate max-w-[150px]">{lead.email}</span>
            </a>
          )}
        </div>
      </td>

      {/* Source */}
      <td className="p-3 lg:p-4 hidden lg:table-cell">
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {getLeadSourceLabel(lead.source)}
        </span>
      </td>

      {/* Status */}
      <td className="p-3 lg:p-4">
        <Badge variant={getLeadStatusVariant(lead.status)} className="text-xs">
          {getLeadStatusLabel(lead.status)}
        </Badge>
      </td>

      {/* Date */}
      <td className="p-3 lg:p-4 text-xs lg:text-sm text-gray-500 hidden xl:table-cell">
        {formatRelativeTime(lead.createdAt)}
      </td>

      {/* Actions */}
      <td className="p-3 lg:p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {lead.mobile && (
            <a
              href={getWhatsAppLink(lead.mobile)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 lg:p-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
              title="Enviar WhatsApp"
            >
              <MessageSquare size={14} />
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(lead)}
            title="Ver detalles"
            className="h-8 w-8"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(lead)}
            title="Editar"
            className="h-8 w-8"
          >
            <Edit size={14} />
          </Button>
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(lead)}
              title="Eliminar"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
