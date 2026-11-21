'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

let server;
let base;

test.before(async () => {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

function postJson(path, payload) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

test('GET /api/health reports ok', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.ok('version' in body);
  assert.ok('commit' in body);
});

test('GET /api/services lists the company services', async () => {
  const res = await fetch(`${base}/api/services`);
  assert.equal(res.status, 200);
  const { services } = await res.json();
  assert.ok(services.length >= 4);
  for (const service of services) {
    assert.ok(service.id && service.title && service.summary);
    assert.ok(Array.isArray(service.tags));
  }
});

test('POST /api/contact accepts a valid message', async () => {
  const res = await postJson('/api/contact', {
    name: 'Bilal Ahmed',
    email: 'bilal@example.com',
    message: 'Please contact me about cloud migration.',
  });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).ok, true);
});

test('POST /api/contact returns field errors for bad input', async () => {
  const res = await postJson('/api/contact', { name: '', email: 'nope', message: 'hi' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.errors.name && body.errors.email && body.errors.message);
});

test('POST /api/contact rejects malformed JSON', async () => {
  const res = await fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.equal(res.status, 400);
});

test('serves the home page', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /NovaTech Solutions/);
});

test('serves static assets with the right content type', async () => {
  const css = await fetch(`${base}/styles.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);
  await css.arrayBuffer();
});

test('blocks path traversal outside the public folder', async () => {
  const res = await fetch(`${base}/..%2Fpackage.json`);
  assert.equal(res.status, 404);
  await res.arrayBuffer();
});

test('unknown pages and API routes return 404', async () => {
  const page = await fetch(`${base}/does-not-exist`);
  assert.equal(page.status, 404);
  await page.arrayBuffer();

  const api = await fetch(`${base}/api/nope`);
  assert.equal(api.status, 404);
  assert.equal((await api.json()).error, 'Not found');
});
