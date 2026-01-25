'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  GripVertical,
  Trash2,
  Settings,
  Building2,
  Calendar,
} from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
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

  const { openModal, closeModal, addNotification } = useUIStore();
  const { stages } = usePipelineStore();
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  const { data, loading, refetch } = useQuery(GET_DEALS_BY_STAGE);
  const allDeals: Deal[] = data?.deals?.nodes || [];

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
        const firstActiveStage = sortedStages.find((s) => s.type === 'active');
        if (firstActiveStage) {
          grouped[firstActiveStage.id].push(deal);
        }
      }
    });
    return grouped;
  }, [allDeals, sortedStages]);

  const stageValues = useMemo(() => {
    const values: Record<string, number> = {};
    Object.entries(dealsByStage).forEach(([stageId, deals]) => {
      values[stageId] = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    });
    return values;
  }, [dealsByStage]);

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

  const handleDelete = (dealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Eliminar este deal?')) {
      deleteDeal({ variables: { input: { id: dealId } } });
    }
  };

  const handleDragStart = (deal: Deal) => setDraggedDeal(deal);
  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumn(stageId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedDeal && mapLegacyStage(draggedDeal.stage) !== targetStage) {
      updateDeal({ variables: { input: { id: draggedDeal.id, stage: targetStage } } });
    }
    setDraggedDeal(null);
  };
  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverColumn(null);
  };

  const filterDeals = (deals: Deal[]) => {
    if (!search) return deals;
    return deals.filter((deal) => deal.title?.toLowerCase().includes(search.toLowerCase()));
  };

  const getStageDeals = (stageId: string) => filterDeals(dealsByStage[stageId] || []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="text-gray-500 text-sm">
            {allDeals.length} deals - Total: {formatCurrency(allDeals.reduce((sum, d) => sum + (d.value || 0), 0))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              className={cn('px-3 py-2', viewMode === 'kanban' ? 'bg-[#8B4513] text-white' : 'text-gray-600 hover:bg-gray-50')}
              onClick={() => setViewMode('kanban')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={cn('px-3 py-2', viewMode === 'list' ? 'bg-[#8B4513] text-white' : 'text-gray-600 hover:bg-gray-50')}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <Button variant="outline" onClick={() => openModal('pipeline-settings')} className="border-gray-200 bg-white">
            <Settings size={16} />
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-deal')}>
            Nuevo Deal
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar deals..."
          leftIcon={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white border-gray-200"
        />
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4 lg:-mx-6 lg:px-6">
          <div className="flex gap-3 pb-4 min-w-max">
            {sortedStages.map((stage) => {
              const deals = getStageDeals(stage.id);
              const isDropTarget = dragOverColumn === stage.id;
              const stageValue = stageValues[stage.id] || 0;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'w-64 lg:w-72 flex-shrink-0 bg-gray-50 rounded-lg flex flex-col',
                    isDropTarget && 'ring-2 ring-[#8B4513]'
                  )}
                  style={{ maxHeight: 'calc(100vh - 280px)' }}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                        <span className="font-medium text-gray-900 text-sm">{stage.label}</span>
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
                        <div key={i} className="animate-pulse bg-white rounded h-20 border border-gray-100" />
                      ))
                    ) : deals.length > 0 ? (
                      deals.map((deal) => (
                        <div
                          key={deal.id}
                          className={cn(
                            'bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-gray-300 transition-all',
                            draggedDeal?.id === deal.id && 'opacity-50'
                          )}
                          draggable
                          onDragStart={() => handleDragStart(deal)}
                          onDragEnd={handleDragEnd}
                          onClick={() => { setSelectedDeal(deal); openModal('view-deal'); }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical size={12} className="text-gray-300 cursor-grab" />
                              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                                <Building2 size={12} className="text-gray-500" />
                              </div>
                            </div>
                            <button className="text-gray-300 hover:text-red-500 p-0.5" onClick={(e) => handleDelete(deal.id, e)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="font-medium text-gray-900 text-sm line-clamp-2">{deal.title}</p>
                          {deal.value && (
                            <p className="text-sm font-semibold text-[#8B4513] mt-2">{formatCurrency(deal.value)}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatRelativeTime(deal.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Building2 size={20} className="mx-auto mb-1 opacity-30" />
                        <p className="text-xs">Sin deals</p>
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <div className="p-2">
                    <button
                      className="w-full py-1.5 border border-dashed border-gray-200 rounded text-gray-400 hover:border-[#8B4513] hover:text-[#8B4513] transition-colors flex items-center justify-center gap-1 text-xs"
                      onClick={() => openModal('create-deal')}
                    >
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Titulo</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Etapa</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td className="p-3" colSpan={5}><div className="animate-pulse h-10 bg-gray-100 rounded" /></td></tr>
                  ))
                ) : filterDeals(allDeals).map((deal: Deal) => {
                  const mappedStage = mapLegacyStage(deal.stage);
                  const stageData = stages.find((s) => s.id === mappedStage);
                  return (
                    <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Building2 size={14} className="text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{deal.title}</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="font-semibold text-[#8B4513] text-sm">{deal.value ? formatCurrency(deal.value) : '-'}</span></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', stageData?.color || 'bg-gray-400')} />
                          <span className="text-sm text-gray-600">{stageData?.label || deal.stage}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{formatRelativeTime(deal.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedDeal(deal); openModal('view-deal'); }}>Ver</Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(deal.id, e as any)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <Modal id="create-deal" title="Nuevo Deal" size="lg">
        <DealForm onSuccess={() => { closeModal(); refetch(); }} />
      </Modal>
      <Modal id="view-deal" title="" size="full">
        {selectedDeal && <DealDetail deal={selectedDeal} onClose={() => { closeModal(); refetch(); }} />}
      </Modal>
      <Modal id="pipeline-settings" title="Configurar Pipeline" size="lg">
        <PipelineSettings />
      </Modal>
    </div>
  );
}
