import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5BCArtifact from "@/data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json";
import phase5BDArtifact from "@/data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json";
import phase5BKArtifact from "@/data/myocardium/protocols/landatrial-runtime-candidate-phase5bk-result-v1.json";
import {
  LANDATRIAL_DEFAULT_FLOOR_CLAIM_BOUNDARY,
  LANDATRIAL_DEFAULT_FLOOR_DASHBOARD_AXES,
  LANDATRIAL_DEFAULT_FLOOR_NOT_ACCEPTED_CLAIMS,
  LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_ID,
  LANDATRIAL_DEFAULT_FLOOR_POINT_IDS,
  LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID,
  LANDATRIAL_DEFAULT_FLOOR_V1_CONTRACT,
  LANDATRIAL_DEFAULT_FLOOR_V1_ID,
} from "@/engine/myocardium/landAtrialDefaultFloor";

export const LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_PATH =
  "data/myocardium/protocols/landatrial-default-floor-phase5bl-result-v1.json";

type CandidateSummary = (typeof phase5BKArtifact.candidateSummaries)[number];
type Run = (typeof phase5BKArtifact.runs)[number];

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_ID;
  readonly phase: "Phase 5BL";
  readonly floorId: typeof LANDATRIAL_DEFAULT_FLOOR_V1_ID;
  readonly claimBoundary: typeof LANDATRIAL_DEFAULT_FLOOR_CLAIM_BOUNDARY;
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/landatrial-runtime-candidate-phase5bk-result-v1.json",
    "data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json",
    "data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json",
    "data/myocardium/targets/atrial-waveform-targets-v1.json",
  ];
  readonly floorContract: typeof LANDATRIAL_DEFAULT_FLOOR_V1_CONTRACT;
  readonly protocol: {
    readonly measurementReuse: "phase5bk-closed-loop-runs-reused-no-new-closed-loop-measurement";
    readonly selectedCandidateId: typeof LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID;
    readonly pointIds: typeof LANDATRIAL_DEFAULT_FLOOR_POINT_IDS;
    readonly dashboardAxes: typeof LANDATRIAL_DEFAULT_FLOOR_DASHBOARD_AXES;
    readonly noA1A2GainSweep: true;
    readonly noNewValveSmoothing: true;
    readonly noRootZcRetuning: true;
    readonly noQDotTuning: true;
    readonly noTrefOrSourceStressScaling: true;
    readonly noOfficialCaseTuning: true;
    readonly noPermanentNpmScriptAdded: true;
  };
  readonly selectedSummary: CandidateSummary;
  readonly comparisonDeltas: {
    readonly versusCurrentLandAtrialGeometry: CandidateDelta | null;
    readonly versusRuntimeActiveStressAtria: CandidateDelta | null;
  };
  readonly dashboard: {
    readonly healthOutput: {
      readonly measuredPoints: number;
      readonly healthOkPoints: number;
      readonly outputPreservedPoints: number;
      readonly settleFailedPoints: readonly string[];
      readonly runtimeErrorPoints: readonly string[];
      readonly totalLandSolveFailureCount: number;
      readonly floorPass: boolean;
    };
    readonly rawMorphology: {
      readonly laRawReadablePoints: readonly string[];
      readonly raRawReadablePoints: readonly string[];
      readonly bothAtriaRawReadablePoints: readonly string[];
      readonly opposingLobesNotRequiredForFloor: true;
      readonly officialMorphologyAccepted: false;
    };
    readonly volumeFunction: {
      readonly bothAtriaBroadPassPoints: readonly string[];
      readonly meanLaVolumeDistance: number | null;
      readonly meanRaVolumeDistance: number | null;
      readonly broadPassShortfall: number;
    };
    readonly pressureTiming: {
      readonly laRelationSignalPoints: readonly string[];
      readonly raRelationSignalPoints: readonly string[];
      readonly relationShortfall: number;
    };
    readonly avPlaneWallGeometry: {
      readonly source: "phase5bk-direct-wall-lambda-and-av-plane-readbacks";
      readonly maxLaEffectiveVolumeCorrectionMl: number | null;
      readonly maxRaEffectiveVolumeCorrectionMl: number | null;
      readonly maxLaAvPlaneDescent01: number | null;
      readonly maxRaAvPlaneDescent01: number | null;
      readonly maxLaLambdaDeltaWithoutMinusWithAvPlane: number | null;
      readonly maxRaLambdaDeltaWithoutMinusWithAvPlane: number | null;
      readonly directVelocityReadbacksAddedInPhase5BL: true;
    };
    readonly directWallStrain: {
      readonly bothAtriaDirectWallStrainPassPoints: readonly string[];
      readonly meanLaDirectWallStrainDistance: number | null;
      readonly meanRaDirectWallStrainDistance: number | null;
      readonly interpretation: string;
    };
    readonly valveMeasurementHygiene: {
      readonly phase5bcStatus: string | null;
      readonly phase5bdStatus: string | null;
      readonly requirements: readonly string[];
      readonly valveLoadTimingAccepted: false;
    };
  };
  readonly floorDecision: {
    readonly status: "fixed-user0-landatrial-default-floor";
    readonly rationale: readonly string[];
    readonly nextCalibrationWork: readonly string[];
  };
  readonly boundary: {
    readonly notAcceptedClaims: typeof LANDATRIAL_DEFAULT_FLOOR_NOT_ACCEPTED_CLAIMS;
    readonly a1A2Frozen: true;
    readonly defaultFloorNotPhysiologyAcceptance: true;
    readonly useAsFutureComparisonBaseline: true;
  };
  readonly normalizedSha256: string;
};

