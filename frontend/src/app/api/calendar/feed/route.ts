import { NextRequest, NextResponse } from 'next/server';

const CALDAV_URL = 'https://habitacr.com/calendar/html/dav.php/calendars/master/habitacr/';
const CALDAV_USER = 'master';
const CALDAV_PASS = process.env.CALDAV_PASSWORD || '';
const FEED_SECRET = process.env.CALENDAR_FEED_SECRET || '';

/**
 * iCalendar Feed Endpoint
 *
 * Supports two feed types via query params:
 *   ?token=<secret>&type=general    — General team calendar (default)
 *   ?token=<secret>&type=personal&agentId=<id> — Personal events for one agent
 *
 * Subscribable from Outlook, Google Calendar, Apple Calendar, etc.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const feedType = searchParams.get('type') || 'general';
  const agentId = searchParams.get('agentId') || '';

  // Validate access token
  if (!token || token !== FEED_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Personal feed requires agentId
  if (feedType === 'personal' && !agentId) {
    return new NextResponse('agentId required for personal feed', { status: 400 });
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
      const calendarDataMatches = xmlData.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/gi) || [];

      for (const match of calendarDataMatches) {
        const icalData = match.replace(/<\/?C:calendar-data[^>]*>/gi, '');
        const decoded = icalData
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');

        const veventMatches = decoded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
        for (const vevent of veventMatches) {
          const isPersonal = /X-PERSONAL:TRUE/i.test(vevent);
          const eventAgentId = vevent.match(/X-AGENT-ID:(.+)/i)?.[1]?.trim() || '';

          if (feedType === 'general') {
            // General feed: only non-personal events
            if (!isPersonal) {
              icsEvents += vevent.trim() + '\r\n';
            }
          } else if (feedType === 'personal') {
            // Personal feed: only personal events belonging to this agent
            if (isPersonal && eventAgentId === agentId) {
              icsEvents += vevent.trim() + '\r\n';
            }
          }
        }
      }
    }

    // Calendar name based on feed type
    const calName = feedType === 'general'
      ? 'HabitaCR - Agenda General'
      : 'HabitaCR - Mi Agenda';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HabitaCR CRM//Calendario//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      'X-WR-TIMEZONE:America/Costa_Rica',
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

    const filename = feedType === 'general'
      ? 'habitacr-general.ics'
      : 'habitacr-personal.ics';

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating calendar feed:', error);
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
