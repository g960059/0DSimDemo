export const DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1 =
  "deterministic-maximin-latin-hypercube-v1" as const;

export type DeterministicMaximinLhsOptionsV1 = {
  readonly sampleCount: number;
  readonly dimensionCount: number;
  /**
   * Each seed defines one complete Latin-hypercube candidate. The selected
   * design maximizes the minimum Euclidean distance between any two points.
   */
  readonly candidateSeeds: readonly number[];
};

export type DeterministicMaximinLhsDesignV1 = {
  readonly algorithmId: typeof DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1;
  readonly sampleCount: number;
  readonly dimensionCount: number;
  readonly candidateSeeds: readonly number[];
  readonly selectedSeed: number;
  readonly selectedMinimumPairwiseDistance: number;
  readonly points: readonly (readonly number[])[];
};

/**
 * Build a deterministic, outcome-independent, space-filling design.
 *
 * This is deliberately a design generator rather than an optimizer over model
 * outputs. Every supplied seed is evaluated before one design is selected, and
 * the selection criterion depends only on unit-cube geometry. No physiology or
 * simulation result is accepted by this API.
 */
export function generateDeterministicMaximinLhsV1(
  options: DeterministicMaximinLhsOptionsV1,
): DeterministicMaximinLhsDesignV1 {
  validateOptions(options);
  const candidateSeeds = Object.freeze(
    options.candidateSeeds.map(normalizeSeed),
  );
  let selectedSeed = candidateSeeds[0]!;
  let selectedPoints = latinHypercubeCandidate(
    options.sampleCount,
    options.dimensionCount,
    selectedSeed,
  );
  let selectedMinimumPairwiseDistanceSquared =
    minimumPairwiseDistanceSquared(selectedPoints);

  for (let index = 1; index < candidateSeeds.length; index += 1) {
    const seed = candidateSeeds[index]!;
    const points = latinHypercubeCandidate(
      options.sampleCount,
      options.dimensionCount,
      seed,
    );
    const minimumDistanceSquared = minimumPairwiseDistanceSquared(points);
    if (
      minimumDistanceSquared > selectedMinimumPairwiseDistanceSquared ||
      (minimumDistanceSquared === selectedMinimumPairwiseDistanceSquared &&
        seed < selectedSeed)
    ) {
      selectedSeed = seed;
      selectedPoints = points;
      selectedMinimumPairwiseDistanceSquared = minimumDistanceSquared;
    }
  }

  return Object.freeze({
    algorithmId: DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1,
    sampleCount: options.sampleCount,
    dimensionCount: options.dimensionCount,
    candidateSeeds,
    selectedSeed,
    selectedMinimumPairwiseDistance: Math.sqrt(
      selectedMinimumPairwiseDistanceSquared,
    ),
    points: freezePoints(selectedPoints),
  });
}

export function minimumPairwiseDistanceV1(
  points: readonly (readonly number[])[],
): number {
  validatePointMatrix(points);
  return Math.sqrt(minimumPairwiseDistanceSquared(points));
}

function latinHypercubeCandidate(
  sampleCount: number,
  dimensionCount: number,
  seed: number,
): readonly (readonly number[])[] {
  const rows = Array.from(
    { length: sampleCount },
    () => Array<number>(dimensionCount).fill(0),
  );
  const random = mulberry32(seed);
  for (let dimension = 0; dimension < dimensionCount; dimension += 1) {
    const strata = Array.from({ length: sampleCount }, (_, index) => index);
    for (let index = sampleCount - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [strata[index], strata[swapIndex]] = [
        strata[swapIndex]!,
        strata[index]!,
      ];
    }
    for (let sample = 0; sample < sampleCount; sample += 1) {
      // The open-stratum jitter prevents points from landing on prior bounds.
      const jitter = openUnitInterval(random());
      rows[sample]![dimension] = (strata[sample]! + jitter) / sampleCount;
    }
  }
  return rows;
}

function minimumPairwiseDistanceSquared(
  points: readonly (readonly number[])[],
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let left = 0; left < points.length - 1; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      let sum = 0;
      for (let dimension = 0; dimension < points[left]!.length; dimension += 1) {
        const delta = points[left]![dimension]! - points[right]![dimension]!;
        sum += delta * delta;
      }
      if (sum < minimum) minimum = sum;
    }
  }
  return minimum;
}

function validateOptions(options: DeterministicMaximinLhsOptionsV1): void {
  if (!Number.isInteger(options.sampleCount) || options.sampleCount < 2) {
    throw new Error("sampleCount must be an integer >= 2");
  }
  if (!Number.isInteger(options.dimensionCount) || options.dimensionCount < 1) {
    throw new Error("dimensionCount must be an integer >= 1");
  }
  if (options.candidateSeeds.length < 1) {
    throw new Error("candidateSeeds must contain at least one seed");
  }
  const normalized = options.candidateSeeds.map(normalizeSeed);
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("candidateSeeds must be unique after uint32 normalization");
  }
}

function validatePointMatrix(points: readonly (readonly number[])[]): void {
  if (points.length < 2) throw new Error("at least two points are required");
  const dimensionCount = points[0]!.length;
  if (dimensionCount < 1) throw new Error("points must have at least one dimension");
  for (const point of points) {
    if (point.length !== dimensionCount) {
      throw new Error("all points must have the same dimension count");
    }
    if (point.some((value) => !Number.isFinite(value))) {
      throw new Error("all point coordinates must be finite");
    }
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new Error("each candidate seed must be an integer in [0, 2^32-1]");
  }
  return seed >>> 0;
}

function openUnitInterval(value: number): number {
  return Math.min(
    1 - Number.EPSILON,
    Math.max(Number.EPSILON, value),
  );
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function freezePoints(
  points: readonly (readonly number[])[],
): readonly (readonly number[])[] {
  return Object.freeze(points.map((point) => Object.freeze([...point])));
}
