'use client';

import { useQuery } from '@apollo/client';
import {
  Calendar,
  DollarSign,
  Tag,
  Printer,
  Clock,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { GET_DEAL } from '@/graphql/queries/deals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { type Deal } from '@/types';

interface DealDetailProps {
  deal: Deal;
}

const STAGE_LABELS: Record<string, string> = {
  active: 'Activo',
  won: 'Ganado',
  lost: 'Perdido',
};

export function DealDetail({ deal }: DealDetailProps) {
  // Fetch full deal details
  const { data, loading } = useQuery(GET_DEAL, {
    variables: { id: deal.id },
  });

  const fullDeal: Deal = data?.deal || deal;
  const notes = (fullDeal as any)?.notes || [];
  const activities = (fullDeal as any)?.activities || [];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deal - ${fullDeal.title}</title>
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
          .badge-active { background: #fef3c7; color: #92400e; }
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
            <span style="color: white; font-size: 24px; font-weight: bold;">${fullDeal.title?.charAt(0).toUpperCase() || 'D'}</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #333;">${fullDeal.title}</h2>
            <span class="badge badge-${fullDeal.stage}">${STAGE_LABELS[fullDeal.stage] || fullDeal.stage}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Información del Deal</div>
            <div class="info-item">Creado: ${formatDate(fullDeal.createdAt)}</div>
            ${fullDeal.value ? `<div class="info-item">Valor: ${formatCurrency(fullDeal.value)}</div>` : ''}
          </div>
          <div class="info-card">
            <div class="info-label">Estado</div>
            <div class="info-item">${STAGE_LABELS[fullDeal.stage] || fullDeal.stage}</div>
          </div>
        </div>

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
              {fullDeal.title?.charAt(0).toUpperCase() || 'D'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullDeal.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  fullDeal.stage === 'won'
                    ? 'won'
                    : fullDeal.stage === 'lost'
                    ? 'lost'
                    : 'active'
                }
              >
                {STAGE_LABELS[fullDeal.stage] || fullDeal.stage}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 md:ml-auto">
          <Button variant="outline" leftIcon={<Printer size={16} />} onClick={handlePrint}>
            Imprimir
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deal Info */}
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Información del Deal
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span>Creado: {formatDate(fullDeal.createdAt)}</span>
            </div>
            {fullDeal.value && (
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-muted-foreground" />
                <span>Valor: {formatCurrency(fullDeal.value)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-muted-foreground" />
              <span>Lead ID: {fullDeal.leadId}</span>
            </div>
          </div>
        </Card>

        {/* Stage */}
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Estado del Deal
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                fullDeal.stage === 'won'
                  ? 'won'
                  : fullDeal.stage === 'lost'
                  ? 'lost'
                  : 'active'
              }
              className="text-lg px-4 py-2"
            >
              {STAGE_LABELS[fullDeal.stage] || fullDeal.stage}
            </Badge>
          </div>
        </Card>
      </div>

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
                  {note.authorName} • {formatRelativeTime(note.createdAt)}
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
