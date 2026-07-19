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
      "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
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
    "0e4ff59d0f55485e954374ca18138ab164c3428132455a6465eb3f79d553c8aa",
    "25a42cd65cf5c401979a2da05ac4f2c6995ea897be225568fed8dc59dc5ea85f",
    "317c7d724c83d04c2d6bb0f83a6aac368c597757dbfff80900005ce6b8a3e152",
    "4c637109b4c858b4cc5755e7b0bb039bfb4dbb57fc5e1b2b156fc2f1f6e3eae1",
  ),
  "main-wire/as-severe": binding(
    "441bcf165e2cfc703fe76cf241eed627b9f1ec6ab41c317a4037e42d51737972",
    "650940869da166cd3a7e0281da2607c826bf89e1a1958e7296d552cff257a36c",
    "374d62ab8c42f28658c787be07b82f4260b01422698cc873dee5dfbcfdd952a6",
    "ab1991df87312f4f376d2743977015895764e92002dfbc4b6c16557aa7c1de69",
  ),
  "main-wire/ar-severe": binding(
    "c65d393b0f3a75a7aed713eb61c1fd9a82b334bec9a676d8b45d37c623c80e36",
    "3c8e720725c84ff806ce42079564b910b43e129793bc9a480e66081b1c8429f2",
    "53a57e8a85e398c210da55b89f55531622ccf4776af641e395817922756849dc",
    "6c408033c555a2a4f7308dd40286c47967e928eb66d05d20faa6ea6fc6ad30bc",
  ),
  "main-wire/ms-severe": binding(
    "ea2f7ecd584927bc1566bdad175ea9ae83c01bf50dbe4cc272606b48d8d9e52d",
    "b94933cabae431b6c99cbda52765ea53392cbf3f47b9a0d20f688c628d48b4b0",
    "ed1a2f505adc6969d0f56e3e5cb82f7163da5b1a5395b785f0afbc913c5dcbf9",
    "c19b322f2a8e452edc9a9bb1e05a1fb5a8faaa80e253e584df601a47474483dd",
  ),
  "main-wire/mr-severe": binding(
    "62b284e9ba3a7dae31acb69e147deb5c08daf8bfa611762773ae7cfe7d6af0e9",
    "ad8fd6100da2e3479320101f50245bf24a3f32b39cab5481c27d124c2bac054e",
    "7873d239533e61315e00c31e6793d042adc1776b333042e3754a57f05154d246",
    "31d232f6bbac8dc882a0d8a4b91f6b17e845d71c50a16b3c6b28c8c26a6a369a",
  ),
  "main-wire/ts-severe": binding(
    "7cf281a082eb307c1f34ba03d3427de9894f04c34ec6004a2520cbdf2a0da498",
    "d7cdb93fec887c02868117227b6f34f0e2d1ab79dde2b80decad7703aa5af870",
    "e19aeeac69ee97b71438d55a4abda2161d71bcc3f78501dc890ace5e801d8037",
    "7a68c2457ce452732c844aada9f36db3ac46a393197558e219ab8e4072b1e2c8",
  ),
  "main-wire/tr-severe": binding(
    "b39d6d38424b29742501e03b76e8237b6ec3b09959216342f0f8d09872d0720f",
    "d4da8529bc3592386045bac7cb236190dada9f3d9f2efd3076e57b99c39da9a8",
    "94087a4d4ee9a7abff943d1f4f24b04e44d64b73c21c3abb477cd2f6a15fff03",
    "7917aa26152df0dbb7d9f6e406bf2b4243d7bae4fd8643b21f0c8e29b1be2a07",
  ),
  "main-wire/ps-severe": binding(
    "20a9293e3f84d15e127cf2f3a0e379bebf5eb6b263b6eb4ebf66c4383219d180",
    "f3761a337b098c0a20162a341a2f30bde6d284554a80cc746bad15c4f685ca49",
    "ca6e10a72537383526e3609b14889bdec6bbb388097ffee240e2d8b50a1e1562",
    "2805b6c59176bb2234f4145077b777b51a8da8e4bbbac9d36da4571d0bde13f1",
  ),
  "main-wire/pr-severe": binding(
    "2a71189163d6d40b9d85bcfb8131cc3210361b207f4d312424e1fc1da086b58e",
    "d136567f4017f96daa78992e7aff2da4e0fb2625d4520294b6163a417d991a93",
    "83c88b577da5e559b2633c35c3196183f9d28061e146f1b2d4a67f70979dbbe6",
    "f18d13bec60e2e44f7a0d1d056212d3bb5124e22e2cdc9ecd1d3c9cf67cfd5d2",
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
