'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
  Send,
  Plus,
  X,
  CheckCircle,
  Printer,
  Heart,
  History,
  DollarSign,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { GET_LEAD, UPDATE_LEAD } from '@/graphql/queries/leads';
import { GET_DEALS } from '@/graphql/queries/deals';
import { Badge, getLeadStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  formatDate,
  formatRelativeTime,
  getWhatsAppLink,
  formatPhoneDisplay,
  formatCurrency,
} from '@/lib/utils';
import { LEAD_SOURCE_LABELS, type Lead, type LeadSource } from '@/types';
import { PropertySelector } from '@/components/ui/PropertySelector';
import { ClientPreferences } from './ClientPreferences';
import { ClientTimeline, generateTimelineEvents } from './ClientTimeline';

interface LeadDetailProps {
  lead: Lead;
  onClose?: () => void;
}

type TabType = 'info' | 'preferences' | 'timeline' | 'whatsapp' | 'email' | 'notes';

export function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [newNote, setNewNote] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [savingProperty, setSavingProperty] = useState(false);

  const { data, loading, refetch } = useQuery(GET_LEAD, {
    variables: { id: lead.id },
  });

  // Fetch deals for this lead
  const { data: dealsData } = useQuery(GET_DEALS, {
    variables: { first: 100 },
  });

  const [updateLead] = useMutation(UPDATE_LEAD, {
    refetchQueries: ['GetLeads', 'GetLead', 'GetDashboardStats'],
  });

  const fullLead: Lead = data?.lead || lead;
  const notes = (fullLead as any)?.notes || [];
  const activities = (fullLead as any)?.activities || [];

  // Filter deals for this lead
  const leadDeals = useMemo(() => {
    const allDeals = dealsData?.deals?.nodes || [];
    return allDeals.filter((deal: any) => deal.leadId === parseInt(lead.id));
  }, [dealsData, lead.id]);

  // Parse preferences from JSON
  const preferences = useMemo(() => {
    try {
      const prefsString = (fullLead as any)?.preferences;
      return prefsString ? JSON.parse(prefsString) : null;
    } catch {
      return null;
    }
  }, [fullLead]);

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    return generateTimelineEvents(fullLead, leadDeals, activities);
  }, [fullLead, leadDeals, activities]);

  // Calculate client stats
  const clientStats = useMemo(() => {
    const totalValue = leadDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    const wonDeals = leadDeals.filter((deal: any) => deal.stage === 'won' || deal.stage === 'closed_won');
    const wonValue = wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    return {
      totalDeals: leadDeals.length,
      totalValue,
      wonDeals: wonDeals.length,
      wonValue,
    };
  }, [leadDeals]);

  // WhatsApp templates
  const whatsappTemplates = [
    { label: 'Saludo inicial', message: `Hola ${fullLead.name}, gracias por contactarnos. ¿En que podemos ayudarle?` },
    { label: 'Seguimiento', message: `Hola ${fullLead.name}, ¿tuvo oportunidad de revisar las propiedades que le enviamos?` },
    { label: 'Agendar visita', message: `Hola ${fullLead.name}, ¿le gustaria agendar una visita para conocer la propiedad?` },
    { label: 'Enviar informacion', message: `Hola ${fullLead.name}, le comparto informacion adicional sobre la propiedad de su interes.` },
  ];

  // Email templates
  const emailTemplates = [
    {
      label: 'Bienvenida',
      subject: 'Bienvenido a HabitaCR',
      body: `Estimado/a ${fullLead.name},\n\nGracias por contactarnos. Estamos encantados de poder ayudarle a encontrar la propiedad ideal.\n\nQuedamos a su disposicion.\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
    {
      label: 'Propiedades disponibles',
      subject: 'Propiedades que coinciden con su busqueda',
      body: `Estimado/a ${fullLead.name},\n\nHemos seleccionado las siguientes propiedades que podrian ser de su interes:\n\n[Lista de propiedades]\n\n¿Le gustaria agendar una visita?\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
    {
      label: 'Seguimiento',
      subject: 'Seguimiento - HabitaCR',
      body: `Estimado/a ${fullLead.name},\n\nEsperamos que se encuentre bien. Queriamos hacer seguimiento respecto a su busqueda de propiedad.\n\n¿Hay algo en lo que podamos ayudarle?\n\nSaludos cordiales,\nEquipo HabitaCR`
    },
  ];

  const handleSendWhatsApp = () => {
    if (fullLead.mobile && whatsappMessage) {
      window.open(getWhatsAppLink(fullLead.mobile, whatsappMessage), '_blank');
      setWhatsappMessage('');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cliente 360 - ${fullLead.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #8B4513; padding-bottom: 20px; }
          .logo { height: 60px; margin-right: 20px; }
          .title { color: #8B4513; font-size: 24px; font-weight: bold; }
          .subtitle { color: #666; font-size: 14px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat { padding: 15px; border: 1px solid #e0ccb0; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #8B4513; }
          .stat-label { font-size: 12px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .info-card { padding: 15px; border: 1px solid #e0ccb0; border-radius: 8px; }
          .info-label { color: #8B4513; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
          .footer { margin-top: 40px; text-align: center; color: #8B4513; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/habita-logo.jpg" class="logo" alt="HabitaCR" onerror="this.style.display='none'" />
          <div>
            <div class="title">HabitaCR - Vista 360° del Cliente</div>
            <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: #8B4513; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px; font-weight: bold;">${fullLead.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #333;">${fullLead.name}</h2>
            <p style="margin: 5px 0 0 0; color: #666;">${fullLead.email || ''} | ${fullLead.mobile || ''}</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">${clientStats.totalDeals}</div>
            <div class="stat-label">Deals Totales</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${clientStats.totalValue.toLocaleString()}</div>
            <div class="stat-label">Valor Total</div>
          </div>
          <div class="stat">
            <div class="stat-value">${clientStats.wonDeals}</div>
            <div class="stat-label">Deals Ganados</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${clientStats.wonValue.toLocaleString()}</div>
            <div class="stat-label">Valor Ganado</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Informacion de Contacto</div>
            ${fullLead.mobile ? `<p>Tel: ${fullLead.mobile}</p>` : ''}
            ${fullLead.email ? `<p>Email: ${fullLead.email}</p>` : ''}
            <p>Origen: ${LEAD_SOURCE_LABELS[fullLead.source as LeadSource] || fullLead.source}</p>
            <p>Fecha: ${formatDate(fullLead.createdAt)}</p>
          </div>
          ${preferences ? `
          <div class="info-card">
            <div class="info-label">Preferencias</div>
            ${preferences.propertyType ? `<p>Tipo: ${preferences.propertyType}</p>` : ''}
            ${preferences.transactionType ? `<p>Busca: ${preferences.transactionType === 'buy' ? 'Comprar' : 'Alquilar'}</p>` : ''}
            ${preferences.minBudget || preferences.maxBudget ? `<p>Presupuesto: $${preferences.minBudget?.toLocaleString() || '0'} - $${preferences.maxBudget?.toLocaleString() || 'N/A'}</p>` : ''}
            ${preferences.locations?.length ? `<p>Ubicaciones: ${preferences.locations.join(', ')}</p>` : ''}
          </div>
          ` : ''}
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
    { id: 'info' as TabType, label: 'Resumen', icon: User },
    { id: 'preferences' as TabType, label: 'Preferencias', icon: Heart },
    { id: 'timeline' as TabType, label: 'Timeline', icon: History },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: MessageSquare, disabled: !fullLead.mobile },
    { id: 'email' as TabType, label: 'Correo', icon: Mail, disabled: !fullLead.email },
    { id: 'notes' as TabType, label: 'Notas', icon: FileText, count: notes.length },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with client stats */}
      <div className="border-b border-[#e0ccb0]">
        <div className="flex items-start justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#8B4513] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {fullLead.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black">{fullLead.name}</h2>
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
              <X size={20} className="text-black" />
            </button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 px-6 pb-4">
          <div className="bg-[#faf5f0] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[#8B4513]">{clientStats.totalDeals}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
          <div className="bg-[#faf5f0] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[#8B4513]">{formatCurrency(clientStats.totalValue)}</div>
            <div className="text-xs text-gray-500">Valor Total</div>
          </div>
          <div className="bg-[#faf5f0] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{clientStats.wonDeals}</div>
            <div className="text-xs text-gray-500">Ganados</div>
          </div>
          <div className="bg-[#faf5f0] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(clientStats.wonValue)}</div>
            <div className="text-xs text-gray-500">Valor Ganado</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-4 border-b border-[#e0ccb0] bg-[#faf5f0]">
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
        <Button size="sm" variant="outline" className="border-[#8B4513] text-[#8B4513]" onClick={handlePrint}>
          <Printer size={16} className="mr-2" />
          Imprimir 360°
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0ccb0] overflow-x-auto">
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
        {/* Info Tab - Client Summary */}
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
                      <span className="text-black">{formatPhoneDisplay(fullLead.mobile)}</span>
                    </div>
                  )}
                  {fullLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-[#8B4513]" />
                      <span className="text-black">{fullLead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#8B4513]" />
                    <span className="text-black">{formatDate(fullLead.createdAt)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Vincular Propiedad
                </h3>
                <PropertySelector
                  selectedProperty={selectedProperty}
                  onSelect={setSelectedProperty}
                />
                {selectedProperty && (
                  <Button
                    className="mt-4 w-full"
                    disabled={savingProperty}
                    onClick={async () => {
                      setSavingProperty(true);
                      try {
                        await updateLead({
                          variables: {
                            input: {
                              id: lead.id,
                              propertyId: parseInt(selectedProperty.databaseId, 10),
                            },
                          },
                        });
                        refetch();
                      } catch (err) {
                        console.error('Error saving property:', err);
                      }
                      setSavingProperty(false);
                    }}
                  >
                    {savingProperty ? 'Guardando...' : 'Guardar Propiedad'}
                  </Button>
                )}
              </Card>
            </div>

            {fullLead.message && (
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-3 uppercase tracking-wide">
                  Mensaje del Lead
                </h3>
                <p className="text-black whitespace-pre-wrap">{fullLead.message}</p>
              </Card>
            )}

            {/* Deals section */}
            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Deals ({leadDeals.length})
              </h3>
              {leadDeals.length > 0 ? (
                <div className="space-y-3">
                  {leadDeals.map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 bg-[#faf5f0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8B4513]/10 rounded-lg flex items-center justify-center">
                          <Building2 size={18} className="text-[#8B4513]" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{deal.title}</p>
                          {deal.value && (
                            <p className="text-sm text-[#8B4513] font-semibold">{formatCurrency(deal.value)}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={deal.stage === 'won' ? 'won' : deal.stage === 'lost' ? 'lost' : 'active'}>
                        {deal.stage}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay deals asociados</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card className="p-6 border-[#e0ccb0]">
            <h3 className="font-semibold text-sm text-[#8B4513] mb-6 uppercase tracking-wide">
              Preferencias del Cliente
            </h3>
            <ClientPreferences
              leadId={lead.id}
              preferences={preferences}
              onSave={() => refetch()}
            />
          </Card>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <Card className="p-6 border-[#e0ccb0]">
            <h3 className="font-semibold text-sm text-[#8B4513] mb-6 uppercase tracking-wide">
              Linea de Tiempo
            </h3>
            <ClientTimeline
              leadId={lead.id}
              events={timelineEvents}
              loading={loading}
            />
          </Card>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && fullLead.mobile && (
          <div className="space-y-6">
            <Card className="p-4 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Plantillas Rapidas
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
                  Se abrira WhatsApp con el mensaje
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
                    <div key={note.id || idx} className="p-4 bg-[#faf5f0] rounded-lg">
                      <p className="text-black whitespace-pre-wrap">{note.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {note.userName} - {formatRelativeTime(note.createdAt)}
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
