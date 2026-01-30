import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * SMTP Configuration for HabitaCR Email System
 *
 * For the email system to work correctly, configure these environment variables:
 *
 * MAIN ACCOUNT (for system emails):
 * - SMTP_HOST=smtp.hostinger.com
 * - SMTP_PORT=465
 * - SMTP_USER=info@habitacr.com
 * - SMTP_PASSWORD=<your-password>
 * - EMAIL_FROM="HabitaCR" <info@habitacr.com>
 *
 * AGENT-SPECIFIC ACCOUNTS:
 * Each agent can have their own email configured:
 * - SMTP_USER_<AGENT_ID>=agent1@habitacr.com
 * - SMTP_PASSWORD_<AGENT_ID>=<agent1-password>
 *
 * Example for agent ID 5:
 * - SMTP_USER_5=carlos@habitacr.com
 * - SMTP_PASSWORD_5=<carlos-password>
 */

// Default SMTP Configuration (fallback)
const DEFAULT_SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // Use SSL/TLS for port 465
  auth: {
    user: process.env.SMTP_USER || 'info@habitacr.com',
    pass: process.env.SMTP_PASSWORD,
  },
};

// Get SMTP config for a specific agent
function getAgentSmtpConfig(agentId?: string): typeof DEFAULT_SMTP_CONFIG {
  if (!agentId) return DEFAULT_SMTP_CONFIG;

  const agentUser = process.env[`SMTP_USER_${agentId}`];
  const agentPass = process.env[`SMTP_PASSWORD_${agentId}`];

  if (agentUser && agentPass) {
    return {
      ...DEFAULT_SMTP_CONFIG,
      auth: {
        user: agentUser,
        pass: agentPass,
      },
    };
  }

  return DEFAULT_SMTP_CONFIG;
}

// Email template with HabitaCR branding
function getEmailTemplate(body: string, subject: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #8B4513; padding: 30px; text-align: center;">
                  <img src="https://habitacr.com/wp-content/uploads/2024/habita-logo.jpg" alt="HabitaCR" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">HabitaCR</h1>
                  <p style="color: #e0ccb0; margin: 5px 0 0 0; font-size: 14px;">Bienes Raices Costa Rica</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                    ${body.replace(/\n/g, '<br>')}
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #faf5f0; padding: 30px; text-align: center; border-top: 1px solid #e0ccb0;">
                  <p style="color: #8B4513; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">HabitaCR - CRM Inmobiliario</p>
                  <p style="color: #666666; margin: 0; font-size: 12px;">
                    <a href="https://www.habitacr.com" style="color: #8B4513; text-decoration: none;">www.habitacr.com</a>
                  </p>
                  <p style="color: #999999; margin: 15px 0 0 0; font-size: 11px;">
                    Este correo fue enviado desde el sistema CRM de HabitaCR.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, html, text, from, replyTo, leadId, agentId } = body;

    // Validate required fields
    if (!to || !subject || (!html && !text && !emailBody)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and body/html/text' },
        { status: 400 }
      );
    }

    // Get SMTP config (agent-specific if provided, otherwise default)
    const smtpConfig = getAgentSmtpConfig(agentId);

    // Check for SMTP password
    if (!smtpConfig.auth.pass) {
      console.error('SMTP_PASSWORD environment variable not set for', agentId || 'default');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create transporter with appropriate settings
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Unable to connect to email server' },
        { status: 500 }
      );
    }

    // Prepare email content
    const emailHtml = html || getEmailTemplate(emailBody || text, subject);
    const emailText = text || emailBody;

    // Determine the from address (use agent's email if configured)
    const fromAddress = from || `"HabitaCR" <${smtpConfig.auth.user}>`;
    const replyToAddress = replyTo || smtpConfig.auth.user;

    // Send email
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html: emailHtml,
      text: emailText,
      replyTo: replyToAddress,
    });

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    );
  }
}
