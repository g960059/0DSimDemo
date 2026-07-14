import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import {
  stepNoAvpdFourChamberHillTriSegV1,
  type NoAvpdFourChamberHillTriSegParamsV1,
  type NoAvpdFourChamberHillTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

type SourceReport = {
  readonly status: "pass" | "fail";
  readonly failureReason: string | null;
  readonly dtSec: number;
  readonly finalState: NoAvpdFourChamberHillTriSegStateV1;
  readonly parameterSnapshot: NoAvpdFourChamberHillTriSegParamsV1;
};

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export function diagnoseNoAvpdAtrialThinFilamentSlsFailureV1(
  sourceReportPath: string,
) {
  const source = readSourceReport(resolve(repoRoot, sourceReportPath));
  const baseParams = source.parameterSnapshot;
  const higherIterationParams = withSolver(baseParams, {
    maxIterations: 24,
    freshJacobianEveryIteration: false,
  });
  const freshJacobianParams = withSolver(baseParams, {
    maxIterations: baseParams.solver.maxIterations,
    freshJacobianEveryIteration: true,
  });
  const higherIterationFreshJacobianParams = withSolver(baseParams, {
    maxIterations: 24,
    freshJacobianEveryIteration: true,
  });
  const baseline = stepNoAvpdFourChamberHillTriSegV1(
    source.finalState,
    source.dtSec,
    baseParams,
  );
  const higherIterations = stepNoAvpdFourChamberHillTriSegV1(
    source.finalState,
    source.dtSec,
    higherIterationParams,
  );
  const freshJacobian = stepNoAvpdFourChamberHillTriSegV1(
    source.finalState,
    source.dtSec,
    freshJacobianParams,
  );
  const higherIterationsFreshJacobian = stepNoAvpdFourChamberHillTriSegV1(
    source.finalState,
    source.dtSec,
    higherIterationFreshJacobianParams,
  );
  const firstHalfStep = stepNoAvpdFourChamberHillTriSegV1(
    source.finalState,
    source.dtSec / 2,
    baseParams,
  );
  const secondHalfStep = firstHalfStep.accepted
    ? stepNoAvpdFourChamberHillTriSegV1(
        firstHalfStep.state,
        source.dtSec / 2,
        baseParams,
      )
    : null;
  return {
    source: {
      reportPath: sourceReportPath,
      structuralStatus: source.status,
      failureReason: source.failureReason,
      acceptedStateTimeSec: source.finalState.timeSec,
      originalDtSec: source.dtSec,
      originalMaxIterations: baseParams.solver.maxIterations,
      originalJacobianReuse: baseParams.solver.jacobianReuse,
    },
    retries: {
      unchangedOriginalStep: summarizeStep(baseline),
      maxIterations24Only: summarizeStep(higherIterations),
      freshJacobianEveryIterationOnly: summarizeStep(freshJacobian),
      maxIterations24AndFreshJacobian: summarizeStep(
        higherIterationsFreshJacobian,
      ),
      twoHalfSteps: {
        first: summarizeStep(firstHalfStep),
        second: secondHalfStep == null ? null : summarizeStep(secondHalfStep),
        reachesOriginalNextTime:
          secondHalfStep?.accepted === true &&
          Math.abs(
            secondHalfStep.state.timeSec -
              (source.finalState.timeSec + source.dtSec),
          ) <= 1e-12,
      },
    },
    interpretationBoundary: {
      singleStepReplayOnly: true,
      physiologyConclusionAllowed: false,
      increasingIterationCapIsNotAcceptedAsMorphologyTuning: true,
      anyProtocolChangeMustBeAppliedToAllFourMatrixArms: true,
    },
  };
}

function readSourceReport(path: string): SourceReport {
  const bytes = readFileSync(path);
  const plain = path.endsWith(".gz") ? gunzipSync(bytes) : bytes;
  return JSON.parse(plain.toString("utf8")) as SourceReport;
}

function withSolver(
  params: NoAvpdFourChamberHillTriSegParamsV1,
  changes: {
    readonly maxIterations: number;
    readonly freshJacobianEveryIteration: boolean;
  },
): NoAvpdFourChamberHillTriSegParamsV1 {
  return {
    ...params,
    solver: {
      ...params.solver,
      maxIterations: changes.maxIterations,
      jacobianReuse: changes.freshJacobianEveryIteration
        ? {
            ...params.solver.jacobianReuse,
            maxAcceptedSteps: 0,
          }
        : params.solver.jacobianReuse,
    },
  };
}

function summarizeStep(
  output: ReturnType<typeof stepNoAvpdFourChamberHillTriSegV1>,
) {
  return {
    accepted: output.accepted,
    failureReasons: output.failureReasons,
    attemptedNextTimeSec: output.state.timeSec,
    solver: output.solver,
    totalBloodVolumeResidualMl: output.totalBloodVolumeResidualMl,
    evaluationAvailable: output.evaluation !== null,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const sourceReportPath = process.argv[2];
  if (sourceReportPath == null || sourceReportPath.startsWith("--")) {
    throw new Error("usage: diagnose... <candidate-report.json.gz>");
  }
  console.log(
    JSON.stringify(
      diagnoseNoAvpdAtrialThinFilamentSlsFailureV1(sourceReportPath),
      null,
      2,
    ),
  );
}
