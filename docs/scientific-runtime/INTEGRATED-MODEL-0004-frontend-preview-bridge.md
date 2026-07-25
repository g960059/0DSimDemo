# INTEGRATED-MODEL-0004: exact integrated frontend preview bridge

Status: implemented development preview. This is not a stable-release,
physiological-acceptance, clinical-validation, or UI-architecture claim.

## 1. Outcome

The current frontend can now execute and inspect one exact integrated assembly:

`five-wall base + coronary V3 + dynamic MCS + composed rhythm V2`.

It is shipped as a separate development identity:

```text
circleheart/adult-five-wall-integrated-preview@0.1.0
d66b948dc85265cc5d40c23038b1e67682784f068bc54c8daf10bb249e6a8e47
```

The existing
`circleheart/adult-five-wall-noncoronary@0.2.0`
remains the only default stable product release. There is no fallback,
implicit migration, or relabelling between these releases.

The preview is intentionally narrow:

- one bundled normal-sinus/all-MCS-off P1 checkpoint;
- fixed composed regular sinus at 60 bpm;
- an optional HeartMate-II 9,000 rpm structural fork followed by one
  unsteady accepted beat;
- one-second continuation commands;
- raw accepted-endpoint graphs; and
- download of the complete immutable run record.

The word `preview` is a lifecycle boundary, not cosmetic UI copy.

## 2. Boundary with DESIGN-STUDIO-002

The separate presentation branch defines `cell` and `document` as the user
objects and requires immutable `RunArtifact` objects containing a complete
`SimulationInputSpec` and internal `StateSnapshot`. This branch does not
rebuild that presentation architecture. It supplies the reusable scientific
boundary beneath it, while keeping browser evidence separate from executable
build provenance:

```text
SimulationInputSpec
  -> release-resolved Worker session
  -> atomic accepted integrated transaction(s)
  -> immutable MainWireIntegratedPreviewRunRecordV2
       - exact SimulationReleaseRef
       - complete SimulationInputSpec + SHA-256
       - durable seed/advance operation and continuation ordinal
       - raw accepted trace
       - conservation summary
       - exact start and terminal Main V3 checkpoints
       - record SHA-256
  -> graph / metric projections

MainWireIntegratedPreviewRunRecordV2
  + externally supplied BuildArtifactRefV1
  -> generic replay-complete RunArtifactV1
```

The browser record deliberately sets
`executableBuildProvenanceAttached=false` and
`standaloneReplayCompleteArtifactClaimed=false`. The browser cannot truthfully
identify the executable bundle that contains its own running code. Promotion
through `createMainWireIntegratedPreviewRunArtifactV1` is therefore a separate
build/CI or persistence-boundary operation that requires a validated
`BuildArtifactRefV1`; the page never invents that reference.

The current `/integrated-preview` page is a thin integration surface and can be
discarded or restyled by the cell/document branch. The following contracts
should be reused rather than copied:

- `ScientificProductReleaseBundleRegistryV1` for exact release-to-catalog
  resolution;
- `MainWireIntegratedPreviewWorkerClientV1` for the browser session;
- `MainWireIntegratedPreviewRunRecordV2` as the exact browser-produced run
  record;
- `MainWireIntegratedPreviewRunPresentationV2` as an expendable projection;
  and
- `createMainWireIntegratedPreviewRunArtifactV1` for explicit promotion when
  external executable build provenance is available.

The selector and running Worker session are ephemeral. A downloaded record is
content-addressed and contains both state boundaries, but it is not by itself a
replay-complete `RunArtifactV1`. A future cell may pin the record for exact
inspection or pin the promoted artifact for executable replay; it must not pin
a mutable label such as `"normal"` or the current frontend component state.

## 3. Content-addressed chain

The bundled seed is derived from the canonical cycle-70 Main V3 P1 artifact
without resampling, smoothing or interpolation. The complete source artifact
is checked in at
`data/scientific/evidence/integrated-preview-0.1.0/canonical-periodic-v3-source.json`.
The generated seed's `sourceEvidence.sourceArtifact` stores both the SHA-256 of
the exact source-file bytes and the SHA-256 of its canonical JSON value. The
seed verification command re-reads that checked-in source and fails if either
identity or the generated seed changes.

| Object | SHA-256 |
|---|---|
| canonical periodic source, exact file bytes | `sourceEvidence.sourceArtifact.rawFileSha256` |
| canonical periodic source, canonical JSON | `sourceEvidence.sourceArtifact.canonicalJsonSha256` |
| raw seed file | `6cfcca91f6642b08d5ebfc60bc6c2e45c56b084da74791182bb33b8388926546` |
| canonical seed payload | `a4ae4457bb9d2b670edfbd4bd76a60ce1b79c17c7d8405e28719d5eb207b7424` |
| exact seed start checkpoint | `payload.startModelState.checkpointSha256` |
| exact seed terminal checkpoint | `payload.terminalModelState.checkpointSha256` |
| preview case catalog | `c45444053e39fe30b3d35a0af3033e26346e5f170fb6a60ecd5b6a0c1f5b9c28` |
| preview control catalog | `1adcebcd1bc69f6b17c1a159d3f7d83577e5b3a871771c3fe09027ed141d312e` |
| preview observable catalog | `af525a5acff4e0c42097b2b1cd531df587829f29d47d6a1ae8d3305a3ee1578b` |
| preview UI/graph catalog | `8cdde2ba037a01abd373ad1028babacd634da4fc8f990d11be706e80dde49103` |

