'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Users,
  Kanban,
  MessageSquare,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Phone,
  CalendarCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, formatCurrency, getWhatsAppLink } from '@/lib/utils';
import { LEAD_SOURCE_LABELS, type LeadSource } from '@/types';
import { useActivitiesStore } from '@/store/activities-store';
import { usePipelineStore, mapLegacyStage } from '@/store/pipeline-store';
import { cn } from '@/lib/utils';

// Dashboard stats query
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    crmStats {
      totalLeads
      totalDeals
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
    allLeads: leads(first: 100) {
      nodes {
        id
        source
        status
        createdAt
      }
    }
    recentDeals: deals(first: 5) {
      nodes {
        id
        title
        leadId
        stage
        value
        createdAt
      }
    }
    allDeals: deals(first: 100) {
      nodes {
        id
        stage
        value
        createdAt
      }
    }
  }
`;

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  color = 'primary',
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  href: string;
  trend?: { value: number; label: string };
  color?: 'primary' | 'green' | 'amber' | 'red';
}) {
  const colorClasses = {
    primary: 'bg-[#f0e6d8] text-[#8B4513]',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-[#e0ccb0] h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-3xl font-bold mt-1 text-black dark:text-white">{value}</p>
              {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
              {trend && (
                <div
                  className={cn(
                    'text-xs mt-2 flex items-center gap-1',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  <TrendingUp size={12} className={trend.value < 0 ? 'rotate-180' : ''} />
                  {Math.abs(trend.value)}% {trend.label}
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl', colorClasses[color])}>
              <Icon size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Mini pipeline chart
function PipelineChart({ deals, stages }: { deals: any[]; stages: any[] }) {
  const stageData = useMemo(() => {
    const data: { id: string; label: string; count: number; value: number; color: string }[] = [];

    stages
      .filter((s) => !s.isTerminal)
      .sort((a, b) => a.order - b.order)
      .forEach((stage) => {
        const stageDeals = deals.filter((d) => mapLegacyStage(d.stage) === stage.id);
        data.push({
          id: stage.id,
          label: stage.label,
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
          color: stage.color,
        });
      });

    return data;
  }, [deals, stages]);

  const maxValue = Math.max(...stageData.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {stageData.map((stage) => (
        <div key={stage.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', stage.color)} />
              <span className="text-gray-700">{stage.label}</span>
              <Badge variant="secondary" className="text-xs">
                {stage.count}
              </Badge>
            </div>
            <span className="font-medium">{formatCurrency(stage.value)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', stage.color)}
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Lead source breakdown
function LeadSourceChart({ leads }: { leads: any[] }) {
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const source = lead.source || 'direct';
      counts[source] = (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({
        source,
        label: LEAD_SOURCE_LABELS[source as LeadSource] || source,
        count,
        percentage: Math.round((count / leads.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [leads]);

  const colors = ['bg-[#8B4513]', 'bg-amber-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];

  return (
    <div className="space-y-3">
      {sourceData.map((source, idx) => (
        <div key={source.source} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', colors[idx])} />
            <span className="text-sm text-gray-700">{source.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{source.count}</span>
            <span className="text-xs text-gray-400">({source.percentage}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const { stages } = usePipelineStore();
  const { getPendingActivities, getOverdueActivities } = useActivitiesStore();

  const pendingActivities = getPendingActivities();
  const overdueActivities = getOverdueActivities();

  const stats = {
    totalLeads: data?.crmStats?.totalLeads || 0,
    totalDeals: data?.crmStats?.totalDeals || 0,
  };
  const recentLeads = data?.recentLeads?.nodes || [];
  const recentDeals = data?.recentDeals?.nodes || [];
  const allLeads = data?.allLeads?.nodes || [];
  const allDeals = data?.allDeals?.nodes || [];

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalPipelineValue = allDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    const wonDeals = allDeals.filter((d: any) => d.stage === 'won' || d.stage === 'closed_won');
    const wonValue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    const conversionRate = allLeads.length > 0 ? Math.round((wonDeals.length / allLeads.length) * 100) : 0;

    // This month leads
    const thisMonth = new Date();
    const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const leadsThisMonth = allLeads.filter(
      (l: any) => new Date(l.createdAt) >= firstDayOfMonth
    ).length;

    return {
      totalPipelineValue,
      wonValue,
      conversionRate,
      leadsThisMonth,
      wonDeals: wonDeals.length,
    };
  }, [allLeads, allDeals]);

  return (
    <div className="space-y-6">
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={loading ? '...' : stats.totalLeads}
          subtitle={`${metrics.leadsThisMonth} este mes`}
          icon={Users}
          href="/leads"
          color="primary"
        />
        <StatCard
          title="Pipeline Total"
          value={loading ? '...' : formatCurrency(metrics.totalPipelineValue)}
          subtitle={`${stats.totalDeals} deals activos`}
          icon={DollarSign}
          href="/deals"
          color="primary"
        />
        <StatCard
          title="Deals Ganados"
          value={loading ? '...' : metrics.wonDeals}
          subtitle={formatCurrency(metrics.wonValue)}
          icon={CheckCircle}
          href="/deals"
          color="green"
        />
        <StatCard
          title="Tasa Conversion"
          value={loading ? '...' : `${metrics.conversionRate}%`}
          subtitle="leads a ventas"
          icon={TrendingUp}
          href="/deals"
          color={metrics.conversionRate >= 20 ? 'green' : 'amber'}
        />
      </div>

      {/* Activities Alert */}
      {overdueActivities.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={24} />
                <div>
                  <h3 className="font-semibold text-red-700">
                    {overdueActivities.length} actividad(es) vencida(s)
                  </h3>
                  <p className="text-sm text-red-600">
                    Tienes tareas pendientes que requieren atencion inmediata.
                  </p>
                </div>
              </div>
              <Link href="/activities">
                <Badge variant="lost" className="cursor-pointer hover:opacity-80">
                  Ver actividades
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Second Row - Pipeline & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <Card className="lg:col-span-2 border-[#e0ccb0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
              <Kanban size={20} className="text-[#8B4513]" />
              Pipeline de Ventas
            </CardTitle>
            <Link
              href="/deals"
              className="text-sm text-[#8B4513] hover:text-[#6b350f] flex items-center gap-1"
            >
              Ver pipeline
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-2 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <PipelineChart deals={allDeals} stages={stages} />
            )}
          </CardContent>
        </Card>

        {/* Activities Summary */}
        <Card className="border-[#e0ccb0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
              <CalendarCheck size={20} className="text-[#8B4513]" />
              Actividades
            </CardTitle>
            <Link
              href="/activities"
              className="text-sm text-[#8B4513] hover:text-[#6b350f] flex items-center gap-1"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" />
                  <span className="text-sm font-medium">Pendientes</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {pendingActivities.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  <span className="text-sm font-medium">Vencidas</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {overdueActivities.length}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Proximas actividades:</p>
                {pendingActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        activity.priority === 'high'
                          ? 'bg-red-500'
                          : activity.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      )}
                    />
                    <span className="text-sm truncate flex-1">{activity.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Lead Sources & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources */}
        <Card className="border-[#e0ccb0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
              <Users size={20} className="text-[#8B4513]" />
              Origen de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-4 bg-gray-200 rounded" />
                ))}
              </div>
            ) : (
              <LeadSourceChart leads={allLeads} />
            )}
          </CardContent>
        </Card>

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
              <div className="space-y-2">
                {recentLeads.map((lead: any) => (
                  <Link
                    key={lead.id}
                    href={`/leads?id=${lead.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#faf5f0] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#8B4513] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {lead.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">{lead.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                    {lead.mobile && (
                      <a
                        href={getWhatsAppLink(lead.mobile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare size={14} />
                      </a>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-10 h-10 mx-auto text-[#cca87a] mb-2" />
                <p className="text-gray-500 text-sm">No hay leads recientes</p>
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
              <div className="space-y-2">
                {recentDeals.map((deal: any) => (
                  <Link
                    key={deal.id}
                    href={`/deals?id=${deal.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#faf5f0] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#8B4513]/10 rounded-lg flex items-center justify-center">
                        <Building2 size={16} className="text-[#8B4513]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white line-clamp-1">
                          {deal.title}
                        </p>
                        {deal.value && (
                          <p className="text-xs font-semibold text-[#8B4513]">
                            {formatCurrency(deal.value)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        deal.stage === 'won'
                          ? 'won'
                          : deal.stage === 'lost'
                          ? 'lost'
                          : 'active'
                      }
                      className="text-xs"
                    >
                      {deal.stage === 'won' ? 'Ganado' : deal.stage === 'lost' ? 'Perdido' : 'Activo'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Kanban className="w-10 h-10 mx-auto text-[#cca87a] mb-2" />
                <p className="text-gray-500 text-sm">No hay deals recientes</p>
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
              Error conectando con el servidor. Verifica la configuracion de GraphQL.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
