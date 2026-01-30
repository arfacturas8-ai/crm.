'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Trash2, RotateCcw, Filter, Clock, AlertTriangle, X, User, Briefcase, HelpCircle } from 'lucide-react';
import { GET_DELETED_RECORDS, RECOVER_RECORD } from '@/graphql/queries/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'lead', label: 'Leads' },
  { value: 'deal', label: 'Deals' },
  { value: 'enquiry', label: 'Consultas' },
  { value: 'activity', label: 'Actividades' },
];

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  lead: <User size={18} className="text-blue-500" />,
  deal: <Briefcase size={18} className="text-green-500" />,
  enquiry: <HelpCircle size={18} className="text-purple-500" />,
  activity: <Clock size={18} className="text-orange-500" />,
};

interface DeletedRecord {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  deletedBy: string;
  deletedByName: string;
  deletedAt: string;
  expiresAt: string;
  daysRemaining: number;
  canRecover: boolean;
}

export default function DeletedRecordsPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [recoverConfirm, setRecoverConfirm] = useState<DeletedRecord | null>(null);

  const { isAdmin } = useAuthStore();
  const { addNotification } = useUIStore();

  const { data, loading, refetch } = useQuery(GET_DELETED_RECORDS, {
    variables: {
      first: 50,
      entityType: entityTypeFilter || undefined,
    },
    skip: !isAdmin(),
  });

  const [recoverRecord, { loading: recoverLoading }] = useMutation(RECOVER_RECORD, {
    onCompleted: (data) => {
      if (data?.recoverRecord?.success) {
        addNotification({
          type: 'success',
          title: 'Registro recuperado',
          message: data.recoverRecord.message || 'El registro ha sido restaurado exitosamente',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data?.recoverRecord?.message || 'No se pudo recuperar el registro',
        });
      }
      setRecoverConfirm(null);
      refetch();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo recuperar el registro',
      });
    },
  });

  const records: DeletedRecord[] = data?.deletedRecords?.nodes || [];
  const hasFilters = entityTypeFilter !== '';

  const handleRecover = () => {
    if (recoverConfirm) {
      recoverRecord({
        variables: {
          input: {
            id: recoverConfirm.id,
          },
        },
      });
    }
  };

  // Only admins can access this page
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">
            Solo los administradores pueden acceder a la papelera de reciclaje.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Papelera de Reciclaje</h1>
          <p className="text-gray-500 text-sm">
            Registros eliminados que pueden ser recuperados (30 dias)
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-medium text-amber-800">Politica de retencion</p>
          <p className="text-amber-700 mt-1">
            Los registros eliminados se mantienen durante 30 dias antes de ser eliminados permanentemente.
            Una vez expirado el plazo, no podran ser recuperados.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={hasFilters ? 'primary' : 'outline'}
            size="icon"
            className="md:hidden h-10 w-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
          </Button>
        </div>

        <div className={`flex gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <Select
            options={ENTITY_TYPE_OPTIONS}
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="flex-1 md:flex-none md:w-40"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEntityTypeFilter('')}
              className="h-10 w-10"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : records.length > 0 ? (
          records.map((record) => {
            const icon = ENTITY_ICONS[record.entityType] || <Trash2 size={18} className="text-gray-500" />;
            const isExpiring = record.daysRemaining <= 7;
            const isUrgent = record.daysRemaining <= 3;

            return (
              <Card key={record.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {record.entityName || `${record.entityType} #${record.entityId}`}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {record.entityType}
                        </p>
                      </div>
                      <Badge
                        variant={isUrgent ? 'danger' : isExpiring ? 'warning' : 'default'}
                        className="text-xs flex-shrink-0"
                      >
                        {record.daysRemaining} {record.daysRemaining === 1 ? 'dia' : 'dias'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Eliminado por: {record.deletedByName || 'Desconocido'}</span>
                      <span className="hidden sm:inline">
                        {new Date(record.deletedAt).toLocaleDateString('es-CR')}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {record.canRecover ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecoverConfirm(record)}
                          className="h-8 text-xs"
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Recuperar
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">No se puede recuperar</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {hasFilters
                ? 'No se encontraron registros eliminados del tipo seleccionado'
                : 'No hay registros en la papelera'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Los registros eliminados apareceran aqui
            </p>
          </Card>
        )}
      </div>

      {/* Recover Confirmation */}
      <ConfirmDialog
        isOpen={!!recoverConfirm}
        title="Recuperar registro"
        message={`¿Estas seguro de que deseas recuperar "${recoverConfirm?.entityName || recoverConfirm?.entityType}"? El registro sera restaurado a su ubicacion original.`}
        confirmLabel="Recuperar"
        cancelLabel="Cancelar"
        variant="info"
        isLoading={recoverLoading}
        onConfirm={handleRecover}
        onCancel={() => setRecoverConfirm(null)}
      />
    </div>
  );
}
