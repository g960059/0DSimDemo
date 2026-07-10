import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runMechanisticAtrialProfileV1,
  type MechanisticAtrialProfileResultV1,
} from "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";
import {
  ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2,
  atrialAVPlaneDiastasisReadbackV2,
  atrialAVPlaneLateDiastolicWindowReadbackV2,
  atrialAVPlanePrimeReadbackV2,
  evaluateAtrialAVPlanePassiveBalanceAcceptanceV2,
  type AtrialAVPlaneLateDiastolicWindowReadbackV2,
  type AtrialAVPlanePassiveBalanceAcceptanceFlagsV2,
  type AtrialAVPlaneForcePointV2,
} from "@/engine/mechanics2/benches/AtrialAVPlanePassiveBalanceBenchV2";
import { DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1 } from
  "@/engine/mechanics2/subsystems/OneFiberAVPlaneLeftHeartV1";

type Candidate = {
  readonly inertiaNSec2PerCm: number;
  readonly dampingNSecPerCm: number;
  readonly stiffnessNPerCm: number;
  readonly passiveNeutralPositionCm: number;
  readonly atrialActiveStressMaxKPa: number;
};

export type AtrialAVPlanePassiveBalanceLateDiastolicWindowAuditV2 = {
  readonly applicability: AtrialAVPlaneLateDiastolicWindowReadbackV2["applicability"];
  readonly applicabilityReason: AtrialAVPlaneLateDiastolicWindowReadbackV2[
    "applicabilityReason"
  ];
  readonly durationSec: number;
  readonly sampleCount: number;
  readonly hydraulicMedianAbsN: number;
  readonly passiveHydraulicOpposedSampleFraction: number;
  readonly quasiStaticResidualMaxAbsN: number;
  readonly dynamicToHydraulicForceRatioP95: number;
  readonly velocityMaxAbsCmPerSec: number;
  readonly mitralFlowFractionOfPeakMax: number;
};

export type AtrialAVPlanePassiveBalanceCandidateReadbackV2 = Candidate & {
  readonly score: number;
  readonly periodic: boolean;
  readonly converged: boolean;
  readonly avpdCm: number;
  readonly sPrimeCmPerSec: number;
  readonly ePrimeCmPerSec: number;
  readonly aPrimeCmPerSec: number;
  readonly aPrimeBasewardCmPerSec: number;
  readonly aPrimeApexwardCmPerSec: number;
  readonly aPrimeDominantDirection: "baseward" | "apexward" | "balanced";
  readonly aPrimeMagnitudeRatioToV1: number;
  readonly xDepthMmHg: number;
  readonly yDepthMmHg: number;
  readonly figureEight: boolean;
  readonly lobeMeasurementStatus: MechanisticAtrialProfileResultV1["lobeMeasurementStatus"];
  readonly lobeMeasurementReason: MechanisticAtrialProfileResultV1["lobeMeasurementReason"];
  readonly lobeSelfIntersectionAngleDeg: number;
  readonly lobePhaseCrossingMatchDistance01: number;
  readonly lobePhaseCrossingMatchPass: boolean;
  readonly opposedLobeOrientation: boolean;
  readonly eToA: number;
  readonly mitralPeakMeasurementValid: boolean;
  readonly aToVAreaRatio: number;
  readonly aLoopAreaMmHgMl: number;
  readonly vLoopAreaMmHgMl: number;
  readonly peakLaPressureMmHg: number;
  readonly peakVentricularActiveForceN: number;
  readonly peakAtrialActiveForceN: number;
  readonly crossingProgress01: number;
  readonly conduitBelowFraction: number;
  readonly pumpingAboveFraction: number;
  readonly events: MechanisticAtrialProfileResultV1["events"];
  readonly diastasis: AtrialAVPlaneForcePointV2;
  readonly lateDiastolicWindow: AtrialAVPlanePassiveBalanceLateDiastolicWindowAuditV2;
  readonly passFlags: AtrialAVPlanePassiveBalanceAcceptanceFlagsV2;
};

const base = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1;
const inertiaValues = [0.3, 0.4, 0.5, 0.6] as const;
const dampingValues = [8, 9, 10, 11] as const;
const stiffnessValues = [60, 70, 80] as const;
const atrialActiveStressValues = [8, 10, 12, 14, 16, 18] as const;
const passiveNeutralValues = [0] as const;

