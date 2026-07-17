import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
  type MainWireScientificResolvedSessionInputV1,
  type MainWireScientificSessionIntentV1,
  type MainWireScientificSevereValveResearchBracketIdV1,
} from "@/engine/scientific/inputs";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  type MainWireScientificResearchPresetIdV1,
  type MainWireScientificResearchPresetMetadataV1,
  type MainWireScientificResearchPresetRefV1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export type ResolvedMainWireScientificResearchPresetV1 = Readonly<{
  preset: MainWireScientificResearchPresetMetadataV1;
  releaseRef: SimulationReleaseRef;
  intent: MainWireScientificSessionIntentV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
}>;

export class MainWireScientificResearchPresetResolutionErrorV1 extends Error {
  constructor(message: string) {
    super(`main-wire research preset rejected: ${message}`);
    this.name = "MainWireScientificResearchPresetResolutionErrorV1";
  }
}

const BRACKET_BY_PRESET_ID: Readonly<Record<
  MainWireScientificResearchPresetIdV1,
  MainWireScientificSevereValveResearchBracketIdV1 | null
>> = Object.freeze({
  "main-wire/healthy-cold": null,
  "main-wire/as-severe": "AS-severe",
  "main-wire/ar-severe": "AR-severe",
  "main-wire/ms-severe": "MS-severe",
  "main-wire/mr-severe": "MR-severe",
  "main-wire/ts-severe": "TS-severe",
  "main-wire/tr-severe": "TR-severe",
  "main-wire/ps-severe": "PS-severe",
  "main-wire/pr-severe": "PR-severe",
});

/**
 * Worker boundary from browser-safe preset identity to an exact immutable
 * release-bound intent and resolved session input. Unknown or changed refs do
 * not fall back to healthy or to a newer preset version.
 */
export async function resolveMainWireScientificResearchPresetV1(
  untrustedRef: unknown,
): Promise<ResolvedMainWireScientificResearchPresetV1> {
  const ref = loadResearchPresetRef(untrustedRef);
  const preset = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.find(
    (entry) => entry.presetId === ref.presetId
      && entry.presetVersion === ref.presetVersion,
  );
  if (preset === undefined) {
    throw new MainWireScientificResearchPresetResolutionErrorV1(
      `unsupported preset ${ref.presetId}@${ref.presetVersion}`,
    );
  }

  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const intent = mainWireScientificSessionIntentV1(
    release.ref,
    BRACKET_BY_PRESET_ID[preset.presetId],
  );
  const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
    release,
    intent,
  );
  return Object.freeze({
    preset,
    releaseRef: release.ref,
    intent,
    resolvedSessionInput,
  });
}

function loadResearchPresetRef(
  value: unknown,
): MainWireScientificResearchPresetRefV1 {
  if (!isRecord(value)) {
    throw new MainWireScientificResearchPresetResolutionErrorV1(
      "preset ref must be an object",
    );
  }
  const keys = Object.keys(value).sort();
  if (
    keys.length !== 2
    || keys[0] !== "presetId"
    || keys[1] !== "presetVersion"
  ) {
    throw new MainWireScientificResearchPresetResolutionErrorV1(
      "preset ref must contain exactly presetId and presetVersion",
    );
  }
  if (
    typeof value.presetId !== "string"
    || !Object.prototype.hasOwnProperty.call(BRACKET_BY_PRESET_ID, value.presetId)
  ) {
    throw new MainWireScientificResearchPresetResolutionErrorV1(
      `unsupported preset id ${String(value.presetId)}`,
    );
  }
  if (value.presetVersion !== MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION) {
    throw new MainWireScientificResearchPresetResolutionErrorV1(
      `unsupported preset version ${String(value.presetVersion)}`,
    );
  }
  return Object.freeze({
    presetId: value.presetId as MainWireScientificResearchPresetIdV1,
    presetVersion: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
