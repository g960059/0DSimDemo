import {
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  evaluateStudioOfficialExperimentAssertionsV1,
  prepareStudioOfficialExperimentBuildPlanV1,
  type StudioOfficialExperimentAssertionGateV1,
} from "@/studio/application/authoring/StudioOfficialContentBuildPlanV1";
import {
  studioSnapshotAdmissionServiceV1,
} from "@/studio/application/authoring/StudioSnapshotAdmissionServiceV1";
import {
  validateExperimentContentForModelV2,
  validateExperimentSnapshotV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentSnapshotV2,
  type OfficialExperimentRecipeV1,
} from "@/studio/contracts/v2/content";
import type {
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioPressureVolumeCycleEvidenceV1,
  StudioScientificScenarioEvidenceV1,
} from "@/studio/contracts/v2/scientificAssertion";
import {
  applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1,
  type MainWireIntegratedStudioStandardFixtureV1,
  type MainWireIntegratedStudioStandardExactReleaseV1,
} from "./MainWireIntegratedStudioExactModelV1";
import {
  mainWireIntegratedOfficialScientificAssertionRegistryV1,
} from "./MainWireIntegratedOfficialContentAssertionsV1";

export const MAIN_WIRE_OFFICIAL_CONTENT_RUNNER_V1_ID =
  "circleheart.main-wire.official-content-runner.v1" as const;

export type MainWireOfficialContentScenarioRunV1 = Readonly<{
  scenarioId: string;
  protocolIdentityHash: string;
  completedCycleCount: number;
  terminationReason: MainWireIntegratedModelPeriodicSteadyResultV3["terminationReason"];
  evidence: StudioPressureVolumeCycleEvidenceV1;
}>;

export type MainWireOfficialExperimentBuildResultV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_OFFICIAL_CONTENT_RUNNER_V1_ID;
  snapshot: ExperimentSnapshotV2;
  assertionGate: StudioOfficialExperimentAssertionGateV1;
  scenarioRuns: readonly MainWireOfficialContentScenarioRunV1[];
}>;

/**
 * Executes one reviewed recipe against the Standard exact-model ABI.
 *
 * Every Scenario starts from the registered default fixture, applies only its
 * absolute recipe assignments, establishes canonical period-1 closure, owns a
 * complete exact checkpoint, evaluates model-family assertions, and finally
 * passes through the same Snapshot admission seam as Article Briefing and
 * standalone publication. No presentation frame participates in evidence.
 */
