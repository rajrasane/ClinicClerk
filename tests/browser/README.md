# Synthetic browser checks

Build and start the app locally with **synthetic** public configuration:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-key npm run build
NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-key npm run start -- --hostname 127.0.0.1 --port 3000
```

In a second terminal run `npm run test:browser` (or `npx playwright test`). The config uses `/usr/bin/chromium`; override with `PLAYWRIGHT_CHROMIUM_PATH` if needed. No hosted service, real accounts, production keys, or patient data are required. The harness seeds a fictional browser session and intercepts doctor/patient/visit reads. All other nonlocal requests and unmocked local API requests are aborted. Service workers are blocked.

`PLAYWRIGHT_BASE_URL` accepts only localhost/loopback origins. Set `SCREENSHOT_DIR` to capture seven views for each viewport (landing, login, signup, patients, visits, add patient, add visit), optionally with `SCREENSHOT_PREFIX=baseline`. Use `npx playwright test tests/browser/capture.spec.ts` against an earlier build to capture comparison screenshots without the new accessibility assertions.

Checks run at 1440×1000 and 390×844 with reduced motion. They verify no horizontal page overflow, synthetic record rendering, modal opening, named controls and tables, selected navigation state, debounced patient search and clear, accessible validation errors, dialog focus containment and Escape restoration, keyboard password toggles/focus outline, existing-patient keyboard selection, labelled clinical/payment steps, date filter state, and absence of uncaught browser errors. These mocked checks do not validate a live database, RLS, authentication service, or real record persistence.
