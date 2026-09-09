import { studioCanonicalJsonStringify as canonical } from "@/domain/json/CanonicalJson";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, type ScenarioCaptureV2, type ScenarioPresetV2 } from "@/studio/contracts/v2/content";

/** The registered baseline always uses its own capture. An arbitrary loaded
 * state is never renamed baseline or linked to its admission assessment. */
export function workbenchReferencePresetsV1(input: {
  modelId: string; startup?: ScenarioCaptureV2; supplied: readonly ScenarioPresetV2[];
  baseline?: ScenarioPresetV2; loadedLabel: string; loadedDescription: string;
}): readonly ScenarioPresetV2[] {
  const presets = [...(input.baseline ? [input.baseline] : []), ...input.supplied];
  if (!input.startup || presets.some(p => p.modelId === input.modelId && canonical(p.capture.fixture) === canonical(input.startup!.fixture))) return presets;
  return [...presets, { schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, presetId: "preset/workbench-loaded-state",
    modelId: input.modelId, title: input.loadedLabel, description: input.loadedDescription, capture: input.startup }];
}
