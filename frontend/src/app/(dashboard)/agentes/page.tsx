'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Shield,
  Building2,
  CheckCircle,
  XCircle,
  MoreVertical,
  Mail,
  Calendar,
  Home,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  GET_USERS,
  GET_AGENT_PROPERTIES,
  DELETE_USER,
  UPDATE_PROPERTY_STATUS,
  DELETE_PROPERTY,
} from '@/graphql/queries/agents';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatDate, formatCurrency, debounce } from '@/lib/utils';
import { AgentForm } from '@/components/agents/AgentForm';
import { AgentDetail } from '@/components/agents/AgentDetail';

interface Agent {
  id: string;
  databaseId: number;
  name: string;
  email: string;
  roles: { nodes: { name: string }[] };
  avatar?: { url: string };
  registeredDate: string;
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

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Admin',
  editor: 'Moderador',
  author: 'Agente',
  contributor: 'Agente Jr',
  subscriber: 'Suscriptor',
  agent: 'Agente',
  agency: 'Agencia',
};

const ROLE_COLORS: Record<string, string> = {
  administrator: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  author: 'bg-green-100 text-green-700',
  agent: 'bg-green-100 text-green-700',
  agency: 'bg-amber-100 text-amber-700',
  contributor: 'bg-gray-100 text-gray-700',
  subscriber: 'bg-gray-100 text-gray-500',
};

