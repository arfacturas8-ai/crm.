'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

// Query to get audit logs
const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($first: Int, $offset: Int, $actionType: String, $userId: ID, $entityType: String) {
    auditLogs(first: $first, offset: $offset, actionType: $actionType, userId: $userId, entityType: $entityType) {
      nodes {
        id
        actionType
        entityType
        entityId
        entityName
        userId
        userName
        userRole
        details
        previousData
        newData
        ipAddress
        userAgent
        createdAt
        isRecoverable
      }
      totalCount
    }
  }
`;

// Query to get deleted records that can be recovered
const GET_DELETED_RECORDS = gql`
  query GetDeletedRecords($entityType: String) {
    deletedRecords(entityType: $entityType) {
      nodes {
        id
        entityType
        entityId
        entityName
        deletedBy
        deletedByName
        deletedAt
        data
        canRecover
      }
      totalCount
    }
  }
`;

// Mutation to recover deleted record
const RECOVER_RECORD = gql`
  mutation RecoverRecord($input: RecoverRecordInput!) {
    recoverRecord(input: $input) {
      success
      message
      entityId
    }
  }
`;

interface AuditLog {
  id: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export';
  entityType: 'lead' | 'deal' | 'property' | 'agent' | 'note' | 'activity';
  entityId?: string;
  entityName?: string;
  userId: string;
  userName: string;
  userRole: string;
  details?: string;
  previousData?: string;
  newData?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  isRecoverable?: boolean;
}

interface DeletedRecord {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  deletedBy: string;
  deletedByName: string;
  deletedAt: string;
  data: string;
  canRecover: boolean;
}

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  create: { label: 'Crear', color: 'bg-green-100 text-green-700', icon: Plus },
  update: { label: 'Actualizar', color: 'bg-blue-100 text-blue-700', icon: Edit },
  delete: { label: 'Eliminar', color: 'bg-red-100 text-red-700', icon: Trash2 },
  view: { label: 'Ver', color: 'bg-gray-100 text-gray-700', icon: Eye },
  login: { label: 'Iniciar sesion', color: 'bg-purple-100 text-purple-700', icon: User },
  logout: { label: 'Cerrar sesion', color: 'bg-purple-100 text-purple-700', icon: User },
  export: { label: 'Exportar', color: 'bg-amber-100 text-amber-700', icon: Download },
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  lead: 'Lead',
  deal: 'Seguimiento',
  property: 'Propiedad',
  agent: 'Agente',
  note: 'Nota',
  activity: 'Actividad',
};

export default function PanelAccionPage() {
  const { isAdmin } = useAuthStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'logs' | 'deleted'>('logs');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">
            Solo los administradores pueden acceder al Panel de Accion.
          </p>
        </Card>
      </div>
    );
  }

  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useQuery(GET_AUDIT_LOGS, {
    variables: {
      first: 100,
      actionType: actionFilter || undefined,
      entityType: entityFilter || undefined,
    },
  });

  const { data: deletedData, loading: deletedLoading, refetch: refetchDeleted } = useQuery(GET_DELETED_RECORDS, {
    variables: {
      entityType: entityFilter || undefined,
    },
    skip: activeTab !== 'deleted',
  });

  const [recoverRecord, { loading: recovering }] = useMutation(RECOVER_RECORD, {
    onCompleted: (data) => {
      if (data?.recoverRecord?.success) {
        addNotification({
          type: 'success',
          title: 'Registro recuperado',
          message: data.recoverRecord.message || 'El registro se ha recuperado exitosamente',
        });
        refetchLogs();
        refetchDeleted();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data?.recoverRecord?.message || 'No se pudo recuperar el registro',
        });
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo recuperar el registro',
      });
    },
  });

  // Placeholder data for demo (until backend implements audit logging)
  const demoLogs: AuditLog[] = useMemo(() => {
    return [
      {
        id: '1',
        actionType: 'delete',
        entityType: 'property',
        entityId: '123',
        entityName: 'Casa en Escazu',
        userId: '5',
        userName: 'Carlos Agente',
        userRole: 'agent',
        details: 'Propiedad eliminada permanentemente',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isRecoverable: true,
      },
      {
        id: '2',
        actionType: 'update',
        entityType: 'deal',
        entityId: '456',
        entityName: 'Juan Perez - Casa playa',
        userId: '5',
        userName: 'Carlos Agente',
        userRole: 'agent',
        details: 'Cambio de etapa: Nuevo -> Contactado',
        previousData: JSON.stringify({ estado: 'nuevo' }),
        newData: JSON.stringify({ estado: 'contactado' }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isRecoverable: false,
      },
      {
        id: '3',
        actionType: 'create',
        entityType: 'lead',
        entityId: '789',
        entityName: 'Maria Garcia',
        userId: '3',
        userName: 'Ana Agente',
        userRole: 'agent',
        details: 'Nuevo lead creado desde formulario',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        isRecoverable: false,
      },
      {
        id: '4',
        actionType: 'delete',
        entityType: 'lead',
        entityId: '101',
        entityName: 'Pedro Martinez',
        userId: '5',
        userName: 'Carlos Agente',
        userRole: 'agent',
        details: 'Lead eliminado',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        isRecoverable: true,
      },
      {
        id: '5',
        actionType: 'export',
        entityType: 'lead',
        entityId: '',
        entityName: '45 leads exportados',
        userId: '5',
        userName: 'Carlos Agente',
        userRole: 'agent',
        details: 'Exportacion de leads a Excel',
        createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        isRecoverable: false,
      },
    ];
  }, []);

  const demoDeletedRecords: DeletedRecord[] = useMemo(() => {
    return [
      {
        id: '1',
        entityType: 'property',
        entityId: '123',
        entityName: 'Casa en Escazu - $350,000',
        deletedBy: '5',
        deletedByName: 'Carlos Agente',
        deletedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        data: JSON.stringify({
          title: 'Casa en Escazu',
          price: 350000,
          bedrooms: 3,
          bathrooms: 2,
        }),
        canRecover: true,
      },
      {
        id: '2',
        entityType: 'lead',
        entityId: '101',
        entityName: 'Pedro Martinez',
        deletedBy: '5',
        deletedByName: 'Carlos Agente',
        deletedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        data: JSON.stringify({
          name: 'Pedro Martinez',
          email: 'pedro@email.com',
          mobile: '+506 8888-1234',
        }),
        canRecover: true,
      },
    ];
  }, []);

  // Use demo data if no real data (backend not implemented yet)
  const logs = logsData?.auditLogs?.nodes || demoLogs;
  const deletedRecords = deletedData?.deletedRecords?.nodes || demoDeletedRecords;

  // Filter logs by search
  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const searchLower = search.toLowerCase();
    return logs.filter((log: AuditLog) =>
      log.entityName?.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower)
    );
  }, [logs, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRecover = (record: DeletedRecord) => {
    if (confirm(`¿Recuperar "${record.entityName}"? Esto restaurara el registro eliminado.`)) {
      recoverRecord({
        variables: {
          input: {
            id: record.id,
            entityType: record.entityType,
            entityId: record.entityId,
          },
        },
      });
    }
  };

  const handleExportLogs = () => {
    // Export audit logs to CSV
    const headers = ['Fecha', 'Usuario', 'Rol', 'Accion', 'Entidad', 'Nombre', 'Detalles'];
    const rows = filteredLogs.map((log: AuditLog) => [
      formatDate(log.createdAt),
      log.userName,
      log.userRole,
      ACTION_TYPE_LABELS[log.actionType]?.label || log.actionType,
      ENTITY_TYPE_LABELS[log.entityType] || log.entityType,
      log.entityName || '-',
      log.details || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-red-600" size={20} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Panel de Accion</h1>
              <p className="text-gray-500 text-sm">
                Registro de todas las acciones de los agentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => { refetchLogs(); refetchDeleted(); }}
              className="border-gray-200"
            >
              Actualizar
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download size={14} />}
              onClick={handleExportLogs}
              className="border-gray-200"
            >
              Exportar Log
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'logs'
                ? 'text-[#8B4513] border-[#8B4513]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            Registro de Actividad
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {filteredLogs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'deleted'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            Registros Eliminados
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
              {deletedRecords.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <Card className="p-3 mb-4 bg-white border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, usuario o detalles..."
                leftIcon={<Search size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border-gray-200 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select
                options={[
                  { value: '', label: 'Todas las acciones' },
                  { value: 'create', label: 'Crear' },
                  { value: 'update', label: 'Actualizar' },
                  { value: 'delete', label: 'Eliminar' },
                  { value: 'view', label: 'Ver' },
                  { value: 'export', label: 'Exportar' },
                ]}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-40 text-sm bg-white border-gray-200"
              />
              <Select
                options={[
                  { value: '', label: 'Todas las entidades' },
                  { value: 'lead', label: 'Leads' },
                  { value: 'deal', label: 'Seguimientos' },
                  { value: 'property', label: 'Propiedades' },
                  { value: 'note', label: 'Notas' },
                ]}
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-40 text-sm bg-white border-gray-200"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'logs' ? (
          /* Activity Log */
          <div className="space-y-2">
            {logsLoading ? (
              [...Array(5)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log: AuditLog) => {
                const actionInfo = ACTION_TYPE_LABELS[log.actionType] || { label: log.actionType, color: 'bg-gray-100 text-gray-700', icon: Eye };
                const ActionIcon = actionInfo.icon;
                const isExpanded = expandedLog === log.id;

                return (
                  <Card
                    key={log.id}
                    className={cn(
                      'p-4 border transition-all cursor-pointer hover:shadow-sm',
                      log.actionType === 'delete' ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
                    )}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', actionInfo.color)}>
                        <ActionIcon size={18} />
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', actionInfo.color)}>
                              {actionInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                            </span>
                            {log.isRecoverable && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                Recuperable
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar size={12} />
                            {formatDate(log.createdAt)}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>

                        <p className="font-medium text-gray-900 mt-1 truncate">
                          {log.entityName || 'Sin nombre'}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <User size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {log.userName}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">({log.userRole})</span>
                        </div>

                        {log.details && (
                          <p className="text-sm text-gray-500 mt-1">{log.details}</p>
                        )}

                        {/* Expanded Details */}
                        {isExpanded && (log.previousData || log.newData) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {log.previousData && (
                              <div className="p-2 bg-red-50 rounded text-xs">
                                <span className="font-medium text-red-700">Antes:</span>
                                <pre className="mt-1 text-red-600 overflow-x-auto">
                                  {JSON.stringify(JSON.parse(log.previousData), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newData && (
                              <div className="p-2 bg-green-50 rounded text-xs">
                                <span className="font-medium text-green-700">Despues:</span>
                                <pre className="mt-1 text-green-600 overflow-x-auto">
                                  {JSON.stringify(JSON.parse(log.newData), null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay registros de actividad</p>
              </Card>
            )}
          </div>
        ) : (
          /* Deleted Records */
          <div className="space-y-2">
            {deletedLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : deletedRecords.length > 0 ? (
              deletedRecords.map((record: DeletedRecord) => (
                <Card key={record.id} className="p-4 border border-red-200 bg-red-50/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 size={18} className="text-red-600" />
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            {ENTITY_TYPE_LABELS[record.entityType] || record.entityType}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">{record.entityName}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>Eliminado por: <strong>{record.deletedByName}</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>{formatDate(record.deletedAt)}</span>
                        </div>

                        {/* Data Preview */}
                        {record.data && (
                          <div className="mt-2 p-2 bg-white rounded border border-red-200 text-xs">
                            <pre className="text-gray-600 overflow-x-auto">
                              {JSON.stringify(JSON.parse(record.data), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recover Button */}
                    {record.canRecover && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RotateCcw size={14} />}
                        onClick={() => handleRecover(record)}
                        disabled={recovering}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Recuperar
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
                <p className="text-gray-500">No hay registros eliminados pendientes de recuperacion</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="flex-shrink-0 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Este panel registra todas las acciones realizadas por los agentes.
          Los registros eliminados pueden ser recuperados dentro de los primeros 30 dias.
        </p>
      </div>
    </div>
  );
}
