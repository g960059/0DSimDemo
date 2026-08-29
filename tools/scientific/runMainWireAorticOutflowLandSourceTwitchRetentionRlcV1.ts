import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import {
  resolveMainWireArterialCompliancePhysiologyRuntimeV1,
  type MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import type {
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1,
} from "@/analysis/methods/mainWire/MainWireAorticProximalCharacteristicImpedanceDecompositionV1";
import type {
  MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_TWITCH_RETENTION_RLC_V1_ID =
  "main-wire-aortic-outflow-land-source-twitch-retention-rlc-v1" as const;

type Context = Readonly<{
  contextId: string;
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1;
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1;
  rootInertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1;
}>;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const candidateIds = Object.freeze([
  "source-twitch-retention-canonical",
  "source-twitch-retention-kws-three-quarters-peak-compensated",
] as const satisfies readonly MainWireVentricularLandSourceTwitchRetentionCandidateIdV1[]);
const kuwProfileId = "land-whole-organ-kuw-nu4" as const;
const sarcomereReferenceProfileId =
  "land-sarcomere-reference-plus-5-percent" as const;
const contexts = Object.freeze([
  context(
    "c2-zc-source-lquarter",
    "arterial-stiffness-twofold",
    "Land2017-characteristic-impedance-matched",
    "aortic-root-inertance-one-quarter",
  ),
  context(
    "c2-zc-source-lthird",
    "arterial-stiffness-twofold",
    "Land2017-characteristic-impedance-matched",
    "aortic-root-inertance-one-third",
  ),
  context(
    "c2-zc-source-ltwofifths",
    "arterial-stiffness-twofold",
    "Land2017-characteristic-impedance-matched",
    "aortic-root-inertance-two-fifths",
  ),
  context(
    "c2-r75-ltwofifths",
    "arterial-stiffness-twofold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-two-fifths",
  ),
  context(
    "c2-r100-ltwofifths",
    "arterial-stiffness-twofold",
    "all-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-two-fifths",
  ),
  context(
    "c2-zc-source-lhalf",
    "arterial-stiffness-twofold",
    "Land2017-characteristic-impedance-matched",
    "aortic-root-inertance-half",
  ),
  context(
    "c2-r75-lhalf",
    "arterial-stiffness-twofold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
  context(
    "c2-r100-lhalf",
    "arterial-stiffness-twofold",
    "all-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
  context(
    "c3-r75-lhalf",
    "arterial-stiffness-threefold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
  context(
    "c3-r100-lhalf",
    "arterial-stiffness-threefold",
    "all-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
  context(
    "c4-r75-lhalf",
    "arterial-stiffness-fourfold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
]);

const arms = candidateIds.flatMap((candidateId) => contexts.map((loadContext) => {
  const material =
    resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
      candidateId,
      sarcomereReferenceProfileId,
      kuwProfileId,
    );
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      kuwProfileId,
      loadContext.complianceProfileId,
      loadContext.placementProfileId,
      loadContext.rootInertanceProfileId,
      sarcomereReferenceProfileId,
      "land-beta1-canonical",
      candidateId,
    );
  return Object.freeze({
    candidateId,
    context: loadContext,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      loadContext.contextId,
    ),
    tangentCompliance: measureMainWireArterialTangentComplianceReadbackV1(
      run.periodicResult,
      resolveMainWireArterialCompliancePhysiologyRuntimeV1(
        loadContext.complianceProfileId,
      ).vascular,
    ),
    landTermBalance: measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
      run.periodicResult,
      material,
      run.periodicResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash,
    ),
    proximalCharacteristicImpedanceDecomposition:
      measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1(
        run.periodicResult,
        run.placementProfile,
      ),
    runnerClaim: run.claim,
  });
}));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_TWITCH_RETENTION_RLC_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateIds,
    kuwProfileId,
    sarcomereReferenceProfileId,
    contexts,
    sourceCharacteristicImpedanceContext: Object.freeze({
      characteristicImpedanceMmHgSecPerMl: 0.035,
      doi: "10.1016/j.yjmcc.2017.03.008" as const,
      exactMatchedPlacementProfileId:
        "Land2017-characteristic-impedance-matched" as const,
      preExistingValveLinearResistanceIsNotArterialImpedance: true as const,
    }),
    normalAscendingAortaGeometryContext: Object.freeze({
      bloodDensityKgPerM3: 1060,
      medianLengthM: 0.0832,
      medianDiameterM: 0.0334,
      geometryDerivedInertanceMmHgSec2PerMl: 0.0007549958362955043,
      topologyInertanceMmHgSec2PerMl: 0.002,
      geometryDerivedScaleFromTopology: 0.37749791814775213,
      doi: "10.1161/JAHA.120.020140" as const,
      exactGeometryFitClaimed: false as const,
      twoFifthsProfileIsMagnitudeBracket: true as const,
    }),
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    sourceIsometricCandidateHeldExactlyAcrossContexts: true as const,
    primaryRepositoryNumericCalciumTraceHeldExactly: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    tangentComplianceNotEquatedToClinicalTac: true as const,
    allResistancePlacementAndInertanceAxesFixedBeforeTheseClosedLoopRuns:
      true as const,
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
    arms: arms.map((arm) => ({
      candidateId: arm.candidateId,
      contextId: arm.context.contextId,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      summedMeanArterialTangentComplianceMlPerMmHg:
        arm.tangentCompliance.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg,
      pulsePressureMmHg:
        arm.cycle.maximumAorticRootPressureMmHg
        - arm.cycle.minimumAorticRootPressureMmHg,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      meanValveOnlyGradientMmHg:
        arm.proximalCharacteristicImpedanceDecomposition
          .meanValveOnlyPressureGradientMmHg,
      peakValveOnlyGradientMmHg:
        arm.proximalCharacteristicImpedanceDecomposition
          .peakValveOnlyPressureGradientMmHg,
      meanCharacteristicPressureMmHg:
        arm.proximalCharacteristicImpedanceDecomposition
          .meanProximalCharacteristicPressureMmHg,
      peakCharacteristicPressureMmHg:
        arm.proximalCharacteristicImpedanceDecomposition
          .peakProximalCharacteristicPressureMmHg,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endStrongPopulation:
        arm.landTermBalance.atAorticFlowEnd.strongPopulationS,
      terminationReason: arm.cycle.terminationReason,
    })),
  })}\n`);
}

function context(
  contextId: string,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1,
  rootInertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1,
): Context {
  return Object.freeze({
    contextId,
    complianceProfileId,
    placementProfileId,
    rootInertanceProfileId,
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
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
