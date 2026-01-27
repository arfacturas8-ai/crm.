'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  isPersonal: boolean;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showPersonal, setShowPersonal] = useState(true);
  const [showGeneral, setShowGeneral] = useState(true);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    isPersonal: false,
  });

  const { openModal, closeModal, addNotification } = useUIStore();
  const { user } = useAuthStore();

  // Fetch events from CalDAV
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        })));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        ((event.isPersonal && showPersonal) || (!event.isPersonal && showGeneral))
      );
    });
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.date) {
      addNotification({ type: 'error', title: 'Error', message: 'Título y fecha son requeridos' });
      return;
    }

    try {
      const response = await fetch('/api/calendar/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          start: `${newEvent.date}T${newEvent.startTime}:00`,
          end: `${newEvent.date}T${newEvent.endTime}:00`,
          location: newEvent.location,
          isPersonal: newEvent.isPersonal,
        }),
      });

      if (response.ok) {
        addNotification({ type: 'success', title: 'Evento creado', message: 'El evento se ha agregado al calendario' });
        closeModal();
        fetchEvents();
        setNewEvent({
          title: '',
          description: '',
          date: '',
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          isPersonal: false,
        });
      } else {
        throw new Error('Error creating event');
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudo crear el evento' });
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-4 lg:space-y-6 bg-white min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500">Agenda general y personal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            className="border-gray-200"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          </Button>
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => openModal('create-event')}
            className="text-xs lg:text-sm"
          >
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Calendar filters */}
      <Card className="p-3 lg:p-4 bg-white border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-general"
              checked={showGeneral}
              onChange={(e) => setShowGeneral(e.target.checked)}
              className="rounded border-gray-300 text-[#8B4513] focus:ring-[#8B4513]"
            />
            <label htmlFor="show-general" className="text-sm text-gray-700 flex items-center gap-1">
              <span className="w-3 h-3 bg-[#8B4513] rounded-full"></span>
              Agenda General
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-personal"
              checked={showPersonal}
              onChange={(e) => setShowPersonal(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show-personal" className="text-sm text-gray-700 flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Mi Agenda Personal
            </label>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="bg-white border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
              <ChevronLeft size={16} />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
              <ChevronRight size={16} />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="border-gray-200 text-xs">
            Hoy
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-2 lg:p-4">
          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square lg:aspect-[4/3]" />;
              }

              const dayEvents = getEventsForDay(date);
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'aspect-square lg:aspect-[4/3] p-1 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                    isCurrentDay && 'bg-[#8B4513]/5 border-[#8B4513]'
                  )}
                  onClick={() => {
                    setSelectedDate(date);
                    setNewEvent(prev => ({
                      ...prev,
                      date: date.toISOString().split('T')[0]
                    }));
                    openModal('create-event');
                  }}
                >
                  <div className={cn(
                    'text-xs lg:text-sm font-medium mb-1',
                    isCurrentDay ? 'text-[#8B4513]' : 'text-gray-700'
                  )}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'text-[10px] lg:text-xs px-1 py-0.5 rounded truncate',
                          event.isPersonal
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-[#8B4513]/10 text-[#8B4513]'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open event details
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-500">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Today's events */}
      <Card className="p-4 bg-white border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CalendarIcon size={16} />
          Eventos de Hoy
        </h3>
        <div className="space-y-2">
          {getEventsForDay(new Date()).length > 0 ? (
            getEventsForDay(new Date()).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'p-3 rounded-lg border-l-4',
                  event.isPersonal
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-[#8B4513]/5 border-[#8B4513]'
                )}
              >
                <p className="font-medium text-gray-900">{event.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {event.start.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} -
                    {event.end.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay eventos programados para hoy</p>
          )}
        </div>
      </Card>

      {/* Create Event Modal */}
      <Modal id="create-event" title="Nuevo Evento" size="md">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              placeholder="Nombre del evento"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="bg-white border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <Input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
              className="bg-white border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <Input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="bg-white border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
              <Input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <Input
              placeholder="Lugar del evento"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              leftIcon={<MapPin size={14} />}
              className="bg-white border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              placeholder="Detalles del evento..."
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-personal"
              checked={newEvent.isPersonal}
              onChange={(e) => setNewEvent(prev => ({ ...prev, isPersonal: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is-personal" className="text-sm text-gray-700">
              Evento personal (solo visible para mí)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="submit">
              Crear Evento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
