import type {
  MainWireScientificWorkspacePressureVolumeTrajectoryV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  type MainWireScientificObservableDefinitionV1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type ScientificObservableAvailabilityV1,
  type ScientificObservableQualityV1,
  type ScientificObservableUnitV1,
} from "@/engine/scientific/observables/MainWireScientificObservableRegistryV1";

/** A rendering guardrail, not a simulation-history or persistence policy. */
export const SCIENTIFIC_WORKSPACE_RENDER_FRAME_LIMIT_V1 = 5_001;

export type ScientificWorkspaceBoundedHistoryV1 = Readonly<{
  frames: readonly MainWireScientificObservableFrameV1[];
  omittedFrameCount: number;
}>;

export type ScientificWorkspacePlotPointV1 = Readonly<{
  x: number;
  y: number;
  revision: number;
  acceptedTimeSec: number;
}>;

export type ScientificWorkspaceTimeSeriesSegmentV1 = Readonly<{
  quality: ScientificObservableQualityV1;
  points: readonly ScientificWorkspacePlotPointV1[];
}>;

export type ScientificWorkspaceTimeSeriesProjectionV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  label: string;
  unit: ScientificObservableUnitV1;
  segments: readonly ScientificWorkspaceTimeSeriesSegmentV1[];
  availableSampleCount: number;
  unavailableSampleCount: number;
  qualities: readonly ScientificObservableQualityV1[];
}>;

export type ScientificWorkspacePvSegmentV1 = Readonly<{
  volumeQuality: ScientificObservableQualityV1;
  pressureQuality: ScientificObservableQualityV1;
  points: readonly ScientificWorkspacePlotPointV1[];
}>;

export type ScientificWorkspacePvProjectionV1 = Readonly<{
  trajectoryId: string;
  label: string;
  volumeObservableId: MainWireScientificObservableIdV1;
  pressureObservableId: MainWireScientificObservableIdV1;
  volumeUnit: ScientificObservableUnitV1;
  pressureUnit: ScientificObservableUnitV1;
  segments: readonly ScientificWorkspacePvSegmentV1[];
  availablePairCount: number;
  unavailablePairCount: number;
  volumeQualities: readonly ScientificObservableQualityV1[];
  pressureQualities: readonly ScientificObservableQualityV1[];
}>;

export type ScientificWorkspaceNumericRowV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  label: string;
  unit: ScientificObservableUnitV1;
  value: number | null;
  availability: ScientificObservableAvailabilityV1 | "no-frame";
  quality: ScientificObservableQualityV1;
  finiteValueAvailable: boolean;
}>;

type RenderableObservableSampleV1 = Readonly<{
  value: number;
  quality: ScientificObservableQualityV1;
}>;

const OBSERVABLE_DEFINITIONS = new Map<
  MainWireScientificObservableIdV1,
  MainWireScientificObservableDefinitionV1<MainWireScientificObservableIdV1>
>(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => [
  definition.observableId,
  definition,
]));

export function boundScientificWorkspaceHistoryV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  limit = SCIENTIFIC_WORKSPACE_RENDER_FRAME_LIMIT_V1,
): ScientificWorkspaceBoundedHistoryV1 {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("scientific workspace render frame limit must be a positive safe integer");
  }
  const omittedFrameCount = Math.max(0, frames.length - limit);
  return Object.freeze({
    frames: Object.freeze(frames.slice(omittedFrameCount)),
    omittedFrameCount,
  });
}