type CandidateDelta = {
  readonly candidateId: string;
  readonly deltaMeanCombinedTargetDistance: number | null;
  readonly deltaBothAtriaVolumePassCount: number;
  readonly deltaBothAtriaRawReadableCount: number;
  readonly deltaLaPressureRelationCount: number;
  readonly deltaRaPressureRelationCount: number;
};

export function buildLandAtrialDefaultFloorPhase5BLEvidence(): Evidence {
  const selected = summaryFor(LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID);
  const selectedRuns = phase5BKArtifact.runs.filter((run) =>
    run.candidateId === LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_ID,
    phase: "Phase 5BL",
    floorId: LANDATRIAL_DEFAULT_FLOOR_V1_ID,
    claimBoundary: LANDATRIAL_DEFAULT_FLOOR_CLAIM_BOUNDARY,
    sourceEvidence: [
      "data/myocardium/protocols/landatrial-runtime-candidate-phase5bk-result-v1.json",
      "data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json",
      "data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json",
      "data/myocardium/targets/atrial-waveform-targets-v1.json",
    ],
    floorContract: LANDATRIAL_DEFAULT_FLOOR_V1_CONTRACT,
    protocol: {
      measurementReuse: "phase5bk-closed-loop-runs-reused-no-new-closed-loop-measurement",
      selectedCandidateId: LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID,
      pointIds: LANDATRIAL_DEFAULT_FLOOR_POINT_IDS,
      dashboardAxes: LANDATRIAL_DEFAULT_FLOOR_DASHBOARD_AXES,
      noA1A2GainSweep: true,
      noNewValveSmoothing: true,
      noRootZcRetuning: true,
      noQDotTuning: true,
      noTrefOrSourceStressScaling: true,
      noOfficialCaseTuning: true,
      noPermanentNpmScriptAdded: true,
    },
    selectedSummary: selected,
    comparisonDeltas: {
      versusCurrentLandAtrialGeometry: deltaFrom(selected, summaryFor("landatrial-shadow-current-geometry")),
      versusRuntimeActiveStressAtria: deltaFrom(selected, summaryFor("runtime-default-atrial-active-reference")),
    },
    dashboard: {
      healthOutput: {
        measuredPoints: selected.measuredPointIds.length,
        healthOkPoints: selected.healthOkPointIds.length,
        outputPreservedPoints: selected.outputPreservedPointIds.length,
        settleFailedPoints: selected.settleFailedPointIds,
        runtimeErrorPoints: selected.runtimeErrorPointIds,
        totalLandSolveFailureCount: selected.totalLandSolveFailureCount,
        floorPass: selected.measuredPointIds.length === LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length
          && selected.healthOkPointIds.length === LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length
          && selected.outputPreservedPointIds.length === LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length
          && selected.settleFailedPointIds.length === 0
          && selected.runtimeErrorPointIds.length === 0
          && selected.totalLandSolveFailureCount === 0,
      },
      rawMorphology: {
        laRawReadablePoints: selected.laRawReadablePointIds,
        raRawReadablePoints: selected.raRawReadablePointIds,
        bothAtriaRawReadablePoints: selected.bothAtriaRawReadablePointIds,
        opposingLobesNotRequiredForFloor: true,
        officialMorphologyAccepted: false,
      },
      volumeFunction: {
        bothAtriaBroadPassPoints: selected.bothAtriaVolumeFunctionPassPointIds,
        meanLaVolumeDistance: selected.meanLaVolumeDistance,
        meanRaVolumeDistance: selected.meanRaVolumeDistance,
        broadPassShortfall:
          LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length - selected.bothAtriaVolumeFunctionPassPointIds.length,
      },
      pressureTiming: {
        laRelationSignalPoints: selected.laPressureRelationSignalPointIds,
        raRelationSignalPoints: selected.raPressureRelationSignalPointIds,
        relationShortfall: (LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length - selected.laPressureRelationSignalPointIds.length)
          + (LANDATRIAL_DEFAULT_FLOOR_POINT_IDS.length - selected.raPressureRelationSignalPointIds.length),
      },
      avPlaneWallGeometry: avPlaneWallGeometry(selectedRuns),
      directWallStrain: {
        bothAtriaDirectWallStrainPassPoints: selected.bothAtriaDirectWallStrainPassPointIds,
        meanLaDirectWallStrainDistance: selected.meanLaDirectWallStrainDistance,
        meanRaDirectWallStrainDistance: selected.meanRaDirectWallStrainDistance,
        interpretation:
          "Direct wall-lambda strain remains the main calibration gap: the runtime floor is stable, but no HR75/90 preload point broad-passes both atria on sourced strain ranges.",
      },
      valveMeasurementHygiene: {
        phase5bcStatus: phase5BCArtifact.valveLimiterAttribution?.status ?? null,
        phase5bdStatus: phase5BDArtifact.summary?.diagnosticStatus ?? null,
        requirements: [
          "raw and cleaned/interpolated atrial loops must remain separate evidence views",
          "do not score morphology acceptance from a trace cleanup that rewrites a large fraction of samples",
          "readability gains must be evaluated only on health-ok settled accepted points",
          "reverse-flow sign must not be flipped by a smoothing diagnostic",
          "diode/readability improvements without a real valve/load timing candidate remain measurement-confounder evidence",
        ],
        valveLoadTimingAccepted: false,
      },
    },
    floorDecision: {
      status: "fixed-user0-landatrial-default-floor",
      rationale: [
        "Phase 5BK selected LA22/RA26 as the lowest combined-distance LandAtrial candidate while preserving health/output over the HR75/90 preload envelope.",
        "The floor is all-chamber Land plus sourced root/Zc and keeps legacy active-stress as rollback/reference.",
        "A1/A2 have completed their bridge role and remain diagnostic comparators, not forward tuning targets.",
      ],
      nextCalibrationWork: [
        "calibrate direct wall strain and AV-plane/effective geometry against the multi-objective dashboard rather than a single combined distance",
        "add an isolated atrial prescribed-volume/AV-plane bench before deeper parameter tuning",
        "keep valve diode contamination as a measurement hygiene constraint until a real valve/load timing candidate exists",
      ],
    },
    boundary: {
      notAcceptedClaims: LANDATRIAL_DEFAULT_FLOOR_NOT_ACCEPTED_CLAIMS,
      a1A2Frozen: true,
      defaultFloorNotPhysiologyAcceptance: true,
      useAsFutureComparisonBaseline: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function summaryFor(candidateId: string): CandidateSummary {
  const summary = phase5BKArtifact.candidateSummaries.find((entry) => entry.candidateId === candidateId);
  if (!summary) {
    throw new Error(`Phase 5BK candidate summary not found: ${candidateId}`);
  }
  return summary;
}

function deltaFrom(selected: CandidateSummary, baseline: CandidateSummary): CandidateDelta {
  return {
    candidateId: baseline.candidateId,
    deltaMeanCombinedTargetDistance:
      selected.meanCombinedTargetDistance != null && baseline.meanCombinedTargetDistance != null
        ? round(selected.meanCombinedTargetDistance - baseline.meanCombinedTargetDistance)
        : null,
    deltaBothAtriaVolumePassCount:
      selected.bothAtriaVolumeFunctionPassPointIds.length - baseline.bothAtriaVolumeFunctionPassPointIds.length,
    deltaBothAtriaRawReadableCount:
      selected.bothAtriaRawReadablePointIds.length - baseline.bothAtriaRawReadablePointIds.length,
    deltaLaPressureRelationCount:
      selected.laPressureRelationSignalPointIds.length - baseline.laPressureRelationSignalPointIds.length,
    deltaRaPressureRelationCount:
      selected.raPressureRelationSignalPointIds.length - baseline.raPressureRelationSignalPointIds.length,
  };
}

function avPlaneWallGeometry(runs: readonly Run[]): Evidence["dashboard"]["avPlaneWallGeometry"] {
  return {
    source: "phase5bk-direct-wall-lambda-and-av-plane-readbacks",
    maxLaEffectiveVolumeCorrectionMl: maxFrom(runs, (run) =>
      run.LA?.directWallStrain.avPlaneSensitivity.effectiveVolumeCorrectionMl.max),
    maxRaEffectiveVolumeCorrectionMl: maxFrom(runs, (run) =>
      run.RA?.directWallStrain.avPlaneSensitivity.effectiveVolumeCorrectionMl.max),
    maxLaAvPlaneDescent01: maxFrom(runs, (run) =>
      run.LA?.directWallStrain.avPlaneSensitivity.avPlaneDescent01.max),
    maxRaAvPlaneDescent01: maxFrom(runs, (run) =>
      run.RA?.directWallStrain.avPlaneSensitivity.avPlaneDescent01.max),
    maxLaLambdaDeltaWithoutMinusWithAvPlane: maxFrom(runs, (run) =>
      run.LA?.directWallStrain.avPlaneSensitivity.maxLambdaDeltaWithoutMinusWithAvPlane),
    maxRaLambdaDeltaWithoutMinusWithAvPlane: maxFrom(runs, (run) =>
      run.RA?.directWallStrain.avPlaneSensitivity.maxLambdaDeltaWithoutMinusWithAvPlane),
    directVelocityReadbacksAddedInPhase5BL: true,
  };
}

function maxFrom<T>(items: readonly T[], selector: (item: T) => number | null | undefined): number | null {
  const finite = items.map(selector).filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForHash(entry)]),
  );
}

function writeEvidence(): Evidence {
  const evidence = buildLandAtrialDefaultFloorPhase5BLEvidence();
  const outPath = path.resolve(process.cwd(), LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    floorId: evidence.floorId,
    selectedCandidateId: evidence.protocol.selectedCandidateId,
    healthOutput: evidence.dashboard.healthOutput,
    volumeFunction: evidence.dashboard.volumeFunction,
    rawMorphology: evidence.dashboard.rawMorphology,
    directWallStrain: evidence.dashboard.directWallStrain,
  }, null, 2));
}
