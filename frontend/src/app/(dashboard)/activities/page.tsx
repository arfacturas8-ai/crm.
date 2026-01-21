'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Circle,
  Phone,
  Users,
  MapPin,
  CheckSquare,
  Mail,
  MessageSquare,
  AlertTriangle,
  Trash2,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import {
  useActivitiesStore,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_PRIORITY_LABELS,
  type Activity,
  type ActivityType,
} from '@/store/activities-store';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { cn, formatDate } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

const ACTIVITY_TYPE_ICONS: Record<ActivityType, any> = {
  call: Phone,
  meeting: Users,
  visit: MapPin,
  task: CheckSquare,
  email: Mail,
  whatsapp: MessageSquare,
  follow_up: Clock,
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ActivitiesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { openModal, closeModal, addNotification } = useUIStore();
  const {
    activities,
    completeActivity,
    deleteActivity,
    getPendingActivities,
    getOverdueActivities,
  } = useActivitiesStore();

  const pendingActivities = getPendingActivities();
  const overdueActivities = getOverdueActivities();

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add days from next month
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.filter((act) => act.dueDate === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleComplete = (activityId: string) => {
    completeActivity(activityId);
    addNotification({
      type: 'success',
      title: 'Actividad completada',
      message: 'La actividad se ha marcado como completada',
    });
  };

  const handleDelete = (activityId: string) => {
    if (confirm('¿Estas seguro de eliminar esta actividad?')) {
      deleteActivity(activityId);
      addNotification({
        type: 'success',
        title: 'Actividad eliminada',
        message: 'La actividad se ha eliminado correctamente',
      });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-amber-500 bg-amber-50';
      case 'low':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Actividades</h1>
          <p className="text-muted-foreground">
            {pendingActivities.length} pendientes
            {overdueActivities.length > 0 && (
              <span className="text-red-500 ml-2">
                ({overdueActivities.length} vencidas)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              onClick={() => setViewMode('list')}
              title="Vista Lista"
            >
              <List size={18} />
            </button>
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'calendar' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              onClick={() => setViewMode('calendar')}
              title="Vista Calendario"
            >
              <CalendarIcon size={18} />
            </button>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal('create-activity')}>
            Nueva Actividad
          </Button>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueActivities.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <h3 className="font-semibold text-red-700">
                {overdueActivities.length} actividad(es) vencida(s)
              </h3>
              <p className="text-sm text-red-600">
                Tienes actividades pendientes que ya pasaron su fecha de vencimiento.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Pending Activities */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                Pendientes ({pendingActivities.length})
              </h2>
            </div>
            <div className="divide-y">
              {pendingActivities.length > 0 ? (
                pendingActivities.map((activity) => {
                  const Icon = ACTIVITY_TYPE_ICONS[activity.type];
                  const isOverdue =
                    activity.dueDate && activity.dueDate < new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 transition-colors',
                        isOverdue && 'bg-red-50/50'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleComplete(activity.id)}
                          className="mt-1 text-gray-300 hover:text-green-500 transition-colors"
                        >
                          <Circle size={20} />
                        </button>

                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            getPriorityColor(activity.priority)
                          )}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{activity.title}</h3>
                              {activity.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  {ACTIVITY_TYPE_LABELS[activity.type]}
                                </span>
                                {activity.dueDate && (
                                  <span
                                    className={cn(
                                      'flex items-center gap-1',
                                      isOverdue && 'text-red-500 font-medium'
                                    )}
                                  >
                                    <CalendarIcon size={14} />
                                    {formatDate(activity.dueDate)}
                                    {activity.dueTime && ` ${activity.dueTime}`}
                                  </span>
                                )}
                                {activity.leadName && (
                                  <span className="flex items-center gap-1">
                                    <User size={14} />
                                    {activity.leadName}
                                  </span>
                                )}
                                {activity.dealTitle && (
                                  <span className="flex items-center gap-1">
                                    <Building2 size={14} />
                                    {activity.dealTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  activity.priority === 'high'
                                    ? 'lost'
                                    : activity.priority === 'medium'
                                    ? 'active'
                                    : 'won'
                                }
                              >
                                {ACTIVITY_PRIORITY_LABELS[activity.priority]}
                              </Badge>
                              <button
                                onClick={() => handleDelete(activity.id)}
                                className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                  <p>No tienes actividades pendientes</p>
                </div>
              )}
            </div>
          </Card>

          {/* Completed Activities */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                Completadas (
                {activities.filter((a) => a.status === 'completed').length})
              </h2>
            </div>
            <div className="divide-y">
              {activities
                .filter((a) => a.status === 'completed')
                .slice(0, 10)
                .map((activity) => {
                  const Icon = ACTIVITY_TYPE_ICONS[activity.type];
                  return (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-gray-50 transition-colors opacity-60"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-green-500">
                          <CheckCircle size={20} />
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon size={20} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium line-through">{activity.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Completada el {formatDate(activity.completedAt || '')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="p-0 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayActivities = getActivitiesForDate(day.date);
              const hasOverdue = dayActivities.some(
                (a) =>
                  a.status === 'pending' &&
                  a.dueDate &&
                  a.dueDate < new Date().toISOString().split('T')[0]
              );

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[100px] p-2 border-r border-b last:border-r-0',
                    !day.isCurrentMonth && 'bg-gray-50 text-gray-400',
                    isToday(day.date) && 'bg-[#8B4513]/5'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isToday(day.date) &&
                        'w-6 h-6 bg-[#8B4513] text-white rounded-full flex items-center justify-center'
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => {
                      const Icon = ACTIVITY_TYPE_ICONS[activity.type];
                      return (
                        <div
                          key={activity.id}
                          className={cn(
                            'text-xs p-1 rounded flex items-center gap-1 truncate cursor-pointer hover:opacity-80',
                            activity.status === 'completed'
                              ? 'bg-gray-100 text-gray-400 line-through'
                              : getPriorityColor(activity.priority)
                          )}
                          onClick={() => {
                            setSelectedActivity(activity);
                            openModal('view-activity');
                          }}
                        >
                          <Icon size={12} />
                          <span className="truncate">{activity.title}</span>
                        </div>
                      );
                    })}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayActivities.length - 3} mas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create Activity Modal */}
      <Modal id="create-activity" title="Nueva Actividad" size="lg">
        <ActivityForm onSuccess={() => closeModal()} />
      </Modal>

      {/* View Activity Modal */}
      <Modal id="view-activity" title="Detalle de Actividad" size="md">
        {selectedActivity && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = ACTIVITY_TYPE_ICONS[selectedActivity.type];
                return (
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      getPriorityColor(selectedActivity.priority)
                    )}
                  >
                    <Icon size={24} />
                  </div>
                );
              })()}
              <div>
                <h3 className="font-semibold text-lg">{selectedActivity.title}</h3>
                <p className="text-sm text-gray-500">
                  {ACTIVITY_TYPE_LABELS[selectedActivity.type]}
                </p>
              </div>
            </div>

            {selectedActivity.description && (
              <p className="text-gray-600">{selectedActivity.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedActivity.dueDate && (
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium">
                    {formatDate(selectedActivity.dueDate)}
                    {selectedActivity.dueTime && ` a las ${selectedActivity.dueTime}`}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Prioridad:</span>
                <p className="font-medium">
                  {ACTIVITY_PRIORITY_LABELS[selectedActivity.priority]}
                </p>
              </div>
              {selectedActivity.leadName && (
                <div>
                  <span className="text-gray-500">Lead:</span>
                  <p className="font-medium">{selectedActivity.leadName}</p>
                </div>
              )}
              {selectedActivity.dealTitle && (
                <div>
                  <span className="text-gray-500">Deal:</span>
                  <p className="font-medium">{selectedActivity.dealTitle}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedActivity.status === 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleComplete(selectedActivity.id);
                    closeModal();
                  }}
                  leftIcon={<CheckCircle size={16} />}
                >
                  Marcar Completada
                </Button>
              )}
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => {
                  handleDelete(selectedActivity.id);
                  closeModal();
                }}
                leftIcon={<Trash2 size={16} />}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
