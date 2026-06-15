// Centralized email sending via Gmail SMTP (nodemailer).
// Each function is a fire-and-forget: failures are logged, never thrown,
// so a Gmail hiccup can't take down a booking flow.

import nodemailer, { type Transporter } from 'nodemailer';
import { formatPHP } from './rates';

type BaseArgs = {
  bookingId: string;
  to: string;          // customer email
  name: string;
  unitName: string;
  unitAddress?: string; // e.g. "Avida Towers Riala, IT Park..."
  unitLocation?: string; // e.g. "Tower 5, Floor 24, Room 2421"
  checkIn: string;     // YYYY-MM-DD
  checkOut: string;
  totalAmount: number;
};

type ReceivedArgs = BaseArgs & {
  paymentOption: 'reservation' | 'full';
  reservationFee: number;
  balanceDue: number;
};

type ConfirmedArgs = ReceivedArgs;

const BRAND_COLOR = '#41224A';
const BRAND_NAME  = 'ASL Cozy Living';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function magicLink(bookingId: string, email: string): string {
  return `${siteUrl()}/my-booking?id=${encodeURIComponent(bookingId)}&email=${encodeURIComponent(email)}`;
}

function layout(opts: {
  heading: string;
  intro: string;
  bodyHTML: string;
  bookingId: string;
  email: string;
}): string {
  const link = magicLink(opts.bookingId, opts.email);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f1f1f;">
      <div style="background: ${BRAND_COLOR}; color: white; padding: 18px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.5px;">${BRAND_NAME}</h1>
      </div>
      <div style="background: #fefefe; border: 1px solid #d6e0e7; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 8px; color: ${BRAND_COLOR}; font-size: 22px;">${opts.heading}</h2>
        <p style="margin: 0 0 16px; color: #555; font-size: 14px;">${opts.intro}</p>
        ${opts.bodyHTML}
        <div style="margin-top: 24px; text-align: center;">
          <a href="${link}" style="display: inline-block; background: ${BRAND_COLOR}; color: white;
            text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; font-size: 14px;">
            View my booking
          </a>
        </div>
        <p style="margin: 24px 0 0; color: #888; font-size: 12px; text-align: center;">
          Booking ID: <code style="background: #f5f9fb; padding: 2px 6px; border-radius: 4px;">${opts.bookingId}</code>
        </p>
        <p style="margin: 8px 0 0; color: #aaa; font-size: 11px; text-align: center;">
          You can also visit ${siteUrl()}/my-booking and enter the ID + this email address.
        </p>
      </div>
    </div>
  `;
}

function detailsTable(args: BaseArgs): string {
  const locationRow = args.unitLocation
    ? `<tr><td style="padding: 6px 0; color: #888;">Location</td><td style="padding: 6px 0; text-align: right;">${args.unitLocation}</td></tr>`
    : '';
  const addressRow = args.unitAddress
    ? `<tr><td style="padding: 6px 0; color: #888;">Address</td><td style="padding: 6px 0; text-align: right; max-width: 280px;">${args.unitAddress}</td></tr>`
    : '';

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #888;">Unit</td><td style="padding: 6px 0; text-align: right;"><strong>${args.unitName}</strong></td></tr>
      ${locationRow}
      ${addressRow}
      <tr><td style="padding: 6px 0; color: #888;">Check-in</td><td style="padding: 6px 0; text-align: right;">${args.checkIn} · 2:00 PM</td></tr>
      <tr><td style="padding: 6px 0; color: #888;">Check-out</td><td style="padding: 6px 0; text-align: right;">${args.checkOut} · 12:00 Noon</td></tr>
      <tr style="border-top: 1px solid #d6e0e7;">
        <td style="padding: 10px 0 0; color: #888;">Total amount</td>
        <td style="padding: 10px 0 0; text-align: right;"><strong>${formatPHP(args.totalAmount)}</strong></td>
      </tr>
    </table>
  `;
}

function paymentBlock(args: ReceivedArgs): string {
  if (args.paymentOption === 'full') {
    return `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-top: 8px;">
        <p style="margin: 0; font-size: 13px; color: #15803d;">
          <strong>Paid in full:</strong> ${formatPHP(args.totalAmount)}
        </p>
      </div>
    `;
  }
  return `
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; margin-top: 8px;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #92400e;">
        <strong>Reservation fee paid:</strong> ${formatPHP(args.reservationFee)}
      </p>
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>Balance due on check-in (${args.checkIn}):</strong> ${formatPHP(args.balanceDue)}
      </p>
    </div>
  `;
}

// ── Public senders ────────────────────────────────────────────────

export async function sendBookingReceived(args: ReceivedArgs): Promise<void> {
  return send({
    to: args.to,
    subject: `Booking received — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'We got your booking!',
      intro: `Hi ${args.name}, we received your booking request and your payment proof. We&rsquo;ll verify the payment and confirm shortly — usually within 24 hours.`,
      bodyHTML: detailsTable(args) + paymentBlock(args),
    }),
  });
}

export async function sendBookingConfirmed(args: ConfirmedArgs): Promise<void> {
  return send({
    to: args.to,
    subject: `Booking confirmed — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your booking is confirmed!',
      intro: `Hi ${args.name}, we&rsquo;ve verified your payment. Your stay at ${args.unitName} is locked in. We can&rsquo;t wait to host you!`,
      bodyHTML: detailsTable(args) + paymentBlock(args),
    }),
  });
}

export async function sendBookingCancelled(args: BaseArgs): Promise<void> {
  return send({
    to: args.to,
    subject: `Booking cancelled — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your booking has been cancelled',
      intro: `Hi ${args.name}, your booking for ${args.unitName} (${args.checkIn} → ${args.checkOut}) has been cancelled. If this was unexpected, please contact us right away.`,
      bodyHTML: detailsTable(args),
    }),
  });
}

export async function sendBookingRefunded(args: BaseArgs): Promise<void> {
  return send({
    to: args.to,
    subject: `Refund processed — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your refund has been processed',
      intro: `Hi ${args.name}, we&rsquo;ve issued a refund for your booking at ${args.unitName}. Depending on your payment method, the funds should appear within 3–5 business days.`,
      bodyHTML: detailsTable(args),
    }),
  });
}

// ── Internal sender (Gmail SMTP via nodemailer) ───────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) return null;

  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return _transporter;
}

async function send(args: { to: string; subject: string; html: string }): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] Gmail SMTP not configured — skipping send to', args.to);
    return;
  }

  const fromAddress = process.env.GMAIL_USER!;
  // Show a friendly "From" name on the customer's side.
  const fromHeader  = `${BRAND_NAME} <${fromAddress}>`;

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    console.log('[email] sent', args.subject, 'to', args.to, '— id:', info.messageId);
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}
