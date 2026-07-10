import {
  runMechanisticAtrialProfileV1,
  type MechanisticAtrialProfileResultV1,
} from "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";
import {
  DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
  type OneFiberAVPlaneLeftHeartParamsV1,
} from "@/engine/mechanics2/subsystems/OneFiberAVPlaneLeftHeartV1";

export const MECHANISTIC_ATRIAL_ENVELOPE_REPORT_ID_V1 =
  "mechanistic-atrial-envelope-report-v1" as const;

export type MechanisticAtrialEnvelopeCaseV1 = {
  readonly caseId: string;
  readonly axis: "reference" | "dt" | "heart-rate" | "preload" | "afterload" |
    "lv-contractility" | "la-stiffness" | "av-coupling";
  readonly level: "low" | "reference" | "high";
  readonly result: MechanisticAtrialProfileResultV1;
};

export type MechanisticAtrialEnvelopeReportV1 = {
  readonly reportId: typeof MECHANISTIC_ATRIAL_ENVELOPE_REPORT_ID_V1;
  readonly cases: readonly MechanisticAtrialEnvelopeCaseV1[];
  readonly gates: {
    readonly numericalPass: boolean;
    readonly broadEnvelopePass: boolean;
    readonly boundaryAndValveBurdenPass: boolean;
    readonly directionalResponsePass: boolean;
    readonly dtParityPass: boolean;
    readonly smoothValveEventPass: boolean;
    readonly normalMitralWaveformRetentionPass: boolean;
    readonly moderateTopologyRetentionPass: boolean;
  };
  readonly directionalChecks: Readonly<Record<string, boolean>>;
  readonly dtRelativeErrors: Readonly<Record<string, number>>;
  readonly gateScope: {
    readonly hardAcrossAllCases: readonly string[];
    readonly normalAndDtReplicasOnly: readonly string[];
    readonly diagnosticMorphologyAxes: readonly string[];
    readonly deferredToFullCircuit: readonly string[];
    readonly requiresMeasurementModel: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly fullFourChamberCircuit: false;
    readonly pathologyValidation: false;
    readonly patientSpecificIdentifiability: false;
  };
};

type CaseSpec = {
  readonly caseId: string;
  readonly axis: MechanisticAtrialEnvelopeCaseV1["axis"];
  readonly level: MechanisticAtrialEnvelopeCaseV1["level"];
  readonly params?: OneFiberAVPlaneLeftHeartParamsV1;
  readonly heartRateBpm?: number;
  readonly dtSec?: number;
};

const base = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1;

