'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MessageSquare,
  Phone,
  MoreVertical,
  GripVertical,
} from 'lucide-react';
import { GET_DEALS_BY_GROUP, UPDATE_DEAL, CREATE_DEAL } from '@/graphql/queries/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { cn, formatRelativeTime, getWhatsAppLink } from '@/lib/utils';
import { DEAL_GROUP_LABELS, DEAL_BUSCA_LABELS, type Deal, type DealGroup } from '@/types';
import { DealForm } from '@/components/deals/DealForm';
import { DealDetail } from '@/components/deals/DealDetail';

type ViewMode = 'kanban' | 'list';

const COLUMNS: { id: DealGroup; label: string; color: string }[] = [
  { id: 'active', label: 'Dar seguimiento', color: 'bg-yellow-500' },
  { id: 'won', label: 'Cliente potencial', color: 'bg-green-500' },
  { id: 'lost', label: 'Descartado', color: 'bg-red-500' },
];

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DealGroup | null>(null);

  const { openModal, closeModal } = useUIStore();

  // Fetch deals by group
  const { data, loading, refetch } = useQuery(GET_DEALS_BY_GROUP);

  // Update deal mutation (for moving between columns)
  const [updateDeal] = useMutation(UPDATE_DEAL, {
    onCompleted: () => refetch(),
  });

  const activeDeals = data?.activeDeals?.nodes || [];
  const wonDeals = data?.wonDeals?.nodes || [];
  const lostDeals = data?.lostDeals?.nodes || [];

  const getDealsByGroup = (group: DealGroup): Deal[] => {
    switch (group) {
      case 'active':
        return activeDeals;
      case 'won':
        return wonDeals;
      case 'lost':
        return lostDeals;
      default:
        return [];
    }
  };

  // Drag and drop handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent, group: DealGroup) => {
    e.preventDefault();
    setDragOverColumn(group);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetGroup: DealGroup) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedDeal && draggedDeal.group !== targetGroup) {
      updateDeal({
        variables: {
          input: {
            id: draggedDeal.id,
            group: targetGroup,
          },
        },
      });
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
    return deals.filter(
      (deal) =>
        deal.leadName?.toLowerCase().includes(searchLower) ||
        deal.propiedad?.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">
            {activeDeals.length + wonDeals.length + lostDeals.length} deals en total
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
            const deals = filterDeals(getDealsByGroup(column.id));
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
                                {deal.leadName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button className="text-muted-foreground hover:text-foreground">
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        <div className="mt-3">
                          <p className="font-medium">{deal.leadName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {DEAL_BUSCA_LABELS[deal.busca] || deal.busca}
                          </p>
                          {deal.propiedad && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {deal.propiedad}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(deal.updatedAt)}
                          </span>
                          <div className="flex gap-1">
                            {deal.leadMobile && (
                              <a
                                href={getWhatsAppLink(deal.leadMobile)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-whatsapp/10 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageSquare size={14} className="text-whatsapp" />
                              </a>
                            )}
                          </div>
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
                  <th className="table-head">Cliente</th>
                  <th className="table-head">Busca</th>
                  <th className="table-head">Propiedad</th>
                  <th className="table-head">Estado</th>
                  <th className="table-head">Actualizado</th>
                  <th className="table-head">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell" colSpan={6}>
                        <div className="animate-pulse h-12 bg-gray-100 rounded" />
                      </td>
                    </tr>
                  ))
                ) : (
                  [...activeDeals, ...wonDeals, ...lostDeals]
                    .filter(
                      (deal) =>
                        !search ||
                        deal.leadName?.toLowerCase().includes(search.toLowerCase()) ||
                        deal.propiedad?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((deal: Deal) => (
                      <tr key={deal.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {deal.leadName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{deal.leadName}</p>
                              <p className="text-sm text-muted-foreground">
                                {deal.leadEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell capitalize">
                          {DEAL_BUSCA_LABELS[deal.busca] || deal.busca}
                        </td>
                        <td className="table-cell">
                          {deal.propiedad || '-'}
                        </td>
                        <td className="table-cell">
                          <Badge
                            variant={
                              deal.group === 'won'
                                ? 'won'
                                : deal.group === 'lost'
                                ? 'lost'
                                : 'active'
                            }
                          >
                            {DEAL_GROUP_LABELS[deal.group]}
                          </Badge>
                        </td>
                        <td className="table-cell text-muted-foreground">
                          {formatRelativeTime(deal.updatedAt)}
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            {deal.leadMobile && (
                              <a
                                href={getWhatsAppLink(deal.leadMobile)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-whatsapp btn-sm btn-icon"
                              >
                                <MessageSquare size={14} />
                              </a>
                            )}
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
                          </div>
                        </td>
                      </tr>
                    ))
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
