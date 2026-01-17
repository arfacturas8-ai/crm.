'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Clock,
  CheckCheck,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/store/ui-store';
import { cn, formatPhoneDisplay, formatRelativeTime } from '@/lib/utils';
import { getWhatsAppWebLink, MESSAGE_TEMPLATES } from '@/lib/whatsapp';
import type { Lead } from '@/types';

export default function WhatsAppPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { addNotification } = useUIStore();

  // Fetch leads with phone numbers
  const { data, loading } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  const leads = (data?.leads?.nodes || []).filter((lead: Lead) => lead.mobile);

  // Filter leads by search
  const filteredLeads = leads.filter((lead: Lead) =>
    !search ||
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.mobile?.includes(search)
  );

  // Template options
  const templateOptions = [
    { value: '', label: 'Seleccionar plantilla...' },
    ...Object.values(MESSAGE_TEMPLATES).map((t) => ({
      value: t.id,
      label: t.name,
    })),
  ];

  // Apply template
  const applyTemplate = (templateId: string) => {
    const leadName = selectedLead?.name || '[nombre]';

    switch (templateId) {
      case 'welcome':
        setMessage(`¡Hola ${leadName}! 👋

Gracias por contactarnos. Un asesor se comunicará contigo pronto para ayudarte con tu búsqueda de propiedades.

Si tienes alguna pregunta, no dudes en escribirnos.

Saludos cordiales,
Equipo de Ventas`);
        break;
      case 'followUp':
        setMessage(`¡Hola ${leadName}!

Te escribimos para dar seguimiento a tu interés en nuestras propiedades.

¿Te gustaría agendar una cita para visitar alguna propiedad?

Quedamos a tus órdenes.`);
        break;
      case 'visitReminder':
        setMessage(`¡Hola ${leadName}!

Te recordamos tu cita de visita programada:

📅 Fecha: [fecha]
📍 Dirección: [dirección]

¿Confirmas tu asistencia?

Responde SÍ para confirmar o escríbenos si necesitas reprogramar.`);
        break;
      case 'propertyInfo':
        setMessage(`¡Hola ${leadName}!

Te compartimos información sobre la propiedad:

[información de la propiedad]

¿Te gustaría agendar una visita?`);
        break;
      default:
        setMessage('');
    }

    setSelectedTemplate(templateId);
  };

  // Open WhatsApp
  const openWhatsApp = () => {
    if (!selectedLead?.mobile) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Selecciona un lead con número de teléfono',
      });
      return;
    }

    const link = getWhatsAppWebLink(selectedLead.mobile, message);
    window.open(link, '_blank');

    addNotification({
      type: 'success',
      title: 'WhatsApp abierto',
      message: `Mensaje preparado para ${selectedLead.name}`,
    });
  };

  // Copy message to clipboard
  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    addNotification({
      type: 'success',
      title: 'Copiado',
      message: 'Mensaje copiado al portapapeles',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Envía mensajes de WhatsApp a tus leads
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b">
            <Input
              placeholder="Buscar leads..."
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="h-[calc(100vh-350px)] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLeads.length > 0 ? (
              filteredLeads.map((lead: Lead) => (
                <button
                  key={lead.id}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b',
                    selectedLead?.id === lead.id && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="w-10 h-10 bg-whatsapp/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-whatsapp" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneDisplay(lead.mobile)}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay leads con teléfono</p>
              </div>
            )}
          </div>
        </Card>

        {/* Message Composer */}
        <Card className="lg:col-span-2">
          {selectedLead ? (
            <div className="h-full flex flex-col">
              {/* Selected lead header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-whatsapp/10 rounded-full flex items-center justify-center">
                    <span className="text-whatsapp font-medium text-lg">
                      {selectedLead.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedLead.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone size={14} />
                      {formatPhoneDisplay(selectedLead.mobile)}
                    </p>
                  </div>
                </div>

                <a
                  href={getWhatsAppWebLink(selectedLead.mobile)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink size={14} />}>
                    Abrir chat
                  </Button>
                </a>
              </div>

              {/* Message composer */}
              <div className="flex-1 p-4 space-y-4">
                {/* Template selector */}
                <Select
                  label="Plantilla de mensaje"
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                />

                {/* Message input */}
                <Textarea
                  label="Mensaje"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  className="resize-none"
                />

                {/* Character count */}
                <p className="text-sm text-muted-foreground text-right">
                  {message.length} caracteres
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 border-t flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  leftIcon={<Copy size={16} />}
                  onClick={copyMessage}
                  disabled={!message}
                >
                  Copiar
                </Button>

                <Button
                  variant="whatsapp"
                  leftIcon={<Send size={16} />}
                  onClick={openWhatsApp}
                  disabled={!message}
                >
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecciona un lead</h3>
                <p className="text-muted-foreground">
                  Elige un lead de la lista para enviarle un mensaje por WhatsApp
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Plantillas rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(MESSAGE_TEMPLATES).map((template) => (
            <button
              key={template.id}
              className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              onClick={() => {
                if (selectedLead) {
                  applyTemplate(template.id);
                } else {
                  addNotification({
                    type: 'warning',
                    title: 'Selecciona un lead',
                    message: 'Primero selecciona un lead para aplicar la plantilla',
                  });
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-whatsapp" />
                <span className="font-medium">{template.name}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.preview}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
