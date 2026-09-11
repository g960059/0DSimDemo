import bundle from "./standard73/bundle.json";
import highGradientAs from "@/data/model-presets/standard73/as-high-gradient-v1.json";
import lowFlowAs from "@/data/model-presets/standard73/as-low-flow-v1.json";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

// One exact release, multiple independently qualified starting cases. Presets
// carry their own captures; selecting one never rewrites the exact identity.
export default Object.freeze({
  schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
  manifest: bundle.manifest,
  defaultFixture: bundle.baseline.capture.fixture,
});
export const CURRENT_MODEL_PRESETS_V1 = Object.freeze(
  // Later case additions do not rewrite the exact release's admission bundle.
  [bundle.baseline, ...bundle.presets, highGradientAs, lowFlowAs].map(validateScenarioPresetV2),
);