export function projectScientificWorkspaceTimeSeriesV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  observableId: MainWireScientificObservableIdV1,
): ScientificWorkspaceTimeSeriesProjectionV1 {
  const definition = observableDefinition(observableId);
  const finiteTimes = frames
    .map(({ acceptedTimeSec }) => acceptedTimeSec)
    .filter(Number.isFinite);
  const originTimeSec = finiteTimes[0] ?? null;
  const segments: ScientificWorkspaceTimeSeriesSegmentV1[] = [];
  let current: ScientificWorkspacePlotPointV1[] = [];
  let currentQuality: ScientificObservableQualityV1 | null = null;
  let currentReleaseKey: string | null = null;
  let previousAcceptedTimeSec: number | null = null;
  let availableSampleCount = 0;
  let unavailableSampleCount = 0;
  const qualities = new Set<ScientificObservableQualityV1>();

  const flush = (): void => {
    if (current.length > 0 && currentQuality !== null) {
      segments.push(Object.freeze({
        quality: currentQuality,
        points: Object.freeze(current),
      }));
    }
    current = [];
    currentQuality = null;
    currentReleaseKey = null;
    previousAcceptedTimeSec = null;
  };

  for (const frame of frames) {
    const sample = renderableObservableSample(frame, observableId);
    if (
      sample === null
      || originTimeSec === null
      || !Number.isFinite(frame.acceptedTimeSec)
    ) {
      unavailableSampleCount += 1;
      flush();
      continue;
    }

    const releaseKey = frameReleaseKey(frame);
    if (
      current.length > 0
      && (
        sample.quality !== currentQuality
        || releaseKey !== currentReleaseKey
        || (
          previousAcceptedTimeSec !== null
          && frame.acceptedTimeSec <= previousAcceptedTimeSec
        )
      )
    ) {
      flush();
    }

    availableSampleCount += 1;
    qualities.add(sample.quality);
    currentQuality = sample.quality;
    currentReleaseKey = releaseKey;
    previousAcceptedTimeSec = frame.acceptedTimeSec;
    current.push(Object.freeze({
      x: frame.acceptedTimeSec - originTimeSec,
      y: sample.value,
      revision: frame.revision,
      acceptedTimeSec: frame.acceptedTimeSec,
    }));
  }
  flush();

  return Object.freeze({
    observableId,
    label: scientificWorkspaceObservableLabelV1(observableId),
    unit: definition.unit,
    segments: Object.freeze(segments),
    availableSampleCount,
    unavailableSampleCount,
    qualities: Object.freeze([...qualities]),
  });
}

export function projectScientificWorkspacePvTrajectoryV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  trajectory: MainWireScientificWorkspacePressureVolumeTrajectoryV1,
): ScientificWorkspacePvProjectionV1 {
  const volumeDefinition = observableDefinition(trajectory.volumeObservableId);
  const pressureDefinition = observableDefinition(trajectory.pressureObservableId);
  const segments: ScientificWorkspacePvSegmentV1[] = [];
  let current: ScientificWorkspacePlotPointV1[] = [];
  let volumeQuality: ScientificObservableQualityV1 | null = null;
  let pressureQuality: ScientificObservableQualityV1 | null = null;
  let currentReleaseKey: string | null = null;
  let previousAcceptedTimeSec: number | null = null;
  let availablePairCount = 0;
  let unavailablePairCount = 0;
  const volumeQualities = new Set<ScientificObservableQualityV1>();
  const pressureQualities = new Set<ScientificObservableQualityV1>();

  const flush = (): void => {
    if (
      current.length > 0
      && volumeQuality !== null
      && pressureQuality !== null
    ) {
      segments.push(Object.freeze({
        volumeQuality,
        pressureQuality,
        points: Object.freeze(current),
      }));
    }
    current = [];
    volumeQuality = null;
    pressureQuality = null;
    currentReleaseKey = null;
    previousAcceptedTimeSec = null;
  };

  for (const frame of frames) {
    const volume = renderableObservableSample(
      frame,
      trajectory.volumeObservableId,
    );
    const pressure = renderableObservableSample(
      frame,
      trajectory.pressureObservableId,
    );
    if (
      volume === null
      || pressure === null
      || !Number.isFinite(frame.acceptedTimeSec)
    ) {
      unavailablePairCount += 1;
      flush();
      continue;
    }

    const releaseKey = frameReleaseKey(frame);
    if (
      current.length > 0
      && (
        volume.quality !== volumeQuality
        || pressure.quality !== pressureQuality
        || releaseKey !== currentReleaseKey
        || (
          previousAcceptedTimeSec !== null
          && frame.acceptedTimeSec <= previousAcceptedTimeSec
        )
      )
    ) {
      flush();
    }

    availablePairCount += 1;
    volumeQualities.add(volume.quality);
    pressureQualities.add(pressure.quality);
    volumeQuality = volume.quality;
    pressureQuality = pressure.quality;
    currentReleaseKey = releaseKey;
    previousAcceptedTimeSec = frame.acceptedTimeSec;
    current.push(Object.freeze({
      x: volume.value,
      y: pressure.value,
      revision: frame.revision,
      acceptedTimeSec: frame.acceptedTimeSec,
    }));
  }
  flush();

  return Object.freeze({
    trajectoryId: trajectory.trajectoryId,
    label: trajectory.label,
    volumeObservableId: trajectory.volumeObservableId,
    pressureObservableId: trajectory.pressureObservableId,
    volumeUnit: volumeDefinition.unit,
    pressureUnit: pressureDefinition.unit,
    segments: Object.freeze(segments),
    availablePairCount,
    unavailablePairCount,
    volumeQualities: Object.freeze([...volumeQualities]),
    pressureQualities: Object.freeze([...pressureQualities]),
  });
}

