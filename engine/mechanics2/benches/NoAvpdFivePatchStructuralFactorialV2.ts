import {
  summarizeFivePatchRawCycleDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";
import {
  buildFivePatchPhysiologyEnvelopeResolvedRunV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2";
import {
  assessFivePatchEnvelopePeriodicityV1,
  fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  totalBloodVolumeMl,
  type NoAvpdFivePatchLandTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";
import {
  NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2,
  createNoAvpdFivePatchStructuralParamsV2,
  initialNoAvpdFivePatchStructuralStateV2,
  stepNoAvpdFivePatchStructuralV2,
  type NoAvpdFivePatchStructuralArmIdV2,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchStructuralV2";

export const NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_ID_V2 =
  "no-avpd-five-patch-structural-factorial-v2" as const;

export type NoAvpdFivePatchStructuralFactorialRequestV2 = {
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly beats: number;
  readonly dtSec: number;
  readonly calciumRamp: "off-full-amplitude" | "envelope-common-ramp";
};

export type NoAvpdFivePatchStructuralSampleV2 = {
  readonly timeSec: number;
  readonly phase01: number;
  readonly volumesMl: NoAvpdFivePatchLandTriSegStateV1["volumes"];
  readonly pressuresMmHg: {
    readonly leftAtriumMmHg: number;
    readonly leftVentricleMmHg: number;
    readonly rightAtriumMmHg: number;
    readonly rightVentricleMmHg: number;
    readonly pulmonaryVeinMmHg: number;
  };
  readonly transmuralPressuresMmHg: {
    readonly leftAtriumMmHg: number;
    readonly leftVentricleMmHg: number;
    readonly rightAtriumMmHg: number;
    readonly rightVentricleMmHg: number;
  };
  readonly flowsMlPerSec: {
    readonly mitralMlPerSec: number;
    readonly pulmonaryVenousMlPerSec: number;
    readonly aorticMlPerSec: number;
  };
  readonly dynamicValves: Readonly<Record<
    "mitral" | "aortic" | "tricuspid" | "pulmonary",
    {
      readonly pressureGradientMmHg: number;
      readonly openingFraction01: number;
      readonly effectiveAreaCm2: number;
      readonly flowMlPerSec: number;
    }
  >>;
  readonly activations01: Readonly<Record<string, number>>;
  readonly leftAtrialPartition: {
    readonly bodyVolumeMl: number;
    readonly appendageVolumeMl: number;
    readonly appendageFraction01: number;
    readonly pressureMismatchMmHg: number;
  } | null;
  readonly commonPericardialPressureMmHg: number;
  readonly totalBloodVolumeResidualMl: number;
};

export type NoAvpdFivePatchStructuralArmResultV2 = {
  readonly armId: NoAvpdFivePatchStructuralArmIdV2;
  readonly status: "run-complete" | "integration-failure";
  readonly stepsAttempted: number;
  readonly stepsAccepted: number;
  readonly failureReasons: readonly string[];
  readonly failureDiagnostics: {
    readonly acceptedStateTimeSec: number;
    readonly attemptedNextTimeSec: number;
    readonly acceptedStateVolumesMl: NoAvpdFivePatchLandTriSegStateV1["volumes"];
    readonly acceptedAppendageVolumeMl: number | null;
    readonly aorticValveAtSolverEndpoint: {
      readonly pressureGradientMmHg: number;
      readonly openFraction01: number;
      readonly qMlPerSec: number;
      readonly qDotMlPerSec2: number;
      readonly resistanceMmHgSecPerMl: number;
      readonly inertanceMmHgSec2PerMl: number;
      readonly bernoulliMmHgSec2PerMl2: number;
      readonly pressureFlowResidualMmHg: number;
    } | null;
    readonly solver: ReturnType<typeof stepNoAvpdFivePatchStructuralV2>["solver"];
  } | null;
  readonly finalTimeSec: number;
  readonly initialTotalBloodVolumeMl: number;
  readonly finalTotalBloodVolumeMl: number;
  readonly maximumAbsoluteBloodVolumeResidualMl: number;
  readonly maximumAbsoluteBodyAppendagePressureMismatchMmHg: number;
  readonly periodicity: ReturnType<
    typeof assessFivePatchEnvelopePeriodicityV1
  >;
  readonly finalCycleSamples: readonly NoAvpdFivePatchStructuralSampleV2[];
  readonly reportOnlyRawCycleDiagnostics: ReturnType<
    typeof summarizeFivePatchRawCycleDiagnosticsV1
  >;
};

export type NoAvpdFivePatchStructuralFactorialResultV2 = {
  readonly factorialId: typeof NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_ID_V2;
  readonly request: NoAvpdFivePatchStructuralFactorialRequestV2;
  readonly candidateId: string;
  readonly scenarioReadback: ReturnType<
    typeof buildFivePatchPhysiologyEnvelopeResolvedRunV2
  >["scenarioConfig"]["scenarioReadback"];
  readonly policy: {
    readonly structuralFactorsFixedBeforeOutcomes: true;
    readonly crossArmWarmStart: false;
    readonly localOptimization: false;
    readonly scalarWinnerScore: false;
    readonly vLoopStatus: "report-only";
  };
  readonly arms: readonly NoAvpdFivePatchStructuralArmResultV2[];
};

export function runNoAvpdFivePatchStructuralFactorialV2(
  request: NoAvpdFivePatchStructuralFactorialRequestV2,
): NoAvpdFivePatchStructuralFactorialResultV2 {
  validateRequest(request);
  const source = buildFivePatchPhysiologyEnvelopeResolvedRunV2({
    phase: "arm-numerical-readiness",
    candidateIndex: request.candidateIndex,
    scenarioId: request.scenarioId,
    beats: request.beats,
    dtSec: request.dtSec,
  });
  const arms = NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2.map((armId) =>
    runArm(armId, request, source));
  return Object.freeze({
    factorialId: NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_ID_V2,
    request: Object.freeze({ ...request }),
    candidateId: source.candidateId,
    scenarioReadback: source.scenarioConfig.scenarioReadback,
    policy: Object.freeze({
      structuralFactorsFixedBeforeOutcomes: true as const,
      crossArmWarmStart: false as const,
      localOptimization: false as const,
      scalarWinnerScore: false as const,
      vLoopStatus: "report-only" as const,
    }),
    arms: Object.freeze(arms),
  });
}

export function runNoAvpdFivePatchStructuralArmV2(
  armId: NoAvpdFivePatchStructuralArmIdV2,
  request: NoAvpdFivePatchStructuralFactorialRequestV2,
): NoAvpdFivePatchStructuralArmResultV2 {
  validateRequest(request);
  const source = buildFivePatchPhysiologyEnvelopeResolvedRunV2({
    phase: "arm-numerical-readiness",
    candidateIndex: request.candidateIndex,
    scenarioId: request.scenarioId,
    beats: request.beats,
    dtSec: request.dtSec,
  });
  return runArm(armId, request, source);
}

function runArm(
  armId: NoAvpdFivePatchStructuralArmIdV2,
  request: NoAvpdFivePatchStructuralFactorialRequestV2,
  source: ReturnType<typeof buildFivePatchPhysiologyEnvelopeResolvedRunV2>,
): NoAvpdFivePatchStructuralArmResultV2 {
  const params = createNoAvpdFivePatchStructuralParamsV2(
    armId,
    source.scenarioConfig.params,
  );
  let state = initialNoAvpdFivePatchStructuralStateV2(
    armId,
    params,
    source.scenarioConfig.initialVolumeOverridesMl,
  );
  const initialTotalBloodVolumeMl = totalBloodVolumeMl(state.volumes);
  const endpointsPerCycle = exactStepCount(
    params.cycleLengthSec,
    1,
    request.dtSec,
  );
  const stepCount = endpointsPerCycle * request.beats;
  const finalCycle: NoAvpdFivePatchStructuralSampleV2[] = [];
  const boundaryStates: NoAvpdFivePatchLandTriSegStateV1[] = [state];
  let stepsAttempted = 0;
  let stepsAccepted = 0;
  let failureReasons: readonly string[] = Object.freeze([]);
  let failureDiagnostics: NoAvpdFivePatchStructuralArmResultV2["failureDiagnostics"] =
    null;
  let maximumAbsoluteBloodVolumeResidualMl = 0;
  let maximumAbsoluteBodyAppendagePressureMismatchMmHg = 0;

  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const beatNumber = Math.floor(stepIndex / endpointsPerCycle) + 1;
    const output = stepNoAvpdFivePatchStructuralV2(
      armId,
      state,
      request.dtSec,
      params,
      Object.freeze({
        prescribedCalciumPeakAboveDiastolicScale01:
          request.calciumRamp === "off-full-amplitude"
            ? 1
            : fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1(beatNumber),
      }),
    );
    stepsAttempted += 1;
    if (!output.accepted || output.evaluation === null) {
      failureReasons = Object.freeze([...output.failureReasons]);
      failureDiagnostics = Object.freeze({
        acceptedStateTimeSec: state.timeSec,
        attemptedNextTimeSec: state.timeSec + request.dtSec,
        acceptedStateVolumesMl: Object.freeze({ ...state.volumes }),
        acceptedAppendageVolumeMl:
          state.leftAtrialParallelWall?.appendageVolumeMl ?? null,
        aorticValveAtSolverEndpoint: output.evaluation === null
          ? null
          : Object.freeze({
              pressureGradientMmHg:
                output.evaluation.valves.aortic.pressureGradientMmHg,
              openFraction01:
                output.evaluation.valves.aortic.openFraction01,
              qMlPerSec: output.evaluation.valves.aortic.qMlPerSec,
              qDotMlPerSec2:
                output.evaluation.valves.aortic.qDotMlPerSec2,
              resistanceMmHgSecPerMl:
                output.evaluation.valves.aortic.resistanceMmHgSecPerMl,
              inertanceMmHgSec2PerMl:
                output.evaluation.valves.aortic.inertanceMmHgSec2PerMl,
              bernoulliMmHgSec2PerMl2:
                output.evaluation.valves.aortic.bernoulliMmHgSec2PerMl2,
              pressureFlowResidualMmHg:
                output.evaluation.valves.aortic.pressureFlowResidualMmHg,
            }),
        solver: Object.freeze({ ...output.solver }),
      });
      break;
    }
    state = output.state;
    stepsAccepted += 1;
    maximumAbsoluteBloodVolumeResidualMl = Math.max(
      maximumAbsoluteBloodVolumeResidualMl,
      Math.abs(output.totalBloodVolumeResidualMl ?? Number.POSITIVE_INFINITY),
    );
    const parallel = output.evaluation.leftAtrialParallelWall;
    maximumAbsoluteBodyAppendagePressureMismatchMmHg = Math.max(
      maximumAbsoluteBodyAppendagePressureMismatchMmHg,
      Math.abs(parallel?.pressureMismatchMmHg ?? 0),
    );
    if (stepIndex >= stepCount - endpointsPerCycle) {
      const bodyVolumeMl =
        parallel?.body?.volumeMl ?? state.volumes.leftAtriumMl;
      const appendageVolumeMl = parallel?.appendage?.volumeMl ?? 0;
      finalCycle.push(Object.freeze({
        timeSec: state.timeSec,
        phase01: ((stepIndex % endpointsPerCycle) + 1) / endpointsPerCycle,
        volumesMl: Object.freeze({ ...state.volumes }),
        pressuresMmHg: Object.freeze({
          leftAtriumMmHg: output.evaluation.pressures.leftAtriumMmHg,
          leftVentricleMmHg: output.evaluation.pressures.leftVentricleMmHg,
          rightAtriumMmHg: output.evaluation.pressures.rightAtriumMmHg,
          rightVentricleMmHg: output.evaluation.pressures.rightVentricleMmHg,
          pulmonaryVeinMmHg: output.evaluation.pressures.pulmonaryVeinMmHg,
        }),
        transmuralPressuresMmHg: Object.freeze({
          ...output.evaluation.transmuralPressures,
        }),
        flowsMlPerSec: Object.freeze({
          mitralMlPerSec: output.evaluation.flowReadback.mitralMlPerSec,
          pulmonaryVenousMlPerSec:
            output.evaluation.flowReadback.pulmonaryVenousMlPerSec,
          aorticMlPerSec: output.evaluation.flowReadback.aorticMlPerSec,
        }),
        dynamicValves: Object.freeze(Object.fromEntries(
          Object.entries(output.evaluation.valves).map(([valveId, valve]) => [
            valveId,
            Object.freeze({
              pressureGradientMmHg: valve.pressureGradientMmHg,
              openingFraction01: valve.openFraction01,
              effectiveAreaCm2: valve.effectiveAreaCm2,
              flowMlPerSec: valve.qMlPerSec,
            }),
          ]),
        ) as NoAvpdFivePatchStructuralSampleV2["dynamicValves"]),
        activations01: Object.freeze({
          ...output.evaluation.activations01,
        }),
        leftAtrialPartition: parallel === null
          ? null
          : Object.freeze({
              bodyVolumeMl,
              appendageVolumeMl,
              appendageFraction01:
                appendageVolumeMl / state.volumes.leftAtriumMl,
              pressureMismatchMmHg: parallel.pressureMismatchMmHg!,
            }),
        commonPericardialPressureMmHg:
          output.evaluation.commonPericardium?.pressureMmHg ?? 0,
        totalBloodVolumeResidualMl:
          output.totalBloodVolumeResidualMl ?? Number.NaN,
      }));
    }
    if ((stepIndex + 1) % endpointsPerCycle === 0) {
      boundaryStates.push(state);
      if (boundaryStates.length > 3) boundaryStates.shift();
    }
  }

  const completedRun = stepsAccepted === stepCount;
  const periodicity = assessFivePatchEnvelopePeriodicityV1(
    boundaryStates,
    { runCompleted: completedRun },
  );
  const activationPhase01 =
    params.calciumDrivers.leftAtrium.eventOnsetSec / params.cycleLengthSec;
  const rawDiagnostics = summarizeFivePatchRawCycleDiagnosticsV1(
    finalCycle,
    activationPhase01,
    {
      periodicityEstablished:
        periodicity.periodicityEstablished === true,
    },
  );
  return Object.freeze({
    armId,
    status: completedRun
      ? "run-complete" as const
      : "integration-failure" as const,
    stepsAttempted,
    stepsAccepted,
    failureReasons,
    failureDiagnostics,
    finalTimeSec: state.timeSec,
    initialTotalBloodVolumeMl,
    finalTotalBloodVolumeMl: totalBloodVolumeMl(state.volumes),
    maximumAbsoluteBloodVolumeResidualMl,
    maximumAbsoluteBodyAppendagePressureMismatchMmHg,
    periodicity,
    finalCycleSamples: Object.freeze(finalCycle),
    reportOnlyRawCycleDiagnostics: rawDiagnostics,
  });
}

function exactStepCount(
  cycleLengthSec: number,
  beats: number,
  dtSec: number,
): number {
  const raw = cycleLengthSec * beats / dtSec;
  const rounded = Math.round(raw);
  if (Math.abs(raw - rounded) > 1e-9 * Math.max(1, Math.abs(raw))) {
    throw new Error("cycle length and beats must be exactly divisible by dt");
  }
  return rounded;
}

function validateRequest(
  request: NoAvpdFivePatchStructuralFactorialRequestV2,
): void {
  if (!Number.isInteger(request.candidateIndex) || request.candidateIndex < 0) {
    throw new Error("candidateIndex must be a nonnegative integer");
  }
  if (!Number.isInteger(request.beats) || request.beats < 1) {
    throw new Error("beats must be a positive integer");
  }
  if (!Number.isFinite(request.dtSec) || request.dtSec <= 0) {
    throw new Error("dtSec must be positive and finite");
  }
}
