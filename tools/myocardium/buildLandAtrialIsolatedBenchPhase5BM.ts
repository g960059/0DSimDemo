import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5BLArtifact from "@/data/myocardium/protocols/landatrial-default-floor-phase5bl-result-v1.json";
import targetPack from "@/data/myocardium/targets/atrial-waveform-targets-v1.json";
import { LANDATRIAL_DEFAULT_FLOOR_V1_ID } from "@/engine/myocardium/landAtrialDefaultFloor";
import {
  runLandAtrialIsolatedBench,
  type AtrialIsolatedBenchResult,
  type AtrialIsolatedBenchSummary,
} from "@/engine/myocardium/atrialIsolatedBench";

export const LANDATRIAL_ISOLATED_BENCH_PHASE5BM_ID =
  "landatrial-isolated-bench-phase5bm-result-v1";
export const LANDATRIAL_ISOLATED_BENCH_PHASE5BM_RESULT_PATH =
  "data/myocardium/protocols/landatrial-isolated-bench-phase5bm-result-v1.json";

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LANDATRIAL_ISOLATED_BENCH_PHASE5BM_ID;
  readonly phase: "Phase 5BM";
  readonly claimBoundary: "landatrial-isolated-bench-diagnostic-no-physiology-acceptance";
  readonly floorId: typeof LANDATRIAL_DEFAULT_FLOOR_V1_ID;
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/landatrial-default-floor-phase5bl-result-v1.json",
    "data/myocardium/targets/atrial-waveform-targets-v1.json",
  ];
  readonly protocol: AtrialIsolatedBenchResult["protocol"] & {
    readonly prescribedVolumeSource: "phase5bk-normal-hr75-la-ra-volume-shape";
    readonly noClosedLoopValveRootPreloadCoupling: true;
    readonly noA1A2GainSweep: true;
    readonly noRuntimeDefaultChange: true;
    readonly noPermanentNpmScriptAdded: true;
  };
  readonly targetDigest: {
    readonly sourceCount: number;
    readonly leftAtriumStrainRanges: Record<"reservoir" | "conduit" | "contractile", readonly [number, number]>;
    readonly rightAtriumStrainRanges: Record<"reservoir" | "conduit" | "contractile", readonly [number, number]>;
  };
  readonly phase5BLDigest: {
    readonly status: typeof phase5BLArtifact.floorDecision.status;
    readonly hash: typeof phase5BLArtifact.normalizedSha256;
    readonly selectedCandidateId: typeof phase5BLArtifact.protocol.selectedCandidateId;
  };
  readonly bench: AtrialIsolatedBenchResult;
  readonly chamberComparisons: readonly ChamberComparison[];
  readonly summary: {
    readonly diagnosticStatus:
      | "isolated-landatrial-bench-recorded"
      | "isolated-landatrial-bench-solver-blocked";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noRuntimeDefaultChange: true;
    readonly noA1A2Selection: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noAfValidationClaim: true;
  };
  readonly normalizedSha256: string;
};

type ChamberComparison = {
  readonly chamber: "LA" | "RA";
  readonly avPlaneOn: AtrialIsolatedBenchSummary;
  readonly avPlaneOff: AtrialIsolatedBenchSummary;
  readonly deltaReservoirStrainOnMinusOff: number | null;
  readonly deltaLoopAbsAreaOnMinusOffMmHgMl: number | null;
  readonly deltaPressureMinOnMinusOffMmHg: number | null;
  readonly maxEffectiveVolumeCorrectionMl: number | null;
};

