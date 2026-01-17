'use client';

import { useQuery } from '@apollo/client';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  Tag,
  Clock,
  FileText,
} from 'lucide-react';
import { GET_LEAD } from '@/graphql/queries/leads';
import { Badge, getLeadStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  formatDate,
  formatRelativeTime,
  getWhatsAppLink,
  formatPhoneDisplay,
} from '@/lib/utils';
import { LEAD_SOURCE_LABELS, type Lead, type LeadSource } from '@/types';

interface LeadDetailProps {
  lead: Lead;
}

export function LeadDetail({ lead }: LeadDetailProps) {
  // Fetch full lead details with notes and activities
  const { data, loading } = useQuery(GET_LEAD, {
    variables: { id: lead.id },
  });

  const fullLead = data?.lead || lead;
  const notes = fullLead?.notes || [];
  const activities = fullLead?.activities || [];
  const deals = fullLead?.deals || [];

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar & Basic Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-2xl">
              {fullLead.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullLead.name}</h2>
            <Badge variant={getLeadStatusVariant(fullLead.status)} className="mt-1">
              {fullLead.status === 'new'
                ? 'Nuevo'
                : fullLead.status === 'contacted'
                ? 'Contactado'
                : fullLead.status === 'qualified'
                ? 'Calificado'
                : fullLead.status === 'converted'
                ? 'Convertido'
                : 'Perdido'}
            </Badge>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {fullLead.mobile && (
            <>
              <a
                href={getWhatsAppLink(fullLead.mobile)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" leftIcon={<MessageSquare size={16} />}>
                  WhatsApp
                </Button>
              </a>
              <a href={`tel:${fullLead.mobile}`}>
                <Button variant="outline" leftIcon={<Phone size={16} />}>
                  Llamar
                </Button>
              </a>
            </>
          )}
          {fullLead.email && (
            <a href={`mailto:${fullLead.email}`}>
              <Button variant="outline" leftIcon={<Mail size={16} />}>
                Email
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Información de Contacto
          </h3>
          <div className="space-y-3">
            {fullLead.mobile && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                <span>{formatPhoneDisplay(fullLead.mobile)}</span>
              </div>
            )}
            {fullLead.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                <span>{fullLead.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-muted-foreground" />
              <span>
                {LEAD_SOURCE_LABELS[fullLead.source as LeadSource] || fullLead.source}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span>{formatDate(fullLead.createdAt)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Propiedad de Interés
          </h3>
          {fullLead.propertyTitle ? (
            <div className="space-y-2">
              <p className="font-medium">{fullLead.propertyTitle}</p>
              {fullLead.propertyId && (
                <Button variant="outline" size="sm">
                  Ver propiedad
                </Button>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay propiedad asociada
            </p>
          )}
        </Card>
      </div>

      {/* Message */}
      {fullLead.message && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Mensaje</h3>
          <p className="text-sm whitespace-pre-wrap">{fullLead.message}</p>
        </Card>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Deals ({deals.length})
          </h3>
          <div className="space-y-2">
            {deals.map((deal: any) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">{deal.busca}</p>
                  <p className="text-sm text-muted-foreground">{deal.propiedad}</p>
                </div>
                <Badge
                  variant={
                    deal.group === 'won'
                      ? 'won'
                      : deal.group === 'lost'
                      ? 'lost'
                      : 'active'
                  }
                >
                  {deal.group === 'active'
                    ? 'Seguimiento'
                    : deal.group === 'won'
                    ? 'Potencial'
                    : 'Descartado'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-3">
          Actividad Reciente
        </h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === 'whatsapp' ? (
                    <MessageSquare size={14} className="text-whatsapp" />
                  ) : activity.type === 'email' ? (
                    <Mail size={14} className="text-primary" />
                  ) : activity.type === 'call' ? (
                    <Phone size={14} className="text-primary" />
                  ) : (
                    <FileText size={14} className="text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.userName} • {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay actividad registrada
          </p>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-3">
          Notas ({notes.length})
        </h3>
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {note.userName} • {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay notas
          </p>
        )}
      </Card>
    </div>
  );
}
