'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Search,
  Plus,
  MessageSquare,
  Mail,
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
import { Modal } from '@/components/ui/Modal';
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

  const { openModal, closeModal } = useUIStore();
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
    <div className="space-y-4 lg:space-y-6 bg-white min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">
            {totalCount} leads en total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload size={14} />} className="text-xs lg:text-sm border-gray-200 bg-white hidden sm:flex">
            Importar
          </Button>
          <Button variant="outline" leftIcon={<Download size={14} />} className="text-xs lg:text-sm border-gray-200 bg-white hidden sm:flex">
            Exportar
          </Button>
          <Button leftIcon={<Plus size={14} />} onClick={() => openModal('create-lead')} className="text-xs lg:text-sm">
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 lg:p-4 bg-white border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, email o telefono..."
              leftIcon={<Search size={16} />}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white border-gray-200 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-36 lg:w-40 text-sm bg-white border-gray-200"
            />
            <Select
              options={SOURCE_OPTIONS}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full md:w-36 lg:w-40 text-sm bg-white border-gray-200"
            />
          </div>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 bg-white border-gray-200">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : leads.length > 0 ? (
          leads.map((lead: Lead) => (
            <Card key={lead.id} className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#8B4513] font-medium">
                    {lead.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {lead.mobile || lead.email}
                      </p>
                    </div>
                    <Badge variant={getLeadStatusVariant(lead.status)} className="text-xs flex-shrink-0">
                      {lead.status === 'new' ? 'Nuevo' : lead.status === 'contacted' ? 'Contactado' : lead.status === 'qualified' ? 'Calificado' : lead.status === 'converted' ? 'Convertido' : 'Perdido'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {lead.mobile && (
                      <a
                        href={getWhatsAppLink(lead.mobile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#25D366] text-white rounded-lg"
                      >
                        <MessageSquare size={14} />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedLead(lead);
                        openModal('view-lead');
                      }}
                      className="h-8 w-8"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedLead(lead);
                        openModal('edit-lead');
                      }}
                      className="h-8 w-8"
                    >
                      <Edit size={14} />
                    </Button>
                    {hasMinimumRole('moderator') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmLead(lead)}
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center bg-white border-gray-200">
            <p className="text-gray-500">No se encontraron leads</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => openModal('create-lead')}
            >
              Crear primer lead
            </Button>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block bg-white border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Fuente</th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Fecha</th>
                <th className="text-right p-3 lg:p-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="p-3 lg:p-4" colSpan={6}>
                      <div className="animate-pulse h-10 bg-gray-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : leads.length > 0 ? (
                leads.map((lead: Lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 lg:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 lg:w-10 lg:h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#8B4513] font-medium text-sm">
                            {lead.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{lead.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 lg:p-4">
                      <div className="space-y-1">
                        {lead.mobile && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getWhatsAppLink(lead.mobile)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs lg:text-sm hover:text-[#25D366] transition-colors"
                            >
                              <MessageSquare size={12} className="text-[#25D366]" />
                              {formatPhoneDisplay(lead.mobile)}
                            </a>
                          </div>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1 text-xs lg:text-sm text-gray-500 hover:text-[#8B4513] transition-colors"
                          >
                            <Mail size={12} />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3 lg:p-4 hidden lg:table-cell">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {LEAD_SOURCE_LABELS[lead.source as LeadSource] || lead.source}
                      </span>
                    </td>
                    <td className="p-3 lg:p-4">
                      <Badge variant={getLeadStatusVariant(lead.status)} className="text-xs">
                        {lead.status === 'new' ? 'Nuevo' : lead.status === 'contacted' ? 'Contactado' : lead.status === 'qualified' ? 'Calificado' : lead.status === 'converted' ? 'Convertido' : 'Perdido'}
                      </Badge>
                    </td>
                    <td className="p-3 lg:p-4 text-xs lg:text-sm text-gray-500 hidden xl:table-cell">
                      {formatRelativeTime(lead.createdAt)}
                    </td>
                    <td className="p-3 lg:p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.mobile && (
                          <a
                            href={getWhatsAppLink(lead.mobile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 lg:p-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            openModal('view-lead');
                          }}
                          title="Ver detalles"
                          className="h-8 w-8"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            openModal('edit-lead');
                          }}
                          title="Editar"
                          className="h-8 w-8"
                        >
                          <Edit size={14} />
                        </Button>
                        {hasMinimumRole('moderator') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmLead(lead)}
                            title="Eliminar"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <p className="text-gray-500">No se encontraron leads</p>
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
          <Card className="relative z-10 w-full max-w-md mx-4 p-6 bg-white">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminacion</h3>
            <p className="text-gray-500 mb-4">
              Estas seguro de que deseas eliminar el lead <strong>{deleteConfirmLead.name}</strong>?
              Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmLead(null)} className="border-gray-200">
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
