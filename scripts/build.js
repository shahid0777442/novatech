'use strict';

/**
 * Build step: copies the runnable app into dist/ and stamps it with
 * version + commit info so the deployed site can report what it is running.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const dir of ['src', 'public']) {
  fs.cpSync(path.join(ROOT, dir), path.join(DIST, dir), { recursive: true });
}
fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(DIST, 'package.json'));

const info = {
  version: pkg.version,
  commit: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'local',
  branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME || 'local',
  runId: process.env.GITHUB_RUN_ID || null,
  builtAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(DIST, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');

function dirSize(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const full = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? dirSize(full) : fs.statSync(full).size);
  }, 0);
}

const kb = (dirSize(DIST) / 1024).toFixed(1);
console.log(`Build complete: v${info.version} @ ${String(info.commit).slice(0, 7)} (${kb} KB) -> dist/`); // lint-allow
