/**
 * Presentation-only scalar sample shared by the V3 Workbench charts.
 *
 * Every scalar stays keyed by the registered output ID. Graph renderers use
 * their catalog-owned binding IDs; no output role is inferred from a name.
 */
export type WorkbenchAcceptedScalarSampleV3 = Readonly<{
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  values: Readonly<Record<string, number | null>>;
}>;

export type WorkbenchScalarSampleV3 = WorkbenchAcceptedScalarSampleV3 &
  Readonly<{
    /**
     * Monotonic, presentation-only time across model input epochs. Exact model
     * identity remains in inputEpoch/acceptedRevision/acceptedTimeSec.
     */
    presentationTimeSec: number;
  }>;

export function finiteWorkbenchScalarValueV3(
  sample: WorkbenchScalarSampleV3,
  outputId: string,
): number | null {
  const value = sample.values[outputId];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Live Worker samples are already monotonic. Preserve that array identity and
 * avoid an O(n log n) copy/sort on every paint; malformed or external sample
 * collections still receive a deterministic sorted fallback.
 */
export function orderedFiniteWorkbenchSamplesV3(
  samples: readonly WorkbenchScalarSampleV3[],
): readonly WorkbenchScalarSampleV3[] {
  let previousTimeSec = Number.NEGATIVE_INFINITY;
  let allFinite = true;
  let monotonic = true;
  for (const sample of samples) {
    const timeSec = sample.presentationTimeSec;
    if (!Number.isFinite(timeSec)) {
      allFinite = false;
      continue;
    }
    if (timeSec < previousTimeSec) monotonic = false;
    previousTimeSec = timeSec;
  }
  if (allFinite && monotonic) return samples;
  const finite = samples.filter(({ presentationTimeSec }) =>
    Number.isFinite(presentationTimeSec));
  return monotonic
    ? finite
    : finite.sort((left, right) =>
        left.presentationTimeSec - right.presentationTimeSec);
}

export function firstSampleAtOrAfterV3(
  orderedSamples: readonly WorkbenchScalarSampleV3[],
  presentationTimeSec: number,
): number {
  let lower = 0;
  let upper = orderedSamples.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (orderedSamples[middle]!.presentationTimeSec < presentationTimeSec) {
      lower = middle + 1;
    } else {
      upper = middle;
    }
  }
  return lower;
}
