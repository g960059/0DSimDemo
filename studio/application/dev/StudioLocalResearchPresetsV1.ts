import high from "@/data/model-presets/research/standard73-as-high-gradient-v1.json";
import low from "@/data/model-presets/research/standard73-as-low-flow-v1.json";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

// Research adoption: independent Astra/Fable reviews, 2026-09-11 (2 accepts;
// required 1). Only the settled captures are shipped here.
// The artifact binding prevents a future model build from silently reusing them.
export const STUDIO_LOCAL_RESEARCH_PRESET_ARTIFACT_V1 =
  "38e31e94e7b25e71d0bb99c1a7e9a27dc094985c3920d12c2fdf22afa34abce4";
const presets = Object.freeze([
  high,
  low,
].map(validateScenarioPresetV2));

export function localResearchPresetsV1(modelId: string, artifactRevisionId: string) {
  if (artifactRevisionId !== STUDIO_LOCAL_RESEARCH_PRESET_ARTIFACT_V1 || presets.some(p => p.modelId !== modelId))
    throw new Error("Research presets require revalidation against the selected exact artifact");
  return presets;
}
