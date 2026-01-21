'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  GripVertical,
  DollarSign,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
} from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { usePipelineStore, mapLegacyStage } from '@/store/pipeline-store';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { type Deal } from '@/types';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';
import { PipelineSettings } from '@/components/deals/PipelineSettings';

type ViewMode = 'kanban' | 'list';

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const { openModal, closeModal, addNotification } = useUIStore();
  const { stages } = usePipelineStore();
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  // Fetch all deals
  const { data, loading, refetch } = useQuery(GET_DEALS_BY_STAGE);

  // All deals from the query
  const allDeals: Deal[] = data?.deals?.nodes || [];

  // Group deals by stage (using pipeline stages)
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    sortedStages.forEach((stage) => {
      grouped[stage.id] = [];
    });

    allDeals.forEach((deal) => {
      const mappedStage = mapLegacyStage(deal.stage);
      if (grouped[mappedStage]) {
        grouped[mappedStage].push(deal);
      } else {
        // Fallback to first active stage
        const firstActiveStage = sortedStages.find((s) => s.type === 'active');
        if (firstActiveStage) {
          grouped[firstActiveStage.id].push(deal);
        }
      }
    });

    return grouped;
  }, [allDeals, sortedStages]);

  // Calculate total value per stage
  const stageValues = useMemo(() => {
    const values: Record<string, number> = {};
    Object.entries(dealsByStage).forEach(([stageId, deals]) => {
      values[stageId] = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    });
    return values;
  }, [dealsByStage]);

  // Update deal mutation (for moving between columns)
  const [updateDeal] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: () => refetch(),
  });

  // Delete deal mutation
  const [deleteDeal] = useMutation(DELETE_DEAL, {
    refetchQueries: ['GetDealsByStage', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.deleteDeal?.success) {
        addNotification({
          type: 'success',
          title: 'Deal eliminado',
          message: 'El deal se ha eliminado correctamente',
        });
        refetch();
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo eliminar el deal',
      });
    },
  });

  const handleDelete = (dealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estas seguro de eliminar este deal?')) {
      deleteDeal({
        variables: {
          input: { id: dealId },
        },
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumn(stageId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedDeal) {
      const currentStage = mapLegacyStage(draggedDeal.stage);
      if (currentStage !== targetStage) {
        updateDeal({
          variables: {
            input: {
              id: draggedDeal.id,
              stage: targetStage,
            },
          },
        });
      }
    }

    setDraggedDeal(null);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverColumn(null);
  };

  // Filter deals by search
  const filterDeals = (deals: Deal[]) => {
    if (!search) return deals;
    const searchLower = search.toLowerCase();
    return deals.filter((deal) => deal.title?.toLowerCase().includes(searchLower));
  };

  const getStageDeals = (stageId: string) => {
    return filterDeals(dealsByStage[stageId] || []);
  };

  // Horizontal scroll for kanban
  const scrollKanban = (direction: 'left' | 'right') => {
    const container = document.getElementById('kanban-container');
    if (container) {
      const scrollAmount = 320;
      const newPosition =
        direction === 'left'
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Get stage label for list view
  const getStageLabel = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId || s.id === mapLegacyStage(stageId));
    return stage?.label || stageId;
  };

  const getStageColor = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId || s.id === mapLegacyStage(stageId));
    return stage?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Ventas</h1>
          <p className="text-muted-foreground">
            {allDeals.length} deals | Total: {formatCurrency(allDeals.reduce((sum, d) => sum + (d.value || 0), 0))}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'kanban' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              onClick={() => setViewMode('kanban')}
              title="Vista Kanban"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              onClick={() => setViewMode('list')}
              title="Vista Lista"
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="outline" onClick={() => openModal('pipeline-settings')} title="Configurar Pipeline">
            <Settings size={16} />
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-deal')}>
            Nuevo Deal
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar deals..."
          leftIcon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="relative">
          {/* Navigation arrows for mobile/tablet */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white hidden md:block"
            onClick={() => scrollKanban('left')}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white hidden md:block"
            onClick={() => scrollKanban('right')}
          >
            <ChevronRight size={20} />
          </button>

          {/* Kanban container with horizontal scroll */}
          <div
            id="kanban-container"
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
            onScroll={(e) => setScrollPosition((e.target as HTMLElement).scrollLeft)}
          >
            {sortedStages.map((stage) => {
              const deals = getStageDeals(stage.id);
              const isDropTarget = dragOverColumn === stage.id;
              const stageValue = stageValues[stage.id] || 0;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'flex-shrink-0 w-[300px] md:w-[320px] bg-gray-50 rounded-xl p-4 snap-start transition-all min-h-[500px] flex flex-col',
                    isDropTarget && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                  )}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {/* Column header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                        <h3 className="font-semibold text-gray-800">{stage.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {deals.length}
                        </Badge>
                      </div>
                    </div>
                    {stageValue > 0 && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <DollarSign size={12} />
                        {formatCurrency(stageValue)}
                      </p>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
                    {loading ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-28" />
                      ))
                    ) : deals.length > 0 ? (
                      deals.map((deal) => (
                        <div
                          key={deal.id}
                          className={cn(
                            'bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all',
                            draggedDeal?.id === deal.id && 'opacity-50 rotate-2'
                          )}
                          draggable
                          onDragStart={() => handleDragStart(deal)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedDeal(deal);
                            openModal('view-deal');
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical
                                size={16}
                                className="text-gray-300 cursor-grab active:cursor-grabbing"
                              />
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Building2 size={16} className="text-primary" />
                              </div>
                            </div>
                            <button
                              className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                              onClick={(e) => handleDelete(deal.id, e)}
                              title="Eliminar deal"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-3">
                            <p className="font-medium text-gray-900 line-clamp-2">{deal.title}</p>
                            {deal.value && (
                              <p className="text-lg font-bold text-primary mt-2">
                                {formatCurrency(deal.value)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={12} />
                              {formatRelativeTime(deal.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-2', stage.color, 'bg-opacity-20')}>
                          <Building2 size={20} className="opacity-50" />
                        </div>
                        <p className="text-sm">Sin deals</p>
                      </div>
                    )}
                  </div>

                  {/* Quick add button */}
                  <button
                    className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    onClick={() => openModal('create-deal')}
                  >
                    <Plus size={16} />
                    <span className="text-sm">Agregar deal</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-head">Titulo</th>
                  <th className="table-head">Valor</th>
                  <th className="table-head">Etapa</th>
                  <th className="table-head">Creado</th>
                  <th className="table-head">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell" colSpan={5}>
                        <div className="animate-pulse h-12 bg-gray-100 rounded" />
                      </td>
                    </tr>
                  ))
                ) : (
                  filterDeals(allDeals).map((deal: Deal) => {
                    const mappedStage = mapLegacyStage(deal.stage);
                    const stageData = stages.find((s) => s.id === mappedStage);
                    return (
                      <tr key={deal.id} className="table-row hover:bg-gray-50">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{deal.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-semibold text-primary">
                            {deal.value ? formatCurrency(deal.value) : '-'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', stageData?.color || 'bg-gray-400')} />
                            <span>{getStageLabel(deal.stage)}</span>
                          </div>
                        </td>
                        <td className="table-cell text-muted-foreground">
                          {formatRelativeTime(deal.createdAt)}
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDeal(deal);
                                openModal('view-deal');
                              }}
                            >
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => handleDelete(deal.id, e as any)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Deal Modal */}
      <Modal id="create-deal" title="Nuevo Deal" size="lg">
        <DealForm
          onSuccess={() => {
            closeModal();
            refetch();
          }}
        />
      </Modal>

      {/* View Deal Modal - Full screen for better UX */}
      <Modal id="view-deal" title="" size="full">
        {selectedDeal && (
          <DealDetail
            deal={selectedDeal}
            onClose={() => {
              closeModal();
              refetch();
            }}
          />
        )}
      </Modal>

      {/* Pipeline Settings Modal */}
      <Modal id="pipeline-settings" title="Configurar Pipeline" size="lg">
        <PipelineSettings />
      </Modal>
    </div>
  );
}