export default function AgentesPage() {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'agent' | 'property'; item: any } | null>(null);

  const { openModal, closeModal, addNotification } = useUIStore();
  const { hasMinimumRole, isAdmin } = useAuthStore();

  // Fetch users
  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: { first: 50, search: search || undefined },
  });

  // Fetch agent properties when agent is selected
  const { refetch: fetchProperties, loading: loadingProperties } = useQuery(GET_AGENT_PROPERTIES, {
    variables: { authorId: selectedAgent?.databaseId || 0, first: 50 },
    skip: !selectedAgent,
    onCompleted: (data) => {
      setAgentProperties(data?.properties?.nodes || []);
    },
  });

  // Delete user mutation
  const [deleteUser, { loading: deletingUser }] = useMutation(DELETE_USER, {
    onCompleted: () => {
      addNotification({ type: 'success', title: 'Agente eliminado', message: 'El agente ha sido eliminado correctamente' });
      setDeleteConfirm(null);
      refetch();
    },
    onError: (error) => {
      addNotification({ type: 'error', title: 'Error', message: error.message });
    },
  });

  // Update property status mutation
  const [updatePropertyStatus] = useMutation(UPDATE_PROPERTY_STATUS, {
    onCompleted: () => {
      addNotification({ type: 'success', title: 'Propiedad actualizada', message: 'El estado de la propiedad ha sido actualizado' });
      if (selectedAgent) fetchProperties();
    },
    onError: (error) => {
      addNotification({ type: 'error', title: 'Error', message: error.message });
    },
  });

  // Delete property mutation
  const [deleteProperty, { loading: deletingProperty }] = useMutation(DELETE_PROPERTY, {
    onCompleted: () => {
      addNotification({ type: 'success', title: 'Propiedad eliminada', message: 'La propiedad ha sido eliminada correctamente' });
      setDeleteConfirm(null);
      if (selectedAgent) fetchProperties();
    },
    onError: (error) => {
      addNotification({ type: 'error', title: 'Error', message: error.message });
    },
  });

  const agents: Agent[] = data?.users?.nodes || [];

  // Filter to show only agents (not admins viewing other admins)
  const filteredAgents = agents.filter((agent) => {
    const roles = agent.roles?.nodes?.map((r) => r.name) || [];
    // Show agents, authors, editors, agencies
    return roles.some((r) => ['author', 'agent', 'agency', 'editor', 'contributor'].includes(r));
  });

  const handleSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    openModal('view-agent');
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    openModal('edit-agent');
  };

  const handleApproveProperty = (propertyId: string) => {
    updatePropertyStatus({
      variables: {
        input: {
          id: propertyId,
          status: 'PUBLISH',
        },
      },
    });
  };

  const handleRejectProperty = (propertyId: string) => {
    updatePropertyStatus({
      variables: {
        input: {
          id: propertyId,
          status: 'DRAFT',
        },
      },
    });
  };

  const getRoleBadge = (roles: { nodes: { name: string }[] }) => {
    const roleNames = roles?.nodes?.map((r) => r.name) || [];
    const primaryRole = roleNames[0] || 'subscriber';
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[primaryRole] || ROLE_COLORS.subscriber)}>
        {ROLE_LABELS[primaryRole] || primaryRole}
      </span>
    );
  };

  // Admin-only access check
  if (!hasMinimumRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <Card className="p-8 text-center max-w-md bg-white border-gray-200">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Acceso Restringido</h2>
          <p className="text-gray-500">
            Solo los administradores pueden acceder a la gestion de agentes.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 bg-white min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Agentes</h1>
          <p className="text-sm text-gray-500">
            {filteredAgents.length} agentes registrados
          </p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => openModal('create-agent')} className="text-xs lg:text-sm">
          Nuevo Agente
        </Button>
      </div>

      {/* Search */}
      <Card className="p-3 lg:p-4 bg-white border-gray-200">
        <Input
          placeholder="Buscar por nombre o email..."
          leftIcon={<Search size={16} />}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-white border-gray-200 text-sm max-w-md"
        />
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 bg-white border-gray-200">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => (
            <Card key={agent.id} className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {agent.avatar?.url ? (
                    <img src={agent.avatar.url} alt={agent.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-[#8B4513] font-semibold text-lg">
                      {agent.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                    </div>
                    {getRoleBadge(agent.roles)}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="icon" onClick={() => handleViewAgent(agent)} className="h-8 w-8">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)} className="h-8 w-8">
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'agent', item: agent })}
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center bg-white border-gray-200">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No se encontraron agentes</p>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block bg-white border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Agente</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Registro</th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="p-4" colSpan={5}>
                      <div className="animate-pulse h-12 bg-gray-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {agent.avatar?.url ? (
                            <img src={agent.avatar.url} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-[#8B4513] font-medium">
                              {agent.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{agent.name}</p>
                          <p className="text-xs text-gray-500">ID: {agent.databaseId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <a href={`mailto:${agent.email}`} className="text-sm text-gray-600 hover:text-[#8B4513] flex items-center gap-1">
                        <Mail size={12} />
                        {agent.email}
                      </a>
                    </td>
                    <td className="p-4">{getRoleBadge(agent.roles)}</td>
                    <td className="p-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(agent.registeredDate)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewAgent(agent)} title="Ver detalles" className="h-8 w-8">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)} title="Editar" className="h-8 w-8">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ type: 'agent', item: agent })}
                          title="Eliminar"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No se encontraron agentes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Agent Modal */}
      <Modal id="create-agent" title="Nuevo Agente" size="lg">
        <AgentForm
          onSuccess={() => {
            closeModal();
            refetch();
          }}
        />
      </Modal>

      {/* Edit Agent Modal */}
      <Modal id="edit-agent" title="Editar Agente" size="lg">
        {selectedAgent && (
          <AgentForm
            agent={selectedAgent}
            onSuccess={() => {
              closeModal();
              setSelectedAgent(null);
              refetch();
            }}
          />
        )}
      </Modal>

      {/* View Agent Modal (with listings) */}
      <Modal id="view-agent" title="Detalles del Agente" size="xl">
        {selectedAgent && (
          <AgentDetail
            agent={selectedAgent}
            properties={agentProperties}
            loadingProperties={loadingProperties}
            onApproveProperty={handleApproveProperty}
            onRejectProperty={handleRejectProperty}
            onDeleteProperty={(prop) => setDeleteConfirm({ type: 'property', item: prop })}
            onRefresh={() => fetchProperties()}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <Card className="relative z-10 w-full max-w-md mx-4 p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminacion</h3>
                <p className="text-sm text-gray-500">Esta accion no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              {deleteConfirm.type === 'agent' ? (
                <>Estas seguro de eliminar al agente <strong>{deleteConfirm.item.name}</strong>? Se eliminaran todos sus datos asociados.</>
              ) : (
                <>Estas seguro de eliminar la propiedad <strong>{deleteConfirm.item.title}</strong>?</>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-gray-200">
                Cancelar
              </Button>
              <Button
                variant="destructive"
                isLoading={deletingUser || deletingProperty}
                onClick={() => {
                  if (deleteConfirm.type === 'agent') {
                    deleteUser({ variables: { input: { id: deleteConfirm.item.id } } });
                  } else {
                    deleteProperty({ variables: { input: { id: deleteConfirm.item.id } } });
                  }
                }}
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
