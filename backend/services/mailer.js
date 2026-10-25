// backend/services/mailer.js
// Thin nodemailer wrapper. If SMTP isn't really configured (placeholder creds),
// isConfigured() returns false and callers fall back to a dev flow (e.g. return
// the reset link in the API response) instead of silently failing.
const nodemailer = require('nodemailer');

const resendConfigured = () => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return Boolean(key && from &&
    !/your_|change_this|xxx|placeholder/i.test(key) &&
    !/your_|change_this|xxx|placeholder/i.test(from));
};

const PLACEHOLDERS = ['your_app_password', 'your_email_password', '', undefined, null];

// Preferred: any transactional provider over SMTP (Postmark, Resend, Amazon SES, Mailgun...)
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
// Legacy fallback: Gmail via SUPPORT_EMAIL + SUPPORT_EMAIL_PASSWORD (not recommended for production).
const smtpConfigured = () => !!process.env.SMTP_HOST && !PLACEHOLDERS.includes(process.env.SMTP_PASSWORD);

const isConfigured = () => {
  if (resendConfigured()) return true;
  if (smtpConfigured()) return true;
  const pass = process.env.SUPPORT_EMAIL_PASSWORD;
  const user = process.env.SUPPORT_EMAIL;
  return !!user && !!pass && !PLACEHOLDERS.includes(pass) && !user.includes('your_');
};

const fromAddress = () => process.env.EMAIL_FROM || `"LunarBid" <${process.env.SUPPORT_EMAIL}>`;

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  transporter = smtpConfigured()
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      })
    : nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user: process.env.SUPPORT_EMAIL, pass: process.env.SUPPORT_EMAIL_PASSWORD },
      });
  return transporter;
};

// Returns { sent: boolean }. Never throws to the caller unless forced.
const sendMail = async ({ to, subject, html, text, replyTo }) => {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };
  try {
    if (resendConfigured()) {
      // Render Free blocks SMTP ports; Resend HTTPS works without them.
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: Array.isArray(to) ? to : [to],
          subject,
          ...(html ? { html } : {}),
          ...(text ? { text } : {}),
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.error('Resend email request failed:', response.status);
        return { sent: false, reason: 'send_failed' };
      }
      return { sent: true };
    }

    // Preserve SMTP/Gmail fallback for local development or other hosts.
    await getTransporter().sendMail({
      from: fromAddress(),
      ...(replyTo ? { replyTo } : {}),
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('Mailer error:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
};
module.exports = { sendMail, isConfigured };
