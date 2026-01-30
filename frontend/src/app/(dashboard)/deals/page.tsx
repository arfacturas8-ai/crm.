'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Search,
  GripVertical,
  Trash2,
  Building2,
  Calendar,
  User,
  Phone,
} from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatRelativeTime } from '@/lib/utils';
import { type Deal } from '@/types';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';

// All stages for the single pipeline view
const ALL_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { id: 'contactado', label: 'Contactado', color: 'bg-[#8B4513]' },
  { id: 'visita-programada', label: 'Visita Programada', color: 'bg-[#a0522d]' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-[#cd853f]' },
  { id: 'potencial', label: 'Potencial', color: 'bg-amber-500' },
  { id: 'reserva', label: 'Reserva', color: 'bg-purple-500' },
  { id: 'formalizado', label: 'Formalizado', color: 'bg-indigo-500' },
  { id: 'descartado', label: 'Descartado', color: 'bg-gray-400' },
];

export default function DealsPage() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { openModal, closeModal, addNotification } = useUIStore();
  const { user, isAdmin, isModerator } = useAuthStore();

  // Get agentId for filtering - agents only see their own deals
  const agentIdForQuery = (!isAdmin() && !isModerator() && user?.id) ? String(user.id) : undefined;

  const { data, loading, refetch } = useQuery(GET_DEALS_BY_STAGE, {
    variables: { agentId: agentIdForQuery },
  });

  // Map deals with normalized stage field
  const rawDeals: Deal[] = useMemo(() => {
    const deals = data?.deals?.nodes || [];
    return deals.map((deal: any) => ({
      ...deal,
      // Map server fields to display fields
      stage: deal.estado || 'nuevo',
      title: deal.leadName || 'Sin nombre',
      contactName: deal.leadName,
      contactPhone: deal.leadMobile,
      contactEmail: deal.leadEmail,
      propertyTitle: deal.propiedad,
    }));
  }, [data]);

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
  const filteredDeals = useMemo(() => {
    if (!globalSearch) return allDeals;
    const searchLower = globalSearch.toLowerCase();
    return allDeals.filter((deal) => {
      const nameMatch = deal.contactName?.toLowerCase().includes(searchLower);
      const buscaMatch = deal.busca?.toLowerCase().includes(searchLower);
      const stageMatch = deal.stage?.toLowerCase().includes(searchLower);
      const emailMatch = deal.contactEmail?.toLowerCase().includes(searchLower);
      const phoneMatch = deal.contactPhone?.includes(globalSearch);
      const propertyMatch = deal.propertyTitle?.toLowerCase().includes(searchLower);
      const detallesMatch = deal.detalles?.toLowerCase().includes(searchLower);
      return nameMatch || buscaMatch || stageMatch || emailMatch || phoneMatch || propertyMatch || detallesMatch;
    });
  }, [allDeals, globalSearch]);

  // Group deals by stage for Kanban
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    ALL_STAGES.forEach((stage) => {
      grouped[stage.id] = [];
    });

    filteredDeals.forEach((deal) => {
      const normalizedStage = deal.stage?.toLowerCase().replace(/\s+/g, '-') || 'nuevo';
      if (grouped[normalizedStage]) {
        grouped[normalizedStage].push(deal);
      } else {
        // Put in first stage if not found
        grouped['nuevo']?.push(deal);
      }
    });

    return grouped;
  }, [filteredDeals]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(dealsByStage).forEach(([stageId, deals]) => {
      counts[stageId] = deals.length;
    });
    return counts;
  }, [dealsByStage]);

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
      updateDeal({ variables: { input: { id: draggedDeal.id, estado: targetStage } } });
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

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Seguimiento</h1>
            <p className="text-gray-500 text-sm">
              {allDeals.length} registros en seguimiento
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

      </div>

      {/* Kanban Board - Scrollable Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex gap-3 pb-4 min-w-max">
          {ALL_STAGES.map((stage) => {
            const deals = dealsByStage[stage.id] || [];
            const isDropTarget = dragOverColumn === stage.id;

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

                        {/* What they're looking for */}
                        {deal.busca && (
                          <p className="text-xs text-gray-500 mb-1 truncate">
                            Busca: {deal.busca}
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
