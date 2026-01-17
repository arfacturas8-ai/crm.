'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Home,
  Bed,
  Bath,
} from 'lucide-react';
import { GET_ENQUIRIES, DELETE_ENQUIRY } from '@/graphql/queries/enquiries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import type { Enquiry } from '@/types';
import { EnquiryForm } from '@/components/enquiries/EnquiryForm';
import { EnquiryDetail } from '@/components/enquiries/EnquiryDetail';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activa' },
  { value: 'matched', label: 'Matched' },
  { value: 'closed', label: 'Cerrada' },
];

export default function EnquiriesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [deleteConfirmEnquiry, setDeleteConfirmEnquiry] = useState<Enquiry | null>(null);

  const { openModal, closeModal } = useUIStore();
  const { hasMinimumRole } = useAuthStore();

  // Fetch enquiries
  const { data, loading, refetch } = useQuery(GET_ENQUIRIES, {
    variables: {
      first: 50,
      status: statusFilter || undefined,
      search: search || undefined,
    },
  });

  // Delete mutation
  const [deleteEnquiry, { loading: deleteLoading }] = useMutation(DELETE_ENQUIRY, {
    onCompleted: () => {
      setDeleteConfirmEnquiry(null);
      refetch();
    },
  });

  const enquiries = data?.enquiries?.nodes || [];
  const totalCount = data?.enquiries?.totalCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Búsquedas</h1>
          <p className="text-muted-foreground">
            {totalCount} búsquedas registradas
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-enquiry')}>
          Nueva Búsqueda
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente o ubicación..."
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Enquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            </Card>
          ))
        ) : enquiries.length > 0 ? (
          enquiries.map((enquiry: Enquiry) => (
            <Card
              key={enquiry.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedEnquiry(enquiry);
                openModal('view-enquiry');
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Search size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{enquiry.leadName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(enquiry.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    enquiry.status === 'active'
                      ? 'primary'
                      : enquiry.status === 'matched'
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {enquiry.status === 'active'
                    ? 'Activa'
                    : enquiry.status === 'matched'
                    ? 'Matched'
                    : 'Cerrada'}
                </Badge>
              </div>

              {/* Search criteria */}
              <div className="space-y-2">
                {enquiry.searchCriteria.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span>{enquiry.searchCriteria.location}</span>
                  </div>
                )}

                {enquiry.searchCriteria.propertyType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Home size={14} className="text-muted-foreground" />
                    <span className="capitalize">{enquiry.searchCriteria.propertyType}</span>
                  </div>
                )}

                {(enquiry.searchCriteria.minPrice || enquiry.searchCriteria.maxPrice) && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={14} className="text-muted-foreground" />
                    <span>
                      {enquiry.searchCriteria.minPrice
                        ? formatCurrency(enquiry.searchCriteria.minPrice)
                        : '$0'}
                      {' - '}
                      {enquiry.searchCriteria.maxPrice
                        ? formatCurrency(enquiry.searchCriteria.maxPrice)
                        : 'Sin límite'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {enquiry.searchCriteria.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed size={14} />
                      <span>{enquiry.searchCriteria.bedrooms}+ hab</span>
                    </div>
                  )}
                  {enquiry.searchCriteria.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath size={14} />
                      <span>{enquiry.searchCriteria.bathrooms}+ baños</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEnquiry(enquiry);
                    openModal('edit-enquiry');
                  }}
                >
                  <Edit size={14} />
                </Button>
                {hasMinimumRole('moderator') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmEnquiry(enquiry);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No se encontraron búsquedas</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => openModal('create-enquiry')}
            >
              Crear primera búsqueda
            </Button>
          </div>
        )}
      </div>

      {/* Create Enquiry Modal */}
      <Modal id="create-enquiry" title="Nueva Búsqueda" size="lg">
        <EnquiryForm
          onSuccess={() => {
            closeModal();
            refetch();
          }}
        />
      </Modal>

      {/* Edit Enquiry Modal */}
      <Modal id="edit-enquiry" title="Editar Búsqueda" size="lg">
        {selectedEnquiry && (
          <EnquiryForm
            enquiry={selectedEnquiry}
            onSuccess={() => {
              closeModal();
              setSelectedEnquiry(null);
              refetch();
            }}
          />
        )}
      </Modal>

      {/* View Enquiry Modal */}
      <Modal id="view-enquiry" title="Detalles de Búsqueda" size="xl">
        {selectedEnquiry && <EnquiryDetail enquiry={selectedEnquiry} />}
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirmEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmEnquiry(null)} />
          <Card className="relative z-10 w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-muted-foreground mb-4">
              ¿Estás seguro de que deseas eliminar esta búsqueda?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmEnquiry(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                isLoading={deleteLoading}
                onClick={() => deleteEnquiry({ variables: { id: deleteConfirmEnquiry.id } })}
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
