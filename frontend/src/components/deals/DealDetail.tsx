'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Calendar,
  Tag,
  Printer,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  User,
  Edit3,
  X,
  Home,
  Plus,
  Building,
} from 'lucide-react';
import { GET_DEAL, UPDATE_DEAL } from '@/graphql/queries/deals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PropertySelector } from '@/components/ui/PropertySelector';
import { useUIStore } from '@/store/ui-store';
import { type Deal } from '@/types';

interface DealDetailProps {
  deal: Deal;
  onClose?: () => void;
}

type TabType = 'info' | 'property' | 'notes';

const STAGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  'visita-programada': 'Visita Programada',
  seguimiento: 'Seguimiento',
  reserva: 'Reserva',
  formalizado: 'Formalizado',
  descartado: 'Descartado',
  ganado: 'Ganado',
  // Legacy stages
  initial_contact: 'Contacto Inicial',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  closed_won: 'Ganado',
  closed_lost: 'Perdido',
  active: 'Activo',
  won: 'Ganado',
  lost: 'Perdido',
};

export function DealDetail({ deal, onClose }: DealDetailProps) {
  const { addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editEstado, setEditEstado] = useState(deal.estado || 'nuevo');
  const [editBusca, setEditBusca] = useState(deal.busca || '');
  const [editCalificacion, setEditCalificacion] = useState(deal.calificacion || '');
  const [editProximoPaso, setEditProximoPaso] = useState(deal.proximoPaso || '');
  const [editDetalles, setEditDetalles] = useState(deal.detalles || '');
  const [newNote, setNewNote] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [savingProperty, setSavingProperty] = useState(false);

  // Fetch full deal details
  const { data, loading, refetch } = useQuery(GET_DEAL, {
    variables: { id: deal.id },
  });

  const fullDeal: any = data?.deal || deal;

  // Notes from the deal (array of note objects)
  const notes = fullDeal?.notes || [];

  // Property is stored as text (propiedad field)
  const propertyText = fullDeal?.propiedad;

  // Lead info is directly in the deal
  const leadInfo = {
    name: fullDeal.leadName,
    email: fullDeal.leadEmail,
    mobile: fullDeal.leadMobile,
  };

  // Update deal mutation
  const [updateDeal, { loading: updateLoading }] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDeal', 'GetDealsByStage', 'GetDashboardStats'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Deal actualizado',
        message: 'El deal se ha actualizado correctamente',
      });
      setIsEditing(false);
      setSavingProperty(false);
      setSelectedProperty(null);
      refetch();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar el deal',
      });
      setSavingProperty(false);
    },
  });

  // Update edit form when deal changes
  useEffect(() => {
    setEditEstado(fullDeal.estado || 'nuevo');
    setEditBusca(fullDeal.busca || '');
    setEditCalificacion(fullDeal.calificacion || '');
    setEditProximoPaso(fullDeal.proximoPaso || '');
    setEditDetalles(fullDeal.detalles || '');
  }, [fullDeal]);

  const handleSaveEdit = () => {
    updateDeal({
      variables: {
        input: {
          id: deal.id,
          estado: editEstado,
          busca: editBusca || undefined,
          calificacion: editCalificacion || undefined,
          proximoPaso: editProximoPaso || undefined,
          detalles: editDetalles || undefined,
        },
      },
    });
  };

  const handleLinkProperty = () => {
    if (!selectedProperty) return;
    setSavingProperty(true);
    updateDeal({
      variables: {
        input: {
          id: deal.id,
          propiedad: selectedProperty.title, // Send property title as text
        },
      },
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const baseUrl = window.location.origin;

    let propertySection = '';
    if (propertyText) {
      propertySection = `
        <div class="property-section">
          <h3 class="section-title">Propiedad</h3>
          <div class="property-card">
            <div class="property-info">
              <h4>${propertyText}</h4>
            </div>
          </div>
        </div>
      `;
    }

    let leadSection = '';
    if (leadInfo.name) {
      leadSection = `
        <div class="info-card">
          <div class="info-label">Cliente</div>
          <div class="info-item"><strong>${leadInfo.name}</strong></div>
          ${leadInfo.mobile ? `<div class="info-item">📱 ${leadInfo.mobile}</div>` : ''}
          ${leadInfo.email ? `<div class="info-item">✉️ ${leadInfo.email}</div>` : ''}
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deal - ${fullDeal.leadName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #8B4513; padding-bottom: 20px; }
          .logo { height: 60px; margin-right: 20px; }
          .title { color: #8B4513; font-size: 24px; font-weight: bold; }
          .subtitle { color: #666; font-size: 14px; }
          .deal-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding: 20px; background: #faf5f0; border-radius: 12px; }
          .deal-avatar { width: 60px; height: 60px; background: #8B4513; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
          .deal-info h2 { margin: 0 0 8px 0; color: #333; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #f0e6d8; color: #8B4513; }
          .badge-won { background: #d1fae5; color: #065f46; }
          .badge-lost { background: #fee2e2; color: #991b1b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
          .info-card { padding: 20px; border: 1px solid #e0ccb0; border-radius: 12px; background: white; }
          .info-label { color: #8B4513; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
          .info-item { margin: 8px 0; color: #555; }
          .section-title { color: #8B4513; font-size: 18px; font-weight: bold; margin: 35px 0 20px 0; border-bottom: 2px solid #e0ccb0; padding-bottom: 10px; }
          .property-section { margin-top: 30px; }
          .property-card { display: flex; gap: 25px; padding: 20px; border: 1px solid #e0ccb0; border-radius: 12px; background: #faf5f0; }
          .property-info { flex: 1; }
          .property-info h4 { margin: 0 0 12px 0; color: #333; font-size: 18px; }
          .footer { margin-top: 50px; text-align: center; color: #8B4513; font-size: 12px; padding-top: 20px; border-top: 1px solid #e0ccb0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${baseUrl}/images/habita-logo.jpg" class="logo" alt="HabitaCR" onerror="this.style.display='none'" />
          <div>
            <div class="title">HabitaCR - Ficha de Seguimiento</div>
            <div class="subtitle">${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div class="deal-header">
          <div class="deal-avatar">${fullDeal.leadName?.charAt(0).toUpperCase() || 'D'}</div>
          <div class="deal-info">
            <h2>${fullDeal.leadName}</h2>
            <span class="badge ${fullDeal.estado === 'ganado' ? 'badge-won' : fullDeal.estado === 'descartado' ? 'badge-lost' : ''}">${STAGE_LABELS[fullDeal.estado] || fullDeal.estado}</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Información del Seguimiento</div>
            <div class="info-item">📅 Creado: ${formatDate(fullDeal.createdAt)}</div>
            <div class="info-item">📊 Estado: ${STAGE_LABELS[fullDeal.estado] || fullDeal.estado}</div>
            ${fullDeal.busca ? `<div class="info-item">🔍 Busca: ${fullDeal.busca}</div>` : ''}
            ${fullDeal.calificacion ? `<div class="info-item">⭐ Calificación: ${fullDeal.calificacion}</div>` : ''}
            ${fullDeal.proximoPaso ? `<div class="info-item">➡️ Próximo paso: ${fullDeal.proximoPaso}</div>` : ''}
          </div>
          ${leadSection}
        </div>
        ${propertySection}
        ${fullDeal.detalles ? `
          <div class="info-card" style="margin-top: 20px;">
            <div class="info-label">Detalles</div>
            <div class="info-item">${fullDeal.detalles}</div>
          </div>
        ` : ''}
        <div class="footer">
          <p><strong>HabitaCR</strong> - CRM Inmobiliario</p>
          <p>www.habitacr.com</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStageVariant = (estado: string) => {
    if (estado === 'ganado') return 'won';
    if (estado === 'descartado') return 'lost';
    return 'active';
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: User },
    { id: 'property' as TabType, label: 'Propiedad', icon: Home },
    { id: 'notes' as TabType, label: 'Notas', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#e0ccb0]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#8B4513] flex items-center justify-center text-white text-xl font-bold">
            {fullDeal.leadName?.charAt(0).toUpperCase() || 'D'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">{fullDeal.leadName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStageVariant(fullDeal.estado)}>
                {STAGE_LABELS[fullDeal.estado] || fullDeal.estado}
              </Badge>
              {fullDeal.calificacion && (
                <span className="text-[#8B4513] font-semibold text-sm">
                  {fullDeal.calificacion}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-[#8B4513] text-[#8B4513]">
            <Edit3 size={16} className="mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="border-[#8B4513] text-[#8B4513]">
            <Printer size={16} className="mr-2" />
            Imprimir
          </Button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-[#f0e6d8] rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {leadInfo.mobile && (
        <div className="flex items-center gap-3 px-6 py-3 bg-[#faf5f0] border-b border-[#e0ccb0]">
          <span className="text-sm text-gray-600">Contactar:</span>
          <a href={`https://wa.me/${leadInfo.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-sm hover:bg-[#1da851]">
            <MessageSquare size={14} />
            WhatsApp
          </a>
          <a href={`tel:${leadInfo.mobile}`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            <Phone size={14} />
            Llamar
          </a>
          {leadInfo.email && (
            <a href={`mailto:${leadInfo.email}`} className="flex items-center gap-1 px-3 py-1.5 bg-[#8B4513] text-white rounded-lg text-sm hover:bg-[#6b350f]">
              <Mail size={14} />
              Email
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e0ccb0] px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-[#8B4513] text-[#8B4513]' : 'border-transparent text-gray-500 hover:text-[#8B4513]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <Card className="p-5 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide flex items-center gap-2">
                <Tag size={16} />
                Detalles del Seguimiento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Etapa</p>
                  <Badge variant={getStageVariant(fullDeal.estado)}>
                    {STAGE_LABELS[fullDeal.estado] || fullDeal.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Calificación</p>
                  <p className="text-lg font-bold text-[#8B4513]">
                    {fullDeal.calificacion || 'Sin calificar'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Fecha de Creación</p>
                  <p className="text-black flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(fullDeal.createdAt)}
                  </p>
                </div>
                {propertyText && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Propiedad</p>
                    <p className="text-black flex items-center gap-2">
                      <Building size={14} className="text-gray-400" />
                      {propertyText}
                    </p>
                  </div>
                )}
                {fullDeal.busca && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Qué busca</p>
                    <p className="text-black">{fullDeal.busca}</p>
                  </div>
                )}
                {fullDeal.proximoPaso && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Próximo paso</p>
                    <p className="text-black">{fullDeal.proximoPaso}</p>
                  </div>
                )}
              </div>
              {fullDeal.detalles && (
                <div className="mt-4 pt-4 border-t border-[#e0ccb0]">
                  <p className="text-xs text-gray-500 uppercase mb-2">Detalles</p>
                  <p className="text-black whitespace-pre-wrap">{fullDeal.detalles}</p>
                </div>
              )}
            </Card>

            {leadInfo.name && (
              <Card className="p-5 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0e6d8] flex items-center justify-center">
                      <User size={18} className="text-[#8B4513]" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{leadInfo.name}</p>
                      {leadInfo.email && <p className="text-sm text-gray-500">{leadInfo.email}</p>}
                    </div>
                  </div>
                  {leadInfo.mobile && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone size={14} />
                      {leadInfo.mobile}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Property Tab */}
        {activeTab === 'property' && (
          <div className="space-y-6">
            {propertyText ? (
              <Card className="p-5 border-[#e0ccb0]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#e0ccb0] rounded-xl flex items-center justify-center">
                    <Home size={32} className="text-[#8B4513]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-black">{propertyText}</h4>
                    <p className="text-gray-500 text-sm">Propiedad vinculada</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#e0ccb0]">
                  <p className="text-sm text-gray-500 mb-3">¿Cambiar propiedad?</p>
                  <PropertySelector selectedProperty={selectedProperty} onSelect={setSelectedProperty} />
                  {selectedProperty && (
                    <Button onClick={handleLinkProperty} disabled={savingProperty} className="w-full mt-3 bg-[#8B4513] hover:bg-[#6b350f] text-white">
                      {savingProperty ? 'Actualizando...' : 'Actualizar Propiedad'}
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 border-[#e0ccb0]">
                <div className="text-center mb-6">
                  <Home size={56} className="mx-auto text-[#cca87a] mb-4" />
                  <h3 className="font-semibold text-lg text-black mb-2">
                    Sin propiedad vinculada
                  </h3>
                  <p className="text-gray-500">
                    Selecciona una propiedad para vincular a este seguimiento
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <PropertySelector selectedProperty={selectedProperty} onSelect={setSelectedProperty} />
                  {selectedProperty && (
                    <Button onClick={handleLinkProperty} disabled={savingProperty} className="w-full bg-[#8B4513] hover:bg-[#6b350f] text-white">
                      {savingProperty ? 'Vinculando...' : 'Vincular Propiedad'}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card className="p-5 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Agregar Nota
              </h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota sobre este seguimiento..."
                rows={4}
                className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button disabled={!newNote} className="bg-[#8B4513] hover:bg-[#6b350f] text-white">
                  <Plus size={16} className="mr-2" />
                  Agregar
                </Button>
              </div>
            </Card>

            <Card className="p-5 border-[#e0ccb0]">
              <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                Notas
              </h3>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="p-4 bg-[#faf5f0] rounded-lg">
                      <p className="text-black whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {note.authorName} - {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay notas para este seguimiento</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e0ccb0]">
              <h3 className="text-lg font-bold text-black">Editar Seguimiento</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-[#f0e6d8] rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent">
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="visita-programada">Visita Programada</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="reserva">Reserva</option>
                  <option value="formalizado">Formalizado</option>
                  <option value="descartado">Descartado</option>
                  <option value="ganado">Ganado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué busca?</label>
                <input type="text" value={editBusca} onChange={(e) => setEditBusca(e.target.value)} className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent" placeholder="Casa, apartamento, terreno..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
                <select value={editCalificacion} onChange={(e) => setEditCalificacion(e.target.value)} className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent">
                  <option value="">Sin calificar</option>
                  <option value="caliente">Caliente</option>
                  <option value="tibio">Tibio</option>
                  <option value="frio">Frío</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo paso</label>
                <input type="text" value={editProximoPaso} onChange={(e) => setEditProximoPaso(e.target.value)} className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent" placeholder="Agendar visita, enviar cotización..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalles</label>
                <textarea value={editDetalles} onChange={(e) => setEditDetalles(e.target.value)} className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none" rows={3} placeholder="Notas adicionales..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#e0ccb0]">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="border-gray-300">Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={updateLoading} className="bg-[#8B4513] hover:bg-[#6b350f] text-white">
                {updateLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
