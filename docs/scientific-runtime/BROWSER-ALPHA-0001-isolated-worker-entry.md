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
- keeps canonical cold start as an explicit diagnostic control; and
- has no `ModelCore`, backend selector, or silent fallback import.

This is an integration probe, not a default-runtime cutover or a complete UI.
The legacy Workbench route and navigation remain unchanged.

## Smoke check

1. Run `npm run build` and confirm that `dist/assets` contains both the lazy
   `ScientificRuntimeAlphaPage` chunk and the
   `mainWireScientificWorkerV1` Worker chunk.
2. Serve the build with `npm run preview -- --host 127.0.0.1`.
3. Open `/ja/scientific-alpha` and wait for `Post-P1 beat ready`.
4. Confirm `501` terminal samples, official-preset session origin, release SHA
   `75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4`,
   four PV plots, valve flow, and atrial/ventricular/vascular pressure plots.
5. Confirm that no current browser error was emitted during restore or beat
   acquisition.
6. Open `/ja/workbench` separately and confirm that its existing behavior is
   unchanged; the alpha route is intentionally not in global navigation.
