import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
  buildAvForwardMomentumContractReviewPhase5DIEvidence,
} from "./buildAvForwardMomentumContractReviewPhase5DI";

export const AV_INFLOW_KINK_GATE_PHASE5DK_ID = "av-inflow-kink-gate-phase5dk-result-v1" as const;
export const AV_INFLOW_KINK_GATE_PHASE5DK_RESULT_PATH =
  "data/myocardium/protocols/av-inflow-kink-gate-phase5dk-result-v1.json" as const;

type RecheckedEvidence = ReturnType<typeof buildAvForwardMomentumContractReviewPhase5DIEvidence>;
type RecheckedSummary = RecheckedEvidence["variantSummaries"][number];
type RecheckedResult = RecheckedEvidence["results"][number];

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AV_INFLOW_KINK_GATE_PHASE5DK_ID;
  readonly phase: "5DK";
  readonly sourcePhase: "5DI";
  readonly objective:
    "promote owner visual QTV projection kink rejection into deterministic AV inflow C1 morphology gate";
  readonly sourceRecheck: {
    readonly sourceId: typeof AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID;
    readonly downloadsIndexHtml: string;
    readonly sourceNormalizedSha256: string;
    readonly variantSummariesAfterGateUpdate: readonly RecheckedSummary[];
    readonly projectionFlowFailuresAfterGateUpdate: readonly FlowFailureDigest[];
  };
  readonly ownerVisualReview: {
    readonly phase5diOwnerAcceptedQtvProjection: false;
    readonly observedFailure:
      "QTV projection is visibly worse than baseline and has an E-wave kink consistent with a C1 discontinuity";
    readonly ownerInterpretation:
      "old AV inflow morphology gate was too permissive because it counted E/A peaks but did not score wave smoothness";
  };
  readonly classification: {
    readonly decision:
      | "owner-visual-flow-kink-now-deterministic-fail"
      | "av-flow-kink-gate-still-too-permissive";
    readonly baselineMvfTvfOk: { readonly mvfOk: string; readonly tvfOk: string };
    readonly projectionMvfTvfOk: { readonly mvfOk: string; readonly tvfOk: string };
    readonly projectionGrossOk: string;
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAvBoundaryContractAdoption: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noCheckerRelaxation: true;
  };
  readonly normalizedSha256: string;
};

type FlowFailureDigest = {
  readonly pointId: RecheckedResult["pointId"];
  readonly failedLabels: readonly string[];
  readonly messages: readonly string[];
  readonly badges: RecheckedResult["badges"];
};

export function buildAvInflowKinkGatePhase5DKEvidence(): Evidence {
  const recheck = buildAvForwardMomentumContractReviewPhase5DIEvidence();
  const baseline = requiredSummary(recheck.variantSummaries, "pressure-flow-user0-inlet-held-release-baseline");
  const projection = requiredSummary(recheck.variantSummaries, "forward-momentum-projection-tv");
  const projectionFlowFailures = recheck.results
    .filter((result) => result.variantId === "forward-momentum-projection-tv")
    .filter((result) => result.failedLabels.some((label) => label === "MVF" || label === "TVF"))
    .map((result) => ({
      pointId: result.pointId,
      failedLabels: result.failedLabels,
      messages: result.messages,
      badges: result.badges,
    }));
  const projectionFlowOk = projection.mvfOkCount === 8 && projection.tvfOkCount === 8;
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AV_INFLOW_KINK_GATE_PHASE5DK_ID,
    phase: "5DK",
    sourcePhase: "5DI",
    objective:
      "promote owner visual QTV projection kink rejection into deterministic AV inflow C1 morphology gate",
    sourceRecheck: {
      sourceId: AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
      downloadsIndexHtml: recheck.downloadsIndexHtml,
      sourceNormalizedSha256: recheck.normalizedSha256,
      variantSummariesAfterGateUpdate: recheck.variantSummaries,
      projectionFlowFailuresAfterGateUpdate: projectionFlowFailures,
    },
    ownerVisualReview: {
      phase5diOwnerAcceptedQtvProjection: false,
      observedFailure:
        "QTV projection is visibly worse than baseline and has an E-wave kink consistent with a C1 discontinuity",
      ownerInterpretation:
        "old AV inflow morphology gate was too permissive because it counted E/A peaks but did not score wave smoothness",
    },
    classification: {
      decision: projectionFlowOk
        ? "av-flow-kink-gate-still-too-permissive"
        : "owner-visual-flow-kink-now-deterministic-fail",
      baselineMvfTvfOk: { mvfOk: `${baseline.mvfOkCount}/8`, tvfOk: `${baseline.tvfOkCount}/8` },
      projectionMvfTvfOk: { mvfOk: `${projection.mvfOkCount}/8`, tvfOk: `${projection.tvfOkCount}/8` },
      projectionGrossOk: `${projection.grossPassCount}/8`,
      notes: [
        "Phase 5DI forward-momentum projection evidence is invalidated as AV inflow morphology evidence when the kink/C1 smoothness gate is applied.",
        "The new AV inflow gate remains a gross normal-sinus artifact guard, not official flow physiology validation.",
        "Do not formalize the Phase 5DH/5DI forward-momentum surface while QTV projection is visually and deterministically worse than baseline.",
      ],
    },
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noAvBoundaryContractAdoption: true,
      noLandAtrialParameterTuningUnlock: true,
      noCheckerRelaxation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

export function writeAvInflowKinkGatePhase5DKEvidence(): Evidence {
  const evidence = buildAvInflowKinkGatePhase5DKEvidence();
  const outPath = path.resolve(process.cwd(), AV_INFLOW_KINK_GATE_PHASE5DK_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
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
  const evidence = writeAvInflowKinkGatePhase5DKEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    sourceDownloadsIndexHtml: evidence.sourceRecheck.downloadsIndexHtml,
  }, null, 2));
}
