import bundle from "./standard73/bundle.json";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

// One exact release, multiple independently qualified starting cases. Presets
// carry their own captures; selecting one never rewrites the exact identity.
export default Object.freeze({
  schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
  manifest: bundle.manifest,
  defaultFixture: bundle.baseline.capture.fixture,
});
export const CURRENT_MODEL_PRESETS_V1 = Object.freeze(
  [bundle.baseline, ...bundle.presets].map(validateScenarioPresetV2),
);
