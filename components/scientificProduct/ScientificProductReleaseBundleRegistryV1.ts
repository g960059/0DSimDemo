import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  type ScientificProductCaseV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1,
  SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1,
  SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1,
  SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1,
} from "@/components/scientificProduct/ScientificWorkbenchMetricPresentationV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls";
import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1,
} from "@/engine/scientific/metrics";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
} from "@/engine/scientific/presets";
import {
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION,
  MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1,
} from "@/engine/scientific/assembly";
import {
  loadSimulationReleaseRefV1,
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_REGISTRY_V1_ID =
  "circleheart-scientific-product-release-bundle-registry-v1" as const;

export const SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_V1_SCHEMA_ID =
  "circleheart-scientific-product-release-bundle-v1" as const;

export type ScientificProductCatalogRefV1 = Readonly<{
  id: string;
  version: string;
}>;

export type ScientificProductSha256CatalogRefV1 = Readonly<
  ScientificProductCatalogRefV1 & {
    digestSemantics: "sha256-canonical-json-catalog-slot";
    sha256: string;
  }
>;

/**
 * Catalog slots are deliberately generic. A future release can supply new
 * case, control, observable, and UI catalog shapes without making persisted
 * data from an older release flow through today's module-level constants.
 */
export type ScientificProductReleaseCatalogsV1<
  TCaseCatalog,
  TControlCatalog,
  TObservableCatalog,
  TUiCatalog,
> = Readonly<{
  cases: TCaseCatalog;
  controls: TControlCatalog;
  observables: TObservableCatalog;
  ui: TUiCatalog;
}>;

export type ScientificProductReleaseCatalogRefsV1 = Readonly<{
  cases: ScientificProductSha256CatalogRefV1;
  controls: ScientificProductSha256CatalogRefV1;
  observables: ScientificProductSha256CatalogRefV1;
  ui: ScientificProductSha256CatalogRefV1;
}>;

export type ScientificProductReleaseBundleV1<
  TCaseCatalog = unknown,
  TControlCatalog = unknown,
  TObservableCatalog = unknown,
  TUiCatalog = unknown,
> = Readonly<{
  schemaId: typeof SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_V1_SCHEMA_ID;
  releaseRef: SimulationReleaseRef;
  availability: ScientificProductReleaseAvailabilityV1;
  catalogRefs: ScientificProductReleaseCatalogRefsV1;
  catalogs: ScientificProductReleaseCatalogsV1<
    TCaseCatalog,
    TControlCatalog,
    TObservableCatalog,
    TUiCatalog
  >;
}>;

export type ScientificProductReleaseAvailabilityV1 = Readonly<{
  channel: "stable-product" | "experimental-preview";
  displayName: string;
  defaultForNewRuns: boolean;
  frontendSelectable: boolean;
  clinicalValidationClaimed: false;
  notice: string;
}>;

export type CurrentScientificProductCaseCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  entries: readonly ScientificProductCaseV1[];
  routeAliases: typeof SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1;
  researchPresetCatalog:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1;
}>;

export type CurrentScientificProductControlCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID;
  controlIds: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0;
  valueDomains:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0;
  baselineValues:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0;
}>;

export type CurrentScientificProductObservableCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  observableRegistry:
    typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1;
  derivedMetricRegistry:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1;
}>;

export type CurrentScientificProductUiCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  metricPresentations:
    typeof SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1;
  defaultMetricSets: Readonly<{
    overview: typeof SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1;
    pump: typeof SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1;
    valve: typeof SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1;
  }>;
}>;

export type CurrentScientificProductReleaseBundleV1 =
  ScientificProductReleaseBundleV1<
    CurrentScientificProductCaseCatalogV1,
    CurrentScientificProductControlCatalogV1,
    CurrentScientificProductObservableCatalogV1,
    CurrentScientificProductUiCatalogV1
  > & Readonly<{
    availability: ScientificProductReleaseAvailabilityV1 & Readonly<{
      channel: "stable-product";
      defaultForNewRuns: true;
    }>;
  }>;

export type IntegratedPreviewScientificProductCaseCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  entries: readonly Readonly<{
    caseId: "integrated/normal-sinus-p1";
    displayName: "Integrated normal-sinus P1 seed";
    initialization: "exact-integrated-v3-checkpoint";
    numericalPeriod1Established: true;
    physiologicalAcceptanceEstablished: false;
  }>[];
}>;

export type IntegratedPreviewScientificProductControlCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  controls: readonly Readonly<{
    controlId: "mechanical-support.preview-preset";
    kind: "discrete-restart-required";
    options:
      typeof MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.supportedMechanicalSupportInputs;
  }>[];
  fixedRhythm: Readonly<{
    presetId: "composed-regular-sinus-60-v1";
    heartRateBpm: 60;
  }>;
}>;

export type IntegratedPreviewScientificProductObservableCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  observableIds: readonly [
    "hemodynamics.pressure.absolute.Ao",
    "hemodynamics.pressure.absolute.LV",
    "hemodynamics.pressure.absolute.PA",
    "hemodynamics.volume.LV",
    "valve.MV.flow",
    "valve.AoV.flow",
    "valve.TV.flow",
    "valve.PV.flow",
    "coronary.flow.total",
    "coronary.flow.LAD.subendocardial",
    "device.LVAD.flow",
    "rhythm.capture.atrial",
    "rhythm.capture.ventricular",
    "calcium.free.LA",
    "calcium.free.LVFW",
    "calcium.free.RVFW",
    "conservation.total_blood_volume.error"
  ];
}>;

export type IntegratedPreviewScientificProductUiCatalogV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  graphRecipes: readonly [
    "pressure-waveforms",
    "lv-pressure-volume-loop",
    "valve-flow-waveforms",
    "coronary-flow-waveforms",
    "dynamic-mcs-flow-waveforms",
    "event-owned-calcium-waveforms"
  ];
  surface: "thin-current-frontend-adapter-reusable-by-cell-document-studio";
}>;

export type IntegratedPreviewScientificProductReleaseBundleV1 =
  ScientificProductReleaseBundleV1<
    IntegratedPreviewScientificProductCaseCatalogV1,
    IntegratedPreviewScientificProductControlCatalogV1,
    IntegratedPreviewScientificProductObservableCatalogV1,
    IntegratedPreviewScientificProductUiCatalogV1
  > & Readonly<{
    availability: ScientificProductReleaseAvailabilityV1 & Readonly<{
      channel: "experimental-preview";
      defaultForNewRuns: false;
    }>;
  }>;

export type AllowlistedScientificProductReleaseBundleV1 =
  | CurrentScientificProductReleaseBundleV1
  | IntegratedPreviewScientificProductReleaseBundleV1;

export function isCurrentScientificProductReleaseBundleV1(
  bundle: AllowlistedScientificProductReleaseBundleV1,
): bundle is CurrentScientificProductReleaseBundleV1 {
  return bundle.availability.channel === "stable-product";
}

export function isIntegratedPreviewScientificProductReleaseBundleV1(
  bundle: AllowlistedScientificProductReleaseBundleV1,
): bundle is IntegratedPreviewScientificProductReleaseBundleV1 {
  return bundle.availability.channel === "experimental-preview";
}

export class ScientificProductReleaseBundleResolutionErrorV1 extends Error {
  constructor(message: string) {
    super(`scientific product release bundle rejected: ${message}`);
    this.name = "ScientificProductReleaseBundleResolutionErrorV1";
  }
}

const CASE_CATALOG_REF_V1 = Object.freeze({
  id: "scientific-product-case-catalog-v1",
  version: "1.0.0",
  digestSemantics: "sha256-canonical-json-catalog-slot" as const,
  sha256: "281377cd26b7fbda9089daf3f33ecf1c102b296a010e07b3192456a7536b0f69",
}) satisfies ScientificProductSha256CatalogRefV1;

const CONTROL_CATALOG_REF_V1 = Object.freeze({
  id: "scientific-product-control-catalog-snapshot-v1",
  version: "1.0.0",
  digestSemantics: "sha256-canonical-json-catalog-slot" as const,
  sha256: "2968129ce5d9deb13210e0203522245d9b4270a6447dfb6af6a9ee8684c56c75",
}) satisfies ScientificProductSha256CatalogRefV1;

const OBSERVABLE_CATALOG_REF_V1 = Object.freeze({
  id: "scientific-product-observable-catalog-snapshot-v1",
  version: "1.0.0",
  digestSemantics: "sha256-canonical-json-catalog-slot" as const,
  sha256: "6579ec6ff903874cea2c6f47d97862265dea663b2d4046790434f9f9df12f597",
}) satisfies ScientificProductSha256CatalogRefV1;

const UI_CATALOG_REF_V1 = Object.freeze({
  id: "scientific-workbench-ui-catalog-v1",
  version: "1.0.0",
  digestSemantics: "sha256-canonical-json-catalog-slot" as const,
  sha256: "975f899d70751916f8b27361c17a7ca1c24f5645585f2f0334cd645b04ccc279",
}) satisfies ScientificProductSha256CatalogRefV1;

const CURRENT_CASE_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  entries: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  routeAliases: SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1,
  researchPresetCatalog: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
}) satisfies CurrentScientificProductCaseCatalogV1;

const CURRENT_CONTROL_CATALOG_V1 = Object.freeze({
  releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
  schemaId: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
  controlIds: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  valueDomains: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
  baselineValues: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
}) satisfies CurrentScientificProductControlCatalogV1;

