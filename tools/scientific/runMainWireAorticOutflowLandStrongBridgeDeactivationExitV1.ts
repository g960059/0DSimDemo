import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V4 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV4";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_BRACKET_V1_ID,
  MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1,
  resolveMainWireVentricularLandStrongBridgeDeactivationExitWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandStrongBridgeDeactivationExitBracketV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_V1_ID =
  "main-wire-aortic-outflow-land-strong-bridge-deactivation-exit-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const twitchRetentionCandidateId = twitchRetentionCandidateArgument();
const profileSet = profileSetArgument();
const onlyProfileId = onlyProfileArgument();
const loadContext = loadContextArgument();
const selectedProfileIds = onlyProfileId !== null
  ? Object.freeze([
    "strong-to-blocked-deactivation-off" as const,
    ...(onlyProfileId === "strong-to-blocked-deactivation-off"
      ? []
      : [onlyProfileId]),
  ])
  : profileSet === "all"
  ? MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1
  : Object.freeze(
    MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1
      .filter((profileId) =>
        profileId === "strong-to-blocked-deactivation-off"
        || (profileSet === "compensated"
          ? profileId.endsWith("-isometric-peak-compensated")
          : profileSet === "squared"
            ? profileId.endsWith("-squared-gate")
            : profileSet === "directional"
              ? profileId.endsWith("-directional-gate")
              : profileSet === "directional-squared"
                ? profileId.endsWith("-directional-squared-gate")
                : !profileId.endsWith("-isometric-peak-compensated")
                  && !profileId.endsWith("-squared-gate")
                  && !profileId.endsWith("-directional-gate"))),
  );

const arms = Object.freeze(
  selectedProfileIds
    .map((profileId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
          { dtSec, maximumBeatCount },
          CANDIDATE.kuwProfileId,
          loadContext?.complianceProfileId ?? CANDIDATE.complianceProfileId,
          CANDIDATE.characteristicResistancePlacementProfileId,
          CANDIDATE.rootInertanceProfileId,
          CANDIDATE.sarcomereReferenceProfileId,
          CANDIDATE.calciumSensitivityLengthProfileId,
          twitchRetentionCandidateId,
          loadContext?.circulatoryLoadPointId ?? "baseline",
          loadContext?.stressedVenousVolumePointId ?? "baseline",
          loadContext?.trefForceLoadProfileId
            ?? CANDIDATE.trefForceLoadProfileId,
          CANDIDATE.sourceVelocityDistortionProfileId,
          profileId,
        );
      const material =
        resolveMainWireVentricularLandStrongBridgeDeactivationExitWallMaterialV1(
          profileId,
          CANDIDATE.sourceVelocityDistortionProfileId,
          twitchRetentionCandidateId,
          loadContext?.trefForceLoadProfileId
            ?? CANDIDATE.trefForceLoadProfileId,
          CANDIDATE.sarcomereReferenceProfileId,
          CANDIDATE.kuwProfileId,
        );
      const calciumInput = Object.freeze({
        calciumInputId: run.calciumDriveParams.parameterSetId,
        calciumInputKind:
          "primary-repository-numeric-source-trace" as const,
        cycleLengthSec: run.calciumDriveParams.cycleLengthSec,
        diastolicCalciumUM:
          run.calciumDriveParams.ventricular.diastolicCalciumUM,
        electricalToCalciumDelaySec: 0,
        sourceDoi: "10.1016/j.yjmcc.2017.03.008",
        sourceDescription: "primary-repository numeric Coppini calcium trace",
        originalNumericSourceTraceUsed: true as const,
        figureDigitizationUsed: false as const,
        smoothingApplied: false as const,
        fittingApplied: false as const,
        evaluateFreeCalciumUM: (timeSec: number) =>
          evaluateFiveWallNormalCalciumDriveV1(
            timeSec,
            run.calciumDriveParams,
          ).freeCalciumUMByWall.LVFW,
      });
      return Object.freeze({
        profile: run.strongBridgeDeactivationExitProfile,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        landParameterSetStableHash:
          material.landEquationParameters.parameterSetStableHash,
        isometric:
          measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
            calciumInput,
            { dtSec: 0.001, fixedLandStretch: 1 },
            material,
          ),
        cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          run.calciumDriveParams,
          profileId,
        ),
        diastolicFlow:
          measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
            run.periodicResult,
          ),
        landTermBalance:
          measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
            run.periodicResult,
            material,
            run.periodicResult.protocolIdentity.mechanicsProvider
              .parameterIdentityHash,
          ),
        runnerClaim: run.claim,
      });
    }),
);

