# NovaTech Solutions: Company Web App + Multi-Stage CI/CD Pipeline

Yeh project aik complete company website (frontend + Node.js backend API) hai, jis ke saath aik automated
**GitHub Actions** pipeline aati hai. Jab bhi aap code `git push` karte hain, pipeline khud code pull karti hai,
linter chalati hai, unit tests chalati hai, build + smoke test karti hai, aur `main` branch par Docker image deploy karti hai.
Har stage ke metrics GitHub ke **Summary board** par log hote hain.

```
git push
   |
   v
[1 Lint] --> [2 Unit tests (Node 20 + 22)] --> [3 Build + Smoke test] --> [4 Deploy (sirf main)]
                                                                                 |
                                                         [Status board: sab stages ka result]
```

---

## 1. Requirements

| Cheez | Version | Kyun |
|-------|---------|------|
| Node.js | 20 ya 22 | App aur tests chalane ke liye |
| Git | koi bhi | Code push karne ke liye |
| GitHub account | free bhi chalta hai | Actions + Container Registry |
| Docker (optional) | koi bhi | Image locally chalane ke liye |

Is project mein **koi npm dependency nahi** hai (`npm install` ki zaroorat nahi). Linter, test runner aur server sab
Node.js ke built-in features par bane hain, is liye pipeline tez aur simple hai.

## 2. Project structure

```
novatech-cicd/
├── public/                 # Website frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/                    # Backend
│   ├── server.js           # HTTP server start karta hai
│   ├── app.js              # Routes: /api/health, /api/services, /api/contact + static files
│   ├── services.js         # Services ka data
│   └── validate.js         # Contact form validation
├── test/                   # Unit tests (node:test)
│   ├── app.test.js
│   └── validate.test.js
├── scripts/
│   ├── lint.js             # Static analysis (linter)
│   ├── build.js            # dist/ banata hai + build-info.json
│   ├── smoke.js            # Build ko chala kar health check karta hai
│   └── ci-metrics.js       # Test results ko Markdown table banata hai
├── .github/
│   ├── workflows/ci-cd.yml # Pipeline ki definition
│   └── dependabot.yml      # Actions versions auto-update
├── Dockerfile
└── package.json
```

## 3. Step 1: Website locally chalayein

```bash
cd novatech-cicd
npm start
```

Browser mein kholein: **http://localhost:3000**

Aap ko company website nazar aaye gi (Hero, Services, About, Process, Contact form). Contact form
`POST /api/contact` ko call karta hai. Footer mein build version `/api/health` se aata hai.