export function buildLandAtrialIsolatedBenchPhase5BMEvidence(): Evidence {
  const bench = runLandAtrialIsolatedBench();
  const chamberComparisons = (["LA", "RA"] as const).map((chamber) => comparison(chamber, bench.summaries));
  const solverBlocked = bench.summaries.some((summary) => summary.landSolveFailureCount > 0);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: LANDATRIAL_ISOLATED_BENCH_PHASE5BM_ID,
    phase: "Phase 5BM",
    claimBoundary: "landatrial-isolated-bench-diagnostic-no-physiology-acceptance",
    floorId: LANDATRIAL_DEFAULT_FLOOR_V1_ID,
    sourceEvidence: [
      "data/myocardium/protocols/landatrial-default-floor-phase5bl-result-v1.json",
      "data/myocardium/targets/atrial-waveform-targets-v1.json",
    ],
    protocol: {
      ...bench.protocol,
      prescribedVolumeSource: "phase5bk-normal-hr75-la-ra-volume-shape",
      noClosedLoopValveRootPreloadCoupling: true,
      noA1A2GainSweep: true,
      noRuntimeDefaultChange: true,
      noPermanentNpmScriptAdded: true,
    },
    targetDigest: {
      sourceCount: targetPack.sources.length,
      leftAtriumStrainRanges: {
        reservoir: asRange(targetPack.strainTargets.leftAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.leftAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.leftAtrium.contractileStrain.normalRange95Ci),
      },
      rightAtriumStrainRanges: {
        reservoir: asRange(targetPack.strainTargets.rightAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.rightAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.rightAtrium.contractileStrain.normalRange95Ci),
      },
    },
    phase5BLDigest: {
      status: phase5BLArtifact.floorDecision.status,
      hash: phase5BLArtifact.normalizedSha256,
      selectedCandidateId: phase5BLArtifact.protocol.selectedCandidateId,
    },
    bench,
    chamberComparisons,
    summary: {
      diagnosticStatus: solverBlocked
        ? "isolated-landatrial-bench-solver-blocked"
        : "isolated-landatrial-bench-recorded",
      currentInterpretation: interpretation(chamberComparisons, solverBlocked),
      recommendedNext: [
        "use this isolated bench before closed-loop LandAtrial parameter changes so valve/root/preload effects stay separated",
        "calibrate AV-plane/effective wall geometry against direct strain and pressure decomposition instead of a single closed-loop combined score",
        "extend the bench with literature-calibrated LA/RA prescribed-volume and AV-plane displacement profiles before claiming atrial physiology",
      ],
      blockers: [
        "prescribed-volume input is a normal-HR75 diagnostic waveform, not a clinical validation target",
        "this does not accept closed-loop atrial morphology, valve/load timing, AF behavior, or official cases",
      ],
    },
    boundary: {
      noAtrialPhysiologyAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noRuntimeDefaultChange: true,
      noA1A2Selection: true,
      noValveLoadTimingAcceptance: true,
      noAfValidationClaim: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function comparison(
  chamber: "LA" | "RA",
  summaries: readonly AtrialIsolatedBenchSummary[],
): ChamberComparison {
  const avPlaneOn = requiredSummary(chamber, "landatrial-floor-avplane-on", summaries);
  const avPlaneOff = requiredSummary(chamber, "landatrial-floor-avplane-off", summaries);
  return {
    chamber,
    avPlaneOn,
    avPlaneOff,
    deltaReservoirStrainOnMinusOff: delta(avPlaneOn.reservoirStrain, avPlaneOff.reservoirStrain),
    deltaLoopAbsAreaOnMinusOffMmHgMl: delta(avPlaneOn.loopAbsAreaMmHgMl, avPlaneOff.loopAbsAreaMmHgMl),
    deltaPressureMinOnMinusOffMmHg: delta(avPlaneOn.pressureMmHg.min, avPlaneOff.pressureMmHg.min),
    maxEffectiveVolumeCorrectionMl: avPlaneOn.effectiveVolumeCorrectionMl.max,
  };
}

function requiredSummary(
  chamber: "LA" | "RA",
  variant: string,
  summaries: readonly AtrialIsolatedBenchSummary[],
): AtrialIsolatedBenchSummary {
  const summary = summaries.find((entry) => entry.chamber === chamber && entry.variant === variant);
  if (!summary) throw new Error(`Missing isolated bench summary ${chamber}/${variant}.`);
  return summary;
}

function interpretation(comparisons: readonly ChamberComparison[], solverBlocked: boolean): string {
  if (solverBlocked) {
    return "At least one isolated LandAtrial provider solve failed; inspect LandAtrial source state before calibration.";
  }
  return comparisons.map((entry) =>
    `${entry.chamber}: AV-plane on-off delta reservoir strain=${entry.deltaReservoirStrainOnMinusOff}, loop abs area=${entry.deltaLoopAbsAreaOnMinusOffMmHgMl} mmHg*ml, min pressure delta=${entry.deltaPressureMinOnMinusOffMmHg} mmHg.`
  ).join(" ");
}

function asRange(value: readonly number[]): readonly [number, number] {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error("Expected finite two-value range.");
  }
  return [value[0], value[1]];
}

function delta(left: number | null, right: number | null): number | null {
  return left == null || right == null ? null : round(left - right);
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
  const evidence = buildLandAtrialIsolatedBenchPhase5BMEvidence();
  const outPath = path.resolve(process.cwd(), LANDATRIAL_ISOLATED_BENCH_PHASE5BM_RESULT_PATH);
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
    diagnosticStatus: evidence.summary.diagnosticStatus,
    chamberComparisons: evidence.chamberComparisons.map((entry) => ({
      chamber: entry.chamber,
      deltaReservoirStrainOnMinusOff: entry.deltaReservoirStrainOnMinusOff,
      deltaLoopAbsAreaOnMinusOffMmHgMl: entry.deltaLoopAbsAreaOnMinusOffMmHgMl,
      deltaPressureMinOnMinusOffMmHg: entry.deltaPressureMinOnMinusOffMmHg,
      maxEffectiveVolumeCorrectionMl: entry.maxEffectiveVolumeCorrectionMl,
      landSolveFailuresOn: entry.avPlaneOn.landSolveFailureCount,
      landSolveFailuresOff: entry.avPlaneOff.landSolveFailureCount,
    })),
  }, null, 2));
}