const off = arms[0]!;
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileSet,
    loadContext,
    bracketId:
      MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_BRACKET_V1_ID,
    bracketClaim:
      MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_CLAIM_V1,
    profileIds: selectedProfileIds,
    fixedCandidate: Object.freeze({
      ...CANDIDATE,
      twitchRetentionCandidateId,
    }),
    independentCanonicalColdStartPerArm: true as const,
    parameterOptimizationOrFitApplied: false as const,
    TrefRecompensationApplied:
      arms.some((arm) => arm.profile.sourceIsometricPeakCompensationApplied),
  }),
  arms: Object.freeze(arms.map((arm) => Object.freeze({
    ...arm,
    relativeToOff: Object.freeze({
      isometricPeak: relative(
        arm.isometric.activeTwitch.peakKPa,
        off.isometric.activeTwitch.peakKPa,
      ),
      ejectionTime: relative(
        arm.cycle.aorticEjectionTimeProxySec,
        off.cycle.aorticEjectionTimeProxySec,
      ),
      strokeVolume: relative(
        arm.cycle.aorticForwardVolumeMl,
        off.cycle.aorticForwardVolumeMl,
      ),
      meanDopplerGradient: relative(
        arm.cycle.meanDopplerGradientMmHg,
        off.cycle.meanDopplerGradientMmHg,
      ),
      maximumPressureFallRateMagnitude: relative(
        arm.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
        off.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      ),
    }),
  }))),
  interpretationBoundary: Object.freeze({
    mechanismIsReducedOrderHypothesisNotLand2017SourceEquation: true as const,
    sourceCalciumTraceHeldExactly: true as const,
    sourceLandStateCountChanged: false as const,
    populationTransferIsConservative: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  }),
});

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    arms: report.arms.map((arm) => ({
      profileId: arm.profile.profileId,
      maximumRatePerSec: arm.profile.maximumRatePerSec,
      cooperativeGatePower: arm.profile.cooperativeGatePower,
      deactivationDirectionGate: arm.profile.deactivationDirectionGate,
      strongPopulationGate: arm.profile.strongPopulationGate,
      exitDestination: arm.profile.exitDestination,
      trefScaleFromUncompensatedBase:
        arm.profile.trefScaleFromUncompensatedBase,
      terminationReason: arm.cycle.terminationReason,
      localFlowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      isometricPeakKPa: arm.isometric.activeTwitch.peakKPa,
      isometricRelaxationTime50Ms:
        nullableMilliseconds(arm.isometric.activeTwitch.relaxationTime50Sec),
      isometricRelaxationTime95Ms:
        nullableMilliseconds(arm.isometric.activeTwitch.relaxationTime95Sec),
      ictMs: nullableMilliseconds(
        arm.cycle.leftVentricularIsovolumicContractionTimeSec,
      ),
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      ivrtMs: nullableMilliseconds(
        arm.cycle.leftVentricularIsovolumicRelaxationTimeSec,
      ),
      teiIndex: arm.cycle.leftVentricularTeiIndex,
      maximumPositiveDpDtMmHgPerSec:
        arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      maximumPressureFallRateMagnitudeMmHgPerSec:
        arm.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakVelocityMPerSec: arm.cycle.peakVenaContractaVelocityMPerSec,
      meanGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      relaxationTauMs: arm.diastolicFlow.value === null
        ? null
        : arm.diastolicFlow.value.relaxation.relaxationTauSec * 1000,
      flowEndCaTRPN: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      closureStrongPopulation:
        arm.landTermBalance.atAorticValveClosure.strongPopulationS,
      closureDeactivationRatePerSec:
        arm.landTermBalance.atAorticValveClosure
          .strongBridgeDeactivationExitRatePerSec,
      closureDeactivationPopulationFluxPerSec:
        arm.landTermBalance.atAorticValveClosure
          .strongBridgeDeactivationExitPopulationFluxPerSec,
      integratedPostEjectionDeactivationPopulation:
        arm.landTermBalance.postEjectionIsovolumicRelaxation
          .integratedStrongBridgeDeactivationExitPopulation,
      relativeToOff: arm.relativeToOff,
    })),
  })}\n`);
}

function nullableMilliseconds(valueSec: number | null): number | null {
  return valueSec === null ? null : valueSec * 1000;
}

function relative(value: number, reference: number) {
  return Object.freeze({
    absoluteDifference: value - reference,
    relativeDifference01: reference === 0
      ? null
      : (value - reference) / reference,
  });
}

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`));
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const raw = optionalArgument(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function profileSetArgument():
  | "all"
  | "uncompensated"
  | "compensated"
  | "squared"
  | "directional"
  | "directional-squared" {
  const value = optionalArgument("--profile-set") ?? "all";
  if (
    value !== "all"
    && value !== "uncompensated"
    && value !== "compensated"
    && value !== "squared"
    && value !== "directional"
    && value !== "directional-squared"
  ) {
    throw new Error(
      "--profile-set must be all, uncompensated, compensated, squared, directional, or directional-squared",
    );
  }
  return value;
}

function onlyProfileArgument():
  (typeof MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1)[number]
  | null {
  const value = optionalArgument("--profile");
  if (value === null) return null;
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1
      .find((profileId) => profileId === value);
  if (resolved === undefined) {
    throw new Error(`unsupported --profile: ${value}`);
  }
  return resolved;
}

function twitchRetentionCandidateArgument():
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1 {
  const value = optionalArgument("--twitch-candidate");
  if (value === null) return CANDIDATE.twitchRetentionCandidateId;
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1
      .find((candidateId) => candidateId === value);
  if (resolved === undefined) {
    throw new Error(`unsupported --twitch-candidate: ${value}`);
  }
  return resolved;
}

function loadContextArgument():
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1)[number]
  | null {
  const value = optionalArgument("--load-context");
  if (value === null) return null;
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .find((context) => context.contextId === value);
  if (resolved === undefined) {
    throw new Error(`unsupported --load-context: ${value}`);
  }
  return resolved;
}
