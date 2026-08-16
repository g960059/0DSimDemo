import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  mainWireFiveWallCoronaryBaseStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  prepareMainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  solveMainWireFiveWallCoupledNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";

const NOMINAL_DT_SEC = 0.002;

export function captureMainWireSolverReplacementCorpusV1() {
  return Object.freeze({
    corpusId: MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
    cases: Object.freeze(
      MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1.map((corpusCase) => {
        const sequence = captureMainWireIntegratedModelSequenceV3(
          corpusCase.acceptedStepCount,
          Object.freeze({
            hemodynamicResearchInputs:
              corpusCase.hemodynamicResearchInputs,
            ventricularContractilityScale:
              corpusCase.ventricularContractilityScale,
          }),
        );
        const actualSha256 = mainWireIntegratedModelSequenceSha256V3(
          sequence.canonicalAcceptedStates,
        );
        return Object.freeze({
          caseId: corpusCase.caseId,
          acceptedStepCount: corpusCase.acceptedStepCount,
          expectedSha256: corpusCase.referenceAcceptedSequenceSha256,
          actualSha256,
          matches: actualSha256
            === corpusCase.referenceAcceptedSequenceSha256,
        });
      }),
    ),
  });
}

/**
 * Runs the replacement solver beside every accepted reference corpus step.
 * The reference state advances the driver, while the coupled solver receives the
 * exact same pre-step state, accepted calcium drive, and limited dt. This is
 * a branch/trajectory oracle only; legacy bytes are not candidate acceptance
 * authority.
 */
export function compareMainWireCoupledSolverShadowCorpusV1() {
  return Object.freeze({
    corpusId: MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
    solverId: "main-wire-five-wall-coupled-newton-shadow-v1" as const,
    cases: Object.freeze(MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1.map(
      (corpusCase) => compareCoupledCorpusCase(corpusCase),
    )),
  });
}

function compareCoupledCorpusCase(
  corpusCase: (typeof MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1)[number],
) {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    corpusCase.hemodynamicResearchInputs,
    corpusCase.ventricularContractilityScale,
  );
  const coupledWorkspace =
    createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
  let accepted = fixture.cold.acceptedState;
  let nominalGridIndex = 1;
  let maximumAbsoluteVolumeDifferenceMl = 0;
  let maximumAbsoluteDependentSvResidualMl = 0;
  let maximumCoupledResidualInfinityNormMl = 0;
  let maximumCoupledIterations = 0;
  let totalCoupledResidualEvaluations = 0;
  let totalCoupledJacobianEvaluations = 0;

  for (
    let stepIndex = 0;
    stepIndex < corpusCase.acceptedStepCount;
    stepIndex += 1
  ) {
    let nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
    while (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
      nominalGridIndex += 1;
      nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
    }
    const previous = accepted;
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      previous,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    const reference = stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      Object.freeze({
        candidateTimeSec: maximum.candidateTimeSec,
        coronary: fixture.coronaryStepInput,
        rhythm: Object.freeze({
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
      }),
    );
    if (reference.converged === false) {
      throw new Error(
        `${corpusCase.caseId} reference step ${stepIndex} failed: `
          + reference.message,
      );
    }
    const dtSec = reference.acceptedState.acceptedTimeSec
      - previous.acceptedTimeSec;
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      fixture.provider,
      mainWireFiveWallCoronaryBaseStateV2(previous.coronary),
      Object.freeze({
        ...fixture.coronaryStepInput,
        dtSec,
        calciumDriveOverride: reference.calciumDrive,
      }),
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      { maximumAcceptedStepsPerJacobian: 2 },
      coupledWorkspace,
    );
    const coupledResult = coupled.result;
    if (coupledResult.status !== "converged") {
      throw new Error(
        `${corpusCase.caseId} coupled step ${stepIndex} failed: `
          + coupledResult.message,
      );
    }
    maximumAbsoluteDependentSvResidualMl = Math.max(
      maximumAbsoluteDependentSvResidualMl,
      Math.abs(coupled.dependentSvContinuityResidualMl!),
    );
    maximumCoupledResidualInfinityNormMl = Math.max(
      maximumCoupledResidualInfinityNormMl,
      coupledResult.residualInfinityNorm,
    );
    maximumCoupledIterations = Math.max(
      maximumCoupledIterations,
      coupledResult.iterations,
    );
    totalCoupledResidualEvaluations += coupledResult.residualEvaluationCount;
    totalCoupledJacobianEvaluations += coupledResult.jacobianEvaluationCount;
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId, index) => {
      maximumAbsoluteVolumeDifferenceMl = Math.max(
        maximumAbsoluteVolumeDifferenceMl,
        Math.abs(
          coupledResult.solution[index]!
            - reference.coronaryStep.baseStep.circulationTrial
              .candidateNodeVolumesMl[nodeId],
        ),
      );
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
      maximumAbsoluteVolumeDifferenceMl = Math.max(
        maximumAbsoluteVolumeDifferenceMl,
        Math.abs(
          coupledResult.solution[
            NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index
          ]! - reference.coronaryStep.baseStep.coronaryTrial
            .candidateAcceptedState.volumeMlByNode[nodeId],
        ),
      );
    });
    accepted = reference.acceptedState;
    if (accepted.acceptedTimeSec === nominalTargetTimeSec) {
      nominalGridIndex += 1;
    }
  }

  return Object.freeze({
    caseId: corpusCase.caseId,
    acceptedStepCount: corpusCase.acceptedStepCount,
    maximumAbsoluteVolumeDifferenceMl,
    maximumAbsoluteDependentSvResidualMl,
    maximumCoupledResidualInfinityNormMl,
    maximumCoupledIterations,
    meanCoupledResidualEvaluations:
      totalCoupledResidualEvaluations / corpusCase.acceptedStepCount,
    meanCoupledJacobianEvaluations:
      totalCoupledJacobianEvaluations / corpusCase.acceptedStepCount,
  });
}

if (
  process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = process.argv.includes("--coupled-shadow")
    ? compareMainWireCoupledSolverShadowCorpusV1()
    : captureMainWireSolverReplacementCorpusV1();
  process.stdout.write(
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
