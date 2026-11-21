'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContact } = require('../src/validate');

const good = { name: 'Ayesha Khan', email: 'ayesha@example.com', message: 'We need a new web portal.' };

test('accepts a valid submission and trims values', () => {
  const result = validateContact({ ...good, name: '  Ayesha Khan  ' });
  assert.equal(result.valid, true);
  assert.equal(result.data.name, 'Ayesha Khan');
});

test('rejects a missing body', () => {
  const result = validateContact(undefined);
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'message', 'name']);
});

test('rejects a too-short name', () => {
  const result = validateContact({ ...good, name: 'A' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
});

test('rejects an invalid email', () => {
  for (const email of ['plain', 'a@b', '@x.com', 'a b@c.com']) {
    const result = validateContact({ ...good, email });
    assert.equal(result.valid, false, `expected ${email} to be rejected`);
    assert.ok(result.errors.email);
  }
});

test('rejects a short or oversized message', () => {
  assert.ok(validateContact({ ...good, message: 'too short' }).errors.message);
  assert.ok(validateContact({ ...good, message: 'x'.repeat(2001) }).errors.message);
});

test('ignores non-string fields', () => {
  const result = validateContact({ name: 123, email: {}, message: [] });
  assert.equal(result.valid, false);
});
