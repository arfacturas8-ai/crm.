import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_BASE_URL = 'https://graph.facebook.com';

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleanNumber = phone.replace(/[^0-9]/g, '');

  // Add Costa Rica country code if not present
  if (!cleanNumber.startsWith('506')) {
    cleanNumber = '506' + cleanNumber;
  }

  return cleanNumber;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, type = 'text', template } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (type === 'text' && !message) {
      return NextResponse.json(
        { success: false, error: 'Message is required for text type' },
        { status: 400 }
      );
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp API not configured' },
        { status: 500 }
      );
    }

    const formattedPhone = formatPhoneNumber(to);

    // Build payload based on message type
    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type,
    };

    if (type === 'text') {
      payload.text = { body: message };
    } else if (type === 'template' && template) {
      payload.template = {
        name: template.name,
        language: { code: template.languageCode || 'es' },
        ...(template.parameters && {
          components: [
            {
              type: 'body',
              parameters: template.parameters.map((text: string) => ({
                type: 'text',
                text,
              })),
            },
          ],
        }),
      };
    }

    // Send to WhatsApp API
    const response = await fetch(
      `${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to send WhatsApp message');
    }

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      contacts: result.contacts,
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      },
      { status: 500 }
    );
  }
}
