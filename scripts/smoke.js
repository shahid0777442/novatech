'use strict';

/**
 * Smoke test: boots the built app from a directory (default: dist) on a free
 * port, checks the health endpoint and home page, then shuts it down.
 * Usage: node scripts/smoke.js [dir]
 */

const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');

const dir = path.resolve(process.argv[2] || 'dist');
const port = 3100 + Math.floor(Math.random() * 500);

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: urlPath }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i += 1) {
    try {
      return await get('/api/health');
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('Server did not start in time');
}

async function main() {
  const child = spawn(process.execPath, [path.join(dir, 'src', 'server.js')], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });

  try {
    const health = await waitForServer();
    const info = JSON.parse(health.body);
    if (health.status !== 200 || info.status !== 'ok') throw new Error('Health check failed');

    const home = await get('/');
    if (home.status !== 200 || !home.body.includes('NovaTech Solutions')) throw new Error('Home page check failed');

    console.log(`Smoke test passed: health ok, version ${info.version}, commit ${String(info.commit).slice(0, 7)}`); // lint-allow
  } finally {
    child.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(`Smoke test FAILED: ${err.message}`);
  process.exit(1);
});
