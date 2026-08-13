import type {
  ExperimentPlacementBriefingV2,
} from "@/studio/contracts/v2/content";

export type ArticleBriefingPresentationV3 =
  | "inflow"
  | "peek"
  // Reserved for an explicit reader action; automatic layout never chooses it.
  | "fullscreen";

export type ArticleBriefingPresentationInputV3 =
  Pick<ExperimentPlacementBriefingV2, "graphs">
  & Partial<Pick<
    ExperimentPlacementBriefingV2,
    "controls" | "outputs" | "scenarioScope"
  >>;

/**
 * Chooses a mobile-first reading extent from authored Briefing complexity.
 *
 * Inflow is intentionally a small observation instrument, not a compressed
 * Workbench. The phone-height budget treats one graph as two rows and places
 * two output cells per row; anything taller or comparative opens as Peek.
 */
export function articleBriefingPresentationV3(
  briefing: ArticleBriefingPresentationInputV3,
): ArticleBriefingPresentationV3 {
  const graphCount = briefing.graphs.length;
  const controlCount = briefing.controls?.length ?? 0;
  const outputCount = briefing.outputs?.length ?? 0;
  const scenarioCount =
    briefing.scenarioScope?.visibleScenarioIds.length ?? 1;

  const estimatedPhoneRows =
    (graphCount === 0 ? 0 : 2)
    + controlCount
    + Math.ceil(outputCount / 2);
  const inflowEligible =
    graphCount <= 1
    && scenarioCount <= 3
    && controlCount <= 3
    && outputCount <= 4
    && estimatedPhoneRows <= 4;

  return inflowEligible ? "inflow" : "peek";
}
