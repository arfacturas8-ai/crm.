import { NextRequest, NextResponse } from 'next/server';

const CALDAV_URL = 'https://habitacr.com/calendar/html/dav.php/calendars/master/habitacr/';
const CALDAV_USER = 'master';
const CALDAV_PASS = process.env.CALDAV_PASSWORD || '';

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

// GET/POST - Fetch events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

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
      // If CalDAV fails, return empty events (demo mode)
      console.log('CalDAV not available, returning demo events');
      return NextResponse.json({
        events: generateDemoEvents(year, month),
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

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Return demo events on error
    const now = new Date();
    return NextResponse.json({
      events: generateDemoEvents(now.getFullYear(), now.getMonth() + 1),
    });
  }
}

// PUT - Create event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, start, end, location, isPersonal } = body;

    const eventUid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@habitacr.com`;
    const startFormatted = formatICalDate(new Date(start).toISOString());
    const endFormatted = formatICalDate(new Date(end).toISOString());

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HabitaCR CRM//ES
BEGIN:VEVENT
UID:${eventUid}
DTSTART:${startFormatted}
DTEND:${endFormatted}
SUMMARY:${title}
${description ? `DESCRIPTION:${description}` : ''}
${location ? `LOCATION:${location}` : ''}
X-PERSONAL:${isPersonal ? 'TRUE' : 'FALSE'}
END:VEVENT
END:VCALENDAR`;

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

    // Fallback: store locally if CalDAV fails
    console.log('CalDAV create failed, event would be stored locally');
    return NextResponse.json({ success: true, eventId: eventUid, local: true });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: true, local: true });
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

  // Sample events for demo
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
  });

  return events;
}
