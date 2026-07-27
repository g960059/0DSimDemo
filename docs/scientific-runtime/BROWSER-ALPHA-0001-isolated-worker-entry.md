# Browser alpha: isolated scientific Worker entry

The explicit localized routes `/ja/scientific-alpha` and
`/en/scientific-alpha` are the first browser-hosted integration seam for the
release-bound scientific runtime.

The route:

- is lazy-loaded and is not linked from the legacy navigation;
- creates `MainWireScientificWorkerClientV1`, whose Vite-recognized factory
  starts `mainWireScientificWorkerV1.ts` as a module Worker;
- sends only protocol V1 commands with caller-owned request/session IDs;
- starts from the bundled official healthy periodic checkpoint after verifying
  the catalog, preset, checkpoint, and immutable full release artifact chain;
- acquires and retains the complete beat immediately after the checkpoint's
  P1-classified source boundary without independently reclassifying its end;
- reports the exact release/preset/checkpoint provenance and presents four
  chamber PV trajectories, four-valve flow, and chamber/vascular pressures;
- keeps canonical cold start as an explicit diagnostic control;
- exposes one metadata-only catalog of healthy cold plus eight single-valve
  severe research brackets. The browser sends only exact preset ID/version;
  the Worker resolves the immutable release-bound input and returns a cold
  session with explicit non-official, non-clinical, and non-steady claims; and
- has no `ModelCore`, backend selector, or silent fallback import.

This section records the original alpha boundary. Route ownership was later
superseded by
`BROWSER-CUTOVER-0001-product-workbench.md`: the scientific alpha remains an
isolated diagnostic probe, while the product `/workbench` route now injects the
same scientific core beneath the preserved freeform Workbench shell. The
localized `/scientific-workbench` route is the research/development surface;
it is not the replacement UI for ordinary product use. The statements below
about an unchanged legacy runtime apply only to the historical alpha step.

The current product route extends this boundary without creating another
scientific backend. It can host up to four independent scientific scenarios,
with one Worker session and control store per scenario, and overlay selected
scenarios in the preserved graph panes. Product time-series and pressure-volume
plots are full-pane Canvas renderers: validated periodic cycles use a sweeping
cursor/moving cap, while an open transient displays only accepted transient
history and its latest accepted point. This product presentation behavior is
specified and verified by `BROWSER-CUTOVER-0001-product-workbench.md`; it is not
retroactively claimed as part of the historical alpha route.

## Smoke check

1. Run `npm run build`, then
   `npm run verify:scientific:browser-bundle-boundary`. The verifier requires
   both lazy chunks and proves that representative full-release markers occur
   only in `mainWireScientificWorkerV1`, while the alpha page contains only the
   bounded research-catalog metadata and command identity.
2. Serve the build with `npm run preview -- --host 127.0.0.1`.
3. Open `/ja/scientific-alpha` and wait for `Post-P1 beat ready`.
4. Confirm `501` terminal samples, official-preset session origin, release SHA
   `aa1947dc572b94370044e97efc03e3e62b000657a2fd580be7883d2b0774e48a`,
   four PV plots, valve flow, and atrial/ventricular/vascular pressure plots.
5. Confirm that no current browser error was emitted during restore or beat
   acquisition.
6. Load a research bracket and confirm that it begins at accepted time zero,
   says that it is not official/clinical/steady, and does not auto-settle.
7. For the historical alpha commit, open `/ja/workbench` separately and confirm
   that its then-existing legacy runtime is unchanged. For the current product
   cutover, follow `BROWSER-CUTOVER-0001-product-workbench.md` and verify the
   original graph/layout/view-authoring/Note/Reading UX over native scientific
   frames, independent multi-scenario Workers, graph membership/visibility,
   and the Canvas sweep/PV-cap behavior instead.
