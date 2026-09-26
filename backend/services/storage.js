// backend/services/storage.js
// ============================================================================
// File storage for uploaded images (logos).
//
// Production: any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2,
// DigitalOcean Spaces) so files survive redeploys and work with several servers.
//   S3_BUCKET, S3_REGION, S3_ENDPOINT (non-AWS), S3_ACCESS_KEY_ID,
//   S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL (public base URL of the bucket or CDN)
// Development: local ./uploads folder, served by the API at /uploads.
//
// Always returns absolute URLs, so images display from any frontend domain.
// ============================================================================
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const LOCAL_DIR = path.join(__dirname, '..', 'uploads');
const useS3 = () => !!process.env.S3_BUCKET;
const backendUrl = () => (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');

let s3 = null;
function s3Client() {
  if (!s3) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3 = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
    });
  }
  return s3;
}

const publicBase = () =>
  useS3() ? (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '') : `${backendUrl()}/uploads`;

/** Detect an allowed image type from its first bytes (never trust the file name or declared type). */
function detectImage(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return { ext: 'png', type: 'image/png' };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  return null;
}

/** Save an image; returns its public URL. `folder` is e.g. "logos/<userId>". */
async function saveImage(buffer, folder) {
  const kind = detectImage(buffer);
  if (!kind) {
    const err = new Error('Only PNG, JPEG or WebP images are allowed');
    err.status = 400;
    err.expose = true;
    throw err;
  }
  const key = `${folder}/${crypto.randomBytes(12).toString('hex')}.${kind.ext}`;

  if (useS3()) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: kind.type,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
  } else {
    const file = path.join(LOCAL_DIR, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
  }
  return `${publicBase()}/${key}`;
}

/** Key for a URL we issued, or null (never touch anything outside our storage). */
function keyFor(url) {
  if (!url) return null;
  // Legacy values stored as "/uploads/logos/..." before absolute URLs were used.
  if (url.startsWith('/uploads/')) return url.slice('/uploads/'.length);
  const base = `${publicBase()}/`;
  return url.startsWith(base) ? url.slice(base.length) : null;
}

/** Delete a previously saved file. Silently ignores unknown or missing files. */
async function removeFile(url) {
  const key = keyFor(url);
  if (!key || key.includes('..')) return;
  try {
    if (useS3() && !url.startsWith('/uploads/')) {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      await s3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    } else {
      await fs.unlink(path.join(LOCAL_DIR, key));
    }
  } catch {
    /* already gone */
  }
}

/** Absolute URL for display (converts legacy "/uploads/..." paths). */
function displayUrl(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${backendUrl()}${url}` : url;
}

module.exports = { saveImage, removeFile, displayUrl, detectImage, LOCAL_DIR, useS3 };
