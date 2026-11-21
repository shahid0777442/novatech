'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { services } = require('./services');
const { validateContact } = require('./validate');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const MAX_BODY_BYTES = 10 * 1024;

function loadBuildInfo(rootDir) {
  try {
    const raw = fs.readFileSync(path.join(rootDir, 'build-info.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { version: 'dev', commit: 'local', builtAt: null };
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(publicDir, urlPath, res) {
  const relative = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, relative);

  // Block path traversal outside of the public directory.
  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) {
    return false;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

/**
 * Create the request handler for the company website.
 * @param {{ rootDir?: string }} [options]
 */
function createApp(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const publicDir = path.resolve(rootDir, 'public');
  const buildInfo = loadBuildInfo(rootDir);
  const startedAt = Date.now();
  const messages = [];

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;

    try {
      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, {
          status: 'ok',
          uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
          version: buildInfo.version,
          commit: buildInfo.commit,
          builtAt: buildInfo.builtAt,
        });
      }

      if (req.method === 'GET' && pathname === '/api/services') {
        return sendJson(res, 200, { services });
      }

      if (req.method === 'POST' && pathname === '/api/contact') {
        const body = await readJsonBody(req);
        const result = validateContact(body);
        if (!result.valid) {
          return sendJson(res, 400, { ok: false, errors: result.errors });
        }
        messages.push({ ...result.data, receivedAt: new Date().toISOString() });
        return sendJson(res, 201, { ok: true, message: 'Thanks! We will get back to you soon.' });
      }

      if (pathname.startsWith('/api/')) {
        return sendJson(res, 404, { error: 'Not found' });
      }

      if (req.method === 'GET' || req.method === 'HEAD') {
        if (serveStatic(publicDir, pathname, res)) {
          return undefined;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Page not found');
    } catch (err) {
      const status = err.status || 500;
      return sendJson(res, status, { error: status === 500 ? 'Internal server error' : err.message });
    }
  };
}

module.exports = { createApp };
