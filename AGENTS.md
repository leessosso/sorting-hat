# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
Static, buildless web app (vanilla HTML/CSS/JS) for real-time team sorting ("배정 모자").
- `index.html` — end-user page (조 배정 / 자리 뽑기). Initialized by `initUserApp()`.
- `admin.html` — admin page. Creates teams from selected officers, toggles sorting, resets data.
- `app.js` — all logic. `style.css` — styling. Backend is **Firebase Realtime Database**.
- There is **no package.json, no build step, no lint config, and no automated test suite** in this repo. "Tests" are the manual scenarios in `TEST_SCENARIOS.md`. Production deploy is GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`); see `README.md` / `SETUP.md`.

### Running locally (Firebase emulator — no real credentials needed)
The app requires a Realtime Database. Locally we use the Firebase emulator instead of a real Firebase project. `firebase-tools` is installed globally by the update script (binary at `~/.npm-global/bin/firebase`, already on PATH via `~/.bashrc`).

Committed dev config for the emulator: `firebase.json`, `database.rules.json`, `.firebaserc` (project id `sorting-hat`).

1. **Create `firebase-config.js` if it is missing.** This file is gitignored (holds prod secrets in CI) so it is NOT in the repo. For local dev it must point at the emulator:
   ```js
   const firebaseConfig = {
       apiKey: "demo-api-key",
       authDomain: "sorting-hat.firebaseapp.com",
       databaseURL: "http://127.0.0.1:9000?ns=sorting-hat-default-rtdb",
       projectId: "sorting-hat",
       storageBucket: "sorting-hat.appspot.com",
       messagingSenderId: "0",
       appId: "1:0:web:demo"
   };
   ```
   The `?ns=sorting-hat-default-rtdb` query param is what makes the compat SDK talk to the RTDB emulator — do not drop it.
2. **Start the emulators** (long-running; use a tmux/terminal, not the update script):
   ```bash
   firebase emulators:start --project sorting-hat
   ```
   - Hosting (serves the site): http://127.0.0.1:5000
   - Realtime Database: 127.0.0.1:9000
   - Emulator UI: http://127.0.0.1:4000
3. Open the app at `http://127.0.0.1:5000/index.html` and `http://127.0.0.1:5000/admin.html` (serve over HTTP via the hosting emulator; do not open `file://`).

### Non-obvious gotchas
- The emulator starts with an **empty** database. Before a user can be assigned, an admin must first create teams: open `admin.html`, tick officer checkboxes (임원 선택), click "조 구성 적용하기", then toggle "배정 상태" ON (`config/sortingEnabled=true`).
- For quick end-user testing, use the **게스트 (guest)** toggle on `index.html`: guest names bypass the member-list check in `assignToTeam()`, so you don't need to configure `config/memberList` first.
- Emulator data is in-memory and is lost when the emulator stops. You can inspect/edit it via REST, e.g. `curl 'http://127.0.0.1:9000/teams.json?ns=sorting-hat-default-rtdb'`.
- Assignment uses a "min-count teams only" random algorithm (see `assignToTeam` in `app.js`); with equal counts the target team is random.
