import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionDocumentationAuthorityV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
  type ExactModelKernelManifestV3,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import algebraicPulmonaryRootDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";
import algebraicPulmonaryRootSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import {
  resolveRegisteredExactModelBaselineValidationV1,
} from "@/studio/registry/RegisteredExactModelBaselineValidationV1";
import {
  resolveMainWireAnalysisMethodsForSurfaceV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import {
  MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import type {
  RegisteredModelDocumentationIdentityV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

export type MainWireStandard70DocumentationFactsV1 = Readonly<{
  identity: RegisteredModelDocumentationIdentityV1;
  generation: 70;
  stations: Readonly<{
    aopOutputId: string;
    abpOutputId: string;
    aopRole: "source-aortic-root-compliance-node";
    localPressureRecoveryModeled: false;
  }>;
  dynamics: Readonly<{
    ventricularMaterialProfileId: string;
    aorticOutflowCirculationProfileId:
      "main-wire-source-aortic-outflow-topology-v3";
    proximalArterialRootMomentum: "source-inertance";
    pulmonaryArterialRootMomentum: "algebraic-no-inertance";
    newContinuousStateAdded: false;
    valveOpeningStateAdded: false;
  }>;
  runtime: Readonly<{
    heartRateControlId: string;
    heartRateChangeSemantics: "accepted-state-warm-start";
    fixtureChangeSemantics:
      "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch";
  }>;
  surface: Readonly<{
    rawPressureVolumeLoop: true;
    formalPressureVolumeAnalysisExposed: true;
    structuralReturnAnalysisExposed: true;
    periodicPvaMethodId: typeof MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID;
    espvrLoadDomain: "preload-reduction-through-operating-anchor";
  }>;
  baseline: Readonly<{
    completedCycleCount: number;
    passedCheckCount: number;
  }>;
}>;

/** Fail closed rather than substituting another release's station semantics. */
export function resolveMainWireStandard70DocumentationFactsV1(
  identity: RegisteredModelDocumentationIdentityV1,
): MainWireStandard70DocumentationFactsV1 | null {
  if (
    identity.kind !== "main-wire-algebraic-pulmonary-root-standard70"
    || identity.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
  ) {
    return null;
  }

  try {
    const manifest = algebraicPulmonaryRootDescriptorV1.manifest as unknown as
      ExactModelKernelManifestV3;
    const surface = algebraicPulmonaryRootSurfaceV1 as unknown as
      ModelSurfaceReleaseManifestV1;
    assertExactModelKernelManifestV3(manifest);
    assertModelSurfaceReleaseManifestV1(surface);
    if (
      manifest.modelId !== identity.modelId
      || manifest.modelFamilyId
        !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
      || surface.surfaceReleaseId !== identity.surfaceReleaseId
      || surface.surfaceSeriesId !== identity.surfaceSeriesId
      || surface.modelFamilyId !== manifest.modelFamilyId
    ) {
      return null;
    }

    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(surface);
    const composed = composeStandardModelContractV1(
      manifest,
      surface,
      methods.capabilities,
    );
    const aopOutputId = outputIdBySourceSuffixV1(
      ".nodeAbsolutePressuresMmHg.Ao",
    );
    const abpOutputId = outputIdBySourceSuffixV1(
      ".nodeAbsolutePressuresMmHg.SA",
    );
    if (
      uniqueScalarSeriesOutputIdV1(surface, "AoP") !== aopOutputId
      || uniqueScalarSeriesOutputIdV1(surface, "SAP") !== abpOutputId
      || !surface.exposedExactOutputIds.includes(aopOutputId)
      || !surface.exposedExactOutputIds.includes(abpOutputId)
      || !manifest.primitiveSignalCatalog.some(
        ({ outputId }) => outputId === aopOutputId,
      )
      || manifest.primitiveSignalCatalog.some(({ outputId }) =>
        outputId.includes("aortic-proximal-constitutive-port"))
    ) {
      return null;
    }

    const heartRates = manifest.primitiveControlCatalog.filter(
      ({ controlId, unit }) =>
        unit === "bpm"
        && surface.controlCatalog.some((item) => item.controlId === controlId),
    );
    const heartRate = heartRates[0];
    if (
      heartRates.length !== 1
      || heartRate === undefined
      || heartRate.changeSemantics !== "accepted-state-warm-start"
      || manifest.runtime.fixtureChangeSemantics
        !== "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch"
    ) {
      return null;
    }

    const claim =
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM;
    if (
      claim.aorticOutflowCirculationProfileId
        !== "main-wire-source-aortic-outflow-topology-v3"
      || claim.aorticOutflowPressureStation !== "source-lv-to-aortic-node"
      || claim.proximalArterialRootMomentum !== "source-inertance"
      || claim.pressureRecoveryCorrectionApplied !== false
      || claim.newContinuousStateAdded !== false
      || claim.valveOpeningStateAdded !== false
      || manifest.equations.ventricularMaterialProfileId
        !== claim.ventricularMaterialProfileId
      || manifest.equations.aorticOutflowCirculationProfileId
        !== claim.aorticOutflowCirculationProfileId
      || manifest.equations.pulmonaryArterialRootProfileId
        !== "main-wire-algebraic-pulmonary-arterial-root-profile-v1"
    ) {
      return null;
    }

    const rawPressureVolumeLoop = surface.graphCatalog.some((graph) =>
      graph.renderer === "pressure-volume"
      && "seriesCatalog" in graph
      && graph.seriesCatalog.some((series) =>
        series.kind === "pressure-volume"));
    const structuralReturnAnalysisExposed = surface.graphCatalog.some(
      (graph) => graph.renderer === "structural-return",
    );
    const formalPressureVolumeAnalysisExposed =
      methods.periodicPvaDerivation?.methodId ===
        MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID
      && surface.derivedOutputCatalog.length > 0;
    if (
      !rawPressureVolumeLoop
      || !formalPressureVolumeAnalysisExposed
      || !structuralReturnAnalysisExposed
      || composed.surface.derivedOutputCatalog.length
        !== surface.derivedOutputCatalog.length
      || composed.surface.graphCatalog.length !== surface.graphCatalog.length
    ) {
      return null;
    }

    const baseline = resolveRegisteredExactModelBaselineValidationV1(identity.modelId);
    if (baseline === null || baseline.checks.some(({ status }) => status !== "passed")) {
      return null;
    }

    return Object.freeze({
      identity,
      generation: 70 as const,
      stations: Object.freeze({
        aopOutputId,
        abpOutputId,
        aopRole: "source-aortic-root-compliance-node" as const,
        localPressureRecoveryModeled: false as const,
      }),
      dynamics: Object.freeze({
        ventricularMaterialProfileId: claim.ventricularMaterialProfileId,
        aorticOutflowCirculationProfileId:
          claim.aorticOutflowCirculationProfileId,
        proximalArterialRootMomentum: claim.proximalArterialRootMomentum,
        pulmonaryArterialRootMomentum: "algebraic-no-inertance" as const,
        newContinuousStateAdded: claim.newContinuousStateAdded,
        valveOpeningStateAdded: claim.valveOpeningStateAdded,
      }),
      runtime: Object.freeze({
        heartRateControlId: heartRate.controlId,
        heartRateChangeSemantics: heartRate.changeSemantics,
        fixtureChangeSemantics: manifest.runtime.fixtureChangeSemantics,
      }),
      surface: Object.freeze({
        rawPressureVolumeLoop: true as const,
        formalPressureVolumeAnalysisExposed: true as const,
        structuralReturnAnalysisExposed: true as const,
        periodicPvaMethodId: MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID,
        espvrLoadDomain:
          "preload-reduction-through-operating-anchor" as const,
      }),
      baseline: Object.freeze({
        completedCycleCount: baseline.completedCycleCount,
        passedCheckCount: baseline.checks.length,
      }),
    });
  } catch {
    return null;
  }
}

function outputIdBySourceSuffixV1(suffix: string): string {
  const matches = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.filter(
    ({ sourcePath }) => sourcePath.endsWith(suffix),
  );
  if (matches.length !== 1) {
    throw new Error(`rounded-ejection documentation output is ambiguous: ${suffix}`);
  }
  return matches[0]!.outputId;
}

function uniqueScalarSeriesOutputIdV1(
  surface: ModelSurfaceReleaseManifestV1,
  seriesId: string,
): string | null {
  const outputIds = new Set<string>();
  for (const graph of surface.graphCatalog) {
    if (!("seriesCatalog" in graph)) continue;
    for (const series of graph.seriesCatalog) {
      if (series.kind === "scalar" && series.seriesId === seriesId) {
        outputIds.add(series.outputId);
      }
    }
  }
  return outputIds.size === 1 ? [...outputIds][0]! : null;
}
