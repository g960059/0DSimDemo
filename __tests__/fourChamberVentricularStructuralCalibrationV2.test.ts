import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1,
  TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1,
  evaluateKlotz2006NormalizedEdpvrTargetV1,
  invertKlotz2006SinglePointEdpvrV1,
  partitionCmrVentricularMassToTriSegWallsV1,
} from "@/engine/myocardium/fourChamberV1/anatomy/ventricularAnatomyEdpvrTargetsV1";
import {
  VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_ID,
  VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_CLAIM_BOUNDARY,
  VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID,
  buildVentricularStructuralAnatomyV2,
  evaluateVentricularIsovolumicPressureTransferV2,
  evaluateVentricularIsovolumicPressureTransferV3,
  fitSharedVentricularPassiveEnergyScaleV2,
} from "@/engine/myocardium/fourChamberV1/calibration/ventricularStructuralCalibrationV2";
import {
  compilePhaseA1LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import {
  PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  compileEquilibriumPassivePriorV1,
  evaluateEquilibriumPassiveEnergyV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  stepOneStateAlphaVSlsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import { buildPhaseA1TissueManifestBundleV1 } from
  "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID,
  buildPhaseB1MechanisticRebuildWallMaterialBindingV2,
  buildPhaseB1WallMaterialBindingV1,
  buildPhaseB1WholeOrganVentricularWallMaterialBindingV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  buildPhaseB1MechanisticRebuildInitializationV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildInitializationV2";
import {
  createFiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  auditStableEnergyConjugateFiniteThicknessTriSegMultiStartV2,
  solveEnergyConjugateFiniteThicknessTriSegRootV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegRootV2";
import { buildPhaseB1SyntheticClosedLoopScaffoldV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2_ID,
  land2017ParameterSetHashInput,
  stableHash,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

const PA_PER_MMHG = 133.322387415;

describe("four-chamber ventricular structural calibration v2", () => {
  it("owns wall mass separately and analytically inverts loaded geometry to material reference areas", () => {
    const anatomy = buildNormalAdultCandidate();

    expect(anatomy.calibrationId).toBe(VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID);
    expect(anatomy.maximumAbsoluteTargetLogStrainReplayError)
      .toBeLessThan(128 * Number.EPSILON);
    expect(anatomy.referenceAreasAreLoadedCavityAreas).toBe(false);
    expect(anatomy.referenceAreasAreConstitutiveMaterialReferences).toBe(true);
    expect(anatomy.stressFreeUnloadedCoupledGeometryEstablished).toBe(false);
    expect(anatomy.acuteBeatWallRemodelingAllowed).toBe(false);
    expect(anatomy.physiologicalValidationClaimed).toBe(false);

    expect(anatomy.walls.LVFW.wallMaterialVolumeM3)
      .toBeCloseTo(67.07543664065403e-6, 15);
    expect(anatomy.walls.SEP.wallMaterialVolumeM3)
      .toBeCloseTo(35.77356620834881e-6, 15);
    expect(anatomy.walls.RVFW.wallMaterialVolumeM3)
      .toBeCloseTo(36.08736942070275e-6, 15);
    expect(anatomy.walls.LVFW.referenceMidwallAreaM2)
      .toBeCloseTo(93.54352893865039e-4, 15);
    expect(anatomy.walls.SEP.referenceMidwallAreaM2)
      .toBeCloseTo(39.65081992591075e-4, 15);
    expect(anatomy.walls.RVFW.referenceMidwallAreaM2)
      .toBeCloseTo(129.11294586037828e-4, 15);

    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(anatomy.replayGeometry.walls[wallId].geometryStretch)
        .toBeCloseTo(1.1, 14);
    }
  });

  it("isolates geometry-to-pressure transfer and scales exactly with a shared prescribed stress", () => {
    const anatomy = buildNormalAdultCandidate();
    const cellular = evaluateVentricularIsovolumicPressureTransferV2({
      anatomy,
      leftVentricularCavityVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
      prescribedKirchhoffStressPaByWall: {
        LVFW: 40_500,
        SEP: 40_500,
        RVFW: 40_500,
      },
    });
    const wholeOrgan = evaluateVentricularIsovolumicPressureTransferV2({
      anatomy,
      leftVentricularCavityVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
      prescribedKirchhoffStressPaByWall: {
        LVFW: 120_000,
        SEP: 120_000,
        RVFW: 120_000,
      },
      initialCoordinates: cellular.coordinates,
    });

    expect(cellular.leftVentricularTransmuralPressurePa).toBeGreaterThan(0);
    expect(cellular.rightVentricularTransmuralPressurePa).toBeGreaterThan(0);
    expect(wholeOrgan.leftVentricularTransmuralPressurePa
      / cellular.leftVentricularTransmuralPressurePa)
      .toBeCloseTo(120_000 / 40_500, 10);
    expect(wholeOrgan.rightVentricularTransmuralPressurePa
      / cellular.rightVentricularTransmuralPressurePa)
      .toBeCloseTo(120_000 / 40_500, 10);
    expect(wholeOrgan.coordinates.septalMidwallCapVolumeM3)
      .toBeCloseTo(cellular.coordinates.septalMidwallCapVolumeM3, 13);
    expect(wholeOrgan.coordinates.junctionRadiusM)
      .toBeCloseTo(cellular.coordinates.junctionRadiusM, 13);
    expect(wholeOrgan.interpretation)
      .toBe("geometry-to-pressure-transfer-capacity-not-a-predicted-land-twitch");
  });

  it("replays controlled Land-source stress through the finite-thickness runtime owner without a pressure gain", () => {
    const anatomy = buildNormalAdultCandidate();
    const fit = buildNormalPassiveFit(anatomy);
    const bendingPrior = buildBendingPrior(anatomy);
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const ventricularAdapter = compilePhaseA1LandWallAdapterContextV1(
      bundle,
      "ventricular",
      sha256,
    );
    const sourceActiveNominalStressPaByWall = Object.freeze({
      LVFW: 120_000,
      SEP: 120_000,
      RVFW: 120_000,
    });
    const audit = evaluateVentricularIsovolumicPressureTransferV3({
      anatomy,
      passiveCalibration: fit,
      sourcePassivePrior:
        PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      bendingPrior,
      ventricularLandWallAdapterContext: ventricularAdapter,
      sourceActiveStressControlId:
        "land2017-whole-organ-120kpa-controlled-source-nominal-benchmark-not-twitch",
      sourceActiveNominalStressPaByWall,
    });

    expect(audit.diagnosticId)
      .toBe(VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_ID);
    expect(audit.sourceActiveStressControlId)
      .toBe("land2017-whole-organ-120kpa-controlled-source-nominal-benchmark-not-twitch");
    expect(audit.nodes.map((node) =>
      node.leftVentricularCavityVolumeM3 / 1e-6))
      .toEqual([115, 130, 144.4, 165]);
    expect(audit.passiveFitNodeRvToLvVolumeRatio).toBeCloseTo(
      anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
        / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      14,
    );
    expect(audit.passiveFitNodeRvToLvVolumeRatioConstant).toBe(true);
    expect(audit.claimBoundary)
      .toBe(VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_CLAIM_BOUNDARY);
    expect(Object.isFrozen(audit.claimBoundary)).toBe(true);
    expect(audit.claimBoundary.activeLoadControl)
      .toBe("fixed-wall-kirchhoff-dead-load-mapped-on-passive-root");
    expect(audit.claimBoundary.loadingPath)
      .toBe("passive-fit-proportional-rv-lv-inflation-nodes-only");
    expect(audit.claimBoundary.terminalOrRuntimeTrajectoryReplayed).toBe(false);
    expect(audit.claimBoundary.landActiveStressOrTangentReevaluatedDuringRoot)
      .toBe(false);
    expect(audit.claimBoundary.slsOverstressOrTangentIncluded).toBe(false);
    expect(audit.claimBoundary.monolithicBackwardEulerSchurTangentEvaluated)
      .toBe(false);
    expect(audit.claimBoundary.rejectedSidePseudoArclengthContinuationUsed)
      .toBe(false);
    expect(audit.claimBoundary.rejectedSideMultiStartUsed).toBe(false);
    expect(audit.claimBoundary.newtonRejectionProvesPhysicalFold).toBe(false);
    expect(audit.claimBoundary
      .solverAcceptanceBoundaryIsClosedLoopContractilityLimit)
      .toBe(false);
    expect(audit.claimBoundary.solverAcceptanceBoundaryIsEndSystolicVolumeLimit)
      .toBe(false);
    expect(audit.everyNodeEnergyConjugateMechanicsOwnerReplayed).toBe(true);
    expect(audit.everyPassiveAndSolverAcceptedRootStrictLocalMinimum).toBe(true);
    expect(audit.maximumAbsolutePressureReconstructionResidualPa)
      .toBeLessThan(1e-9);
    expect(audit.sourceToWallMappingUsesCanonicalPowerConjugateAdapter)
      .toBe(true);
    expect(audit.wallWiseFreeGainAllowed).toBe(false);
    expect(audit.chamberPressureGainApplied).toBe(false);
    expect(audit.postMechanicsPressureMultiplier).toBe(1);
    expect(audit.everyRequestedControlledDeadLoadTargetReachedBySolver)
      .toBe(audit.nodes.every((node) =>
        node.requestedControlledDeadLoadTargetReachedBySolver));
    expect(audit.minimumSolverAcceptedControlledStressFractionLowerBracketEndpoint)
      .toBe(Math.min(...audit.nodes.map((node) =>
        node.solverAcceptedControlledStressFractionLowerBracketEndpoint)));
    expect(audit.slsOverstressIncluded).toBe(false);
    expect(audit.pericardialPressureIncluded).toBe(false);
    expect(audit.diagnosticOnly).toBe(true);
    expect(audit.physiologicalValidationClaimed).toBe(false);

    audit.nodes.forEach((node, index) => {
      const fitNode = fit.nodes[index];
      expect(node.rightVentricularCavityVolumeM3
        / node.leftVentricularCavityVolumeM3)
        .toBeCloseTo(audit.passiveFitNodeRvToLvVolumeRatio, 14);
      expect(node.passiveOnlyCavityTransmuralPressuresPa.LV)
        .toBeCloseTo(fitNode.fittedLeftVentricularPressurePa, 8);
      expect(node.passiveOnlyCavityTransmuralPressuresPa.RV)
        .toBeCloseTo(fitNode.fittedRightVentricularPressurePa, 8);
      expect(node.passiveRootPotentialStability.positiveDefinite).toBe(true);
      expect(node.solverAcceptedRootPotentialStability.positiveDefinite)
        .toBe(true);
      expect(node.passiveRootPotentialStability.classification)
        .toBe("strict-local-potential-minimum");
      expect(node.solverAcceptedRootPotentialStability.classification)
        .toBe("strict-local-potential-minimum");
      expect(node.passiveRootScaledResidualInfinityNorm).toBeLessThan(1e-8);
      expect(node.solverAcceptedRootScaledResidualInfinityNorm)
        .toBeLessThan(1e-8);
      expect(node.solverAcceptedIncrementalLeftVentricularPressurePa)
        .toBeCloseTo(
          node.solverAcceptedCavityTransmuralPressuresPa.LV
            - node.passiveOnlyCavityTransmuralPressuresPa.LV,
          10,
        );
      expect(node.solverAcceptedControlledActiveMembraneLeftVentricularPressurePa)
        .toBe(node.leftVentricularPressureContribution
          .controlledActiveMembranePressurePa);
      expect(node.solverAcceptedIncrementalLeftVentricularPressureMmHg)
        .toBeCloseTo(
          node.solverAcceptedIncrementalLeftVentricularPressurePa
            / PA_PER_MMHG,
          12,
        );
      expect(Math.abs(
        node.leftVentricularPressureContribution.reconstructionResidualPa,
      ))
        .toBeLessThan(1e-9);
      expect(node.leftVentricularPressureContribution
        .directSolverRootTotalPressurePa)
        .toBe(node.solverAcceptedCavityTransmuralPressuresPa.LV);
      expect(Math.abs(
        node.rightVentricularPressureContribution.reconstructionResidualPa,
      ))
        .toBeLessThan(1e-9);
      expect(node.chamberPressureGainApplied).toBe(false);
      expect(node.postMechanicsPressureMultiplier).toBe(1);
      expect(node.publishedTaylorUsedForPressureOrRoot).toBe(false);
      for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
        const mapping = node.activeWallStressMappingByWall[wallId];
        expect(mapping.sourceActiveNominalStressPa)
          .toBe(sourceActiveNominalStressPaByWall[wallId]);
        expect(mapping.wallActiveKirchhoffStressPa).toBeCloseTo(
          mapping.landStretch * mapping.chiOrient * mapping.fViable
            * mapping.sourceActiveNominalStressPa,
          10,
        );
        expect(mapping.freeWallStressGainApplied).toBe(false);
        expect(mapping.controlledWallKirchhoffStressHeldFixedDuringSolverRoot)
          .toBe(true);
        expect(node.requestedActiveKirchhoffStressPaByWall[wallId])
          .toBe(mapping.wallActiveKirchhoffStressPa);
        expect(node.solverAcceptedScaledSourceStressLabelPaByWall[wallId])
          .toBeCloseTo(
            node.solverAcceptedControlledStressFractionLowerBracketEndpoint
              * mapping.sourceActiveNominalStressPa,
            10,
        );
        expect(node.solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall[wallId])
          .toBeCloseTo(
            node.solverAcceptedControlledStressFractionLowerBracketEndpoint
              * mapping.wallActiveKirchhoffStressPa,
            10,
          );
        expect(node.solverAcceptedTotalKirchhoffStressPaByWall[wallId])
          .toBeCloseTo(
            node.passiveKirchhoffStressPaByWall[wallId]
              + node.solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall[wallId],
            10,
          );
      }
      const accepted =
        node.solverAcceptedControlledStressFractionLowerBracketEndpoint;
      expect(accepted).toBeGreaterThanOrEqual(0);
      expect(accepted).toBeLessThanOrEqual(1);
      if (node.requestedControlledDeadLoadTargetReachedBySolver) {
        expect(accepted)
          .toBe(1);
        expect(node.solverRejectedControlledStressFractionUpperBracketEndpoint)
          .toBeNull();
        expect(node.solverTraceStressFractionBracketWidth).toBe(0);
        expect(node.solverRejectedRootReason).toBeNull();
        expect(node.solverBisectionIterationCount).toBe(0);
      } else {
        const rejected =
          node.solverRejectedControlledStressFractionUpperBracketEndpoint;
        if (rejected === null) {
          throw new Error("solver-rejected trace must expose its upper endpoint");
        }
        expect(rejected).toBeGreaterThan(accepted);
        expect(rejected).toBeLessThanOrEqual(1);
        expect(node.solverTraceStressFractionBracketWidth)
          .toBeCloseTo(rejected - accepted, 14);
        expect(node.solverRejectedRootReason).toEqual(expect.any(String));
        expect(node.solverRejectedRootReason?.length).toBeGreaterThan(0);
        expect(node.solverBisectionIterationCount).toBeGreaterThan(0);
      }
      expect(node.interpretation)
        .toBe("fixed-kirchhoff-dead-load-solver-trace-not-land-twitch-contractility-fold-or-esv-limit");
      expect(node.energyConjugateMechanicsOwnerReplayed).toBe(true);
      expect(node.controlledWallKirchhoffStressHeldFixedDuringSolverRoot)
        .toBe(true);
    });
  });

  it("rejects a passive-fit path that is not proportional in RV/LV volume", () => {
    const anatomy = buildNormalAdultCandidate();
    const bendingPrior = buildBendingPrior(anatomy);
    const klotz = invertKlotz2006SinglePointEdpvrV1({
      measuredEndDiastolicVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      measuredEndDiastolicPressurePa: 8 * PA_PER_MMHG,
    });
    const ratio = anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
      / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3;
    const nonProportionalFit = fitSharedVentricularPassiveEnergyScaleV2({
      anatomy,
      bendingPrior,
      basePassivePrior:
        PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      loadingPathProvenanceId: "test-nonproportional-rv-lv-volume-path",
      inflationPoints: [115, 130, 144.4, 165].map((volumeMl, index) => {
        const leftVentricularCavityVolumeM3 = volumeMl * 1e-6;
        return {
          leftVentricularCavityVolumeM3,
          rightVentricularCavityVolumeM3: ratio
            * (index === 1 ? 1.01 : 1)
            * leftVentricularCavityVolumeM3,
          targetLeftVentricularPressurePa:
            evaluateKlotz2006NormalizedEdpvrTargetV1(
              leftVentricularCavityVolumeM3,
              klotz,
            ).pressurePa,
        };
      }),
    });
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const ventricularAdapter = compilePhaseA1LandWallAdapterContextV1(
      bundle,
      "ventricular",
      sha256,
    );

    expect(() => evaluateVentricularIsovolumicPressureTransferV3({
      anatomy,
      passiveCalibration: nonProportionalFit,
      sourcePassivePrior:
        PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      bendingPrior,
      ventricularLandWallAdapterContext: ventricularAdapter,
      sourceActiveStressControlId: "test-dead-load-control",
      sourceActiveNominalStressPaByWall: {
        LVFW: 120_000,
        SEP: 120_000,
        RVFW: 120_000,
      },
    })).toThrow(/restricted to the passive-fit proportional RV\/LV/);
  });

  it("exposes the Land whole-organ Tref column without mutating cellular kinetics or the legacy source set", () => {
    const cellular = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const wholeOrgan = LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2;

    expect(cellular.values.Tref).toBe(40_500);
    expect(wholeOrgan.parameterSetId)
      .toBe(LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2_ID);
    expect(wholeOrgan.values.Tref).toBe(120_000);
    expect(wholeOrgan.parameterSetStableHash)
      .toBe(stableHash(land2017ParameterSetHashInput(wholeOrgan)));
    expect(wholeOrgan.parameterSetStableHash).not.toBe(cellular.parameterSetStableHash);

    for (const key of Object.keys(cellular.values) as (keyof typeof cellular.values)[]) {
      if (key !== "Tref") expect(wholeOrgan.values[key]).toBe(cellular.values[key]);
    }
    expect(wholeOrgan.derived).toEqual(cellular.derived);
    expect(wholeOrgan.sourceParameters.find((entry) => entry.parameter === "Tref"))
      .toMatchObject({
        original: { value: 120, unit: "kPa" },
        runtime: { value: 120_000, unit: "Pa" },
        location: "Appendix B model parameters table, whole-organ model column; Eq 53",
      });
    expect(Object.isFrozen(wholeOrgan.values)).toBe(true);
    expect(Object.isFrozen(wholeOrgan.sourceParameters)).toBe(true);
  });

  it("binds the whole-organ Land alternative to all three ventricular walls only", () => {
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const legacy = buildPhaseB1WallMaterialBindingV1(bundle, sha256);
    const candidate = buildPhaseB1WholeOrganVentricularWallMaterialBindingV2(
      bundle,
      sha256,
    );

    expect(candidate.contentSha256).not.toBe(legacy.contentSha256);
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(candidate.runtimeByWall[wallId].landEquationParameters)
        .toBe(LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2);
      expect(candidate.runtimeByWall[wallId].landEquationParameters.values.Tref)
        .toBe(120_000);
      expect(candidate.runtimeByWall[wallId].landWallAdapterContext.allowFreeGain)
        .toBe(false);
    }
    for (const wallId of ["LA", "RA"] as const) {
      expect(candidate.runtimeByWall[wallId].landEquationParameters)
        .toEqual(legacy.runtimeByWall[wallId].landEquationParameters);
      expect(candidate.runtimeByWall[wallId].landEquationParameters.values.Tref)
        .toBe(legacy.runtimeByWall[wallId].landEquationParameters.values.Tref);
    }
    expect(candidate.runtimeByWall.LVFW.passiveSls.compiledPassive.prior)
      .toEqual(legacy.runtimeByWall.LVFW.passiveSls.compiledPassive.prior);
    expect(candidate.runtimeByWall.LVFW.prescribedCalciumParameters)
      .toBe(legacy.runtimeByWall.LVFW.prescribedCalciumParameters);
  });

  it("binds Klotz only to the pure-tension energy, stress, and tangent while retaining independent compression and SLS", () => {
    const fit = buildNormalPassiveFit();
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const legacy = buildPhaseB1WallMaterialBindingV1(bundle, sha256);
    const candidate = buildPhaseB1MechanisticRebuildWallMaterialBindingV2(
      bundle,
      fit,
      sha256,
    );

    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      const material = candidate.runtimeByWall[wallId];
      expect(material.passiveSls.bindingId)
        .toBe(PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID);
      expect(material.passiveSls.compiledPassive.prior.APa)
        .toBeCloseTo(fit.scaledTensileAPa, 12);
      expect(material.passiveSls.compiledPassive.prior.B).toBe(fit.fixedPassiveB);
      expect(material.passiveSls.compiledPassive.prior.KCompEffPa)
        .toBeCloseTo(fit.retainedCompressionModulusPa, 12);
      expect(material.passiveSls.compiledPassive.prior.KCompEffPa)
        .toBe(legacy.runtimeByWall[wallId].passiveSls.compiledPassive.prior.KCompEffPa);
      expect(material.passiveSls.compiledSls)
        .toEqual(legacy.runtimeByWall[wallId].passiveSls.compiledSls);
      expect("calibration" in material.passiveSls).toBe(true);
      if ("calibration" in material.passiveSls) {
        expect(material.passiveSls.calibration).toMatchObject({
          sharedTensileEnergyScale: fit.sharedTensileEnergyScale,
          tensileEnergyStressAndTangentScaledTogether: true,
          compressionScaleIdentifiedByKlotz: false,
          slsScaleIdentifiedByKlotz: false,
          chamberPressureGainApplied: false,
          wallWiseScaleApplied: false,
        });
      }
      expect(material.landEquationParameters.values.Tref).toBe(120_000);
    }
    for (const wallId of ["LA", "RA"] as const) {
      expect(candidate.runtimeByWall[wallId].passiveSls.compiledPassive.prior)
        .toEqual(legacy.runtimeByWall[wallId].passiveSls.compiledPassive.prior);
    }
    expect(candidate.descriptor.wallBindings
      .filter((wall) => wall.tissueClass === "ventricular")
      .every((wall) => wall.passiveCalibration
        ?.tensileEnergyStressAndTangentScaledTogether === true)).toBe(true);
    expect(candidate.descriptor.wallBindings
      .filter((wall) => wall.tissueClass === "atrial")
      .every((wall) => wall.passiveCalibration === undefined)).toBe(true);

    const scale = fit.sharedTensileEnergyScale;
    const legacyPassive = legacy.runtimeByWall.LVFW.passiveSls.compiledPassive;
    const candidatePassive = candidate.runtimeByWall.LVFW.passiveSls.compiledPassive;
    for (const fiberLogStrain of [-0.05, -0.005]) {
      const source = evaluateEquilibriumPassiveEnergyV1(
        fiberLogStrain,
        legacyPassive,
      );
      const retained = evaluateEquilibriumPassiveEnergyV1(
        fiberLogStrain,
        candidatePassive,
      );
      expect(retained.storedEnergyDensityJPerM3)
        .toBeCloseTo(source.storedEnergyDensityJPerM3, 10);
      expect(retained.equilibriumKirchhoffStressPa)
        .toBeCloseTo(source.equilibriumKirchhoffStressPa, 10);
      expect(retained.dStressDFiberLogStrainPa)
        .toBeCloseTo(source.dStressDFiberLogStrainPa, 10);
    }
    for (const fiberLogStrain of [0.005, 0.05, 0.1]) {
      const source = evaluateEquilibriumPassiveEnergyV1(
        fiberLogStrain,
        legacyPassive,
      );
      const scaled = evaluateEquilibriumPassiveEnergyV1(
        fiberLogStrain,
        candidatePassive,
      );
      expect(scaled.storedEnergyDensityJPerM3)
        .toBeCloseTo(scale * source.storedEnergyDensityJPerM3, 10);
      expect(scaled.equilibriumKirchhoffStressPa)
        .toBeCloseTo(scale * source.equilibriumKirchhoffStressPa, 10);
      expect(scaled.dStressDFiberLogStrainPa)
        .toBeCloseTo(scale * source.dStressDFiberLogStrainPa, 10);
    }
    const legacySls = legacy.runtimeByWall.LVFW.passiveSls.compiledSls;
    const candidateSls = candidate.runtimeByWall.LVFW.passiveSls.compiledSls;
    expect(candidateSls).toEqual(legacySls);
    const slsStepInput = {
      previousFiberLogStrain: 0.04,
      previousAlphaV: 0.02,
      nextFiberLogStrain: 0.07,
      dtSec: 0.004,
    } as const;
    const legacyStep = stepOneStateAlphaVSlsBackwardEulerV1(
      slsStepInput,
      legacySls,
    );
    const candidateStep = stepOneStateAlphaVSlsBackwardEulerV1(
      slsStepInput,
      candidateSls,
    );
    expect(candidateStep.nextAlphaV).toBe(legacyStep.nextAlphaV);
    expect(candidateStep.nextOverstressPa)
      .toBeCloseTo(legacyStep.nextOverstressPa, 10);
    expect(candidateStep.totalDissipationIncrementDensityJPerM3)
      .toBeCloseTo(legacyStep.totalDissipationIncrementDensityJPerM3, 10);
    expect(candidateStep.discretePassivityIdentityResidualJPerM3)
      .toBeLessThan(1e-10);
  });

  it("rejects forged or source-prior-mismatched passive calibration artifacts", () => {
    const fit = buildNormalPassiveFit();
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    expect(() => buildPhaseB1MechanisticRebuildWallMaterialBindingV2(
      bundle,
      { ...fit },
      sha256,
    )).toThrow(/live canonical artifact/);

    const anatomy = buildNormalAdultCandidate();
    const klotz = invertKlotz2006SinglePointEdpvrV1({
      measuredEndDiastolicVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      measuredEndDiastolicPressurePa: 8 * PA_PER_MMHG,
    });
    const ratio = anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
      / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3;
    const mismatchedFit = fitSharedVentricularPassiveEnergyScaleV2({
      anatomy,
      bendingPrior: buildBendingPrior(anatomy),
      basePassivePrior: {
        ...PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
        priorId: "deliberately-mismatched-passive-prior",
      },
      loadingPathProvenanceId: "test-mismatched-source-prior-path",
      inflationPoints: [115, 130, 144.4, 165].map((volumeMl) => ({
        leftVentricularCavityVolumeM3: volumeMl * 1e-6,
        rightVentricularCavityVolumeM3: ratio * volumeMl * 1e-6,
        targetLeftVentricularPressurePa:
          evaluateKlotz2006NormalizedEdpvrTargetV1(
            volumeMl * 1e-6,
            klotz,
          ).pressurePa,
      })),
    });
    expect(() => buildPhaseB1MechanisticRebuildWallMaterialBindingV2(
      bundle,
      mismatchedFit,
      sha256,
    )).toThrow(/does not match the manifest-bound source prior/);
  });

  it("rebuilds Land, SLS, and TriSeg coordinates after the structural boundary", () => {
    const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256);
    const anatomy = buildNormalAdultCandidate();
    const fit = buildNormalPassiveFit();
    const binding = buildPhaseB1MechanisticRebuildWallMaterialBindingV2(
      scaffold.phaseA1TissueManifestBundle,
      fit,
      sha256,
    );
    const initialization = buildPhaseB1MechanisticRebuildInitializationV2({
      timeSec: 0,
      slsMode: "on",
      bloodVolumesM3: scaffold.initialState.bloodVolumesM3,
      inertialFlowsM3PerSec: scaffold.initialState.inertialFlowsM3PerSec,
      atrialGeometryPriorByChamber: scaffold.atrialGeometryPriorByChamber,
      triSegWalls: anatomy.walls,
      wallMaterialBinding: binding,
      initialTriSegCoordinates: scaffold.initialState.triSegCoordinates,
    });

    expect(initialization.audit.pass).toBe(true);
    expect(initialization.audit.importedOldLandHistory).toBe(false);
    expect(initialization.audit.importedOldSlsHistory).toBe(false);
    expect(initialization.audit.importedOldTriSegCoordinates).toBe(false);
    expect(initialization.audit.maximumAbsoluteLandRhsPerSec).toBeLessThan(1e-10);
    expect(initialization.audit.maximumAbsoluteSlsOverstressPa).toBeLessThan(1e-9);
    expect(initialization.audit.triSegResidualNPerM.scaledInfinityNorm)
      .toBeLessThan(1e-8);
    for (const wallId of ["LA", "LVFW", "SEP", "RVFW", "RA"] as const) {
      expect(initialization.endpoint.differentialState.slsMode).toBe("on");
      if (initialization.endpoint.differentialState.slsMode === "on") {
        expect(initialization.endpoint.differentialState.slsAlphaVByWall[wallId])
          .toBeCloseTo(initialization.audit.fiberLogStrainByWall[wallId], 14);
      }
    }
  });

  it("roots one shared passive-energy scale at Klotz ED and replays held-out points through runtime energy mechanics", () => {
    const anatomy = buildNormalAdultCandidate();
    const klotz = invertKlotz2006SinglePointEdpvrV1({
      measuredEndDiastolicVolumeM3:
        anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
      measuredEndDiastolicPressurePa: 8 * PA_PER_MMHG,
    });
    const leftVolumesM3 = [115, 130, 144.4, 165].map((ml) => ml * 1e-6);
    const rvToLvLoadedVolumeRatio =
      anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
      / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3;
    const fit = fitSharedVentricularPassiveEnergyScaleV2({
      anatomy,
      bendingPrior: buildBendingPrior(anatomy),
      basePassivePrior: PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      loadingPathProvenanceId: "test-proportional-rv-volume-path",
      inflationPoints: leftVolumesM3.map((leftVentricularCavityVolumeM3) => ({
        leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3:
          rvToLvLoadedVolumeRatio * leftVentricularCavityVolumeM3,
        targetLeftVentricularPressurePa:
          evaluateKlotz2006NormalizedEdpvrTargetV1(
            leftVentricularCavityVolumeM3,
            klotz,
          ).pressurePa,
      })),
    });

    expect(fit.sharedTensileEnergyScale).toBeGreaterThan(1);
    expect(fit.scaledTensileAPa).toBeCloseTo(
      fit.sharedTensileEnergyScale
        * PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1.APa,
      14,
    );
    expect(fit.fixedPassiveB)
      .toBe(PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1.B);
    expect(fit.nodes).toHaveLength(leftVolumesM3.length);
    expect(fit.landActiveStressIncluded).toBe(false);
    expect(fit.slsOverstressIncluded).toBe(false);
    expect(fit.pericardialPressureIncluded).toBe(false);
    expect(fit.chamberPressureGainApplied).toBe(false);
    expect(fit.retainedCompressionModulusPa)
      .toBe(PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1.KCompEffPa);
    expect(fit.everyNodeOnPureTensionBranch).toBe(true);
    expect(fit.compressionScaleIdentified).toBe(false);
    expect(fit.slsScaleIdentified).toBe(false);
    expect(fit.scaleMeaning)
      .toBe("shared-multiplier-on-pure-tension-energy-stress-and-tangent-not-compression-sls-or-chamber-pressure");
    expect(Number.isFinite(fit.rootMeanSquarePressureErrorPa)).toBe(true);
    expect(fit.rootMeanSquarePressureErrorPa).toBeLessThan(2.5 * PA_PER_MMHG);
    expect(Math.abs(fit.scaleBracket.finalAnchorPressureResidualPa))
      .toBeLessThan(1e-6);
    expect(fit.scaleBracket.lowerPressureResidualPa).toBeLessThanOrEqual(0);
    expect(fit.scaleBracket.upperPressureResidualPa).toBeGreaterThanOrEqual(0);
    expect(fit.everyNodeRuntimeEnergyConjugateRootReplayed).toBe(true);
    expect(fit.everyNodeStrictLocalPotentialMinimum).toBe(true);
    expect(fit.publishedTaylorUsedForPressureOrRoot).toBe(false);
    for (const node of fit.nodes) {
      expect(node.runtimeEnergyConjugateRootReplayed).toBe(true);
      expect(node.publishedTaylorUsedForPressureOrRoot).toBe(false);
      expect(node.potentialStability.positiveDefinite).toBe(true);
      expect(node.potentialStability.minimumEigenvalueJ).toBeGreaterThan(0);
      expect(node.potentialStability
        .antisymmetricPartRelativeToHessianInfinityNorm).toBeLessThan(1e-7);
    }
  });

  it("continues through the prior 61/72 mL fold neighborhood and multi-starts onto one stable energy minimum", () => {
    const anatomy = buildNormalAdultCandidate();
    const fit = buildNormalPassiveFit();
    const bendingPrior = buildBendingPrior(anatomy);
    const compiled = compileEquilibriumPassivePriorV1({
      ...PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      priorId: "test-fold-runtime-energy-passive",
      evidenceClass: "literature-informed-organ-scale-edpvr-inverse",
      APa: fit.scaledTensileAPa,
    });
    const evaluateWallStress = (geometry: typeof anatomy.replayGeometry) =>
      Object.freeze({
        LVFW: evaluateEquilibriumPassiveEnergyV1(
          geometry.walls.LVFW.fiberLogStrain,
          compiled,
        ).equilibriumKirchhoffStressPa,
        SEP: evaluateEquilibriumPassiveEnergyV1(
          geometry.walls.SEP.fiberLogStrain,
          compiled,
        ).equilibriumKirchhoffStressPa,
        RVFW: evaluateEquilibriumPassiveEnergyV1(
          geometry.walls.RVFW.fiberLogStrain,
          compiled,
        ).equilibriumKirchhoffStressPa,
      });
    const solve = (
      lvMl: number,
      rvMl: number,
      initialCoordinates: typeof anatomy.loadedGeometryAnchor.coordinates,
    ) => solveEnergyConjugateFiniteThicknessTriSegRootV2({
      leftVentricularCavityVolumeM3: lvMl * 1e-6,
      rightVentricularCavityVolumeM3: rvMl * 1e-6,
      walls: anatomy.walls,
      bendingPrior,
      initialCoordinates,
      evaluateWallStress,
      unknownScales: {
        septalMidwallCapVolumeM3: 20e-6,
        junctionRadiusM: 0.03,
      },
      equilibriumResidualScaleNPerM: 1,
      junctionRadiusLowerBoundM: 1e-5,
      algorithmicJacobianScaledStep: 2 ** -18,
    });
    let coordinates = anatomy.loadedGeometryAnchor.coordinates;
    const continuation = Array.from({ length: 17 }, (_, index) => {
      const fraction = index / 16;
      return {
        lvMl: 144.4 + fraction * (61 - 144.4),
        rvMl: 155.8 + fraction * (72 - 155.8),
      };
    }).map(({ lvMl, rvMl }) => {
      const result = solve(lvMl, rvMl, coordinates);
      expect(result.converged).toBe(true);
      if (result.converged === false) throw new Error(result.message);
      expect(result.potentialStability.positiveDefinite).toBe(true);
      coordinates = result.coordinates;
      return result;
    });
    const fold = continuation[continuation.length - 1];
    const seeds = [
      fold.coordinates,
      {
        septalMidwallCapVolumeM3:
          fold.coordinates.septalMidwallCapVolumeM3 + 8e-6,
        junctionRadiusM: 0.9 * fold.coordinates.junctionRadiusM,
      },
      {
        septalMidwallCapVolumeM3:
          fold.coordinates.septalMidwallCapVolumeM3 - 8e-6,
        junctionRadiusM: 1.1 * fold.coordinates.junctionRadiusM,
      },
    ] as const;
    const multistart = auditStableEnergyConjugateFiniteThicknessTriSegMultiStartV2(
      {
        leftVentricularCavityVolumeM3: 61e-6,
        rightVentricularCavityVolumeM3: 72e-6,
        walls: anatomy.walls,
        bendingPrior,
        evaluateWallStress,
        unknownScales: {
          septalMidwallCapVolumeM3: 20e-6,
          junctionRadiusM: 0.03,
        },
        equilibriumResidualScaleNPerM: 1,
        junctionRadiusLowerBoundM: 1e-5,
        algorithmicJacobianScaledStep: 2 ** -18,
      },
      seeds,
    );
    expect(multistart.accepted).toBe(true);
    expect(multistart.allSeedsConvergedToStationaryPoints).toBe(true);
    expect(multistart.strictLocalMinimumCount).toBe(2);
    expect(multistart.nonMinimumStationaryPointCount).toBe(1);
    expect(multistart.stableRootsSameBranchWithinTolerance).toBe(true);
    expect(multistart.maximumStablePairwiseScaledCoordinateDistance)
      .toBeLessThan(1e-7);
    expect(multistart.selectedStableRoot.potentialStability.positiveDefinite)
      .toBe(true);
    expect(Math.abs(
      multistart.selectedStableRoot.coordinates.septalMidwallCapVolumeM3
        - fold.coordinates.septalMidwallCapVolumeM3,
    ) / 20e-6).toBeLessThan(1e-7);
    expect(multistart.minimumResidualStationaryPointSelectionApplied).toBe(false);
  });

  it("fails closed on nonphysical structural inputs", () => {
    const valid = normalAdultInput();
    expect(() => buildVentricularStructuralAnatomyV2({
      ...valid,
      wallMaterialVolumeM3ByWall: { ...valid.wallMaterialVolumeM3ByWall, LVFW: 0 },
    })).toThrow(/LVFW.wallMaterialVolumeM3/);
    expect(() => buildVentricularStructuralAnatomyV2({
      ...valid,
      targetFiberStretchAtAnchorByWall: {
        ...valid.targetFiberStretchAtAnchorByWall,
        SEP: Number.NaN,
      },
    })).toThrow(/SEP.targetFiberStretchAtAnchor/);
    expect(() => buildVentricularStructuralAnatomyV2({
      ...valid,
      loadedGeometryAnchor: {
        ...valid.loadedGeometryAnchor,
        coordinates: {
          ...valid.loadedGeometryAnchor.coordinates,
          junctionRadiusM: 0,
        },
      },
    })).toThrow(/junctionRadiusM/);
  });
});