export function projectScientificWorkspaceNumericRowsV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  observableIds: readonly MainWireScientificObservableIdV1[],
): readonly ScientificWorkspaceNumericRowV1[] {
  const latestFrame = frames.at(-1);
  return Object.freeze(observableIds.map((observableId) => {
    const definition = observableDefinition(observableId);
    if (latestFrame === undefined) {
      return Object.freeze({
        observableId,
        label: scientificWorkspaceObservableLabelV1(observableId),
        unit: definition.unit,
        value: null,
        availability: "no-frame" as const,
        quality: "not-assessed" as const,
        finiteValueAvailable: false,
      });
    }
    const source = latestFrame.values[observableId];
    const finiteValueAvailable = source.availability === "available"
      && source.value !== null
      && Number.isFinite(source.value);
    return Object.freeze({
      observableId,
      label: scientificWorkspaceObservableLabelV1(observableId),
      unit: definition.unit,
      value: finiteValueAvailable ? source.value : null,
      availability: source.availability,
      quality: source.quality,
      finiteValueAvailable,
    });
  }));
}

export function scientificWorkspaceObservableLabelV1(
  observableId: MainWireScientificObservableIdV1,
): string {
  const parts = observableId.split(".");
  if (parts[0] === "valve" && parts.length === 3) {
    return `${parts[1]} ${humanize(parts[2])}`;
  }
  if (parts[0] === "hemodynamics" && parts[1] === "volume") {
    return `${parts[2]} volume`;
  }
  if (parts[0] === "hemodynamics" && parts[1] === "pressure") {
    return `${parts[3]} ${humanize(parts[2])} pressure`;
  }
  if (parts[0] === "hemodynamics" && parts[1] === "flow") {
    return `${humanize(parts.slice(2).join(" "))} flow`;
  }
  if (parts[0] === "pericardium") {
    return `Pericardium ${humanize(parts.slice(1).join(" "))}`;
  }
  return parts.map(humanize).join(" ");
}

function renderableObservableSample(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
): RenderableObservableSampleV1 | null {
  const source = frame.values[observableId];
  if (
    source.availability !== "available"
    || source.value === null
    || !Number.isFinite(source.value)
  ) {
    return null;
  }
  return Object.freeze({ value: source.value, quality: source.quality });
}

function observableDefinition(
  observableId: MainWireScientificObservableIdV1,
): MainWireScientificObservableDefinitionV1<MainWireScientificObservableIdV1> {
  const definition = OBSERVABLE_DEFINITIONS.get(observableId);
  if (definition === undefined) {
    throw new Error(`scientific workspace observable is not registered: ${observableId}`);
  }
  return definition;
}

function frameReleaseKey(frame: MainWireScientificObservableFrameV1): string {
  return `${frame.releaseRef.id}\u0000${frame.releaseRef.version}\u0000${frame.releaseRef.sha256}`;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}
