import type { runMainWireStaticCaseFittingV1 } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import type { MainWireCaseFittingCoordinateIdV1 } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import type { MainWireCaseReferenceIdV1 as Reference } from "./MainWireStaticCaseDefinitionsV1";

type Outcome = Awaited<ReturnType<typeof runMainWireStaticCaseFittingV1>>;
export type MainWireCaseSearchObservationV1 = Readonly<{ metricId: string; actual: number | null; lower: number | null; upper: number | null; scale: number }>;
export type MainWireCaseSearchScoreV1 = Readonly<{
  status: string; rank: readonly (number | null)[] | null; targetsMet: boolean;
  observations: readonly MainWireCaseSearchObservationV1[]; holds: readonly string[];
}>;
type Score = MainWireCaseSearchScoreV1;
const unknown = (status: string, holds: readonly string[]): Score => ({ status, rank: null, targetsMet: false, observations: [], holds });
const coordinates = ["tbv", "systemic-resistance", "arterial-stiffness", "lv-active"] as const satisfies readonly MainWireCaseFittingCoordinateIdV1[];

/** Case-owned search policy. These are the existing reference assessments and
 * approved coordinates, not new normal ranges or a generic weighted loss. */
function asProfile(referenceId: "as-high-gradient-valve-only-v1" | "as-low-flow-reduced-ef-v1", coordinateIds: readonly MainWireCaseFittingCoordinateIdV1[]) {
  return {
    coordinateIds,
    score(result: Outcome): Score {
      if (result.status !== "saved-result-ready") return unknown(result.status, [result.message]);
      const rest = result.result.rest;
      if (rest.referenceId !== referenceId) throw new Error("Search score belongs to another case");
      if (rest.status === "unavailable") return unknown(rest.status, [rest.issue.code]);
      const a = rest.assessment, review = rest.observation.measurementReview;
      return { status: rest.status, rank: review.status === "clear" ? a.ranking : null,
        targetsMet: rest.status === "passed" && a.preferredTargetsMet,
        observations: [...a.screen, ...a.targets].map(t => ({ metricId: t.metricId, actual: t.actual, lower: t.lower, upper: t.upper, scale: t.normalizationScale })),
        holds: [...review.issues.map(i => `measurement:${i.side}:${i.code}`),
          ...a.screen.filter(s => s.status !== "passed").map(s => `screen:${s.metricId}:${s.status}`),
          ...a.targets.filter(s => s.status !== "passed").map(s => `target:${s.metricId}:${s.status}`)] };
    },
  };
}
const profiles = {
  "as-high-gradient-valve-only-v1": asProfile("as-high-gradient-valve-only-v1", ["aortic-area"]),
  "as-low-flow-reduced-ef-v1": asProfile("as-low-flow-reduced-ef-v1", ["aortic-area", "lv-active"]),
  baseline: {
    coordinateIds: coordinates,
    score(result: Outcome): Score {
      if (result.status !== "saved-result-ready") return unknown(result.status, [result.message]);
      const rest = result.result.rest;
      if (rest.referenceId !== "baseline") throw new Error("Search score belongs to another case");
      if (rest.status === "unavailable") return unknown(rest.status, [rest.issue.code]);
      const a = rest.assessment;
      const observations = a.operating.map(t => ({ metricId: t.metricId, actual: t.actual,
        lower: t.lower, upper: t.upper, scale: t.lower === null ? t.upper : t.upper - t.lower }));
      const holds = [...a.invalidOrFailedRetained, ...a.unavailable,
        ...a.operating.filter(t => t.status !== "passed").map(t => `operating:${t.metricId}:${t.status}`),
        ...(a.anatomyReviewRequired ? ["demographic-method-review-required"] : [])];
      if (a.unavailable.length || a.invalidOrFailedRetained.length || a.anatomyReviewRequired
        || a.operating.some(t => t.status === "unresolved")) return { ...unknown(rest.status, holds), observations };
      const violation = Math.max(0, ...observations.map(t => Math.max((t.lower ?? -Infinity) - t.actual!, t.actual! - t.upper, 0) / t.scale));
      return { status: rest.status, rank: [rest.status === "passed" ? 0 : 1,
        a.invalidOrFailedRetained.length + Number(a.anatomyReviewRequired), violation],
      targetsMet: rest.status === "passed", observations, holds };
    },
  },
  "hfref-chronic-dilated-v1": {
    coordinateIds: coordinates,
    score(result: Outcome): Score {
      if (result.status !== "saved-result-ready") return unknown(result.status, [result.message]);
      const rest = result.result.rest;
      if (rest.referenceId !== "hfref-chronic-dilated-v1") throw new Error("Search score belongs to another case");
      if (rest.status === "unavailable") return unknown(rest.status, [rest.issue.code]);
      const a = rest.assessment, review = rest.observation.measurementReview;
      return { status: rest.status, rank: review.status === "clear" ? a.ranking : null,
        targetsMet: rest.status === "passed" && a.preferredTargetsMet,
        observations: a.targets.map(t => ({ metricId: t.metricId, actual: t.actual, lower: t.lower, upper: t.upper, scale: t.upper - t.lower })),
        holds: [...review.issues.map(i => `measurement:${i.side}:${i.code}`),
          ...a.screen.filter(s => s.status !== "passed").map(s => `screen:${s.metricId}:${s.status}`),
          ...a.targets.filter(s => s.status !== "passed").map(s => `target:${s.metricId}:${s.status}`)] };
    },
  },
} satisfies Record<Reference, { coordinateIds: readonly MainWireCaseFittingCoordinateIdV1[]; score: (result: Outcome) => Score }>;

export function resolveMainWireCaseSearchProfileV1(referenceId: Reference): { coordinateIds: readonly MainWireCaseFittingCoordinateIdV1[]; score: (result: Outcome) => Score } {
  if (!Object.hasOwn(profiles, referenceId)) throw new Error("Unsupported case search profile");
  return profiles[referenceId];
}
export function scoreMainWireCaseFittingResultV1(result: Outcome): Score {
  if (result.status !== "saved-result-ready") return unknown(result.status, [result.message]);
  return resolveMainWireCaseSearchProfileV1(result.result.rest.referenceId).score(result);
}
