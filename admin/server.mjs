import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.PORTFOLIO_ADMIN_PORT || 3847);
const uploadDirectory = process.env.PORTFOLIO_UPLOAD_DIR || '/var/www/portfolio/state/uploads';
const passwordHash = process.env.PORTFOLIO_ADMIN_PASSWORD_HASH || '';
const sessionSecret = process.env.PORTFOLIO_ADMIN_SESSION_SECRET || '';
const maxUploadBytes = 8 * 1024 * 1024;
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 8;

if (!/^scrypt\$[^$]+\$[^$]+$/.test(passwordHash) || sessionSecret.length < 32) {
  throw new Error('Admin service requires a valid password hash and a 32+ character session secret.');
}

const sessions = new Map();
const failedLogins = new Map();

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const baseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, { ...baseHeaders, ...headers });
  response.end(body);
}

function redirect(response, location, headers = {}) {
  send(response, 303, '', { Location: location, ...headers });
}

function readBody(request, limit = maxUploadBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || '')
      .split(';')
      .map((value) => value.trim().split(/=(.*)/s, 2))
      .filter(([key]) => key),
  );
}

function clientAddress(request) {
  const forwarded = request.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.socket.remoteAddress || 'unknown';
}

function verifyPassword(candidate) {
  const [, encodedSalt, encodedKey] = passwordHash.split('$');
  const expected = Buffer.from(encodedKey, 'base64url');
  const derived = scryptSync(candidate, Buffer.from(encodedSalt, 'base64url'), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function createSession() {
  const token = randomBytes(32).toString('base64url');
  const csrfToken = createHmac('sha256', sessionSecret).update(token).digest('base64url');
  sessions.set(token, { csrfToken, expiresAt: Date.now() + sessionLifetimeMs });
  return { token, csrfToken };
}

function currentSession(request) {
  const token = parseCookies(request).portfolio_admin_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function timingSafeTextMatch(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && timingSafeEqual(a, b);
}

function loginBlocked(address) {
  const attempts = failedLogins.get(address) || [];
  const recent = attempts.filter((timestamp) => timestamp > Date.now() - loginWindowMs);
  failedLogins.set(address, recent);
  return recent.length >= maxLoginAttempts;
}

function registerFailedLogin(address) {
  const attempts = failedLogins.get(address) || [];
  attempts.push(Date.now());
  failedLogins.set(address, attempts.filter((timestamp) => timestamp > Date.now() - loginWindowMs));
}

function imageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

function parseMultipart(contentType, body) {
  const match = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || '');
  if (!match) throw new Error('Expected a multipart upload.');

  const boundary = `--${match[1] || match[2]}`;
  const source = body.toString('latin1');
  const parts = source.split(boundary).slice(1, -1);
  const fields = new Map();
  let file = null;

  for (const rawPart of parts) {
    const part = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separator = part.indexOf('\r\n\r\n');
    if (separator < 0) continue;
    const headers = part.slice(0, separator);
    const payload = part.slice(separator + 4);
    const disposition = /content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i.exec(headers);
    if (!disposition) continue;
    const [, fieldName, filename] = disposition;
    if (filename !== undefined) {
      if (file) throw new Error('Upload one image at a time.');
      file = { filename, content: Buffer.from(payload, 'latin1') };
    } else {
      fields.set(fieldName, payload);
    }
  }

  return { fields, file };
}

async function listUploads() {
  await mkdir(uploadDirectory, { recursive: true, mode: 0o750 });
  const names = await readdir(uploadDirectory);
  const files = await Promise.all(names
    .filter((name) => /^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(name))
    .map(async (name) => ({ name, details: await stat(path.join(uploadDirectory, name)) })));
  return files
    .filter(({ details }) => details.isFile())
    .sort((a, b) => b.details.mtimeMs - a.details.mtimeMs)
    .slice(0, 60);
}

function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
  :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#efebe2;color:#151515}*{box-sizing:border-box}body{margin:0;padding:2rem;min-width:320px}.shell{max-width:1100px;margin:0 auto}.eyebrow{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#67635d}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #aaa69f;padding-bottom:1rem}.panel{max-width:34rem;margin:12vh auto 0;border:1px solid #aaa69f;padding:clamp(1.25rem,4vw,2.5rem);background:#f8f5ef}.panel h1,.title{font-size:clamp(2.5rem,7vw,5rem);letter-spacing:-.075em;line-height:.86;margin:.45rem 0 2rem}.title{font-size:clamp(3rem,8vw,7rem)}label{display:grid;gap:.5rem;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}input{width:100%;padding:.9rem;border:1px solid #77726c;background:white;font:inherit}button{margin-top:1rem;border:0;background:#151515;color:#f8f5ef;padding:.9rem 1.2rem;font:700 .78rem/1 Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}.notice{padding:1rem;border-left:3px solid #4d60ff;background:#e4e7ff}.upload{margin:2rem 0 3rem;padding:1.25rem;border:1px solid #aaa69f;background:#f8f5ef}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem}.asset{margin:0;border:1px solid #aaa69f;background:#fff}.asset img{width:100%;aspect-ratio:1;object-fit:cover;display:block}.asset figcaption{padding:.7rem;overflow-wrap:anywhere;font-size:.75rem}.asset code{display:block;color:#67635d;margin-top:.35rem}a{color:inherit}@media(max-width:600px){body{padding:1rem}.top{align-items:flex-start;gap:1rem;flex-direction:column}}</style></head><body>${content}</body></html>`;
}

function loginPage(message = '') {
  return page('Portfolio admin control', `<main class="panel"><p class="eyebrow">Portfolio / private control</p><h1>Image manager.</h1>${message ? `<p class="notice">${escapeHtml(message)}</p>` : ''}<form method="post" action="/admincontrol/login"><label>Password<input name="password" type="password" autocomplete="current-password" required autofocus></label><button type="submit">Enter admin control</button></form></main>`);
}

async function dashboard(session, uploaded = '') {
  const uploads = await listUploads();
  const cards = uploads.length
    ? uploads.map(({ name }) => `<figure class="asset"><img src="/portfolio-assets/${encodeURIComponent(name)}" alt="Uploaded portfolio asset"><figcaption><a href="/portfolio-assets/${encodeURIComponent(name)}" target="_blank" rel="noreferrer">Open image</a><code>/portfolio-assets/${escapeHtml(name)}</code></figcaption></figure>`).join('')
    : '<p>No uploaded images yet. The public site continues to use its temporary visual placeholder.</p>';
  return page('Portfolio image manager', `<main class="shell"><header class="top"><div><p class="eyebrow">Portfolio / admin control</p><h1 class="title">Image manager.</h1></div><form method="post" action="/admincontrol/logout"><input type="hidden" name="csrf" value="${session.csrfToken}"><button type="submit">Sign out</button></form></header>${uploaded ? `<p class="notice">Image uploaded successfully. Its public URL is shown below.</p>` : ''}<section class="upload"><p class="eyebrow">Add a project asset</p><form method="post" action="/admincontrol/upload" enctype="multipart/form-data"><input type="hidden" name="csrf" value="${session.csrfToken}"><label>PNG, JPG or WebP — up to 8 MB<input name="image" type="file" accept="image/png,image/jpeg,image/webp" required></label><button type="submit">Upload image</button></form></section><section><p class="eyebrow">Uploaded files</p><div class="grid">${cards}</div></section></main>`);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const method = request.method || 'GET';

  try {
    if (method === 'GET' && url.pathname === '/admincontrol') {
      const session = currentSession(request);
      if (!session) return send(response, 200, loginPage(url.searchParams.get('error') || ''), { 'Content-Type': 'text/html; charset=utf-8' });
      return send(response, 200, await dashboard(session, url.searchParams.get('uploaded') || ''), { 'Content-Type': 'text/html; charset=utf-8' });
    }

    if (method === 'POST' && url.pathname === '/admincontrol/login') {
      const address = clientAddress(request);
      if (loginBlocked(address)) return redirect(response, '/admincontrol?error=Too%20many%20attempts.%20Try%20again%20later.');
      const fields = new URLSearchParams((await readBody(request, 12 * 1024)).toString('utf8'));
      if (!verifyPassword(fields.get('password') || '')) {
        registerFailedLogin(address);
        return redirect(response, '/admincontrol?error=Incorrect%20password.');
      }
      failedLogins.delete(address);
      const session = createSession();
      return redirect(response, '/admincontrol', { 'Set-Cookie': `portfolio_admin_session=${session.token}; Path=/admincontrol; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionLifetimeMs / 1000}` });
    }

    const session = currentSession(request);
    if (!session) return redirect(response, '/admincontrol?error=Please%20sign%20in%20first.');

    if (method === 'POST' && url.pathname === '/admincontrol/logout') {
      const fields = new URLSearchParams((await readBody(request, 12 * 1024)).toString('utf8'));
      if (!timingSafeTextMatch(fields.get('csrf'), session.csrfToken)) return send(response, 403, 'Forbidden');
      sessions.delete(session.token);
      return redirect(response, '/admincontrol', { 'Set-Cookie': 'portfolio_admin_session=; Path=/admincontrol; HttpOnly; Secure; SameSite=Strict; Max-Age=0' });
    }

    if (method === 'POST' && url.pathname === '/admincontrol/upload') {
      const { fields, file } = parseMultipart(request.headers['content-type'], await readBody(request));
      if (!timingSafeTextMatch(fields.get('csrf'), session.csrfToken)) return send(response, 403, 'Forbidden');
      if (!file || !file.content.length) return redirect(response, '/admincontrol?error=Choose%20an%20image%20to%20upload.');
      const extension = imageType(file.content);
      if (!extension) return redirect(response, '/admincontrol?error=Only%20valid%20PNG%2C%20JPG%2C%20or%20WebP%20images%20are%20accepted.');
      await mkdir(uploadDirectory, { recursive: true, mode: 0o750 });
      const name = `${Date.now()}-${randomBytes(9).toString('hex')}.${extension}`;
      await writeFile(path.join(uploadDirectory, name), file.content, { flag: 'wx', mode: 0o640 });
      return redirect(response, `/admincontrol?uploaded=${encodeURIComponent(name)}`);
    }

    return send(response, 404, 'Not found');
  } catch (error) {
    if (error instanceof Error && error.message === 'Request is too large.') return send(response, 413, 'Upload is too large.');
    console.error('Portfolio admin request failed:', error instanceof Error ? error.message : 'unknown error');
    return send(response, 500, 'Unable to process this request.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Portfolio admin control listening on 127.0.0.1:${port}`);
});
