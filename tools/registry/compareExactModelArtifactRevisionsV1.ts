import { createHash } from "node:crypto";

import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import type { BoundExecutionPlanV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import { assertBoundExecutionPlanV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type { RegisteredModelExecutableBundleV2 } from "@/studio/contracts/v2/executable";
import type { ExactModelKernelManifestV3 } from "@/studio/contracts/v2/modelSurface";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import type { StudioSimulationScenarioInputV2 } from "@/studio/contracts/v2/simulation";
import { studioCanonicalJsonStringify } from "@/studio/infrastructure/json/StudioCanonicalJson";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import standardSurfaceReleaseV1 from "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v2.json";

export const EXACT_MODEL_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID =
  "circleheart-exact-model-artifact-equivalence-report-v1" as const;

export type ExactModelArtifactEquivalenceReportV1 = Readonly<{
  schemaId: typeof EXACT_MODEL_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID;
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

type ExactArtifactReleaseV1 = Readonly<{
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
 * Proves that an implementation-only successor preserves the complete public
 * frame and exact checkpoint capture over the frozen six-case solver corpus.
 * Any accepted numerical, output, clock, metadata, or checkpoint byte change
 * fails closed and therefore still requires a new scientific modelId.
 */
export async function compareExactModelArtifactRevisionsV1(
  input: Readonly<{
    predecessorArtifact: Uint8Array;
    predecessorArtifactRevisionId: string;
    candidateArtifact: Uint8Array;
    candidateArtifactRevisionId: string;
  }>,
): Promise<ExactModelArtifactEquivalenceReportV1> {
  const [predecessor, candidate] = await Promise.all([
    importReleaseV1(input.predecessorArtifact, "predecessor"),
    importReleaseV1(input.candidateArtifact, "candidate"),
  ]);
  const predecessorManifest = studioCanonicalJsonStringify(
    predecessor.manifest,
  );
  if (
    predecessorManifest !== studioCanonicalJsonStringify(candidate.manifest)
  ) {
    throw new Error(
      "Same-model artifact revision changed the exact numerical manifest",
    );
  }
  const modelId = predecessor.manifest.modelId;
  const cases = [];
  for (const corpusCase of MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1) {
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        Object.freeze({
          ...structuredClone(
            MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          ),
          hemodynamicResearchInputs: corpusCase.hemodynamicResearchInputs,
        }),
        [
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
            value: corpusCase.ventricularContractilityScale,
          },
        ],
      );
    const runtimeSessionId = `session/artifact-equivalence/${corpusCase.caseId}`;
    const scenarioId = `scenario/artifact-equivalence/${corpusCase.caseId}`;
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
        const [previousFrame, candidateFrame] = await Promise.all([
          predecessor.executables.simulationAdapter.advanceOnePresentationStep({
            runtimeSessionId,
            scenarioId,
          }),
          candidate.executables.simulationAdapter.advanceOnePresentationStep({
            runtimeSessionId,
            scenarioId,
          }),
        ]);
        assertCanonicalEqualV1(
          previousFrame,
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
      cases.push(
        Object.freeze({
          caseId: corpusCase.caseId,
          acceptedStepCount: corpusCase.acceptedStepCount,
          initialFrameEquality: "byte-exact" as const,
          advancedFrameEquality: "byte-exact" as const,
          exactCaptureEquality: "byte-exact" as const,
        }),
      );
    } finally {
      predecessor.executables.simulationAdapter.disposeSession(
        runtimeSessionId,
      );
      candidate.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }
  return Object.freeze({
    schemaId: EXACT_MODEL_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID,
    modelId,
    predecessorArtifactRevisionId: input.predecessorArtifactRevisionId,
    candidateArtifactRevisionId: input.candidateArtifactRevisionId,
    corpusId: MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
    equality: "byte-exact" as const,
    cases: Object.freeze(cases),
  });
}

async function importReleaseV1(
  artifact: Uint8Array,
  label: string,
): Promise<ExactArtifactReleaseV1> {
  const namespace = await importExactExecutableArtifactModuleV2(artifact);
  const factory = namespace.createCircleHeartExactModelReleaseV1;
  if (typeof factory !== "function") {
    throw new Error(`${label} artifact omits its exact release factory`);
  }
  const release: unknown = await factory();
  if (
    release === null ||
    typeof release !== "object" ||
    Array.isArray(release)
  ) {
    throw new Error(`${label} artifact returned an invalid exact release`);
  }
  const record = release as Record<string, unknown>;
  if (
    record.manifest === null ||
    typeof record.manifest !== "object" ||
    record.executables === null ||
    typeof record.executables !== "object"
  ) {
    throw new Error(`${label} artifact returned an incomplete exact release`);
  }
  return release as ExactArtifactReleaseV1;
}

async function createSessionV1(
  release: ExactArtifactReleaseV1,
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
  release: ExactArtifactReleaseV1,
  runtimeSessionId: string,
  scenarioId: string,
  caseId: string,
  fixture: typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
) {
  const model = composeStandardModelContractV1(
    release.manifest,
    standardSurfaceReleaseV1,
  ).contract;
  return release.executables.experimentCapture.captureAcceptedCandidate({
    experimentId: `experiment/artifact-equivalence/${caseId}`,
    model,
    desiredContent: {
      modelId: release.manifest.modelId,
      surfaceSeriesId: standardSurfaceReleaseV1.surfaceSeriesId,
      scenarios: [
        {
          scenarioId,
          label: caseId,
          fixture,
        },
      ],
      surface: EMPTY_SURFACE_V1,
    },
    correlation: {
      runtimeSessionId,
      scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
    },
  });
}

function assertCanonicalEqualV1(
  predecessor: unknown,
  candidate: unknown,
  label: string,
): void {
  const previous = studioCanonicalJsonStringify(predecessor);
  const next = studioCanonicalJsonStringify(candidate);
  if (previous !== next) {
    throw new Error(`${label} changed under the same scientific modelId`);
  }
}

export function exactModelArtifactEquivalenceReportSha256V1(
  report: ExactModelArtifactEquivalenceReportV1,
): string {
  return sha256V1(studioCanonicalJsonStringify(report));
}

function sha256V1(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
