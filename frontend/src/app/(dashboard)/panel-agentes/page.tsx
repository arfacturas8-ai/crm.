'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Users,
  User,
  Building2,
  Phone,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Query to get all deals with agent info (admin/moderator only)
const GET_ALL_DEALS_FOR_PANEL = gql`
  query GetAllDealsForPanel {
    deals(first: 200) {
      nodes {
        id
        leadName
        leadMobile
        propiedad
        estado
        agentId
        agentName
        notes {
          id
          content
          authorName
          createdAt
        }
        createdAt
      }
    }
  }
`;

// Query to get all agents
const GET_AGENTS = gql`
  query GetAgents {
    agents {
      nodes {
        id
        databaseId
        name
        email
      }
    }
  }
`;

interface Deal {
  id: string;
  leadName: string;
  leadMobile?: string;
  propiedad?: string;
  estado: string;
  agentId?: string;
  agentName?: string;
  notes?: Array<{
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface Agent {
  id: string;
  databaseId: number;
  name: string;
  email: string;
}

// Agent colors for visual distinction
const AGENT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
  { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-200' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200' },
  { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200' },
];

export default function PanelAgentesPage() {
  const { data: dealsData, loading: dealsLoading } = useQuery(GET_ALL_DEALS_FOR_PANEL);
  const { data: agentsData, loading: agentsLoading } = useQuery(GET_AGENTS);

  const deals: Deal[] = dealsData?.deals?.nodes || [];
  const agents: Agent[] = agentsData?.agents?.nodes || [];

  // Group deals by agent
  const dealsByAgent = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};

    // Initialize with all agents
    agents.forEach((agent) => {
      grouped[String(agent.databaseId)] = [];
    });

    // Add unassigned column
    grouped['unassigned'] = [];

    // Group deals
    deals.forEach((deal) => {
      const agentKey = deal.agentId ? String(deal.agentId) : 'unassigned';
      if (!grouped[agentKey]) {
        grouped[agentKey] = [];
      }
      grouped[agentKey].push(deal);
    });

    return grouped;
  }, [deals, agents]);

  // Get agent name by ID
  const getAgentName = (agentId: string): string => {
    if (agentId === 'unassigned') return 'Sin Asignar';
    const agent = agents.find((a) => String(a.databaseId) === agentId);
    return agent?.name || `Agente ${agentId}`;
  };

  // Get color for agent column
  const getAgentColor = (index: number) => {
    return AGENT_COLORS[index % AGENT_COLORS.length];
  };

  const loading = dealsLoading || agentsLoading;

  // Get unique agent IDs that have deals
  const agentIdsWithDeals = useMemo(() => {
    const ids = new Set<string>();
    deals.forEach((deal) => {
      if (deal.agentId) {
        ids.add(String(deal.agentId));
      } else {
        ids.add('unassigned');
      }
    });
    // Also add agents without deals
    agents.forEach((agent) => {
      ids.add(String(agent.databaseId));
    });
    return Array.from(ids);
  }, [deals, agents]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8B4513]/10 rounded-lg flex items-center justify-center">
            <Users className="text-[#8B4513]" size={20} />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Panel de Agentes</h1>
            <p className="text-gray-500 text-sm">
              Vista general de leads por agente (solo lectura)
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex gap-4 mt-4">
          <Card className="px-4 py-3 bg-[#faf5f0] border-[#e0ccb0]">
            <p className="text-xs text-gray-500 uppercase">Total Agentes</p>
            <p className="text-2xl font-bold text-[#8B4513]">{agents.length}</p>
          </Card>
          <Card className="px-4 py-3 bg-[#faf5f0] border-[#e0ccb0]">
            <p className="text-xs text-gray-500 uppercase">Total Leads</p>
            <p className="text-2xl font-bold text-[#8B4513]">{deals.length}</p>
          </Card>
        </div>
      </div>

      {/* Kanban Board - Agents as Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex gap-4 pb-4 min-w-max">
          {agentIdsWithDeals.map((agentId, index) => {
            const agentDeals = dealsByAgent[agentId] || [];
            const agentColor = getAgentColor(index);

            return (
              <div
                key={agentId}
                className="w-72 lg:w-80 flex-shrink-0 bg-gray-50 rounded-lg flex flex-col"
                style={{ maxHeight: 'calc(100vh - 280px)' }}
              >
                {/* Agent Header */}
                <div className={cn('p-3 rounded-t-lg', agentColor.light, agentColor.border, 'border-b')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', agentColor.bg)}>
                        <User size={14} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {getAgentName(agentId)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full shadow-sm">
                      {agentDeals.length}
                    </span>
                  </div>
                </div>

                {/* Deals Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-24 border border-gray-100" />
                    ))
                  ) : agentDeals.length > 0 ? (
                    agentDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white rounded-lg p-3 border border-gray-100"
                      >
                        {/* Lead Name - NO phone/email to protect privacy */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-gray-500" />
                          </div>
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {deal.leadName}
                          </p>
                        </div>

                        {/* Property - Show if available */}
                        {deal.propiedad && (
                          <div className="bg-gray-50 rounded p-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-gray-400" />
                              <p className="text-xs text-gray-600 truncate">{deal.propiedad}</p>
                            </div>
                          </div>
                        )}

                        {/* Stage Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 bg-[#8B4513]/10 text-[#8B4513] rounded-full capitalize">
                            {deal.estado}
                          </span>
                        </div>

                        {/* Notes Preview - Last note only */}
                        {deal.notes && deal.notes.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-start gap-1">
                              <FileText size={10} className="text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {deal.notes[deal.notes.length - 1].content}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <User size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Sin leads asignados</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Read-only Notice */}
      <div className="flex-shrink-0 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <p className="text-sm text-amber-800">
          <strong>Vista de solo lectura</strong> - Los datos de contacto estan ocultos para proteger la privacidad de los leads.
        </p>
      </div>
    </div>
  );
}
