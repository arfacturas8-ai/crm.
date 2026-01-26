'use client';

import {
  Mail,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  RefreshCw,
  Home,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

interface Agent {
  id: string;
  databaseId: number;
  name: string;
  email: string;
  roles: { nodes: { name: string }[] };
  avatar?: { url: string };
  registeredDate: string;
  description?: string;
}

interface Property {
  id: string;
  databaseId: number;
  title: string;
  status: string;
  date: string;
  propertyStatus?: { nodes: { name: string }[] };
  propertyType?: { nodes: { name: string }[] };
  propertyMeta?: {
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  featuredImage?: { node: { sourceUrl: string } };
}

interface AgentDetailProps {
  agent: Agent;
  properties: Property[];
  loadingProperties: boolean;
  onApproveProperty: (id: string) => void;
  onRejectProperty: (id: string) => void;
  onDeleteProperty: (property: Property) => void;
  onRefresh: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrador',
  editor: 'Moderador',
  author: 'Agente',
  contributor: 'Agente Jr',
  subscriber: 'Suscriptor',
  agent: 'Agente',
  agency: 'Agencia',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  publish: { label: 'Publicada', color: 'bg-green-100 text-green-700' },
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  private: { label: 'Privada', color: 'bg-purple-100 text-purple-700' },
  trash: { label: 'Eliminada', color: 'bg-red-100 text-red-700' },
};

export function AgentDetail({
  agent,
  properties,
  loadingProperties,
  onApproveProperty,
  onRejectProperty,
  onDeleteProperty,
  onRefresh,
}: AgentDetailProps) {
  const roleNames = agent.roles?.nodes?.map((r) => r.name) || [];
  const primaryRole = roleNames[0] || 'agent';

  const publishedCount = properties.filter((p) => p.status === 'publish').length;
  const pendingCount = properties.filter((p) => p.status === 'pending' || p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Agent Info Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
          {agent.avatar?.url ? (
            <img src={agent.avatar.url} alt={agent.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[#8B4513] font-bold text-2xl lg:text-3xl">
              {agent.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">{agent.name}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Mail size={14} />
            <a href={`mailto:${agent.email}`} className="hover:text-[#8B4513]">
              {agent.email}
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[#8B4513]/10 text-[#8B4513] font-medium">
              {ROLE_LABELS[primaryRole] || primaryRole}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              Registrado: {formatDate(agent.registeredDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 lg:p-4 bg-white border-gray-200 text-center">
          <Building2 size={20} className="mx-auto text-[#8B4513] mb-1" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{properties.length}</p>
          <p className="text-xs text-gray-500">Total Propiedades</p>
        </Card>
        <Card className="p-3 lg:p-4 bg-white border-gray-200 text-center">
          <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{publishedCount}</p>
          <p className="text-xs text-gray-500">Publicadas</p>
        </Card>
        <Card className="p-3 lg:p-4 bg-white border-gray-200 text-center">
          <Clock size={20} className="mx-auto text-amber-500 mb-1" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </Card>
      </div>

      {/* Properties Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Home size={16} />
            Propiedades ({properties.length})
          </h3>
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs">
            <RefreshCw size={14} className="mr-1" />
            Actualizar
          </Button>
        </div>

        {loadingProperties ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {properties.map((property) => {
              const status = property.status?.toLowerCase() || 'draft';
              const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
              const propertyType = property.propertyType?.nodes?.[0]?.name || 'Propiedad';
              const propertyStatus = property.propertyStatus?.nodes?.[0]?.name || '';

              return (
                <Card key={property.id} className="p-3 bg-white border-gray-200">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {property.featuredImage?.node?.sourceUrl ? (
                        <img
                          src={property.featuredImage.node.sourceUrl}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 size={24} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{property.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded', statusInfo.color)}>
                              {statusInfo.label}
                            </span>
                            {propertyStatus && (
                              <span className="text-xs text-gray-500">{propertyStatus}</span>
                            )}
                            <span className="text-xs text-gray-400">{propertyType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Property meta */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {property.propertyMeta?.price && (
                          <span className="flex items-center gap-1 font-semibold text-[#8B4513]">
                            <DollarSign size={12} />
                            {formatCurrency(property.propertyMeta.price)}
                          </span>
                        )}
                        {property.propertyMeta?.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed size={12} />
                            {property.propertyMeta.bedrooms}
                          </span>
                        )}
                        {property.propertyMeta?.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath size={12} />
                            {property.propertyMeta.bathrooms}
                          </span>
                        )}
                        {property.propertyMeta?.area && (
                          <span className="flex items-center gap-1">
                            <Maximize size={12} />
                            {property.propertyMeta.area} m²
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2">
                        {status !== 'publish' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApproveProperty(property.id)}
                            className="text-xs text-green-600 hover:bg-green-50 h-7 px-2"
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Aprobar
                          </Button>
                        )}
                        {status === 'publish' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRejectProperty(property.id)}
                            className="text-xs text-amber-600 hover:bg-amber-50 h-7 px-2"
                          >
                            <XCircle size={12} className="mr-1" />
                            Despublicar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteProperty(property)}
                          className="text-xs text-red-600 hover:bg-red-50 h-7 px-2"
                        >
                          <Trash2 size={12} className="mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-gray-50 border-gray-200">
            <FileText size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">Este agente no tiene propiedades registradas</p>
          </Card>
        )}
      </div>
    </div>
  );
}
