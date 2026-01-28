import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to fetch an external Outlook/iCalendar URL.
 * This avoids CORS issues when fetching .ics feeds from the browser.
 *
 * POST /api/calendar/outlook
 * Body: { url: "https://outlook.office365.com/owa/calendar/..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation — must be https and look like a calendar URL
    if (!url.startsWith('https://')) {
      return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar, text/plain',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch calendar', status: response.status },
        { status: 502 }
      );
    }

    const icsText = await response.text();
    const events = parseICSEvents(icsText);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching Outlook calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}

function parseICSEvents(icsText: string): any[] {
  const events: any[] = [];
  const blocks = icsText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  for (const block of blocks) {
    const event: any = { isPersonal: true };
    const lines = unfoldICSLines(block.split(/\r?\n/));

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const keyPart = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);
      const key = keyPart.split(';')[0]; // strip parameters like DTSTART;TZID=...

      switch (key) {
        case 'UID':
          event.id = `outlook-${value}`;
          break;
        case 'SUMMARY':
          event.title = unescapeICS(value);
          break;
        case 'DESCRIPTION':
          event.description = unescapeICS(value);
          break;
        case 'LOCATION':
          event.location = unescapeICS(value);
          break;
        case 'DTSTART':
          event.start = parseICSDate(value);
          break;
        case 'DTEND':
          event.end = parseICSDate(value);
          break;
      }
    }

    // Only include events with at least a title and start date
    if (event.title && event.start) {
      if (!event.end) event.end = event.start;
      if (!event.id) event.id = `outlook-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      events.push(event);
    }
  }

  return events;
}

// Unfold wrapped lines (RFC 5545: lines starting with space/tab are continuations)
function unfoldICSLines(lines: string[]): string[] {
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.substring(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseICSDate(dateStr: string): string {
  // Handle: 20260215T100000Z, 20260215T100000, 20260215
  const clean = dateStr.trim();

  if (clean.length >= 15) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    const hour = clean.substring(9, 11);
    const minute = clean.substring(11, 13);
    const second = clean.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  } else if (clean.length >= 8) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00`;
  }

  return dateStr;
}

function unescapeICS(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
