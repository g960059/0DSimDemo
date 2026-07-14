import {
  runNoAvpdFourChamberHillTriSegBenchV1,
  type NoAvpdFourChamberBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { prepareHillCeSeeSlsParamsV1 } from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";
import type { PeriodicPrescribedCalciumDriverParamsV2 } from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";

export const NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_BENCH_ID_V1 =
  "no-avpd-atrial-morphology-owner-screen-bench-v1" as const;

export const NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1 = Object.freeze(
  {
    protocolId: "no-avpd-la-morphology-owner-ofat-cold32-hr60-dt5ms-v1",
    evidenceStatus:
      "report-only-owner-localization-not-physiology-acceptance-or-calibration",
    initialization: "independent-cold-start-each-candidate",
    crossParameterWarmStartAllowed: false,
    beats: 32,
    dtSec: 0.005,
    sampleEverySteps: 1,
    sampleRetention: "last-two-complete-beats",
    orbitReadinessThreshold: Object.freeze({
      metric: "one-beat-normalized-full-state-max-drift",
      maximumInclusive: 1e-3,
      changesStructuralStatus: false,
      physiologyAcceptance: false,
    }),
    timeStepConfirmation: Object.freeze({
      screeningDtSec: 0.005,
      confirmationDtSec: 0.0025,
      eligibility: "externally-promoted-single-candidate-only",
      automaticWinnerSelection: false,
      automaticConfirmationRun: false,
      currentStatus: "not-run-no-candidate-promoted",
    }),
    comparisonPolicy: Object.freeze({
      baselineShared: true,
      oneFactorAtATime: true,
      scalarWinnerScoreApplied: false,
      physiologyThresholdsApplied: false,
      eaSeparationObjectiveApplied: false,
      eaSeparationGateApplied: false,
    }),
  } as const,
);

export type NoAvpdAtrialMorphologyOwnerCandidateIdV1 = "B" | "V1" | "A1" | "A2";

export type NoAvpdAtrialMorphologyOwnerCandidateSpecV1 = {
  readonly candidateId: NoAvpdAtrialMorphologyOwnerCandidateIdV1;
  readonly parentCandidateId: "B" | null;
  readonly family:
    | "shared-baseline"
    | "la-sls-modulus"
    | "la-calcium-decay"
    | "la-thin-filament-cooperativity";
  readonly label: string;
  readonly intervention: {
    readonly changedOwner:
      | "none"
      | "left-atrial-sls"
      | "left-atrial-prescribed-calcium"
      | "left-atrial-land-thin-filament-map";
    readonly changedLeafPath: string | null;
    readonly operation: "none" | "replace" | "multiply-all-rate-anchors";
    readonly baselineValue: number | null;
    readonly appliedValue: number | null;
    readonly scale: number | null;
    readonly unit: "Pa" | "s" | "dimensionless" | null;
    readonly rationale:
      | "shared-control"
      | "isolate-viscoelastic-reservoir-conduit-memory"
      | "isolate-atrial-active-deactivation"
      | "isolate-thin-filament-sigmoid-sharpness";
  };
};

const BASELINE_LA_SLS_MODULUS_PA = 4_000 as const;
const BASELINE_LA_CA_DECAY_HR60_SEC = 0.105 as const;
const BASELINE_LA_THIN_FILAMENT_COOPERATIVITY = 3 as const;

export const NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_CANDIDATES_V1: readonly NoAvpdAtrialMorphologyOwnerCandidateSpecV1[] =
  Object.freeze([
    Object.freeze({
      candidateId: "B",
      parentCandidateId: null,
      family: "shared-baseline",
      label: "B: shared baseline",
      intervention: Object.freeze({
        changedOwner: "none",
        changedLeafPath: null,
        operation: "none",
        baselineValue: null,
        appliedValue: null,
        scale: null,
        unit: null,
        rationale: "shared-control",
      }),
    }),
    Object.freeze({
      candidateId: "V1",
      parentCandidateId: "B",
      family: "la-sls-modulus",
      label: "V1: LA SLS modulus 4 to 8 kPa",
      intervention: Object.freeze({
        changedOwner: "left-atrial-sls",
        changedLeafPath: "atria.left.material.sls.modulusPa",
        operation: "replace",
        baselineValue: BASELINE_LA_SLS_MODULUS_PA,
        appliedValue: 8_000,
        scale: 2,
        unit: "Pa",
        rationale: "isolate-viscoelastic-reservoir-conduit-memory",
      }),
    }),
    Object.freeze({
      candidateId: "A1",
      parentCandidateId: "B",
      family: "la-calcium-decay",
      label: "A1: LA prescribed-Ca HR60 decay 105 to 90 ms",
      intervention: Object.freeze({
        changedOwner: "left-atrial-prescribed-calcium",
        changedLeafPath:
          "calciumDrivers.leftAtrium.calcium.rateTargets[*].decayHalfTimeSec",
        operation: "multiply-all-rate-anchors",
        baselineValue: BASELINE_LA_CA_DECAY_HR60_SEC,
        appliedValue: 0.09,
        scale: 0.09 / BASELINE_LA_CA_DECAY_HR60_SEC,
        unit: "s",
        rationale: "isolate-atrial-active-deactivation",
      }),
    }),
    Object.freeze({
      candidateId: "A2",
      parentCandidateId: "B",
      family: "la-thin-filament-cooperativity",
      label: "A2: LA thin-filament cooperativity 3 to 2.2",
      intervention: Object.freeze({
        changedOwner: "left-atrial-land-thin-filament-map",
        changedLeafPath:
          "atria.left.material.calciumTroponinActivation.thinFilamentCooperativity",
        operation: "replace",
        baselineValue: BASELINE_LA_THIN_FILAMENT_COOPERATIVITY,
        appliedValue: 2.2,
        scale: 2.2 / BASELINE_LA_THIN_FILAMENT_COOPERATIVITY,
        unit: "dimensionless",
        rationale: "isolate-thin-filament-sigmoid-sharpness",
      }),
    }),
  ]);

export type NoAvpdAtrialMorphologyOwnerCandidateRunV1 = {
  readonly benchId: typeof NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_BENCH_ID_V1;
  readonly protocol: typeof NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1;
  readonly candidate: NoAvpdAtrialMorphologyOwnerCandidateSpecV1;
  readonly params: NoAvpdFourChamberHillTriSegParamsV1;
  readonly sourceReport: NoAvpdFourChamberBenchResultV1;
};

export function noAvpdAtrialMorphologyOwnerCandidateV1(
  candidateId: NoAvpdAtrialMorphologyOwnerCandidateIdV1,
): NoAvpdAtrialMorphologyOwnerCandidateSpecV1 {
  const found = NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_CANDIDATES_V1.find(
    (candidate) => candidate.candidateId === candidateId,
  );
  if (found == null) {
    throw new Error(
      "Unknown atrial morphology owner candidate: " + candidateId,
    );
  }
  return found;
}

export function buildNoAvpdAtrialMorphologyOwnerParamsV1(
  candidateId: NoAvpdAtrialMorphologyOwnerCandidateIdV1,
  baseline: NoAvpdFourChamberHillTriSegParamsV1 = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
): NoAvpdFourChamberHillTriSegParamsV1 {
  noAvpdAtrialMorphologyOwnerCandidateV1(candidateId);
  if (candidateId === "B") return baseline;
  if (candidateId === "V1") {
    const material = prepareHillCeSeeSlsParamsV1({
      ...baseline.atria.left.material,
      parameterSetId:
        baseline.atria.left.material.parameterSetId + "::owner-screen-V1",
      sls: {
        ...baseline.atria.left.material.sls,
        modulusPa: 8_000,
      },
    });
    return {
      ...baseline,
      atria: {
        ...baseline.atria,
        left: { ...baseline.atria.left, material },
      },
    };
  }
  if (candidateId === "A1") {
    const scale = 0.09 / BASELINE_LA_CA_DECAY_HR60_SEC;
    return {
      ...baseline,
      calciumDrivers: {
        ...baseline.calciumDrivers,
        leftAtrium: scaledLaCalciumDecay(
          baseline.calciumDrivers.leftAtrium,
          scale,
        ),
      },
    };
  }
  const material = prepareHillCeSeeSlsParamsV1({
    ...baseline.atria.left.material,
    parameterSetId:
      baseline.atria.left.material.parameterSetId + "::owner-screen-A2",
    calciumTroponinActivation: {
      ...baseline.atria.left.material.calciumTroponinActivation,
      parameterSetId:
        baseline.atria.left.material.calciumTroponinActivation.parameterSetId +
        "::owner-screen-A2",
      thinFilamentCooperativity: 2.2,
    },
  });
  return {
    ...baseline,
    atria: {
      ...baseline.atria,
      left: { ...baseline.atria.left, material },
    },
  };
}

export function runNoAvpdAtrialMorphologyOwnerCandidateV1(
  candidateId: NoAvpdAtrialMorphologyOwnerCandidateIdV1,
): NoAvpdAtrialMorphologyOwnerCandidateRunV1 {
  const params = buildNoAvpdAtrialMorphologyOwnerParamsV1(candidateId);
  const sourceReport = runNoAvpdFourChamberHillTriSegBenchV1({
    beats: NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.beats,
    dtSec: NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.dtSec,
    sampleEverySteps:
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.sampleEverySteps,
    sampleRetention:
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.sampleRetention,
    params,
  });
  return {
    benchId: NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_BENCH_ID_V1,
    protocol: NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1,
    candidate: noAvpdAtrialMorphologyOwnerCandidateV1(candidateId),
    params,
    sourceReport,
  };
}

function scaledLaCalciumDecay(
  driver: PeriodicPrescribedCalciumDriverParamsV2,
  scale: number,
): PeriodicPrescribedCalciumDriverParamsV2 {
  return {
    ...driver,
    calcium: {
      ...driver.calcium,
      parameterSetId: driver.calcium.parameterSetId + "::owner-screen-A1",
      rateTargets: driver.calcium.rateTargets.map((target) => ({
        ...target,
        decayHalfTimeSec: target.decayHalfTimeSec * scale,
      })),
    },
  };
}