API check karne ke liye:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/services
```

## 4. Step 2: Pipeline ke saare stages locally chalayein

Push se pehle wohi checks apne computer par chala lein jo CI karegi:

```bash
npm run lint     # Stage 1: static analysis
npm test         # Stage 2: unit tests
npm run build    # Stage 3: dist/ folder banata hai
npm run smoke    # Stage 3: dist ko start kar ke health check
# ya sab aik saath:
npm run ci
```

Agar yeh sab pass hon to pipeline bhi pass hogi.

## 5. Step 3: GitHub par repository banayein aur push karein

1. https://github.com/new par jayein, repo ka naam `novatech-cicd` rakhein, **Create repository** dabayein
   (README ya .gitignore add na karein, woh already maujood hain).
2. Apne project folder mein:

```bash
git init -b main
git add .
git commit -m "Initial commit: NovaTech site and CI/CD pipeline"
git remote add origin https://github.com/<APNA-USERNAME>/novatech-cicd.git
git push -u origin main
```

## 5b. Step 4: Pipeline ko chalte hue dekhein

1. GitHub repo mein **Actions** tab kholein.
2. Sab se upar **CI/CD Pipeline** ka run nazar aaye ga. Us par click karein.
3. Aap ko 4 stages (jobs) aur aakhir mein **Pipeline status board** nazar aaye ga.
4. Run page par neeche scroll karein, **Summary** section mein har stage ka metrics table hai:
   lint ke files/problems, tests ke total/pass/fail/duration, build ka size/commit, aur deploy ka image/digest.

Yehi aap ka "execution board" hai.

## 6. Pipeline kaise kaam karti hai (stage by stage)

| Stage | Job | Kya karta hai | Fail ho to? |
|-------|-----|---------------|-------------|
| 1 | `lint` | Code pull karta hai, `scripts/lint.js` chalata hai: syntax check, `var`, `console.log`, trailing spaces, line length | Aage ke stages nahi chalte. Galtiyan PR diff par annotation ke taur par dikhti hain |
| 2 | `test` | Node 20 aur 22 dono par unit tests (15 tests). Results table summary mein log hota hai | Build/deploy nahi hota |
| 3 | `build` | `dist/` banata hai, **smoke test** (server start + health + home page), `dist` artifact upload karta hai | Deploy nahi hota |
| 4 | `deploy` | Sirf `main` par push ke baad: artifact download, Docker image build, GHCR par push (`:latest` aur `:<sha>` tags) | Image publish nahi hoti |
| - | `report` | Hamesha chalta hai (`if: always()`), 4 stages ka status board banata hai, koi stage fail ho to run ko fail karta hai | - |

Khaas baatein jo workflow mein hain:

- **`on:`** pipeline `push` (main, develop) aur `pull_request` (main) par khud chalti hai.
- **`needs:`** stages sequence mein chalte hain: lint -> test -> build -> deploy.
- **`concurrency`** nayi push aaye to purana run cancel ho jata hai.
- **`permissions`** by default sirf read; deploy job ko `packages: write` alag se diya gaya hai.
- **`environment: production`** deploy job aik GitHub Environment use karta hai (neeche approval ka tareeqa hai).
- **`$GITHUB_STEP_SUMMARY`** yahan metrics likhe jaate hain, yehi execution board hai.

## 7. Step 5: Deploy kiya hua image dekhein aur chalayein

Pehli successful run ke baad:

1. Repo ke right side par **Packages** mein `novatech-cicd` image nazar aaye gi.
2. Package page par **Package settings -> Change visibility -> Public** karein agar aap chahtay hain ke
   koi bhi image pull kar sake (default private hoti hai).
3. Image chalayein:

```bash
docker run -p 3000:3000 ghcr.io/<apna-username-lowercase>/novatech-cicd:latest
```

Phir http://localhost:3000 par wohi website khule gi, aur footer mein commit ka short SHA nazar aaye ga.

## 8. Step 6: Failure demo (pipeline ka fayda dekhein)

1. Koi file mein jaan bujh kar galti karein, masalan `src/services.js` mein `var x = 1;` add kar dein.
2. `git commit -am "break lint" && git push`
3. Actions tab mein **Lint stage laal (fail)** hoga, `test`, `build`, `deploy` **skipped** honge, aur board par
   saaf nazar aaye ga ke kahan masla hai.
4. Galti theek karein, dobara push karein, sab hara ho jaye ga.

## 9. Step 7 (recommended): Safety settings

- **Branch protection:** Settings -> Branches -> Add rule for `main` -> *Require status checks to pass*
  -> `1 - Static analysis (lint)`, `2 - Unit tests (Node 22)`, `3 - Build and smoke test` select karein.
  Is se broken code `main` mein merge nahi hoga.
- **Deploy approval:** Settings -> Environments -> `production` -> *Required reviewers* add karein.
  Phir deploy stage manual approval ka intezar karega.

## 10. Optional improvements

- **Apne server par deploy:** `deploy` job mein image push ke baad aik SSH step add karein
  (secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`) jo server par `docker pull` + `docker run` chalaye.
- **ESLint:** zyada rules chahiye to `npm i -D eslint`, phir `scripts/lint.js` ki jagah `eslint .` use karein.
  Is project mein built-in linter isliye hai ke koi dependency na ho.
- **GitLab CI / Jenkins:** wohi 4 stages hain. GitLab mein `stages: [lint, test, build, deploy]` aur har job mein
  `script: npm run lint` waghera; Jenkins mein `Jenkinsfile` ke 4 `stage('...')` blocks. Commands bilkul wohi rahengi.

## 11. Common masail

| Masla | Hal |
|-------|-----|
| Deploy par `denied: permission_denied` | Settings -> Actions -> General -> Workflow permissions mein *Read and write* select karein, ya org policy check karein |
| Image ka naam uppercase ki wajah se fail | Username/org mein capital letters hon to bhi `metadata-action` lowercase kar deta hai, `docker run` mein lowercase likhein |
| Tests local par pass, CI par fail | Node version farq ho sakta hai. Local par `node --version` check karein (CI 20 aur 22 dono chalati hai) |
| Deploy stage `skipped` | Normal hai: deploy sirf `main` par push par chalta hai, PR ya `develop` par nahi |
| Actions tab mein kuch nahi | Check karein ke `.github/workflows/ci-cd.yml` repo mein push hui hai |

## API reference

| Method | Path | Jawab |
|--------|------|-------|
| GET | `/api/health` | `{ status, uptimeSeconds, version, commit, builtAt }` |
| GET | `/api/services` | `{ services: [...] }` |
| POST | `/api/contact` | `201 { ok: true }` ya `400 { ok: false, errors }` (JSON body: name, email, message) |