const CURRENT_OBSERVABLE_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  observableRegistry: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  derivedMetricRegistry:
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1,
}) satisfies CurrentScientificProductObservableCatalogV1;

const CURRENT_UI_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  metricPresentations: SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1,
  defaultMetricSets: Object.freeze({
    overview: SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1,
    pump: SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1,
    valve: SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1,
  }),
}) satisfies CurrentScientificProductUiCatalogV1;

const CURRENT_RELEASE_BUNDLE_V1: CurrentScientificProductReleaseBundleV1 =
  Object.freeze({
    schemaId: SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_V1_SCHEMA_ID,
    releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    availability: Object.freeze({
      channel: "stable-product" as const,
      displayName: "Adult five-wall base",
      defaultForNewRuns: true,
      frontendSelectable: true,
      clinicalValidationClaimed: false as const,
      notice: "Current release-bound product model.",
    }),
    catalogRefs: Object.freeze({
      cases: CASE_CATALOG_REF_V1,
      controls: CONTROL_CATALOG_REF_V1,
      observables: OBSERVABLE_CATALOG_REF_V1,
      ui: UI_CATALOG_REF_V1,
    }),
    catalogs: Object.freeze({
      cases: CURRENT_CASE_CATALOG_V1,
      controls: CURRENT_CONTROL_CATALOG_V1,
      observables: CURRENT_OBSERVABLE_CATALOG_V1,
      ui: CURRENT_UI_CATALOG_V1,
    }),
  });

export const SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1 =
  Object.freeze({
    id: MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID,
    version:
      MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION,
    sha256: MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  });

const INTEGRATED_PREVIEW_CASE_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  entries: Object.freeze([
    Object.freeze({
      caseId: "integrated/normal-sinus-p1" as const,
      displayName: "Integrated normal-sinus P1 seed" as const,
      initialization: "exact-integrated-v3-checkpoint" as const,
      numericalPeriod1Established: true as const,
      physiologicalAcceptanceEstablished: false as const,
    }),
  ]),
}) satisfies IntegratedPreviewScientificProductCaseCatalogV1;

const INTEGRATED_PREVIEW_CONTROL_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  controls: Object.freeze([
    Object.freeze({
      controlId: "mechanical-support.preview-preset" as const,
      kind: "discrete-restart-required" as const,
      options:
        MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1
          .supportedMechanicalSupportInputs,
    }),
  ]),
  fixedRhythm: Object.freeze({
    presetId: "composed-regular-sinus-60-v1" as const,
    heartRateBpm: 60 as const,
  }),
}) satisfies IntegratedPreviewScientificProductControlCatalogV1;

const INTEGRATED_PREVIEW_OBSERVABLE_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  observableIds: Object.freeze([
    "hemodynamics.pressure.absolute.Ao",
    "hemodynamics.pressure.absolute.LV",
    "hemodynamics.pressure.absolute.PA",
    "hemodynamics.volume.LV",
    "valve.MV.flow",
    "valve.AoV.flow",
    "valve.TV.flow",
    "valve.PV.flow",
    "coronary.flow.total",
    "coronary.flow.LAD.subendocardial",
    "device.LVAD.flow",
    "rhythm.capture.atrial",
    "rhythm.capture.ventricular",
    "calcium.free.LA",
    "calcium.free.LVFW",
    "calcium.free.RVFW",
    "conservation.total_blood_volume.error",
  ] as const),
}) satisfies IntegratedPreviewScientificProductObservableCatalogV1;

const INTEGRATED_PREVIEW_UI_CATALOG_V1 = Object.freeze({
  releaseRef: SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  graphRecipes: Object.freeze([
    "pressure-waveforms",
    "lv-pressure-volume-loop",
    "valve-flow-waveforms",
    "coronary-flow-waveforms",
    "dynamic-mcs-flow-waveforms",
    "event-owned-calcium-waveforms",
  ] as const),
  surface:
    "thin-current-frontend-adapter-reusable-by-cell-document-studio" as const,
}) satisfies IntegratedPreviewScientificProductUiCatalogV1;

