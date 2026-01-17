// WhatsApp Business API Integration

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body' | 'header';
      parameters: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string = 'v18.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleanNumber = phone.replace(/[^0-9]/g, '');

    // Add Costa Rica country code if not present
    if (!cleanNumber.startsWith('506')) {
      cleanNumber = '506' + cleanNumber;
    }

    return cleanNumber;
  }

  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse> {
    const formattedPhone = this.formatPhoneNumber(to);

    const payload: WhatsAppMessage = {
      to: formattedPhone,
      type: 'text',
      text: {
        body: message,
      },
    };

    return this.sendMessage(payload);
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'es',
    parameters?: string[]
  ): Promise<WhatsAppResponse> {
    const formattedPhone = this.formatPhoneNumber(to);

    const payload: WhatsAppMessage = {
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        ...(parameters && {
          components: [
            {
              type: 'body',
              parameters: parameters.map((text) => ({
                type: 'text' as const,
                text,
              })),
            },
          ],
        }),
      },
    };

    return this.sendMessage(payload);
  }

  private async sendMessage(payload: WhatsAppMessage): Promise<WhatsAppResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...payload,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send WhatsApp message');
    }

    return response.json();
  }

  // Pre-defined message templates
  async sendWelcomeMessage(to: string, name: string): Promise<WhatsAppResponse> {
    const message = `¡Hola ${name}! 👋

Gracias por contactarnos. Un asesor se comunicará contigo pronto para ayudarte con tu búsqueda de propiedades.

Si tienes alguna pregunta, no dudes en escribirnos.

Saludos cordiales,
Equipo de Ventas`;

    return this.sendTextMessage(to, message);
  }

  async sendFollowUpMessage(to: string, name: string): Promise<WhatsAppResponse> {
    const message = `¡Hola ${name}!

Te escribimos para dar seguimiento a tu interés en nuestras propiedades.

¿Te gustaría agendar una cita para visitar alguna propiedad?

Quedamos a tus órdenes.`;

    return this.sendTextMessage(to, message);
  }

  async sendVisitReminderMessage(to: string, name: string, date: string, address: string): Promise<WhatsAppResponse> {
    const message = `¡Hola ${name}!

Te recordamos tu cita de visita programada:

📅 Fecha: ${date}
📍 Dirección: ${address}

¿Confirmas tu asistencia?

Responde SÍ para confirmar o escríbenos si necesitas reprogramar.`;

    return this.sendTextMessage(to, message);
  }

  async sendPropertyInfoMessage(to: string, name: string, propertyInfo: string, link?: string): Promise<WhatsAppResponse> {
    let message = `¡Hola ${name}!

Te compartimos información sobre la propiedad:

${propertyInfo}`;

    if (link) {
      message += `\n\n🔗 Ver más detalles: ${link}`;
    }

    message += '\n\n¿Te gustaría agendar una visita?';

    return this.sendTextMessage(to, message);
  }
}

export const whatsappService = new WhatsAppService();

// Helper function to generate WhatsApp web link
export function getWhatsAppWebLink(phone: string, message?: string): string {
  let cleanNumber = phone.replace(/[^0-9]/g, '');

  // Add Costa Rica country code if not present
  if (!cleanNumber.startsWith('506')) {
    cleanNumber = '506' + cleanNumber;
  }

  const baseUrl = `https://wa.me/${cleanNumber}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
}

// Message templates for quick send
export const MESSAGE_TEMPLATES = {
  welcome: {
    id: 'welcome',
    name: 'Bienvenida',
    preview: '¡Hola [nombre]! Gracias por contactarnos...',
    variables: ['name'],
  },
  followUp: {
    id: 'followUp',
    name: 'Seguimiento',
    preview: '¡Hola [nombre]! Te escribimos para dar seguimiento...',
    variables: ['name'],
  },
  visitReminder: {
    id: 'visitReminder',
    name: 'Recordatorio de visita',
    preview: '¡Hola [nombre]! Te recordamos tu cita de visita...',
    variables: ['name', 'date', 'address'],
  },
  propertyInfo: {
    id: 'propertyInfo',
    name: 'Información de propiedad',
    preview: '¡Hola [nombre]! Te compartimos información...',
    variables: ['name', 'propertyInfo', 'link'],
  },
} as const;
