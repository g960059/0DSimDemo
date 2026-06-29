import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5ACArtifact from "@/data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json";
import phase5AEArtifact from "@/data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json";

export const ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_ID =
  "arterial-root-zc-calibration-phase5af-result-v1";

export const ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";

const PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML = 133.322 / 1e-6;
const PREFERRED_SD_MULTIPLE = 1 as const;
const BROAD_SD_MULTIPLE = 2 as const;
const BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE = 2 as const;

const ZC_SOURCES = [
  {
    id: "bikia-2021-virtual-aortic-impedance",
    citation: "Bikia et al. 2021, Frontiers in Bioengineering and Biotechnology, Table 2",
    url: "https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2021.649866/full",
    reportedQuantity: "Zao aortic characteristic/input impedance",
    reportedPopulation: "3818 healthy virtual subjects",
    meanMmHgSecPerMl: 0.056,
    sdMmHgSecPerMl: 0.012,
    note: "Used as a sourced physiological calibration anchor only; it is not a clinical acceptance criterion.",
  },
] as const;

type SourceId = typeof ZC_SOURCES[number]["id"];

type SourceRange = {
  readonly id: string;
  readonly sourceId: SourceId;
  readonly sdMultiple: number;
  readonly minMmHgSecPerMl: number;
  readonly maxMmHgSecPerMl: number;
  readonly minPaSecPerM3: number;
  readonly maxPaSecPerM3: number;
};

export type ArterialRootZcCalibrationPhase5AFCandidate = {
  readonly candidateId: string;
  readonly phase5ACSource: string;
  readonly effectiveAoVInertanceMultiple: number;
  readonly effectiveAoVInertanceMmHgSec2PerMl: number;
  readonly highFrequencyBenchReadoutMmHgSecPerMl: number;
  readonly highFrequencyBenchReadoutPaSecPerM3: number;
  readonly ratioToSourceMean: number;
  readonly deltaVsSourceMeanMmHgSecPerMl: number;
  readonly preferredRangeClassification:
    | "inside-preferred-source-range"
    | "below-preferred-source-range"
    | "above-preferred-source-range";
  readonly broadRangeClassification:
    | "inside-broad-source-range"
    | "below-broad-source-range"
    | "above-broad-source-range";
  readonly candidateCalibrationStatus:
    | "below-physiological-calibration-range"
    | "preferred-physiological-calibration-candidate"
    | "broad-physiological-calibration-candidate"
    | "above-physiological-calibration-range";
};