export function buildAtrialAVPlanePassiveBalanceCalibrationV2() {
  const rows: AtrialAVPlanePassiveBalanceCandidateReadbackV2[] = [];
  const baseline = runMechanisticAtrialProfileV1({
    profileId: "passive-balance-calibration-v1-baseline",
    params: base,
  });
  const baselinePrime = atrialAVPlanePrimeReadbackV2(baseline);
  for (const inertiaNSec2PerCm of inertiaValues) {
    for (const dampingNSecPerCm of dampingValues) {
      for (const stiffnessNPerCm of stiffnessValues) {
        for (const atrialActiveStressMaxKPa of atrialActiveStressValues) {
          for (const passiveNeutralPositionCm of passiveNeutralValues) {
            const candidate = {
              inertiaNSec2PerCm,
              dampingNSecPerCm,
              stiffnessNPerCm,
              passiveNeutralPositionCm,
              atrialActiveStressMaxKPa,
            };
            const result = runMechanisticAtrialProfileV1({
              profileId: "passive-balance-calibration",
              params: {
                ...base,
                laWall: { ...base.laWall, activeStressMaxKPa: atrialActiveStressMaxKPa },
                avPlane: {
                  ...base.avPlane,
                  inertiaNSec2PerCm,
                  dampingNSecPerCm,
                  stiffnessNPerCm,
                  passiveNeutralPositionCm,
                },
              },
            });
            rows.push(summarize(candidate, result, baseline, baselinePrime));
          }
        }
      }
    }
  }
  const sorted = rows.sort((a, b) => a.score - b.score);
  const jointCandidates = sorted.filter((row) => row.passFlags.jointCandidatePass);
  return {
    reportId: "atrial-av-plane-passive-balance-calibration-v2",
    searchSpace: {
      inertiaNSec2PerCm: inertiaValues,
      dampingNSecPerCm: dampingValues,
      stiffnessNPerCm: stiffnessValues,
      passiveNeutralPositionCm: passiveNeutralValues,
      atrialActiveStressMaxKPa: atrialActiveStressValues,
    },
    acceptanceDefinition: ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2,
    supportingEvidence: {
      activeForceProjectionRole: "non-blocking-model-input-comparison" as const,
      publishedVentricularModelInputBracketN: [60, 130] as const,
      publishedAtrialModelInputBracketN: [10, 25] as const,
    },
    rankingBoundary: "score orders review candidates only; it is not an acceptance gate or a fitted objective",
    testedCount: rows.length,
    jointCandidateCount: jointCandidates.length,
    jointCandidates,
    scoreFrontier: sorted.slice(0, 20),
    candidates: sorted,
    claimBoundary: {
      runtimeWiring: false,
      normalModelSelection: false,
      broadEnvelopeAcceptance: false,
      patientSpecificFit: false,
    },
  };
}

