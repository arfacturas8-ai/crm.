// Email Service Integration

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private apiEndpoint: string;

  constructor() {
    // Using API route for server-side email sending
    this.apiEndpoint = '/api/email/send';
  }

  async send(options: EmailOptions): Promise<EmailResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      return response.json();
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Pre-defined email templates
  async sendWelcomeEmail(to: string, name: string): Promise<EmailResponse> {
    return this.send({
      to,
      subject: '¡Bienvenido! Gracias por contactarnos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Hola ${name}!</h1>
          <p>Gracias por contactarnos. Hemos recibido tu información y un asesor se comunicará contigo pronto para ayudarte con tu búsqueda de propiedades.</p>
          <p>Si tienes alguna pregunta, no dudes en responder a este correo.</p>
          <br>
          <p>Saludos cordiales,<br><strong>Equipo de Ventas</strong></p>
        </div>
      `,
    });
  }

  async sendFollowUpEmail(to: string, name: string): Promise<EmailResponse> {
    return this.send({
      to,
      subject: 'Seguimiento - ¿Cómo podemos ayudarte?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Hola ${name}!</h1>
          <p>Te escribimos para dar seguimiento a tu interés en nuestras propiedades.</p>
          <p>¿Te gustaría agendar una cita para visitar alguna propiedad? Estamos aquí para ayudarte.</p>
          <br>
          <p>Quedamos a tus órdenes.</p>
          <p>Saludos,<br><strong>Equipo de Ventas</strong></p>
        </div>
      `,
    });
  }

  async sendVisitReminderEmail(
    to: string,
    name: string,
    date: string,
    time: string,
    address: string
  ): Promise<EmailResponse> {
    return this.send({
      to,
      subject: `Recordatorio: Visita programada - ${date}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Hola ${name}!</h1>
          <p>Te recordamos tu cita de visita programada:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Hora:</strong> ${time}</p>
            <p style="margin: 5px 0;"><strong>📍 Dirección:</strong> ${address}</p>
          </div>
          <p>Si necesitas reprogramar, por favor contáctanos con anticipación.</p>
          <br>
          <p>¡Te esperamos!</p>
          <p>Saludos,<br><strong>Equipo de Ventas</strong></p>
        </div>
      `,
    });
  }

  async sendPropertyInfoEmail(
    to: string,
    name: string,
    propertyTitle: string,
    propertyDetails: string,
    propertyLink?: string,
    propertyImage?: string
  ): Promise<EmailResponse> {
    return this.send({
      to,
      subject: `Información de propiedad: ${propertyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Hola ${name}!</h1>
          <p>Te compartimos información sobre la propiedad que te interesa:</p>

          ${propertyImage ? `<img src="${propertyImage}" alt="${propertyTitle}" style="width: 100%; max-width: 500px; border-radius: 8px; margin: 20px 0;">` : ''}

          <h2 style="color: #1e40af;">${propertyTitle}</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${propertyDetails}
          </div>

          ${propertyLink ? `<a href="${propertyLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Ver más detalles</a>` : ''}

          <p>¿Te gustaría agendar una visita? Responde a este correo o contáctanos.</p>
          <br>
          <p>Saludos,<br><strong>Equipo de Ventas</strong></p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    id: 'welcome',
    name: 'Bienvenida',
    subject: '¡Bienvenido! Gracias por contactarnos',
    variables: ['name'],
  },
  followUp: {
    id: 'followUp',
    name: 'Seguimiento',
    subject: 'Seguimiento - ¿Cómo podemos ayudarte?',
    variables: ['name'],
  },
  visitReminder: {
    id: 'visitReminder',
    name: 'Recordatorio de visita',
    subject: 'Recordatorio: Visita programada',
    variables: ['name', 'date', 'time', 'address'],
  },
  propertyInfo: {
    id: 'propertyInfo',
    name: 'Información de propiedad',
    subject: 'Información de propiedad',
    variables: ['name', 'propertyTitle', 'propertyDetails', 'propertyLink', 'propertyImage'],
  },
} as const;
