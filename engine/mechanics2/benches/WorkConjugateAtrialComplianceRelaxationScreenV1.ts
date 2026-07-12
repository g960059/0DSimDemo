import {
  HARD_GATE_THRESHOLDS_V1,
  runWorkConjugateAtrialAVPlaneProfileV1,
  WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
  WORK_CONJUGATE_ATRIAL_AV_PLANE_EVENT_ACTIVATION_MODEL_V1,
  type WorkConjugateAtrialAVPlaneLaActivationModelV1,
  type WorkConjugateAtrialAVPlaneProfileV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";
import { evaluateWorkConjugateAVPlaneChamberWallV1 } from
  "@/engine/mechanics2/atrial/WorkConjugateAVPlaneChamberWallV1";
import type { WorkConjugateAVPlaneLeftHeartParamsV1 } from
  "@/engine/mechanics2/subsystems/WorkConjugateAVPlaneLeftHeartV1";

export const WORK_CONJUGATE_ATRIAL_COMPLIANCE_RELAXATION_SCREEN_ID_V1 =
  "work-conjugate-atrial-compliance-relaxation-screen-v1" as const;

const PASSIVE_STRESS_SCALES_V1 = [0.4, 0.7, 1] as const;
const CONTRACTILE_OFF_RATES_PER_SEC_V1 = [20, 30, 50] as const;
const FIXED_Z_COMPLIANCE_VOLUME_ML_V1 = 75;
const FIXED_Z_COMPLIANCE_DELTA_VOLUME_ML_V1 = 0.1;
const DISCRETIZATION_DT_SEC_V1 = [0.0005, 0.001, 0.002] as const;

export type WorkConjugateAtrialComplianceRelaxationCaseV1 = {
  readonly caseId: string;
  readonly laPassiveStressScale: number;
  readonly contractileOffRatePerSec: number;
  readonly changedParameterPaths: readonly string[];
  readonly fixedZPassiveComplianceReadback: {
    readonly role: "local-tangent-diagnostic-not-global-atrial-compliance";
    readonly activation01: 0;
    readonly avPlanePositionCm: 0;
    readonly evaluationVolumeMl: number;
    readonly deltaVolumeMl: number;
    readonly pressureSlopeMmHgPerMl: number;
    readonly complianceMlPerMmHg: number;
  };
  readonly activationReadback: {
    readonly eventToPeakSec: number;
    readonly rt50Sec: number | null;
    readonly activationAtMitralClosing01: number;
  };
  readonly waveformReadback: {
    readonly xTheta: number;
    readonly cToXDepthMmHg: number;
    readonly postMitralClosingSecondaryRiseMmHg: number;
    readonly yDepthMmHg: number;
    readonly yStatus: string;
    readonly mitralFusionClass: string;
    readonly ePeakVelocityCmPerSec: number;
    readonly aPeakVelocityCmPerSec: number;
    readonly eDecelerationTimeSec: number;
    readonly velocityAtAtrialActivationOnsetCmPerSec: number;
    readonly diastasisDurationSec: number;
    readonly cardiacOutputLPerMin: number;
  };
  readonly mechanicalHardGates: {
    readonly finite: boolean;
    readonly solverConverged: boolean;
    readonly periodic: boolean;
    readonly massAndPowerResiduals: boolean;
    readonly pass: boolean;
  };
};

export type WorkConjugateAtrialComplianceRelaxationScreenV1 = {
  readonly reportId:
    typeof WORK_CONJUGATE_ATRIAL_COMPLIANCE_RELAXATION_SCREEN_ID_V1;
  readonly role: "report-only-two-factor-mechanism-screen";
  readonly modelBoundary: {
    readonly sidecar: "WorkConjugateAVPlaneLeftHeartV1";
    readonly runtimeWiring: false;
    readonly clinicalFit: false;
    readonly atrialComplianceMeasurement: false;
  };
  readonly factors: {
    readonly passive: {
      readonly parameterPaths: readonly [
        "params.laWall.axes.circumferential.passiveStressScaleKPa",
        "params.laWall.axes.longitudinal.passiveStressScaleKPa",
      ];
      readonly scales: typeof PASSIVE_STRESS_SCALES_V1;
      readonly interpretation:
        "wall-passive-stress-scale-not-a-direct-global-compliance-parameter";
    };
    readonly activeRelaxation: {
      readonly parameterPath:
        "activationModel.params.contractileKinetics.offRatePerSec";
      readonly dosesPerSec: typeof CONTRACTILE_OFF_RATES_PER_SEC_V1;
      readonly interpretation:
        "kinetic-dose-with-realized-rt50-readback-not-a-measured-relaxation-time";
    };
  };
  readonly cases: readonly WorkConjugateAtrialComplianceRelaxationCaseV1[];
  readonly baselineCaseId: "passive-1-off-30";
  readonly discretizationRobustness: {
    readonly role: "anchor-dose-dt-continuity-not-global-convergence-proof";
    readonly dtSec: typeof DISCRETIZATION_DT_SEC_V1;
    readonly anchors: readonly {
      readonly anchorId: "baseline" | "high-passive-compliance";
      readonly laPassiveStressScale: 0.4 | 1;
      readonly contractileOffRatePerSec: 30;
      readonly replicas: readonly {
        readonly dtSec: number;
        readonly mechanicalHardGatePass: boolean;
        readonly xTheta: number;
        readonly yDepthMmHg: number;
        readonly mitralFusionClass: string;
        readonly diastasisDurationSec: number;
        readonly velocityAtAtrialActivationOnsetCmPerSec: number;
      }[];
      readonly classificationStable: boolean;
      readonly coarseToFineAbsoluteDifference: {
        readonly xTheta: number;
        readonly yDepthMmHg: number;
        readonly velocityAtAtrialActivationOnsetCmPerSec: number;
      };
    }[];
    readonly allMechanicalHardGatesPass: boolean;
    readonly allClassificationsStable: boolean;
  };
  readonly result: {
    readonly allCasesPassMechanicalHardGates: boolean;
    readonly anySeparatedEa: boolean;
    readonly anyPositiveDiastasis: boolean;
    readonly lowerPassiveStressCanAdvanceX: boolean;
    readonly lowerPassiveStressMakesYShallowerAtBaselineOffRate: boolean;
    readonly lowerPassiveStressIncreasesResidualEAtAtrialOnsetAtBaselineOffRate:
      boolean;
    readonly fasterActiveRelaxationAloneSeparatesEaAtBaselinePassiveStress:
      boolean;
    readonly verdict:
      "passive-expansibility-is-an-x-lever-not-a-sufficient-ea-or-y-solution";
  };
  readonly nextExperiment: {
    readonly addAvpdAsOrthogonalFactor: true;
    readonly retainPassiveAndActiveRelaxationSeparation: true;
    readonly doNotPromoteFromThisScreen: true;
  };
};

export function runWorkConjugateAtrialComplianceRelaxationScreenV1():
WorkConjugateAtrialComplianceRelaxationScreenV1 {
  const cases = PASSIVE_STRESS_SCALES_V1.flatMap((passiveScale) =>
    CONTRACTILE_OFF_RATES_PER_SEC_V1.map((offRatePerSec) =>
      runCase(passiveScale, offRatePerSec)
    )
  );
  const baseline = caseByDose(cases, 1, 30);
  const compliant = caseByDose(cases, 0.4, 30);
  const fastRelaxation = caseByDose(cases, 1, 50);
  const discretizationRobustness = buildDiscretizationRobustness();

  return {
    reportId: WORK_CONJUGATE_ATRIAL_COMPLIANCE_RELAXATION_SCREEN_ID_V1,
    role: "report-only-two-factor-mechanism-screen",
    modelBoundary: {
      sidecar: "WorkConjugateAVPlaneLeftHeartV1",
      runtimeWiring: false,
      clinicalFit: false,
      atrialComplianceMeasurement: false,
    },
    factors: {
      passive: {
        parameterPaths: [
          "params.laWall.axes.circumferential.passiveStressScaleKPa",
          "params.laWall.axes.longitudinal.passiveStressScaleKPa",
        ],
        scales: PASSIVE_STRESS_SCALES_V1,
        interpretation:
          "wall-passive-stress-scale-not-a-direct-global-compliance-parameter",
      },
      activeRelaxation: {
        parameterPath:
          "activationModel.params.contractileKinetics.offRatePerSec",
        dosesPerSec: CONTRACTILE_OFF_RATES_PER_SEC_V1,
        interpretation:
          "kinetic-dose-with-realized-rt50-readback-not-a-measured-relaxation-time",
      },
    },
    cases,
    baselineCaseId: "passive-1-off-30",
    discretizationRobustness,
    result: {
      allCasesPassMechanicalHardGates: cases.every((row) =>
        row.mechanicalHardGates.pass
      ),
      anySeparatedEa: cases.some((row) =>
        row.waveformReadback.mitralFusionClass === "separated"
      ),
      anyPositiveDiastasis: cases.some((row) =>
        row.waveformReadback.diastasisDurationSec > 0
      ),
      lowerPassiveStressCanAdvanceX:
        compliant.waveformReadback.xTheta < baseline.waveformReadback.xTheta,
      lowerPassiveStressMakesYShallowerAtBaselineOffRate:
        compliant.waveformReadback.yDepthMmHg <
          baseline.waveformReadback.yDepthMmHg,
      lowerPassiveStressIncreasesResidualEAtAtrialOnsetAtBaselineOffRate:
        compliant.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec >
          baseline.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec,
      fasterActiveRelaxationAloneSeparatesEaAtBaselinePassiveStress:
        fastRelaxation.waveformReadback.mitralFusionClass === "separated",
      verdict:
        "passive-expansibility-is-an-x-lever-not-a-sufficient-ea-or-y-solution",
    },
    nextExperiment: {
      addAvpdAsOrthogonalFactor: true,
      retainPassiveAndActiveRelaxationSeparation: true,
      doNotPromoteFromThisScreen: true,
    },
  };
}

function runCase(
  passiveScale: number,
  offRatePerSec: number,
  dtSec = 0.001,
): WorkConjugateAtrialComplianceRelaxationCaseV1 {
  const params = paramsWithLaPassiveScale(passiveScale);
  const activationModel = activationModelWithOffRate(offRatePerSec);
  const profile = runWorkConjugateAtrialAVPlaneProfileV1({
    profileId: `passive-${passiveScale}-off-${offRatePerSec}`,
    variantId: "event-driven-atrial-activation-ablation",
    params,
    activationModel,
    dtSec,
  });
  const residuals = profile.residualExtrema;
  const massAndPowerResiduals =
    residuals.maxNormalizedEquationResidual <=
      HARD_GATE_THRESHOLDS_V1.maxNormalizedEquationResidual &&
    residuals.maxAbsMassResidualMl <=
      HARD_GATE_THRESHOLDS_V1.maxAbsMassResidualMl &&
    residuals.maxAbsClosedCircuitVolumeResidualMl <=
      HARD_GATE_THRESHOLDS_V1.maxAbsClosedCircuitVolumeResidualMl &&
    residuals.maxAbsTotalVolumeDriftMl <=
      HARD_GATE_THRESHOLDS_V1.maxAbsTotalVolumeDriftMl &&
    residuals.maxAbsWallRawPowerResidualW <=
      HARD_GATE_THRESHOLDS_V1.maxAbsWallRawPowerResidualW &&
    residuals.maxAbsPressureAreaIdentityResidualN <=
      HARD_GATE_THRESHOLDS_V1.maxAbsPressureAreaIdentityResidualN &&
    residuals.maxAbsAvPlaneForceResidualN <=
      HARD_GATE_THRESHOLDS_V1.maxAbsAvPlaneForceResidualN &&
    residuals.maxAbsAvForcePowerResidualW <=
      HARD_GATE_THRESHOLDS_V1.maxAbsAvForcePowerResidualW &&
    residuals.maxAbsCoupledRawPowerResidualW <=
      HARD_GATE_THRESHOLDS_V1.maxAbsCoupledRawPowerResidualW &&
    residuals.maxHiddenBloodVolumeSourceMl === 0;
  const mechanicalHardGates = {
    finite: profile.allFinite,
    solverConverged: profile.allStepsConverged && profile.allAcceptedSteps,
    periodic: profile.periodicSteadyState && profile.cycleClosure.pass,
    massAndPowerResiduals,
    pass: profile.allFinite && profile.allStepsConverged &&
      profile.allAcceptedSteps && profile.periodicSteadyState &&
      profile.cycleClosure.pass && massAndPowerResiduals,
  };

  return {
    caseId: `passive-${passiveScale}-off-${offRatePerSec}`,
    laPassiveStressScale: passiveScale,
    contractileOffRatePerSec: offRatePerSec,
    changedParameterPaths: [
      ...(passiveScale === 1 ? [] : [
        "params.laWall.axes.circumferential.passiveStressScaleKPa",
        "params.laWall.axes.longitudinal.passiveStressScaleKPa",
      ]),
      ...(offRatePerSec === 30 ? [] : [
        "activationModel.params.contractileKinetics.offRatePerSec",
      ]),
    ],
    fixedZPassiveComplianceReadback: fixedZPassiveCompliance(params),
    activationReadback: {
      eventToPeakSec: profile.activationReadback.laEventToContractilePeakSec,
      rt50Sec: profile.activationReadback.laContractileRt50Sec,
      activationAtMitralClosing01:
        profile.activationReadback
          .laActivationAtMitralClosingConductanceMidpoint01,
    },
    waveformReadback: waveformReadback(profile),
    mechanicalHardGates,
  };
}

function buildDiscretizationRobustness():
WorkConjugateAtrialComplianceRelaxationScreenV1["discretizationRobustness"] {
  const anchors = ([
    { anchorId: "baseline", passiveScale: 1 },
    { anchorId: "high-passive-compliance", passiveScale: 0.4 },
  ] as const).map(({ anchorId, passiveScale }) => {
    const cases = DISCRETIZATION_DT_SEC_V1.map((dtSec) =>
      runCase(passiveScale, 30, dtSec)
    );
    const replicas = cases.map((row, index) => ({
      dtSec: DISCRETIZATION_DT_SEC_V1[index]!,
      mechanicalHardGatePass: row.mechanicalHardGates.pass,
      xTheta: row.waveformReadback.xTheta,
      yDepthMmHg: row.waveformReadback.yDepthMmHg,
      mitralFusionClass: row.waveformReadback.mitralFusionClass,
      diastasisDurationSec: row.waveformReadback.diastasisDurationSec,
      velocityAtAtrialActivationOnsetCmPerSec:
        row.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec,
    }));
    const fine = replicas[0]!;
    const coarse = replicas[2]!;
    return {
      anchorId,
      laPassiveStressScale: passiveScale,
      contractileOffRatePerSec: 30 as const,
      replicas,
      classificationStable: replicas.every((row) =>
        row.mitralFusionClass === fine.mitralFusionClass &&
        (row.diastasisDurationSec > 0) === (fine.diastasisDurationSec > 0)
      ),
      coarseToFineAbsoluteDifference: {
        xTheta: Math.abs(coarse.xTheta - fine.xTheta),
        yDepthMmHg: Math.abs(coarse.yDepthMmHg - fine.yDepthMmHg),
        velocityAtAtrialActivationOnsetCmPerSec: Math.abs(
          coarse.velocityAtAtrialActivationOnsetCmPerSec -
            fine.velocityAtAtrialActivationOnsetCmPerSec,
        ),
      },
    };
  });
  return {
    role: "anchor-dose-dt-continuity-not-global-convergence-proof",
    dtSec: DISCRETIZATION_DT_SEC_V1,
    anchors,
    allMechanicalHardGatesPass: anchors.every((anchor) =>
      anchor.replicas.every((row) => row.mechanicalHardGatePass)
    ),
    allClassificationsStable: anchors.every((anchor) =>
      anchor.classificationStable
    ),
  };
}

function paramsWithLaPassiveScale(
  scale: number,
): WorkConjugateAVPlaneLeftHeartParamsV1 {
  const base = WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1;
  return {
    ...base,
    laWall: {
      ...base.laWall,
      axes: {
        circumferential: {
          ...base.laWall.axes.circumferential,
          passiveStressScaleKPa:
            base.laWall.axes.circumferential.passiveStressScaleKPa * scale,
        },
        longitudinal: {
          ...base.laWall.axes.longitudinal,
          passiveStressScaleKPa:
            base.laWall.axes.longitudinal.passiveStressScaleKPa * scale,
        },
      },
    },
  };
}

function activationModelWithOffRate(
  offRatePerSec: number,
): WorkConjugateAtrialAVPlaneLaActivationModelV1 {
  const base = WORK_CONJUGATE_ATRIAL_AV_PLANE_EVENT_ACTIVATION_MODEL_V1;
  if (base.kind !== "event-driven-ca-like-bounded-state") {
    throw new Error("event-driven activation seed must remain event-driven");
  }
  return {
    ...base,
    params: {
      ...base.params,
      contractileKinetics: {
        ...base.params.contractileKinetics,
        offRatePerSec,
      },
    },
  };
}

function fixedZPassiveCompliance(
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAtrialComplianceRelaxationCaseV1[
  "fixedZPassiveComplianceReadback"
] {
  const pressureAt = (bloodVolumeMl: number) =>
    evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl,
      bloodVolumeDotMlPerSec: 0,
      avPlanePositionCm: 0,
      avPlaneVelocityCmPerSec: 0,
      activation01: 0,
      pericardialPressureKPa: 0,
    }, params.laWall).cavityPressureMmHg;
  const pressureSlopeMmHgPerMl = (
    pressureAt(
      FIXED_Z_COMPLIANCE_VOLUME_ML_V1 +
        FIXED_Z_COMPLIANCE_DELTA_VOLUME_ML_V1,
    ) -
    pressureAt(
      FIXED_Z_COMPLIANCE_VOLUME_ML_V1 -
        FIXED_Z_COMPLIANCE_DELTA_VOLUME_ML_V1,
    )
  ) / (2 * FIXED_Z_COMPLIANCE_DELTA_VOLUME_ML_V1);
  if (!(pressureSlopeMmHgPerMl > 0)) {
    throw new Error("fixed-z passive pressure slope must be positive");
  }
  return {
    role: "local-tangent-diagnostic-not-global-atrial-compliance",
    activation01: 0,
    avPlanePositionCm: 0,
    evaluationVolumeMl: FIXED_Z_COMPLIANCE_VOLUME_ML_V1,
    deltaVolumeMl: FIXED_Z_COMPLIANCE_DELTA_VOLUME_ML_V1,
    pressureSlopeMmHgPerMl,
    complianceMlPerMmHg: 1 / pressureSlopeMmHgPerMl,
  };
}

