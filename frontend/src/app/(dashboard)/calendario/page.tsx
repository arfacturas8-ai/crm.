'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  RefreshCw,
  Link,
  Check,
  Copy,
  ExternalLink,
  X,
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
  isPersonal?: boolean;
  source: 'general' | 'outlook';
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const OUTLOOK_URL_KEY = 'habitacr_outlook_url';

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [generalEvents, setGeneralEvents] = useState<CalendarEvent[]>([]);
  const [outlookEvents, setOutlookEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOutlook, setLoadingOutlook] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showGeneral, setShowGeneral] = useState(true);
  const [showPersonal, setShowPersonal] = useState(true);

  // Outlook connection
  const [showOutlookSetup, setShowOutlookSetup] = useState(false);
  const [outlookUrl, setOutlookUrl] = useState('');
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookUrlInput, setOutlookUrlInput] = useState('');
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Event creation
  const [eventType, setEventType] = useState<'general' | 'personal'>('personal');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
  });

  const { openModal, closeModal, addNotification } = useUIStore();
  const { user, isAdmin } = useAuthStore();
  const userIsAdmin = isAdmin();

  // Load saved Outlook URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(OUTLOOK_URL_KEY);
    if (savedUrl) {
      setOutlookUrl(savedUrl);
      setOutlookUrlInput(savedUrl);
      setOutlookConnected(true);
    }
  }, []);

  // Fetch general events from CalDAV
  const fetchGeneralEvents = useCallback(async () => {
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
        setGeneralEvents(data.events.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
          source: 'general' as const,
          isPersonal: false,
        })));
      }
    } catch (error) {
      console.error('Error fetching general events:', error);
    }
  }, [currentDate]);

  // Fetch Outlook events via proxy
  const fetchOutlookEvents = useCallback(async () => {
    if (!outlookUrl) return;

    setLoadingOutlook(true);
    try {
      const response = await fetch('/api/calendar/outlook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: outlookUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setOutlookEvents(data.events.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
          source: 'outlook' as const,
          isPersonal: true,
        })));
      } else {
        console.error('Failed to fetch Outlook events');
      }
    } catch (error) {
      console.error('Error fetching Outlook events:', error);
    } finally {
      setLoadingOutlook(false);
    }
  }, [outlookUrl]);

  // General feed URL (for subscribing in Outlook)
  const feedToken = process.env.NEXT_PUBLIC_CALENDAR_FEED_TOKEN || '';
  const generalFeedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/feed?token=${feedToken}&type=general`
    : '';

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(generalFeedUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generalFeedUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedFeed(true);
    addNotification({ type: 'success', title: 'Copiado', message: 'URL de la agenda general copiada' });
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  // Fetch both on mount and month change
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchGeneralEvents(),
      outlookUrl ? fetchOutlookEvents() : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [currentDate.getMonth(), currentDate.getFullYear(), fetchGeneralEvents, fetchOutlookEvents, outlookUrl]);

  // Combined events
  const allEvents = [
    ...(showGeneral ? generalEvents : []),
    ...(showPersonal ? outlookEvents : []),
  ];

  // Save Outlook URL
  const handleConnectOutlook = () => {
    if (!outlookUrlInput.trim()) {
      addNotification({ type: 'error', title: 'Error', message: 'Ingrese la URL del calendario de Outlook' });
      return;
    }
    if (!outlookUrlInput.startsWith('https://')) {
      addNotification({ type: 'error', title: 'Error', message: 'La URL debe empezar con https://' });
      return;
    }

    localStorage.setItem(OUTLOOK_URL_KEY, outlookUrlInput.trim());
    setOutlookUrl(outlookUrlInput.trim());
    setOutlookConnected(true);
    setShowOutlookSetup(false);
    addNotification({ type: 'success', title: 'Outlook conectado', message: 'Su calendario de Outlook se ha vinculado correctamente' });

    // Fetch immediately
    fetchOutlookEvents();
  };

  const handleDisconnectOutlook = () => {
    localStorage.removeItem(OUTLOOK_URL_KEY);
    setOutlookUrl('');
    setOutlookUrlInput('');
    setOutlookConnected(false);
    setOutlookEvents([]);
    addNotification({ type: 'success', title: 'Desconectado', message: 'Se ha desvinculado el calendario de Outlook' });
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([
      fetchGeneralEvents(),
      outlookUrl ? fetchOutlookEvents() : Promise.resolve(),
    ]).finally(() => setLoading(false));
  };

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

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startingDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return allEvents.filter(event => {
      const d = new Date(event.start);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Create event (general goes to CalDAV)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.date) {
      addNotification({ type: 'error', title: 'Error', message: 'Título y fecha son requeridos' });
      return;
    }

    if (eventType === 'general' && !userIsAdmin) {
      addNotification({ type: 'error', title: 'Sin permisos', message: 'Solo administradores pueden crear eventos generales' });
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
          isPersonal: false,
        }),
      });

      if (response.ok) {
        addNotification({ type: 'success', title: 'Evento creado', message: 'El evento se ha agregado a la agenda general' });
        closeModal();
        fetchGeneralEvents();
        setNewEvent({ title: '', description: '', date: '', startTime: '09:00', endTime: '10:00', location: '' });
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
            onClick={() => setShowOutlookSetup(!showOutlookSetup)}
            className={cn(
              'border-gray-200 text-xs lg:text-sm',
              outlookConnected && 'border-green-300 text-green-700'
            )}
          >
            {outlookConnected ? <Check size={14} className="mr-1" /> : <Link size={14} className="mr-1" />}
            <span className="hidden sm:inline">{outlookConnected ? 'Outlook conectado' : 'Conectar Outlook'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-gray-200"
          >
            <RefreshCw size={14} className={cn((loading || loadingOutlook) && 'animate-spin')} />
          </Button>
          {userIsAdmin && (
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => openModal('create-event')}
              className="text-xs lg:text-sm"
            >
              Nuevo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Outlook Sync Panel — two-way setup */}
      {showOutlookSetup && (
        <Card className="p-4 lg:p-5 bg-white border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ExternalLink size={16} />
              Sincronizar con Outlook
            </h3>
            <button
              onClick={() => setShowOutlookSetup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Configure la sincronización en dos pasos para que ambos calendarios se mantengan actualizados.
          </p>

          <div className="space-y-5">
            {/* STEP 1: Outlook → CRM */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-[#a0522d] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <h4 className="text-sm font-medium text-gray-900">
                  Outlook → CRM <span className="text-gray-400 font-normal">(ver su agenda personal aquí)</span>
                </h4>
                {outlookConnected && <Check size={14} className="text-green-600 ml-auto" />}
              </div>

              {outlookConnected ? (
                <div>
                  <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded border border-green-200">
                    <Check size={14} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-800">Conectado — sus eventos de Outlook se muestran en el CRM.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={outlookUrl}
                      className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 font-mono truncate"
                    />
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="border-gray-200 text-xs">
                      <RefreshCw size={12} className="mr-1" />
                      Sincronizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnectOutlook} className="border-red-200 text-red-600 hover:bg-red-50 text-xs">
                      Desvincular
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Pegue la URL ICS de su calendario de Outlook para ver esos eventos aquí.
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="url"
                      placeholder="https://outlook.office365.com/owa/calendar/..."
                      value={outlookUrlInput}
                      onChange={(e) => setOutlookUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                    <Button size="sm" onClick={handleConnectOutlook}>
                      Conectar
                    </Button>
                  </div>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      ¿Cómo obtener la URL de Outlook?
                    </summary>
                    <ol className="mt-2 space-y-1 list-decimal list-inside">
                      <li>Abra <strong>Outlook</strong> (web: outlook.office.com)</li>
                      <li>Vaya a <strong>Configuración</strong> (engranaje)</li>
                      <li>Busque <strong>Calendario</strong> &gt; <strong>Calendarios compartidos</strong></li>
                      <li>En &quot;Publicar un calendario&quot;, seleccione su calendario</li>
                      <li>Elija permisos y click &quot;Publicar&quot;</li>
                      <li>Copie el enlace <strong>ICS</strong> y péguelo arriba</li>
                    </ol>
                  </details>
                </div>
              )}
            </div>

            {/* STEP 2: CRM → Outlook */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-[#8B4513] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <h4 className="text-sm font-medium text-gray-900">
                  CRM → Outlook <span className="text-gray-400 font-normal">(ver agenda general en Outlook)</span>
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Suscríbase a esta URL en Outlook para que los eventos generales del equipo aparezcan en su Outlook automáticamente.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  readOnly
                  value={generalFeedUrl}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate"
                />
                <Button variant="outline" size="sm" onClick={copyFeedUrl} className="border-gray-200 shrink-0">
                  {copiedFeed ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span className="ml-1 text-xs">{copiedFeed ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  ¿Cómo suscribirse en Outlook?
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Copie la URL de arriba</li>
                  <li>En <strong>Outlook</strong>, vaya a <strong>Calendario</strong></li>
                  <li>Click <strong>&quot;Agregar calendario&quot;</strong> &gt; <strong>&quot;Desde Internet&quot;</strong></li>
                  <li>Pegue la URL y click <strong>&quot;Aceptar&quot;</strong></li>
                  <li>Los eventos generales aparecerán en Outlook automáticamente</li>
                </ol>
              </details>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-[#8B4513]/5 rounded-lg border border-[#8B4513]/10">
            <p className="text-xs text-gray-700">
              <strong>Resultado:</strong> Al completar ambos pasos, verá todos los eventos en un solo lugar —
              tanto en el CRM como en Outlook. Los eventos generales creados por admins se sincronizan a Outlook,
              y sus eventos personales de Outlook se muestran aquí.
            </p>
          </div>
        </Card>
      )}

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
              className="rounded border-gray-300 text-[#8B4513] focus:ring-[#8B4513]"
            />
            <label htmlFor="show-personal" className="text-sm text-gray-700 flex items-center gap-1">
              <span className="w-3 h-3 bg-[#a0522d] rounded-full"></span>
              Mi Agenda Personal
              {!outlookConnected && (
                <span className="text-[10px] text-gray-400 ml-1">(Conecte Outlook)</span>
              )}
            </label>
          </div>
          {outlookConnected && outlookEvents.length > 0 && (
            <span className="text-xs text-gray-400">
              {outlookEvents.length} evento{outlookEvents.length !== 1 ? 's' : ''} de Outlook
            </span>
          )}
        </div>
      </Card>

      {/* Calendar */}
      <Card className="bg-white border-gray-200 overflow-hidden">
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

        <div className="p-2 lg:p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

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
                    if (userIsAdmin) {
                      setSelectedDate(date);
                      setNewEvent(prev => ({
                        ...prev,
                        date: date.toISOString().split('T')[0]
                      }));
                      openModal('create-event');
                    }
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
                          event.source === 'outlook'
                            ? 'bg-[#a0522d]/10 text-[#a0522d]'
                            : 'bg-[#8B4513]/10 text-[#8B4513]'
                        )}
                        onClick={(e) => e.stopPropagation()}
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
                  event.source === 'outlook'
                    ? 'bg-[#a0522d]/5 border-[#a0522d]'
                    : 'bg-[#8B4513]/5 border-[#8B4513]'
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    event.source === 'outlook'
                      ? 'bg-[#a0522d]/10 text-[#a0522d]'
                      : 'bg-[#8B4513]/10 text-[#8B4513]'
                  )}>
                    {event.source === 'outlook' ? 'Outlook' : 'General'}
                  </span>
                </div>
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

      {/* Create Event Modal (General only — admins) */}
      <Modal id="create-event" title="Nuevo Evento (Agenda General)" size="md">
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

          <p className="text-xs text-gray-500">
            Este evento será visible para todo el equipo en la agenda general.
          </p>

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
