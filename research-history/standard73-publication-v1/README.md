# Standard73 publication — 2026-09-10

The reviewed two-case package was registered as stable and selected as the
public default (active bundle 13 → 14). The previously public model was
Standard70; Standard72 had been the local default. No equations, coefficients,
checkpoint state, physiology policy, or exact model identity changed here.

Implementation commit: `e9a1e77e`. Public workbench:
<https://www.circleheart.dev/ja/experiments/new>.

The baseline and HFrEF have their own qualified captures. Both appear once in
the ordinary preset picker and share the Standard73 documentation hierarchy.
Document v2 corrects creation-status and historical-evidence wording; v1 and
the reviewed local package remain unchanged. Documentation does not establish
clinical validation or qualification of the entire exposed control domain.

## Verification and deployment

- Fast suite: 1,188 passed; PR suite: 876 passed. Final preset-deduplication
  change: 22 focused tests passed, followed by both-browser public checks.
- Current source rebuild matches the reviewed exact artifact byte-for-byte;
  publication validates both own-model captures, documents and assessment pins.
- Public Chromium and WebKit: baseline → HFrEF, exact model identity, baseline
  information, both documents in JA/EN at 1280/390 px, formula rendering and
  Home-footer navigation passed. No page errors or failed public requests.
- Cloud Run and Firebase use the same prebuilt application. Public index bytes
  and the Home page's app-script reference match the local deployment build.
- Firebase pin-rewrite finalization failed once, then an idempotent retry
  succeeded. The active bundle was moved only after Hosting succeeded. No IAM
  policy or additional cloud API was enabled to work around the failure.

`evidence.tar.gz` (3,814,571 bytes) contains the sanitized receipt, readbacks,
test/build logs, browser reports/screenshots and reproduction drivers. SHA-256:
`e281d5ecb3240a5720f67558d4f2160ba6b8ad6c69fcde7249632c67080c4acc`.
It deliberately excludes credentials, environment files, Firebase debug logs
and full Cloud Run configuration. Numerical qualification and independent
adoption reviews remain in `../standard73-release-v1/`.

Deployment receipt identifies the immutable image, Hosting release and old
active bundle. Rollback requires restoring both Hosting and the registry
pointer, using the then-current bundle version for compare-and-set; do not
rewrite old experiment captures or relabel them as Standard73.

The retained Standard72 fitting workflow now pins its own seed explicitly;
the current `fit:case` workflow uses the finite-anatomy case seed. Historical
checkpoint codecs are not interchangeable with the current release.
