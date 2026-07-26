import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  scientificProductCaseByIdV1,
  type ScientificProductCaseV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import type {
  ExperimentScenarioRuntimeSourceV1,
  ReaderPreviewManifestV1,
  ResolvedReaderExperimentPlacementV1,
  ResolvedReaderExperimentScenarioV1,
} from "@/studio/contracts/v1";

export type StudioReaderPreviewRuntimeBindingV1 = Readonly<{
  placement: ResolvedReaderExperimentPlacementV1;
  scenario: ResolvedReaderExperimentScenarioV1;
  source: ExperimentScenarioRuntimeSourceV1;
  caseEntry: ScientificProductCaseV1;
}>;

/**
 * Resolves the preview-only runtime authority for one placement, outside the
 * publication-neutral Reader document. Every identity must agree before a
 * Worker is allocated.
 *
 * The binding is per placement, not per document: an article may carry several
 * experiments, and each one owns its own numerical session. Nothing here reads
 * the other placements, so allocating one never depends on how many exist.
 */
export function resolveStudioReaderPreviewRuntimeBindingV1(
  manifest: ReaderPreviewManifestV1,
  placementBlockId: string,
): StudioReaderPreviewRuntimeBindingV1 {
  const placement = manifest.resolvedReaderDocument.placements.find(
    (candidate) => candidate.placementBlockId === placementBlockId,
  );
  if (placement === undefined) {
    throw new Error(
      `Reader Preview has no placement ${placementBlockId}`,
    );
  }
  if (placement.experiment.scenarios.length !== 1) {
    throw new Error(
      "Reader Preview requires exactly one scenario per experiment placement",
    );
  }
  const scenario = placement.experiment.scenarios[0]!;
  const source = manifest.runtimeBindings[scenario.scenarioId];
  if (
    source === undefined
    || source.kind !== "preview-bootstrap"
    || source.qualification !== "uncertified-preview-only"
  ) {
    throw new Error(
      "Reader Preview runtime binding is missing or not qualified for an uncertified preview",
    );
  }
  if (placement.experiment.modelRef !== scientificProductModelRefV1()) {
    throw new Error(
      "Reader Preview article model identity does not match the runtime release",
    );
  }
  const caseEntry = scientificProductCaseByIdV1(source.sourceId);
  if (caseEntry === null) {
    throw new Error(
      "Reader Preview runtime source is not available in this model release",
    );
  }
  return Object.freeze({
    placement,
    scenario,
    source,
    caseEntry,
  });
}

function scientificProductModelRefV1(): string {
  return `${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id}`
    + `@${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version}`
    + `:sha256:${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256}`;
}
