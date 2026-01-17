'use client';

import { useState } from 'react';
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
  Printer,
  Home,
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
import { PropertySelector } from '@/components/ui/PropertySelector';

interface DealDetailProps {
  deal: Deal;
}

export function DealDetail({ deal }: DealDetailProps) {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Fetch full deal details
  const { data, loading } = useQuery(GET_DEAL, {
    variables: { id: deal.id },
  });

  const fullDeal: Deal = data?.deal || deal;
  const lead = (fullDeal as any)?.lead;
  const notes = (fullDeal as any)?.notes || [];
  const activities = (fullDeal as any)?.activities || [];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const propertyInfo = selectedProperty ? `
      <div style="margin-top: 20px; padding: 15px; border: 1px solid #e0ccb0; border-radius: 8px;">
        <h3 style="color: #8B4513; margin: 0 0 10px 0; font-size: 14px;">Propiedad Vinculada</h3>
        <p style="margin: 5px 0;"><strong>${selectedProperty.title}</strong></p>
        ${selectedProperty.propertyDetails?.propertyAddress ? `<p style="margin: 5px 0; color: #666;">${selectedProperty.propertyDetails.propertyAddress}</p>` : ''}
        ${selectedProperty.propertyDetails?.propertyPrice ? `<p style="margin: 5px 0; color: #8B4513; font-weight: bold;">$${selectedProperty.propertyDetails.propertyPrice.toLocaleString()}</p>` : ''}
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deal - ${fullDeal.leadName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #8B4513; padding-bottom: 20px; }
          .logo { height: 60px; margin-right: 20px; }
          .title { color: #8B4513; font-size: 24px; font-weight: bold; }
          .subtitle { color: #666; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .info-card { padding: 15px; border: 1px solid #e0ccb0; border-radius: 8px; }
          .info-label { color: #8B4513; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
          .info-item { margin: 8px 0; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #f0e6d8; color: #8B4513; }
          .badge-won { background: #d1fae5; color: #065f46; }
          .badge-lost { background: #fee2e2; color: #991b1b; }
          .badge-active { background: #e0f2fe; color: #0369a1; }
          .footer { margin-top: 40px; text-align: center; color: #8B4513; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/habita-logo.jpg" class="logo" alt="HabitaCR" onerror="this.style.display='none'" />
          <div>
            <div class="title">HabitaCR - Ficha de Deal</div>
            <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: #8B4513; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px; font-weight: bold;">${fullDeal.leadName?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #333;">${fullDeal.leadName}</h2>
            <span class="badge badge-${fullDeal.group}">${DEAL_GROUP_LABELS[fullDeal.group]}</span>
            <span class="badge" style="margin-left: 8px;">${DEAL_BUSCA_LABELS[fullDeal.busca] || fullDeal.busca}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Información de Contacto</div>
            ${fullDeal.leadMobile ? `<div class="info-item">📱 ${fullDeal.leadMobile}</div>` : ''}
            ${fullDeal.leadEmail ? `<div class="info-item">✉️ ${fullDeal.leadEmail}</div>` : ''}
            <div class="info-item">📅 ${formatDate(fullDeal.createdAt)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Estado del Deal</div>
            <div class="info-item">${DEAL_ESTADO_LABELS[fullDeal.estado] || fullDeal.estado}</div>
            ${fullDeal.calificacion ? `<div class="info-item">Calificación: ${DEAL_CALIFICACION_LABELS[fullDeal.calificacion]}</div>` : ''}
            ${fullDeal.proximoPaso ? `<div class="info-item">Próximo paso: ${DEAL_PROXIMO_PASO_LABELS[fullDeal.proximoPaso]}</div>` : ''}
          </div>
        </div>

        ${fullDeal.detalles ? `
          <div class="info-card" style="margin-top: 20px;">
            <div class="info-label">Detalles</div>
            <p style="margin: 0; white-space: pre-wrap;">${fullDeal.detalles}</p>
          </div>
        ` : ''}

        ${propertyInfo}

        <div class="footer">
          <p>HabitaCR - CRM Inmobiliario</p>
          <p>www.habitacr.com</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
          <Button variant="outline" leftIcon={<Printer size={16} />} onClick={handlePrint}>
            Imprimir
          </Button>
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

      {/* Property Selector */}
      <Card className="p-4 border-[#e0ccb0]">
        <h3 className="font-medium text-sm text-[#8B4513] mb-3 uppercase tracking-wide">
          Vincular Propiedad
        </h3>
        <PropertySelector
          selectedProperty={selectedProperty}
          onSelect={setSelectedProperty}
        />
        {fullDeal.propiedad && !selectedProperty && (
          <p className="text-sm text-gray-500 mt-2">Propiedad original: {fullDeal.propiedad}</p>
        )}
      </Card>

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
