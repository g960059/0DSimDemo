# ADR-0001 — Firebase project → `hemodynamics-studio` (default DB)

- Status: **Accepted / Implemented** (PR #17, on `main`)
- Date: 2026-06-01

## Context
The app was wired to an AI-Studio auto-provisioned Firebase project (`gen-lang-client-0830082865`) using a **named** Firestore database (`ai-studio-41074922-…`). The product owner created a deliberate project, `hemodynamics-studio`, to own auth + Firestore + rules going forward.

## Decision
Point the app at `hemodynamics-studio` using the project's **default** Firestore database.

- `firebase-applet-config.json` → new project web config; drop the custom `firestoreDatabaseId` key.
- `firebaseSetup.ts` → `getFirestore(app)` (default database) instead of the named-DB argument.
- Add deploy wiring `.firebaserc` (default project) + `firebase.json` (firestore rules pointer) — none existed before.
- Keep `firestore.rules` unchanged; superadmin `g960059@gmail.com` is preserved.

## Consequences
- Verified end-to-end: `tsc=0`, `vite build` green, runtime Firestore `Listen` to `projects/hemodynamics-studio/databases/(default)` → 200; clean console.
- Console-side enablement (owner): Firestore enabled (production), Google auth provider + authorized domains, `firestore.rules` deployed via `firebase-tools`.
- The migrated code is inert-safe before rules deploy (publish → `permission-denied`, handled gracefully).

## Alternatives
- Keep the AI-Studio auto project — rejected: not deliberately owned, named-DB coupling, no deploy wiring.
- Add a named DB on the new project — rejected: web config implies default DB; default is simpler.
