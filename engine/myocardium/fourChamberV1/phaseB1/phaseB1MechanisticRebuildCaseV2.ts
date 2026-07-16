import {
  evaluateAtrialOneFiberGeometryV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  buildNormalAdultAtrialMechanicsCenterCandidateV3,
  type NormalAdultAtrialMechanicsCandidateV3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import {
  evaluatePublishedTriSegGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  buildNormalAdultVentricularMechanicsCandidateV2,
  type NormalAdultVentricularMechanicsCandidateV2,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultVentricularMechanicsCandidateV2";
import {
  evaluateFourChamberClosedLoopSameTimeLevelV1,
  getRuntimeTriSegEquilibriumResidualV2,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  buildFourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  computeIntrapericardialHeartVolumeM3V1,
  evaluateCommonPericardiumV1,
  type CommonPericardiumParametersV1,
} from "@/engine/myocardium/fourChamberV1/pericardium/commonPericardiumV1";
import {
  PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeEndpointEvaluationV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1RelaxedEndpointAtDeclaredCoordinatesV2,
  type PhaseB1RelaxedEndpointAtDeclaredCoordinatesV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildInitializationV2";
import {
  solvePhaseB1PreAOperatingPointV2,
  type PhaseB1PreAOperatingPointSuccessV2,
  type PhaseB1PreARelaxedMechanicsEvaluatorV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PreAOperatingPointInitializerV2";
import {
  buildPhaseB1PhysiologyEnvelopeCaseV1,
  type PhaseB1PhysiologyEnvelopeCaseV1,
  type PhaseB1PhysiologyEnvelopeOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1";
import type {
  PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  buildPhaseB1MechanisticRebuildWallMaterialBindingV4,
  getPhaseB1WallPassiveStressScalesV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  buildNormalAdultActiveTissueClassPriorAuditV1,
  type NormalAdultActiveTissueClassPriorAuditV1,
} from "@/engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1";
import {
  PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2,
  getPreAOperatingPointFixedHemodynamicInitializerInputsV2,
} from "@/engine/myocardium/fourChamberV1/physiology/preAOperatingPointHemodynamicConstructionPriorV2";
import {
  INERTIAL_FLOW_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_ID =
  "phase-b1-four-chamber-mechanistic-rebuild-case-v2" as const;

export const PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_POLICY = Object.freeze({
  policyId: "phase-b1-four-chamber-mechanistic-rebuild-case-policy-v2",
  bodySurfaceAreaM2: 1.9,
  postAEdpvrCalibrationAnchorMmHg: 8,
  activeParameterization:
    "shared-tissue-class-land-atria-lewalle-saturation-mapped-ventricles-whole-organ-120-kpa" as const,
  atrialActiveAmplitudeRule:
    "human-la-pca4p5-force-scale-mapped-through-six-state-land-saturation-and-shared-with-ra" as const,
  atrialActiveKineticsClaim:
    "land-niederer-timing-informed-surrogate-not-experimentally-identified-human-atrial-land-kinetics" as const,
  atrialCalciumForcingRule:
    "land-niederer-output-timing-low-order-two-exponential-component-metric-reconstruction" as const,
  ventricularCalciumRuntimeRule:
    "retain-legacy-project-synthetic-prior-to-isolate-atrial-active-class-change" as const,
  ventricularCalciumReconstructionRole:
    "named-v5-causal-ablation-only-because-rt90-context-is-not-reproduced" as const,
  moyerTmaxUsedAsLandTref: false as const,
  atrialRule:
    "cmr-loaded-phasic-anatomy-plus-moyer-equibiaxial-material-and-chamber-specific-inverse-unloading" as const,
  hemodynamicBootstrap:
    "seven-unknown-pre-a-pressure-replay-triseg-equilibrium-and-total-blood-volume-root" as const,
  hemodynamicBootstrapClaim:
    "construction-consistent-relaxed-seed-not-period-one-or-physiological-validation" as const,
  operatingPointInadmissibleRule:
    "only-candidate-dependent-geometry-or-constitutive-support-domain-failures" as const,
  programmerOrProvenanceErrorsConvertedToInadmissible: false as const,
  finiteThicknessTriSegRuntimeOwner: true as const,
  publishedTaylorRole: "diagnostic-only" as const,
  pericardialReferenceRule:
    "one-plus-reserve-times-cmr-maximum-atria-plus-cmr-ed-ventricles-plus-anatomy-wall-volumes" as const,
  pericardialReferenceReserveFraction: 0.05,
  pericardiumUsedToRaiseSystemicPressure: false as const,
  oldGeometryDependentMaterialHistoryImported: false as const,
  wallWiseActiveGainAllowed: false as const,
  chamberPressureGainAllowed: false as const,
  pvLoopShapeUsedForFit: false as const,
  normalOperatingPointClaimed: false as const,
  chamberVolumeGateScope: "normal-bsa-center-phase-envelope-only" as const,
  patientVariantVolumeGateMustDeriveFromVariantAnatomy: true as const,
  physiologicalValidationClaimed: false as const,
  runtimeAdopted: false as const,
} as const);

const PA_PER_MMHG = 133.322387415;

export type PhaseB1MechanisticRebuildCaseV2 = Readonly<{
  caseId: typeof PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_ID;
  sourcePhysiologyCase: PhaseB1PhysiologyEnvelopeCaseV1;
  atrialMechanics: NormalAdultAtrialMechanicsCandidateV3;
  ventricularMechanics: NormalAdultVentricularMechanicsCandidateV2;
  activeTissueClassPrior: NormalAdultActiveTissueClassPriorAuditV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  operatingPoint: PhaseB1PreAOperatingPointSuccessV2;
  initialization: PhaseB1RelaxedEndpointAtDeclaredCoordinatesV2;
  pericardiumParameters: CommonPericardiumParametersV1;
  model: PhaseB1EventFreeMonolithicModelV1;
  initialEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  configurationContentSha256: string;
  audit: Readonly<{
    bodySurfaceAreaM2: number;
    postAEdpvrCalibrationAnchorPa: number;
    preARightVentricularTargetPressurePa: number;
    preARightVentricularTargetSource:
      "runtime-energy-triseg-prediction-not-an-rv-klotz-target";
    initialChamberPressurePa: Readonly<Record<"LA" | "LV" | "RA" | "RV", number>>;
    targetInitialChamberPressurePa: Readonly<Record<"LA" | "LV" | "RA" | "RV", number>>;
    initialVascularPressurePa: Readonly<Record<"SA" | "SV" | "PA" | "PV", number>>;
    initialPericardialPressurePa: number;
    cmrAnchorPericardialPressurePa: number;
    maximumAbsoluteInitialPressureReplayDifferencePa: number;
    totalBloodVolumeDifferenceM3: number;
    totalBloodVolumeRelativeDifference: number;
    initialMaximumAbsoluteInertialFlowAccelerationM3PerSec2: number;
    initialMaximumAbsoluteAtrialFiberLogStrain: number;
    initialMaximumAtrialLandStretch: number;
    initialChamberVolumeM3: Readonly<Record<"LA" | "LV" | "RA" | "RV", number>>;
    declaredNormalVolumeRangeM3ByChamber: Readonly<Record<
      "LA" | "LV" | "RA" | "RV",
      readonly [number, number]
    >>;
    initialChamberVolumesWithinDeclaredRanges: true;
    referenceCardiacPoolM3: number;
    solvedCardiacPoolM3: number;
    solvedCardiacPoolDifferenceFromReferenceM3: number;
    chamberVolumeGateScope: "normal-bsa-center-phase-envelope-only";
    patientVariantVolumeGateMustDeriveFromVariantAnatomy: true;
    initialGuessCardiacPoolClosureErrorM3: number;
    initialTriSegResidualScaledByFinalRegistry: number;
    finiteThicknessTriSegRuntimeOwner: true;
    publishedTaylorDiagnosticOnly: true;
    initialCirculatoryStationarityClaimed: false;
    wallMassAndReferenceGeometryChangedTogether: true;
    landAndSlsReinitializedAtNewGeometry: true;
    newtonRegistryCompiledAfterStructuralChange: true;
    pericardiumUsedToRaiseSystemicPressure: false;
    oldGeometryDependentMaterialHistoryImported: false;
    oldQuiescentInverseAtrialGeometryImported: false;
    wallWiseActiveGainApplied: false;
    sameAtrialActiveMaterialAppliedToLaAndRa: true;
    atrialActiveForceScaleSourceDoi: "10.1016/j.yjmcc.2025.12.001";
    atrialActiveTrefPa: number;
    ventricularActiveTrefPa: 120000;
    moyerTmaxUsedAsLandTref: false;
    calciumTraceClaimedAsMeasured: false;
    reconstructedVentricularCalciumAppliedInCanonicalCase: false;
    reconstructedVentricularCalciumAvailableAsV5Ablation: true;
    chamberPressureGainApplied: false;
    pvLoopShapeUsedForFit: false;
    normalOperatingPointClaimed: false;
    physiologicalValidationClaimed: false;
    constructionConsistencyPass: true;
  }>;
  caseConstructionConsistencyPass: true;
  candidatePriorOnly: true;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

export function buildPhaseB1MechanisticRebuildCaseV2(input: Readonly<{
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  overlay: PhaseB1PhysiologyEnvelopeOverlayV1;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1MechanisticRebuildCaseV2 {
  assertExactPlainRecordV1(
    input,
    ["sourceCase", "overlay", "sha256Hex"],
    "Phase B1 mechanistic-rebuild case input",
  );
  if (typeof input.sha256Hex !== "function") {
    throw new Error("mechanistic-rebuild case requires a SHA-256 provider");
  }
  const sourcePhysiologyCase = buildPhaseB1PhysiologyEnvelopeCaseV1(input);
  const bsa = PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_POLICY.bodySurfaceAreaM2;
  const postAEdpvrCalibrationAnchorPa =
    PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_POLICY
      .postAEdpvrCalibrationAnchorMmHg * PA_PER_MMHG;
  const atrialMechanics = buildNormalAdultAtrialMechanicsCenterCandidateV3({
    bodySurfaceAreaM2: bsa,
  });
  const ventricularMechanics = buildNormalAdultVentricularMechanicsCandidateV2({
    bodySurfaceAreaM2: bsa,
    leftVentricularEndDiastolicPressurePa:
      postAEdpvrCalibrationAnchorPa,
  });
  const activeTissueClassPrior =
    buildNormalAdultActiveTissueClassPriorAuditV1(input.sha256Hex);
  const sourceBundle = buildPhaseA1TissueManifestBundleV1(input.sha256Hex);
  const wallMaterialBinding =
    buildPhaseB1MechanisticRebuildWallMaterialBindingV4(
      sourceBundle,
      ventricularMechanics.passiveFit,
      atrialMechanics,
      activeTissueClassPrior,
      input.sha256Hex,
    );
  const sourceEndpoint = sourcePhysiologyCase.initialEndpoint;
  const sourceClosedLoop = sourcePhysiologyCase.model.closedLoopParameters;
  const atrialGeometryPriorByChamber = atrialMechanics.geometryPriorByAtrium;
  const anatomy = ventricularMechanics.anatomy;

  const cmrAnchorIntrapericardialHeartVolumeM3 =
    computeIntrapericardialHeartVolumeM3V1({
      leftAtrialBloodVolumeM3:
        atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.LA.maximum,
      leftVentricularBloodVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      rightAtrialBloodVolumeM3:
        atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.RA.maximum,
      rightVentricularBloodVolumeM3:
        anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
      wallMaterialVolumesM3: [
        atrialGeometryPriorByChamber.LA.wallReferenceMaterialVolumeM3,
        anatomy.walls.LVFW.wallMaterialVolumeM3,
        anatomy.walls.SEP.wallMaterialVolumeM3,
        anatomy.walls.RVFW.wallMaterialVolumeM3,
        atrialGeometryPriorByChamber.RA.wallReferenceMaterialVolumeM3,
      ],
    });
  const pericardiumParameters: CommonPericardiumParametersV1 = Object.freeze({
    ...sourceClosedLoop.pericardiumParameters,
    referenceHeartVolumeM3:
      (1 + PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_POLICY
        .pericardialReferenceReserveFraction)
      * cmrAnchorIntrapericardialHeartVolumeM3,
  });
  const baseFixedHemodynamics =
    getPreAOperatingPointFixedHemodynamicInitializerInputsV2();
  const preARightVentricularTargetPressurePa = ventricularMechanics
    .preAPassiveConstruction.predictedRightVentricularPressurePa;
  const fixedHemodynamics = Object.freeze({
    ...baseFixedHemodynamics,
    pressureShapePaRelativeToSvByCompartment: Object.freeze({
      ...baseFixedHemodynamics.pressureShapePaRelativeToSvByCompartment,
      RV: preARightVentricularTargetPressurePa
        - PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2
          .referenceConstruction.referenceCommonFillingPressureOffsetPa,
    }),
  });
  const initialLeftAtrialVolumeM3 = atrialMechanics.anatomy
    .phasicCavityVolumeM3ByAtrium.LA.preAtrialContraction;
  const initialRightAtrialVolumeM3 = atrialMechanics.anatomy
    .phasicCavityVolumeM3ByAtrium.RA.preAtrialContraction;
  const referenceCardiacPoolM3 =
    PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2
      .referenceConstruction.targetBloodVolumeM3ByPool.heart;
  const initialBiventricularPoolM3 = referenceCardiacPoolM3
    - initialLeftAtrialVolumeM3 - initialRightAtrialVolumeM3;
  const loadedBiventricularVolumeRatio =
    anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3
    / anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3;
  const initialRightVentricularVolumeM3 = initialBiventricularPoolM3
    / (1 + loadedBiventricularVolumeRatio);
  const initialLeftVentricularVolumeM3 = initialBiventricularPoolM3
    - initialRightVentricularVolumeM3;
  if (!(initialLeftVentricularVolumeM3 > 0)
    || !(initialRightVentricularVolumeM3 > 0)) {
    throw new Error("pre-A cardiac-pool construction left no ventricular blood");
  }
  const zeroFlows = inertialRecord(() => 0);
  const evaluateRelaxedMechanics: PhaseB1PreARelaxedMechanicsEvaluatorV2 =
    (unknowns) => {
      try {
        const atrialStrains = (["LA", "RA"] as const).map((atriumId) =>
          evaluateAtrialOneFiberGeometryV1(
            unknowns.chamberBloodVolumesM3[atriumId],
            atrialGeometryPriorByChamber[atriumId],
          ).fiberLogStrain);
        const [lower, upper] = atrialMechanics.compiledPassive.prior
          .supportedFiberLogStrainRange;
        if (atrialStrains.some((strain) => strain < lower || strain > upper)) {
          return Object.freeze({
            status: "inadmissible" as const,
            reason: "candidate atrial strain lies outside Moyer constitutive support",
          });
        }
        evaluatePublishedTriSegGeometryV1({
          leftVentricularCavityVolumeM3:
            unknowns.chamberBloodVolumesM3.LV,
          rightVentricularCavityVolumeM3:
            unknowns.chamberBloodVolumesM3.RV,
          septalMidwallCapVolumeM3:
            unknowns.triSegCoordinates.V_m_S,
          junctionRadiusM: unknowns.triSegCoordinates.y_m,
          walls: anatomy.walls,
        });
      } catch (error) {
        return Object.freeze({
          status: "inadmissible" as const,
          reason: `candidate geometry is outside the constitutive domain: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
      const targetPressurePa = bloodRecord((id) =>
          fixedHemodynamics.pressureShapePaRelativeToSvByCompartment[id]
          + unknowns.commonFillingPressureOffsetPa);
        const vascularVolumesM3 = vascularRecord((id) => {
          const parameters =
            fixedHemodynamics.vascularComplianceParametersByCompartment[id];
          return parameters.unstressedVolumeM3
            + parameters.complianceM3PerPa
              * (targetPressurePa[id] - parameters.externalPressurePa);
        });
        const bloodVolumesM3 = Object.freeze({
          ...unknowns.chamberBloodVolumesM3,
          ...vascularVolumesM3,
        }) as Readonly<Record<BloodCompartmentId, number>>;
        const relaxed = buildPhaseB1RelaxedEndpointAtDeclaredCoordinatesV2({
          timeSec: sourceEndpoint.timeSec,
          slsMode: sourceEndpoint.differentialState.slsMode,
          bloodVolumesM3,
          inertialFlowsM3PerSec: zeroFlows,
          atrialGeometryPriorByChamber,
          triSegWalls: anatomy.walls,
          wallMaterialBinding,
          triSegCoordinates: unknowns.triSegCoordinates,
        });
        const closedLoop = evaluateFourChamberClosedLoopSameTimeLevelV1({
          state: {
            timeSec: relaxed.endpoint.timeSec,
            bloodVolumesM3,
            inertialFlowsM3PerSec: zeroFlows,
            triSegCoordinates: unknowns.triSegCoordinates,
          },
          atrialGeometryPriorByChamber,
          triSegWalls: anatomy.walls,
          finiteThicknessTriSegBendingPriorV2:
            ventricularMechanics.finiteThicknessBendingPrior,
          vascularComplianceParametersByCompartment:
            fixedHemodynamics.vascularComplianceParametersByCompartment,
          peripheralResistancePaSecPerM3ByFlow:
            sourcePhysiologyCase.overlay.peripheralResistancePaSecPerM3ByFlow,
          valveLossParametersByFlow:
            sourcePhysiologyCase.overlay.valveLossParametersByFlow,
          inletLossParametersByFlow:
            sourcePhysiologyCase.overlay.inletLossParametersByFlow,
          pericardiumParameters,
          intrathoracicPressurePa: sourceClosedLoop.intrathoracicPressurePa,
          evaluateWall: ({ wallId, fiberLogStrain }) => {
            const material = relaxed.wallMaterialByWall[wallId];
            if (Math.abs(material.fiberLogStrain - fiberLogStrain) > 1e-12) {
              throw new Error(`${wallId} relaxed wall geometry replay drifted`);
            }
            return Object.freeze({
              equilibriumPassive: material.passive,
              activeKirchhoffStressPa: material.wallActiveKirchhoffStressPa,
              activeStressTimeDerivativePaPerSec: 0,
              slsOverstressPa: material.sls.overstressPa,
              slsStoredEnergyJ: material.sls.storedEnergyDensityJPerM3
                * wallReferenceMaterialVolumeM3(wallId, atrialMechanics, anatomy),
              slsPhysicalDissipationW: 0,
              totalKirchhoffStressPa: material.totalWallKirchhoffStressPa,
              totalTangentAtFixedInternalStatePa:
                material.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
            });
          },
        });
        const residual = getRuntimeTriSegEquilibriumResidualV2(closedLoop);
      return Object.freeze({
          status: "ok" as const,
          chamberAbsolutePressurePa: closedLoop.chamberAbsolutePressurePa,
          triSegResidualNPerM: Object.freeze({
            axial: residual.axialNPerM,
            radial: residual.radialNPerM,
          }),
          materialConsistency: Object.freeze({
            maximumAbsoluteLandRhsPerSec:
              relaxed.audit.maximumAbsoluteLandRhsPerSec,
            maximumAbsoluteSlsOverstressPa:
              relaxed.audit.maximumAbsoluteSlsOverstressPa,
            importedOldLandHistory: false as const,
            importedOldSlsHistory: false as const,
          }),
          diagnostic: Object.freeze({
            energyConjugateTriSeg: closedLoop.energyConjugateTriSeg,
            taylorDiagnostic: closedLoop.triSegOracle,
            pericardium: closedLoop.pericardium,
          }),
      });
    };

  const operatingPointResult = solvePhaseB1PreAOperatingPointV2({
    totalBloodVolumeM3: sourcePhysiologyCase.overlay.totalBloodVolumeM3,
    pressureShapePaRelativeToSvByCompartment:
      fixedHemodynamics.pressureShapePaRelativeToSvByCompartment,
    vascularComplianceParametersByCompartment:
      fixedHemodynamics.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      sourcePhysiologyCase.overlay.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow:
      sourcePhysiologyCase.overlay.valveLossParametersByFlow,
    inletLossParametersByFlow:
      sourcePhysiologyCase.overlay.inletLossParametersByFlow,
    initialGuess: Object.freeze({
      chamberBloodVolumesM3: Object.freeze({
        LA: initialLeftAtrialVolumeM3,
        LV: initialLeftVentricularVolumeM3,
        RA: initialRightAtrialVolumeM3,
        RV: initialRightVentricularVolumeM3,
      }),
      triSegCoordinates: Object.freeze({
        V_m_S:
          anatomy.loadedGeometryAnchor.coordinates.septalMidwallCapVolumeM3,
        y_m: anatomy.loadedGeometryAnchor.coordinates.junctionRadiusM,
      }),
      commonFillingPressureOffsetPa:
        PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2
          .referenceConstruction.referenceCommonFillingPressureOffsetPa,
    }),
    numericalPolicy: Object.freeze({
      triSegResidualScaleNPerM: 1_000,
      chamberPressureResidualScalePa: 10 * PA_PER_MMHG,
      newtonOptions: Object.freeze({
        maxIterations: 60,
        residualInfinityTolerance: 1e-9,
        updateInfinityTolerance: 1e-9,
        maxLineSearchBacktracks: 36,
      }),
    }),
    evaluateRelaxedMechanics,
  });
  if (operatingPointResult.converged === false) {
    throw new Error(
      `mechanistic-rebuild pre-A operating point failed: ${operatingPointResult.reason}: ${operatingPointResult.message}`,
    );
  }
  const operatingPoint = operatingPointResult;
  const initialization = buildPhaseB1RelaxedEndpointAtDeclaredCoordinatesV2({
    timeSec: sourceEndpoint.timeSec,
    slsMode: sourceEndpoint.differentialState.slsMode,
    bloodVolumesM3: operatingPoint.bloodVolumesM3,
    inertialFlowsM3PerSec: operatingPoint.inertialFlowsM3PerSec,
    atrialGeometryPriorByChamber,
    triSegWalls: anatomy.walls,
    wallMaterialBinding,
    triSegCoordinates: operatingPoint.unknowns.triSegCoordinates,
  });

  const newtonScaleRegistry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    buildFourChamberNewtonScaleRegistryV1({
      referenceBloodVolumesM3:
        initialization.endpoint.differentialState.bloodVolumesM3,
      landDistortionCoefficientsByWall: wallRecord((wallId) => {
        const derived = wallMaterialBinding.runtimeByWall[wallId]
          .landEquationParameters.derived;
        return Object.freeze({ Aw: derived.Aw, As: derived.As });
      }),
      tissueStressInputsByWall: wallRecord((wallId) => {
        const material = wallMaterialBinding.runtimeByWall[wallId];
        const passiveScales = getPhaseB1WallPassiveStressScalesV1(material);
        return Object.freeze({
          landReferenceTensionPa:
            material.landEquationParameters.values.Tref,
          passiveTensileStressScalePa:
            passiveScales.tensileStressScalePa,
          compressionStressScalePa:
            passiveScales.compressionStressScalePa,
        });
      }),
      triSegInputsByWall: triSegRecord((wallId) => Object.freeze({
        wallReferenceMaterialVolumeM3:
          anatomy.walls[wallId].wallMaterialVolumeM3,
        midwallReferenceAreaM2:
          anatomy.walls[wallId].referenceMidwallAreaM2,
      })),
      referenceCenteredGeometryOffsets: Object.freeze({
        septalMidwallVolumeM3: initialization.endpoint.triSegCoordinates.V_m_S,
        junctionRadiusM: initialization.endpoint.triSegCoordinates.y_m,
        evidenceId: "mechanistic-rebuild-v2-pre-a-seven-dimensional-root",
      }),
    }, input.sha256Hex),
  );
  const model: PhaseB1EventFreeMonolithicModelV1 = Object.freeze({
    modelId: PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
    closedLoopParameters: Object.freeze({
      atrialGeometryPriorByChamber,
      triSegWalls: anatomy.walls,
      finiteThicknessTriSegBendingPriorV2:
        ventricularMechanics.finiteThicknessBendingPrior,
      vascularComplianceParametersByCompartment:
        fixedHemodynamics.vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow:
        sourcePhysiologyCase.overlay.peripheralResistancePaSecPerM3ByFlow,
      valveLossParametersByFlow:
        sourcePhysiologyCase.overlay.valveLossParametersByFlow,
      inletLossParametersByFlow:
        sourcePhysiologyCase.overlay.inletLossParametersByFlow,
      pericardiumParameters,
      intrathoracicPressurePa: sourceClosedLoop.intrathoracicPressurePa,
    }),
    newtonScaleRegistry,
    candidatePriorOnly: true,
    physiologicalValidation: false,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    wallMaterialBinding,
    initialization.endpoint,
  );
  if (initialEvaluation.closedLoop.energyConjugateTriSeg === undefined) {
    throw new Error("mechanistic-rebuild runtime did not select finite-thickness TriSeg");
  }
  const runtimeResidual = getRuntimeTriSegEquilibriumResidualV2(
    initialEvaluation.closedLoop,
  );
  const initialMaximumAbsoluteInertialFlowAccelerationM3PerSec2 = Math.max(
    ...Object.values(initialEvaluation.closedLoop.inertialMomentum)
      .map((momentum) => Math.abs(momentum.flowAccelerationM3PerSec2)),
  );
  const initialMaximumAbsoluteAtrialFiberLogStrain = Math.max(
    Math.abs(initialization.audit.fiberLogStrainByWall.LA),
    Math.abs(initialization.audit.fiberLogStrainByWall.RA),
  );
  const initialMaximumAtrialLandStretch = Math.max(
    initialization.audit.landStretchByWall.LA,
    initialization.audit.landStretchByWall.RA,
  );
  const initialTriSegResidualScaledByFinalRegistry = Math.max(
    Math.abs(runtimeResidual.axialNPerM),
    Math.abs(runtimeResidual.radialNPerM),
  ) / newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM;
  const pressureReplayDifferencesPa = [
    ...(["LA", "LV", "RA", "RV"] as const).map((id) =>
      initialEvaluation.closedLoop.chamberAbsolutePressurePa[id]
      - operatingPoint.targetAbsolutePressurePaByCompartment[id]),
    ...(["SA", "SV", "PA", "PV"] as const).map((id) =>
      initialEvaluation.closedLoop.vascular[id].absolutePressurePa
      - operatingPoint.targetAbsolutePressurePaByCompartment[id]),
  ];
  const maximumAbsoluteInitialPressureReplayDifferencePa = Math.max(
    ...pressureReplayDifferencesPa.map(Math.abs),
  );
  const destinationTotalBloodVolumeM3 = Object.values(
    initialization.endpoint.differentialState.bloodVolumesM3,
  ).reduce((sum, volume) => sum + volume, 0);
  const totalBloodVolumeDifferenceM3 = destinationTotalBloodVolumeM3
    - sourcePhysiologyCase.overlay.totalBloodVolumeM3;
  const totalBloodVolumeRelativeDifference = Math.abs(totalBloodVolumeDifferenceM3)
    / sourcePhysiologyCase.overlay.totalBloodVolumeM3;
  const cmrAnchorPericardium = evaluateCommonPericardiumV1(
    pericardiumParameters,
    cmrAnchorIntrapericardialHeartVolumeM3,
  );
  const declaredNormalVolumeRangeM3ByChamber = Object.freeze({
    LA: Object.freeze([
      atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.LA.minimum,
      atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.LA.maximum,
    ] as const),
    LV: Object.freeze([
      ventricularMechanics.cmrAnchor.leftVentricle.endSystolicVolumeM3.center,
      ventricularMechanics.cmrAnchor.leftVentricle.endDiastolicVolumeM3.center,
    ] as const),
    RA: Object.freeze([
      atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.RA.minimum,
      atrialMechanics.anatomy.phasicCavityVolumeM3ByAtrium.RA.maximum,
    ] as const),
    RV: Object.freeze([
      ventricularMechanics.cmrAnchor.rightVentricle.endSystolicVolumeM3.center,
      ventricularMechanics.cmrAnchor.rightVentricle.endDiastolicVolumeM3.center,
    ] as const),
  });
  const initialChamberVolumeM3 = Object.freeze({
    LA: initialization.endpoint.differentialState.bloodVolumesM3.LA,
    LV: initialization.endpoint.differentialState.bloodVolumesM3.LV,
    RA: initialization.endpoint.differentialState.bloodVolumesM3.RA,
    RV: initialization.endpoint.differentialState.bloodVolumesM3.RV,
  });
  const initialChamberVolumesWithinDeclaredRanges =
    (["LA", "LV", "RA", "RV"] as const).every((id) => {
      const [lower, upper] = declaredNormalVolumeRangeM3ByChamber[id];
      return initialChamberVolumeM3[id] >= lower
        && initialChamberVolumeM3[id] <= upper;
    });
  const initialGuessCardiacPoolClosureErrorM3 =
    initialLeftAtrialVolumeM3 + initialLeftVentricularVolumeM3
    + initialRightAtrialVolumeM3 + initialRightVentricularVolumeM3
    - referenceCardiacPoolM3;
  const solvedCardiacPoolM3 = Object.values(initialChamberVolumeM3)
    .reduce((sum, volume) => sum + volume, 0);
  const solvedCardiacPoolDifferenceFromReferenceM3 =
    solvedCardiacPoolM3 - referenceCardiacPoolM3;
  const casePass = initialization.audit.pass
    && atrialMechanics.audit.pass
    && ventricularMechanics.audit.pass
    && activeTissueClassPrior.atrialClass.allOtherPrimitiveValuesBitExact
    && activeTissueClassPrior.atrialClass.derivedKineticsBitExact
    && activeTissueClassPrior.atrialClass.saturationMapping
      .absoluteReplayErrorPa <= 1e-9
    && operatingPoint.audit.pass
    && newtonScaleRegistry.fixedBeforeRun
    && newtonScaleRegistry.adaptiveRescaling === false
    && initialTriSegResidualScaledByFinalRegistry <= 1e-8
    && totalBloodVolumeRelativeDifference <= 4096 * Number.EPSILON
    && maximumAbsoluteInitialPressureReplayDifferencePa <= 1e-5
    && initialMaximumAbsoluteInertialFlowAccelerationM3PerSec2 <= 1e-10
    && initialEvaluation.closedLoop.pericardium.excessPressurePa <= 1e-9
    && cmrAnchorPericardium.excessPressurePa <= 1e-9
    && initialChamberVolumesWithinDeclaredRanges
    && Math.abs(initialGuessCardiacPoolClosureErrorM3) <= 64 * Number.EPSILON;
  if (!casePass) {
    throw new Error(
      `mechanistic-rebuild case construction audit failed: ${JSON.stringify({
        initializationPass: initialization.audit.pass,
        atrialMechanicsPass: atrialMechanics.audit.pass,
        ventricularMechanicsPass: ventricularMechanics.audit.pass,
        atrialActiveSaturationReplayErrorPa:
          activeTissueClassPrior.atrialClass.saturationMapping
            .absoluteReplayErrorPa,
        operatingPointPass: operatingPoint.audit.pass,
        fixedNewtonRegistry: newtonScaleRegistry.fixedBeforeRun,
        adaptiveRescaling: newtonScaleRegistry.adaptiveRescaling,
        initialTriSegResidualScaledByFinalRegistry,
        totalBloodVolumeRelativeDifference,
        maximumAbsoluteInitialPressureReplayDifferencePa,
        initialMaximumAbsoluteInertialFlowAccelerationM3PerSec2,
        initialPericardialExcessPressurePa:
          initialEvaluation.closedLoop.pericardium.excessPressurePa,
        cmrAnchorPericardialExcessPressurePa:
          cmrAnchorPericardium.excessPressurePa,
        initialChamberVolumeM3,
        declaredNormalVolumeRangeM3ByChamber,
        initialChamberVolumesWithinDeclaredRanges,
        solvedCardiacPoolM3,
        solvedCardiacPoolDifferenceFromReferenceM3,
        initialGuessCardiacPoolClosureErrorM3,
      })}`,
    );
  }
  const configurationContentSha256 = computeCanonicalSha256({
    caseId: PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_ID,
    policy: PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_POLICY,
    sourceOverlayContentSha256: sourcePhysiologyCase.overlayContentSha256,
    atrialCandidateInput: atrialMechanics.input,
    ventricularCandidateInput: ventricularMechanics.input,
    activeTissueClassPriorContentSha256:
      activeTissueClassPrior.contentSha256,
    ventricularPreAPassiveConstruction:
      ventricularMechanics.preAPassiveConstruction,
    triSegWalls: anatomy.walls,
    finiteThicknessBendingPrior:
      ventricularMechanics.finiteThicknessBendingPrior,
    wallMaterialBindingContentSha256: wallMaterialBinding.contentSha256,
    operatingPointUnknowns: operatingPoint.unknowns,
    initialEndpoint: initialization.endpoint,
    pericardiumParameters,
    closedLoopParameters: model.closedLoopParameters,
    newtonRegistryContentSha256: newtonScaleRegistry.registryContentSha256,
  }, input.sha256Hex);

  return Object.freeze({
    caseId: PHASE_B1_MECHANISTIC_REBUILD_CASE_V2_ID,
    sourcePhysiologyCase,
    atrialMechanics,
    ventricularMechanics,
    activeTissueClassPrior,
    wallMaterialBinding,
    operatingPoint,
    initialization,
    pericardiumParameters,
    model,
    initialEvaluation,
    configurationContentSha256,
    audit: Object.freeze({
      bodySurfaceAreaM2: bsa,
      postAEdpvrCalibrationAnchorPa,
      preARightVentricularTargetPressurePa,
      preARightVentricularTargetSource:
        ventricularMechanics.preAPassiveConstruction
          .rightVentricularPressureSource,
      initialChamberPressurePa: Object.freeze({
        ...initialEvaluation.closedLoop.chamberAbsolutePressurePa,
      }),
      targetInitialChamberPressurePa: Object.freeze({
        LA: operatingPoint.targetAbsolutePressurePaByCompartment.LA,
        LV: operatingPoint.targetAbsolutePressurePaByCompartment.LV,
        RA: operatingPoint.targetAbsolutePressurePaByCompartment.RA,
        RV: operatingPoint.targetAbsolutePressurePaByCompartment.RV,
      }),
      initialVascularPressurePa: Object.freeze({
        SA: initialEvaluation.closedLoop.vascular.SA.absolutePressurePa,
        SV: initialEvaluation.closedLoop.vascular.SV.absolutePressurePa,
        PA: initialEvaluation.closedLoop.vascular.PA.absolutePressurePa,
        PV: initialEvaluation.closedLoop.vascular.PV.absolutePressurePa,
      }),
      initialPericardialPressurePa:
        initialEvaluation.closedLoop.pericardium.excessPressurePa,
      cmrAnchorPericardialPressurePa:
        cmrAnchorPericardium.excessPressurePa,
      maximumAbsoluteInitialPressureReplayDifferencePa,
      totalBloodVolumeDifferenceM3,
      totalBloodVolumeRelativeDifference,
      initialMaximumAbsoluteInertialFlowAccelerationM3PerSec2,
      initialMaximumAbsoluteAtrialFiberLogStrain,
      initialMaximumAtrialLandStretch,
      initialChamberVolumeM3,
      declaredNormalVolumeRangeM3ByChamber,
      initialChamberVolumesWithinDeclaredRanges: true as const,
      referenceCardiacPoolM3,
      solvedCardiacPoolM3,
      solvedCardiacPoolDifferenceFromReferenceM3,
      chamberVolumeGateScope: "normal-bsa-center-phase-envelope-only",
      patientVariantVolumeGateMustDeriveFromVariantAnatomy: true,
      initialGuessCardiacPoolClosureErrorM3,
      initialTriSegResidualScaledByFinalRegistry,
      finiteThicknessTriSegRuntimeOwner: true as const,
      publishedTaylorDiagnosticOnly: true as const,
      initialCirculatoryStationarityClaimed: false as const,
      wallMassAndReferenceGeometryChangedTogether: true as const,
      landAndSlsReinitializedAtNewGeometry: true as const,
      newtonRegistryCompiledAfterStructuralChange: true as const,
      pericardiumUsedToRaiseSystemicPressure: false as const,
      oldGeometryDependentMaterialHistoryImported: false as const,
      oldQuiescentInverseAtrialGeometryImported: false as const,
      wallWiseActiveGainApplied: false as const,
      sameAtrialActiveMaterialAppliedToLaAndRa: true as const,
      atrialActiveForceScaleSourceDoi:
        "10.1016/j.yjmcc.2025.12.001" as const,
      atrialActiveTrefPa:
        activeTissueClassPrior.atrialClass.saturationMapping.mappedTrefPa,
      ventricularActiveTrefPa: 120_000 as const,
      moyerTmaxUsedAsLandTref: false as const,
      calciumTraceClaimedAsMeasured: false as const,
      reconstructedVentricularCalciumAppliedInCanonicalCase: false as const,
      reconstructedVentricularCalciumAvailableAsV5Ablation: true as const,
      chamberPressureGainApplied: false as const,
      pvLoopShapeUsedForFit: false as const,
      normalOperatingPointClaimed: false as const,
      physiologicalValidationClaimed: false as const,
      constructionConsistencyPass: true as const,
    }),
    caseConstructionConsistencyPass: true as const,
    candidatePriorOnly: true as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  });
}

function wallReferenceMaterialVolumeM3(
  wallId: FourChamberWallId,
  atrialMechanics: NormalAdultAtrialMechanicsCandidateV3,
  anatomy: NormalAdultVentricularMechanicsCandidateV2["anatomy"],
): number {
  if (wallId === "LA" || wallId === "RA") {
    return atrialMechanics.geometryPriorByAtrium[wallId]
      .wallReferenceMaterialVolumeM3;
  }
  return anatomy.walls[wallId].wallMaterialVolumeM3;
}

function bloodRecord<T>(
  build: (id: BloodCompartmentId) => T,
): Readonly<Record<BloodCompartmentId, T>> {
  const ids = ["LA", "LV", "SA", "SV", "RA", "RV", "PA", "PV"] as const;
  return Object.freeze(Object.fromEntries(ids.map((id) => [id, build(id)]))
  ) as Readonly<Record<BloodCompartmentId, T>>;
}

function vascularRecord<T>(
  build: (id: "SA" | "SV" | "PA" | "PV") => T,
): Readonly<Record<"SA" | "SV" | "PA" | "PV", T>> {
  const ids = ["SA", "SV", "PA", "PV"] as const;
  return Object.freeze(Object.fromEntries(ids.map((id) => [id, build(id)]))
  ) as Readonly<Record<"SA" | "SV" | "PA" | "PV", T>>;
}

function inertialRecord<T>(
  build: (id: InertialFlowId) => T,
): Readonly<Record<InertialFlowId, T>> {
  return Object.freeze(Object.fromEntries(
    INERTIAL_FLOW_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<InertialFlowId, T>>;
}

function wallRecord<T>(
  build: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<FourChamberWallId, T>>;
}

function triSegRecord<T>(
  build: (wallId: TriSegWallId) => T,
): Readonly<Record<TriSegWallId, T>> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<TriSegWallId, T>>;
}
