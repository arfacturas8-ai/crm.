import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CALDAV_URL = 'https://habitacr.com/calendar/html/dav.php/calendars/master/habitacr/';
const CALDAV_USER = 'master';
const CALDAV_PASS = process.env.CALDAV_PASSWORD || '';

// Local storage for events when CalDAV is unavailable
const LOCAL_EVENTS_FILE = path.join(process.cwd(), 'data', 'calendar-events.json');

async function getLocalEvents(): Promise<any[]> {
  try {
    const data = await fs.readFile(LOCAL_EVENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLocalEvents(events: any[]): Promise<void> {
  try {
    const dir = path.dirname(LOCAL_EVENTS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_EVENTS_FILE, JSON.stringify(events, null, 2));
  } catch (error) {
    console.error('Error saving local events:', error);
  }
}

// Parse iCalendar format to extract events
function parseICalendar(icalData: string): any[] {
  const events: any[] = [];
  const lines = icalData.split('\n');
  let currentEvent: any = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':');

      if (key === 'UID') {
        currentEvent.id = value;
      } else if (key === 'SUMMARY') {
        currentEvent.title = value;
      } else if (key === 'DESCRIPTION') {
        currentEvent.description = value;
      } else if (key === 'LOCATION') {
        currentEvent.location = value;
      } else if (key.startsWith('DTSTART')) {
        currentEvent.start = parseICalDate(value);
      } else if (key.startsWith('DTEND')) {
        currentEvent.end = parseICalDate(value);
      } else if (key === 'X-PERSONAL') {
        currentEvent.isPersonal = value === 'TRUE';
      } else if (key === 'X-AGENT-ID') {
        currentEvent.agentId = value;
      }
    }
  }

  return events;
}

// Parse iCal date format
function parseICalDate(dateStr: string): string {
  // Handle formats like 20260128T100000 or 20260128T100000Z
  if (dateStr.length >= 15) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
  return dateStr;
}

// Format date for iCalendar
function formatICalDate(dateStr: string): string {
  return dateStr.replace(/[-:]/g, '').replace('.000', '').replace('Z', '');
}

// POST - Fetch events (supports agentId filter for personal events)
export async function POST(request: NextRequest) {
  let year: number;
  let month: number;
  let agentId: string | undefined;

  try {
    const body = await request.json();
    year = body.year;
    month = body.month;
    agentId = body.agentId;

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '') + 'T000000Z';
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '') + 'T235959Z';

    // CalDAV REPORT request to get events
    const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${startStr}" end="${endStr}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

    const response = await fetch(CALDAV_URL, {
      method: 'REPORT',
      headers: {
        'Content-Type': 'application/xml',
        'Depth': '1',
        'Authorization': 'Basic ' + Buffer.from(`${CALDAV_USER}:${CALDAV_PASS}`).toString('base64'),
      },
      body: reportBody,
    });

    if (!response.ok) {
      console.log('CalDAV not available, returning local events');
      const localEvents = await getLocalEvents();
      // Filter events for the requested month
      const filteredLocalEvents = localEvents.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
      });
      return NextResponse.json({
        events: filteredLocalEvents.length > 0 ? filteredLocalEvents : generateDemoEvents(year, month),
      });
    }

    const xmlData = await response.text();

    // Extract calendar-data from XML response
    const calendarDataMatch = xmlData.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/gi) || [];

    const allEvents: any[] = [];
    for (const match of calendarDataMatch) {
      const icalData = match.replace(/<\/?C:calendar-data[^>]*>/gi, '');
      const events = parseICalendar(icalData);
      allEvents.push(...events);
    }

    // If agentId is provided, filter personal events to only show that agent's
    // General events (isPersonal=false) are always visible
    const filteredEvents = agentId
      ? allEvents.filter(e => !e.isPersonal || e.agentId === String(agentId))
      : allEvents;

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Try to return local events on error
    const now = new Date();
    const fallbackYear = year || now.getFullYear();
    const fallbackMonth = month || now.getMonth() + 1;
    const localEvents = await getLocalEvents();
    const filteredLocalEvents = localEvents.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.getFullYear() === fallbackYear && eventDate.getMonth() === fallbackMonth - 1;
    });
    return NextResponse.json({
      events: filteredLocalEvents.length > 0 ? filteredLocalEvents : generateDemoEvents(fallbackYear, fallbackMonth),
    });
  }
}

