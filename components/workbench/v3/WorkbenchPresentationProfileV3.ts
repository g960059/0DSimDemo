export type WorkbenchPresentationProfileNameV3 = "balanced" | "smooth";

export type WorkbenchPresentationProfileV3 = Readonly<{
  name: WorkbenchPresentationProfileNameV3;
  maximumBatchSteps: number;
  preferredBatchSteps: number;
  presentationIntervalMs: number;
  maximumPresentationBatchFrames: number;
}>;

export const WORKBENCH_BALANCED_PRESENTATION_PROFILE_V3:
  WorkbenchPresentationProfileV3 = Object.freeze({
    name: "balanced",
    maximumBatchSteps: 16,
    preferredBatchSteps: 16,
    // The 16-step batch already is the 32 ms presentation boundary. A second
    // 32 ms wall-clock gate can miss by jitter and accidentally combine two
    // batches into one ~64 ms visual jump.
    presentationIntervalMs: 0,
    maximumPresentationBatchFrames: 16,
  });

export const WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3:
  WorkbenchPresentationProfileV3 = Object.freeze({
    name: "smooth",
    // One 16-step request amortizes structured-clone and validation overhead
    // across 32 ms of exact model time. The scheduler then publishes the
    // already-accepted prefix in two ordered eight-frame slices so Canvas can
    // refresh near 60 Hz without asking the numerical Worker to run twice as
    // many request/response cycles.
    maximumBatchSteps: 16,
    preferredBatchSteps: 16,
    presentationIntervalMs: 16,
    maximumPresentationBatchFrames: 8,
  });

/**
 * Uses the measured 16 ms exact-data cadence by default. The balanced profile
 * remains available as a diagnostic fallback; neither profile changes the
 * model's 2 ms accepted numerical step.
 */
export function resolveWorkbenchPresentationProfileV3(
  search = typeof location === "undefined" ? "" : location.search,
): WorkbenchPresentationProfileV3 {
  try {
    return new URLSearchParams(search).get("workbenchPresentation")
        === "balanced"
      ? WORKBENCH_BALANCED_PRESENTATION_PROFILE_V3
      : WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3;
  } catch {
    return WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3;
  }
}
