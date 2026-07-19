export type OrderedCoronaryValveEventV1 = Readonly<{
  mitralClosingIndex: number;
  aorticOpeningIndex: number;
  aorticClosingIndex: number;
  mitralToAorticOpeningSamples: number;
  aorticEjectionSamples: number;
  mitralToAorticClosureSamples: number;
}>;

/** Cyclic boolean transition indices, including the last-to-first boundary. */
export function cyclicTransitionIndicesV1(
  values: readonly boolean[],
  from: boolean,
  to: boolean,
): readonly number[] {
  if (values.length === 0) return Object.freeze([]);
  return Object.freeze(values.flatMap((value, index) => {
    const previous = values[positiveModulo(index - 1, values.length)]!;
    return previous === from && value === to ? [index] : [];
  }));
}

/**
 * Pair MVC -> AoVO -> AoVC without reusing an event or crossing the next MVC.
 * Extra threshold crossings therefore fail the caller's one-to-one count gate
 * instead of being silently reinterpreted as a second cardiac cycle.
 */
export function pairOrderedCoronaryValveEventsV1(
  sampleCount: number,
  mitralClosingIndices: readonly number[],
  aorticOpeningIndices: readonly number[],
  aorticClosingIndices: readonly number[],
): readonly OrderedCoronaryValveEventV1[] {
  requireSampleCount(sampleCount);
  if (sampleCount === 0) return Object.freeze([]);
  validateIndices(sampleCount, mitralClosingIndices);
  validateIndices(sampleCount, aorticOpeningIndices);
  validateIndices(sampleCount, aorticClosingIndices);
  const events: OrderedCoronaryValveEventV1[] = [];
  const usedAorticOpeningIndices = new Set<number>();
  const usedAorticClosingIndices = new Set<number>();
  for (const mitralClosingIndex of mitralClosingIndices) {
    const nextMitralClosingDistance = Math.min(
      sampleCount,
      ...mitralClosingIndices
        .filter((index) => index !== mitralClosingIndex)
        .map((index) => positiveModulo(
          index - mitralClosingIndex,
          sampleCount,
        ))
        .filter((distance) => distance > 0),
    );
    const aorticOpening = nearestUnusedCyclicEvent(
      mitralClosingIndex,
      aorticOpeningIndices,
      usedAorticOpeningIndices,
      sampleCount,
      nextMitralClosingDistance,
    );
    if (aorticOpening === null) continue;
    const aorticClosing = nearestUnusedCyclicEvent(
      aorticOpening.index,
      aorticClosingIndices,
      usedAorticClosingIndices,
      sampleCount,
      nextMitralClosingDistance - aorticOpening.distance,
    );
    if (aorticClosing === null) continue;
    usedAorticOpeningIndices.add(aorticOpening.index);
    usedAorticClosingIndices.add(aorticClosing.index);
    events.push(Object.freeze({
      mitralClosingIndex,
      aorticOpeningIndex: aorticOpening.index,
      aorticClosingIndex: aorticClosing.index,
      mitralToAorticOpeningSamples: aorticOpening.distance,
      aorticEjectionSamples: aorticClosing.distance,
      mitralToAorticClosureSamples:
        aorticOpening.distance + aorticClosing.distance,
    }));
  }
  return Object.freeze(events);
}

export function cyclicIntervalsMaskV1(
  sampleCount: number,
  startIndices: readonly number[],
  endIndices: readonly number[],
): readonly boolean[] {
  requireSampleCount(sampleCount);
  validateIndices(sampleCount, startIndices);
  validateIndices(sampleCount, endIndices);
  const mask = Array.from({ length: sampleCount }, () => false);
  if (sampleCount === 0) return Object.freeze(mask);
  for (const startIndex of startIndices) {
    let nearestEndIndex: number | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const endIndex of endIndices) {
      const distance = positiveModulo(endIndex - startIndex, sampleCount);
      if (distance > 0 && distance < nearestDistance) {
        nearestDistance = distance;
        nearestEndIndex = endIndex;
      }
    }
    if (nearestEndIndex === null) continue;
    for (let offset = 0; offset < nearestDistance; offset += 1) {
      mask[(startIndex + offset) % sampleCount] = true;
    }
  }
  return Object.freeze(mask);
}

export function cyclicEligibleWindowMaskV1(
  sampleCount: number,
  startIndices: readonly number[],
  windowSampleCount: number,
  eligibilityMask: readonly boolean[],
): readonly boolean[] {
  requireSampleCount(sampleCount);
  validateIndices(sampleCount, startIndices);
  if (!Number.isInteger(windowSampleCount) || windowSampleCount < 0) {
    throw new RangeError("windowSampleCount must be a non-negative integer");
  }
  if (eligibilityMask.length !== sampleCount) {
    throw new RangeError("eligibilityMask length must equal sampleCount");
  }
  const mask = Array.from({ length: sampleCount }, () => false);
  for (const startIndex of startIndices) {
    for (let offset = 0; offset < windowSampleCount; offset += 1) {
      const index = (startIndex + offset) % sampleCount;
      if (eligibilityMask[index]) mask[index] = true;
    }
  }
  return Object.freeze(mask);
}

export function elapsedSamplesSinceLatestCyclicEventV1(
  index: number,
  eventIndices: readonly number[],
  sampleCount: number,
): number | null {
  requireSampleCount(sampleCount);
  if (sampleCount === 0 || eventIndices.length === 0) return null;
  validateIndices(sampleCount, [index]);
  validateIndices(sampleCount, eventIndices);
  return Math.min(...eventIndices.map(
    (eventIndex) => positiveModulo(index - eventIndex, sampleCount),
  ));
}

function nearestUnusedCyclicEvent(
  startIndex: number,
  eventIndices: readonly number[],
  usedIndices: ReadonlySet<number>,
  sampleCount: number,
  maximumExclusiveDistance: number,
): Readonly<{ index: number; distance: number }> | null {
  let nearest: { index: number; distance: number } | null = null;
  for (const index of eventIndices) {
    if (usedIndices.has(index)) continue;
    const distance = positiveModulo(index - startIndex, sampleCount);
    if (
      distance <= 0
      || distance >= maximumExclusiveDistance
      || (nearest !== null && distance >= nearest.distance)
    ) continue;
    nearest = { index, distance };
  }
  return nearest === null ? null : Object.freeze(nearest);
}

function validateIndices(
  sampleCount: number,
  indices: readonly number[],
): void {
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= sampleCount) {
      throw new RangeError("cyclic event index is outside the sample domain");
    }
  }
}

function requireSampleCount(sampleCount: number): void {
  if (!Number.isInteger(sampleCount) || sampleCount < 0) {
    throw new RangeError("sampleCount must be a non-negative integer");
  }
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
