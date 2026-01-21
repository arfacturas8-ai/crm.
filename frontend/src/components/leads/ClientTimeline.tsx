'use client';

import {
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Home,
  DollarSign,
  Calendar,
  UserPlus,
  Edit,
  Eye,
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface TimelineEvent {
  id: string;
  type: 'created' | 'whatsapp' | 'email' | 'call' | 'note' | 'deal' | 'visit' | 'status_change' | 'property_linked';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  userName?: string;
}

interface ClientTimelineProps {
  leadId: string;
  events: TimelineEvent[];
  loading?: boolean;
}

const EVENT_ICONS: Record<string, any> = {
  created: UserPlus,
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  note: FileText,
  deal: DollarSign,
  visit: Eye,
  status_change: Edit,
  property_linked: Home,
};

const EVENT_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-600',
  whatsapp: 'bg-green-100 text-green-600',
  email: 'bg-amber-100 text-amber-600',
  call: 'bg-cyan-100 text-cyan-600',
  note: 'bg-gray-100 text-gray-600',
  deal: 'bg-purple-100 text-purple-600',
  visit: 'bg-pink-100 text-pink-600',
  status_change: 'bg-orange-100 text-orange-600',
  property_linked: 'bg-indigo-100 text-indigo-600',
};

export function ClientTimeline({ leadId, events, loading }: ClientTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No hay eventos en la linea de tiempo</p>
        <p className="text-sm text-gray-400 mt-1">
          Las interacciones con el cliente apareceran aqui
        </p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, TimelineEvent[]> = {};
  events.forEach((event) => {
    const date = new Date(event.createdAt).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedEvents[date]) {
      groupedEvents[date] = [];
    }
    groupedEvents[date].push(event);
  });

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([date, dayEvents]) => (
        <div key={date}>
          {/* Date header */}
          <div className="sticky top-0 bg-white z-10 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#faf5f0] rounded-full text-sm text-[#8B4513] font-medium">
              <Calendar size={14} />
              {date}
            </div>
          </div>

          {/* Events for this date */}
          <div className="ml-4 border-l-2 border-[#e0ccb0] pl-6 space-y-6 mt-4">
            {dayEvents.map((event, idx) => {
              const Icon = EVENT_ICONS[event.type] || FileText;
              const colorClass = EVENT_COLORS[event.type] || 'bg-gray-100 text-gray-600';

              return (
                <div key={event.id || idx} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[33px] w-4 h-4 rounded-full border-2 border-white ${colorClass.split(' ')[0]}`}
                  />

                  {/* Event card */}
                  <div className="bg-white border border-[#e0ccb0] rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(event.createdAt).toLocaleTimeString('es-CR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        {event.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {event.metadata.dealTitle && (
                              <Badge variant="secondary" className="text-xs">
                                Deal: {event.metadata.dealTitle}
                              </Badge>
                            )}
                            {event.metadata.propertyTitle && (
                              <Badge variant="secondary" className="text-xs">
                                Propiedad: {event.metadata.propertyTitle}
                              </Badge>
                            )}
                            {event.metadata.oldStatus && event.metadata.newStatus && (
                              <Badge variant="secondary" className="text-xs">
                                {event.metadata.oldStatus} → {event.metadata.newStatus}
                              </Badge>
                            )}
                          </div>
                        )}
                        {event.userName && (
                          <p className="text-xs text-gray-400 mt-2">por {event.userName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to generate timeline events from lead data
export function generateTimelineEvents(lead: any, deals: any[] = [], activities: any[] = []): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Lead creation event
  events.push({
    id: `created-${lead.id}`,
    type: 'created',
    title: 'Lead creado',
    description: `${lead.name} fue agregado como lead desde ${lead.source || 'origen desconocido'}`,
    createdAt: lead.createdAt,
  });

  // Add activities
  activities.forEach((activity: any) => {
    events.push({
      id: activity.id,
      type: activity.type,
      title: getActivityTitle(activity.type),
      description: activity.description,
      userName: activity.userName,
      createdAt: activity.createdAt,
    });
  });

  // Add deals
  deals.forEach((deal: any) => {
    events.push({
      id: `deal-${deal.id}`,
      type: 'deal',
      title: 'Deal creado',
      description: deal.title,
      metadata: { dealTitle: deal.title },
      createdAt: deal.createdAt,
    });
  });

  // Sort by date descending
  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function getActivityTitle(type: string): string {
  const titles: Record<string, string> = {
    whatsapp: 'Mensaje de WhatsApp enviado',
    email: 'Correo enviado',
    call: 'Llamada realizada',
    note: 'Nota agregada',
    visit: 'Visita programada',
    status_change: 'Estado actualizado',
  };
  return titles[type] || 'Actividad registrada';
}
