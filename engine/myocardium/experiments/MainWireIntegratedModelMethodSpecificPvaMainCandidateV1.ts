import type { MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";
import type { MainWireIntegratedModelPvaVentricleV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";

export const MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_MAIN_CANDIDATE_V1_ID =
  "main-wire-integrated-model-method-specific-pva-main-candidate-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID =
  "suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_OUTPUT_IDS_V1 =
  Object.freeze([
    "protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.LV",
    "protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.RV",
  ] as const);

export type MainWireIntegratedModelMethodSpecificPvaMainBlockerV1 =
  | "transient-periodic-source-compatibility-not-established"
  | "passive-reference-source-identity-not-established"
  | "baseline-exclusion-sensitivity-not-characterized"
  | "selected-phase-state-dispersion-not-characterized"
  | "phase-resolution-sensitivity-not-characterized"
  | "candidate-value-unavailable";

export type MainWireIntegratedModelMethodSpecificPvaMainLimitationV1 =
  | "domain-supported-potential-energy-not-established"
  | "systolic-relation-extrapolation-required"
  | "fixed-contralateral-passive-reference"
  | "protocol-direction-sensitivity-retained";

export type MainWireIntegratedModelMethodSpecificPvaMainCandidateV1 = Readonly<{
  candidateId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_MAIN_CANDIDATE_V1_ID;
  status: "qualification-required" | "ready-for-on-demand-main" | "unavailable";
  targetSurface: "completed-protocol-analysis";
  methodSelection: Readonly<{
    status: "selected-for-main-qualification";
    methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID;
    loadProtocol: "transient-venous-return-reduction-occlusion-ramp";
    systolicRelation: "maximum-positive-occlusion-phase-wise-isochronal";
    diastolicReference: "fixed-contralateral-intrinsic-passive-center-slice-v1";
    pressureBasis: "ventricular-transmural";
    externalWork: "periodic-1ms-trapezoidal-cavity-work";
    areaRule: "periodic-external-work-plus-systolic-minus-passive-area";
    potentialEnergyBoundary: "explicit-systolic-v0-extrapolation";
    releaseDirectionUse: "retained-sensitivity-diagnostic";
  }>;
  outputs: readonly Readonly<{
    outputId: (typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_OUTPUT_IDS_V1)[number];
    methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID;
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    unit: "J";
    researchEstimateJ: number | null;
    mainOutputValueJ: number | null;
    evidenceStatus:
      "domain-supported" | "extrapolation-dependent" | "unavailable";
    sourceIdentity: Readonly<{
      transientPeriodicCompatibilityEstablished: boolean;
      passiveReferenceSourceIdentityEstablished: false;
    }>;
    systolicRelation: Readonly<{
      phase01: number;
      elastanceMmHgPerMl: number;
      volumeAxisInterceptMl: number;
      measuredVolumeRangeMl: readonly [number, number];
      rSquared: number | null;
      rootMeanSquaredResidualMmHg: number;
      leaveOneOutSlopeRangeMmHgPerMl: readonly [number, number];
      leaveOneOutVolumeAxisInterceptRangeMl: readonly [number, number];
      releaseSlopeDifferenceFraction: number;
    }>;
    passiveReference: Readonly<{
      referenceId: "fixed-contralateral-intrinsic-passive-center-slice-v1";
      fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
      fixedContralateralVolumeMl: number;
      supportedVolumeRangeMl: readonly [number, number];
    }>;
    energy: Readonly<{
      externalWorkJ: number;
      potentialEnergyEquivalentJ: number | null;
      pvaEstimateJ: number | null;
      mechanicalConversionRatio: number | null;
    }>;
    uncertainty: Readonly<{
      systolicAreaOutsideMeasuredRangeFraction: number;
      externalWorkCoarseFineDifferenceJ: number;
      baselineExclusionSensitivityJ: null;
      selectedPhaseStateDispersionAvailable: false;
    }>;
    blockers: readonly MainWireIntegratedModelMethodSpecificPvaMainBlockerV1[];
    limitations: readonly MainWireIntegratedModelMethodSpecificPvaMainLimitationV1[];
  }>[];
  promotion: Readonly<{
    mainIntegrationReady: boolean;
    blockers: readonly MainWireIntegratedModelMethodSpecificPvaMainBlockerV1[];
    nextRequiredStudy: null | "phase-wise-pva-qualification-v2";
  }>;
  interpretation: Readonly<{
    genericPvaEstablished: false;
    clinicalPvaEstablished: false;
    oxygenConsumptionEstablished: false;
    liveSingleBeatOutput: false;
    methodSpecificProtocolOutputSelected: true;
    productValuePublished: false;
    domainSupportedVariantEstablished: boolean;
  }>;
}>;

/**
 * Selects the product-facing method and exposes its current promotion state.
 * It is intentionally a completed-protocol result, not a live output-registry
 * scalar: the systolic relation requires an ensemble of preload beats.
 */
export function projectMainWireIntegratedModelMethodSpecificPvaMainCandidateV1(
  research: MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1,
): MainWireIntegratedModelMethodSpecificPvaMainCandidateV1 {
  if (
    research.studyId !==
      "main-wire-integrated-model-phase-wise-emax-baseline-pva-research-v1" ||
    research.status !== "completed" ||
    research.pressureBasis !== "ventricular-transmural" ||
    research.candidates.length !== 2 ||
    research.baselinePva.length !== 2
  ) {
    throw new Error(
      "PVA main candidate requires the completed phase-wise study",
    );
  }

  const outputs = Object.freeze(
    (["LV", "RV"] as const).map((ventricleId) => {
      const candidate = research.candidates.find(
        (value) => value.ventricleId === ventricleId,
      );
      const pva = research.baselinePva.find(
        (value) => value.ventricleId === ventricleId,
      );
      if (candidate === undefined || pva === undefined) {
        throw new Error(`PVA main candidate is missing ${ventricleId}`);
      }

      const blockers: MainWireIntegratedModelMethodSpecificPvaMainBlockerV1[] =
        [];
      const limitations: MainWireIntegratedModelMethodSpecificPvaMainLimitationV1[] =
        [];
      if (
        !research.interpretation.transientPeriodicSourceCompatibilityEstablished
      ) {
        blockers.push(
          "transient-periodic-source-compatibility-not-established",
        );
      }
      if (!research.source.passiveReference.sourceIdentityEstablished) {
        blockers.push("passive-reference-source-identity-not-established");
      }
      blockers.push(
        "baseline-exclusion-sensitivity-not-characterized",
        "selected-phase-state-dispersion-not-characterized",
        "phase-resolution-sensitivity-not-characterized",
      );
      if (
        pva.status !== "domain-supported-baseline-pva" ||
        pva.supportedIntersectionVolumeMl === null ||
        pva.supportedPotentialEnergyJ === null
      ) {
        limitations.push("domain-supported-potential-energy-not-established");
      }
      if (pva.systolicLineAreaOutsideMeasuredRangeFraction > 0) {
        limitations.push("systolic-relation-extrapolation-required");
      }
      limitations.push("fixed-contralateral-passive-reference");
      const releaseSlopeDifferenceFraction =
        candidate.releaseAtSelectedPhase.releaseMinusOcclusionSlopeMmHgPerMl /
        candidate.selectedRelation.slopeMmHgPerMl;
      if (Math.abs(releaseSlopeDifferenceFraction) >= 0.1) {
        limitations.push("protocol-direction-sensitivity-retained");
      }
      if (pva.reportedPressureVolumeAreaJ === null) {
        blockers.push("candidate-value-unavailable");
      }
      const ready = blockers.length === 0;
      const researchEstimateJ = pva.reportedPressureVolumeAreaJ;
      const passiveReference = research.source.passiveReference.slices.find(
        (value) => value.ventricleId === ventricleId,
      );
      if (passiveReference === undefined) {
        throw new Error(
          `PVA main candidate passive reference is missing ${ventricleId}`,
        );
      }
      const oneMsWork = pva.periodicExternalWorkByDt.find(
        ({ nominalDtSec }) => nominalDtSec === 0.001,
      )?.externalWorkJ;
      const quarterMsWork = pva.periodicExternalWorkByDt.find(
        ({ nominalDtSec }) => nominalDtSec === 0.00025,
      )?.externalWorkJ;
      if (oneMsWork === undefined || quarterMsWork === undefined) {
        throw new Error(
          `PVA main candidate work sensitivity is missing ${ventricleId}`,
        );
      }

      return Object.freeze({
        outputId:
          `protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.${ventricleId}` as const,
        methodId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
        ventricleId,
        unit: "J" as const,
        researchEstimateJ,
        mainOutputValueJ: ready ? researchEstimateJ : null,
        evidenceStatus:
          pva.status === "domain-supported-baseline-pva"
            ? ("domain-supported" as const)
            : pva.status === "extrapolation-dependent-baseline-pva"
              ? ("extrapolation-dependent" as const)
              : ("unavailable" as const),
        sourceIdentity: Object.freeze({
          transientPeriodicCompatibilityEstablished:
            research.interpretation
              .transientPeriodicSourceCompatibilityEstablished,
          passiveReferenceSourceIdentityEstablished: false as const,
        }),
        systolicRelation: Object.freeze({
          phase01: candidate.selectedPhase01,
          elastanceMmHgPerMl: candidate.selectedRelation.slopeMmHgPerMl,
          volumeAxisInterceptMl:
            candidate.selectedRelation.volumeAxisInterceptMl,
          measuredVolumeRangeMl:
            candidate.selectedRelation.measuredVolumeRangeMl,
          rSquared: candidate.selectedRelation.rSquared,
          rootMeanSquaredResidualMmHg:
            candidate.selectedRootMeanSquaredResidualMmHg,
          leaveOneOutSlopeRangeMmHgPerMl: Object.freeze([
            candidate.leaveOneBeatOut.minimumSlopeMmHgPerMl,
            candidate.leaveOneBeatOut.maximumSlopeMmHgPerMl,
          ] as const),
          leaveOneOutVolumeAxisInterceptRangeMl: Object.freeze([
            candidate.leaveOneBeatOut.minimumVolumeAxisInterceptMl,
            candidate.leaveOneBeatOut.maximumVolumeAxisInterceptMl,
          ] as const),
          releaseSlopeDifferenceFraction,
        }),
        passiveReference: Object.freeze({
          referenceId: research.source.passiveReference.referenceId,
          fixedContralateralVentricleId:
            passiveReference.fixedContralateralVentricleId,
          fixedContralateralVolumeMl:
            passiveReference.fixedContralateralVolumeMl,
          supportedVolumeRangeMl: passiveReference.supportedVolumeRangeMl,
        }),
        energy: Object.freeze({
          externalWorkJ: pva.periodicExternalWorkJ,
          potentialEnergyEquivalentJ: pva.reportedPotentialEnergyJ,
          pvaEstimateJ: researchEstimateJ,
          mechanicalConversionRatio:
            researchEstimateJ !== null && researchEstimateJ > 0
              ? pva.periodicExternalWorkJ / researchEstimateJ
              : null,
        }),
        uncertainty: Object.freeze({
          systolicAreaOutsideMeasuredRangeFraction:
            pva.systolicLineAreaOutsideMeasuredRangeFraction,
          externalWorkCoarseFineDifferenceJ: Math.abs(
            oneMsWork - quarterMsWork,
          ),
          baselineExclusionSensitivityJ: null,
          selectedPhaseStateDispersionAvailable: false as const,
        }),
        blockers: Object.freeze(blockers),
        limitations: Object.freeze(limitations),
      });
    }),
  );
  const blockers = Object.freeze([
    ...new Set(outputs.flatMap((output) => output.blockers)),
  ]);
  const mainIntegrationReady = outputs.every(
    (output) => output.mainOutputValueJ !== null,
  );
  const researchEstimateAvailable = outputs.every(
    (output) => output.researchEstimateJ !== null,
  );

  return Object.freeze({
    candidateId:
      MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_MAIN_CANDIDATE_V1_ID,
    status: mainIntegrationReady
      ? ("ready-for-on-demand-main" as const)
      : researchEstimateAvailable
        ? ("qualification-required" as const)
        : ("unavailable" as const),
    targetSurface: "completed-protocol-analysis" as const,
    methodSelection: Object.freeze({
      status: "selected-for-main-qualification" as const,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
      loadProtocol: "transient-venous-return-reduction-occlusion-ramp" as const,
      systolicRelation:
        "maximum-positive-occlusion-phase-wise-isochronal" as const,
      diastolicReference:
        "fixed-contralateral-intrinsic-passive-center-slice-v1" as const,
      pressureBasis: "ventricular-transmural" as const,
      externalWork: "periodic-1ms-trapezoidal-cavity-work" as const,
      areaRule:
        "periodic-external-work-plus-systolic-minus-passive-area" as const,
      potentialEnergyBoundary: "explicit-systolic-v0-extrapolation" as const,
      releaseDirectionUse: "retained-sensitivity-diagnostic" as const,
    }),
    outputs,
    promotion: Object.freeze({
      mainIntegrationReady,
      blockers,
      nextRequiredStudy: mainIntegrationReady
        ? null
        : ("phase-wise-pva-qualification-v2" as const),
    }),
    interpretation: Object.freeze({
      genericPvaEstablished: false as const,
      clinicalPvaEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
      liveSingleBeatOutput: false as const,
      methodSpecificProtocolOutputSelected: true as const,
      productValuePublished: false as const,
      domainSupportedVariantEstablished: outputs.every(
        (output) => output.evidenceStatus === "domain-supported",
      ),
    }),
  });
}
