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
} from 'lucide-react';
import { GET_DEALS_BY_STAGE, UPDATE_DEAL, DELETE_DEAL } from '@/graphql/queries/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { type Deal } from '@/types';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';

type ViewMode = 'kanban' | 'list';

// Map server stage values to kanban columns
const STAGE_TO_COLUMN: Record<string, string> = {
  // Active/In Progress stages
  'initial_contact': 'active',
  'qualified': 'active',
  'proposal': 'active',
  'negotiation': 'active',
  'active': 'active',
  // Won stages
  'won': 'won',
  'closed_won': 'won',
  // Lost stages
  'lost': 'lost',
  'closed_lost': 'lost',
};

const COLUMNS = [
  { id: 'active', label: 'En Proceso', color: 'bg-yellow-500' },
  { id: 'won', label: 'Ganado', color: 'bg-green-500' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-500' },
];

const STAGE_LABELS: Record<string, string> = {
  initial_contact: 'Contacto Inicial',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  active: 'Activo',
  won: 'Ganado',
  closed_won: 'Ganado',
  lost: 'Perdido',
  closed_lost: 'Perdido',
};

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { openModal, closeModal, addNotification } = useUIStore();

  // Fetch all deals
  const { data, loading, refetch } = useQuery(GET_DEALS_BY_STAGE);

  // All deals from the query
  const allDeals: Deal[] = data?.deals?.nodes || [];

  // Group deals by column
  const dealsByColumn = useMemo(() => {
    const grouped: Record<string, Deal[]> = {
      active: [],
      won: [],
      lost: [],
    };

    allDeals.forEach((deal) => {
      const column = STAGE_TO_COLUMN[deal.stage] || 'active';
      grouped[column].push(deal);
    });

    return grouped;
  }, [allDeals]);

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
    if (confirm('¿Estás seguro de eliminar este deal?')) {
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

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedDeal) {
      const currentColumn = STAGE_TO_COLUMN[draggedDeal.stage] || 'active';
      if (currentColumn !== targetColumn) {
        // Map column back to stage value
        const newStage = targetColumn; // active, won, or lost
        updateDeal({
          variables: {
            input: {
              id: draggedDeal.id,
              stage: newStage,
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

  const getColumnDeals = (columnId: string) => {
    return filterDeals(dealsByColumn[columnId] || []);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">
            {allDeals.length} deals en total
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
            >
              <Grid3X3 size={18} />
            </button>
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {COLUMNS.map((column) => {
            const deals = getColumnDeals(column.id);
            const isDropTarget = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  'kanban-column transition-all',
                  isDropTarget && 'ring-2 ring-primary ring-offset-2'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', column.color)} />
                    <h3 className="font-semibold">{column.label}</h3>
                    <Badge variant="secondary">{deals.length}</Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32" />
                    ))
                  ) : deals.length > 0 ? (
                    deals.map((deal) => (
                      <div
                        key={deal.id}
                        className={cn(
                          'kanban-card',
                          draggedDeal?.id === deal.id && 'opacity-50'
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
                              className="text-muted-foreground cursor-grab"
                            />
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {deal.title?.charAt(0).toUpperCase() || 'D'}
                              </span>
                            </div>
                          </div>
                          <button
                            className="text-red-400 hover:text-red-600 p-1"
                            onClick={(e) => handleDelete(deal.id, e)}
                            title="Eliminar deal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3">
                          <p className="font-medium">{deal.title}</p>
                          {deal.value && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <DollarSign size={14} />
                              {formatCurrency(deal.value)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {STAGE_LABELS[deal.stage] || deal.stage}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(deal.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No hay deals en esta columna
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-head">Título</th>
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
                    const column = STAGE_TO_COLUMN[deal.stage] || 'active';
                    return (
                      <tr key={deal.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {deal.title?.charAt(0).toUpperCase() || 'D'}
                              </span>
                            </div>
                            <p className="font-medium">{deal.title}</p>
                          </div>
                        </td>
                        <td className="table-cell">
                          {deal.value ? formatCurrency(deal.value) : '-'}
                        </td>
                        <td className="table-cell">
                          <Badge
                            variant={
                              column === 'won'
                                ? 'won'
                                : column === 'lost'
                                ? 'lost'
                                : 'active'
                            }
                          >
                            {STAGE_LABELS[deal.stage] || deal.stage}
                          </Badge>
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

      {/* View Deal Modal */}
      <Modal id="view-deal" title="Detalles del Deal" size="xl">
        {selectedDeal && <DealDetail deal={selectedDeal} />}
      </Modal>
    </div>
  );
}
