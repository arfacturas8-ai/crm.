'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Search, Filter, Clock, User, FileText, RefreshCw, X } from 'lucide-react';
import { GET_AUDIT_LOGS } from '@/graphql/queries/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/auth-store';
import { formatRelativeTime } from '@/lib/utils';

// Action types and their display names
const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  create: { label: 'Creado', variant: 'success' },
  update: { label: 'Actualizado', variant: 'warning' },
  delete: { label: 'Eliminado', variant: 'danger' },
  recover: { label: 'Recuperado', variant: 'success' },
  login: { label: 'Inicio de sesion', variant: 'default' },
  logout: { label: 'Cierre de sesion', variant: 'default' },
};

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'lead', label: 'Leads' },
  { value: 'deal', label: 'Deals' },
  { value: 'enquiry', label: 'Consultas' },
  { value: 'activity', label: 'Actividades' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'create', label: 'Creacion' },
  { value: 'update', label: 'Actualizacion' },
  { value: 'delete', label: 'Eliminacion' },
  { value: 'recover', label: 'Recuperacion' },
];

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { isAdmin } = useAuthStore();

  const { data, loading, refetch } = useQuery(GET_AUDIT_LOGS, {
    variables: {
      first: 50,
      entityType: entityTypeFilter || undefined,
      action: actionFilter || undefined,
    },
    skip: !isAdmin(),
  });

  const logs: AuditLog[] = data?.auditLogs?.nodes || [];
  const hasFilters = entityTypeFilter || actionFilter;

  // Only admins can access this page
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">
            Solo los administradores pueden ver el registro de auditoria.
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
          <h1 className="text-2xl font-bold">Registro de Auditoria</h1>
          <p className="text-gray-500 text-sm">
            Historial de todas las acciones realizadas en el sistema
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="hidden sm:flex"
        >
          <RefreshCw size={14} className="mr-1" />
          Actualizar
        </Button>
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

        <div className={`flex flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <Select
            options={ENTITY_TYPE_OPTIONS}
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="flex-1 md:flex-none md:w-40"
          />
          <Select
            options={ACTION_OPTIONS}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex-1 md:flex-none md:w-40"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEntityTypeFilter('');
                setActionFilter('');
              }}
              className="h-10 w-10"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : logs.length > 0 ? (
          logs.map((log) => {
            const actionConfig = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' as const };
            const isExpanded = expandedLogId === log.id;

            return (
              <Card
                key={log.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-[#8B4513]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {log.userName || 'Usuario desconocido'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {log.entityName || `${log.entityType} #${log.entityId}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={actionConfig.variant} className="text-xs">
                          {actionConfig.label}
                        </Badge>
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile time */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 sm:hidden">
                      <Clock size={12} />
                      {formatRelativeTime(log.createdAt)}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Tipo de entidad</p>
                            <p className="font-medium capitalize">{log.entityType}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider">ID de entidad</p>
                            <p className="font-medium">{log.entityId}</p>
                          </div>
                          {log.ipAddress && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wider">IP</p>
                              <p className="font-medium">{log.ipAddress}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Fecha exacta</p>
                            <p className="font-medium">
                              {new Date(log.createdAt).toLocaleString('es-CR')}
                            </p>
                          </div>
                        </div>

                        {/* Changes display */}
                        {(log.oldValue || log.newValue) && (
                          <div className="space-y-2">
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Cambios</p>
                            <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                              {log.oldValue && (
                                <div className="text-red-600 mb-2">
                                  <span className="opacity-50">- </span>
                                  {log.oldValue.substring(0, 200)}
                                  {log.oldValue.length > 200 && '...'}
                                </div>
                              )}
                              {log.newValue && (
                                <div className="text-green-600">
                                  <span className="opacity-50">+ </span>
                                  {log.newValue.substring(0, 200)}
                                  {log.newValue.length > 200 && '...'}
                                </div>
                              )}
                            </div>
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
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {hasFilters
                ? 'No se encontraron registros con los filtros seleccionados'
                : 'No hay registros de auditoria aun'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
