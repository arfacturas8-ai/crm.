'use client';

import { useQuery } from '@apollo/client';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
} from 'lucide-react';
import { GET_DEAL } from '@/graphql/queries/deals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  formatDate,
  formatRelativeTime,
  getWhatsAppLink,
  formatPhoneDisplay,
} from '@/lib/utils';
import {
  DEAL_GROUP_LABELS,
  DEAL_BUSCA_LABELS,
  DEAL_ESTADO_LABELS,
  DEAL_CALIFICACION_LABELS,
  DEAL_PROXIMO_PASO_LABELS,
  type Deal,
} from '@/types';

interface DealDetailProps {
  deal: Deal;
}

export function DealDetail({ deal }: DealDetailProps) {
  // Fetch full deal details
  const { data, loading } = useQuery(GET_DEAL, {
    variables: { id: deal.id },
  });

  const fullDeal: Deal = data?.deal || deal;
  const lead = (fullDeal as any)?.lead;
  const notes = (fullDeal as any)?.notes || [];
  const activities = (fullDeal as any)?.activities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-2xl">
              {fullDeal.leadName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullDeal.leadName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  fullDeal.group === 'won'
                    ? 'won'
                    : fullDeal.group === 'lost'
                    ? 'lost'
                    : 'active'
                }
              >
                {DEAL_GROUP_LABELS[fullDeal.group]}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {DEAL_BUSCA_LABELS[fullDeal.busca] || fullDeal.busca}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {fullDeal.leadMobile && (
            <>
              <a
                href={getWhatsAppLink(fullDeal.leadMobile)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" leftIcon={<MessageSquare size={16} />}>
                  WhatsApp
                </Button>
              </a>
              <a href={`tel:${fullDeal.leadMobile}`}>
                <Button variant="outline" leftIcon={<Phone size={16} />}>
                  Llamar
                </Button>
              </a>
            </>
          )}
          {fullDeal.leadEmail && (
            <a href={`mailto:${fullDeal.leadEmail}`}>
              <Button variant="outline" leftIcon={<Mail size={16} />}>
                Email
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Información de Contacto
          </h3>
          <div className="space-y-3">
            {fullDeal.leadMobile && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                <span>{formatPhoneDisplay(fullDeal.leadMobile)}</span>
              </div>
            )}
            {fullDeal.leadEmail && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                <span>{fullDeal.leadEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span>Creado: {formatDate(fullDeal.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* Deal Status */}
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Estado del Deal
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-muted-foreground" />
              <span>{DEAL_ESTADO_LABELS[fullDeal.estado] || fullDeal.estado}</span>
            </div>
            {fullDeal.calificacion && (
              <div className="flex items-center gap-2">
                <Target size={16} className="text-muted-foreground" />
                <span>{DEAL_CALIFICACION_LABELS[fullDeal.calificacion]}</span>
              </div>
            )}
            {fullDeal.proximoPaso && (
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-muted-foreground" />
                <span>{DEAL_PROXIMO_PASO_LABELS[fullDeal.proximoPaso]}</span>
              </div>
            )}
            {fullDeal.seguimiento && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <span>
                  Seguimiento: {fullDeal.seguimiento === 'una' ? '1 vez' : fullDeal.seguimiento === 'dos' ? '2 veces' : '3 veces'}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Property */}
      {fullDeal.propiedad && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            Propiedad de Interés
          </h3>
          <p>{fullDeal.propiedad}</p>
        </Card>
      )}

      {/* Dates */}
      {(fullDeal.fecha1 || fullDeal.fecha2 || fullDeal.visitaConfirmada) && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fullDeal.fecha1 && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha 1</p>
                <p className="font-medium">{formatDate(fullDeal.fecha1)}</p>
              </div>
            )}
            {fullDeal.fecha2 && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha 2</p>
                <p className="font-medium">{formatDate(fullDeal.fecha2)}</p>
              </div>
            )}
            {fullDeal.visitaConfirmada && (
              <div>
                <p className="text-sm text-muted-foreground">Visita Confirmada</p>
                <p className="font-medium">{formatDate(fullDeal.visitaConfirmada)}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Details */}
      {fullDeal.detalles && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Detalles</h3>
          <p className="text-sm whitespace-pre-wrap">{fullDeal.detalles}</p>
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
                  ) : (
                    <Clock size={14} className="text-primary" />
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
