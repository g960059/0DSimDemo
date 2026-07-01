import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
  buildAvForwardMomentumContractReviewPhase5DIEvidence,
} from "./buildAvForwardMomentumContractReviewPhase5DI";

export const PV_DOME_CONCAVITY_GATE_PHASE5DJ_ID = "pv-dome-concavity-gate-phase5dj-result-v1" as const;
export const PV_DOME_CONCAVITY_GATE_PHASE5DJ_RESULT_PATH =
  "data/myocardium/protocols/pv-dome-concavity-gate-phase5dj-result-v1.json" as const;

type RecheckedEvidence = ReturnType<typeof buildAvForwardMomentumContractReviewPhase5DIEvidence>;
type RecheckedSummary = RecheckedEvidence["variantSummaries"][number];
type RecheckedResult = RecheckedEvidence["results"][number];

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof PV_DOME_CONCAVITY_GATE_PHASE5DJ_ID;
  readonly phase: "5DJ";
  readonly sourcePhase: "5DI";
  readonly objective:
    "promote owner visual PV dome rejection into deterministic systolic concavity and rebound morphology gate";
  readonly sourceRecheck: {
    readonly sourceId: typeof AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID;
    readonly downloadsIndexHtml: string;
    readonly sourceNormalizedSha256: string;
    readonly sourceDecisionAfterGateUpdate: RecheckedEvidence["classification"]["decision"];
    readonly variantSummariesAfterGateUpdate: readonly RecheckedSummary[];
    readonly projectionFailuresAfterGateUpdate: readonly ProjectionFailureDigest[];
  };
  readonly ownerVisualReview: {
    readonly phase5diOwnerAcceptedRawPvLoops: false;
    readonly observedFailure:
      "LV/RV PV loops still show visible systolic concavity or double-humped rebound despite old gross morphology pass";
    readonly ownerInterpretation:
      "old peak-count morphology gate was too permissive for education-visible PV loop quality";
  };
  readonly classification: {
    readonly decision:
      | "owner-visual-rejection-now-deterministic-fail"
      | "pv-dome-gate-still-too-permissive";
    readonly projectionLvPvOk: string;
    readonly projectionRvPvOk: string;
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

type ProjectionFailureDigest = {
  readonly pointId: RecheckedResult["pointId"];
  readonly failedLabels: readonly string[];
  readonly messages: readonly string[];
  readonly badges: RecheckedResult["badges"];
};

export function buildPvDomeConcavityGatePhase5DJEvidence(): Evidence {
  const recheck = buildAvForwardMomentumContractReviewPhase5DIEvidence();
  const projection = requiredSummary(recheck.variantSummaries, "forward-momentum-projection-tv");
  const projectionFailures = recheck.results
    .filter((result) => result.variantId === "forward-momentum-projection-tv")
    .filter((result) => result.failedLabels.some((label) => label === "LV PV loop" || label === "RV PV loop"))
    .map((result) => ({
      pointId: result.pointId,
      failedLabels: result.failedLabels,
      messages: result.messages,
      badges: result.badges,
    }));
  const allProjectionPvOk = projection.lvPvOkCount === 8 && projection.rvPvOkCount === 8;
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: PV_DOME_CONCAVITY_GATE_PHASE5DJ_ID,
    phase: "5DJ",
    sourcePhase: "5DI",
    objective:
      "promote owner visual PV dome rejection into deterministic systolic concavity and rebound morphology gate",
    sourceRecheck: {
      sourceId: AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
      downloadsIndexHtml: recheck.downloadsIndexHtml,
      sourceNormalizedSha256: recheck.normalizedSha256,
      sourceDecisionAfterGateUpdate: recheck.classification.decision,
      variantSummariesAfterGateUpdate: recheck.variantSummaries,
      projectionFailuresAfterGateUpdate: projectionFailures,
    },
    ownerVisualReview: {
      phase5diOwnerAcceptedRawPvLoops: false,
      observedFailure:
        "LV/RV PV loops still show visible systolic concavity or double-humped rebound despite old gross morphology pass",
      ownerInterpretation:
        "old peak-count morphology gate was too permissive for education-visible PV loop quality",
    },
    classification: {
      decision: allProjectionPvOk
        ? "pv-dome-gate-still-too-permissive"
        : "owner-visual-rejection-now-deterministic-fail",
      projectionLvPvOk: `${projection.lvPvOkCount}/8`,
      projectionRvPvOk: `${projection.rvPvOkCount}/8`,
      projectionGrossOk: `${projection.grossPassCount}/8`,
      notes: [
        "Phase 5DI forward-momentum projection evidence is invalidated as morphology acceptance evidence when the stricter PV dome rebound gate is applied.",
        "The new gate is still a gross normal-sinus morphology guard, not official physiology validation.",
        "Do not formalize the Phase 5DH/5DI forward-momentum surface until LV/RV PV dome shape passes this deterministic raw-trace check and owner visual review.",
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

export function writePvDomeConcavityGatePhase5DJEvidence(): Evidence {
  const evidence = buildPvDomeConcavityGatePhase5DJEvidence();
  const outPath = path.resolve(process.cwd(), PV_DOME_CONCAVITY_GATE_PHASE5DJ_RESULT_PATH);
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
  const evidence = writePvDomeConcavityGatePhase5DJEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    sourceDownloadsIndexHtml: evidence.sourceRecheck.downloadsIndexHtml,
  }, null, 2));
}
