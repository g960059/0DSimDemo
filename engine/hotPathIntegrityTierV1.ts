/**
 * Chooses complete invariant revalidation or the admitted live hot path.
 *
 * Lean mode uses the admitted typed ordinary-step path, including its coupled
 * predictor, and skips redundant validation of privately constructed state.
 * Full-invariant retains the independent public, unpredicted transaction path;
 * it is not a byte-equivalent execution mode for predictor-enabled releases.
 * Cold initialization, restores, arithmetic, checkpoints and mutable inputs
 * remain validated in either mode. To audit validation reuse without changing
 * numerical paths, disable validation stamps while retaining the same tier.
 *
 * The default is full validation. Scientific Worker entry points explicitly
 * select lean mode; tests qualify that path and exercise stamp-disabled runs.
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
