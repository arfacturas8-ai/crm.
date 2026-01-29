'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Plus,
  Search,
  GripVertical,
  Trash2,
  Building2,
  Calendar,
  User,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { type Deal } from '@/types';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';

// Query to get properties for enriching deals
const GET_PROPERTIES_FOR_DEALS = gql`
  query GetPropertiesForDeals {
    properties(first: 500) {
      nodes {
        id
        databaseId
        title
        propertyMeta {
          address
          price
        }
      }
    }
  }
`;

// Pipeline tabs
type PipelineTab = 'potencial' | 'seguimiento' | 'venta';

// All 8 preset stages - same for all pipelines
const ALL_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { id: 'contactado', label: 'Contactado', color: 'bg-[#8B4513]' },
  { id: 'visita-programada', label: 'Visita Programada', color: 'bg-[#a0522d]' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-[#cd853f]' },
  { id: 'reserva', label: 'Reserva', color: 'bg-purple-500' },
  { id: 'formalizado', label: 'Formalizado', color: 'bg-indigo-500' },
  { id: 'descartado', label: 'Descartado', color: 'bg-gray-400' },
  { id: 'ganado', label: 'Ganado', color: 'bg-green-600' },
];

// Same stages for all pipelines
const PRESET_STAGES = {
  potencial: ALL_STAGES,
  seguimiento: ALL_STAGES,
  venta: ALL_STAGES,
};

// Map deal stages to pipeline tabs
const getStagePipeline = (stage: string): PipelineTab => {
  const lowerStage = stage?.toLowerCase().replace(/\s+/g, '-') || '';
  // Potencial: early stages
  if (['nuevo', 'contactado', 'visita-programada', 'new', 'contacted'].includes(lowerStage)) {
    return 'potencial';
  }
  // Seguimiento: active follow-up
  if (['seguimiento', 'reserva', 'follow-up', 'reservation'].includes(lowerStage)) {
    return 'seguimiento';
  }
  // Venta: closing stages
  if (['formalizado', 'ganado', 'descartado', 'formalized', 'won', 'closed', 'lost'].includes(lowerStage)) {
    return 'venta';
  }
  return 'potencial'; // Default
};

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState<PipelineTab>('potencial');
  const [globalSearch, setGlobalSearch] = useState('');
  const [tabSearch, setTabSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { openModal, closeModal, addNotification } = useUIStore();

  const { data, loading, refetch } = useQuery(GET_DEALS_BY_STAGE);
  const { data: propertiesData } = useQuery(GET_PROPERTIES_FOR_DEALS);
  const { data: leadsData } = useQuery(GET_LEADS, {
    variables: { first: 500 }
  });

  // Create lookup maps for properties and leads
  const propertiesMap = useMemo(() => {
    const map = new Map<number, { title: string; address?: string; price?: number }>();
    propertiesData?.properties?.nodes?.forEach((prop: any) => {
      map.set(prop.databaseId, {
        title: prop.title,
        address: prop.propertyMeta?.address,
        price: prop.propertyMeta?.price,
      });
    });
    return map;
  }, [propertiesData]);

  const leadsMap = useMemo(() => {
    const map = new Map<number, { name: string; email?: string; phone?: string }>();
    leadsData?.leads?.nodes?.forEach((lead: any) => {
      map.set(parseInt(lead.id), {
        name: lead.name,
        email: lead.email,
        phone: lead.mobile,
      });
    });
    return map;
  }, [leadsData]);

  // Enrich deals with property and lead information
  const rawDeals: Deal[] = useMemo(() => {
    const deals = data?.deals?.nodes || [];
    return deals.map((deal: any) => {
      const property = deal.propertyId ? propertiesMap.get(deal.propertyId) : null;
      const lead = deal.leadId ? leadsMap.get(deal.leadId) : null;
      return {
        ...deal,
        propertyTitle: property?.title,
        propertyAddress: property?.address,
        contactName: lead?.name,
        contactEmail: lead?.email,
        contactPhone: lead?.phone,
      };
    });
  }, [data, propertiesMap, leadsMap]);

  // Data is already filtered by agentId on the server
  const allDeals = rawDeals;

  const [updateDeal] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: () => refetch(),
  });

  const [deleteDeal] = useMutation(DELETE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.deleteDeal?.success) {
        addNotification({ type: 'success', title: 'Deal eliminado', message: 'El deal se ha eliminado correctamente' });
        refetch();
      }
    },
  });

  // Global search filter
  const globalFilteredDeals = useMemo(() => {
    if (!globalSearch) return allDeals;
    const searchLower = globalSearch.toLowerCase();
    return allDeals.filter((deal) => {
      const titleMatch = deal.title?.toLowerCase().includes(searchLower);
      const notesMatch = deal.notes?.toLowerCase().includes(searchLower);
      const valueMatch = deal.value?.toString().includes(globalSearch);
      const stageMatch = deal.stage?.toLowerCase().includes(searchLower);
      const contactMatch = deal.contactName?.toLowerCase().includes(searchLower);
      const emailMatch = deal.contactEmail?.toLowerCase().includes(searchLower);
      const phoneMatch = deal.contactPhone?.includes(globalSearch);
      const propertyMatch = deal.propertyTitle?.toLowerCase().includes(searchLower);
      return titleMatch || notesMatch || valueMatch || stageMatch || contactMatch || emailMatch || phoneMatch || propertyMatch;
    });
  }, [allDeals, globalSearch]);

  // Filter deals by active tab and tab search
  const tabFilteredDeals = useMemo(() => {
    let deals = globalFilteredDeals.filter((deal) => getStagePipeline(deal.stage) === activeTab);

    if (tabSearch) {
      const searchLower = tabSearch.toLowerCase();
      deals = deals.filter((deal) => {
        const titleMatch = deal.title?.toLowerCase().includes(searchLower);
        const notesMatch = deal.notes?.toLowerCase().includes(searchLower);
        const valueMatch = deal.value?.toString().includes(tabSearch);
        const stageMatch = deal.stage?.toLowerCase().includes(searchLower);
        return titleMatch || notesMatch || valueMatch || stageMatch;
      });
    }

    return deals;
  }, [globalFilteredDeals, activeTab, tabSearch]);

  // Group deals by stage for Kanban
  const dealsByStage = useMemo(() => {
    const stages = PRESET_STAGES[activeTab];
    const grouped: Record<string, Deal[]> = {};
    stages.forEach((stage) => {
      grouped[stage.id] = [];
    });

    tabFilteredDeals.forEach((deal) => {
      const normalizedStage = deal.stage?.toLowerCase().replace(/\s+/g, '-') || 'nuevo';
      if (grouped[normalizedStage]) {
        grouped[normalizedStage].push(deal);
      } else {
        // Put in first stage if not found
        const firstStage = stages[0].id;
        grouped[firstStage]?.push(deal);
      }
    });

    return grouped;
  }, [tabFilteredDeals, activeTab]);

  // Stage values
  const stageValues = useMemo(() => {
    const values: Record<string, number> = {};
    Object.entries(dealsByStage).forEach(([stageId, deals]) => {
      values[stageId] = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    });
    return values;
  }, [dealsByStage]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      potencial: globalFilteredDeals.filter((d) => getStagePipeline(d.stage) === 'potencial').length,
      seguimiento: globalFilteredDeals.filter((d) => getStagePipeline(d.stage) === 'seguimiento').length,
      venta: globalFilteredDeals.filter((d) => getStagePipeline(d.stage) === 'venta').length,
    };
  }, [globalFilteredDeals]);

  // Drag handlers
  const handleDragStart = (deal: Deal) => setDraggedDeal(deal);
  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumn(stageId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedDeal && draggedDeal.stage !== targetStage) {
      updateDeal({ variables: { input: { id: draggedDeal.id, stage: targetStage } } });
    }
    setDraggedDeal(null);
  };
  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverColumn(null);
  };

  const handleDelete = (dealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este seguimiento?')) {
      deleteDeal({ variables: { input: { id: dealId } } });
    }
  };

  const stages = PRESET_STAGES[activeTab];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Seguimiento</h1>
          <p className="text-gray-500 text-sm">
            {allDeals.length} registros - Total: {formatCurrency(allDeals.reduce((sum, d) => sum + (d.value || 0), 0))}
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-deal')}>
          Nuevo Seguimiento
        </Button>
      </div>

      {/* Global Search */}
      <Card className="p-3 mb-4 bg-white border-gray-200">
        <Input
          placeholder="Buscar en todo: nombre, notas, propiedad, monto, teléfono, email, etiqueta..."
          leftIcon={<Search size={16} />}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="bg-white border-gray-200"
        />
      </Card>

      {/* Pipeline Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('potencial'); setTabSearch(''); }}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'potencial'
              ? 'text-[#8B4513] border-[#8B4513]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          Potencial
          <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B4513]/10 text-[#8B4513] rounded-full">
            {tabCounts.potencial}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('seguimiento'); setTabSearch(''); }}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'seguimiento'
              ? 'text-[#8B4513] border-[#8B4513]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          Seguimiento
          <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B4513]/10 text-[#8B4513] rounded-full">
            {tabCounts.seguimiento}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('venta'); setTabSearch(''); }}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'venta'
              ? 'text-[#8B4513] border-[#8B4513]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          Venta
          <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B4513]/10 text-[#8B4513] rounded-full">
            {tabCounts.venta}
          </span>
        </button>
      </div>

      {/* Tab Search */}
      <div className="mb-4">
        <Input
          placeholder={`Buscar en ${activeTab === 'potencial' ? 'Potencial' : activeTab === 'seguimiento' ? 'Seguimiento' : 'Venta'}...`}
          leftIcon={<Search size={14} />}
          value={tabSearch}
          onChange={(e) => setTabSearch(e.target.value)}
          className="max-w-xs bg-white border-gray-200 text-sm"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex gap-3 pb-4 min-w-max">
          {stages.map((stage) => {
            const deals = dealsByStage[stage.id] || [];
            const isDropTarget = dragOverColumn === stage.id;
            const stageValue = stageValues[stage.id] || 0;

            return (
              <div
                key={stage.id}
                className={cn(
                  'w-72 lg:w-80 flex-shrink-0 bg-gray-50 rounded-lg flex flex-col',
                  isDropTarget && 'ring-2 ring-[#8B4513]'
                )}
                style={{ maxHeight: 'calc(100vh - 380px)' }}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                      <span className="font-medium text-gray-900">{stage.label}</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {deals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(stageValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-24 border border-gray-100" />
                    ))
                  ) : deals.length > 0 ? (
                    deals.map((deal) => (
                      <div
                        key={deal.id}
                        className={cn(
                          'bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all',
                          draggedDeal?.id === deal.id && 'opacity-50'
                        )}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        onDragEnd={handleDragEnd}
                        onClick={() => { setSelectedDeal(deal); openModal('view-deal'); }}
                      >
                        {/* Drag handle & delete */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <GripVertical size={14} className="text-gray-300 cursor-grab mt-0.5" />
                          <button
                            className="text-gray-300 hover:text-red-500 p-0.5"
                            onClick={(e) => handleDelete(deal.id, e)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Lead/Contact Name - FIRST */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-[#8B4513]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {deal.contactName || deal.title}
                            </p>
                            {deal.contactPhone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone size={10} />
                                {deal.contactPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Property - BELOW */}
                        {deal.propertyTitle && (
                          <div className="bg-gray-50 rounded p-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-gray-400" />
                              <p className="text-xs text-gray-600 truncate">{deal.propertyTitle}</p>
                            </div>
                          </div>
                        )}

                        {/* Value */}
                        {deal.value && (
                          <p className="text-sm font-bold text-[#8B4513] flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatCurrency(deal.value)}
                          </p>
                        )}

                        {/* Date */}
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatRelativeTime(deal.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Building2 size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Sin registros</p>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                <div className="p-2">
                  <button
                    className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-[#8B4513] hover:text-[#8B4513] transition-colors flex items-center justify-center gap-1 text-sm"
                    onClick={() => openModal('create-deal')}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <Modal id="create-deal" title="Nuevo Seguimiento" size="lg">
        <DealForm onSuccess={() => { closeModal(); refetch(); }} />
      </Modal>
      <Modal id="view-deal" title="" size="full">
        {selectedDeal && <DealDetail deal={selectedDeal} onClose={() => { closeModal(); refetch(); }} />}
      </Modal>
    </div>
  );
}
