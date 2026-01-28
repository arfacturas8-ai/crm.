import { NextRequest, NextResponse } from 'next/server';

const CALDAV_URL = 'https://habitacr.com/calendar/html/dav.php/calendars/master/habitacr/';
const CALDAV_USER = 'master';
const CALDAV_PASS = process.env.CALDAV_PASSWORD || '';
const FEED_SECRET = process.env.CALENDAR_FEED_SECRET || '';

/**
 * iCalendar Feed Endpoint
 *
 * Serves calendar events in standard iCalendar (.ics) format.
 * This URL can be subscribed to from:
 * - Microsoft Outlook (Add calendar > From internet)
 * - Google Calendar (Other calendars > From URL)
 * - Apple Calendar (File > New Calendar Subscription)
 * - Any CalDAV/iCal compatible client
 *
 * URL format: /api/calendar/feed?token=<secret>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Validate access token
  if (!token || token !== FEED_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Fetch events from CalDAV for a wide range (6 months back, 12 months forward)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 12, 0);

    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '') + 'T000000Z';
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '') + 'T235959Z';

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

    let icsEvents = '';

    if (response.ok) {
      const xmlData = await response.text();
      // Extract raw VEVENT blocks from CalDAV response
      const calendarDataMatches = xmlData.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/gi) || [];

      for (const match of calendarDataMatches) {
        const icalData = match.replace(/<\/?C:calendar-data[^>]*>/gi, '');
        // Decode XML entities
        const decoded = icalData
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');

        // Extract VEVENT blocks
        const veventMatches = decoded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
        for (const vevent of veventMatches) {
          icsEvents += vevent.trim() + '\r\n';
        }
      }
    }

    // Build full iCalendar document
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HabitaCR CRM//Calendario//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:HabitaCR CRM',
      'X-WR-TIMEZONE:America/Costa_Rica',
      // Include VTIMEZONE for Costa Rica
      'BEGIN:VTIMEZONE',
      'TZID:America/Costa_Rica',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:-0600',
      'TZOFFSETTO:-0600',
      'TZNAME:CST',
      'END:STANDARD',
      'END:VTIMEZONE',
      icsEvents,
      'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="habitacr-calendar.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating calendar feed:', error);
    // Return empty calendar on error
    const emptyCalendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HabitaCR CRM//Calendario//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:HabitaCR CRM',
      'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(emptyCalendar, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
      },
    });
  }
}
