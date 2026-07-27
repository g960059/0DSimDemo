/**
 * Hot-path integrity tier.
 *
 * The scientific kernel carries two kinds of check. Some compute a value the
 * model reports; those always run. Others are *defensive*: they re-prove a
 * precondition the caller already established, re-clone data the module minted
 * itself, or freeze a record that never escapes the step. Those are what this
 * tier selects.
 *
 * The two tiers are numerically identical by construction: nothing selected
 * here feeds an accepted value, a diagnostic, an observation or a checkpoint.
 * `__tests__/hotPathIntegrityTierV1.test.ts` runs the same trajectory in both
 * tiers and pins the observation, diagnostics and exact-checkpoint hashes, so
 * the two tiers cannot drift apart unnoticed.
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
 * - Exactly one entry point selects `hot-path-lean`: the live simulation Worker
 *   (`engine/scientificBrowser/mainWireScientificWorkerV1.ts`). The exact
 *   signal replay/export path runs on its own host and never selects it.
 * - `CIRCLEHEART_HOT_PATH_INTEGRITY` (node) and
 *   `VITE_CIRCLEHEART_HOT_PATH_INTEGRITY` (bundled builds) can move the default
 *   for a whole process; the Vite variable is a literal at build time, so a
 *   build that pins it lets the bundler fold the tier test to a constant.
 *
 * What `hot-path-lean` does NOT do: it never skips a residual test, a
 * convergence test, a conservation audit, a finiteness flag that is reported,
 * or any validation of data crossing a public boundary from outside this
 * package.
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
 * True when defensive hot-path checks, defensive clones and hot-path freezing
 * are enabled. Guarded sites read this and nothing else.
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
