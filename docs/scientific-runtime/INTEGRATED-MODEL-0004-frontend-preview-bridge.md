# INTEGRATED-MODEL-0004: exact integrated frontend preview bridge

Status: implemented development preview. This is not a stable-release,
physiological-acceptance, clinical-validation, or UI-architecture claim.

## 1. Outcome

The current frontend can now execute and inspect one exact integrated assembly:

`five-wall base + coronary V3 + dynamic MCS + composed rhythm V2`.

It is shipped as a separate development identity:

```text
circleheart/adult-five-wall-integrated-preview@0.1.0
32d4f2c936eabd6b19fcb18386ba540174de6627110b1c2febb0140938f0fa5d
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
  + exact schema/checkpoint restore/re-execution verification
  + current seed-lineage verification
  -> generic replay-complete RunArtifactV1
```

The browser record deliberately sets
`executableBuildProvenanceAttached=false` and
`standaloneReplayCompleteArtifactClaimed=false`. The browser cannot truthfully
identify the executable bundle that contains its own running code. Promotion
through `createMainWireIntegratedPreviewRunArtifactV1` is therefore a separate
build/CI or persistence-boundary operation that requires a validated
`BuildArtifactRefV1`; the page never invents that reference. Promotion accepts
untrusted JSON, validates its exact schema and claim literals, restores both
checkpoints against the current release input, and exactly re-executes the
recorded transition before emitting a replay-complete artifact.

Promotion eligibility is explicit in each record rather than inferred from the
presence of checkpoints. The bundled seed and the first continuation from the
current seed fork are eligible for current-runtime exact replay verification.
`eligible` means that replay may be attempted; it is not a promise that a
canonical-environment seed transition will be bitwise reproducible in another
Node/V8 or browser runtime. A cross-runtime mismatch fails closed and cannot be
promoted. The first continuation is generated and replayed by the same current
runtime, while the bundled seed retains its separately identified canonical
generation environment.
Later continuation records remain exact, content-addressed one-beat records,
but are marked `blocked-missing-complete-seed-lineage` with
`upgradePath=null`: a start checkpoint alone cannot prove the claimed ordinal
from the seed. Promotion of those records stays fail closed until the complete
intervening lineage is carried and verified.

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
without resampling, smoothing or interpolation. Source schema V5 separates
portable protocol identity from exact numerical evidence. The complete source
artifact is checked in at
`data/scientific/evidence/integrated-preview-0.1.0/canonical-periodic-v3-source.json`.
It records the canonical generation environment (Node, V8, platform and
architecture) and the exact cold-initialization checkpoint as
`coldInitializationEvidence`. That checkpoint is evidence produced by the
named environment; it is not an input to the portable protocol identity and
does not claim bitwise equivalence across JavaScript engines or platforms.

The generated seed is schema V3. Its `sourceEvidence` pins the portable
protocol hash, the runtime-ABI SHA-256, and both the exact source-file SHA-256
and canonical-JSON SHA-256. The seed verification command re-reads that
checked-in source and fails if any source identity, ABI identity or generated
seed changes.

| Object | SHA-256 |
|---|---|
| portable periodic protocol, canonical-evidence options | `49df2f6ffb057c0dbfd47f794f141b9712224736abf08aff678b74e014a165c5` |
| portable periodic runtime ABI | `a0ebdb2c6b27bed99c9f414fc4cff91bb5e1c1d492bd95e8caf3697387ef2f02` |
| exact canonical-environment cold checkpoint | `ab04a3ad56b21c9d06971dceed606053c52569c00122d20485fe5077b69218f5` |
| canonical periodic source, exact file bytes | `c3735e70eb940ca231f3d8f9456756664bf081edf334e7239463d9f0c8fb09f6` |
| canonical periodic source, canonical JSON | `183525fb3d0911f3a10b873b7410cef2ec15146aa352002f88e9d27cc26f7b8a` |
| raw seed file | `71455dfb3e59d132ac6b3df6ddcde322c4aefbfb67be4c1119a8daef7c21299c` |
| canonical seed payload | `a990889b4c31218b55998da12371cf34bd5d88effeb237acc4547b45dd566b10` |
| exact seed start checkpoint | `9fc15d39328e3ef1e3c4f17d22b99c224fd44efebbf4b1fe5cbdb5cec3036aef` |
| exact seed terminal checkpoint | `f4024a1570f791315211a0d88b767fb4b0e846ac80dba3f57079ca7924accad0` |
| preview case catalog | `281b4445011761285f347c5f89d3242b26870faf5519e90cf20f61510c15b51c` |
| preview control catalog | `1adbeae5c6fcc34b909107c84b757100ae8188255f1f0c82d28838909cafc815` |
| preview observable catalog | `9898059a6a57ef8366a2772eb89d69a92dad0bd317cd3abdadf721e6a41d9fad` |
| preview UI/graph catalog | `f869e25d28f17752c8f15907aca52873a3c9df9588e1963cb7c838561585eea9` |

The release loader verifies its manifest identity. The seed loader verifies
both raw-file and canonical-payload identities before restore, plus exact
start/terminal checkpoint times, fixed global blood volume, and the live
input-only recipe's portable protocol and runtime-ABI identities. Loading the
seed and creating a browser session do not materialize a new cold numerical
state.

The identity boundary has three explicit layers:

1. The portable protocol-spec SHA-256 binds all declarative simulation inputs,
   the cold-initialization recipe and the pinned runtime ABI. It includes the
   complete canonical mechanics-provider parameter preimage—passive, Land,
   SLS, atrial and TriSeg geometry, solver, and state schema—rather than the
   legacy rounded 32-bit cache fingerprint. It never includes a derived
   floating-point cold state.
2. The runtime-ABI SHA-256 binds the integrated transaction, coronary,
   composed-rhythm, dynamic-MCS, checkpoint and initializer contract
   identities. An implementation change that can alter exact results requires
   an ABI-version bump.
3. Exact evidence SHA-256 values bind the environment-labelled cold, cycle
   start and terminal checkpoints through the checked-in source and seed
   artifacts. They support exact restore under the pinned runtime; they do not
   turn a platform-specific floating-point result into a portable input spec.

This split lets Node/V8 implementations agree on the protocol and ABI while
honestly retaining exact canonical evidence from one named environment. A
consumer checks the portable protocol and ABI, then restores the checked-in
seed boundaries exactly. It does not rerun cold initialization and demand
cross-runtime bitwise equality.

Each Main V3 checkpoint binds a SHA-256 of the complete provider parameter
preimage, so restore cannot substitute a provider that collides under the
legacy cache fingerprint. The session hashes the full input spec. Both Main V3
checkpoints retain their own integrity hashes, and every browser record hashes
the canonical payload excluding only its self-referential
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

The client additionally binds every response to the pending request, session,
command and expected MCS preset, recomputes the RunRecord and input SHA-256,
and requires the supplied presentation to equal the complete projection
derived from that record. A literal-only main-thread descriptor independently
pins the release, preset-specific input spec, seed boundaries, create
checkpoint and fixed checkpoint claims without importing the numerical model
into the main bundle. For each active session the client advances only from the
previous exact terminal checkpoint, time, revision and continuation ordinal,
with at most one stateful command in flight. Any mismatch, duplicate, stale or
forked response, timeout, Worker error or message-deserialization error
quarantines and terminates the whole stateful Worker.

The release-specific limitations acknowledgement is also fail closed.
Unavailable browser storage is treated as not acknowledged; it cannot create a
Worker. The explicit acknowledgement action may authorize the current
in-memory session even when persistence remains unavailable.

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
