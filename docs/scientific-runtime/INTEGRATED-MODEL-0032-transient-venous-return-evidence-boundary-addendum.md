# INTEGRATED-MODEL-0032 — Transient venous-return evidence boundary addendum

Status: prospective addendum, committed before the first normal-adult source or intervention evaluation

## Purpose

INTEGRATED-MODEL-0031 fixes a compact, create-only Engineering artifact and
forbids retaining the full accepted-step trace. Its artifact section also says
that an independent auditor recomputes landmarks and compact loops from the
retained beat payload. Those two statements are not simultaneously achievable:
a SHA-256 digest of omitted raw accepted endpoints is a binding fingerprint,
not a semantic proof from which extrema, valve-flow crossings, or interpolation
values can be reconstructed.

This addendum narrows only that evidence claim. It does not change the source,
intervention, schedule, pressure basis, landmark definitions, compact-loop
sampling, relation methods, failure classes, completion rule, or negative
claims declared by INTEGRATED-MODEL-0031.

## Frozen two-layer evidence boundary

### Producer-time raw replay

During the single in-memory execution, the owner retains the raw projected PV
endpoint series for all 21 beats only until projection is complete. Before any
relation is constructed, it must:

1. construct the 21 landmark and 64-point compact-loop projections;
2. invoke the frozen pure projection owner again from the raw PV endpoint
   series;
3. compare every projection by canonical exact equality;
4. retain a closed producer audit containing the raw-beat family digest, the
   projection-family digest, pass/fail status, and first mismatch path; and
5. fail with retained evidence before relation construction if the replay does
   not pass or throws.

The raw endpoint arrays remain transient runtime data. They are neither written
to the committed artifact nor accepted from the CLI or another caller.

### Compact artifact replay

The generic compact-artifact auditor independently verifies:

- the complete schedule and 21-beat lineage;
- all retained hashes and closed field shapes;
- the retained producer-audit identity and pass/fail semantics;
- all relations, support envelopes, hysteresis pairs, assessments, negative
  claims, and outer hashes from the retained compact projections.

It does **not** claim to reconstruct omitted raw endpoint values from their
SHA-256 digest. Therefore a generic, caller-resealed compact payload is not by
itself historical proof that the raw-to-projection computation occurred.

### Result lock required before merge

After the single target execution, and without rerunning it, a post-result
hardening commit must bind all of the following exact values:

- implementation commit SHA;
- artifact payload SHA-256;
- raw artifact SHA-256 and byte count;
- canonical-JSON-with-one-terminal-newline encoding; and
- declaration and addendum identities.

The committed-artifact verifier must require those exact locks in addition to
the generic structural audit. Coordinated landmark/loop/relation resealing,
top-level extra fields, whitespace changes, and implementation-identity changes
must be negative fixtures. The artifact is ineligible for merge until this
post-result lock exists and passes independent read-only review.

## Required pre-target verification amendment

Before the target can run, dependency-injected manufactured tests must exercise
the same orchestration used by the zero-argument fixed wrapper while being
machine-readably nonqualified. At minimum they cover:

- source P1 success, source non-P1, source execution failure, and each source
  binding mismatch/restore failure;
- all-settled execution of the fixed 21-beat schedule;
- first-beat source anchoring, continuous beat time/revision lineage, global
  event/deposit identity uniqueness, numerical-integrity gates, and schedule
  scale bounds;
- trajectory, cycle-integrity, projection, producer-audit, relation-construction,
  and relation-auditor failure arms with retained partial evidence;
- raw-to-projection producer replay and coordinated compact projection tamper;
  and
- a complete successful report that remains below 524288 bytes.

The manufactured entry point cannot mint a qualified or official result and
cannot be called by the fixed CLI. The normal-adult source, intervention, and
target remain forbidden until these tests, typecheck, formatting, diff checks,
and the existing fast suite pass.

## Claim boundary

This addendum establishes no numerical result. In particular, it does not make
the compact artifact independently self-proving, does not authenticate a
canonical source, and does not establish ESPVR, EDPVR, potential energy, PVA,
physiological validity, official qualification, or public eligibility.
