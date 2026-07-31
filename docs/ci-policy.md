# CI policy

Pull requests and pushes to `main` run the `Verify` workflow:

- production build;
- the bounded PR smoke suite on pull requests, or the fast suite on `main`;
- repository hygiene validation that rejects removed product, persistence,
  browser-runtime, Studio V1, generated-evidence paths, and machine-local
  absolute paths in portable tracked content;
- diff whitespace validation.

The scheduled `Scientific verification` workflow runs current numerical
coverage only:

- engine regression shards;
- canonical scientific shards.

CI does not classify legacy product paths or replay historical readiness
artifacts. Superseded tests and generated snapshots belong in Git history, not
in a dormant or locally rebranded suite. `npm run test:all` covers every current
suite and does not create a second product, sidecar, or browser-runtime path.
