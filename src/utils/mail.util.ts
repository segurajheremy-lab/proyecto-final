import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body content */
  html: string;
  /** Plain-text fallback body (optional) */
  text?: string;
}

// ---------------------------------------------------------------------------
// Transporter factory (lazy singleton)
// ---------------------------------------------------------------------------

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.MAIL_HOST,
      port: config.MAIL_PORT,
      secure: config.MAIL_PORT === 465, // true for port 465, false for others
      auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASS,
      },
    });
  }
  return _transporter;
}

// Exposed for testing purposes
export function _setTransporter(transporter: Transporter): void {
  _transporter = transporter;
}

export function _resetTransporter(): void {
  _transporter = null;
}

// ---------------------------------------------------------------------------
// sendMail
// ---------------------------------------------------------------------------

/**
 * Sends a transactional email using the configured Nodemailer transporter.
 *
 * @param options - Recipient, subject, and body content
 * @throws Error with the original SMTP error message if delivery fails
 */
export async function sendMail(options: MailOptions): Promise<void> {
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: config.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    const smtpMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send email: ${smtpMessage}`);
  }
}
