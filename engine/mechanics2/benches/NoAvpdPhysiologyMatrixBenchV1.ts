import {
  runNoAvpdFourChamberHillTriSegBenchV1,
  type NoAvpdFourChamberBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";
import type {
  PeriodicPrescribedCalciumDriverParamsV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";

export const NO_AVPD_PHYSIOLOGY_MATRIX_BENCH_ID_V1 =
  "no-avpd-physiology-matrix-bench-v1" as const;

export const NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1 = Object.freeze({
  protocolId: "no-avpd-lv-active-relaxation-isolation-cold32-hr60-dt5ms-v1",
  evidenceStatus: "report-only-parameter-sensitivity-not-physiology-acceptance",
  phase: "lv-active-relaxation-isolation",
  initialization: "independent-cold-start-each-candidate",
  crossParameterWarmStartAllowed: false,
  beats: 32,
  dtSec: 0.005,
  sampleEverySteps: 1,
  sampleRetention: "last-two-complete-beats",
  orbitReadinessThreshold: {
    metric: "one-beat-normalized-full-state-max-drift",
    maximumInclusive: 1e-3,
    changesStructuralStatus: false,
    physiologyAcceptance: false,
  },
  fixedOwners: Object.freeze([
    "atrial activation and material",
    "Land CaTRPN kinetics",
    "Hill CE force-velocity and SEE",
    "mitral valve",
    "pulmonary and systemic circulation",
    "right-ventricular free-wall calcium",
  ]),
} as const);

export type NoAvpdPhysiologyMatrixCandidateIdV1 =
  | "lv-ca-decay-155ms-baseline"
  | "lv-ca-decay-136ms"
  | "lv-ca-decay-116ms";

export type NoAvpdPhysiologyMatrixInterventionV1 = {
  readonly path:
    "calciumDrivers.{leftFreeWall,septum}.calcium.rateTargets[*].decayHalfTimeSec";
  readonly operation: "multiply-all-rate-anchors";
  readonly baselineHr60ValueSec: 0.155;
  readonly appliedHr60ValueSec: number;
  readonly scale: number;
  readonly unit: "s";
  readonly rationale:
    "isolate-ventricular-active-deactivation-before-la-mv-or-pulmonary-retuning";
};

export type NoAvpdPhysiologyMatrixCandidateSpecV1 = {
  readonly candidateId: NoAvpdPhysiologyMatrixCandidateIdV1;
  readonly parentCandidateId: "lv-ca-decay-155ms-baseline" | null;
  readonly family: "lv-active-relaxation-calcium-decay";
  readonly label: string;
  readonly hr60DecayHalfTimeSec: number;
  readonly intervention: NoAvpdPhysiologyMatrixInterventionV1;
};

const BASELINE_HR60_DECAY_HALF_TIME_SEC = 0.155 as const;

export const NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1:
readonly NoAvpdPhysiologyMatrixCandidateSpecV1[] = Object.freeze([
  candidate("lv-ca-decay-155ms-baseline", null, "baseline 155 ms", 0.155),
  candidate("lv-ca-decay-136ms", "lv-ca-decay-155ms-baseline", "faster decay 136 ms", 0.136),
  candidate("lv-ca-decay-116ms", "lv-ca-decay-155ms-baseline", "faster decay 116 ms", 0.116),
]);

export type NoAvpdPhysiologyMatrixCandidateRunV1 = {
  readonly benchId: typeof NO_AVPD_PHYSIOLOGY_MATRIX_BENCH_ID_V1;
  readonly protocol: typeof NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1;
  readonly candidate: NoAvpdPhysiologyMatrixCandidateSpecV1;
  readonly params: NoAvpdFourChamberHillTriSegParamsV1;
  readonly sourceReport: NoAvpdFourChamberBenchResultV1;
};

export function noAvpdPhysiologyMatrixCandidateV1(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): NoAvpdPhysiologyMatrixCandidateSpecV1 {
  const found = NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.find(
    (entry) => entry.candidateId === candidateId,
  );
  if (found == null) throw new Error("Unknown physiology-matrix candidate: " + candidateId);
  return found;
}

export function buildNoAvpdPhysiologyMatrixParamsV1(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
  baseline: NoAvpdFourChamberHillTriSegParamsV1 =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
): NoAvpdFourChamberHillTriSegParamsV1 {
  const spec = noAvpdPhysiologyMatrixCandidateV1(candidateId);
  const scale = spec.intervention.scale;
  const leftFreeWall = scaledDecayDriver(
    baseline.calciumDrivers.leftFreeWall,
    scale,
    candidateId,
  );
  const septum = scaledDecayDriver(
    baseline.calciumDrivers.septum,
    scale,
    candidateId,
  );
  return {
    ...baseline,
    calciumDrivers: {
      ...baseline.calciumDrivers,
      leftFreeWall,
      septum,
    },
  };
}

export function runNoAvpdPhysiologyMatrixCandidateV1(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): NoAvpdPhysiologyMatrixCandidateRunV1 {
  const params = buildNoAvpdPhysiologyMatrixParamsV1(candidateId);
  const sourceReport = runNoAvpdFourChamberHillTriSegBenchV1({
    beats: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.beats,
    dtSec: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.dtSec,
    sampleEverySteps: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleEverySteps,
    sampleRetention: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleRetention,
    params,
  });
  return {
    benchId: NO_AVPD_PHYSIOLOGY_MATRIX_BENCH_ID_V1,
    protocol: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1,
    candidate: noAvpdPhysiologyMatrixCandidateV1(candidateId),
    params,
    sourceReport,
  };
}

function candidate(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
  parentCandidateId: "lv-ca-decay-155ms-baseline" | null,
  label: string,
  hr60DecayHalfTimeSec: number,
): NoAvpdPhysiologyMatrixCandidateSpecV1 {
  const scale = hr60DecayHalfTimeSec / BASELINE_HR60_DECAY_HALF_TIME_SEC;
  return Object.freeze({
    candidateId,
    parentCandidateId,
    family: "lv-active-relaxation-calcium-decay",
    label,
    hr60DecayHalfTimeSec,
    intervention: Object.freeze({
      path:
        "calciumDrivers.{leftFreeWall,septum}.calcium.rateTargets[*].decayHalfTimeSec",
      operation: "multiply-all-rate-anchors",
      baselineHr60ValueSec: BASELINE_HR60_DECAY_HALF_TIME_SEC,
      appliedHr60ValueSec: hr60DecayHalfTimeSec,
      scale,
      unit: "s",
      rationale:
        "isolate-ventricular-active-deactivation-before-la-mv-or-pulmonary-retuning",
    }),
  });
}

function scaledDecayDriver(
  driver: PeriodicPrescribedCalciumDriverParamsV2,
  scale: number,
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): PeriodicPrescribedCalciumDriverParamsV2 {
  return {
    ...driver,
    calcium: {
      ...driver.calcium,
      parameterSetId: driver.calcium.parameterSetId + "::" + candidateId,
      rateTargets: driver.calcium.rateTargets.map((target) => ({
        ...target,
        decayHalfTimeSec: target.decayHalfTimeSec * scale,
      })),
    },
  };
}
