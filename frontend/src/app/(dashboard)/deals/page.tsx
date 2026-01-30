'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Search, X } from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { KanbanColumn } from '@/components/deals/KanbanColumn';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/constants';
import type { Deal } from '@/types';

export default function DealsPage() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState<{ id: string; name: string } | null>(null);

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
      stage: deal.estado || 'nuevo',
      title: deal.leadName || 'Sin nombre',
      contactName: deal.leadName,
      contactPhone: deal.leadMobile,
      contactEmail: deal.leadEmail,
      propertyTitle: deal.propiedad,
    }));
  }, [data]);

  const allDeals = rawDeals;

  const [updateDeal] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: () => refetch(),
  });

  const [deleteDeal, { loading: deleteLoading }] = useMutation(DELETE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.deleteDeal?.success) {
        addNotification({
          type: 'success',
          title: 'Seguimiento eliminado',
          message: 'Podrás recuperarlo en los próximos 30 días',
        });
        refetch();
      }
      setDeleteConfirmDeal(null);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo eliminar',
      });
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
    DEAL_STAGES.forEach((stage) => {
      grouped[stage.id] = [];
    });

    filteredDeals.forEach((deal) => {
      const normalizedStage = deal.stage?.toLowerCase().replace(/\s+/g, '-') || 'nuevo';
      if (grouped[normalizedStage]) {
        grouped[normalizedStage].push(deal);
      } else {
        grouped['nuevo']?.push(deal);
      }
    });

    return grouped;
  }, [filteredDeals]);

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

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    openModal('view-deal');
  };

  const handleDealDelete = (dealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const deal = allDeals.find(d => d.id === dealId);
    if (deal) {
      setDeleteConfirmDeal({ id: dealId, name: deal.contactName || deal.title || 'este seguimiento' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden -m-4 md:-m-6">
      {/* Search bar - Fixed */}
      <div className="flex-shrink-0 p-4 md:p-6 pb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 hidden md:block">
            {allDeals.length} {allDeals.length === 1 ? 'registro' : 'registros'}
            {globalSearch && ` (${filteredDeals.length} encontrados)`}
          </p>
          <div className="flex-1 md:flex-none md:w-80 md:ml-auto relative">
            <Input
              placeholder="Buscar..."
              leftIcon={<Search size={16} />}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="bg-white pr-10"
            />
            {globalSearch && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setGlobalSearch('')}
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board - Scrollable */}
      <div className={cn(
        'flex-1 overflow-x-auto overflow-y-hidden',
        'px-4 md:px-6 pb-4',
        'scroll-touch'
      )}>
        <div className="flex gap-3 h-full min-w-max">
          {DEAL_STAGES.map((stage) => {
            const deals = dealsByStage[stage.id] || [];
            const isDropTarget = dragOverColumn === stage.id;

            return (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                color={stage.color}
                deals={deals}
                isLoading={loading}
                isDropTarget={isDropTarget}
                draggedDealId={draggedDeal?.id}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDealClick={handleDealClick}
                onDealDelete={handleDealDelete}
                onDealDragStart={handleDragStart}
                onDealDragEnd={handleDragEnd}
                onAddClick={() => openModal('create-deal')}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile stage indicator */}
      <div className="md:hidden flex-shrink-0 px-4 py-2 bg-gray-50 border-t overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {DEAL_STAGES.map((stage) => {
            const count = dealsByStage[stage.id]?.length || 0;
            return (
              <div
                key={stage.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border text-xs"
              >
                <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                <span className="text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <Modal id="create-deal" title="Nuevo Seguimiento" size="lg">
        <DealForm onSuccess={() => { closeModal(); refetch(); }} />
      </Modal>

      <Modal id="view-deal" title="" size="full" mobileFullScreen={true}>
        {selectedDeal && (
          <DealDetail
            deal={selectedDeal}
            onClose={() => { closeModal(); setSelectedDeal(null); refetch(); }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmDeal}
        title="Eliminar seguimiento"
        message={`¿Estás seguro de que deseas eliminar "${deleteConfirmDeal?.name}"? Podrás recuperarlo en los próximos 30 días.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={() => {
          if (deleteConfirmDeal) {
            deleteDeal({ variables: { input: { id: deleteConfirmDeal.id } } });
          }
        }}
        onCancel={() => setDeleteConfirmDeal(null)}
      />
    </div>
  );
}
