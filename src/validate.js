'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a contact form submission.
 * @param {unknown} body parsed JSON body
 * @returns {{ valid: boolean, errors: Record<string, string>, data?: object }}
 */
function validateContact(body) {
  const errors = {};
  const input = body && typeof body === 'object' ? body : {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const message = typeof input.message === 'string' ? input.message.trim() : '';

  if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }

  if (!EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (message.length > 2000) {
    errors.message = 'Message must be 2000 characters or fewer.';
  }

  const valid = Object.keys(errors).length === 0;
  return valid ? { valid, errors, data: { name, email, message } } : { valid, errors };
}

module.exports = { validateContact, EMAIL_RE };
