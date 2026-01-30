'use client';

import { MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import { Badge, getLeadStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getWhatsAppLink } from '@/lib/utils';
import { getLeadStatusLabel } from '@/lib/constants';
import type { Lead } from '@/types';

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  showDeleteButton?: boolean;
}

export function LeadCard({
  lead,
  onView,
  onEdit,
  onDelete,
  showDeleteButton = false,
}: LeadCardProps) {
  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[#8B4513] font-medium">
            {lead.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{lead.name}</p>
              <p className="text-sm text-gray-500 truncate">
                {lead.mobile || lead.email}
              </p>
            </div>
            <Badge variant={getLeadStatusVariant(lead.status)} className="text-xs flex-shrink-0">
              {getLeadStatusLabel(lead.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {lead.mobile && (
              <a
                href={getWhatsAppLink(lead.mobile)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
                aria-label="Enviar WhatsApp"
              >
                <MessageSquare size={14} />
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(lead)}
              className="h-8 w-8"
              aria-label="Ver detalles"
            >
              <Eye size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(lead)}
              className="h-8 w-8"
              aria-label="Editar"
            >
              <Edit size={14} />
            </Button>
            {showDeleteButton && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(lead)}
                className="h-8 w-8 text-red-600 hover:bg-red-50"
                aria-label="Eliminar"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
