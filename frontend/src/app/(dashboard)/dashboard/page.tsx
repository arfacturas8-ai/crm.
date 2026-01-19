'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Users,
  Kanban,
  Search,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, getWhatsAppLink } from '@/lib/utils';
import { LEAD_SOURCE_LABELS } from '@/types';

// Dashboard stats query - connects to WordPress GraphQL
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    crmStats {
      totalLeads
      totalDeals
      activeDeals
      wonDeals
      newLeadsThisMonth
      conversionRate
    }
    recentLeads: leads(first: 5) {
      nodes {
        id
        name
        email
        mobile
        source
        status
        createdAt
      }
    }
    recentDeals: deals(first: 5) {
      nodes {
        id
        leadName
        leadEmail
        leadMobile
        group
        busca
        estado
        createdAt
      }
    }
  }
`;

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-[#e0ccb0]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-3xl font-bold mt-1 text-black dark:text-white">{value}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f0e6d8]">
              <Icon className="w-6 h-6 text-[#8B4513]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.crmStats || {
    totalLeads: 0,
    totalDeals: 0,
    activeDeals: 0,
    wonDeals: 0,
  };
  const recentLeads = data?.recentLeads?.nodes || [];
  const recentDeals = data?.recentDeals?.nodes || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={loading ? '...' : stats.totalLeads}
          icon={Users}
          href="/leads"
        />
        <StatCard
          title="Deals Activos"
          value={loading ? '...' : stats.activeDeals}
          icon={Kanban}
          href="/deals"
        />
        <StatCard
          title="Clientes Potenciales"
          value={loading ? '...' : stats.wonDeals}
          icon={Users}
          href="/deals"
        />
        <StatCard
          title="Total Deals"
          value={loading ? '...' : stats.totalDeals}
          icon={Search}
          href="/deals"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-[#e0ccb0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-black dark:text-white">Leads Recientes</CardTitle>
            <Link
              href="/leads"
              className="text-sm text-[#8B4513] hover:text-[#6b350f] flex items-center gap-1"
            >
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e0ccb0] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#e0ccb0] rounded w-3/4" />
                      <div className="h-3 bg-[#e0ccb0] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead: any) => (
                  <Link
                    key={lead.id}
                    href={`/leads?id=${lead.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#faf5f0] dark:bg-[#111] hover:bg-[#f0e6d8] dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#8B4513] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {lead.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{lead.name}</p>
                        <p className="text-sm text-gray-500">
                          {LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS] || lead.source || 'Sin fuente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.mobile && (
                        <a
                          href={getWhatsAppLink(lead.mobile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare size={16} />
                        </a>
                      )}
                      <span className="text-xs text-gray-500">
                        {lead.createdAt ? formatRelativeTime(lead.createdAt) : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-[#cca87a] mb-3" />
                <p className="text-gray-500">No hay leads recientes</p>
                <Link
                  href="/leads"
                  className="text-[#8B4513] hover:underline text-sm mt-2 inline-block"
                >
                  Crear primer lead
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card className="border-[#e0ccb0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-black dark:text-white">Deals Recientes</CardTitle>
            <Link
              href="/deals"
              className="text-sm text-[#8B4513] hover:text-[#6b350f] flex items-center gap-1"
            >
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e0ccb0] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#e0ccb0] rounded w-3/4" />
                      <div className="h-3 bg-[#e0ccb0] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDeals.length > 0 ? (
              <div className="space-y-3">
                {recentDeals.map((deal: any) => (
                  <Link
                    key={deal.id}
                    href={`/deals?id=${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#faf5f0] dark:bg-[#111] hover:bg-[#f0e6d8] dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center">
                        <Kanban className="w-5 h-5 text-[#8B4513]" />
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{deal.leadName}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {deal.busca || 'Sin especificar'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        deal.group === 'won'
                          ? 'won'
                          : deal.group === 'lost'
                          ? 'lost'
                          : 'active'
                      }
                    >
                      {deal.group === 'active'
                        ? 'Seguimiento'
                        : deal.group === 'won'
                        ? 'Potencial'
                        : 'Descartado'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Kanban className="w-12 h-12 mx-auto text-[#cca87a] mb-3" />
                <p className="text-gray-500">No hay deals recientes</p>
                <Link
                  href="/deals"
                  className="text-[#8B4513] hover:underline text-sm mt-2 inline-block"
                >
                  Crear primer deal
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error message if GraphQL fails */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">
              Error conectando con el servidor. Verifica la configuración de GraphQL.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
