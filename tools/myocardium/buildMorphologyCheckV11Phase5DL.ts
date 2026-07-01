import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
  buildAvForwardMomentumContractReviewPhase5DIEvidence,
} from "./buildAvForwardMomentumContractReviewPhase5DI";

export const MORPHOLOGY_CHECK_V11_PHASE5DL_ID = "morphology-check-v11-phase5dl-result-v1" as const;
export const MORPHOLOGY_CHECK_V11_PHASE5DL_RESULT_PATH =
  "data/myocardium/protocols/morphology-check-v11-phase5dl-result-v1.json" as const;

type RecheckedEvidence = ReturnType<typeof buildAvForwardMomentumContractReviewPhase5DIEvidence>;
type RecheckedSummary = RecheckedEvidence["variantSummaries"][number];
type RecheckedResult = RecheckedEvidence["results"][number];

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MORPHOLOGY_CHECK_V11_PHASE5DL_ID;
  readonly phase: "5DL";
  readonly sourcePhase: "5DI";
  readonly objective:
    "apply morphology-check V1.1 hygiene to Phase 5DI raw trace review before any AV valve contract model work";
  readonly sourceRecheck: {
    readonly sourceId: typeof AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID;
    readonly downloadsIndexHtml: string;
    readonly sourceNormalizedSha256: string;
    readonly variantSummariesAfterV11Hygiene: readonly RecheckedSummary[];
    readonly projectionFailuresAfterV11Hygiene: readonly ProjectionFailureDigest[];
  };
  readonly hygieneChanges: {
    readonly pvDomeReboundIsPostPrimaryPeakOnly: true;
    readonly sparsePvDomeCoreIsFailure: true;
    readonly avInflowKinkSegmentsAreCircular: true;
    readonly directAvDelayAndPressureWaveformRemainSeparateResults: true;
  };
  readonly ownerVisualReview: {
    readonly phase5diOwnerAcceptedRawPvLoops: false;
    readonly phase5diOwnerAcceptedQtvProjection: false;
    readonly observedFailures: readonly [
      "LV/RV PV loops have visible systolic concavity or double-humped rebound",
      "QTV projection has a visible E-wave kink/C1 discontinuity and is worse than baseline",
    ];
  };
  readonly classification: {
    readonly decision:
      | "owner-visual-rejection-remains-deterministic-after-v11-hygiene"
      | "morphology-check-v11-still-too-permissive";
    readonly baselineCounts: CountsDigest;
    readonly projectionCounts: CountsDigest;
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAvBoundaryContractAdoption: true;
    readonly noForwardMomentumProjectionAdoption: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noCheckerRelaxation: true;
  };
  readonly normalizedSha256: string;
};

type CountsDigest = {
  readonly grossOk: string;
  readonly lvPvOk: string;
  readonly rvPvOk: string;
  readonly mvfOk: string;
  readonly tvfOk: string;
  readonly outputPreserved: string;
};

type ProjectionFailureDigest = {
  readonly pointId: RecheckedResult["pointId"];
  readonly failedLabels: readonly string[];
  readonly messages: readonly string[];
  readonly badges: RecheckedResult["badges"];
};

export function buildMorphologyCheckV11Phase5DLEvidence(): Evidence {
  const recheck = buildAvForwardMomentumContractReviewPhase5DIEvidence();
  const baseline = requiredSummary(recheck.variantSummaries, "pressure-flow-user0-inlet-held-release-baseline");
  const projection = requiredSummary(recheck.variantSummaries, "forward-momentum-projection-tv");
  const projectionFailures = recheck.results
    .filter((result) => result.variantId === "forward-momentum-projection-tv")
    .filter((result) => result.failedLabels.length > 0)
    .map((result) => ({
      pointId: result.pointId,
      failedLabels: result.failedLabels,
      messages: result.messages,
      badges: result.badges,
    }));
  const projectionStillRejected =
    projection.grossPassCount === 0
    || projection.lvPvOkCount < 8
    || projection.rvPvOkCount < 8
    || projection.mvfOkCount < 8
    || projection.tvfOkCount < 8;
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: MORPHOLOGY_CHECK_V11_PHASE5DL_ID,
    phase: "5DL",
    sourcePhase: "5DI",
    objective:
      "apply morphology-check V1.1 hygiene to Phase 5DI raw trace review before any AV valve contract model work",
    sourceRecheck: {
      sourceId: AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
      downloadsIndexHtml: recheck.downloadsIndexHtml,
      sourceNormalizedSha256: recheck.normalizedSha256,
      variantSummariesAfterV11Hygiene: recheck.variantSummaries,
      projectionFailuresAfterV11Hygiene: projectionFailures,
    },
    hygieneChanges: {
      pvDomeReboundIsPostPrimaryPeakOnly: true,
      sparsePvDomeCoreIsFailure: true,
      avInflowKinkSegmentsAreCircular: true,
      directAvDelayAndPressureWaveformRemainSeparateResults: true,
    },
    ownerVisualReview: {
      phase5diOwnerAcceptedRawPvLoops: false,
      phase5diOwnerAcceptedQtvProjection: false,
      observedFailures: [
        "LV/RV PV loops have visible systolic concavity or double-humped rebound",
        "QTV projection has a visible E-wave kink/C1 discontinuity and is worse than baseline",
      ],
    },
    classification: {
      decision: projectionStillRejected
        ? "owner-visual-rejection-remains-deterministic-after-v11-hygiene"
        : "morphology-check-v11-still-too-permissive",
      baselineCounts: countsDigest(baseline),
      projectionCounts: countsDigest(projection),
      notes: [
        "This phase changes checker hygiene only; it does not introduce a model candidate.",
        "Forward-momentum projection remains a component lead, not a runtime or morphology-acceptance path.",
        "The next model phase should design a stateful AV valve pressure-flow/area/momentum contract rather than tune projection, deadband, qDot, root/Zc, Tref, source stress, or LandAtrial parameters.",
      ],
    },
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noAvBoundaryContractAdoption: true,
      noForwardMomentumProjectionAdoption: true,
      noLandAtrialParameterTuningUnlock: true,
      noCheckerRelaxation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

export function writeMorphologyCheckV11Phase5DLEvidence(): Evidence {
  const evidence = buildMorphologyCheckV11Phase5DLEvidence();
  const outPath = path.resolve(process.cwd(), MORPHOLOGY_CHECK_V11_PHASE5DL_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function countsDigest(summary: RecheckedSummary): CountsDigest {
  return {
    grossOk: `${summary.grossPassCount}/8`,
    lvPvOk: `${summary.lvPvOkCount}/8`,
    rvPvOk: `${summary.rvPvOkCount}/8`,
    mvfOk: `${summary.mvfOkCount}/8`,
    tvfOk: `${summary.tvfOkCount}/8`,
    outputPreserved: `${summary.outputPreservedCount}/8`,
  };
}

function requiredSummary(summaries: readonly RecheckedSummary[], variantId: RecheckedSummary["variantId"]): RecheckedSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing variant summary: ${variantId}`);
  return summary;
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeMorphologyCheckV11Phase5DLEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    sourceDownloadsIndexHtml: evidence.sourceRecheck.downloadsIndexHtml,
  }, null, 2));
}
