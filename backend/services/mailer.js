// backend/services/mailer.js
// Thin nodemailer wrapper. If SMTP isn't really configured (placeholder creds),
// isConfigured() returns false and callers fall back to a dev flow (e.g. return
// the reset link in the API response) instead of silently failing.
const nodemailer = require('nodemailer');

const PLACEHOLDERS = ['your_app_password', 'your_email_password', '', undefined, null];

const isConfigured = () => {
  const pass = process.env.SUPPORT_EMAIL_PASSWORD;
  const user = process.env.SUPPORT_EMAIL;
  return !!user && !!pass && !PLACEHOLDERS.includes(pass) && !user.includes('your_');
};

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.SUPPORT_EMAIL,
      pass: process.env.SUPPORT_EMAIL_PASSWORD,
    },
  });
  return transporter;
};

// Returns { sent: boolean }. Never throws to the caller unless forced.
const sendMail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };
  try {
    await getTransporter().sendMail({
      from: `"LunarBid" <${process.env.SUPPORT_EMAIL}>`,
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