export const SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1:
IntegratedPreviewScientificProductReleaseBundleV1 = Object.freeze({
  schemaId: SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_V1_SCHEMA_ID,
  releaseRef: SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  availability: Object.freeze({
    channel: "experimental-preview" as const,
    displayName: "Adult five-wall integrated preview",
    defaultForNewRuns: false,
    frontendSelectable: true,
    clinicalValidationClaimed: false as const,
    notice:
      "Development preview with explicit pulmonary, AF, IABP and physiological-validation blockers.",
  }),
  catalogRefs: Object.freeze({
    cases: Object.freeze({
      id: "scientific-product-integrated-preview-case-catalog-v1",
      version: "1.0.0",
      digestSemantics: "sha256-canonical-json-catalog-slot" as const,
      sha256: "75792aea1ce0d5c7062128aa765046ea423b0f766e5ca679bff6f4de183eab8a",
    }),
    controls: Object.freeze({
      id: "scientific-product-integrated-preview-control-catalog-v1",
      version: "1.0.0",
      digestSemantics: "sha256-canonical-json-catalog-slot" as const,
      sha256: "eda32e7c4c8b62e79ec8c23aebee0703ea3a279fe4351f597e5e92ad68784a2d",
    }),
    observables: Object.freeze({
      id: "scientific-product-integrated-preview-observable-catalog-v1",
      version: "1.0.0",
      digestSemantics: "sha256-canonical-json-catalog-slot" as const,
      sha256: "634ac420a040117017bc867cefee56547e5dd991acc5c66d94ae392a9365b5b2",
    }),
    ui: Object.freeze({
      id: "scientific-product-integrated-preview-ui-catalog-v1",
      version: "1.0.0",
      digestSemantics: "sha256-canonical-json-catalog-slot" as const,
      sha256: "86c798ca6198ddfd2b52c2116b5797d210d642676093b17c7156b05a6be82611",
    }),
  }),
  catalogs: Object.freeze({
    cases: INTEGRATED_PREVIEW_CASE_CATALOG_V1,
    controls: INTEGRATED_PREVIEW_CONTROL_CATALOG_V1,
    observables: INTEGRATED_PREVIEW_OBSERVABLE_CATALOG_V1,
    ui: INTEGRATED_PREVIEW_UI_CATALOG_V1,
  }),
});

const CURRENT_EXPLICIT_CATALOG_RELEASE_REFS_V1 = Object.freeze([
  CURRENT_RELEASE_BUNDLE_V1.catalogs.cases.releaseRef,
  CURRENT_RELEASE_BUNDLE_V1.catalogs.cases.researchPresetCatalog.releaseRef,
  CURRENT_RELEASE_BUNDLE_V1.catalogs.controls.releaseRef,
  CURRENT_RELEASE_BUNDLE_V1.catalogs.observables.releaseRef,
  CURRENT_RELEASE_BUNDLE_V1.catalogs.ui.releaseRef,
]);

if (!CURRENT_EXPLICIT_CATALOG_RELEASE_REFS_V1.every((catalogReleaseRef) =>
  sameSimulationReleaseRef(
    CURRENT_RELEASE_BUNDLE_V1.releaseRef,
    catalogReleaseRef,
  ))) {
  throw new Error("current product catalog escaped its exact release binding");
}

const INTEGRATED_PREVIEW_EXPLICIT_CATALOG_RELEASE_REFS_V1 = Object.freeze([
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1
    .catalogs.cases.releaseRef,
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1
    .catalogs.controls.releaseRef,
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1
    .catalogs.observables.releaseRef,
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1
    .catalogs.ui.releaseRef,
]);

if (!INTEGRATED_PREVIEW_EXPLICIT_CATALOG_RELEASE_REFS_V1.every(
  (catalogReleaseRef) => sameSimulationReleaseRef(
    SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1.releaseRef,
    catalogReleaseRef,
  ),
)) {
  throw new Error(
    "integrated preview product catalog escaped its exact release binding",
  );
}

/** Only shipped, statically imported product bundles belong in this allowlist. */
const ALLOWLISTED_RELEASE_BUNDLES_V1 = Object.freeze([
  CURRENT_RELEASE_BUNDLE_V1,
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_BUNDLE_V1,
] as const);

export const SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1 = Object.freeze(
  ALLOWLISTED_RELEASE_BUNDLES_V1.map(({ releaseRef }) => releaseRef),
);

/**
 * Resolves an untrusted persisted release identity against the static product
 * allowlist. It never constructs an import path or falls back to the current
 * catalogs for a different ID, version, or SHA-256.
 */
export function resolveScientificProductReleaseBundleV1(
  value: unknown,
): AllowlistedScientificProductReleaseBundleV1 {
  let requestedRef: SimulationReleaseRef;
  try {
    requestedRef = loadSimulationReleaseRefV1(value);
  } catch (error) {
    throw new ScientificProductReleaseBundleResolutionErrorV1(
      error instanceof Error ? error.message : "release ref is invalid",
    );
  }

  const bundle = ALLOWLISTED_RELEASE_BUNDLES_V1.find(({ releaseRef }) =>
    sameSimulationReleaseRef(releaseRef, requestedRef));
  if (bundle === undefined) {
    throw new ScientificProductReleaseBundleResolutionErrorV1(
      "the exact SimulationReleaseRef is not allowlisted",
    );
  }
  return bundle as AllowlistedScientificProductReleaseBundleV1;
}
