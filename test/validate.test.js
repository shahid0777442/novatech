'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { validateContact } = require('../src/validate');

test('valid input passes', () => {
  const r = validateContact({ name: 'Ali', email: 'ali@x.com', message: 'Hello, need a website.' });
  assert.equal(r.valid, true);
  assert.deepStrictEqual(r.errors, {});
});

test('short name rejected', () => {
  const r = validateContact({ name: 'A', email: 'a@b.co', message: 'long enough msg' });
  assert.ok(r.errors.name);
});

test('bad email rejected', () => {
  const r = validateContact({ name: 'Ali', email: 'not-an-email', message: 'long enough msg' });
  assert.ok(r.errors.email);
});

test('short message rejected', () => {
  const r = validateContact({ name: 'Ali', email: 'a@b.co', message: 'short' });
  assert.ok(r.errors.message);
});
