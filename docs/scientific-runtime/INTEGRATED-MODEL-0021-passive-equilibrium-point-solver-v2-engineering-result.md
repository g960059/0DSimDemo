# Passive-equilibrium point-solver V2 engineering result

Status: the one preregistered V2 engineering attempt completed with intact
evidence and failed its frozen scientific gates; V2 is closed without solver,
branch, surface, or public-output admission

## Lineage and execution

The numerical supersession was declared by
[INTEGRATED-MODEL-0019](INTEGRATED-MODEL-0019-passive-equilibrium-point-solver-numerical-addendum.md).
The unchanged Schur owner was exposed only through the seven-byte transform
declared by
[INTEGRATED-MODEL-0020](INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md).
The fixed commit chain is:

```text
declaration D     = 03fa37844067031612436a5330e6d7cae8a1ff84
implementation A  = 12311a3b45e45cc524015fea8f6e2ba5533b0987
seal B             = 851a68c0743d6b4332991ea166478f4b8aed83f5
```

The documented zero-argument command was invoked exactly once after B from a
clean worktree. It consumed the common-Git-directory reservation, completed
all three top-level executions, wrote the terminal journal and failure
artifact, and returned a nonzero process status because official eligibility
was false. The reservation is permanent. The V2 command must not be invoked
again under its existing or a substitute name.

No threshold, solver rule, seed, volume, path, evidence projection, status, or
claim was changed after the result was observed.

## Retained evidence and archive

The complete raw artifact and journal are intentionally not ordinary Git
blobs: the artifact exceeds GitHub's normal 100 MiB blob limit. Their exact
bytes are retained as deterministic `gzip -n -9` archives. Decompression was
verified to reproduce both raw SHA-256 values exactly.

The machine-readable archive index is:

[`evidence/passive-equilibrium-point-solver-v2-engineering-reruns-v1.archive-index.json`](evidence/passive-equilibrium-point-solver-v2-engineering-reruns-v1.archive-index.json)

| Evidence                  |   Raw bytes | Raw SHA-256                                                        | Archived bytes | Archive SHA-256                                                    |
| ------------------------- | ----------: | ------------------------------------------------------------------ | -------------: | ------------------------------------------------------------------ |
| Official failure artifact | 129,222,789 | `78950480d083372cd1304c3cff80b40754d43ad024201885163121130d0426fe` |      8,833,227 | `22de7c96a4421bf82192510856a20bf0763f8676771bcca465bd1e6d11524446` |
| Terminal attempt journal  |  39,501,361 | `c46ea767b49c14094c81e41b8a9eb9483632d0980ecb1da9ac5a75a590bd014e` |      2,694,880 | `2d5ebc1f6a29b2126bc4beb3f5959676d079b2791bf50dcd36c044cf0bf01689` |

The artifact canonical payload SHA-256 is
`31871751324c11be828fb015a42a1aa591e193be43071b62e54f41576bbd84c3`.
The terminal journal payload SHA-256 is
`c2c639e4762dacbdc5ad7c8468e9e5178670600d4fa1d51abd68252addda7362`.
The seal manifest, common-directory authority, and consumed reservation bind
as follows:

```text
sealManifestSha256               = 4dbfc7e7185ee1152d5095fb4db67a6d81b8e16254e8bc237febabbdb01a91a3
authoritativeCloneRecordSha256    = 6a402d9a800d3eccb0feea1aa56d9d728b9ff0dbb71eef84fef3054ad20dd7a9
commonDirReservationSha256        = 96609fb603e142ef3b527a9c458b62f89654b2a45ae7b5cc6c9eb24cf1e899de
```

The raw byte size, raw SHA-256, envelope schema, and canonical payload SHA-256
are the scientific evidence identity. The gzip bytes, archive SHA-256, and Git
blob are a fixed archival-encoding identity. Recompressing the same raw bytes
changes the archive identity and requires a new archive index, but does not
change the scientific result when the decompressed raw binding still matches.
Reformatting the JSON or selecting only a passing subset changes the raw
evidence and does not preserve this result.

## Frozen outcome

The executable decision is:

```text
artifact status                                  = failed
reference root                                   = admitted
literal-midpoint primary execution               = scientific-failure
canonical-index-16 primary execution              = scientific-failure
reference branch audit execution                  = scientific-failure
complete all-settled coverage                     = true
pre-admission independent auditor                 = failed
officialSealedEngineeringEvidenceEligible         = false

continuous branch established                     = false
global minimum or uniqueness established          = false
passive multichamber surface established           = false
live Output or Graph established                   = false
physiological or clinical validation established   = false
```

All retained artifact, reservation, six-stage journal-chain, root, execution,
case, participant, pair, and independent-auditor hashes recomputed. The
failure is therefore scientific and numerical, not an integrity, governance,
lineage, exception-retention, or evidence-replay failure.

## Reference root passed

The shared reference-volume solve was independently replayed and admitted. It
converged in four Newton updates to:

```text
scaled force infinity norm                   = 3.30562670569634e-14
scaled force tolerance                       = 1e-10
minimum scaled internal-Hessian eigenvalue   = 0.1778935105367658
canonical factorized stored energy           = 0.03550897925236462 J
```

The terminal candidate was finite and strictly locally stable. This admits
only the common reference root used by the frozen engineering attempt. It does
not admit the V2 point solver generally, a continuous root branch, or an
equilibrium-energy surface.

