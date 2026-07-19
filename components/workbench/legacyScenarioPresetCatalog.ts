import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";

import type { ScenarioPresetCatalogEntry } from "./ScenarioPane";

/** Legacy-only preset metadata, loaded lazily by the legacy Workbench menu. */
export const LEGACY_SCENARIO_PRESET_CATALOG:
readonly ScenarioPresetCatalogEntry[] = Object.entries(OFFICIAL_BASELINES).map(
  ([id, preset]) => ({
    id,
    label: preset.label.replace(/\s*\([^)]*\)\s*$/, ""),
    detail: preset.label,
  }),
);
