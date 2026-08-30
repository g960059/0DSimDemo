import type {
  WorkbenchPaneEditorItemIntentV3,
  WorkbenchPaneEditorSectionV3,
} from "@/components/workbench/WorkbenchPaneEditorV3";
import { studioDevSurfacesEnabledV1 } from "@/studio/application/dev/StudioDevAccessV1";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type { StudioReleaseStageV1 } from "@/studio/contracts/v2/modelSurface";
import type { ExactModelControlValuesV1 } from
  "@/studio/application/model/ExactModelControlValuesV1";

const WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3 = 0.1;

export type WorkbenchPaneSettingsV3 =
  | Readonly<{ kind: "graph"; paneId: string }>
  | Readonly<{
      kind: "output";
      paneId: string;
      section?: WorkbenchPaneEditorSectionV3;
      itemIntent?: WorkbenchPaneEditorItemIntentV3;
    }>
  | Readonly<{
      kind: "control";
      paneId: string;
      section?: WorkbenchPaneEditorSectionV3;
      itemIntent?: WorkbenchPaneEditorItemIntentV3;
    }>;

export function resolveWorkbenchInitialSaveStateV3(
  input: Readonly<{
    hasStoredExperiment: boolean;
    hasPendingSurface: boolean;
    pendingSaveState: "clean" | "dirty" | "error" | null;
  }>,
): "clean" | "dirty" | "error" {
  if (input.pendingSaveState !== null) return input.pendingSaveState;
  return input.hasStoredExperiment && !input.hasPendingSurface
    ? "clean"
    : "dirty";
}

export function shouldConfirmWorkbenchDiscardV3(
  input: Readonly<{
    hasUnsavedContentChanges: boolean;
    hasUncommittedTitleChanges: boolean;
    hasUncapturedBriefingChanges: boolean;
  }>,
): boolean {
  return (
    input.hasUnsavedContentChanges ||
    input.hasUncommittedTitleChanges ||
    input.hasUncapturedBriefingChanges
  );
}

export function modelLabEnabledV3(
  environment: Pick<
    ImportMetaEnv,
    "PROD" | "VITE_MODEL_LAB_ENABLED"
  > = import.meta.env,
): boolean {
  return studioDevSurfacesEnabledV1(environment);
}

export function workbenchPublicationAvailableV3(
  input: Readonly<{
    modelLab: boolean;
    releaseStage: StudioReleaseStageV1;
  }>,
): boolean {
  return !input.modelLab && input.releaseStage === "stable";
}

/**
 * Model Lab is a local numerical validation launch, not another content
 * authoring authority. Durable content starts from the ordinary active-model
 * Experiment Session so its exact identity can be resolved again later.
 */
export function workbenchDurableContentAvailableV3(
  input: Readonly<{ modelLab: boolean }>,
): boolean {
  return !input.modelLab;
}

export function workbenchPaneIdentityForIdV3(
  surface: ExperimentSurfaceV2,
  paneId: string,
): WorkbenchPaneSettingsV3 | null {
  if (surface.graphPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "graph", paneId };
  }
  if (surface.outputPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "output", paneId };
  }
  if (surface.controlPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "control", paneId };
  }
  return null;
}

export function hasWorkbenchSurfaceMutationsAfterSubmissionV3(
  submittedMutationRevision: number,
  currentMutationRevision: number,
): boolean {
  if (
    !Number.isSafeInteger(submittedMutationRevision) ||
    submittedMutationRevision < 0 ||
    !Number.isSafeInteger(currentMutationRevision) ||
    currentMutationRevision < submittedMutationRevision
  ) {
    throw new Error("Workbench Surface mutation revision is invalid");
  }
  return currentMutationRevision > submittedMutationRevision;
}

export function resolveWorkbenchSurfaceAfterCommitV3(
  input: Readonly<{
    submittedMutationRevision: number;
    currentMutationRevision: number;
    currentSurface: ExperimentSurfaceV2 | null;
    durableSurface: ExperimentSurfaceV2;
  }>,
): Readonly<{
  surface: ExperimentSurfaceV2;
  hasNewerMutations: boolean;
}> {
  const hasNewerMutations = hasWorkbenchSurfaceMutationsAfterSubmissionV3(
    input.submittedMutationRevision,
    input.currentMutationRevision,
  );
  if (hasNewerMutations && input.currentSurface === null) {
    throw new Error("Workbench newer Surface mutation is unavailable");
  }
  return Object.freeze({
    surface: hasNewerMutations ? input.currentSurface! : input.durableSurface,
    hasNewerMutations,
  });
}

export function shouldPublishWorkbenchRootFrameV3(
  input: Readonly<{
    acceptedTimeSec: number;
    lastPublishedTimeSec: number;
    schedulerRunning: boolean;
  }>,
): boolean {
  return (
    !input.schedulerRunning ||
    input.acceptedTimeSec - input.lastPublishedTimeSec >=
      WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3
  );
}

/**
 * Detects an input mutation that replaced the exact trajectory instead of
 * continuing from its accepted clock. Presentation samples from the previous
 * trajectory must not be joined to, or retained as PV history for, the new
 * cold-started trajectory.
 */
export function workbenchInputMutationReplacedAcceptedClockV3(
  previous: Readonly<{
    inputEpoch: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
  }>,
  next: Readonly<{
    inputEpoch: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
  }>,
  changeSemantics: "accepted-state-warm-start" | "cold-restart" =
    "accepted-state-warm-start",
): boolean {
  return (
    next.inputEpoch > previous.inputEpoch &&
    (changeSemantics === "cold-restart" ||
      next.acceptedRevision < previous.acceptedRevision ||
      next.acceptedTimeSec < previous.acceptedTimeSec)
  );
}

export function workbenchScenarioRuntimeStatusV3(
  isPlaying: boolean,
): "Live" | "Paused" {
  return isPlaying ? "Live" : "Paused";
}

/** A duplicated Scenario must not share its mutable editor object identity. */
export function cloneWorkbenchControlValuesV3(
  source: ExactModelControlValuesV1,
): ExactModelControlValuesV1 {
  return Object.freeze({ ...source });
}
