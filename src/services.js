'use strict';

const services = [
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

module.exports = { services };
