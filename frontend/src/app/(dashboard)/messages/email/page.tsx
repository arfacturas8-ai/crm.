'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Mail, Send, Search, Copy, Paperclip } from 'lucide-react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import { emailService, EMAIL_TEMPLATES } from '@/lib/email';
import type { Lead } from '@/types';

export default function EmailPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);

  const { addNotification } = useUIStore();

  // Fetch leads with emails
  const { data, loading } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  const leads = (data?.leads?.nodes || []).filter((lead: Lead) => lead.email);

  // Filter leads by search
  const filteredLeads = leads.filter((lead: Lead) =>
    !search ||
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Template options
  const templateOptions = [
    { value: '', label: 'Seleccionar plantilla...' },
    ...Object.values(EMAIL_TEMPLATES).map((t) => ({
      value: t.id,
      label: t.name,
    })),
  ];

  // Apply template
  const applyTemplate = (templateId: string) => {
    const leadName = selectedLead?.name || '[nombre]';

    switch (templateId) {
      case 'welcome':
        setSubject('¡Bienvenido! Gracias por contactarnos');
        setMessage(`¡Hola ${leadName}!

Gracias por contactarnos. Hemos recibido tu información y un asesor se comunicará contigo pronto para ayudarte con tu búsqueda de propiedades.

Si tienes alguna pregunta, no dudes en responder a este correo.

Saludos cordiales,
Equipo de Ventas`);
        break;
      case 'followUp':
        setSubject('Seguimiento - ¿Cómo podemos ayudarte?');
        setMessage(`¡Hola ${leadName}!

Te escribimos para dar seguimiento a tu interés en nuestras propiedades.

¿Te gustaría agendar una cita para visitar alguna propiedad? Estamos aquí para ayudarte.

Quedamos a tus órdenes.

Saludos,
Equipo de Ventas`);
        break;
      case 'visitReminder':
        setSubject('Recordatorio: Visita programada');
        setMessage(`¡Hola ${leadName}!

Te recordamos tu cita de visita programada:

📅 Fecha: [fecha]
🕐 Hora: [hora]
📍 Dirección: [dirección]

Si necesitas reprogramar, por favor contáctanos con anticipación.

¡Te esperamos!

Saludos,
Equipo de Ventas`);
        break;
      case 'propertyInfo':
        setSubject('Información de propiedad');
        setMessage(`¡Hola ${leadName}!

Te compartimos información sobre la propiedad que te interesa:

[Nombre de la propiedad]

[Descripción y detalles de la propiedad]

¿Te gustaría agendar una visita? Responde a este correo o contáctanos.

Saludos,
Equipo de Ventas`);
        break;
      default:
        setSubject('');
        setMessage('');
    }

    setSelectedTemplate(templateId);
  };

  // Send email
  const sendEmail = async () => {
    if (!selectedLead?.email || !subject || !message) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Completa todos los campos requeridos',
      });
      return;
    }

    setSending(true);

    try {
      const result = await emailService.send({
        to: selectedLead.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message,
      });

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Correo enviado',
          message: `El correo fue enviado a ${selectedLead.email}`,
        });
        setMessage('');
        setSubject('');
        setSelectedTemplate('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error al enviar',
        message: error instanceof Error ? error.message : 'No se pudo enviar el correo',
      });
    } finally {
      setSending(false);
    }
  };

  // Open default mail client
  const openMailClient = () => {
    if (!selectedLead?.email) return;

    const mailtoLink = `mailto:${selectedLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoLink;
  };

  // Copy message to clipboard
  const copyMessage = () => {
    const fullMessage = `Asunto: ${subject}\n\n${message}`;
    navigator.clipboard.writeText(fullMessage);
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
        <h1 className="text-2xl font-bold">Correos</h1>
        <p className="text-muted-foreground">
          Envía correos electrónicos a tus leads
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
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {lead.email}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay leads con email</p>
              </div>
            )}
          </div>
        </Card>

        {/* Email Composer */}
        <Card className="lg:col-span-2">
          {selectedLead ? (
            <div className="h-full flex flex-col">
              {/* Selected lead header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">
                      {selectedLead.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedLead.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail size={14} />
                      {selectedLead.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email composer */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Template selector */}
                <Select
                  label="Plantilla de correo"
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                />

                {/* Subject */}
                <Input
                  label="Asunto"
                  placeholder="Escribe el asunto del correo..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                {/* Message */}
                <Textarea
                  label="Mensaje"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="p-4 border-t flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    leftIcon={<Copy size={16} />}
                    onClick={copyMessage}
                    disabled={!message || !subject}
                  >
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<Mail size={16} />}
                    onClick={openMailClient}
                    disabled={!message || !subject}
                  >
                    Abrir cliente de correo
                  </Button>
                </div>

                <Button
                  leftIcon={<Send size={16} />}
                  onClick={sendEmail}
                  disabled={!message || !subject}
                  isLoading={sending}
                >
                  Enviar correo
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecciona un lead</h3>
                <p className="text-muted-foreground">
                  Elige un lead de la lista para enviarle un correo electrónico
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
          {Object.values(EMAIL_TEMPLATES).map((template) => (
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
                <Mail size={16} className="text-primary" />
                <span className="font-medium">{template.name}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.subject}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
