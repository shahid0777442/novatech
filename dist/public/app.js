'use strict';

// Fallback data keeps the page useful when the API is unreachable
// (for example when the HTML file is opened as a static preview).
const FALLBACK_SERVICES = [
  {
    id: 'cloud',
    title: 'Cloud Engineering',
    summary: 'Migrate, design and run scalable infrastructure on any major cloud.',
    tags: ['AWS', 'Azure', 'Kubernetes'],
  },
  {
    id: 'web',
    title: 'Web & Mobile Apps',
    summary: 'Product-grade web and mobile applications, from prototype to launch.',
    tags: ['React', 'Node.js', 'Flutter'],
  },
  {
    id: 'devops',
    title: 'DevOps & Automation',
    summary: 'CI/CD pipelines, infrastructure as code and release automation.',
    tags: ['GitHub Actions', 'Docker', 'Terraform'],
  },
  {
    id: 'data',
    title: 'Data & AI',
    summary: 'Analytics platforms and machine learning that turn data into decisions.',
    tags: ['Python', 'BigQuery', 'LLMs'],
  },
];

function renderServices(list) {
  const grid = document.getElementById('service-grid');
  grid.textContent = '';
  list.forEach((service) => {
    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = service.title;

    const summary = document.createElement('p');
    summary.textContent = service.summary;

    const tags = document.createElement('ul');
    tags.className = 'tags';
    service.tags.forEach((tag) => {
      const item = document.createElement('li');
      item.textContent = tag;
      tags.appendChild(item);
    });

    card.append(title, summary, tags);
    grid.appendChild(card);
  });
}

async function loadServices() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    renderServices(data.services);
  } catch {
    renderServices(FALLBACK_SERVICES);
  }
}

async function loadVersion() {
  const label = document.getElementById('build-version');
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    label.textContent = `build: ${data.version} (${String(data.commit).slice(0, 7)})`;
  } catch {
    label.textContent = 'build: static preview';
  }
}

function clearErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
  });
}

function showErrors(form, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  });
}

function setupForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    status.className = 'form-status';
    status.textContent = 'Sending...';

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        status.className = 'form-status ok';
        status.textContent = data.message;
        form.reset();
      } else {
        showErrors(form, data.errors || {});
        status.className = 'form-status fail';
        status.textContent = 'Please fix the highlighted fields.';
      }
    } catch {
      status.className = 'form-status fail';
      status.textContent = 'Could not reach the server. Please try again later.';
    }
  });
}

loadServices();
loadVersion();
setupForm();
