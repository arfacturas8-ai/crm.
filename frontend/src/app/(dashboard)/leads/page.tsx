'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Search, Upload, Filter, X } from 'lucide-react';
import { GET_LEADS, DELETE_LEAD } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyLeads } from '@/components/ui/EmptyState';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadTableRow } from '@/components/leads/LeadTableRow';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { ImportExportModal } from '@/components/leads/ImportExportModal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useDataPrivacy } from '@/hooks/useDataPrivacy';
import { debounce, cn } from '@/lib/utils';
import { STATUS_FILTER_OPTIONS, SOURCE_FILTER_OPTIONS } from '@/lib/constants';
import type { Lead } from '@/types';

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { openModal, closeModal, addNotification } = useUIStore();
  const { hasMinimumRole, user, isAdmin, isModerator } = useAuthStore();

  // Get agentId for filtering - agents only see their own leads
  const agentIdForQuery = (!isAdmin() && !isModerator() && user?.id) ? String(user.id) : undefined;

  // Fetch leads
  const { data, loading, refetch } = useQuery(GET_LEADS, {
    variables: {
      first: 50,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      search: search || undefined,
      agentId: agentIdForQuery,
    },
  });

  // Delete mutation
  const [deleteLead, { loading: deleteLoading }] = useMutation(DELETE_LEAD, {
    onCompleted: (data) => {
      if (data?.deleteLead?.success) {
        addNotification({
          type: 'success',
          title: 'Lead eliminado',
          message: 'El lead se ha movido a la papelera (30 días para recuperar)',
        });
      }
      setDeleteConfirmLead(null);
      refetch();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo eliminar el lead',
      });
    },
  });

  const allLeads: Lead[] = data?.leads?.nodes || [];
  const leads = useDataPrivacy<Lead>(allLeads);
  const totalCount = leads.length;

  // Check if any filters are active
  const hasActiveFilters = statusFilter || sourceFilter;

  // Debounced search
  const handleSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  // Handlers
  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    openModal('view-lead');
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    openModal('edit-lead');
  };

  const handleDelete = (lead: Lead) => {
    setDeleteConfirmLead(lead);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSourceFilter('');
    setShowFilters(false);
  };

  const canDelete = hasMinimumRole('moderator');

  return (
    <div className="space-y-4 bg-white min-h-full">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {totalCount} {totalCount === 1 ? 'lead' : 'leads'}
          {hasActiveFilters && ' (filtrado)'}
        </p>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Upload size={14} />}
          className="hidden sm:flex text-xs"
          onClick={() => setShowImportExport(true)}
        >
          Importar/Exportar
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Buscar leads..."
              leftIcon={<Search size={16} />}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white"
            />
          </div>
          {/* Filter toggle for mobile */}
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            size="icon"
            className="md:hidden h-12 w-12"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filtros"
          >
            <Filter size={18} />
          </Button>
        </div>

        {/* Filters - always visible on desktop, toggle on mobile */}
        <div className={cn(
          'flex gap-2',
          'md:flex',
          showFilters ? 'flex' : 'hidden'
        )}>
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none md:w-40"
          />
          <Select
            options={SOURCE_FILTER_OPTIONS}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="flex-1 md:flex-none md:w-40"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-12 w-12"
              aria-label="Limpiar filtros"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showDeleteButton={canDelete}
            />
          ))
        ) : (
          <Card className="bg-white border-gray-200">
            <EmptyLeads onCreateClick={() => openModal('create-lead')} />
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block bg-white border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Fuente
                </th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Fecha
                </th>
                <th className="text-right p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <LeadTableRow
                    key={lead.id}
                    lead={lead}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showDeleteButton={canDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyLeads onCreateClick={() => openModal('create-lead')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Lead Modal */}
      <Modal id="create-lead" title="Nuevo Lead" size="lg">
        <LeadForm
          onSuccess={() => {
            closeModal();
            refetch();
          }}
        />
      </Modal>

      {/* Edit Lead Modal */}
      <Modal id="edit-lead" title="Editar Lead" size="lg">
        {selectedLead && (
          <LeadForm
            lead={selectedLead}
            onSuccess={() => {
              closeModal();
              setSelectedLead(null);
              refetch();
            }}
          />
        )}
      </Modal>

      {/* View Lead Modal */}
      <Modal id="view-lead" title="Detalles del Lead" size="xl">
        {selectedLead && <LeadDetail lead={selectedLead} />}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmLead}
        title="Eliminar lead"
        message={`¿Estás seguro de que deseas eliminar el lead "${deleteConfirmLead?.name}"? Podrás recuperarlo en los próximos 30 días.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={() => {
          if (deleteConfirmLead) {
            deleteLead({ variables: { input: { id: deleteConfirmLead.id } } });
          }
        }}
        onCancel={() => setDeleteConfirmLead(null)}
      />

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExportModal
          leads={leads}
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => {
            refetch();
            setShowImportExport(false);
          }}
        />
      )}
    </div>
  );
}
