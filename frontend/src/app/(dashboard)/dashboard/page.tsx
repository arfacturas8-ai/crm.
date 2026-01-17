'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Users,
  Kanban,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  UserPlus,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime, getWhatsAppLink, formatPhoneDisplay } from '@/lib/utils';
import { LEAD_SOURCE_LABELS, DEAL_GROUP_LABELS } from '@/types';

// Dashboard stats query
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalLeads
      newLeadsToday
      activeDeals
      wonDeals
      lostDeals
      pendingEnquiries
    }
    recentLeads: leads(first: 5, where: { orderby: { field: CREATED_AT, order: DESC } }) {
      nodes {
        id
        name
        email
        mobile
        source
        createdAt
      }
    }
    recentDeals: deals(first: 5, where: { orderby: { field: UPDATED_AT, order: DESC } }) {
      nodes {
        id
        leadName
        leadMobile
        group
        busca
        updatedAt
      }
    }
  }
`;

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    trend === 'up' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, loading } = useQuery(GET_DASHBOARD_STATS);

  // Mock data for initial rendering
  const stats = data?.dashboardStats || {
    totalLeads: 0,
    newLeadsToday: 0,
    activeDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    pendingEnquiries: 0,
  };

  const recentLeads = data?.recentLeads?.nodes || [];
  const recentDeals = data?.recentDeals?.nodes || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend="up"
          trendValue="+12%"
          color="primary"
        />
        <StatCard
          title="Nuevos Hoy"
          value={stats.newLeadsToday}
          icon={UserPlus}
          color="success"
        />
        <StatCard
          title="Deals Activos"
          value={stats.activeDeals}
          icon={Kanban}
          color="warning"
        />
        <StatCard
          title="Clientes Potenciales"
          value={stats.wonDeals}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Leads Recientes</CardTitle>
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {lead.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS] || lead.source}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.mobile && (
                        <a
                          href={getWhatsAppLink(lead.mobile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-icon"
                        >
                          <MessageSquare size={16} />
                        </a>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(lead.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay leads recientes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Deals Recientes</CardTitle>
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDeals.length > 0 ? (
              <div className="space-y-3">
                {recentDeals.map((deal: any) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Kanban className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{deal.leadName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {deal.busca}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay deals recientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Nuevo Lead</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Kanban className="w-5 h-5" />
              <span>Nuevo Deal</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Enviar WhatsApp</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Phone className="w-5 h-5" />
              <span>Registrar Llamada</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
