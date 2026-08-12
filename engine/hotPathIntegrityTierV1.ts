/**
 * Hot-path integrity tier: factual guard and stamp inventory.
 *
 * Measured price on lane `334636c9`: the fixed harness first measured lean at
 * 1.613/1.518 and full at 2.401/2.399 ms per accepted step, about 54% slower
 * before the constructor-side checks below were restored. On the completed
 * working tree, four alternating runs measured lean at
 * 1.539/1.542/1.567/1.570 and full at
 * 2.638/2.643/2.651/2.674 ms per accepted step, about 71% slower by the means.
 * An isolated interleaved build comparison attributes 0.248 ms/step, or 11.1%
 * over the no-Family-B full tier, to those restored constructor checks. Before
 * the harness fix, a full-requested `sequenceHashV3` run silently selected
 * lean, so older measurements made through that utility are not tier evidence.
 * On the 2026-08-12 mobile-performance lane, retaining immutable validation
 * proofs reduced four local lean runs from
 * 1.419/1.418/1.443/1.432 to 1.200/1.195/1.193/1.198 ms per accepted step,
 * about 16% by the means. This is development-host profiling evidence, not a
 * target-phone qualification result.
 *
 * Tier-selected sites:
 *
 * - `nonCoronaryCirculationBackwardEulerV1` checks exact topology key sets and
 *   freezes freshly built node/edge records only in full. Per-field validation
 *   and every arithmetic value are outside those guards. No stamp is involved.
 * - `landSlsWallMaterialV1` re-validates the kernel-owned previous state in its
 *   trial, accepted-state evaluation, and codec clone only in full. Cold and
 *   restore entry points still validate, and the copy/math still runs in lean.
 *   These states contain a mutable typed array and never earn a frozen-data
 *   stamp.
 * - `wholeHeartMechanicsContractV1` always clones material state and
 *   fingerprints encoded state. Full additionally encodes a second clone and
 *   walks it for serializability; it also clones diagnostic readback where lean
 *   publishes the provider readback reference. The diagnostic readback is not
 *   accepted state or checkpoint material. No stamp is involved.
 * - `acceptedComposedRhythmTransactionV2` fully validates each freshly built
 *   candidate state in full before stamping it. Lean stamps the module-built
 *   graph without that independent re-walk. Full also recomputes an exact
 *   same-tick candidate/base pair at commit; lean may reuse the private pair.
 * - `acceptedAutoregulationWindowV3` fully validates each freshly advanced
 *   state, including its supplied outer clock, in full before stamping it.
 *   Lean stamps the module-built state/binding pair without that re-walk.
 * - `MainWireIntegratedModelTransactionV3` fully validates each private outer
 *   accepted tuple in full before the tuple/context stamp is issued. Lean
 *   stamps the wrapper built from its three owner outputs without that
 *   independent validation. The two constructor fault controls pin that full
 *   rejects an outer clock 0.001 s ahead of its owners and a dynamic candidate
 *   that publishes NaN flow before either defect can earn this stamp.
 *
 * Persistent stamps are separate from the tier. Only module-private issuers can
 * create them, and `validation-stamps-disabled` makes every reuse and issuance
 * eligibility check miss:
 *
 * - Composed rhythm stamps a transitively frozen configuration identity.
 *   Factory issuance means "constructed canonically here"; exported-validator
 *   issuance means "fully validated". A copied, restored, mutable, or hand-built
 *   configuration misses. The state WeakSet accepts only a transitively frozen
 *   state: initialization means fully validated, a full-tier candidate means
 *   independently validated, and a lean candidate means constructed and
 *   recursively frozen here from owner candidates. The private issuer uses
 *   that provenance instead of re-walking the just-built graph. A state
 *   clone/restore misses. There are no mutable
 *   descendants to re-check on an identity hit.
 * - The regular atrial and ventricular backup owners retain successful
 *   exported-validator proofs for exact configuration/state identities only
 *   when the complete graph is transitively frozen plain data. Copies,
 *   restores, mutable descendants, and stamp-disabled verification miss.
 * - Dynamic MCS stamps a transitively frozen profile identity and exact live
 *   state/profile/config triples. Profile factory issuance means constructed
 *   from validated copied fields; validator issuance means fully validated.
 *   State factory and hydraulic-candidate issuance mean constructed here with
 *   live-factory provenance. Those private constructors freeze every state
 *   descendant and therefore prove the new state without a second recursive
 *   walk, while the profile/config identities retain their generic
 *   transitive-frozen proof. Validator issuance means structurally validated
 *   against that context. Restores retain live provenance but receive no
 *   context stamp. A clone, restore, profile/config substitution, mutable
 *   descendant, or non-live state misses; no mutable descendant is skipped on
 *   a hit because all three eligible graphs are transitively frozen plain data.
 * - Coronary autoregulation stamps a transitively frozen binding identity.
 *   Factory issuance means constructed here; validator issuance means fully
 *   validated. Its state stamp binds an exact transitively frozen state to an
 *   exact binding. Full candidate issuance follows complete state validation;
 *   lean candidate issuance means constructed here. A clone, restore, binding
 *   substitution, or mutable descendant misses. The supplied outer
 *   clock/revision is re-checked even on a state/binding hit.
 * - Static coronary IMP priors and topology identities retain successful
 *   exported-validator proofs only after the complete immutable graph passes.
 *   The canonical coronary fingerprint likewise memoizes only a transitively
 *   frozen graph; mutable scientific inputs are always recomputed.
 * - The integrated V3 WeakMap keys the exact outer accepted tuple and records
 *   exact rhythm-configuration/dynamic-profile/dynamic-config triples. Only the
 *   private wrapper can seed an entry: in full the seed means the entire tuple
 *   was validated; in lean it means only that the wrapper was constructed here
 *   from owner outputs. A later context can be added only after complete
 *   validation. Eligibility proves the context triple is transitively frozen;
 *   it does not prove the accepted-state graph is transitively frozen. In
 *   particular the coronary mechanics Land typed arrays remain mutable. An
 *   exact tuple/context hit re-checks no mutable descendant at this site.
 *   Cloning/restoring the tuple or substituting any context identity misses and
 *   takes complete validation; owner-specific checks, including mechanics
 *   fingerprints, remain the responsibility of their downstream sites.
 * - The coronary V3-to-V2 view cache is issued only after the exact V3 object
 *   and reconstructed V2 view pass their validators, the V3 wrapper surfaces
 *   are frozen, and the exact autoregulation state/binding pair has just passed
 *   its exported validation. Its private constructor freezes every accepted
 *   state record; the generic immutable-data proof is retained for the
 *   external binding identity.
 *   It does not claim the embedded mechanics graph is transitively frozen. A
 *   hit reuses the cached V2 view without re-checking mutable descendants at
 *   this site. A clone/restore misses by V3 identity; this cache has no context
 *   triple to substitute.
 *
 * Selection and verification:
 *
 * - The default is `full-invariant`.
 * - The live scientific Worker entry points explicitly select
 *   `hot-path-lean`; the integrated Worker reports the selected tier in its
 *   protocol diagnostics.
 * - `CIRCLEHEART_HOT_PATH_INTEGRITY` (node) and
 *   `VITE_CIRCLEHEART_HOT_PATH_INTEGRITY` (bundled builds) can move the default
 *   for a process. `CIRCLEHEART_VALIDATION_STAMPS=disabled` independently
 *   selects the complete-revalidation verification mode, whose effective mode
 *   is printed by `sequenceHashV3`.
 */

