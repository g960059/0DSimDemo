export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-research-preset-catalog-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_ID =
  "main-wire-research-presets" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION =
  "1.0.0" as const;

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1 = Object.freeze([
  "main-wire/healthy-cold",
  "main-wire/as-severe",
  "main-wire/ar-severe",
  "main-wire/ms-severe",
  "main-wire/mr-severe",
  "main-wire/ts-severe",
  "main-wire/tr-severe",
  "main-wire/ps-severe",
  "main-wire/pr-severe",
] as const);

export type MainWireScientificResearchPresetIdV1 =
  typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1[number];

export type MainWireScientificResearchPresetRefV1 = Readonly<{
  presetId: MainWireScientificResearchPresetIdV1;
  presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
}>;

type MainWireScientificHealthyColdPresetMetadataV1 = Readonly<{
  kind: "healthy-cold-research-baseline";
}>;

type MainWireScientificSevereValvePresetMetadataV1 = Readonly<{
  kind: "single-valve-severe-research-bracket";
  valve: "aortic" | "mitral" | "tricuspid" | "pulmonary";
  lesion: "stenosis" | "regurgitation";
  severityBracket: "severe";
}>;

export type MainWireScientificResearchPresetMetadataV1 = Readonly<{
  presetId: MainWireScientificResearchPresetIdV1;
  presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  displayName: string;
  physiology:
    | MainWireScientificHealthyColdPresetMetadataV1
    | MainWireScientificSevereValvePresetMetadataV1;
  claims: Readonly<{
    classification: "research-bracket-not-clinical";
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    clinicalValidationClaimed: false;
    patientSpecificFitClaimed: false;
    parameterSearchPerformed: false;
    parameterFittingPerformed: false;
  }>;
}>;

export type MainWireScientificResearchPresetCatalogV1 = Readonly<{
  schema: Readonly<{
    id: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID;
    version: 1;
  }>;
  catalog: Readonly<{
    id: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_ID;
    version: "1.0.0";
    trustClass: "built-in-research-metadata-without-official-trust";
  }>;
  entries: readonly MainWireScientificResearchPresetMetadataV1[];
}>;

const RESEARCH_NOT_CLINICAL_CLAIMS = Object.freeze({
  classification: "research-bracket-not-clinical" as const,
  officialTrustClaimed: false as const,
  clinicalDiagnosisClaimed: false as const,
  clinicalValidationClaimed: false as const,
  patientSpecificFitClaimed: false as const,
  parameterSearchPerformed: false as const,
  parameterFittingPerformed: false as const,
});

function preset(
  presetId: MainWireScientificResearchPresetIdV1,
  displayName: string,
  physiology:
    | MainWireScientificHealthyColdPresetMetadataV1
    | MainWireScientificSevereValvePresetMetadataV1,
): MainWireScientificResearchPresetMetadataV1 {
  return Object.freeze({
    presetId,
    presetVersion: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
    displayName,
    physiology: Object.freeze(physiology),
    claims: RESEARCH_NOT_CLINICAL_CLAIMS,
  });
}

/**
 * Browser-safe discovery metadata only. This module deliberately contains no
 * SimulationRelease import, resolved parameters, checkpoint, or trust anchor.
 */
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1:
  MainWireScientificResearchPresetCatalogV1 = Object.freeze({
    schema: Object.freeze({
      id: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
      version: 1 as const,
    }),
    catalog: Object.freeze({
      id: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_ID,
      version: "1.0.0" as const,
      trustClass:
        "built-in-research-metadata-without-official-trust" as const,
    }),
    entries: Object.freeze([
      preset(
        "main-wire/healthy-cold",
        "Healthy cold start (research baseline)",
        { kind: "healthy-cold-research-baseline" },
      ),
      preset(
        "main-wire/as-severe",
        "Aortic stenosis — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "aortic",
          lesion: "stenosis",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/ar-severe",
        "Aortic regurgitation — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "aortic",
          lesion: "regurgitation",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/ms-severe",
        "Mitral stenosis — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "mitral",
          lesion: "stenosis",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/mr-severe",
        "Mitral regurgitation — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "mitral",
          lesion: "regurgitation",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/ts-severe",
        "Tricuspid stenosis — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "tricuspid",
          lesion: "stenosis",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/tr-severe",
        "Tricuspid regurgitation — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "tricuspid",
          lesion: "regurgitation",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/ps-severe",
        "Pulmonary stenosis — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "pulmonary",
          lesion: "stenosis",
          severityBracket: "severe",
        },
      ),
      preset(
        "main-wire/pr-severe",
        "Pulmonary regurgitation — severe research bracket",
        {
          kind: "single-valve-severe-research-bracket",
          valve: "pulmonary",
          lesion: "regurgitation",
          severityBracket: "severe",
        },
      ),
    ]),
  });
