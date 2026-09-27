// Proposal export: PDF (via the browser's print dialog), Word, Markdown and plain text.
const escapeHtml = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fileName = (title) => `lunarbid-${(title || 'proposal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proposal'}`;

function download(content, mime, ext, title) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName(title)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Returns false when the browser blocked the print window (popup blocker). */
export function exportProposal(format, { title, text }) {
  if (format === 'txt') return download(text, 'text/plain', 'txt', title), true;
  if (format === 'md') return download(`# ${title || 'Proposal'}\n\n${text}`, 'text/markdown', 'md', title), true;
  if (format === 'word') {
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${escapeHtml(title || 'Proposal')}</title></head><body style="font-family:Georgia,serif;font-size:12pt;line-height:1.6;white-space:pre-wrap;"><h1 style="font-family:Arial,sans-serif;font-size:16pt;">${escapeHtml(title || 'Proposal')}</h1>${escapeHtml(text)}</body></html>`;
    download(html, 'application/msword', 'doc', title);
    return true;
  }
  if (format === 'pdf') {
    const w = window.open('', '_blank');
    if (!w) return false;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title || 'Proposal')}</title>
      <style>body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.7;color:#101828;max-width:680px;margin:48px auto;padding:0 24px;}
      h1{font-family:Arial,Helvetica,sans-serif;font-size:18pt;margin:0 0 24px;padding-bottom:12px;border-bottom:1px solid #e4e7ec;}
      .body{white-space:pre-wrap;} @media print{body{margin:0 auto;}}</style></head>
      <body><h1>${escapeHtml(title || 'Proposal')}</h1><div class="body">${escapeHtml(text)}</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
    return true;
  }
  return false;
}

export const wordCount = (text = '') => (text.trim() ? text.trim().split(/\s+/).length : 0);
