import { createHash } from "node:crypto";

import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import {
  assertBoundExecutionPlanV1,
  type BoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type {
  RegisteredModelExecutableBundleV2,
} from "@/studio/contracts/v2/executable";
import {
  assertModelContractV2,
  type ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioSimulationScenarioInputV2,
} from "@/studio/contracts/v2/simulation";
import {
  importExactExecutableArtifactModuleV2,
} from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  type MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

export const SELECTED_AORTIC_OUTFLOW_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID =
  "circleheart-exact-model-artifact-equivalence-report-v1" as const;

export type SelectedAorticOutflowArtifactEquivalenceReportV1 = Readonly<{
  schemaId:
    typeof SELECTED_AORTIC_OUTFLOW_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID;
  modelId: string;
  predecessorArtifactRevisionId: string;
  candidateArtifactRevisionId: string;
  corpusId: typeof MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID;
  equality: "byte-exact";
  cases: readonly Readonly<{
    caseId: string;
    acceptedStepCount: number;
    initialFrameEquality: "byte-exact";
    advancedFrameEquality: "byte-exact";
    exactCaptureEquality: "byte-exact";
  }>[];
}>;

type SelectedExactArtifactReleaseV1 = Readonly<{
  manifest: ExactModelKernelManifestV3;
  executables: RegisteredModelExecutableBundleV2;
}>;

const EMPTY_SURFACE_V1: ExperimentSurfaceV2 = Object.freeze({
  graphPanes: Object.freeze([]),
  outputPanes: Object.freeze([]),
  controlPanes: Object.freeze([]),
  note: Object.freeze({ text: "" }),
});

/**
 * Reproduces the existing six-case exact-artifact evidence for the selected
 * Standard66 fixture without importing or adapting the Standard65 runtime.
 */
export async function compareSelectedAorticOutflowArtifactRevisionsV1(
  input: Readonly<{
    predecessorArtifact: Uint8Array;
    predecessorArtifactRevisionId: string;
    candidateArtifact: Uint8Array;
    candidateArtifactRevisionId: string;
  }>,
): Promise<SelectedAorticOutflowArtifactEquivalenceReportV1> {
  const [predecessor, candidate] = await Promise.all([
    importReleaseV1(input.predecessorArtifact, "predecessor"),
    importReleaseV1(input.candidateArtifact, "candidate"),
  ]);
  if (
    studioCanonicalJsonStringify(predecessor.manifest)
      !== studioCanonicalJsonStringify(candidate.manifest)
  ) {
    throw new Error(
      "Same-model selected Standard66 artifact changed the exact manifest",
    );
  }

  const cases = [];
  for (const corpusCase of MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1) {
    const fixture = selectedFixtureForCorpusCaseV1(
      corpusCase.hemodynamicResearchInputs,
      corpusCase.ventricularContractilityScale,
    );
    const runtimeSessionId =
      `session/selected-artifact-equivalence/${corpusCase.caseId}`;
    const scenarioId =
      `scenario/selected-artifact-equivalence/${corpusCase.caseId}`;
    const scenario = Object.freeze({ scenarioId, fixture });
    await Promise.all([
      createSessionV1(predecessor, runtimeSessionId, scenario),
      createSessionV1(candidate, runtimeSessionId, scenario),
    ]);
    try {
      assertCanonicalEqualV1(
        predecessor.executables.simulationAdapter.currentFrame({
          runtimeSessionId,
          scenarioId,
        }),
        candidate.executables.simulationAdapter.currentFrame({
          runtimeSessionId,
          scenarioId,
        }),
        `${corpusCase.caseId} initial frame`,
      );
      for (
        let stepIndex = 0;
        stepIndex < corpusCase.acceptedStepCount;
        stepIndex += 1
      ) {
        const [predecessorFrame, candidateFrame] = await Promise.all([
          predecessor.executables.simulationAdapter
            .advanceOnePresentationStep({ runtimeSessionId, scenarioId }),
          candidate.executables.simulationAdapter
            .advanceOnePresentationStep({ runtimeSessionId, scenarioId }),
        ]);
        assertCanonicalEqualV1(
          predecessorFrame,
          candidateFrame,
          `${corpusCase.caseId} frame ${stepIndex + 1}`,
        );
      }
      const [predecessorCapture, candidateCapture] = await Promise.all([
        captureV1(
          predecessor,
          runtimeSessionId,
          scenarioId,
          corpusCase.caseId,
          fixture,
        ),
        captureV1(
          candidate,
          runtimeSessionId,
          scenarioId,
          corpusCase.caseId,
          fixture,
        ),
      ]);
      assertCanonicalEqualV1(
        predecessorCapture,
        candidateCapture,
        `${corpusCase.caseId} exact capture`,
      );
      cases.push(Object.freeze({
        caseId: corpusCase.caseId,
        acceptedStepCount: corpusCase.acceptedStepCount,
        initialFrameEquality: "byte-exact" as const,
        advancedFrameEquality: "byte-exact" as const,
        exactCaptureEquality: "byte-exact" as const,
      }));
    } finally {
      predecessor.executables.simulationAdapter.disposeSession(
        runtimeSessionId,
      );
      candidate.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }

  return Object.freeze({
    schemaId:
      SELECTED_AORTIC_OUTFLOW_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID,
    modelId: predecessor.manifest.modelId,
    predecessorArtifactRevisionId: input.predecessorArtifactRevisionId,
    candidateArtifactRevisionId: input.candidateArtifactRevisionId,
    corpusId: MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
    equality: "byte-exact" as const,
    cases: Object.freeze(cases),
  });
}

export function selectedAorticOutflowArtifactEquivalenceReportSha256V1(
  report: SelectedAorticOutflowArtifactEquivalenceReportV1,
): string {
  return createHash("sha256")
    .update(studioCanonicalJsonStringify(report))
    .digest("hex");
}

async function importReleaseV1(
  artifact: Uint8Array,
  label: string,
): Promise<SelectedExactArtifactReleaseV1> {
  const namespace = await importExactExecutableArtifactModuleV2(artifact);
  const factory = namespace.createCircleHeartExactModelReleaseV1;
  if (typeof factory !== "function") {
    throw new Error(`${label} artifact omits its exact release factory`);
  }
  const release: unknown = await factory();
  if (
    release === null
    || typeof release !== "object"
    || Array.isArray(release)
  ) {
    throw new Error(`${label} artifact returned an invalid exact release`);
  }
  const record = release as Record<string, unknown>;
  if (
    record.manifest === null
    || typeof record.manifest !== "object"
    || record.executables === null
    || typeof record.executables !== "object"
  ) {
    throw new Error(`${label} artifact returned an incomplete exact release`);
  }
  return release as SelectedExactArtifactReleaseV1;
}

async function createSessionV1(
  release: SelectedExactArtifactReleaseV1,
  runtimeSessionId: string,
  scenario: StudioSimulationScenarioInputV2,
): Promise<void> {
  const executionPlan = release.executables.executionPlan;
  const bound = executionPlan.bind();
  assertBoundExecutionPlanV1(bound, executionPlan.descriptor);
  await executionPlan.createSession({
    runtimeSessionId,
    scenarios: [scenario],
    boundExecutionPlans: new Map<string, BoundExecutionPlanV1>([
      [scenario.scenarioId, bound],
    ]),
  });
}

async function captureV1(
  release: SelectedExactArtifactReleaseV1,
  runtimeSessionId: string,
  scenarioId: string,
  caseId: string,
  fixture: MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
) {
  return release.executables.experimentCapture.captureAcceptedCandidate({
    experimentId: `experiment/selected-artifact-equivalence/${caseId}`,
    model: exactContractFromManifestV1(release.manifest),
    desiredContent: {
      modelId: release.manifest.modelId,
      surfaceSeriesId: "selected-aortic-outflow-artifact-equivalence-v1",
      scenarios: [{ scenarioId, label: caseId, fixture }],
      surface: EMPTY_SURFACE_V1,
    },
    correlation: {
      runtimeSessionId,
      scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
    },
  });
}

function selectedFixtureForCorpusCaseV1(
  hemodynamicResearchInputs:
    MainWireIntegratedStudioSelectedAorticOutflowFixtureV1[
      "hemodynamicResearchInputs"
    ],
  ventricularContractilityScale: number,
): MainWireIntegratedStudioSelectedAorticOutflowFixtureV1 {
  const base = structuredClone(
    MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  );
  return Object.freeze({
    ...base,
    hemodynamicResearchInputs: Object.freeze(structuredClone(
      hemodynamicResearchInputs,
    )),
    mechanismResearchInputs: Object.freeze({
      ...base.mechanismResearchInputs,
      chamberMechanics: Object.freeze({
        ...base.mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: Object.freeze({
          ...base.mechanismResearchInputs.chamberMechanics
            .activeTensionScaleByWall,
          LVFW: ventricularContractilityScale,
          SEP: ventricularContractilityScale,
          RVFW: ventricularContractilityScale,
        }),
      }),
    }),
  });
}

function exactContractFromManifestV1(
  manifest: ExactModelKernelManifestV3,
): ModelContractV2 {
  const model: ModelContractV2 = Object.freeze({
    modelId: manifest.modelId,
    modelFamilyId: manifest.modelFamilyId,
    displayName: manifest.modelId,
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    controlCatalog: manifest.primitiveControlCatalog,
    outputCatalog: Object.freeze([
      ...manifest.primitiveSignalCatalog,
      ...manifest.modelMetricCatalog,
    ]),
    graphCatalog: Object.freeze([]),
  });
  assertModelContractV2(model);
  return model;
}

function assertCanonicalEqualV1(
  predecessor: unknown,
  candidate: unknown,
  label: string,
): void {
  if (!exactValueEqualV1(predecessor, candidate)) {
    throw new Error(
      `${label} changed under the same selected Standard66 modelId`,
    );
  }
}

/** Object.is preserves negative zero, unlike JSON serialization. */
function exactValueEqualV1(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) {
    return false;
  }
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (ArrayBuffer.isView(left) || ArrayBuffer.isView(right)) {
    if (
      !ArrayBuffer.isView(left)
      || !ArrayBuffer.isView(right)
      || left.constructor !== right.constructor
      || left.byteLength !== right.byteLength
    ) {
      return false;
    }
    const leftBytes = new Uint8Array(
      left.buffer,
      left.byteOffset,
      left.byteLength,
    );
    const rightBytes = new Uint8Array(
      right.buffer,
      right.byteOffset,
      right.byteLength,
    );
    return leftBytes.every((value, index) => value === rightBytes[index]);
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => exactValueEqualV1(value, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && exactValueEqualV1(leftRecord[key], rightRecord[key]));
}