function buildNormalAdultCandidate() {
  return buildVentricularStructuralAnatomyV2(normalAdultInput());
}

function buildNormalPassiveFit(
  anatomy = buildNormalAdultCandidate(),
) {
  const klotz = invertKlotz2006SinglePointEdpvrV1({
    measuredEndDiastolicVolumeM3:
      anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
    measuredEndDiastolicPressurePa: 8 * PA_PER_MMHG,
  });
  const ratio = anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
    / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3;
  return fitSharedVentricularPassiveEnergyScaleV2({
    anatomy,
    bendingPrior: buildBendingPrior(anatomy),
    basePassivePrior: PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
    loadingPathProvenanceId: "test-proportional-rv-volume-path",
    inflationPoints: [115, 130, 144.4, 165].map((volumeMl) => {
      const leftVentricularCavityVolumeM3 = volumeMl * 1e-6;
      return {
        leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3:
          ratio * leftVentricularCavityVolumeM3,
        targetLeftVentricularPressurePa:
          evaluateKlotz2006NormalizedEdpvrTargetV1(
            leftVentricularCavityVolumeM3,
            klotz,
          ).pressurePa,
      };
    }),
  });
}

function buildBendingPrior(anatomy: ReturnType<typeof buildNormalAdultCandidate>) {
  return createFiniteThicknessTriSegBendingPriorV2({
    priorId: "test-normal-adult-fixed-koiter-prior-v2",
    effectiveBendingYoungModulusPa: 3_000,
    poissonRatio: 0.45,
    referenceGeometry: anatomy.replayGeometry,
    wallBendingMultiplierByWall: { LVFW: 1, SEP: 1, RVFW: 1 },
  });
}

