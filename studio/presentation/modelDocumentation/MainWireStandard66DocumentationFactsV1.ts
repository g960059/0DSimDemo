import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
  validateMainWireAorticRecoveredRootProfileV1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowDocumentationAuthorityV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
  type ExactModelKernelManifestV3,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import selectedAorticOutflowStandard66DescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.client.json";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import selectedAorticOutflowStandard66SurfaceV2 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import {
  MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import {
  MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1,
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  requireMainWireCardiacCyclePresentationIntervalSecV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import type {
  RegisteredModelDocumentationIdentityV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

export type MainWireStandard66DocumentationFactsV1 = Readonly<{
  identity: RegisteredModelDocumentationIdentityV1;
  stations: Readonly<{
    aopOutputId: string;
    abpOutputId: string;
    rawAoNodeOutputId: string;
    localHydraulicGradientOutputId: string;
    venaContractaGradientOutputId: string;
  }>;
  aortic: Readonly<{
    referenceMaximumForwardEoaCm2: number;
    ascendingAorticDiameterCm: number;
    ascendingAorticAreaCm2: number;
    characteristicImpedanceResistanceMmHgSecPerMl: number;
    residualDownstreamResistanceMmHgSecPerMl: number;
    sourceTopologyResistanceMmHgSecPerMl: number;
  }>;
  runtime: Readonly<{
    heartRateControlId: string;
    heartRateChangeSemantics: "cold-restart";
    fixtureChangeSemantics:
      "atomic-cold-restart-at-zero-clock-new-fixture-epoch";
  }>;
  surface: Readonly<{
    rawPressureVolumeLoop: true;
    formalPressureVolumeAnalysisExposed: false;
    structuralReturnAnalysisExposed: false;
    cardiacCycleAnalysis: Readonly<{
      methodId: typeof MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID;
      exactPresentationIntervalMs: number;
    }> | null;
  }>;
}>;

/**
 * Builds the human explanation from exact-owner facts and Surface mappings.
 * Any unrecognized exact claim or changed Surface semantics disables the page
 * instead of silently retaining obsolete explanatory copy.
 */
export function resolveMainWireStandard66DocumentationFactsV1(
  identity: RegisteredModelDocumentationIdentityV1,
): MainWireStandard66DocumentationFactsV1 | null {
  if (
    identity.kind !== "main-wire-selected-aortic-outflow-standard66"
    || identity.modelId
      !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1
  ) {
    return null;
  }

  try {
    const manifest = (
      selectedAorticOutflowStandard66DescriptorV1.manifest
    ) as unknown as ExactModelKernelManifestV3;
    const registeredSurface = [
      selectedAorticOutflowStandard66SurfaceV1,
      selectedAorticOutflowStandard66SurfaceV2,
    ].find((candidate) =>
      candidate.surfaceReleaseId === identity.surfaceReleaseId
      && candidate.surfaceSeriesId === identity.surfaceSeriesId);
    if (registeredSurface === undefined) return null;
    const surface = (
      registeredSurface
    ) as unknown as ModelSurfaceReleaseManifestV1;
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
    composeStandardModelContractV1(manifest, surface);

    if (
      validateMainWireAorticRecoveredRootProfileV1(
        MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
      ).length !== 0
    ) {
      return null;
    }

    const claim = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1;
    if (
      claim.proximalConstitutivePortPressure
        !== "Ao-compliance-node-plus-characteristic-impedance-times-signed-flow"
      || claim.localValvePressureGradient
        !== "raw-node-gradient-minus-characteristic-impedance-pressure"
      || claim.openingDrivePressureStation
        !== "LV-minus-proximal-constitutive-port"
      || claim.topology !== "algebraic-flow-and-bounded-opening-memory"
      || claim.acceptedMemory !== "leaflet-opening-fraction-only"
      || claim.flowMemory !== false
      || claim.localValveInertance !== false
      || claim.newContinuousStateAdded !== false
      || claim.forwardPressureLaw
        !== "source-linear-valve-loss-plus-Garcia-ELCo-irreversible-loss-plus-fixed-AA-kinetic-transport-plus-arterial-characteristic-load"
      || claim.pressureRecoveryAppliedToReverseFlow !== false
      || claim.pressureOrFlowSmoothingAdded !== false
      || claim.parameterSearchOrFitting !== false
      || claim.clinicalMeasurementEquivalenceClaimed !== false
    ) {
      return null;
    }

    const expectedAopOutputId =
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.find(
        (definition) =>
          definition.kind === "signal"
          && definition.sourcePath.endsWith(
            ".algebraicProximalConstitutivePortPressureMmHg",
          ),
      )?.outputId;
    const localHydraulicGradientOutputId =
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.find(
        (definition) =>
          definition.kind === "signal"
          && definition.sourcePath.endsWith(
            ".localValvePressureGradientMmHg",
          ),
      )?.outputId;
    const venaContractaGradientOutputId =
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.find(
        (definition) =>
          definition.kind === "signal"
          && definition.sourcePath.endsWith(
            ".venaContractaBernoulliPressureMmHg",
          ),
      )?.outputId;
    const expectedAbpOutputId =
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
        (definition) =>
          definition.kind === "signal"
          && definition.quantityKind === "pressure"
          && definition.sourcePath.endsWith("nodeAbsolutePressuresMmHg.SA"),
      )?.outputId;
    const rawAoNodeOutputId =
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
        (definition) =>
          definition.kind === "signal"
          && definition.quantityKind === "pressure"
          && definition.sourcePath.endsWith("nodeAbsolutePressuresMmHg.Ao"),
      )?.outputId;
    const aopOutputId = uniqueScalarSeriesOutputIdV1(surface, "AoP");
    const abpOutputId = uniqueScalarSeriesOutputIdV1(surface, "ABP");
    const exactOutputIds = new Set([
      ...manifest.primitiveSignalCatalog,
      ...manifest.modelMetricCatalog,
    ].map(({ outputId }) => outputId));
    if (
      expectedAopOutputId === undefined
      || expectedAbpOutputId === undefined
      || rawAoNodeOutputId === undefined
      || localHydraulicGradientOutputId === undefined
      || venaContractaGradientOutputId === undefined
      || aopOutputId !== expectedAopOutputId
      || abpOutputId !== expectedAbpOutputId
      || !exactOutputIds.has(rawAoNodeOutputId)
      || !exactOutputIds.has(localHydraulicGradientOutputId)
      || !exactOutputIds.has(venaContractaGradientOutputId)
      || !surface.exposedExactOutputIds.includes(aopOutputId)
      || !surface.exposedExactOutputIds.includes(abpOutputId)
      || !surface.exposedExactOutputIds.includes(
        localHydraulicGradientOutputId,
      )
      || !surface.exposedExactOutputIds.includes(
        venaContractaGradientOutputId,
      )
      || surface.exposedExactOutputIds.includes(rawAoNodeOutputId)
    ) {
      return null;
    }

    const exactHeartRateCandidates = manifest.primitiveControlCatalog.filter(
      (definition) =>
        definition.unit === "bpm"
        && surface.controlCatalog.some(
          (surfaceControl) =>
            surfaceControl.controlId === definition.controlId,
        ),
    );
    const exactHeartRate = exactHeartRateCandidates[0];
    if (
      exactHeartRateCandidates.length !== 1
      || exactHeartRate === undefined
      || exactHeartRate.changeSemantics !== "cold-restart"
      || manifest.runtime.fixtureChangeSemantics
        !== "atomic-cold-restart-at-zero-clock-new-fixture-epoch"
    ) {
      return null;
    }
    const heartRateControlId = exactHeartRate.controlId;

    const rawPressureVolumeLoop = surface.graphCatalog.some((graph) =>
      graph.renderer === "pressure-volume"
      && graph.requiredCapabilities.every(
        (capability) => !capability.startsWith("analysis/"),
      ));
    const formalPressureVolumeAnalysisExposed =
      surface.derivedOutputCatalog.some(
        ({ derivationId }) =>
          derivationId === MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
      )
      || surface.graphCatalog.some((graph) =>
        graph.renderer === "pressure-volume"
        && graph.requiredCapabilities.some((capability) =>
          capability.startsWith("analysis/")));
    const structuralReturnAnalysisExposed = surface.graphCatalog.some(
      (graph) => graph.renderer === "structural-return",
    );
    const cardiacCycleOutputs = surface.derivedOutputCatalog.filter(
      ({ derivationId }) =>
        derivationId === MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
    );
    const cardiacCycleAnalysis = cardiacCycleOutputs.length === 0
      ? null
      : new Set(cardiacCycleOutputs.map(({ outputId }) => outputId)).size
          === MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1.length
        && MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1.every((outputId) =>
          cardiacCycleOutputs.some((output) =>
            output.outputId === outputId
            && output.scope === "beat"
            && output.shape === "scalar"))
        ? Object.freeze({
            methodId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
            exactPresentationIntervalMs:
              requireMainWireCardiacCyclePresentationIntervalSecV1(
                manifest.runtime,
              ) * 1_000,
          })
        : undefined;
    if (
      !rawPressureVolumeLoop
      || formalPressureVolumeAnalysisExposed
      || structuralReturnAnalysisExposed
      || cardiacCycleAnalysis === undefined
    ) {
      return null;
    }

    const profile = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;
    return Object.freeze({
      identity,
      stations: Object.freeze({
        aopOutputId,
        abpOutputId,
        rawAoNodeOutputId,
        localHydraulicGradientOutputId,
        venaContractaGradientOutputId,
      }),
      aortic: Object.freeze({
        referenceMaximumForwardEoaCm2:
          profile.referenceMaximumForwardEoaCm2,
        ascendingAorticDiameterCm: profile.ascendingAorticDiameterCm,
        ascendingAorticAreaCm2: profile.ascendingAorticAreaCm2,
        characteristicImpedanceResistanceMmHgSecPerMl:
          profile.characteristicImpedanceResistanceMmHgSecPerMl,
        residualDownstreamResistanceMmHgSecPerMl:
          profile.residualDownstreamResistanceMmHgSecPerMl,
        sourceTopologyResistanceMmHgSecPerMl:
          profile.sourceTopologyResistanceMmHgSecPerMl,
      }),
      runtime: Object.freeze({
        heartRateControlId,
        heartRateChangeSemantics: exactHeartRate.changeSemantics,
        fixtureChangeSemantics:
          manifest.runtime.fixtureChangeSemantics,
      }),
      surface: Object.freeze({
        rawPressureVolumeLoop: true as const,
        formalPressureVolumeAnalysisExposed: false as const,
        structuralReturnAnalysisExposed: false as const,
        cardiacCycleAnalysis,
      }),
    });
  } catch {
    return null;
  }
}

function uniqueScalarSeriesOutputIdV1(
  surface: ModelSurfaceReleaseManifestV1,
  seriesId: string,
): string | null {
  const outputIds = new Set<string>();
  for (const graph of surface.graphCatalog) {
    if (!("seriesCatalog" in graph)) continue;
    for (const series of graph.seriesCatalog) {
      if (
        series.kind === "scalar"
        && series.seriesId === seriesId
      ) {
        outputIds.add(series.outputId);
      }
    }
  }
  return outputIds.size === 1 ? [...outputIds][0]! : null;
}
