# Scientific records: build and run provenance

`BuildArtifactRefV1` and `RunArtifactV1` are immutable evidence records, not
editable saved cases.

The current `circleheart/adult-five-wall-noncoronary@0.2.0` release binds
numerical ABI `main-wire-accepted-state-transition-v2@2.0.0`. This ABI is a
breaking accepted-state-transition identity relative to `0.1.0`: equations and
parameters are retained, but the Newton/floating-point path is not bitwise
compatible. An exact `0.1.0` checkpoint is rejected because exact restore
requires the identical full release reference, including its SHA-256.

- A build reference binds one simulation release and numerical-runtime ABI to
  caller/CI-supplied repository, full Git commit/tree, explicit clean/dirty
  state, and executable artifact SHA-256. The loader does not inspect Git or
  infer host state. Whoever creates the reference must hash the actual Worker
  or native artifact before supplying the digest. For a dirty build,
  `gitTreeSha` must identify a synthetic Git tree containing all actual source
  content used by the build. Reusing the `HEAD` tree while uncommitted source
  changes participated in the build is invalid.
- A run artifact binds that build reference to an exact protocol descriptor,
  canonical initialization or exact-checkpoint identity, execution ledger,
  outputs, and audits. Its reference is the SHA-256 of the full canonical run
  content; it has no generated timestamp or random run ID.
- `MainWireScientificCaseDocumentV1` stores an immutable case revision with
  exact release, intent, verified resolved session input, approved protocol,
  start identity, and lineage. It can refer to a V3 checkpoint by identity but
  does not embed checkpoint bytes or execution results.
- `MainWireScientificWorkspaceDocumentV1` stores a separate immutable
  presentation revision: a case reference, ordered panels, catalogued
  observable-backed time-series/PV/table views, grid layout, and notes. It
  cannot carry release parameters, protocols, checkpoints, results, or trust.
  A case or workspace may reference a run artifact, but neither can be
  substituted for its immutable execution evidence.

Release and evidence manifests deliberately do not embed the commit that
contains themselves. The #478 commit `f229143...` appears only as the source of
the historical scientific oracle pack. The deterministic
`data/scientific/releases/0.2.0/numerical-validation-v1.json` record binds
numerical shadow results and a bounded local performance classification by raw
file-byte SHA-256; it is not a `BuildArtifactRefV1` and does not identify an
executable. CI or another caller must separately construct the build reference
from the exact commit/tree, worktree status, and Worker or native artifact
digest. `RunArtifactV1` then retains that external build reference.

Unknown envelope and identity fields fail closed. Protocol details, ledger
entries, outputs, and audits remain canonical JSON so their versioned producer
schemas can evolve without admitting legacy fields into the provenance
envelope.
