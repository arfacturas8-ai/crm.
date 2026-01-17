'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Tag,
  Clock,
  FileText,
  Send,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
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
  onClose?: () => void;
}

type TabType = 'info' | 'whatsapp' | 'email' | 'activity' | 'notes';

export function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [newNote, setNewNote] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { data, loading, refetch } = useQuery(GET_LEAD, {
    variables: { id: lead.id },
  });

  const fullLead: Lead = data?.lead || lead;
  const notes = (fullLead as any)?.notes || [];
  const activities = (fullLead as any)?.activities || [];
  const deals = (fullLead as any)?.deals || [];

  // WhatsApp templates
  const whatsappTemplates = [
    { label: 'Saludo inicial', message: `Hola ${fullLead.name}, gracias por contactarnos. ¿En qué podemos ayudarle?` },
    { label: 'Seguimiento', message: `Hola ${fullLead.name}, ¿tuvo oportunidad de revisar las propiedades que le enviamos?` },
    { label: 'Agendar visita', message: `Hola ${fullLead.name}, ¿le gustaría agendar una visita para conocer la propiedad?` },
    { label: 'Enviar información', message: `Hola ${fullLead.name}, le comparto información adicional sobre la propiedad de su interés.` },
  ];

  // Email templates
  const emailTemplates = [
    {
      label: 'Bienvenida',
      subject: 'Bienvenido a HabitaCR',
      body: `Estimado/a ${fullLead.name},\n\nGracias por contactarnos. Estamos encantados de poder ayudarle a encontrar la propiedad ideal.\n\nQuedamos a su disposición.\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
    {
      label: 'Propiedades disponibles',
      subject: 'Propiedades que coinciden con su búsqueda',
      body: `Estimado/a ${fullLead.name},\n\nHemos seleccionado las siguientes propiedades que podrían ser de su interés:\n\n[Lista de propiedades]\n\n¿Le gustaría agendar una visita?\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
    {
      label: 'Seguimiento',
      subject: 'Seguimiento - HabitaCR',
      body: `Estimado/a ${fullLead.name},\n\nEsperamos que se encuentre bien. Queríamos hacer seguimiento respecto a su búsqueda de propiedad.\n\n¿Hay algo en lo que podamos ayudarle?\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
  ];

  const handleSendWhatsApp = () => {
    if (fullLead.mobile && whatsappMessage) {
      window.open(getWhatsAppLink(fullLead.mobile, whatsappMessage), '_blank');
      setWhatsappMessage('');
    }
  };

  const handleSendEmail = async () => {
    if (!fullLead.email || !emailSubject || !emailBody) return;

    setSendingEmail(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: fullLead.email,
          subject: emailSubject,
          body: emailBody,
          leadId: fullLead.id,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setEmailSubject('');
        setEmailBody('');
        setTimeout(() => setEmailSent(false), 3000);
        refetch();
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: User },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: MessageSquare, disabled: !fullLead.mobile },
    { id: 'email' as TabType, label: 'Correo', icon: Mail, disabled: !fullLead.email },
    { id: 'activity' as TabType, label: 'Actividad', icon: Clock },
    { id: 'notes' as TabType, label: 'Notas', icon: FileText, count: notes.length },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-[#e0ccb0] dark:border-[#3D2314]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#8B4513] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {fullLead.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">{fullLead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getLeadStatusVariant(fullLead.status)}>
                {fullLead.status === 'new' ? 'Nuevo'
                  : fullLead.status === 'contacted' ? 'Contactado'
                  : fullLead.status === 'qualified' ? 'Calificado'
                  : fullLead.status === 'converted' ? 'Convertido'
                  : 'Perdido'}
              </Badge>
              <span className="text-sm text-[#8B4513]">
                {LEAD_SOURCE_LABELS[fullLead.source as LeadSource] || fullLead.source}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-[#f0e6d8] rounded-lg transition-colors">
            <X size={20} className="text-black dark:text-white" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-4 border-b border-[#e0ccb0] dark:border-[#3D2314] bg-[#faf5f0] dark:bg-[#111]">
        {fullLead.mobile && (
          <>
            <a href={getWhatsAppLink(fullLead.mobile)} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                <MessageSquare size={16} className="mr-2" />
                WhatsApp
              </Button>
            </a>
            <a href={`tel:${fullLead.mobile}`}>
              <Button size="sm" variant="outline" className="border-[#8B4513] text-[#8B4513]">
                <Phone size={16} className="mr-2" />
                Llamar
              </Button>
            </a>
          </>
        )}
        {fullLead.email && (
          <a href={`mailto:${fullLead.email}`}>
            <Button size="sm" variant="outline" className="border-[#8B4513] text-[#8B4513]">
              <Mail size={16} className="mr-2" />
              Email
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0ccb0] dark:border-[#3D2314] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#8B4513] text-[#8B4513]'
                : tab.disabled
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-[#8B4513] hover:border-[#cca87a]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-[#8B4513] text-white text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Contacto
                </h3>
                <div className="space-y-3">
                  {fullLead.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-[#8B4513]" />
                      <span className="text-black dark:text-white">{formatPhoneDisplay(fullLead.mobile)}</span>
                    </div>
                  )}
                  {fullLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-[#8B4513]" />
                      <span className="text-black dark:text-white">{fullLead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#8B4513]" />
                    <span className="text-black dark:text-white">{formatDate(fullLead.createdAt)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Propiedad de Interés
                </h3>
                {fullLead.propertyTitle ? (
                  <div>
                    <p className="font-medium text-black dark:text-white">{fullLead.propertyTitle}</p>
                    <Button size="sm" variant="outline" className="mt-3 border-[#8B4513] text-[#8B4513]">
                      Ver propiedad
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay propiedad asociada</p>
                )}
              </Card>
            </div>

            {fullLead.message && (
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-3 uppercase tracking-wide">
                  Mensaje del Lead
                </h3>
                <p className="text-black dark:text-white whitespace-pre-wrap">{fullLead.message}</p>
              </Card>
            )}

            {deals.length > 0 && (
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Deals ({deals.length})
                </h3>
                <div className="space-y-2">
                  {deals.map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 bg-[#faf5f0] dark:bg-[#111] rounded-lg">
                      <div>
                        <p className="font-medium text-black dark:text-white capitalize">{deal.busca}</p>
                        <p className="text-sm text-gray-500">{deal.propiedad}</p>
                      </div>
                      <Badge variant={deal.group === 'won' ? 'won' : deal.group === 'lost' ? 'lost' : 'active'}>
                        {deal.group === 'active' ? 'Seguimiento' : deal.group === 'won' ? 'Potencial' : 'Descartado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && fullLead.mobile && (
          <div className="space-y-6">
            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Plantillas Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {whatsappTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => setWhatsappMessage(template.message)}
                    className="text-left p-3 border border-[#e0ccb0] rounded-lg hover:bg-[#faf5f0] transition-colors"
                  >
                    <span className="text-sm font-medium text-[#8B4513]">{template.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Enviar Mensaje
              </h3>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={4}
                className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  Se abrirá WhatsApp con el mensaje
                </span>
                <Button
                  onClick={handleSendWhatsApp}
                  disabled={!whatsappMessage}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  <Send size={16} className="mr-2" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && fullLead.email && (
          <div className="space-y-6">
            {emailSent && (
              <div className="flex items-center gap-2 p-4 bg-[#f0e6d8] border border-[#8B4513] rounded-lg">
                <CheckCircle size={20} className="text-[#8B4513]" />
                <span className="text-[#5c2d0d]">Correo enviado exitosamente</span>
              </div>
            )}

            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Plantillas de Correo
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {emailTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setEmailSubject(template.subject);
                      setEmailBody(template.body);
                    }}
                    className="text-left p-3 border border-[#e0ccb0] rounded-lg hover:bg-[#faf5f0] transition-colors"
                  >
                    <span className="text-sm font-medium text-[#8B4513]">{template.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Componer Correo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Para</label>
                  <input
                    type="text"
                    value={fullLead.email}
                    disabled
                    className="w-full p-3 border border-[#e0ccb0] rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Asunto del correo"
                    className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    rows={8}
                    className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendEmail}
                    disabled={!emailSubject || !emailBody || sendingEmail}
                    className="bg-[#8B4513] hover:bg-[#6b350f] text-white"
                    isLoading={sendingEmail}
                  >
                    <Send size={16} className="mr-2" />
                    Enviar Correo
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card className="p-4 border-[#e0ccb0]">
            <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
              Historial de Actividad
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity: any, idx: number) => (
                  <div key={activity.id || idx} className="flex gap-4 pb-4 border-b border-[#e0ccb0] last:border-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'whatsapp' ? 'bg-[#25D366]/10' :
                      activity.type === 'email' ? 'bg-[#8B4513]/10' :
                      activity.type === 'call' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'whatsapp' ? (
                        <MessageSquare size={18} className="text-[#25D366]" />
                      ) : activity.type === 'email' ? (
                        <Mail size={18} className="text-[#8B4513]" />
                      ) : activity.type === 'call' ? (
                        <Phone size={18} className="text-blue-600" />
                      ) : (
                        <FileText size={18} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-black dark:text-white">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.userName} • {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay actividad registrada</p>
              </div>
            )}
          </Card>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Agregar Nota
              </h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota..."
                rows={3}
                className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button
                  disabled={!newNote}
                  className="bg-[#8B4513] hover:bg-[#6b350f] text-white"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Nota
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Notas ({notes.length})
              </h3>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note: any, idx: number) => (
                    <div key={note.id || idx} className="p-4 bg-[#faf5f0] dark:bg-[#111] rounded-lg">
                      <p className="text-black dark:text-white whitespace-pre-wrap">{note.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {note.userName} • {formatRelativeTime(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay notas</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
