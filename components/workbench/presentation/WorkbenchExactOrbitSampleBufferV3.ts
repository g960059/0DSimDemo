import type { WorkbenchScalarSampleV3 } from "./WorkbenchScalarSampleV3";

export const WORKBENCH_EXACT_ORBIT_WINDOW_SEC_V3 = 4;
export const WORKBENCH_EXACT_ORBIT_SAMPLE_CAPACITY_V3 = 2_048;

export type WorkbenchExactOrbitBufferOptionsV3 = Readonly<{
  windowSec?: number;
  capacity?: number;
}>;

/**
 * Retains exact accepted 2 ms points for PV geometry. Unlike the sweep buffer,
 * this path never buckets, interpolates, or combines pressure/volume values
 * from different accepted states.
 */
export function appendWorkbenchExactOrbitSamplesV3(
  current: readonly WorkbenchScalarSampleV3[],
  incoming: readonly WorkbenchScalarSampleV3[],
  options: WorkbenchExactOrbitBufferOptionsV3 = {},
): readonly WorkbenchScalarSampleV3[] {
  const windowSec = options.windowSec ?? WORKBENCH_EXACT_ORBIT_WINDOW_SEC_V3;
  const capacity = options.capacity
    ?? WORKBENCH_EXACT_ORBIT_SAMPLE_CAPACITY_V3;
  if (
    !Number.isFinite(windowSec)
    || windowSec <= 0
    || !Number.isSafeInteger(capacity)
    || capacity < 3
  ) throw new Error("Workbench exact orbit buffer configuration is invalid");

  let retained = [...current];
  for (const sample of incoming) {
    if (
      !Number.isFinite(sample.presentationTimeSec)
      || !Number.isFinite(sample.acceptedTimeSec)
    ) continue;
    const last = retained.at(-1);
    if (
      last !== undefined
      && (
        sample.inputEpoch !== last.inputEpoch
        || sample.acceptedTimeSec < last.acceptedTimeSec
        || sample.presentationTimeSec < last.presentationTimeSec
      )
    ) retained = [];
    retained.push(sample);
  }

  const latestPresentationTimeSec = retained.at(-1)?.presentationTimeSec;
  if (latestPresentationTimeSec === undefined) return Object.freeze([]);
  const oldestPresentationTimeSec = latestPresentationTimeSec - windowSec;
  let startIndex = firstExactOrbitSampleAtOrAfterV3(
    retained,
    oldestPresentationTimeSec,
  );
  startIndex = Math.max(startIndex, retained.length - capacity);
  return Object.freeze(retained.slice(startIndex));
}

function firstExactOrbitSampleAtOrAfterV3(
  samples: readonly WorkbenchScalarSampleV3[],
  presentationTimeSec: number,
): number {
  let lower = 0;
  let upper = samples.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (samples[middle]!.presentationTimeSec < presentationTimeSec) {
      lower = middle + 1;
    } else {
      upper = middle;
    }
  }
  return lower;
}
