/**
 * Hot-path integrity tier.
 *
 * The scientific kernel carries value-producing checks, public-boundary
 * validation, and defensive construction proofs. Value-producing checks and
 * validation of mutable data crossing a public boundary always run. In
 * particular, accepted mechanics material contains typed arrays that cannot be
 * frozen, so both tiers re-encode and fingerprint it whenever it re-enters a
 * step.
 *
 * `hot-path-lean` selects only checks whose result is not consumed by the
 * numerical method:
 *
 * - immediate deep re-proof of a constructor output assembled from validated
 *   inputs;
 * - same-tick recomputation for an exact privately issued candidate/base pair;
 * - defensive clones or freezes that protect diagnostic readback rather than
 *   an accepted numerical value; and
 * - repeated validation of an exact identity whose complete reachable graph is
 *   proven to be transitively frozen plain data.
 *
 * Some selected constructor proofs are the only immediate validation of an
 * output that becomes accepted state and is later serialized into a
 * checkpoint. Full-invariant can therefore catch a constructor bug at that
 * site which hot-path-lean will not. Lean does not claim equivalent fault
 * detection; it claims the same numbers only when those constructors satisfy
 * their contracts.
 *
 * `__tests__/hotPathIntegrityTierV1.test.ts` runs the same trajectory in both
 * tiers and pins observation, diagnostic and checkpoint equality. The
 * canonical accepted-state sequence has its own exact SHA-256 pin. Together
 * those tests make a numerical change reviewable; they do not turn omitted
 * constructor proofs into checks.
 *
 * Precedent: the release already separates a presentation tier from an exact
 * tier (live sampling is decimated; exact 0.002 s data comes from deterministic
 * replay). This is the same shape one level down — a cheap live tier and a
 * full-invariant tier that remains the reference.
 *
 * Default and scope:
 *
 * - The default is `full-invariant`. Every node harness, every verifier, every
 *   generator and the whole test suite therefore keep every check, with no
 *   opt-in required and no change to what they already assert.
 * - The live scientific Worker entry points explicitly select
 *   `hot-path-lean`: the established non-coronary Worker and the separate
 *   integrated V3 Worker. The exact signal replay/export path runs on its own
 *   host and never selects it.
 * - `CIRCLEHEART_HOT_PATH_INTEGRITY` (node) and
 *   `VITE_CIRCLEHEART_HOT_PATH_INTEGRITY` (bundled builds) can move the default
 *   for a whole process; the Vite variable is a literal at build time, so a
 *   build that pins it lets the bundler fold the tier test to a constant.
 *
 * What `hot-path-lean` does NOT do: it never skips a residual test, a
 * convergence test, a conservation audit, a finiteness flag that is reported,
 * or validation of mutable data crossing or re-entering a public boundary.
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
 * True when full defensive constructor proofs, defensive clones, and
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
