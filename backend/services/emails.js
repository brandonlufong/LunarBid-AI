// backend/services/emails.js
// Email bodies. Everything that comes from users is HTML-escaped.
const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A proposal sent by a freelancer to a client. */
function proposalEmail({ senderName, subject, message, text, link }) {
  const personal = message && message.trim()
    ? `<p style="margin:0 0 20px;white-space:pre-wrap">${escapeHtml(message.trim())}</p>`
    : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;padding:24px;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <div style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:28px">
    <p style="margin:0 0 6px;color:#64748b;font-size:13px">Proposal from ${escapeHtml(senderName)}</p>
    <h1 style="margin:0 0 20px;font-size:20px">${escapeHtml(subject)}</h1>
    ${personal}
    <div style="white-space:pre-wrap;line-height:1.6;font-size:15px;border-top:1px solid #e2e8f0;padding-top:20px">${escapeHtml(text)}</div>
    <p style="margin:28px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:600">View online</a></p>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">Reply to this email to answer ${escapeHtml(senderName)} directly. Sent with LunarBid.</p>
  </div></body></html>`;
  const plain = `Proposal from ${senderName}\n\n${subject}\n\n${message ? `${message.trim()}\n\n` : ''}${text}\n\nView online: ${link}\n\nReply to this email to answer ${senderName} directly. Sent with LunarBid.`;
  return { html, text: plain };
}

module.exports = { escapeHtml, proposalEmail };

/** Email address confirmation. */
function verificationEmail({ name, link }) {
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <h2 style="color:#4f46e5">Confirm your email for LunarBid</h2>
    <p>Hi ${escapeHtml(name)}, please confirm your email address to start using LunarBid's AI features. This link expires in 24 hours.</p>
    <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Confirm email</a></p>
    <p style="color:#64748b;font-size:13px">If you didn't create a LunarBid account, you can ignore this email.</p>
  </div>`;
  const text = `Hi ${name}, confirm your email for LunarBid: ${link}\n\nIf you didn't create a LunarBid account, you can ignore this email.`;
  return { html, text };
}

module.exports.verificationEmail = verificationEmail;
