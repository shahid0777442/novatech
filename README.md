# NovaTech Solutions: Multi-Stage Automated CI/CD Pipeline

![CI/CD](https://github.com/shahid0777442/novatech/actions/workflows/ci-cd.yml/badge.svg?branch=main)

**Live demo:** http://52.87.162.63/

Company website (HTML front end + dependency-free Node.js API) with a fully automated pipeline:
**push → lint → unit tests → Docker build → deploy → health check → status report**.

<img width="1440" height="2560" alt="live-demo-footer-build-version" src="https://github.com/user-attachments/assets/44e49f07-07fc-4314-99d5-8f128c197040" />


## Project structure

```
public/index.html            front end (contact form, services, build version footer)
src/server.js                HTTP server: /api/health, /api/services, /api/contact, static files
src/validate.js              contact-form validation rules
test/                        unit tests + API tests (node:test)
Dockerfile                   container image (commit SHA baked in)
eslint.config.js             static analysis rules
.github/workflows/ci-cd.yml  GitHub Actions pipeline
.gitlab-ci.yml               equivalent GitLab CI pipeline
```

## Run locally

```bash
npm install        # dev tools only (ESLint); the app itself has no dependencies
npm run lint
npm test
npm start          # http://localhost:3000
```

## API

| Method | Path | Result |
|---|---|---|
| GET | `/api/health` | `{ status, version, commit }` |
| GET | `/api/services` | `{ services: [...] }` |
| POST | `/api/contact` | `201 { ok: true }` or `400 { ok: false, errors }` |

Validation: name ≥ 2 characters, valid email, message ≥ 10 characters.

## Pipeline stages

| # | Stage | What it does | Fails the run when |
|---|---|---|---|
| 1 | Lint | ESLint static analysis, JSON report artifact | any lint error |
| 2 | Test | Validation + API tests, results in the job summary | any test fails |
| 3 | Build | Docker image tagged with the commit SHA, pushed to GHCR | build error |
| 4 | Deploy | SSH deploy on `main`, health check, **automatic rollback** | health check fails |
| 5 | Report | Status table (stage results, commit, author, run) | never (always runs) |

## Setup

1. Push the code to GitHub. CI runs `npm install`, so a lockfile is optional (commit `package-lock.json` later and switch to `npm ci` for fully reproducible installs).
2. Create a dedicated deploy key: `ssh-keygen -t ed25519 -C "ci-novatech" -f ci_key -N ""`.
   Put `ci_key.pub` in the server's `~/.ssh/authorized_keys`.
3. Add repository secrets (Settings → Secrets and variables → Actions):
   `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` (the private key).
4. Create the `production` environment (optionally with required reviewers).
5. Protect `main`: require pull requests and the `Lint (ESLint)` and `Unit tests` checks.
6. The server needs Docker installed and the deploy user in the `docker` group.

## Verifying the pipeline

- Add an unused variable and push → **Lint** fails, later stages are skipped.
- Change a validation rule → **Unit tests** fail, build is skipped.
- Merge to `main` → image built, deployed; the page footer shows `build: 1.0.<run> (<commit>)`.
