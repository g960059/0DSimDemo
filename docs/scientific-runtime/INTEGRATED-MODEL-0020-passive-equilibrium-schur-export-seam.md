# Passive-equilibrium Schur export seam

Status: declaration only; this document must be committed before the source
accessibility change, V2 implementation seal, or any normal-adult V2 target
execution

```text
declarationId:
  main-wire-normal-adult-passive-equilibrium-schur-export-seam-v1
bindingSchemaId:
  main-wire-normal-adult-passive-equilibrium-schur-export-seam-binding-v1
transformId:
  main-wire-normal-adult-passive-equilibrium-schur-export-only-transform-v1
```

These are technical accessibility and binding identities. They are not a new
scientific owner, point-solver policy, model, attempt, case, or claim.

## Scope and precedence

This declaration makes one prospective accessibility exception to
[INTEGRATED-MODEL-0019](INTEGRATED-MODEL-0019-passive-equilibrium-point-solver-numerical-addendum.md).
It does not change a historical result, numerical operation, function body,
scientific owner, policy identity, solver threshold, attempt, or frozen case.

Commit `28e6c5e9c7c7072853a79758fef6a2c09984cc30` and the historical V1
point-owner blob remain the immutable owners of the retrospective V1 values
described by 0019. Those values retain their V1 names, failure classifications,
unsealed status, and historical source identity. This declaration does not
rename, reinterpret, migrate, reseal, or make them eligible.

For the still-unexecuted V2 engineering attempt only, the 0019 requirement that
the V1 point-owner _source blob_ remain byte-for-byte unchanged is narrowed to
permit the single accessibility transform below. Every function-body byte and
all numerical and scientific behavior of existing call sites remain
unchanged. Module accessibility and ESM export topology change exactly and
only as declared below. All other 0018 and 0019 requirements, including the V2
Armijo policy, binary64 guards, branch and surface policies, evidence gates,
reservation protocol, negative claims, and publication boundary, remain in
force.

## Historical and runtime source identities

The two source identities have different roles and may not substitute for one
another:

| Role | Git blob SHA-1 | Raw file SHA-256 | Byte size |
| --- | --- | --- | ---: |
| Historical V1 point-owner source | `43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d` | `3b096c8c3d386113c8b16fa43870d387d6bfd79f72debc04eb1caabb2756adac` | 86255 |
| Prospective runtime point-owner source | `7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9` | `13e760df8266891fcd3a30a40c815d1b08d6875eb4c606ea2fb148b4633b163a` | 86262 |

The historical V1 observations and their provenance continue to bind the
historical blob. The V2 runtime owner, runner, evidence, and artifact bind the
prospective runtime blob and also retain the historical blob as immutable
source provenance. Reporting only one blob, relabeling the runtime blob as the
historical execution owner, or treating matching function semantics as blob
identity fails closed.

## Only permitted byte transform

The affected path is exactly:

```text
engine/myocardium/experiments/
  MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts
```

Against the historical blob, the prospective runtime blob inserts exactly the
seven ASCII bytes `export ` at zero-based byte offset `73677`. Their hexadecimal
values are:

```text
65 78 70 6f 72 74 20
```

The unique old occurrence beginning at that offset is:

```text
function reducedFourChamberTangentV1(
```

The unique new occurrence beginning at the same offset is:

```text
export function reducedFourChamberTangentV1(
```

The implementation seal must independently read both Git blobs as raw bytes
and prove all of the following before any target evaluation:

1. the old and new blob IDs, raw SHA-256 values, and sizes equal the table;
2. the old signature occurs exactly once and begins at byte `73677`;
3. the new exported signature occurs exactly once and begins at byte `73677`;
4. `new[0:73677]` equals `old[0:73677]` byte for byte;
5. `new[73677:73684]` is exactly the seven-byte ASCII insertion above;
6. `new[73684:86262]` equals `old[73677:86255]` byte for byte; and
7. the new size is the old size plus exactly seven bytes.

An encoding rewrite, newline change, formatter output, comment change, type
change, body change, second insertion, moved insertion, or equivalent source
rewrite is outside this declaration. A textual diff alone is insufficient;
the byte, digest, size, offset, occurrence, prefix, insertion, and suffix gates
must all pass.

## Fixed declaration, implementation, and seal commits

The implementation sequence is amended to exactly three commits:

1. **D** is a documentation-only commit whose direct parent is
   `5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6`. D changes only this 0020
   document and the scientific-runtime README index. It contains no V2 source,
   test, runner, auditor, manifest, tombstone, or target result.
2. **A** is D's direct child. Relative to D, the V1 point-owner path may change
   only by the verified seven-byte insertion above. A also contains the V2
   point owner and solver-policy implementation, manufactured tests,
   zero-argument runner, and independent auditor required by 0019. A contains
   no normal-adult target result.
3. **B** is A's direct child and changes only the two data files already fixed
   by 0019:

   ```text
   docs/scientific-runtime/evidence/
     passive-equilibrium-point-solver-v2-seal-manifest-v1.json
   docs/scientific-runtime/evidence/
     passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1.json
   ```

B must prove the exact parent chain
`5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6 -> D -> A -> B`, pin D and A
by full commit SHA, pin this document and both point-owner blobs, and retain
the complete byte-transform audit. Any additional D path, any additional B
path, or any V1-path change beyond the insertion makes the engineering attempt
ineligible before reservation.

Relative to D, A may add or modify only these paths:

