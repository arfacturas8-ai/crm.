'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Calendar,
  DollarSign,
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
  MapPin,
  Bed,
  Bath,
  Plus,
} from 'lucide-react';
import { GET_DEAL, UPDATE_DEAL } from '@/graphql/queries/deals';
import { GET_LEAD, UPDATE_LEAD } from '@/graphql/queries/leads';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PropertySelector } from '@/components/ui/PropertySelector';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { type Deal, type DealStage } from '@/types';
import { useUIStore } from '@/store/ui-store';

// Query to get property by ID
const GET_PROPERTY = gql`
  query GetProperty($id: ID!) {
    property(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      title
      uri
      featuredImage {
        node {
          sourceUrl
        }
      }
      propertyPrice
      propertyBedrooms
      propertyBathrooms
      propertyAddress
      formattedPrice
      propertyCities {
        nodes {
          name
        }
      }
      propertyGallery {
        sourceUrl
      }
    }
  }
`;

interface DealDetailProps {
  deal: Deal;
  onClose?: () => void;
}

type TabType = 'info' | 'property' | 'notes';

const STAGE_LABELS: Record<string, string> = {
  initial_contact: 'Contacto Inicial',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociacion',
  active: 'Activo',
  won: 'Ganado',
  closed_won: 'Ganado',
  lost: 'Perdido',
  closed_lost: 'Perdido',
};

const STAGE_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'won', label: 'Ganado' },
  { value: 'lost', label: 'Perdido' },
];