export function runMechanisticAtrialEnvelopeBenchV1(): MechanisticAtrialEnvelopeReportV1 {
  const specs: readonly CaseSpec[] = [
    { caseId: "normal-dt1", axis: "reference", level: "reference" },
    { caseId: "normal-dt0p5", axis: "dt", level: "low", dtSec: 0.0005 },
    { caseId: "normal-dt2", axis: "dt", level: "high", dtSec: 0.002 },
    { caseId: "hr60", axis: "heart-rate", level: "low", heartRateBpm: 60 },
    { caseId: "hr100", axis: "heart-rate", level: "high", heartRateBpm: 100 },
    {
      caseId: "preload-low",
      axis: "preload",
      level: "low",
      params: { ...base, initialReturnReservoirPressureMmHg: 13.5 },
    },
    {
      caseId: "preload-high",
      axis: "preload",
      level: "high",
      params: { ...base, initialReturnReservoirPressureMmHg: 21.5 },
    },
    {
      caseId: "afterload-low",
      axis: "afterload",
      level: "low",
      params: { ...base, systemicResistanceMmHgSecPerMl: 0.90 },
    },
    {
      caseId: "afterload-high",
      axis: "afterload",
      level: "high",
      params: { ...base, systemicResistanceMmHgSecPerMl: 1.45 },
    },
    {
      caseId: "lv-contractility-low",
      axis: "lv-contractility",
      level: "low",
      params: { ...base, lvWall: { ...base.lvWall, activeStressMaxKPa: 50 } },
    },
    {
      caseId: "lv-contractility-high",
      axis: "lv-contractility",
      level: "high",
      params: { ...base, lvWall: { ...base.lvWall, activeStressMaxKPa: 80 } },
    },
    {
      caseId: "la-stiffness-low",
      axis: "la-stiffness",
      level: "low",
      params: { ...base, laWall: { ...base.laWall, passiveStiffnessKPa: 18 } },
    },
    {
      caseId: "la-stiffness-high",
      axis: "la-stiffness",
      level: "high",
      params: { ...base, laWall: { ...base.laWall, passiveStiffnessKPa: 60 } },
    },
    {
      caseId: "av-coupling-low",
      axis: "av-coupling",
      level: "low",
      params: {
        ...base,
        avPlane: { ...base.avPlane, ventricularLongitudinalTissueAreaCm2: 24 },
      },
    },
    {
      caseId: "av-coupling-high",
      axis: "av-coupling",
      level: "high",
      params: {
        ...base,
        avPlane: { ...base.avPlane, ventricularLongitudinalTissueAreaCm2: 48 },
      },
    },
  ];
  const cases = specs.map((spec) => ({
    caseId: spec.caseId,
    axis: spec.axis,
    level: spec.level,
    result: runMechanisticAtrialProfileV1({
      profileId: spec.caseId,
      params: spec.params ?? base,
      heartRateBpm: spec.heartRateBpm,
      dtSec: spec.dtSec,
    }),
  }));
  const result = (caseId: string) => cases.find((row) => row.caseId === caseId)!.result;
  const reference = result("normal-dt1");
  const dtHalf = result("normal-dt0p5");
  const dtDouble = result("normal-dt2");
  const directionalChecks = {
    preloadRaisesLaPressure:
      result("preload-high").pressureRangeLaMmHg[1] > result("preload-low").pressureRangeLaMmHg[1],
    preloadRaisesEndDiastolicVolume:
      result("preload-high").volumeRangeLvMl[1] > result("preload-low").volumeRangeLvMl[1],
    preloadRaisesOutput:
      result("preload-high").cardiacOutputLPerMin > result("preload-low").cardiacOutputLPerMin,
    afterloadRaisesAorticPressure:
      result("afterload-high").pressureRangeAorticMmHg[1] >
      result("afterload-low").pressureRangeAorticMmHg[1],
    highAfterloadReducesOutput:
      result("afterload-high").cardiacOutputLPerMin < result("afterload-low").cardiacOutputLPerMin,
    contractilityRaisesLvPressure:
      result("lv-contractility-high").pressureRangeLvMmHg[1] >
      result("lv-contractility-low").pressureRangeLvMmHg[1],
    contractilityRaisesOutput:
      result("lv-contractility-high").cardiacOutputLPerMin >
      result("lv-contractility-low").cardiacOutputLPerMin,
    stiffnessRaisesLaPressure:
      result("la-stiffness-high").pressureRangeLaMmHg[1] >
      result("la-stiffness-low").pressureRangeLaMmHg[1],
    couplingRaisesAvpd:
      result("av-coupling-high").avPlaneDisplacementCm >
      result("av-coupling-low").avPlaneDisplacementCm,
  };
  const dtRelativeErrors = {
    halfCardiacOutput: relativeError(dtHalf.cardiacOutputLPerMin, reference.cardiacOutputLPerMin),
    halfLaPeakPressure: relativeError(dtHalf.pressureRangeLaMmHg[1], reference.pressureRangeLaMmHg[1]),
    halfAvpd: relativeError(dtHalf.avPlaneDisplacementCm, reference.avPlaneDisplacementCm),
    doubleCardiacOutput: relativeError(dtDouble.cardiacOutputLPerMin, reference.cardiacOutputLPerMin),
    doubleLaPeakPressure: relativeError(dtDouble.pressureRangeLaMmHg[1], reference.pressureRangeLaMmHg[1]),
    doubleAvpd: relativeError(dtDouble.avPlaneDisplacementCm, reference.avPlaneDisplacementCm),
  };
  const numericalPass = cases.every(({ result: row }) =>
    row.allFinite && row.allStepsConverged && row.periodicSteadyState &&
    row.maxAbsMassResidualMl <= 1e-6 &&
    row.maxAbsAvPlaneKinematicResidualCm <= 1e-7 &&
    row.maxAbsAvPlaneForceResidualN <= 1e-5 &&
    row.maxAbsClosedCircuitVolumeResidualMl <= 1e-6 &&
    row.maxNonlinearResidual <= 1e-7
  );
  const broadEnvelopePass = cases.every(({ result: row }) =>
    row.volumeRangeLaMl[0] > 0 && row.volumeRangeLvMl[0] > 0 &&
    row.pressureRangeLaMmHg[0] > -5 && row.pressureRangeLaMmHg[1] < 35 &&
    row.pressureRangeLvMmHg[1] >= 50 && row.pressureRangeLvMmHg[1] <= 220 &&
    row.pressureRangeAorticMmHg[0] >= 35 && row.pressureRangeAorticMmHg[1] <= 220 &&
    row.cardiacOutputLPerMin >= 2 && row.cardiacOutputLPerMin <= 10 &&
    row.avPlaneDisplacementCm >= 0 && row.avPlaneDisplacementCm <= 2 &&
    row.peakAvPlaneVelocityCmPerSec <= 20
  );
  const boundaryAndValveBurdenPass = cases.every(({ result: row }) =>
    row.pressureRangePulmonaryVenousMmHg[0] > 0.1 &&
    row.pressureRangePulmonaryVenousMmHg[1] < 40 &&
    row.pressureRangeReturnReservoirMmHg[0] > 0.1 &&
    row.pressureRangeReturnReservoirMmHg[1] < 40 &&
    Math.max(...row.flowRangePulmonaryVenousMlPerSec.map(Math.abs)) < 500 &&
    Math.max(...row.flowRangeSystemicMlPerSec.map(Math.abs)) < 500 &&
    row.mitralReverseVolumeMl <= Math.max(1, 0.05 * row.strokeVolumeMl) &&
    row.aorticReverseVolumeMl <= Math.max(1, 0.05 * row.strokeVolumeMl) &&
    row.mitralSignificantReverseDuty01 <= 0.05 &&
    row.aorticSignificantReverseDuty01 <= 0.05
  );
  const dtParityPass = Object.values(dtRelativeErrors).every((value) => value <= 0.08);
  const smoothValveEventPass =
    dtHalf.mvcTangentJumpNorm <= 0.75 * reference.mvcTangentJumpNorm &&
    reference.mvcTangentJumpNorm <= 0.75 * dtDouble.mvcTangentJumpNorm &&
    dtHalf.mvoTangentJumpNorm <= 0.75 * reference.mvoTangentJumpNorm &&
    reference.mvoTangentJumpNorm <= 0.75 * dtDouble.mvoTangentJumpNorm;
  const moderateTopologyIds = ["normal-dt1", "normal-dt0p5", "normal-dt2"];
  const normalMitralWaveformRetentionPass = moderateTopologyIds.every((caseId) => {
    const row = result(caseId);
    return row.mitralGateReadback.hardAcceptancePass &&
      row.mitralGateReadback.supportiveDiagnosticsPass;
  });
  const moderateTopologyRetentionPass = moderateTopologyIds.every((caseId) => {
    const row = result(caseId);
    return row.figureEightCrossingInPreferredWindow &&
      row.figureEightCrossingAngleDeg >= 10 &&
      row.opposedLobeOrientation &&
      row.reservoirSecondaryPeakCount <= 1 &&
      row.conduitBeforeCrossingBelowReservoirPathFraction >= 0.95 &&
      row.pumpingAfterCrossingAboveReservoirPathFraction >= 0.95 &&
      row.pumpingAboveFigureEightChordFraction >= 0.80;
  });
  return {
    reportId: MECHANISTIC_ATRIAL_ENVELOPE_REPORT_ID_V1,
    cases,
    gates: {
      numericalPass,
      broadEnvelopePass,
      boundaryAndValveBurdenPass,
      directionalResponsePass: Object.values(directionalChecks).every(Boolean),
      dtParityPass,
      smoothValveEventPass,
      normalMitralWaveformRetentionPass,
      moderateTopologyRetentionPass,
    },
    directionalChecks,
    dtRelativeErrors,
    gateScope: {
      hardAcrossAllCases: [
        "numerical conservation and convergence",
        "broad physical bounds",
        "positive bounded PV/return pressures and finite boundary flows",
        "MV/AoV reverse-volume and significant reverse-duty burden",
        "prespecified directional responses",
      ],
      normalAndDtReplicasOnly: [
        "late-conduit or early-pumping figure-eight intersection",
        "conduit below reservoir before the intersection",
        "pumping above reservoir after the intersection",
        "pumping above the intersection-to-MVC chord",
        "finite crossing angle",
        "opposed signed A/v lobe orientation",
        "age-41-60 normal MVF eligibility and E/A",
        "MVF supportive diagnostics",
        "valve-event tangent convergence under dt refinement",
      ],
      diagnosticMorphologyAxes: [
        "heart rate",
        "preload",
        "afterload",
        "LV contractility",
        "LA stiffness",
        "AV coupling",
      ],
      deferredToFullCircuit: [
        "clinical filling-pressure classification from multiple concordant indices",
        "age-specific MVF acceptance outside the declared 41-60-year reference",
        "fusion acceptance across heart-rate, PR, preload, and afterload envelopes",
        "pulmonary venous S/D/Ar morphology requiring full cardiopulmonary boundaries",
      ],
      requiresMeasurementModel: [
        "PW-Doppler leaflet-tip sample volume, beam angle, and spectral-envelope operator",
        "clinical E/A, VTI, and DT equivalence to Doppler acquisition and analysis",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      fullFourChamberCircuit: false,
      pathologyValidation: false,
      patientSpecificIdentifiability: false,
    },
  };
}

function relativeError(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-9);
}