The release loader verifies its manifest identity. The seed loader verifies
both raw-file and canonical-payload identities before restore, plus exact
start/terminal checkpoint times and the live fixture's fixed global blood
volume and protocol identity. The session hashes the full input spec. Both Main
V3 checkpoints retain their own integrity hashes, and every browser record
hashes the canonical payload excluding only its self-referential
`recordSha256` field. A promoted generic `RunArtifactV1` separately binds the
externally supplied `BuildArtifactRefV1`.

Checkpoint restore exposed an existing order-sensitive comparison of the
coronary binding. Canonical JSON correctly sorts object keys, but the old
comparison used `JSON.stringify` insertion order. It was replaced by explicit
field equality; no equation, state or parameter changed.

## 4. Worker and command boundary

The dedicated Worker accepts only three exact command shapes:

1. `createSession` with an allowlisted MCS preset;
2. `runNextBeat`; and
3. `disposeSession`.

Unknown fields, unknown presets, duplicate or absent session identifiers,
capacity overflow and unknown commands fail closed. The kernel serializes
commands and retains at most two sessions by default. It does not reuse the
stable noncoronary Worker ABI and does not fall back to that model after an
integrated failure. A failed beat command restores the session's entire
pre-command accepted tuple and continuation ordinal; accepted substeps are
never exposed as a partially completed user command.

For HMII, activation is a state-preserving structural fork from the same P1
coronary/rhythm/base state. The new dynamic circuit flow begins at zero and is
then advanced by the accepted R-L/Choi transaction. This is deliberately
labelled a post-activation transient, not a steady supported state.

## 5. Frontend projection and graph inspection

The page renders six release-catalog graph recipes:

1. Ao/LV/PA pressure waveforms;
2. the LV pressure-volume loop;
3. MV/AoV/TV/PV flows;
4. total coronary and LAD subendocardial flow;
5. dynamic MCS accepted flow; and
6. event-owned LA/LVFW/RVFW calcium with capture markers.

The graph input is the raw trace stored in the run record. SVG paths connect
successive accepted endpoints for display only. No smoothed or resampled series
is written back into the record.

The executable frontend projection check currently reports:

| Descriptor | all-off P1 | first HMII post-activation beat |
|---|---:|---:|
| accepted endpoints | 504 | 504 |
| LVEF | 58.27% | 68.02% |
| mean Ao pressure | 88.42 mmHg | 92.07 mmHg |
| native forward output | 5.437 L/min | 4.301 L/min |
| PA pressure range | 6.52--37.80 mmHg | 6.43--37.78 mmHg |
| mean total coronary inlet flow | 2.493 mL/s | 2.630 mL/s |
| mean LVAD flow | 0 | 2.464 L/min |
| LVAD instantaneous range | 0 | -0.406--8.964 L/min |
| maximum TBV error | `2.73e-12 mL` | `1.82e-12 mL` |
| maximum coronary ledger residual | `1.27e-12 mL` | `9.56e-13 mL` |
| maximum dynamic-MCS conservation residual | 0 | 0 |

These values are characterization, not acceptance ranges. The all-off
construction-context screen still passes EF, cardiac index and mean LA
pressure but fails EDVi, ESVi and PASP. PA retains two local maxima; the
mechanism audit attributes the closed-PV rebound to the lightly damped
`PA_PArt` dynamic edge. It remains visible and explicitly labelled rather than
being hidden by display smoothing.

The HMII beat has a small reverse interval and a peak near the independently
reported high-flow traversal cited in `INTEGRATED-MODEL-0002`, but its boundary
conditions, heart rate, measurement station and transient status are not
matched to those experiments. It therefore supplies no component- or
closed-loop validation claim.

## 6. Known unavailable behavior

The preview does not expose behavior merely because an underlying component
exists:

- external-AF joint checkpoint/session ownership is not registered;
- accepted ventricular/AoV-event synchronized IABP is not wired;
- Impella, VA-ECMO and VV-ECMO are present in the dynamic graph but do not have
  preview-selectable release-approved profiles;
- active HMII periodic settlement is not offered;
- broad disease cases and continuous parameter controllers are not released;
- autonomic reflex, multipatch, oxygen transport and patient fitting remain
  outside scope; and
- physiological, clinical and patient-specific validity are not established.

The current stable case/scenario flow remains release-bound to `0.2.0`. The
preview does not mutate or reinterpret existing saved cases.

## 7. Reproduction

```bash
npm run verify:scientific:integrated-preview-release
npm run verify:scientific:product-release-catalogs
npm run verify:scientific:integrated-preview-frontend
npx vitest run --config vitest.canonical.config.ts \
  __tests__/mainWireIntegratedPreviewSessionV1.test.ts \
  __tests__/mainWireScientificProductReleaseBundleRegistryV1.test.ts \
  __tests__/mainWireFiveWallCoronaryCheckpointV2.test.ts \
  __tests__/mainWireFiveWallCoronaryTransactionV2.test.ts
npm run build
npx playwright test --config playwright.e2e.config.ts \
  e2e/integratedModelPreviewV1.spec.ts
```

The focused production-browser test verifies exact release identity, the six
graph projections, the downloaded V2 record schema and start/terminal state
boundaries, HMII session restart, one further beat and terminal-checkpoint
change. Passing it closes the browser integration path only; it does not
establish executable build provenance or a replay-complete artifact.