function waveformReadback(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): WorkConjugateAtrialComplianceRelaxationCaseV1["waveformReadback"] {
  return {
    xTheta: profile.xvyPressureReadback.xTheta,
    cToXDepthMmHg:
      profile.xvyPressureReadback.cWaveCandidate.cToXDepthMmHg,
    postMitralClosingSecondaryRiseMmHg:
      profile.xvyPressureReadback
        .postMitralClosingConductanceMidpointSecondaryRiseMmHg,
    yDepthMmHg: profile.xvyPressureReadback.yDescentDepthMmHg,
    yStatus: profile.xvyPressureReadback.yDescentMeasurementStatus,
    mitralFusionClass: profile.mitral.fusionClass,
    ePeakVelocityCmPerSec: profile.mitral.ePeakVelocityCmPerSec,
    aPeakVelocityCmPerSec: profile.mitral.aPeakVelocityCmPerSec,
    eDecelerationTimeSec: profile.mitral.eDecelerationTimeSec,
    velocityAtAtrialActivationOnsetCmPerSec:
      profile.mitral.velocityAtAtrialActivationOnsetCmPerSec,
    diastasisDurationSec: profile.mitral.diastasisDurationSec,
    cardiacOutputLPerMin: profile.cardiacOutputLPerMin,
  };
}

function caseByDose(
  cases: readonly WorkConjugateAtrialComplianceRelaxationCaseV1[],
  passiveScale: number,
  offRatePerSec: number,
): WorkConjugateAtrialComplianceRelaxationCaseV1 {
  const row = cases.find((candidate) =>
    candidate.laPassiveStressScale === passiveScale &&
    candidate.contractileOffRatePerSec === offRatePerSec
  );
  if (row === undefined) throw new Error("screen case is missing");
  return row;
}