export async function buildMainWireOfficialExperimentV1(input: Readonly<{
  recipe: OfficialExperimentRecipeV1 | unknown;
  exactRelease: MainWireIntegratedStudioStandardExactReleaseV1;
  surfaceRelease: ModelSurfaceReleaseManifestV1 | unknown;
  defaultFixture: MainWireIntegratedStudioStandardFixtureV1;
  snapshotId?: string;
  createdAt: string;
  nominalDtSec?: number;
  maximumCycleCount?: number;
}>): Promise<MainWireOfficialExperimentBuildResultV1> {
  const plan = prepareStudioOfficialExperimentBuildPlanV1({
    recipe: input.recipe,
    kernel: input.exactRelease.manifest,
    surfaceRelease: input.surfaceRelease,
    assertionRegistry:
      mainWireIntegratedOfficialScientificAssertionRegistryV1,
  });
  const composed = composeStandardModelContractV1(
    input.exactRelease.manifest,
    input.surfaceRelease,
  );
  const scenarioBuilds = [];

  for (const scenario of plan.recipe.scenarios) {
    const fixture = applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
      input.defaultFixture,
      scenario.controlAssignments,
    );
    const run = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: input.nominalDtSec ?? 0.01,
      maximumCycleCount: input.maximumCycleCount,
      executionPurpose: "canonical-evidence",
      hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
      ventricularContractilityScale:
        fixture.ventricularContractilityScale,
    });
    if (
      run.classification.status !== "period1-converged"
      || !run.numericalPeriod1Established
      || !run.allCyclesFiniteConservedAndEventExact
    ) {
      throw new Error(
        `Official Scenario ${scenario.scenarioId} failed canonical settlement: `
          + `${run.terminationReason}`,
      );
    }
    scenarioBuilds.push(Object.freeze({
      scenario,
      fixture,
      run,
      evidence: pressureVolumeEvidenceV1(run.terminalCycleTrace.samples),
    }));
  }

  const scientificEvidence: readonly StudioScientificScenarioEvidenceV1[] =
    Object.freeze(scenarioBuilds.map(({ scenario, evidence }) =>
      Object.freeze({ scenarioId: scenario.scenarioId, evidence })));
  const assertionGate = evaluateStudioOfficialExperimentAssertionsV1({
    plan,
    assertionRegistry:
      mainWireIntegratedOfficialScientificAssertionRegistryV1,
    scenarios: scientificEvidence,
  });
  if (assertionGate.status !== "passed") {
    const failed = assertionGate.reports
      .filter(({ status }) => status === "rejected")
      .map(({ assertionId, reason }) => `${assertionId}: ${reason}`)
      .join("; ");
    throw new Error(`Official scientific assertion gate rejected: ${failed}`);
  }

  const content: ExperimentContentV2 = validateExperimentContentForModelV2({
    modelId: plan.modelId,
    scenarios: scenarioBuilds.map(({ scenario, fixture, run }) => ({
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      capture: {
        fixture,
        checkpoint: {
          acceptedRevision: run.terminalAcceptedState.revision,
          acceptedTimeSec: run.terminalAcceptedState.acceptedTimeSec,
          payload: run.terminalCheckpoint,
        },
      },
    })),
    surface: plan.recipe.surface,
  }, composed.contract);
  await studioSnapshotAdmissionServiceV1.admitFrozenCandidate({
    legacyAdapter: input.exactRelease.executables.snapshotGate,
    model: composed.contract,
    content,
  });
  const snapshotId = input.snapshotId ??
    `official-snapshot/${await sha256CanonicalJsonHex(Object.freeze({
      recipeId: plan.recipe.recipeId,
      modelId: plan.modelId,
      surfaceReleaseId: plan.surfaceReleaseId,
      createdAt: input.createdAt,
      content,
    }))}`;
  const snapshot = validateExperimentSnapshotV2({
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId,
    content,
    createdAt: input.createdAt,
  });
  return Object.freeze({
    runnerId: MAIN_WIRE_OFFICIAL_CONTENT_RUNNER_V1_ID,
    snapshot,
    assertionGate,
    scenarioRuns: Object.freeze(scenarioBuilds.map(({ scenario, run, evidence }) =>
      Object.freeze({
        scenarioId: scenario.scenarioId,
        protocolIdentityHash: run.protocolIdentityHash,
        completedCycleCount: run.completedCycleCount,
        terminationReason: run.terminationReason,
        evidence,
      }))),
  });
}

function pressureVolumeEvidenceV1(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): StudioPressureVolumeCycleEvidenceV1 {
  if (samples.length < 2) {
    throw new Error("Official PV evidence requires a complete accepted cycle");
  }
  const endDiastolic = samples.reduce((selected, sample) =>
    sample.chamberVolumeMl.LV > selected.chamberVolumeMl.LV
      ? sample
      : selected);
  const endSystolic = semilunarClosureSampleV1(samples)
    ?? samples.reduce((selected, sample) =>
      sample.chamberVolumeMl.LV < selected.chamberVolumeMl.LV
        ? sample
        : selected);
  const endDiastolicVolumeMl = endDiastolic.chamberVolumeMl.LV;
  const endSystolicVolumeMl = endSystolic.chamberVolumeMl.LV;
  if (!(endDiastolicVolumeMl >= endSystolicVolumeMl)) {
    throw new Error("Official PV evidence has inverted ventricular volumes");
  }
  return Object.freeze({
    kind: "pressure-volume-cycle" as const,
    endDiastolicVolumeMl,
    endSystolicVolumeMl,
    endSystolicPressureMmHg: endSystolic.transmuralPressureMmHg.LV,
    strokeVolumeMl: endDiastolicVolumeMl - endSystolicVolumeMl,
  });
}

function semilunarClosureSampleV1(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 | null {
  const flowToleranceMlPerSec = 1e-6;
  let closure: MainWireIntegratedModelPeriodicTerminalTraceSampleV3 | null = null;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (
      previous.valveFlowMlPerSec.AoV > flowToleranceMlPerSec
      && current.valveFlowMlPerSec.AoV <= flowToleranceMlPerSec
    ) {
      closure = current;
    }
  }
  return closure;
}