```text
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.ts
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2.ts
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2.ts
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts
engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2.ts
tools/runMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts
__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.test.ts
__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.test.ts
vitest.suites.ts
package.json
```

The first path is limited to the byte transform above. The two documentation
paths committed by D must have exactly the same Git blob IDs in A as in D.
Every other existing path outside this allowlist must have the same blob in D
and A. A missing required owner, auditor, runner, manufactured-test, sealing-
test, suite registration, or zero-argument package command fails completeness;
the allowlist does not make an omitted component optional. B reconstructs and
enforces this complete D-to-A path and blob audit before reservation.

## Pure accessibility boundary

The exported `reducedFourChamberTangentV1` remains the existing pure Schur
projection owner. The new keyword changes module accessibility only. The
function name, parameters, return shape, body, arithmetic order, pressure
basis, chamber order, internal-coordinate elimination, null/failure behavior,
and scientific identity are unchanged.

The exported helper is unbranded. Calling it does not mint or establish:

- an equilibrated or qualified point;
- a reference root or `stageZeroRootSha256`;
- a sealed root, evidence envelope, auditor pass, or artifact admission;
- branch agreement, a surface, or any public scientific claim.

The official V2 owner is the only official path permitted to pass a candidate
to this helper. That candidate must be freshly produced by the unchanged
canonical V1 candidate evaluator inside the runner-owned, manifest- and
reservation-bound V2 execution. Caller-supplied candidates, projections,
lineage, owner labels, hashes, or eligibility claims cannot be promoted by the
helper. Tests and non-official callers may use the pure projection, but their
outputs remain unbranded and ineligible.

## Complete declaration binding

A must construct one closed Schur-export-seam binding payload containing
exactly the following fields and values:

```text
declarationId:
  main-wire-normal-adult-passive-equilibrium-schur-export-seam-v1
bindingSchemaId:
  main-wire-normal-adult-passive-equilibrium-schur-export-seam-binding-v1
transformId:
  main-wire-normal-adult-passive-equilibrium-schur-export-only-transform-v1
documentPath:
  docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md
declarationDirectParentCommitSha:
  5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6
declarationCommitSha: D full SHA
declarationDocumentGitBlobSha1: exact D document blob
declarationDocumentRawSha256: exact D document raw SHA-256
historicalPointOwner:
  sourceCommitSha: 28e6c5e9c7c7072853a79758fef6a2c09984cc30
  sourceTreeSha: 05b8df7071240931160c91203bf8ae13556471ad
  path: engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts
  gitBlobSha1: 43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d
  rawSha256: 3b096c8c3d386113c8b16fa43870d387d6bfd79f72debc04eb1caabb2756adac
  byteSize: 86255
runtimePointOwner:
  gitBlobSha1: 7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9
  rawSha256: 13e760df8266891fcd3a30a40c815d1b08d6875eb4c606ea2fb148b4633b163a
  byteSize: 86262
transform:
  path: engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts
  zeroBasedInsertionOffset: 73677
  insertedAscii: "export "
  insertedHex: "6578706f727420"
  insertedByteCount: 7
  oldSignatureOccurrenceCount: 1
  newSignatureOccurrenceCount: 1
  prefixExact: true
  insertionExact: true
  suffixExact: true
historicalNumericalFunctionBodyOrExistingCallBehaviorChanged: false
moduleExportTopologyChanged: true
functionBodyChanged: false
scientificIdentityChanged: false
qualificationMintedByExport: false
newModelIdIntroduced: false
newSolverPolicyIntroduced: false
newAttemptIntroduced: false
newCaseIntroduced: false
thresholdChanged: false
```

The complete object, not a subset or self-reported booleans, is hashed as:

```text
schurExportSeamBindingSha256 =
  sha256CanonicalJsonHex(schurExportSeamBindingPayload)
```

The V2 numerical solver-policy payload and its hash remain exactly those
frozen by 0019; 0020 does not rewrite or extend that scientific numerical
policy. The V2 point-owner compatibility payload, B seal manifest, final
engineering artifact, and future surface input bundle must retain this exact
full seam payload and recomputed hash.

The 0019 common-directory reservation retains the unchanged complete B
`sealManifestSha256`; each staged journal retains the unchanged complete
reservation payload and digest. The manifest owns the full seam payload and
hash, so reservation and journal bind it transitively without adding caller-
chosen fields to their exact 0019 schemas. The final artifact replays that
chain and additionally retains the full seam payload for direct audit.

The independent auditor rereads the D and A commits and both blobs, repeats
the raw-byte transform and D-to-A allowlist audits, reconstructs the payload,
and requires canonical object equality and hash equality. A matching digest
does not permit omitted or normalized fields.

The 0019 authority and reservation protocol remains authoritative. This
additional binding neither consumes an attempt nor permits a caller to supply
commit, blob, transform, or qualification claims.

## Unchanged scientific and execution boundary

This declaration introduces no new model ID, point-solver policy, attempt ID,
case, path, seed, threshold, tolerance, evidence relaxation, or execution. It
does not change the four frozen cases or three top-level executions. It does
not authorize a scan, target probe, normal-adult solve, branch audit, surface
construction, official artifact, live Output or Graph item, PE, PVA, MVO2,
ATP, efficiency, physiology, clinical validation, or patient-specific claim.

The target remains forbidden until D, then complete A, then data-only B are
cleanly committed and every 0019 and 0020 preflight binding passes. Failure of
the byte transform, commit topology, candidate authority, full payload, hash,
manifest, reservation, independent audit, or any unchanged 0019 gate remains
fail closed.
