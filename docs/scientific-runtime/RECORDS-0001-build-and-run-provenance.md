# Scientific records: build and run provenance

`BuildArtifactRefV1` and `RunArtifactV1` are immutable evidence records, not
editable saved cases.

- A build reference binds one simulation release and numerical-runtime ABI to
  caller/CI-supplied repository, full Git commit/tree, explicit clean/dirty
  state, and executable artifact SHA-256. The loader does not inspect Git or
  infer host state. Whoever creates the reference must hash the actual Worker
  or native artifact before supplying the digest. For a dirty build,
  `gitTreeSha` identifies the actual source tree used to build (for example a
  CI-created synthetic tree), not merely the tree attached to `HEAD`.
- A run artifact binds that build reference to an exact protocol descriptor,
  canonical initialization or exact-checkpoint identity, execution ledger,
  outputs, and audits. Its reference is the SHA-256 of the full canonical run
  content; it has no generated timestamp or random run ID.
- A future `CaseDocument` stores editable scientific intent and its resolved
  release/protocol inputs. A future `WorkspaceDocument` stores presentation
  state. Either may reference a run artifact, but neither can be substituted
  for its immutable execution evidence.

Unknown envelope and identity fields fail closed. Protocol details, ledger
entries, outputs, and audits remain canonical JSON so their versioned producer
schemas can evolve without admitting legacy fields into the provenance
envelope.