export const HOT_PATH_INTEGRITY_TIER_V1_ID =
  "main-wire-hot-path-integrity-tier-v1" as const;

export const HOT_PATH_INTEGRITY_TIERS_V1 = Object.freeze([
  "full-invariant",
  "hot-path-lean",
] as const);

export type HotPathIntegrityTierV1 =
  (typeof HOT_PATH_INTEGRITY_TIERS_V1)[number];

export const DEFAULT_HOT_PATH_INTEGRITY_TIER_V1: HotPathIntegrityTierV1 =
  "full-invariant";

function environmentTierV1(): HotPathIntegrityTierV1 {
  let raw: unknown;
  try {
    raw = (import.meta as unknown as {
      env?: Record<string, unknown>;
    }).env?.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY;
  } catch {
    raw = undefined;
  }
  if (raw === undefined && typeof process !== "undefined") {
    raw = process.env?.CIRCLEHEART_HOT_PATH_INTEGRITY;
  }
  return raw === "hot-path-lean" ? "hot-path-lean" : DEFAULT_HOT_PATH_INTEGRITY_TIER_V1;
}

let selectedTier: HotPathIntegrityTierV1 = environmentTierV1();
// Read on every guarded site, so it is kept as a plain monomorphic boolean.
let fullInvariant = selectedTier === "full-invariant";

/** The tier this process is running. */
export function hotPathIntegrityTierV1(): HotPathIntegrityTierV1 {
  return selectedTier;
}

/**
 * True when the remaining tier-selected defensive checks, clones, and
 * hot-path freezing are enabled. Guarded sites read this and nothing else.
 */
export function fullHotPathInvariantsEnabledV1(): boolean {
  return fullInvariant;
}

/**
 * Selects the tier for this process. Intended for a Worker entry point that
 * owns its own module instance, and for the tier-equality test.
 */
export function selectHotPathIntegrityTierV1(
  tier: HotPathIntegrityTierV1,
): void {
  if (!HOT_PATH_INTEGRITY_TIERS_V1.includes(tier)) {
    throw new Error(`unknown hot-path integrity tier ${String(tier)}`);
  }
  selectedTier = tier;
  fullInvariant = tier === "full-invariant";
}

/** Runs `body` under `tier` and restores the previous tier afterwards. */
export function withHotPathIntegrityTierV1<T>(
  tier: HotPathIntegrityTierV1,
  body: () => T,
): T {
  const previous = selectedTier;
  selectHotPathIntegrityTierV1(tier);
  try {
    return body();
  } finally {
    selectHotPathIntegrityTierV1(previous);
  }
}
