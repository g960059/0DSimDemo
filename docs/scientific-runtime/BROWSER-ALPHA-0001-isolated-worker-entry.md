# Browser alpha: isolated scientific Worker entry

The explicit localized routes `/ja/scientific-alpha` and
`/en/scientific-alpha` are the first browser-hosted integration seam for the
release-bound scientific runtime.

The route:

- is lazy-loaded and is not linked from the legacy navigation;
- creates `MainWireScientificWorkerClientV1`, whose Vite-recognized factory
  starts `mainWireScientificWorkerV1.ts` as a module Worker;
- sends only protocol V1 commands with caller-owned request/session IDs;
- reports the exact release reference and canonical cold-start observable
  frame returned by the Worker;
- has no `ModelCore`, backend selector, or silent fallback import.

This is an integration probe, not a default-runtime cutover or a complete UI.
The legacy Workbench route and navigation remain unchanged.

## Smoke check

1. Run `npm run build` and confirm that `dist/assets` contains both the lazy
   `ScientificRuntimeAlphaPage` chunk and the
   `mainWireScientificWorkerV1` Worker chunk.
2. Serve the build with `npm run preview -- --host 127.0.0.1`.
3. Open `/ja/scientific-alpha` and wait for `Scientific Worker ready`.
4. Confirm that the page displays a 64-character release SHA-256 and four
   canonical chamber volume rows.
5. Open `/ja/workbench` separately and confirm that its existing behavior is
   unchanged; the alpha route is intentionally not in global navigation.
