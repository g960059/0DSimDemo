import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import type {
  MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_REFERENCE_RLC_REFINEMENT_V1_ID =
  "main-wire-aortic-outflow-land-reference-rlc-refinement-v1" as const;

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
const kuwProfileId = "land-whole-organ-kuw-nu4" as const;
const sarcomereReferenceProfileId =
  "land-sarcomere-reference-plus-5-percent" as const;
const contexts = Object.freeze([
  context(
    "c2-r50-lhalf",
    "arterial-stiffness-twofold",
    "half-Ao-SA-resistance-upstream-of-root-compliance",
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
    "c2-r75-lquarter",
    "arterial-stiffness-twofold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-one-quarter",
  ),
  context(
    "c2-r75-lthird",
    "arterial-stiffness-twofold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-one-third",
  ),
  context(
    "c3-r75-lhalf",
    "arterial-stiffness-threefold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
  context(
    "c4-r75-lhalf",
    "arterial-stiffness-fourfold",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "aortic-root-inertance-half",
  ),
]);

const material =
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
    sarcomereReferenceProfileId,
    kuwProfileId,
  );
const arms = contexts.map((loadContext) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      kuwProfileId,
      loadContext.complianceProfileId,
      loadContext.placementProfileId,
      loadContext.rootInertanceProfileId,
      sarcomereReferenceProfileId,
    );
  return Object.freeze({
    context: loadContext,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      loadContext.contextId,
    ),
    closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
      run.periodicResult,
    ),
    landTermBalance: measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
      run.periodicResult,
      material,
      run.periodicResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash,
    ),
    runnerClaim: run.claim,
  });
});

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_REFERENCE_RLC_REFINEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    kuwProfileId,
    sarcomereReferenceProfileId,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    contexts,
    oneFactorChangesAroundC2R75Lhalf: true as const,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    sourceLandEquationParametersHeldExactly: true as const,
    primaryRepositoryNumericCalciumTraceHeldExactly: true as const,
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
    arms: arms.map((arm) => ({
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
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endCaTrpn: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      finalTwentyMsActivePressureChangeMmHg:
        arm.closureMechanism.finalTwentyMillisecondsToThresholdEnd
          .triSegPressureChangeByComponentMmHg.active,
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
