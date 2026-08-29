import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandTwitchTimingWallMaterialV1,
  type MainWireVentricularLandTwitchTimingCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CORRECTED_LOAD_MECHANISM_AUDIT_V1_ID =
  "main-wire-aortic-outflow-corrected-load-mechanism-audit-v1" as const;

const armSpecs = Object.freeze([
  Object.freeze({
    armId: "canonical",
    complianceProfileId: "canonical" as const,
    placementProfileId: null,
    inertanceProfileId: null,
    timingCandidateId: "canonical" as const,
  }),
  Object.freeze({
    armId: "corrected-c2-r75-lhalf",
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    inertanceProfileId: "aortic-root-inertance-half" as const,
    timingCandidateId: "canonical" as const,
  }),
  Object.freeze({
    armId: "corrected-c2-rall-lhalf",
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "all-Ao-SA-resistance-upstream-of-root-compliance" as const,
    inertanceProfileId: "aortic-root-inertance-half" as const,
    timingCandidateId: "canonical" as const,
  }),
  Object.freeze({
    armId: "corrected-c2-rall-lhalf-rw-trpn",
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "all-Ao-SA-resistance-upstream-of-root-compliance" as const,
    inertanceProfileId: "aortic-root-inertance-half" as const,
    timingCandidateId:
      "land-rw-three-quarters-trpn50-six-fifths" as const,
  }),
]);
const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = armSpecs.map((spec) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
      { dtSec, maximumBeatCount },
      spec.complianceProfileId,
      spec.placementProfileId,
      spec.timingCandidateId,
      spec.inertanceProfileId,
    );
  const material = resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
    spec.timingCandidateId as MainWireVentricularLandTwitchTimingCandidateIdV1,
  );
  const providerHash = run.periodicResult.protocolIdentity.mechanicsProvider
    .parameterIdentityHash;
  return Object.freeze({
    spec,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      spec.armId,
    ),
    loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
      run.periodicResult,
      run.calciumDriveParams,
      {
        wallMaterialParams: material,
        expectedMechanicsProviderParameterIdentityHash: providerHash,
      },
    ),
    lvfwTermBalance: measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
      run.periodicResult,
      material,
      providerHash,
    ),
  });
});
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CORRECTED_LOAD_MECHANISM_AUDIT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armSpecs,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    purpose:
      "separate-early-proximal-waveform-defect-from-residual-late-ejection-mechanics" as const,
    macroHemodynamicRecalibrationApplied: false as const,
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
    arms: arms.map((entry) => {
      const loaded = entry.loadedShortening.walls.LVFW;
      const terms = entry.lvfwTermBalance;
      return {
        armId: entry.spec.armId,
        ejectionTimeMs: entry.cycle.aorticEjectionTimeProxySec * 1000,
        accelerationTimeMs:
          entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
        peakFlowMlPerSec: entry.cycle.aorticMaximumFlowMlPerSec,
        strokeVolumeMl: entry.cycle.aorticForwardVolumeMl,
        meanGradientMmHg: entry.cycle.meanDopplerGradientMmHg,
        peakGradientMmHg: entry.cycle.peakDopplerGradientMmHg,
        maximumEjectionShorteningRatePerSec:
          loaded.strainHistory.maximumEjectionShorteningRatePerSec,
        netEjectionShortening: loaded.strainHistory.netEjectionShortening,
        loadedPeakStressKPa: loaded.recordedWholeHeart.peakActiveStressKPa,
        loadedStressAtFlowPeakKPa:
          loaded.recordedWholeHeart.activeStressAtAorticFlowPeakKPa,
        flowEndLandStretch: terms.atAorticFlowEnd.landStretch,
        flowEndLandStretchRatePerSec:
          terms.atAorticFlowEnd.landStretchRatePerSec,
        flowEndCalciumUM: terms.atAorticFlowEnd.freeCalciumUM,
        flowEndCaTRPN: terms.atAorticFlowEnd.CaTRPN,
        flowEndStrongPopulation: terms.atAorticFlowEnd.strongPopulationS,
        flowEndLengthFactorH: terms.atAorticFlowEnd.lengthFactorH,
        flowEndNetStateFraction:
          terms.atAorticFlowEnd
            .netActiveStateTermFractionOfUndistortedStrong,
        flowEndDistortionStressKPa:
          terms.atAorticFlowEnd.distortionActiveKirchhoffStressKPa,
        flowEndNetActiveStressKPa:
          terms.atAorticFlowEnd.netActiveKirchhoffStressKPa,
        meanEjectionNetStateFraction:
          terms.aorticEjectionEpisode
            .meanNetActiveStateTermFractionOfUndistortedStrong,
        minimumEjectionNetStateFraction:
          terms.aorticEjectionEpisode
            .minimumNetActiveStateTermFractionOfUndistortedStrong,
      };
    }),
  })}\n`);
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
