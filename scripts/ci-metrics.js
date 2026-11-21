'use strict';

/**
 * Reads the saved output of `npm test` (spec reporter) and turns the totals
 * into a Markdown table. In GitHub Actions the table is appended to the job
 * summary (the "execution board"); locally it is printed to the terminal.
 * Usage: node scripts/ci-metrics.js test-output.txt [label]
 */

const fs = require('node:fs');

const file = process.argv[2];
const label = process.argv[3] || 'Unit tests';

if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/ci-metrics.js <test-output-file> [label]');
  process.exit(1);
}

const output = fs.readFileSync(file, 'utf8');

function metric(name) {
  const match = output.match(new RegExp(`^ℹ ${name} ([0-9.]+)`, 'm'));
  return match ? Number(match[1]) : 0;
}

const total = metric('tests');
const passed = metric('pass');
const failed = metric('fail');
const skipped = metric('skipped');
const seconds = (metric('duration_ms') / 1000).toFixed(2);
const icon = failed === 0 && total > 0 ? '✅' : '❌';

const failedNames = output
  .split('\n')
  .filter((line) => line.startsWith('✖') && !line.includes('failing tests'))
  .map((line) => `- ${line.replace(/^✖\s*/, '')}`);

const lines = [
  `### ${icon} ${label}`,
  '',
  '| Total | Passed | Failed | Skipped | Duration |',
  '|------:|-------:|-------:|--------:|---------:|',
  `| ${total} | ${passed} | ${failed} | ${skipped} | ${seconds}s |`,
  '',
];

if (failedNames.length > 0) {
  lines.push('**Failing tests**', '', ...failedNames, '');
}

const markdown = lines.join('\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}
console.log(markdown); // lint-allow
