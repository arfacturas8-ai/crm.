'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  MessageSquare,
  Mail,
  Phone,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
} from 'lucide-react';
import { GET_LEADS, DELETE_LEAD } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge, getLeadStatusVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import {
  cn,
  formatRelativeTime,
  getWhatsAppLink,
  formatPhoneDisplay,
  debounce,
} from '@/lib/utils';
import { LEAD_SOURCE_LABELS, type Lead, type LeadSource } from '@/types';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetail } from '@/components/leads/LeadDetail';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'lost', label: 'Perdido' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas las fuentes' },
  ...Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);

  const { openModal, closeModal, modalOpen } = useUIStore();
  const { hasMinimumRole } = useAuthStore();

  // Fetch leads
  const { data, loading, refetch } = useQuery(GET_LEADS, {
    variables: {
      first: 50,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      search: search || undefined,
    },
  });

  // Delete mutation
  const [deleteLead, { loading: deleteLoading }] = useMutation(DELETE_LEAD, {
    onCompleted: () => {
      setDeleteConfirmLead(null);
      refetch();
    },
  });

  const leads = data?.leads?.nodes || [];
  const totalCount = data?.leads?.totalCount || 0;

  // Debounced search
  const handleSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            {totalCount} leads en total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Upload size={16} />}>
            Importar
          </Button>
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Exportar
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-lead')}>
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              leftIcon={<Search size={18} />}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={SOURCE_OPTIONS}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-head">Nombre</th>
                <th className="table-head hidden md:table-cell">Contacto</th>
                <th className="table-head hidden sm:table-cell">Fuente</th>
                <th className="table-head hidden lg:table-cell">Estado</th>
                <th className="table-head hidden lg:table-cell">Fecha</th>
                <th className="table-head text-right">Acciones</th>
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
              ) : leads.length > 0 ? (
                leads.map((lead: Lead) => (
                  <tr key={lead.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-medium">
                            {lead.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <p className="text-sm text-muted-foreground truncate md:hidden">
                            {lead.mobile || lead.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="space-y-1">
                        {lead.mobile && (
                          <div className="flex items-center gap-2">
                            <a
                              href={getWhatsAppLink(lead.mobile)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm hover:text-whatsapp transition-colors"
                            >
                              <MessageSquare size={14} className="text-whatsapp" />
                              {formatPhoneDisplay(lead.mobile)}
                            </a>
                          </div>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail size={14} />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <Badge variant="secondary">
                        {LEAD_SOURCE_LABELS[lead.source as LeadSource] || lead.source}
                      </Badge>
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <Badge variant={getLeadStatusVariant(lead.status)}>
                        {lead.status === 'new'
                          ? 'Nuevo'
                          : lead.status === 'contacted'
                          ? 'Contactado'
                          : lead.status === 'qualified'
                          ? 'Calificado'
                          : lead.status === 'converted'
                          ? 'Convertido'
                          : 'Perdido'}
                      </Badge>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-sm text-muted-foreground">
                      {formatRelativeTime(lead.createdAt)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* WhatsApp Quick Action */}
                        {lead.mobile && (
                          <a
                            href={getWhatsAppLink(lead.mobile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-whatsapp btn-sm btn-icon"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare size={16} />
                          </a>
                        )}

                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            openModal('view-lead');
                          }}
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            openModal('edit-lead');
                          }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>

                        {/* Delete (admin/moderator only) */}
                        {hasMinimumRole('moderator') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmLead(lead)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12">
                    <p className="text-muted-foreground">No se encontraron leads</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => openModal('create-lead')}
                    >
                      Crear primer lead
                    </Button>
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
      {deleteConfirmLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmLead(null)} />
          <Card className="relative z-10 w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-muted-foreground mb-4">
              ¿Estás seguro de que deseas eliminar el lead <strong>{deleteConfirmLead.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmLead(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                isLoading={deleteLoading}
                onClick={() => deleteLead({ variables: { input: { id: deleteConfirmLead.id } } })}
              >
                Eliminar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
