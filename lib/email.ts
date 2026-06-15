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
  preview: string;        // shows in inbox preview (Gmail/Outlook snippet)
  bodyHTML: string;
  bookingId: string;
  email: string;
}): string {
  const link = magicLink(opts.bookingId, opts.email);
  // Invisible preheader for inbox preview text.
  const preheader = `
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; visibility:hidden; opacity:0; color:transparent; height:0; width:0;">
      ${opts.preview}
    </div>
  `;
  return `
    ${preheader}
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

function detailsText(args: BaseArgs): string {
  const lines: string[] = [
    `Unit:       ${args.unitName}`,
  ];
  if (args.unitLocation) lines.push(`Location:   ${args.unitLocation}`);
  if (args.unitAddress)  lines.push(`Address:    ${args.unitAddress}`);
  lines.push(`Check-in:   ${args.checkIn} · 2:00 PM`);
  lines.push(`Check-out:  ${args.checkOut} · 12:00 Noon`);
  lines.push(`Total:      ${formatPHP(args.totalAmount)}`);
  return lines.join('\n');
}

function paymentText(args: ReceivedArgs): string {
  if (args.paymentOption === 'full') {
    return `Paid in full: ${formatPHP(args.totalAmount)}`;
  }
  return [
    `Reservation fee paid:        ${formatPHP(args.reservationFee)}`,
    `Balance due on check-in:     ${formatPHP(args.balanceDue)} (${args.checkIn})`,
  ].join('\n');
}

function buildText(opts: {
  greeting: string;
  body: string;
  bookingId: string;
  email: string;
}): string {
  const link = magicLink(opts.bookingId, opts.email);
  return [
    opts.greeting,
    '',
    opts.body,
    '',
    `View your booking: ${link}`,
    '',
    `Booking ID: ${opts.bookingId}`,
    `Or visit ${siteUrl()}/my-booking and enter the ID with this email.`,
    '',
    `Thanks,`,
    BRAND_NAME,
  ].join('\n');
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
  const preview = `Booking ${args.bookingId} — ${args.unitName} · ${args.checkIn} to ${args.checkOut}`;
  return send({
    to: args.to,
    subject: `Booking received — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'We got your booking!',
      intro: `Hi ${args.name}, we received your booking request and your payment proof. We&rsquo;ll verify the payment and confirm shortly — usually within 24 hours.`,
      preview,
      bodyHTML: detailsTable(args) + paymentBlock(args),
    }),
    text: buildText({
      greeting: `Hi ${args.name},`,
      body: [
        'We received your booking request and your payment proof.',
        'We will verify the payment and confirm shortly — usually within 24 hours.',
        '',
        detailsText(args),
        '',
        paymentText(args),
      ].join('\n'),
      bookingId: args.bookingId,
      email: args.to,
    }),
  });
}

export async function sendBookingConfirmed(args: ConfirmedArgs): Promise<void> {
  const preview = `Confirmed — ${args.unitName} · ${args.checkIn} to ${args.checkOut}`;
  return send({
    to: args.to,
    subject: `Booking confirmed — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your booking is confirmed!',
      intro: `Hi ${args.name}, we&rsquo;ve verified your payment. Your stay at ${args.unitName} is locked in. We can&rsquo;t wait to host you!`,
      preview,
      bodyHTML: detailsTable(args) + paymentBlock(args),
    }),
    text: buildText({
      greeting: `Hi ${args.name},`,
      body: [
        `We have verified your payment. Your stay at ${args.unitName} is locked in.`,
        '',
        detailsText(args),
        '',
        paymentText(args),
      ].join('\n'),
      bookingId: args.bookingId,
      email: args.to,
    }),
  });
}

export async function sendBookingCancelled(args: BaseArgs): Promise<void> {
  const preview = `Cancelled — ${args.unitName} · ${args.checkIn} to ${args.checkOut}`;
  return send({
    to: args.to,
    subject: `Booking cancelled — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your booking has been cancelled',
      intro: `Hi ${args.name}, your booking for ${args.unitName} (${args.checkIn} → ${args.checkOut}) has been cancelled. If this was unexpected, please contact us right away.`,
      preview,
      bodyHTML: detailsTable(args),
    }),
    text: buildText({
      greeting: `Hi ${args.name},`,
      body: [
        `Your booking has been cancelled.`,
        `If this was unexpected, please reply to this email so we can help.`,
        '',
        detailsText(args),
      ].join('\n'),
      bookingId: args.bookingId,
      email: args.to,
    }),
  });
}

export async function sendBookingRefunded(args: BaseArgs): Promise<void> {
  const preview = `Refund processed — ${args.unitName} · ${args.checkIn} to ${args.checkOut}`;
  return send({
    to: args.to,
    subject: `Refund processed — ${args.unitName}`,
    html: layout({
      bookingId: args.bookingId,
      email: args.to,
      heading: 'Your refund has been processed',
      intro: `Hi ${args.name}, we&rsquo;ve issued a refund for your booking at ${args.unitName}. Depending on your payment method, the funds should appear within 3–5 business days.`,
      preview,
      bodyHTML: detailsTable(args),
    }),
    text: buildText({
      greeting: `Hi ${args.name},`,
      body: [
        `We have issued a refund for your booking at ${args.unitName}.`,
        `Depending on your payment method, funds should appear within 3-5 business days.`,
        '',
        detailsText(args),
      ].join('\n'),
      bookingId: args.bookingId,
      email: args.to,
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

async function send(args: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] Gmail SMTP not configured — skipping send to', args.to);
    return;
  }

  const fromAddress = process.env.GMAIL_USER!;
  const fromHeader  = `${BRAND_NAME} <${fromAddress}>`;

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: args.to,
      replyTo: fromAddress,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    console.log('[email] sent', args.subject, 'to', args.to, '— id:', info.messageId);
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}