## Both frozen midpoint cases failed

The literal midpoint and the one-ULP-distinct canonical index-16 midpoint each
completed the first of 32 homotopy stages. Both failed at stage 2 with the same
declared reason:

```text
failure reason                     = scaled-update-stagnated
selected backtrack exponent        = 24
accepted scaled update norm        = 5.023638240098982e-16
accepted scaled force norm         = 7.555574794482212e-9
force tolerance                    = 1e-10
exact Armijo expansion sign        = -1
```

The canonical target bits differ from the retrospective V1 literal midpoint,
but the first two stage-volume computations rounded to the same binary64
values. The repeated result is therefore not an additional independent
surface sample and cannot be promoted by treating the two case labels as two
successful points.

## Required branch agreement failed

The branch execution retained all 12 required participants and all 66 declared
pairs. Ten participants converged; two required reference-seed participants
failed:

| Participant                | Failure                              | Retained numerical signature                                               |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `seed-zero-plus-0.25`      | `scaled-update-stagnated` at stage 0 | force `4.00621e-10`, update `3.85226e-13`, selected `b=10`                 |
| `seed-plus-0.25-plus-0.25` | `line-search-failed` at stage 0      | `b=0..26` exact Armijo rejection; `b=27..28` bitwise zero-coordinate steps |

Among the ten converged participants, all 45 comparable pairs passed. Their
largest observed differences were:

```text
maximum scaled coordinate difference   = 7.97224e-11   (gate 1e-7)
maximum absolute energy difference      = 1.04083e-16 J (gate 1e-10 J)
maximum scaled pressure difference      = 3.21090e-10   (gate 1e-7)
```

This is a tight sampled cluster for the successful subset. The preregistered
claim, however, required every one of the 12 participants. Twenty-one pair
records involving a failed participant were correctly retained as
unavailable. The result is therefore `required-participant-failed`, not a
passing branch agreement with two exclusions.

## Retrospective no-rerun diagnostic

An offline read of the immutable artifact exposed one useful mechanism. It did
not call the candidate owner, solver, runner, CLI, or model and did not create
a new V2 result.

At each of the three distinct failing states, the retained full Newton
candidate (`b=0`) was finite, strictly stable, changed coordinate bits, and
reduced the force norm to approximately machine precision:

| Failing state                      |    Full-step trial force |  Retained wall-energy delta |
| ---------------------------------- | -----------------------: | --------------------------: |
| Literal/canonical midpoint stage 2 | `1.0258460747536447e-16` |  `+4.336808689942018e-17 J` |
| `seed-zero-plus-0.25` stage 0      |  `1.795230630818878e-16` | `+2.2551405187698492e-17 J` |
| `seed-plus-0.25-plus-0.25` stage 0 |   `2.19824158875781e-16` | `+2.5153490401663703e-17 J` |

The exact V2 expansion therefore appears to have done its declared job: it
faithfully summed the already-rounded wall-energy differences. The remaining
loss occurs upstream of the outer compensated sum, where wall energies have
already been evaluated and rounded. The precise source may involve geometric
inversion, transcendental constitutive evaluation, or cancellation inside a
wall energy. This artifact-only observation does not identify a formula bug,
does not prove that the full step should have been accepted under V2, and does
not convert any frozen failure into a pass.

## Scientific interpretation and claim boundary

The defensible conclusions are limited:

1. the one official V2 attempt is complete, hash-consistent, independently
   replayed, and failed closed;
2. the common reference point is a finite, stationary, strictly locally stable
   equilibrium-passive root;
3. both frozen midpoint paths encountered the same finite-precision
   stagnation boundary at stage 2; and
4. ten successful branch participants form a very tight sampled cluster, while
   two required participants fail the frozen policy.

The result does not establish:

- general V2 point-solver eligibility;
- agreement of all 12 required branch participants;
- a continuous branch, global minimum, uniqueness, convexity, or a sampled or
  continuous passive multichamber surface;
- an EDPVR, PE, PVA, MVO2, ATP, or efficiency owner;
- physiology, clinical validation, patient-specific validity, or a public
  Output or Graph item.

## Next boundary

V2 is final and must not be retried. Work may continue only prospectively:

1. finish an artifact-only numerical postmortem that quantifies the wall-level
   rounding and Taylor-model discrepancy without reevaluating the archived
   normal-adult candidates;
2. preregister a new V3 owner, solver policy, attempt, reservation, evidence
   union, and negative claims before any new normal-adult execution;
3. compare, without selecting in this result document, at least a scaled
   residual-merit globalization and a guarded terminal full-Newton criterion;
   the former applies one root-equation merit consistently, while the latter
   is a smaller intervention but risks being tailored to the observed `b=0`
   candidates;
4. consider stable wall-increment evaluation or higher precision only if the
   postmortem locates the defect in stored-energy evaluation, and reserve a
   trust-region method for cases where the simpler prospective policies are
   inadequate; and
5. redesign future evidence storage as content-addressed chunks with a compact
   manifest, separately from any numerical policy change.

Any V3 attempt is a new prospective experiment, not a V2 rerun or correction
of this artifact. A future V3 pass would qualify only the newly declared point
solver boundary. Surface construction, pericardial variants, EDPVR, PVA, and
public outputs would still require their own later preregistered admissions.