function normalAdultInput() {
  const cmr = POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1;
  const partition = partitionCmrVentricularMassToTriSegWallsV1({
    leftVentricularMassIncludingSeptumKg:
      cmr.leftVentricle.myocardialMassIncludingSeptumKg.center,
    rightVentricularFreeWallMassKg:
      cmr.rightVentricle.myocardialMassKg.center,
    septalFractionOfLeftVentricularMass:
      TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1
        .septalFractionOfCmrLeftVentricularMass,
    partitionPriorId:
      TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1.partitionPriorId,
  });
  return {
    wallMaterialVolumeM3ByWall: partition.wallMaterialVolumeM3,
    loadedGeometryAnchor: {
      leftVentricularCavityVolumeM3:
        cmr.leftVentricle.endDiastolicVolumeM3.center,
      rightVentricularCavityVolumeM3:
        cmr.rightVentricle.endDiastolicVolumeM3.center,
      coordinates: {
        septalMidwallCapVolumeM3: 42e-6,
        junctionRadiusM: 0.033,
      },
    },
    targetFiberStretchAtAnchorByWall: {
      LVFW: 1.1,
      SEP: 1.1,
      RVFW: 1.1,
    },
    provenanceId: "cmr-bsa1p9-triseg-seed-homeostatic-stretch-candidate-v2",
  } as const;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