// PUT - Create event
export async function PUT(request: NextRequest) {
  let body: any = {};

  try {
    body = await request.json();
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, start, end, location, isPersonal, agentId } = body;
  const eventUid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@habitacr.com`;

  // Helper to save event locally
  const saveEventLocally = async () => {
    const localEvent = {
      id: eventUid,
      title,
      description: description || '',
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      location: location || '',
      isPersonal: isPersonal || false,
      agentId: agentId || null,
    };
    const localEvents = await getLocalEvents();
    localEvents.push(localEvent);
    await saveLocalEvents(localEvents);
    return localEvent;
  };

  try {
    const startFormatted = formatICalDate(new Date(start).toISOString());
    const endFormatted = formatICalDate(new Date(end).toISOString());

    // Build optional lines
    const optionalLines: string[] = [];
    if (description) optionalLines.push(`DESCRIPTION:${description}`);
    if (location) optionalLines.push(`LOCATION:${location}`);
    optionalLines.push(`X-PERSONAL:${isPersonal ? 'TRUE' : 'FALSE'}`);
    if (isPersonal && agentId) optionalLines.push(`X-AGENT-ID:${agentId}`);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HabitaCR CRM//ES',
      'BEGIN:VEVENT',
      `UID:${eventUid}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${title}`,
      ...optionalLines,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const response = await fetch(`${CALDAV_URL}${eventUid}.ics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/calendar',
        'Authorization': 'Basic ' + Buffer.from(`${CALDAV_USER}:${CALDAV_PASS}`).toString('base64'),
      },
      body: icsContent,
    });

    if (response.ok || response.status === 201) {
      return NextResponse.json({ success: true, eventId: eventUid });
    }

    // CalDAV failed, store locally
    console.log('CalDAV create failed, storing event locally');
    await saveEventLocally();
    return NextResponse.json({ success: true, eventId: eventUid, local: true });
  } catch (error) {
    console.error('Error creating event:', error);
    // Store locally on error
    if (title) {
      await saveEventLocally();
      return NextResponse.json({ success: true, eventId: eventUid, local: true });
    }
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const response = await fetch(`${CALDAV_URL}${eventId}.ics`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${CALDAV_USER}:${CALDAV_PASS}`).toString('base64'),
      },
    });

    return NextResponse.json({ success: response.ok });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

// Generate demo events for testing
function generateDemoEvents(year: number, month: number): any[] {
  const events = [];
  const today = new Date();

  events.push({
    id: 'demo-1',
    title: 'Reunión de equipo',
    description: 'Revisión semanal del equipo',
    start: new Date(year, month - 1, 15, 10, 0).toISOString(),
    end: new Date(year, month - 1, 15, 11, 0).toISOString(),
    location: 'Oficina HabitaCR',
    isPersonal: false,
  });

  events.push({
    id: 'demo-2',
    title: 'Visita propiedad - Casa Escazú',
    description: 'Mostrar propiedad a cliente potencial',
    start: new Date(year, month - 1, 18, 14, 0).toISOString(),
    end: new Date(year, month - 1, 18, 15, 30).toISOString(),
    location: 'Escazú, San José',
    isPersonal: false,
  });

  events.push({
    id: 'demo-3',
    title: 'Seguimiento cliente Juan',
    description: 'Llamada de seguimiento',
    start: new Date(year, month - 1, today.getDate(), 9, 0).toISOString(),
    end: new Date(year, month - 1, today.getDate(), 9, 30).toISOString(),
    isPersonal: true,
    agentId: 'demo-agent',
  });

  return events;
}
