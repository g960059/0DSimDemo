import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-research-preset-catalog-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_ID =
  "main-wire-research-presets" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION =
  "1.0.0" as const;

/**
 * Exact executable release shared by every V1 research bracket. Keeping this
 * small identity in browser-safe discovery metadata lets the transport reject
 * a coherent but substituted Worker release without bundling release bytes.
 */
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_RELEASE_REF_V1:
  SimulationReleaseRef = Object.freeze({
    id: "circleheart/adult-five-wall-noncoronary",
    version: "0.2.0",
    sha256:
      "aa1947dc572b94370044e97efc03e3e62b000657a2fd580be7883d2b0774e48a",
  });

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
  documentChainBinding: Readonly<{
    presetDocumentSha256: string;
    caseDocumentSha256: string;
    workspaceDocumentSha256: string;
    sessionInputSha256: string;
  }>;
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
  releaseRef: SimulationReleaseRef;
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

/**
 * Browser-safe content identities for the exact release-owned document chain.
 * These digests let the host reject a coherent but substituted Worker chain
 * without transporting Preset/Case contents or resolved parameters.
 */
const DOCUMENT_CHAIN_BINDING_BY_PRESET_ID_V1 = Object.freeze({
  "main-wire/healthy-cold": binding(
    "6c6932610f1141de6268b7e47f68d9c0f12df9247882f022605b3185a8bbbb80",
    "8f81f61427f2e9fcdc891b5374b4426b848b834be94d2822428531e30078ad34",
    "87a5b423e14c754709519b97b1fb6e09f9acc34392cdb76eb20a67d2852b3f15",
    "84bcec5ef9ca80ade7f2d2615a2fbf23fda64a427b7eb1065563b47a1f0dac4f",
  ),
  "main-wire/as-severe": binding(
    "ce9ef83766e1015cc440abb2d874b29c776177fa45ad0035fbca9d50b33605b6",
    "1e9c2a02353f0d2a3a76396a61ffb8654333df556ee0a889b0d69479673643a9",
    "13aa8ce56d20dc43267e0b84835deea062c5066cbb6de018ad375c4f1b1e1eec",
    "562a429f0e96654417a2ccc00a7236af8c142f701b472054f58ad5be0fc1dbfe",
  ),
  "main-wire/ar-severe": binding(
    "4d866470eea641154ffc38a764a5ec0e8ed09dcf0c76ebffa82c67e21981581e",
    "7d4ddaa9e2395eec083d1adff365f7dcc733e41a00639e9779a1cf94449b9a22",
    "95a1b6908f33e2ff72cdaf0204aaef52aa2c97d1b56623738933f516ac531978",
    "a41fca4a8bc44c12cf6ae195f6cfee268ec005614b000fbdd5ba8bef276d9a04",
  ),
  "main-wire/ms-severe": binding(
    "3eb819f4e382552c2bb7f6ab4aa5afea1e16b087a5abea660111c18b630647db",
    "6cae6e7f58d6faebee7ba1e20ebb84777e888b92d1358f04be09bf3cd1bb3773",
    "dbdd491b47f017a7283f89a36d270886df3847f692ab1b37defed8551f7fb37b",
    "5b8a1b5f1a7964531c4e9ba702da5c8a07878423fd0bd5af45081d04ad6f7afc",
  ),
  "main-wire/mr-severe": binding(
    "408a30321bf131250fb28f5c062177cb0b28ae9493151e7e04292f120c375e5c",
    "a4c5bd678b6095f7bc47b49d77e83e35d2f1ffebca7c7cf80941a2e6589a60ae",
    "5a521450b7d821152bd6a0ff96e47be541671c8806c326abe2a4c0e2545f8c52",
    "a2de87451593ab286b8db3b72d2757755c18662a4c3ffe30e57e263fba4b5b71",
  ),
  "main-wire/ts-severe": binding(
    "d3224368bbc4c2e67f1b2f64d751a16f7818277d3eb96f0ae4ddc16ab1b30394",
    "18e81b93f8fddbcf09b4003d018a4ccc009fa95aa3ac452eff2099e3843d8d32",
    "c97790871f2b08e52a7368018d08d51909b712bdc144293868024404204de9df",
    "8028dfe5fa80c332d9375c59d3659765a45a53fd8ebe273e5fa94ae4a4bd6ee5",
  ),
  "main-wire/tr-severe": binding(
    "f98e4bc5ef7fc1f8f731a4fb87149909d59a26f908db8f79c74c6778c1e2a6dd",
    "df9eb39ee5cdea68b7eae0db2ae2f232b10d5e8e661d8f78e57e7047a70df102",
    "fcfe79fcafc3d2bd0a9964edfbe6f2b84127812d4773435a386684922ac165e5",
    "343c3bce3b3fe073033ab1bc0f223fe846a25181b36d5df94a30b53b0cb33241",
  ),
  "main-wire/ps-severe": binding(
    "b03d6769a6e1594a01dd2054ab810aa2a5ffc9f66c11b909828b35bd8deda1ae",
    "2e978ea47751851bb209c2f2b263d4a6d59052a2a625a71423265f64a605c18f",
    "3608467f37bb8bf11f119ce6cb32f0c5a59b14c9d0bcecdefd98a0d56bd15d8b",
    "f37b8cd95324eaae1b441eccd0d7d2e33bc3c0bee777dc1b5d3c869bd4ba8561",
  ),
  "main-wire/pr-severe": binding(
    "48e83cc0a67e06200bd3a1f050866fe7897b2d66150cc18f22c79ccc39e09fe5",
    "a2192fa0a2b9d64315f9f014b905992b563643307f63d57fc781144aa16a370f",
    "2cd46acb2123bad84e789b65ea83359fa37c59c83aeec212cfa8d50fcc602d33",
    "69bc4ab6f28eced5c38939ac16d5c1dd2d01d2fec68b56d0ed02d403266b7253",
  ),
} satisfies Readonly<Record<
  MainWireScientificResearchPresetIdV1,
  MainWireScientificResearchPresetMetadataV1["documentChainBinding"]
>>);

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
    documentChainBinding:
      DOCUMENT_CHAIN_BINDING_BY_PRESET_ID_V1[presetId],
    claims: RESEARCH_NOT_CLINICAL_CLAIMS,
  });
}

function binding(
  presetDocumentSha256: string,
  caseDocumentSha256: string,
  workspaceDocumentSha256: string,
  sessionInputSha256: string,
): MainWireScientificResearchPresetMetadataV1["documentChainBinding"] {
  return Object.freeze({
    presetDocumentSha256,
    caseDocumentSha256,
    workspaceDocumentSha256,
    sessionInputSha256,
  });
}

/**
 * Browser-safe discovery and integrity metadata only. This module contains
 * exact release/document/input identities, but no SimulationRelease payload,
 * resolved parameters, checkpoint, or official designation. Integrity binding
 * does not confer official or clinical trust on these research brackets.
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
    releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_RELEASE_REF_V1,
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