export function DealDetail({ deal, onClose }: DealDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(deal.title || '');
  const [editStage, setEditStage] = useState<DealStage>(deal.stage || 'active');
  const [editValue, setEditValue] = useState(deal.value?.toString() || '');
  const [newNote, setNewNote] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [savingProperty, setSavingProperty] = useState(false);

  const { addNotification } = useUIStore();

  // Fetch full deal details
  const { data, loading, refetch } = useQuery(GET_DEAL, {
    variables: { id: deal.id },
  });

  const fullDeal: Deal = data?.deal || deal;
  // Notes is a string field from the backend
  const notesText = (fullDeal as any)?.notes || '';

  // Fetch lead to get property ID
  const { data: leadData, refetch: refetchLead } = useQuery(GET_LEAD, {
    variables: { id: fullDeal.leadId?.toString() },
    skip: !fullDeal.leadId,
  });

  const linkedLead = leadData?.lead;
  const propertyId = linkedLead?.propertyId;

  // Fetch property if we have a propertyId
  const { data: propertyData, loading: propertyLoading, refetch: refetchProperty } = useQuery(GET_PROPERTY, {
    variables: { id: propertyId },
    skip: !propertyId,
  });

  const linkedProperty = propertyData?.property;

  // Update lead mutation (for property linking)
  const [updateLead] = useMutation(UPDATE_LEAD, {
    onCompleted: async () => {
      // Refetch lead to get updated propertyId
      const { data: updatedLeadData } = await refetchLead();
      // If property was linked, refetch property data
      if (updatedLeadData?.lead?.propertyId) {
        await refetchProperty({ id: updatedLeadData.lead.propertyId });
      }
      addNotification({
        type: 'success',
        title: 'Propiedad vinculada',
        message: 'La propiedad se ha vinculado al lead correctamente',
      });
      setSavingProperty(false);
      setSelectedProperty(null);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo vincular la propiedad',
      });
      setSavingProperty(false);
    },
  });

  const handleLinkProperty = async () => {
    if (!selectedProperty || !linkedLead || savingProperty) return;
    setSavingProperty(true);
    try {
      await updateLead({
        variables: {
          input: {
            id: linkedLead.id,
            propertyId: parseInt(selectedProperty.databaseId, 10),
          },
        },
      });
    } catch (error) {
      console.error('Error updating lead property:', error);
      setSavingProperty(false);
    }
  };

  // Update deal mutation
  const [updateDeal, { loading: updateLoading }] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDeal', 'GetDealsByStage', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.updateDeal?.success) {
        addNotification({
          type: 'success',
          title: 'Deal actualizado',
          message: 'Los cambios se guardaron correctamente',
        });
        setIsEditing(false);
        refetch();
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar el deal',
      });
    },
  });

  // Update form values when deal changes
  useEffect(() => {
    setEditTitle(fullDeal.title || '');
    setEditStage(fullDeal.stage || 'active');
    setEditValue(fullDeal.value?.toString() || '');
  }, [fullDeal]);

  const handleSaveEdit = () => {
    updateDeal({
      variables: {
        input: {
          id: deal.id,
          title: editTitle,
          stage: editStage,
          value: editValue ? parseFloat(editValue) : undefined,
        },
      },
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the base URL for absolute paths
    const baseUrl = window.location.origin;

    // Build property section for print
    let propertySection = '';
    if (linkedProperty) {
      const images = linkedProperty.propertyGallery || [];
      const mainImage = linkedProperty.featuredImage?.node?.sourceUrl;
      const city = linkedProperty.propertyCities?.nodes?.[0]?.name || '';

      propertySection = `
        <div class="property-section">
          <h3 class="section-title">Propiedad Vinculada</h3>
          <div class="property-card">
            ${mainImage ? `
              <img src="${mainImage}" alt="${linkedProperty.title}" class="property-main-image" />
            ` : ''}
            <div class="property-info">
              <h4>${linkedProperty.title}</h4>
              ${linkedProperty.propertyAddress ? `
                <p class="property-address"><span class="icon">📍</span> ${linkedProperty.propertyAddress}</p>
              ` : ''}
              ${city ? `
                <p class="property-city"><span class="icon">🏙</span> ${city}</p>
              ` : ''}
              <div class="property-features">
                ${linkedProperty.propertyBedrooms ? `<span><span class="icon">🛏</span> ${linkedProperty.propertyBedrooms} Habitaciones</span>` : ''}
                ${linkedProperty.propertyBathrooms ? `<span><span class="icon">🚿</span> ${linkedProperty.propertyBathrooms} Banos</span>` : ''}
              </div>
              ${linkedProperty.formattedPrice || linkedProperty.propertyPrice ? `
                <p class="property-price">${linkedProperty.formattedPrice || formatCurrency(linkedProperty.propertyPrice)}</p>
              ` : ''}
              ${linkedProperty.uri ? `
                <p class="property-link"><a href="${linkedProperty.uri}" target="_blank">Ver propiedad en sitio web</a></p>
              ` : ''}
            </div>
          </div>
          ${images.length > 0 ? `
            <h4 class="gallery-title">Galeria de Fotos (${images.length} imagenes)</h4>
            <div class="property-gallery">
              ${images.map((img: any) => `
                <img src="${img.sourceUrl}" alt="Galeria" class="gallery-image" />
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Build lead info section
    let leadSection = '';
    if (linkedLead) {
      leadSection = `
        <div class="info-card">
          <div class="info-label">Lead Asociado</div>
          <div class="info-item"><strong>${linkedLead.name}</strong></div>
          ${linkedLead.mobile ? `<div class="info-item">Tel: ${linkedLead.mobile}</div>` : ''}
          ${linkedLead.email ? `<div class="info-item">Email: ${linkedLead.email}</div>` : ''}
        </div>
      `;
    }

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
          .section-title { color: #8B4513; font-size: 16px; font-weight: bold; margin: 30px 0 15px 0; border-bottom: 1px solid #e0ccb0; padding-bottom: 10px; }
          .property-section { margin-top: 30px; }
          .property-card { display: flex; gap: 20px; padding: 15px; border: 1px solid #e0ccb0; border-radius: 8px; background: #faf5f0; }
          .property-main-image { width: 200px; height: 150px; object-fit: cover; border-radius: 8px; }
          .property-info { flex: 1; }
          .property-info h4 { margin: 0 0 10px 0; color: #333; }
          .property-address { color: #666; margin: 5px 0; }
          .property-city { color: #666; margin: 5px 0; }
          .property-features { display: flex; gap: 15px; margin: 10px 0; color: #666; flex-wrap: wrap; }
          .property-price { color: #8B4513; font-size: 18px; font-weight: bold; margin-top: 10px; }
          .property-link { margin-top: 10px; }
          .property-link a { color: #8B4513; text-decoration: underline; }
          .gallery-title { color: #8B4513; font-size: 14px; margin: 20px 0 10px 0; }
          .property-gallery { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
          .gallery-image { width: 100%; height: 120px; object-fit: cover; border-radius: 4px; }
          .icon { margin-right: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #8B4513; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            .property-main-image { width: 180px; height: 120px; }
            .property-gallery { grid-template-columns: repeat(3, 1fr); }
            .gallery-image { height: 100px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${baseUrl}/images/habita-logo.jpg" class="logo" alt="HabitaCR" onerror="this.style.display='none'" />
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
            <span class="badge badge-${fullDeal.stage === 'won' || fullDeal.stage === 'closed_won' ? 'won' : fullDeal.stage === 'lost' || fullDeal.stage === 'closed_lost' ? 'lost' : 'active'}">${STAGE_LABELS[fullDeal.stage] || fullDeal.stage}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Informacion del Deal</div>
            <div class="info-item">Creado: ${formatDate(fullDeal.createdAt)}</div>
            ${fullDeal.value ? `<div class="info-item">Valor: ${formatCurrency(fullDeal.value)}</div>` : ''}
            <div class="info-item">Estado: ${STAGE_LABELS[fullDeal.stage] || fullDeal.stage}</div>
          </div>
          ${leadSection}
        </div>

        ${propertySection}

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

  const getStageVariant = (stage: string) => {
    if (stage === 'won' || stage === 'closed_won') return 'won';
    if (stage === 'lost' || stage === 'closed_lost') return 'lost';
    return 'active';
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Informacion', icon: User },
    { id: 'property' as TabType, label: 'Propiedad', icon: Home },
    { id: 'notes' as TabType, label: 'Notas', icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-[#e0ccb0] dark:border-[#3D2314]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#8B4513] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {fullDeal.title?.charAt(0).toUpperCase() || 'D'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">{fullDeal.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStageVariant(fullDeal.stage)}>
                {STAGE_LABELS[fullDeal.stage] || fullDeal.stage}
              </Badge>
              {fullDeal.value && (
                <span className="text-sm text-[#8B4513] font-medium">
                  {formatCurrency(fullDeal.value)}
                </span>
              )}
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
        <Button
          size="sm"
          variant="outline"
          className="border-[#8B4513] text-[#8B4513]"
          onClick={() => setIsEditing(true)}
        >
          <Edit3 size={16} className="mr-2" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#8B4513] text-[#8B4513]"
          onClick={handlePrint}
        >
          <Printer size={16} className="mr-2" />
          Imprimir
        </Button>
        {linkedLead?.mobile && (
          <a
            href={`https://wa.me/${linkedLead.mobile.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white">
              <MessageSquare size={16} className="mr-2" />
              WhatsApp
            </Button>
          </a>
        )}
        {linkedLead?.email && (
          <a href={`mailto:${linkedLead.email}`}>
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
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-[#8B4513] hover:border-[#cca87a]'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Informacion del Deal
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#8B4513]" />
                    <span className="text-black dark:text-white">
                      Creado: {formatDate(fullDeal.createdAt)}
                    </span>
                  </div>
                  {fullDeal.value && (
                    <div className="flex items-center gap-3">
                      <DollarSign size={18} className="text-[#8B4513]" />
                      <span className="text-black dark:text-white">
                        Valor: {formatCurrency(fullDeal.value)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Tag size={18} className="text-[#8B4513]" />
                    <span className="text-black dark:text-white">
                      Estado: {STAGE_LABELS[fullDeal.stage] || fullDeal.stage}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Lead Info Card */}
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Lead Asociado
                </h3>
                {linkedLead ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-[#8B4513]" />
                      <span className="text-black dark:text-white font-medium">
                        {linkedLead.name}
                      </span>
                    </div>
                    {linkedLead.mobile && (
                      <div className="flex items-center gap-3">
                        <Phone size={18} className="text-[#8B4513]" />
                        <span className="text-black dark:text-white">{linkedLead.mobile}</span>
                      </div>
                    )}
                    {linkedLead.email && (
                      <div className="flex items-center gap-3">
                        <Mail size={18} className="text-[#8B4513]" />
                        <span className="text-black dark:text-white">{linkedLead.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Lead ID: {fullDeal.leadId}</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Property Tab */}
        {activeTab === 'property' && (
          <div className="space-y-6">
            {propertyLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-gray-200 rounded-lg" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ) : linkedProperty ? (
              <Card className="p-4 border-[#e0ccb0]">
                <h3 className="font-semibold text-sm text-[#8B4513] mb-4 uppercase tracking-wide">
                  Propiedad Vinculada
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  {linkedProperty.featuredImage?.node?.sourceUrl ? (
                    <img
                      src={linkedProperty.featuredImage.node.sourceUrl}
                      alt={linkedProperty.title}
                      className="w-full md:w-64 h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full md:w-64 h-48 bg-[#e0ccb0] rounded-lg flex items-center justify-center">
                      <Home size={40} className="text-[#8B4513]" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-black dark:text-white">
                      {linkedProperty.title}
                    </h4>
                    {linkedProperty.propertyAddress && (
                      <p className="text-gray-500 flex items-center gap-2 mt-2">
                        <MapPin size={16} />
                        {linkedProperty.propertyAddress}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-gray-500">
                      {linkedProperty.propertyBedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed size={16} />
                          {linkedProperty.propertyBedrooms} Hab.
                        </span>
                      )}
                      {linkedProperty.propertyBathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath size={16} />
                          {linkedProperty.propertyBathrooms} Banos
                        </span>
                      )}
                    </div>
                    {(linkedProperty.formattedPrice || linkedProperty.propertyPrice) && (
                      <p className="text-[#8B4513] text-xl font-bold mt-4">
                        {linkedProperty.formattedPrice || formatCurrency(linkedProperty.propertyPrice)}
                      </p>
                    )}
                    {linkedProperty.uri && (
                      <a
                        href={linkedProperty.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-[#8B4513] hover:underline"
                      >
                        Ver propiedad en sitio web
                      </a>
                    )}
                  </div>
                </div>

                {/* Property Gallery */}
                {linkedProperty.propertyGallery?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-sm text-gray-500 mb-3">Galeria</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {linkedProperty.propertyGallery.slice(0, 6).map((img: any, idx: number) => (
                        <img
                          key={idx}
                          src={img.sourceUrl}
                          alt={`Galeria ${idx + 1}`}
                          className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 border-[#e0ccb0]">
                <div className="text-center mb-6">
                  <Home size={48} className="mx-auto text-[#cca87a] mb-4" />
                  <h3 className="font-medium text-black dark:text-white mb-2">
                    No hay propiedad vinculada
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Busca y selecciona una propiedad para vincular a este deal
                  </p>
                </div>

                {linkedLead ? (
                  <div className="space-y-4">
                    <PropertySelector
                      selectedProperty={selectedProperty}
                      onSelect={setSelectedProperty}
                    />
                    {selectedProperty && (
                      <Button
                        onClick={handleLinkProperty}
                        disabled={savingProperty}
                        className="w-full bg-[#8B4513] hover:bg-[#6b350f] text-white"
                      >
                        {savingProperty ? 'Vinculando...' : 'Vincular Propiedad'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-sm">
                    Lead no encontrado (ID: {fullDeal.leadId})
                  </p>
                )}
              </Card>
            )}
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
                Notas
              </h3>
              {notesText ? (
                <div className="p-4 bg-[#faf5f0] dark:bg-[#111] rounded-lg">
                  <p className="text-black dark:text-white whitespace-pre-wrap">{notesText}</p>
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

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#e0ccb0]">
              <h3 className="text-lg font-semibold text-black dark:text-white">Editar Deal</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-[#f0e6d8] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as DealStage)}
                  className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                >
                  {STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-[#e0ccb0]">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                isLoading={updateLoading}
                className="bg-[#8B4513] hover:bg-[#6b350f] text-white"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