export type ArterialRootZcCalibrationPhase5AFEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_ID;
  readonly phase: "Phase 5AF";
  readonly claimBoundary: "sourced-arterial-root-zc-calibration-diagnostic-only";
  readonly upstreamPhase5ACArtifactId: typeof phase5ACArtifact.id;
  readonly upstreamPhase5AEArtifactId: typeof phase5AEArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-zc-calibration";
  readonly protocol: {
    readonly calibrationMode: "source-range-comparison-against-phase5ac-direct-linear-bench";
    readonly sourceSelectionRule: "single-explicit-literature-anchor-no-proxy-synthesis";
    readonly preferredRangeRule: "source-mean-plus-minus-1sd";
    readonly broadRangeRule: "source-mean-plus-minus-2sd";
    readonly benchReadoutSource: "phase5ac-20hz-high-frequency-input-impedance";
    readonly phase5aeBoundaryRootEquivalentAovMultiple: typeof BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE;
  };
  readonly sources: typeof ZC_SOURCES;
  readonly sourceRanges: {
    readonly preferred: SourceRange;
    readonly broad: SourceRange;
  };
  readonly candidates: readonly ArterialRootZcCalibrationPhase5AFCandidate[];
  readonly phase5aeBoundaryRootMechanismCalibration: {
    readonly mechanismId: "phase5ae-experimental-aortic-boundary-root-inertance-v1";
    readonly equivalentPhase5ACCandidateId: string;
    readonly equivalentEffectiveAoVInertanceMultiple: typeof BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE;
    readonly phase5aeMechanismAssessment: typeof phase5AEArtifact.summary.prototypeAssessment.boundaryRootMechanism;
    readonly calibrationStatus: ArterialRootZcCalibrationPhase5AFCandidate["candidateCalibrationStatus"];
    readonly preferredRangeClassification: ArterialRootZcCalibrationPhase5AFCandidate["preferredRangeClassification"];
    readonly broadRangeClassification: ArterialRootZcCalibrationPhase5AFCandidate["broadRangeClassification"];
  };
  readonly summary: {
    readonly candidateCount: number;
    readonly sourceCount: number;
    readonly sourceMeanMmHgSecPerMl: number;
    readonly preferredRangeMmHgSecPerMl: {
      readonly min: number;
      readonly max: number;
    };
    readonly broadRangeMmHgSecPerMl: {
      readonly min: number;
      readonly max: number;
    };
    readonly currentCandidateId: string;
    readonly currentStatus: ArterialRootZcCalibrationPhase5AFCandidate["candidateCalibrationStatus"];
    readonly preferredCandidateIds: readonly string[];
    readonly broadCandidateIds: readonly string[];
    readonly phase5aeBoundaryRootEquivalentCandidateId: string;
    readonly phase5aeBoundaryRootCalibrationStatus: ArterialRootZcCalibrationPhase5AFCandidate["candidateCalibrationStatus"];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noModelCoreEquationChange: true;
    readonly noTopologyChange: true;
    readonly noStateLayoutChange: true;
    readonly noDefaultParamChange: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionRegistryIntegration: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveThresholdTuning: true;
    readonly noValveLossTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noDirectAoSAAdoption: true;
    readonly noAoVBoundaryCarrierAdoption: true;
    readonly noBoundaryRootProductionAdoption: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootZcCalibrationPhase5AFEvidence():
ArterialRootZcCalibrationPhase5AFEvidence {
  const source = ZC_SOURCES[0];
  const preferred = sourceRange(source, PREFERRED_SD_MULTIPLE, "preferred-source-range");
  const broad = sourceRange(source, BROAD_SD_MULTIPLE, "broad-source-range");
  const candidates = phase5ACArtifact.runs.map((run) => calibrateCandidate(run, source, preferred, broad));
  const current = candidates[0];
  const preferredCandidates = candidates.filter((candidate) =>
    candidate.preferredRangeClassification === "inside-preferred-source-range"
  );
  const broadCandidates = candidates.filter((candidate) =>
    candidate.broadRangeClassification === "inside-broad-source-range"
  );
  const boundaryRootEquivalent = candidates.find((candidate) =>
    candidate.effectiveAoVInertanceMultiple === BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE
  );
  if (!current || !boundaryRootEquivalent) {
    throw new Error("Phase 5AF calibration requires current and total 2x AoV/root candidates from Phase 5AC.");
  }

  const evidenceWithoutHash: Omit<ArterialRootZcCalibrationPhase5AFEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_ID,
    phase: "Phase 5AF" as const,
    claimBoundary: "sourced-arterial-root-zc-calibration-diagnostic-only" as const,
    upstreamPhase5ACArtifactId: phase5ACArtifact.id,
    upstreamPhase5AEArtifactId: phase5AEArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-zc-calibration" as const,
    protocol: {
      calibrationMode: "source-range-comparison-against-phase5ac-direct-linear-bench" as const,
      sourceSelectionRule: "single-explicit-literature-anchor-no-proxy-synthesis" as const,
      preferredRangeRule: "source-mean-plus-minus-1sd" as const,
      broadRangeRule: "source-mean-plus-minus-2sd" as const,
      benchReadoutSource: "phase5ac-20hz-high-frequency-input-impedance" as const,
      phase5aeBoundaryRootEquivalentAovMultiple: BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE,
    },
    sources: ZC_SOURCES,
    sourceRanges: { preferred, broad },
    candidates,
    phase5aeBoundaryRootMechanismCalibration: {
      mechanismId: "phase5ae-experimental-aortic-boundary-root-inertance-v1" as const,
      equivalentPhase5ACCandidateId: boundaryRootEquivalent.candidateId,
      equivalentEffectiveAoVInertanceMultiple: BOUNDARY_ROOT_EQUIVALENT_AOV_MULTIPLE,
      phase5aeMechanismAssessment: phase5AEArtifact.summary.prototypeAssessment.boundaryRootMechanism,
      calibrationStatus: boundaryRootEquivalent.candidateCalibrationStatus,
      preferredRangeClassification: boundaryRootEquivalent.preferredRangeClassification,
      broadRangeClassification: boundaryRootEquivalent.broadRangeClassification,
    },
    summary: {
      candidateCount: candidates.length,
      sourceCount: ZC_SOURCES.length,
      sourceMeanMmHgSecPerMl: source.meanMmHgSecPerMl,
      preferredRangeMmHgSecPerMl: {
        min: preferred.minMmHgSecPerMl,
        max: preferred.maxMmHgSecPerMl,
      },
      broadRangeMmHgSecPerMl: {
        min: broad.minMmHgSecPerMl,
        max: broad.maxMmHgSecPerMl,
      },
      currentCandidateId: current.candidateId,
      currentStatus: current.candidateCalibrationStatus,
      preferredCandidateIds: preferredCandidates.map((candidate) => candidate.candidateId),
      broadCandidateIds: broadCandidates.map((candidate) => candidate.candidateId),
      phase5aeBoundaryRootEquivalentCandidateId: boundaryRootEquivalent.candidateId,
      phase5aeBoundaryRootCalibrationStatus: boundaryRootEquivalent.candidateCalibrationStatus,
      currentInterpretation:
        "Phase 5AF compares the Phase 5AC direct 20Hz high-frequency impedance readouts against a sourced Zao calibration anchor. The current closure is below the broad source range, while the total 2x AoV/root candidate that corresponds to the Phase 5AE boundary/root mechanism falls inside the preferred source range. Total 3x/4x candidates are above the broad source range, so they are not the next diagnostic calibration target.",
      recommendedNext: [
        "carry only the total 2x boundary/root mechanism as the sourced-Zc-calibrated diagnostic candidate into a closed-loop valve/load timing and qDot-engagement experiment",
        "keep direct Ao_SA adoption blocked because Phase 5AE did not support direct Ao_SA-only candidates",
        "keep qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, and Land parameters fixed",
        "do not claim reflection coefficient, qDot clamp removal, official morphology acceptance, production/default adoption, or final no-alternans from this sourced calibration artifact",
      ],
      limitations: [
        "This calibration uses one explicit literature anchor and does not synthesize a population-specific clinical target.",
        "The Phase 5AC value is an isolated linearized bench readout at 20Hz under prescribed flow, not a closed-loop runtime measurement.",
        "The source comparison constrains candidate scale only; it does not validate wave reflection, valve timing, incisura morphology, or qDot clamp retirement.",
        "The Phase 5AE boundary/root mechanism remains off by default and diagnostic-only.",
      ],
    },
    boundary: {
      noModelCoreEquationChange: true,
      noTopologyChange: true,
      noStateLayoutChange: true,
      noDefaultParamChange: true,
      noRuntimeDefaultFlip: true,
      noProductionRegistryIntegration: true,
      noOfficialCaseWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noQDotTuning: true,
      noQDotClampRemoval: true,
      noValveThresholdTuning: true,
      noValveLossTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noTrefFudge: true,
      noSourceStressScaling: true,
      noDirectAoSAAdoption: true,
      noAoVBoundaryCarrierAdoption: true,
      noBoundaryRootProductionAdoption: true,
      noReflectionCoefficientClaim: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "ModelCoreEquationChange",
      "topologyChange",
      "stateLayoutChange",
      "defaultParamChange",
      "runtimeDefaultFlip",
      "productionRegistryIntegration",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "qDotTuning",
      "qDotClampRemoval",
      "valveThresholdTuning",
      "valveLossTuning",
      "afterloadTuning",
      "preloadTuning",
      "LandParameterTuning",
      "TrefFudge",
      "sourceStressScaling",
      "directAoSAAdoption",
      "AoVBoundaryCarrierAdoption",
      "boundaryRootProductionAdoption",
      "reflectionCoefficientClaim",
      "rootCauseAcceptance",
      "fixAcceptance",
      "officialMorphologyAcceptance",
      "finalNoAlternansAcceptance",
      "clinicalScientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function calibrateCandidate(
  run: typeof phase5ACArtifact.runs[number],
  source: typeof ZC_SOURCES[number],
  preferred: SourceRange,
  broad: SourceRange,
): ArterialRootZcCalibrationPhase5AFCandidate {
  const zc = run.highFrequencyImpedanceEstimateMmHgSecPerMl;
  const preferredRangeClassification = classifyPreferredRange(zc, preferred);
  const broadRangeClassification = classifyBroadRange(zc, broad);
  return {
    candidateId: run.candidateId,
    phase5ACSource: run.source,
    effectiveAoVInertanceMultiple: run.effectiveAoVInertanceMultiple,
    effectiveAoVInertanceMmHgSec2PerMl: run.effectiveAoVInertanceMmHgSec2PerMl,
    highFrequencyBenchReadoutMmHgSecPerMl: zc,
    highFrequencyBenchReadoutPaSecPerM3: run.highFrequencyImpedanceEstimatePaSecPerM3,
    ratioToSourceMean: round(zc / source.meanMmHgSecPerMl),
    deltaVsSourceMeanMmHgSecPerMl: round(zc - source.meanMmHgSecPerMl),
    preferredRangeClassification,
    broadRangeClassification,
    candidateCalibrationStatus: calibrationStatus(preferredRangeClassification, broadRangeClassification),
  };
}

function sourceRange(
  source: typeof ZC_SOURCES[number],
  sdMultiple: number,
  id: string,
): SourceRange {
  const min = Math.max(0, source.meanMmHgSecPerMl - sdMultiple * source.sdMmHgSecPerMl);
  const max = source.meanMmHgSecPerMl + sdMultiple * source.sdMmHgSecPerMl;
  return {
    id,
    sourceId: source.id,
    sdMultiple,
    minMmHgSecPerMl: round(min),
    maxMmHgSecPerMl: round(max),
    minPaSecPerM3: round(min * PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML),
    maxPaSecPerM3: round(max * PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML),
  };
}

function classifyPreferredRange(
  value: number,
  range: SourceRange,
): ArterialRootZcCalibrationPhase5AFCandidate["preferredRangeClassification"] {
  if (value < range.minMmHgSecPerMl) return "below-preferred-source-range";
  if (value > range.maxMmHgSecPerMl) return "above-preferred-source-range";
  return "inside-preferred-source-range";
}

function classifyBroadRange(
  value: number,
  range: SourceRange,
): ArterialRootZcCalibrationPhase5AFCandidate["broadRangeClassification"] {
  if (value < range.minMmHgSecPerMl) return "below-broad-source-range";
  if (value > range.maxMmHgSecPerMl) return "above-broad-source-range";
  return "inside-broad-source-range";
}

function calibrationStatus(
  preferredRangeClassification: ArterialRootZcCalibrationPhase5AFCandidate["preferredRangeClassification"],
  broadRangeClassification: ArterialRootZcCalibrationPhase5AFCandidate["broadRangeClassification"],
): ArterialRootZcCalibrationPhase5AFCandidate["candidateCalibrationStatus"] {
  if (preferredRangeClassification === "inside-preferred-source-range") {
    return "preferred-physiological-calibration-candidate";
  }
  if (broadRangeClassification === "inside-broad-source-range") {
    return "broad-physiological-calibration-candidate";
  }
  if (broadRangeClassification === "below-broad-source-range") {
    return "below-physiological-calibration-range";
  }
  return "above-physiological-calibration-range";
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function main(): void {
  const evidence = buildArterialRootZcCalibrationPhase5AFEvidence();
  const outPath = path.resolve(process.cwd(), ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `Wrote ${ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_RESULT_PATH} `
    + `preferredCandidates=${evidence.summary.preferredCandidateIds.join(",") || "none"} `
    + `boundaryRootStatus=${evidence.summary.phase5aeBoundaryRootCalibrationStatus}`,
  );
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootZcCalibrationPhase5AF.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
