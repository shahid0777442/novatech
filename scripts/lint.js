'use strict';

/**
 * Zero-dependency static linter used by the CI "lint" stage.
 *
 * Checks every .js file for:
 *  - syntax errors (node --check)
 *  - `var` declarations
 *  - console.log / debugger statements (unless the line ends with "// lint-allow")
 *  - missing 'use strict' header
 *  - trailing whitespace, tab characters, lines over 140 characters
 *
 * Emits GitHub Actions annotations when running in CI so problems show up
 * directly on the pull request diff.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const TARGET_DIRS = ['src', 'public', 'test', 'scripts'];
const MAX_LINE = 140;
const IN_CI = process.env.GITHUB_ACTIONS === 'true';
// Built from two pieces so this file does not trip its own rule.
const DEBUGGER_RE = new RegExp(`\\b${'debug'}${'ger'}\\b`);

function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const problems = [];

function log(text) {
  console.log(text); // lint-allow
}

function report(file, line, rule, message) {
  const rel = path.relative(ROOT, file);
  problems.push({ rel, line, rule, message });
  if (IN_CI) {
    log(`::error file=${rel},line=${line},title=${rule}::${message}`);
  } else {
    log(`${rel}:${line}  ${rule}  ${message}`);
  }
}

function lintFile(file) {
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) {
    const firstLine = (syntax.stderr || '').split('\n').find((l) => l.trim()) || 'syntax error';
    report(file, 1, 'syntax', firstLine.trim());
    return;
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');

  if (!lines.slice(0, 3).some((l) => l.trim() === "'use strict';")) {
    report(file, 1, 'use-strict', "File must start with 'use strict';");
  }

  lines.forEach((text, index) => {
    const n = index + 1;
    const allowed = /\/\/\s*lint-allow\s*$/.test(text);
    const trimmed = text.trim();
    const isComment = trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('//');
    const code = isComment ? '' : text.replace(/\/\/.*$/, '');

    if (/\bvar\s+[A-Za-z_$]/.test(code)) report(file, n, 'no-var', 'Use const or let instead of var.');
    if (!allowed && /\bconsole\.log\(/.test(code)) {
      report(file, n, 'no-console', 'Remove console.log (or add // lint-allow).');
    }
    if (!allowed && DEBUGGER_RE.test(code)) report(file, n, 'no-debugger', 'Remove debugger statement.'); // lint-allow
    if (/[ \t]+$/.test(text)) report(file, n, 'no-trailing-space', 'Trailing whitespace.');
    if (/\t/.test(text)) report(file, n, 'no-tabs', 'Use spaces, not tabs.');
    if (text.length > MAX_LINE) report(file, n, 'max-len', `Line is ${text.length} chars (max ${MAX_LINE}).`);
  });
}

const files = TARGET_DIRS
  .map((d) => path.join(ROOT, d))
  .filter((d) => fs.existsSync(d))
  .flatMap(collect);

files.forEach(lintFile);

log(`\nLinted ${files.length} files, found ${problems.length} problem(s).`);
process.exit(problems.length === 0 ? 0 : 1);
