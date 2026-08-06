import type { WorkbenchScalarSampleV3 } from "./WorkbenchScalarSampleV3";

export const WORKBENCH_PRESENTATION_BUCKET_SEC_V3 = 1 / 60;
export const WORKBENCH_PRESENTATION_WINDOW_SEC_V3 = 6;
export const WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3 = 384;

export type WorkbenchPresentationEnvelopeV3 = Readonly<{
  bucketOrdinal: number;
  sourceSampleCount: number;
  minimums: Readonly<Record<string, number>>;
  maximums: Readonly<Record<string, number>>;
}>;

export type WorkbenchPresentationSampleV3 = WorkbenchScalarSampleV3 & Readonly<{
  presentationEnvelope: WorkbenchPresentationEnvelopeV3;
}>;

export type WorkbenchPresentationBufferOptionsV3 = Readonly<{
  bucketSec?: number;
  windowSec?: number;
  capacity?: number;
}>;

/**
 * Reduces exact accepted Worker samples to a bounded visual buffer.
 *
 * Each retained point is an actual accepted sample (the bucket terminal
 * state). Per-output minima/maxima retain a scientifically neutral sweep
 * envelope for excursions between representative states. Spatial orbit panes
 * such as PV use WorkbenchExactOrbitSampleBufferV3 instead; exact
 * checkpoint/capture ownership remains entirely in the Worker.
 */
export function appendWorkbenchPresentationSamplesV3(
  current: readonly WorkbenchScalarSampleV3[],
  incoming: readonly WorkbenchScalarSampleV3[],
  options: WorkbenchPresentationBufferOptionsV3 = {},
): readonly WorkbenchPresentationSampleV3[] {
  const bucketSec = options.bucketSec ?? WORKBENCH_PRESENTATION_BUCKET_SEC_V3;
  const windowSec = options.windowSec ?? WORKBENCH_PRESENTATION_WINDOW_SEC_V3;
  const capacity = options.capacity
    ?? WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3;
  requirePresentationBufferOptionsV3(bucketSec, windowSec, capacity);

  let retained = current.filter(isWorkbenchPresentationSampleV3);
  for (const sample of incoming) {
    if (!Number.isFinite(sample.presentationTimeSec)) continue;
    const last = retained.at(-1);
    if (
      last !== undefined
      && sample.presentationTimeSec < last.presentationTimeSec
    ) {
      // A restored/forked clock starts a new visual trace. It must never be
      // connected to the previous runtime's samples.
      retained = [];
    }
    const bucketOrdinal = presentationBucketOrdinalV3(
      sample.presentationTimeSec,
      bucketSec,
    );
    const active = retained.at(-1);
    if (
      active?.presentationEnvelope.bucketOrdinal === bucketOrdinal
      && active.inputEpoch === sample.inputEpoch
    ) {
      retained[retained.length - 1] = mergePresentationBucketV3(
        active,
        sample,
      );
    } else {
      retained.push(createPresentationBucketV3(sample, bucketOrdinal));
    }
  }

  const latestTimeSec = retained.at(-1)?.presentationTimeSec;
  if (latestTimeSec === undefined) return Object.freeze([]);
  const oldestTimeSec = latestTimeSec - windowSec;
  let startIndex = firstPresentationSampleAtOrAfterV3(
    retained,
    oldestTimeSec,
  );
  startIndex = Math.max(startIndex, retained.length - capacity);
  return Object.freeze(retained.slice(startIndex));
}

export function isWorkbenchPresentationSampleV3(
  sample: WorkbenchScalarSampleV3,
): sample is WorkbenchPresentationSampleV3 {
  return "presentationEnvelope" in sample
    && sample.presentationEnvelope !== null
    && typeof sample.presentationEnvelope === "object";
}

function createPresentationBucketV3(
  sample: WorkbenchScalarSampleV3,
  bucketOrdinal: number,
): WorkbenchPresentationSampleV3 {
  const { minimums, maximums } = scalarExtremaV3(sample.values);
  return Object.freeze({
    ...sample,
    presentationEnvelope: Object.freeze({
      bucketOrdinal,
      sourceSampleCount: 1,
      minimums,
      maximums,
    }),
  });
}

function mergePresentationBucketV3(
  current: WorkbenchPresentationSampleV3,
  sample: WorkbenchScalarSampleV3,
): WorkbenchPresentationSampleV3 {
  const minimums: Record<string, number> = {
    ...current.presentationEnvelope.minimums,
  };
  const maximums: Record<string, number> = {
    ...current.presentationEnvelope.maximums,
  };
  for (const [outputId, value] of Object.entries(sample.values)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    minimums[outputId] = minimums[outputId] === undefined
      ? value
      : Math.min(minimums[outputId], value);
    maximums[outputId] = maximums[outputId] === undefined
      ? value
      : Math.max(maximums[outputId], value);
  }
  return Object.freeze({
    ...sample,
    presentationEnvelope: Object.freeze({
      bucketOrdinal: current.presentationEnvelope.bucketOrdinal,
      sourceSampleCount: current.presentationEnvelope.sourceSampleCount + 1,
      minimums: Object.freeze(minimums),
      maximums: Object.freeze(maximums),
    }),
  });
}

function scalarExtremaV3(
  values: Readonly<Record<string, number | null>>,
): Readonly<{
  minimums: Readonly<Record<string, number>>;
  maximums: Readonly<Record<string, number>>;
}> {
  const finite: Record<string, number> = {};
  for (const [outputId, value] of Object.entries(values)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      finite[outputId] = value;
    }
  }
  return Object.freeze({
    minimums: Object.freeze({ ...finite }),
    maximums: Object.freeze(finite),
  });
}

function presentationBucketOrdinalV3(
  presentationTimeSec: number,
  bucketSec: number,
): number {
  return Math.floor((presentationTimeSec + bucketSec * 1e-9) / bucketSec);
}

function firstPresentationSampleAtOrAfterV3(
  samples: readonly WorkbenchPresentationSampleV3[],
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

function requirePresentationBufferOptionsV3(
  bucketSec: number,
  windowSec: number,
  capacity: number,
): void {
  if (
    !Number.isFinite(bucketSec)
    || bucketSec <= 0
    || !Number.isFinite(windowSec)
    || windowSec < bucketSec
    || !Number.isSafeInteger(capacity)
    || capacity < 2
  ) {
    throw new Error("Workbench presentation buffer configuration is invalid");
  }
}