export function writeAtrialAVPlanePassiveBalanceCalibrationV2() {
  const report = buildAtrialAVPlanePassiveBalanceCalibrationV2();
  const normalized = JSON.stringify(report);
  const reportWithHash = {
    ...report,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  const __filename = fileURLToPath(import.meta.url);
  const outputPath = resolve(
    dirname(__filename),
    "../../data/mechanics2/reports/atrial-av-plane-passive-balance-calibration-v2.json",
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function summarize(
  candidate: Candidate,
  result: MechanisticAtrialProfileResultV1,
  baseline: MechanisticAtrialProfileResultV1,
  baselinePrime: ReturnType<typeof atrialAVPlanePrimeReadbackV2>,
): AtrialAVPlanePassiveBalanceCandidateReadbackV2 {
  const prime = atrialAVPlanePrimeReadbackV2(result);
  const sPrimeCmPerSec = prime.sPrimeCmPerSec;
  const ePrimeCmPerSec = prime.ePrimeCmPerSec;
  const aPrimeCmPerSec = prime.aPrimeCmPerSec;
  const diastasis = atrialAVPlaneDiastasisReadbackV2(result);
  const lateDiastolicWindow = atrialAVPlaneLateDiastolicWindowReadbackV2(result);
  const passFlags = evaluateAtrialAVPlanePassiveBalanceAcceptanceV2({
    profile: result,
    prime,
    lateDiastolicWindow,
    baselineProfile: baseline,
    baselinePrime,
  });
  const aPrimeMagnitudeRatioToV1 = aPrimeCmPerSec /
    Math.max(baselinePrime.aPrimeCmPerSec, 1e-9);
  const hardPenalty = result.allStepsConverged && result.periodicSteadyState && result.allFinite
    ? 0
    : 1e4;
  const topologyPenalty = passFlags.bloodVolumeTopologyEngineeringPass
    ? 0
    : 200;
  const mitralPenalty = result.mitralGateReadback.ageSpecificPeakEToA === "pass" ? 0 : 100;
  const forcePenalty = passFlags.mechanicsPass
    ? lateDiastolicWindow.quasiStaticResidualAbsN.max
    : 50 + lateDiastolicWindow.quasiStaticResidualAbsN.max;
  const score = hardPenalty + topologyPenalty + mitralPenalty +
    8 * Math.abs(result.avPlaneDisplacementCm - 1.3) +
    0.5 * Math.abs(sPrimeCmPerSec - 9) +
    0.35 * Math.abs(ePrimeCmPerSec - 12) +
    0.25 * Math.abs(aPrimeCmPerSec - 8) +
    2 * Math.max(0, 2 - result.xDescentDepthMmHg) +
    4 * forcePenalty;
  return {
    ...candidate,
    score: rounded(score),
    periodic: result.periodicSteadyState,
    converged: result.allStepsConverged,
    avpdCm: result.avPlaneDisplacementCm,
    sPrimeCmPerSec: rounded(sPrimeCmPerSec),
    ePrimeCmPerSec: rounded(ePrimeCmPerSec),
    aPrimeCmPerSec: rounded(aPrimeCmPerSec),
    aPrimeBasewardCmPerSec: prime.aPrimeBasewardCmPerSec,
    aPrimeApexwardCmPerSec: prime.aPrimeApexwardCmPerSec,
    aPrimeDominantDirection: prime.aPrimeDominantDirection,
    aPrimeMagnitudeRatioToV1: rounded(aPrimeMagnitudeRatioToV1),
    xDepthMmHg: result.xDescentDepthMmHg,
    yDepthMmHg: result.yDescentDepthMmHg,
    figureEight: result.figureEightCrossingInPreferredWindow,
    lobeMeasurementStatus: result.lobeMeasurementStatus,
    lobeMeasurementReason: result.lobeMeasurementReason,
    lobeSelfIntersectionAngleDeg: result.lobeSelfIntersectionAngleDeg,
    lobePhaseCrossingMatchDistance01: result.lobePhaseCrossingMatchDistance01,
    lobePhaseCrossingMatchPass: result.lobePhaseCrossingMatchPass,
    opposedLobeOrientation: result.opposedLobeOrientation,
    eToA: result.mitralPeakVelocityEToARatio,
    mitralPeakMeasurementValid: result.mitralPeakMeasurementValid,
    aToVAreaRatio: rounded(result.aLoopAreaMmHgMl / Math.max(result.vLoopAreaMmHgMl, 1e-9)),
    aLoopAreaMmHgMl: result.aLoopAreaMmHgMl,
    vLoopAreaMmHgMl: result.vLoopAreaMmHgMl,
    peakLaPressureMmHg: result.pressureRangeLaMmHg[1],
    peakVentricularActiveForceN: rounded(Math.max(...result.samples.map((sample) =>
      sample.ventricularActiveForceN
    ))),
    peakAtrialActiveForceN: rounded(Math.max(...result.samples.map((sample) =>
      sample.atrialActiveForceN
    ))),
    crossingProgress01: result.figureEightCrossingProgress01,
    conduitBelowFraction: result.conduitBeforeCrossingBelowReservoirPathFraction,
    pumpingAboveFraction: result.pumpingAfterCrossingAboveReservoirPathFraction,
    events: result.events,
    diastasis,
    lateDiastolicWindow: compactLateDiastolicWindowAudit(lateDiastolicWindow),
    passFlags,
  };
}

function compactLateDiastolicWindowAudit(
  window: AtrialAVPlaneLateDiastolicWindowReadbackV2,
): AtrialAVPlanePassiveBalanceLateDiastolicWindowAuditV2 {
  return {
    applicability: window.applicability,
    applicabilityReason: window.applicabilityReason,
    durationSec: window.durationSec,
    sampleCount: window.sampleCount,
    hydraulicMedianAbsN: window.hydraulicForceN.medianAbs,
    passiveHydraulicOpposedSampleFraction: window.passiveHydraulicOpposedSampleFraction,
    quasiStaticResidualMaxAbsN: window.quasiStaticResidualAbsN.max,
    dynamicToHydraulicForceRatioP95: window.dynamicToHydraulicForceRatio.p95,
    velocityMaxAbsCmPerSec: window.velocityAbsCmPerSec.max,
    mitralFlowFractionOfPeakMax: window.mitralFlowFractionOfPeak.max,
  };
}

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeAtrialAVPlanePassiveBalanceCalibrationV2();
  console.log(JSON.stringify({
    reportId: report.reportId,
    testedCount: report.testedCount,
    jointCandidateCount: report.jointCandidateCount,
    scoreFrontier: report.scoreFrontier,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
