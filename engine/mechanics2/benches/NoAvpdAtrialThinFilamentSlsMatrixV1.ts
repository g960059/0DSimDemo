import {
  runNoAvpdFourChamberHillTriSegBenchV1,
  type NoAvpdFourChamberBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { prepareHillCeSeeSlsParamsV1 } from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_BENCH_ID_V1 =
  "no-avpd-atrial-thin-filament-sls-matrix-bench-v1" as const;

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1 =
  Object.freeze({
    protocolId:
      "no-avpd-la-thin-filament-dynamics-x-sls-cold32-hr60-dt5ms-fresh-jacobian-v2" as const,
    evidenceStatus:
      "report-only-two-by-two-interaction-screen-not-calibration-acceptance-or-winner-selection" as const,
    initialization: "independent-cold-start-each-candidate" as const,
    crossCandidateWarmStartAllowed: false as const,
    beats: 32 as const,
    dtSec: 0.005 as const,
    heartRateBpm: 60 as const,
    sampleEverySteps: 1 as const,
    sampleRetention: "last-two-complete-beats" as const,
    fixedTriSegGeneralizedForceMapping:
      "lumens-2009-representative-tension-area-work" as const,
    fixedTriSegColdInitialization: "legacy-seed" as const,
    fixedGlobalNewtonProtocol: Object.freeze({
      maxIterations: 14 as const,
      jacobianReuseMaxAcceptedSteps: 0 as const,
      jacobianPolicy:
        "fresh-finite-difference-jacobian-every-iteration" as const,
      role: "common-numerical-protocol-for-all-four-arms-not-a-morphology-factor" as const,
      rationale:
        "exact-failed-step-replay-rescued-both-lag-arms-while-iteration-cap-alone-did-not-rescue-lag25-sls8" as const,
    }),
    thinFilamentFactor: Object.freeze({
      algebraicLevel: "algebraic-equilibrium" as const,
      dynamicLevel: "one-state-normalized-lag" as const,
      dynamicTimeConstantSec: 0.025 as const,
      dynamicTimeConstantStatus:
        "initial-engineering-screening-value-not-calibrated" as const,
      landEquation48Implemented: false as const,
    }),
    slsFactor: Object.freeze({
      lowModulusPa: 4_000 as const,
      highModulusPa: 8_000 as const,
      relaxationTimeSecUnchanged: true as const,
    }),
    orbitReadinessReadback: Object.freeze({
      metric: "one-beat-normalized-full-state-max-drift" as const,
      descriptiveThresholdMaximumInclusive: 1e-3 as const,
      changesStructuralStatus: false as const,
      establishesStableLimitCycle: false as const,
    }),
    bloodVolumePvOwnership:
      "ledger-owned-la-volume-from-pulmonary-venous-minus-mitral-flow-no-hidden-geometry-volume" as const,
    eaTreatment:
      "continuous-report-only-never-an-objective-gate-or-ranking-term" as const,
    automaticWinnerSelection: false as const,
    physiologyGateApplied: false as const,
    calibrationClaimed: false as const,
    timeStepConfirmationPerformed: false as const,
  });

export type NoAvpdAtrialThinFilamentFactorV1 =
  "algebraic-equilibrium" | "one-state-normalized-lag-25ms";

export type NoAvpdAtrialSlsFactorV1 = "sls-4kpa" | "sls-8kpa";

export type NoAvpdAtrialThinFilamentSlsCandidateIdV1 =
  "ALG_SLS4" | "ALG_SLS8" | "LAG25_SLS4" | "LAG25_SLS8";

export type NoAvpdAtrialThinFilamentSlsCandidateSpecV1 = {
  readonly candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1;
  readonly label: string;
  readonly thinFilamentFactor: NoAvpdAtrialThinFilamentFactorV1;
  readonly slsFactor: NoAvpdAtrialSlsFactorV1;
  readonly thinFilamentDynamics: {
    readonly mode: "algebraic-equilibrium" | "one-state-normalized-lag";
    readonly timeConstantSec: number | null;
  };
  readonly laSlsModulusPa: 4_000 | 8_000;
};

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1: readonly NoAvpdAtrialThinFilamentSlsCandidateSpecV1[] =
  Object.freeze([
    candidate(
      "ALG_SLS4",
      "algebraic thin filament; LA SLS 4 kPa",
      "algebraic-equilibrium",
      "sls-4kpa",
    ),
    candidate(
      "ALG_SLS8",
      "algebraic thin filament; LA SLS 8 kPa",
      "algebraic-equilibrium",
      "sls-8kpa",
    ),
    candidate(
      "LAG25_SLS4",
      "one-state thin-filament lag 25 ms; LA SLS 4 kPa",
      "one-state-normalized-lag-25ms",
      "sls-4kpa",
    ),
    candidate(
      "LAG25_SLS8",
      "one-state thin-filament lag 25 ms; LA SLS 8 kPa",
      "one-state-normalized-lag-25ms",
      "sls-8kpa",
    ),
  ]);

export type NoAvpdAtrialThinFilamentSlsCandidateRunV1 = {
  readonly benchId: typeof NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_BENCH_ID_V1;
  readonly protocol: typeof NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1;
  readonly candidate: NoAvpdAtrialThinFilamentSlsCandidateSpecV1;
  readonly params: NoAvpdFourChamberHillTriSegParamsV1;
  readonly sourceReport: NoAvpdFourChamberBenchResultV1;
};

export function noAvpdAtrialThinFilamentSlsCandidateV1(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
): NoAvpdAtrialThinFilamentSlsCandidateSpecV1 {
  const found = NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1.find(
    (entry) => entry.candidateId === candidateId,
  );
  if (found == null) {
    throw new Error(`unknown LA thin-filament/SLS candidate: ${candidateId}`);
  }
  return found;
}

export function buildNoAvpdAtrialThinFilamentSlsParamsV1(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  baseline: NoAvpdFourChamberHillTriSegParamsV1 = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
): NoAvpdFourChamberHillTriSegParamsV1 {
  const spec = noAvpdAtrialThinFilamentSlsCandidateV1(candidateId);
  const source = baseline.atria.left.material;
  const {
    thinFilamentDynamics: _sourceThinFilamentDynamics,
    ...sourceActivationWithoutDynamics
  } = source.calciumTroponinActivation;
  const dynamicThinFilamentBranch =
    spec.thinFilamentDynamics.mode === "one-state-normalized-lag"
      ? {
          thinFilamentDynamics: {
            mode: "one-state-normalized-lag" as const,
            timeConstantSec: spec.thinFilamentDynamics.timeConstantSec!,
          },
        }
      : {};
  const material = prepareHillCeSeeSlsParamsV1({
    ...source,
    parameterSetId: `${source.parameterSetId}::${candidateId}`,
    calciumTroponinActivation: {
      ...sourceActivationWithoutDynamics,
      parameterSetId: `${source.calciumTroponinActivation.parameterSetId}::${candidateId}`,
      ...dynamicThinFilamentBranch,
    },
    sls: {
      ...source.sls,
      modulusPa: spec.laSlsModulusPa,
    },
  });
  return {
    ...baseline,
    triSegGeneralizedForceMapping:
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.fixedTriSegGeneralizedForceMapping,
    triSegColdInitialization:
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.fixedTriSegColdInitialization,
    solver: {
      ...baseline.solver,
      maxIterations:
        NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1
          .fixedGlobalNewtonProtocol.maxIterations,
      jacobianReuse: {
        ...baseline.solver.jacobianReuse,
        maxAcceptedSteps:
          NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1
            .fixedGlobalNewtonProtocol.jacobianReuseMaxAcceptedSteps,
      },
    },
    atria: {
      ...baseline.atria,
      left: { ...baseline.atria.left, material },
    },
  };
}

export function runNoAvpdAtrialThinFilamentSlsCandidateV1(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
): NoAvpdAtrialThinFilamentSlsCandidateRunV1 {
  const candidate = noAvpdAtrialThinFilamentSlsCandidateV1(candidateId);
  const params = buildNoAvpdAtrialThinFilamentSlsParamsV1(candidateId);
  const sourceReport = runNoAvpdFourChamberHillTriSegBenchV1({
    beats: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.beats,
    dtSec: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.dtSec,
    sampleEverySteps:
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleEverySteps,
    sampleRetention:
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleRetention,
    params,
  });
  return {
    benchId: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_BENCH_ID_V1,
    protocol: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1,
    candidate,
    params,
    sourceReport,
  };
}

function candidate(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  label: string,
  thinFilamentFactor: NoAvpdAtrialThinFilamentFactorV1,
  slsFactor: NoAvpdAtrialSlsFactorV1,
): NoAvpdAtrialThinFilamentSlsCandidateSpecV1 {
  const dynamic = thinFilamentFactor === "one-state-normalized-lag-25ms";
  return Object.freeze({
    candidateId,
    label,
    thinFilamentFactor,
    slsFactor,
    thinFilamentDynamics: Object.freeze({
      mode: dynamic ? "one-state-normalized-lag" : "algebraic-equilibrium",
      timeConstantSec: dynamic ? 0.025 : null,
    }),
    laSlsModulusPa: slsFactor === "sls-8kpa" ? 8_000 : 4_000,
  });
}
