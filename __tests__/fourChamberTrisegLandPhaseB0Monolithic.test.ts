import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { canonicalizeJson } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  advancePhaseB0HydromechanicsWithDeterministicSubstepsForTestV1,
  auditPhaseB0MonolithicResidualJacobianSuiteV1,
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  stepPhaseB0MonolithicHydromechanicsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  auditPhaseB0PublishedTriSegContinuationV1,
  auditPhaseB0PublishedTriSegMultiStartV1,
  solvePhaseB0PublishedTriSegRootV1,
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootResultV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegContinuationPointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
  type PhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  evaluatePhaseB0BackwardEulerTimeStepConvergenceV1,
  runPhaseB0ShortHorizonProtocolV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/conservativeHydromechanicsProtocolV1";
import type { PublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  buildPhaseB0TestReferenceManifestV1,
  phaseB0TestReferenceManifestHashPayloadV1,
  type PhaseB0TestReferenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/testReferenceManifestV1";
import { auditPhaseB0TriSegStaticRestoringRootV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import {
  buildPhaseB0TriSegStaticRestoringGateManifestV1,
  phaseB0TriSegStaticRestoringGateManifestHashPayloadV1,
  type PhaseB0TriSegStaticRestoringGateManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  auditPhaseB0TriSegNaturalParameterContinuationV1,
  buildPhaseB0TriSegLinearLoadPathV1,
  scaledPhaseB0TriSegCoordinateDistanceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";

const EXPECTED_PHASE_B0_SYNTHETIC_CASE_SHA256 =
  "f8bbfbb7ad6bd76bd160ceb86fb903a35e1d0398397f99189f2ae32ff48ae75c";
const EXPECTED_PHASE_B0_TEST_REFERENCE_MANIFEST_SHA256 =
  "dcdded542d7747c76e6cd487184ba390a80e4ea238b03a9f5373e0c76cc13356";
const EXPECTED_PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_SHA256 =
  "a253d1d98127633d68e9062102de9f1593fadccf770b581b74d7f7a81657bfa0";

describe("four-chamber Phase B0 monolithic hydromechanics", () => {
  let fixture: PhaseB0SyntheticHydromechanicsCaseV1;
  let testReferenceManifest: PhaseB0TestReferenceManifestV1;
  let staticRestoringGateManifest: PhaseB0TriSegStaticRestoringGateManifestV1;

  beforeAll(() => {
    fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256);
    testReferenceManifest = buildPhaseB0TestReferenceManifestV1(fixture, sha256);
    staticRestoringGateManifest =
      buildPhaseB0TriSegStaticRestoringGateManifestV1(fixture, sha256);
  });

  it("starts from the content-hashed symmetric 1000 Pa equilibrium without a hidden volume", () => {
    const state = createPhaseB0HydromechanicsInitialStateV1(fixture, "on");
    const evaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, state);
    expect(fixture.contentSha256).toBe(EXPECTED_PHASE_B0_SYNTHETIC_CASE_SHA256);
    expect(testReferenceManifest.contentSha256)
      .toBe(EXPECTED_PHASE_B0_TEST_REFERENCE_MANIFEST_SHA256);
    expect(testReferenceManifest.contentSha256).toBe(
      sha256(canonicalizeJson(
        phaseB0TestReferenceManifestHashPayloadV1(testReferenceManifest),
      )),
    );
    expect(testReferenceManifest.status)
      .toBe("exploratory-test-reference-not-phase-b-acceptance");
    expect(testReferenceManifest.releaseClaims).toEqual({
      physiologicalValidation: false,
      phaseB0Acceptance: false,
      phaseB1Eligible: false,
      releaseRuntimeReachable: false,
    });
    expect(testReferenceManifest.triSegRootAudit.continuationAnchorSource)
      .toBe("content-hashed-synthetic-case-initial-triseg-coordinates");
    expect(testReferenceManifest.triSegRootAudit.continuationAnchorCoordinates).toEqual({
      septalMidwallCapVolumeM3: fixture.initialState.triSegCoordinates.V_m_S,
      junctionRadiusM: fixture.initialState.triSegCoordinates.y_m,
    });
    expect(state.slsMode).toBe("on");
    expect(evaluation.pericardium.excessPressurePa).toBe(0);
    expect(evaluation.volumeRates.totalVolumeRateM3PerSec).toBe(0);
    expect(evaluation.triSegOracle.equilibriumResidual.euclideanNPerM).toBeLessThan(2e-12);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(evaluation.chamberTransmuralPressurePa[chamber]).toBeCloseTo(1_000, 10);
    }
    expect(evaluation.projectionApplied).toBe(false);
    expect(Object.keys(state.bloodVolumesM3)).toHaveLength(8);
    expect(Object.keys(state).some((key) => /hidden|reservoir/i.test(key))).toBe(false);
    const offState = createPhaseB0HydromechanicsInitialStateV1(fixture, "off");
    expect(() => evaluatePhaseB0HydromechanicsStateV1(fixture, {
      ...offState,
      slsAlphaVByWall: fixture.initialState.slsAlphaVByWall,
    } as never)).toThrow(/must contain exactly/);
  });

  it("solves the published Taylor TriSeg root and records multi-start/continuation conditioning", () => {
    for (const mode of testReferenceManifest.triSegRootAudit.slsModes) {
      const baseState = createPhaseB0HydromechanicsInitialStateV1(fixture, mode);
      const rootInput = {
        leftVentricularCavityVolumeM3: baseState.bloodVolumesM3.LV,
        rightVentricularCavityVolumeM3: baseState.bloodVolumesM3.RV,
        walls: fixture.triSegReference.walls,
        evaluateWallStress: stressEvaluator(fixture, baseState),
        unknownScales: {
          septalMidwallCapVolumeM3:
            fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
          junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
        },
        equilibriumResidualScaleNPerM:
          fixture.newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM,
        junctionRadiusLowerBoundM: fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
        algorithmicJacobianScaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
      } as const;
      const root = solvePhaseB0PublishedTriSegRootV1({
        ...rootInput,
        initialCoordinates: { septalMidwallCapVolumeM3: 0, junctionRadiusM: 0.03 },
      });
      expect(root.converged).toBe(true);
      if (!root.converged) continue;
      expect(root.scaledResidualInfinityNorm).toBeLessThan(1e-8);
      expect(root.scaledUpdateInfinityNorm).toBeLessThan(1e-8);
      expect(root.scaledJacobianDiagnostics.sigmaMinimum).toBeGreaterThan(0);
      expect(Number.isFinite(root.scaledJacobianDiagnostics.conditionNumber2)).toBe(true);
      expect(root.forcedSeptalTargetApplied).toBe(false);
      expect(root.acceptedAsPhysiologicalRoot).toBe(false);

      const multiStart = auditPhaseB0PublishedTriSegMultiStartV1(
        rootInput,
        testReferenceManifest.triSegRootAudit.multiStartSeeds,
        testReferenceManifest.triSegRootAudit.scaledCoordinateTolerance,
      );
      // The deliberately broad seeds expose a second mathematical Taylor root
      // in both SLS topologies. B0 reports it instead of choosing the smallest
      // residual or silently forcing the reference branch.
      expect(multiStart.allConverged).toBe(true);
      expect(multiStart.sameBranchWithinTolerance).toBe(false);
      expect(multiStart.accepted).toBe(false);
      expect(multiStart.maximumPairwiseScaledCoordinateDistance).toBeGreaterThan(0.05);
      expect(multiStart.scaledCoordinateDistanceNorm).toBe("scaled-infinity-norm");
      expect(multiStart.minimumResidualRootSelectionApplied).toBe(false);
      const convergedRoots = multiStart.results.filter((result) => result.converged);
      expect(convergedRoots.some((result) => result.converged
        && result.scaledJacobianDiagnostics.determinant > 0)).toBe(true);
      expect(convergedRoots.some((result) => result.converged
        && result.scaledJacobianDiagnostics.determinant < 0)).toBe(true);
      expect(convergedRoots.every((result) => result.converged
        && !result.scaledJacobianDiagnostics.numericallySingular)).toBe(true);

      const continuation = auditPhaseB0PublishedTriSegContinuationV1(
        {
          walls: rootInput.walls,
          evaluateWallStress: rootInput.evaluateWallStress,
          unknownScales: rootInput.unknownScales,
          equilibriumResidualScaleNPerM: rootInput.equilibriumResidualScaleNPerM,
          junctionRadiusLowerBoundM: rootInput.junctionRadiusLowerBoundM,
          algorithmicJacobianScaledStep: rootInput.algorithmicJacobianScaledStep,
        },
        testReferenceManifest.triSegRootAudit.continuationVolumeMultipliers.map(
          (multipliers) => ({
            leftVentricularCavityVolumeM3: baseState.bloodVolumesM3.LV * multipliers.LV,
            rightVentricularCavityVolumeM3: baseState.bloodVolumesM3.RV * multipliers.RV,
          }),
        ),
        testReferenceManifest.triSegRootAudit.continuationAnchorCoordinates,
        testReferenceManifest.triSegRootAudit.continuationScaledStepThreshold,
      );
      expect(continuation.accepted).toBe(true);
      expect(continuation.scaledCoordinateDistanceNorm).toBe("scaled-infinity-norm");
      expect(continuation.initialAnchorScaledDistance).not.toBeNull();
      expect(continuation.maximumScaledStepDistance)
        .toBeGreaterThanOrEqual(continuation.initialAnchorScaledDistance ?? 0);
      expect(continuation.previousRootUse).toBe("initial-guess-only");
    }
  });

  it("separates local static restoring class from energetic and physiological claims", () => {
    expect(staticRestoringGateManifest.contentSha256)
      .toBe(EXPECTED_PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_SHA256);
    expect(staticRestoringGateManifest.contentSha256).toBe(sha256(canonicalizeJson(
      phaseB0TriSegStaticRestoringGateManifestHashPayloadV1(
        staticRestoringGateManifest,
      ),
    )));
    expect(staticRestoringGateManifest.status)
      .toBe("local-classifier-regression-not-supported-envelope-acceptance");
    expect(Object.values(staticRestoringGateManifest.negativeClaims).every(
      (claim) => claim === false,
    )).toBe(true);
    expect(Object.values(staticRestoringGateManifest.releaseClaims).every(
      (claim) => claim === false,
    )).toBe(true);
    for (const path of staticRestoringGateManifest.localPredictorCorrectorRegression.paths) {
      expect(path.nodes[0]).toEqual({ LV: 1, RV: 1 });
    }
    expect(staticRestoringGateManifest.localPredictorCorrectorRegression
      .pseudoArclengthPolicy).toMatchObject({
      use: "diagnostic-on-trigger-only",
      acceptedBranchFoldCrossingAllowed: false,
    });

    for (const mode of staticRestoringGateManifest.frozenState.slsModes) {
      const state = createPhaseB0HydromechanicsInitialStateV1(fixture, mode);
      const rootInput = {
        leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV,
        rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV,
        walls: fixture.triSegReference.walls,
        evaluateWallStress: stressEvaluator(fixture, state),
        unknownScales: {
          septalMidwallCapVolumeM3:
            fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
          junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
        },
        equilibriumResidualScaleNPerM:
          fixture.newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM,
        junctionRadiusLowerBoundM: fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
        algorithmicJacobianScaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
      } as const;
      const multiStart = auditPhaseB0PublishedTriSegMultiStartV1(
        rootInput,
        staticRestoringGateManifest.discoveredRootRegression.multiStartSeeds,
        staticRestoringGateManifest.discoveredRootRegression.scaledRootClusteringTolerance,
      );
      expect(multiStart.allConverged).toBe(true);
      expect(multiStart.sameBranchWithinTolerance).toBe(false);
      const audits = multiStart.results.map((root) => {
        if (root.converged === false) throw new Error(root.message);
        return {
          root,
          audit: auditPhaseB0TriSegStaticRestoringRootV1({
            rootInput,
            root,
            generalizedForceResidualScales: {
              septalMidwallVolumePa:
                fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
              junctionRadiusN:
                fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
            },
            policy: staticRestoringGateManifest
              .workConjugateStaticRestoringClassifier.policy,
          }),
        };
      });
      const discoveredClasses = new Set(audits.map(
        ({ audit }) => audit.scaledRestoringTangent.classification,
      ));
      expect(discoveredClasses).toEqual(new Set(
        staticRestoringGateManifest.discoveredRootRegression
          .expectedDiscoveredClassesInEachSlsMode,
      ));
      const restoring = audits.filter(({ audit }) =>
        audit.scaledRestoringTangent.classification === "robust-restoring");
      const saddles = audits.filter(({ audit }) =>
        audit.scaledRestoringTangent.classification === "robust-saddle");
      expect(restoring.length).toBeGreaterThan(0);
      expect(saddles.length).toBeGreaterThan(0);
      expect(restoring.every(({ root, audit }) =>
        root.scaledJacobianDiagnostics.determinant > 0
        && audit.acceptedUnderLocalStaticRestoringTestReference)).toBe(true);
      expect(saddles.every(({ root, audit }) =>
        root.scaledJacobianDiagnostics.determinant < 0
        && !audit.acceptedUnderLocalStaticRestoringTestReference)).toBe(true);
      for (const { root, audit } of audits) {
        expect(audit.generalizedForceTransformAudit.accepted).toBe(true);
        expect(audit.rootRegularity.accepted).toBe(true);
        expect(audit.energeticStability).toMatchObject({
          eligible: false,
          energyMinimumClaimed: false,
          thermodynamicStabilityClaimed: false,
        });
        expect(audit.physiologicalRootClaimed).toBe(false);
        expect(audit.globalUniquenessClaimed).toBe(false);
        expect(root.acceptedAsPhysiologicalRoot).toBe(false);
      }

      const continuationManifest =
        staticRestoringGateManifest.localPredictorCorrectorRegression;
      const pathRootInput = {
        walls: rootInput.walls,
        evaluateWallStress: rootInput.evaluateWallStress,
        unknownScales: rootInput.unknownScales,
        equilibriumResidualScaleNPerM: rootInput.equilibriumResidualScaleNPerM,
        junctionRadiusLowerBoundM: rootInput.junctionRadiusLowerBoundM,
        algorithmicJacobianScaledStep: rootInput.algorithmicJacobianScaledStep,
      } as const;
      const continuationPolicy = {
        parameterDerivativeScaledStep:
          continuationManifest.parameterDerivativeScaledStep,
        minimumScaledLoadArclength:
          continuationManifest.minimumScaledLoadArclength,
        maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
          continuationManifest
            .maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
        maximumAnchorCorrectionScaledInfinityNorm:
          continuationManifest.maximumAnchorCorrectionScaledInfinityNorm,
        maximumPredictorCorrectionScaledInfinityNorm:
          continuationManifest.maximumPredictorCorrectionScaledInfinityNorm,
        maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
          continuationManifest
            .maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
        maximumAcceptedScaledCoordinateStep:
          continuationManifest.maximumAcceptedScaledCoordinateStep,
        minimumTangentDot: continuationManifest.minimumTangentDot,
        relativePivotTolerance: continuationManifest.relativePivotTolerance,
      } as const;
      for (const declaredPath of continuationManifest.paths) {
        const declaredAbsolutePath = declaredPath.nodes.map((multipliers) => ({
          leftVentricularCavityVolumeM3:
            state.bloodVolumesM3.LV * multipliers.LV,
          rightVentricularCavityVolumeM3:
            state.bloodVolumesM3.RV * multipliers.RV,
        }));
        expect(declaredAbsolutePath[0]).toEqual({
          leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV,
          rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV,
        });
        const endpoint = declaredAbsolutePath[declaredAbsolutePath.length - 1];
        const subdivisionRuns = continuationManifest.deterministicSubdivisionFactors.map(
          (segmentCount) => auditPhaseB0TriSegNaturalParameterContinuationV1({
            rootInput: pathRootInput,
            path: buildPhaseB0TriSegLinearLoadPathV1(
              declaredAbsolutePath[0],
              endpoint,
              segmentCount,
            ),
            anchorCoordinates: staticRestoringGateManifest
              .frozenState.anchorCoordinates,
            policy: continuationPolicy,
          }),
        );
        for (const run of subdivisionRuns) {
          expect(run.failure).toBeNull();
          expect(run.thresholdViolations).toEqual([]);
          expect(run.numericalPathAccepted).toBe(true);
          expect(run.accepted).toBe(true);
          expect(run.allConverged).toBe(true);
          expect(run.branchIdentityEstablished).toBe(true);
          expect(run.branchIdentity)
            .toBe("numerically-tracked-from-declared-anchor-by-corrected-path");
          expect(run.previousRootUse).toBe("tangent-predictor-only");
          expect(run.pathParameterization)
            .toBe("cumulative-scaled-load-arclength-using-declared-fixed-load-scales");
          expect(run.parameterDerivativeStencil)
            .toBe("in-segment-forward-five-point-with-step-halving-audit");
          expect(run.scaledCoordinateDistanceNorm).toBe("scaled-infinity-norm");
          expect(run.nearestRootSelectionApplied).toBe(false);
          expect(run.minimumResidualSelectionApplied).toBe(false);
          expect(run.maximumJunctionRadiusSelectionApplied).toBe(false);
          expect(run.forcedPreviousSeptumApplied).toBe(false);
          expect(run.pseudoArclengthApplied).toBe(false);
          expect(run.supportedEnvelopeClaimed).toBe(false);
        }
        const finest = subdivisionRuns[subdivisionRuns.length - 1];
        const finestEndpointRoot = requireConvergedPathRoot(
          finest.roots[finest.roots.length - 1],
        );
        for (const run of subdivisionRuns) {
          const runEndpointRoot = requireConvergedPathRoot(
            run.roots[run.roots.length - 1],
          );
          expect(scaledPhaseB0TriSegCoordinateDistanceV1(
            runEndpointRoot.coordinates,
            finestEndpointRoot.coordinates,
            rootInput.unknownScales,
          )).toBeLessThanOrEqual(
            continuationManifest
              .independentInitializationEndpointAgreementTolerance,
          );
        }
        auditLocalRestoringPathNodes({
          fixture,
          rootInput,
          path: finest.path,
          roots: finest.roots,
          manifest: staticRestoringGateManifest,
        });

        const reverse = auditPhaseB0TriSegNaturalParameterContinuationV1({
          rootInput: pathRootInput,
          path: Object.freeze([...finest.path].reverse()),
          anchorCoordinates: finestEndpointRoot.coordinates,
          policy: continuationPolicy,
        });
        expect(reverse.failure).toBeNull();
        expect(reverse.thresholdViolations).toEqual([]);
        expect(reverse.numericalPathAccepted).toBe(true);
        expect(reverse.allConverged).toBe(true);
        expect(reverse.branchIdentityEstablished).toBe(true);
        const reverseAnchorRoot = requireConvergedPathRoot(
          reverse.roots[reverse.roots.length - 1],
        );
        const forwardAnchorRoot = requireConvergedPathRoot(finest.roots[0]);
        expect(scaledPhaseB0TriSegCoordinateDistanceV1(
          reverseAnchorRoot.coordinates,
          forwardAnchorRoot.coordinates,
          rootInput.unknownScales,
        )).toBeLessThanOrEqual(
          continuationManifest.reverseTraversalClosureTolerance,
        );
        auditLocalRestoringPathNodes({
          fixture,
          rootInput,
          path: reverse.path,
          roots: reverse.roots,
          manifest: staticRestoringGateManifest,
        });
      }
    }
  });

  it("returns structured local-continuation failure evidence without inventing a branch", () => {
    const state = createPhaseB0HydromechanicsInitialStateV1(fixture, "on");
    const rootInput = {
      walls: fixture.triSegReference.walls,
      evaluateWallStress: stressEvaluator(fixture, state),
      unknownScales: {
        septalMidwallCapVolumeM3:
          fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
        junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
      },
      equilibriumResidualScaleNPerM:
        fixture.newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM,
      junctionRadiusLowerBoundM:
        fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
      algorithmicJacobianScaledStep:
        fixture.numericalPolicy.algorithmicJacobianScaledStep,
    } as const;
    const from = {
      leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV,
      rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV,
    } as const;
    const to = {
      leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV * 0.999,
      rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV * 1.001,
    } as const;
    const manifestPolicy =
      staticRestoringGateManifest.localPredictorCorrectorRegression;
    const audit = auditPhaseB0TriSegNaturalParameterContinuationV1({
      rootInput,
      path: [from, to],
      anchorCoordinates: staticRestoringGateManifest.frozenState.anchorCoordinates,
      policy: {
        parameterDerivativeScaledStep: manifestPolicy.parameterDerivativeScaledStep,
        minimumScaledLoadArclength: manifestPolicy.minimumScaledLoadArclength,
        maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
          manifestPolicy.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
        maximumAnchorCorrectionScaledInfinityNorm:
          manifestPolicy.maximumAnchorCorrectionScaledInfinityNorm,
        maximumPredictorCorrectionScaledInfinityNorm:
          manifestPolicy.maximumPredictorCorrectionScaledInfinityNorm,
        maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
          manifestPolicy.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
        maximumAcceptedScaledCoordinateStep:
          manifestPolicy.maximumAcceptedScaledCoordinateStep,
        minimumTangentDot: manifestPolicy.minimumTangentDot,
        relativePivotTolerance: 1,
      },
    });
    expect(audit.failure).toMatchObject({
      phase: "tangent-evaluation",
      segmentIndex: 0,
      reason: "coarse-tangent-linear-solve-failed",
    });
    expect(audit.failure?.tangentLinearSolveFailure).toMatchObject({
      derivativeLevel: "coarse",
      reason: "singular-or-near-singular",
    });
    expect(audit.numericalPathAccepted).toBe(false);
    expect(audit.accepted).toBe(false);
    expect(audit.allConverged).toBe(false);
    expect(audit.branchIdentityEstablished).toBe(false);
    expect(audit.branchIdentity).toBe("not-established");
    expect(audit.thresholdViolations).toContain("structured-path-failure");
    expect(audit.roots).toHaveLength(1);
    expect(audit.segments).toHaveLength(0);
    expect(() => auditPhaseB0TriSegNaturalParameterContinuationV1({
      rootInput,
      path: [from, from],
      anchorCoordinates: staticRestoringGateManifest.frozenState.anchorCoordinates,
      policy: {
        ...audit.policy,
        relativePivotTolerance: manifestPolicy.relativePivotTolerance,
      },
    })).toThrow(/identical or too close/);
  });

  it("rejects non-finite coordinates and non-positive public distance scales", () => {
    const left = { septalMidwallCapVolumeM3: 0, junctionRadiusM: 0.03 };
    const right = { septalMidwallCapVolumeM3: 1e-6, junctionRadiusM: 0.031 };
    const scales = {
      septalMidwallCapVolumeM3: 1e-5,
      junctionRadiusM: 0.03,
    };
    expect(scaledPhaseB0TriSegCoordinateDistanceV1(left, right, scales))
      .toBeCloseTo(0.1, 14);
    expect(() => scaledPhaseB0TriSegCoordinateDistanceV1(
      left,
      right,
      { ...scales, junctionRadiusM: 0 },
    )).toThrow(/positive and finite/);
    expect(() => scaledPhaseB0TriSegCoordinateDistanceV1(
      left,
      { ...right, septalMidwallCapVolumeM3: Number.NaN },
      scales,
    )).toThrow(/must be finite/);
  });

  it.each(["on", "off"] as const)(
    "advances one monolithic BE step with the %s SLS topology",
    (mode) => {
      const initial = createPhaseB0HydromechanicsInitialStateV1(fixture, mode);
      const result = stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
        fixture,
        initial,
        testReferenceManifest.shortHorizonProtocol.requestedDtSec,
      );
      if (result.converged === false) throw new Error(result.message);
      expect(result.converged).toBe(true);
      expect(result.unknownCount).toBe(mode === "on" ? 21 : 16);
      expect(result.nextState.slsMode).toBe(mode);
      if (mode === "off") expect("slsAlphaVByWall" in result.nextState).toBe(false);
      expect(Math.abs(result.totalBloodVolumeResidualM3)).toBeLessThan(1e-14);
      expect(result.residualEvaluation.volumeResidual.maximumAbsoluteResidualM3PerSec)
        .toBeLessThan(1e-10);
      expect(result.nextEvaluation.triSegOracle.equilibriumResidual.euclideanNPerM)
        .toBeLessThan(1e-8);
      expect(result.newtonDiagnostics.finalResidualInfinityNorm).toBeLessThan(1e-8);
      expect(result.newtonDiagnostics.finalUpdateInfinityNorm).toBeLessThan(1e-8);
      expect(result.slsAudit.maximumAbsoluteAlphaMismatch).toBeLessThan(1e-10);
      expect(result.slsAudit.maximumAbsoluteDiscretePassivityIdentityResidualJ)
        .toBeLessThan(1e-16);
      expect(result.slsAudit.allWallDiscretePassivityIdentityRho).toBeLessThan(1e-10);
      expect(result.differentiatedStageKinematics.laggedFiniteDifferenceUsed).toBe(false);
      expect(result.differentiatedStageKinematics.differentiatedConstraintResidualNPerMSec
        .infinityNorm).toBeLessThan(1e-5);
      expect(result.differentiatedKinematicsHalvingAudit.accepted).toBe(true);
      expect(result.differentiatedKinematicsHalvingAudit.maximumNormalizedRateDifference)
        .toBeLessThan(
          fixture.numericalPolicy.differentiatedKinematicsHalvingRelativeTolerance,
        );
      const jacobianAudit = auditPhaseB0MonolithicResidualJacobianSuiteV1(
        fixture,
        initial,
        result.nextState,
        testReferenceManifest.shortHorizonProtocol.requestedDtSec,
      );
      expect(jacobianAudit.unknownCount).toBe(mode === "on" ? 21 : 16);
      expect(jacobianAudit.maximumRelativeTwoNormDifference)
        .toBeLessThan(jacobianAudit.relativeTolerance);
      expect(jacobianAudit.maximumAbsoluteScaledDifferenceUse)
        .toBe("diagnostic-only-because-a-universal-absolute-cutoff-is-not-scale-invariant");
      expect(jacobianAudit.accepted).toBe(true);
      expect(jacobianAudit.hiddenJacobianFallbackUsed).toBe(false);
      expect(result.stagePower.totals.flowDissipationW).toBeGreaterThanOrEqual(0);
      expect(result.stagePower.totals.slsDissipationW).toBeGreaterThanOrEqual(0);
      expect(result.stagePower.normalization.rho).toBeLessThan(1e-5);
      expect(result.triSegStagePowerAudit.rawGeometryPowerResidualW)
        .toBeCloseTo(result.stagePower.totals.rawPublishedTaylorGeometryPowerResidualW, 14);
      expect(Number.isFinite(result.triSegStagePowerAudit.normalization.rhoStage)).toBe(true);
      expect(result.triSegStagePowerAudit.workConjugacyClaimed).toBe(false);
      expect(Number.isFinite(result.energyAudit.normalization.rho)).toBe(true);
      expect(result.postStepBloodVolumeProjectionApplied).toBe(false);
      expect(result.flowClampApplied).toBe(false);
      expect(result.fallbackApplied).toBe(false);
      expect(result.releaseRuntimeReachable).toBe(false);
    },
  );

  it("passes short-horizon conservation in both topologies and demonstrates BE time-step order", () => {
    for (const mode of ["on", "off"] as const) {
      const run = runPhaseB0ShortHorizonProtocolV1(
        fixture,
        mode,
        testReferenceManifest.shortHorizonProtocol.requestedDtSec,
        testReferenceManifest.shortHorizonProtocol.durationSec,
      );
      if (run.completed === false) throw new Error(run.failure.message);
      expect(run.shortHorizonNumericalAcceptance).toBe(true);
      expect(run.diagnostics.maximumRelativeTotalBloodVolumeResidual).toBeLessThan(1e-10);
      expect(run.diagnostics.maximumScaledResidualInfinityNorm).toBeLessThan(1e-8);
      expect(run.diagnostics.maximumScaledUpdateInfinityNorm).toBeLessThan(1e-8);
      expect(run.diagnostics.minimumFlowDissipationW).toBeGreaterThanOrEqual(0);
      expect(run.diagnostics.minimumSlsDissipationW).toBeGreaterThanOrEqual(0);
      expect(run.diagnostics.maximumStageEnergyRho).toBeLessThan(1e-5);
      expect(run.diagnostics.maximumSlsPassivityIdentityRho).toBeLessThan(1e-10);
      expect(run.diagnostics.maximumDifferentiatedConstraintResidualNPerMSec)
        .toBeLessThan(
          testReferenceManifest.shortHorizonProtocol
            .differentiatedConstraintResidualToleranceNPerMSec,
        );
      expect(run.diagnostics.referenceBranchJacobianOrientationPreserved).toBe(true);
      expect(run.diagnostics.minimumScaledTriSegJacobianSigmaMinimum).toBeGreaterThan(0);
      expect(Number.isFinite(
        run.diagnostics.maximumScaledTriSegJacobianConditionNumber2,
      )).toBe(true);
      expect(run.diagnostics.triSegScaledCoordinateStepNorm).toBe("scaled-infinity-norm");
      expect(run.diagnostics.maximumTriSegScaledCoordinateStepDistance)
        .toBeLessThan(
          testReferenceManifest.shortHorizonProtocol.triSegScaledCoordinateStepTolerance,
        );
      expect(Number.isFinite(run.diagnostics.maximumTriSegGeometryPowerRhoStage)).toBe(true);
      expect(Number.isFinite(run.diagnostics.triSegGeometryPowerRhoWork)).toBe(true);
      expect(run.acceptedSubstepCount).toBe(run.stepCount);
      expect(run.subdivisionUsed).toBe(false);
      expect(run.fullBeatAcceptanceClaimed).toBe(false);
      expect(run.physiologicalValidationClaimed).toBe(false);
    }
    for (const mode of ["on", "off"] as const) {
      const convergence = evaluatePhaseB0BackwardEulerTimeStepConvergenceV1(
        fixture,
        mode,
        testReferenceManifest.backwardEulerConvergenceProtocol.coarseDtSec,
        testReferenceManifest.backwardEulerConvergenceProtocol.durationSec,
      );
      expect(convergence.allCompleted).toBe(true);
      expect(convergence.nominalGridPreservedWithoutSubdivision).toBe(true);
      expect(convergence.observedOrder).toBeGreaterThanOrEqual(0.8);
      expect(convergence.stateOrderAccepted).toBe(true);
      expect(convergence.energyLedgerObservedOrder).toBeGreaterThanOrEqual(0.8);
      expect(convergence.energyLedgerOrderAccepted).toBe(true);
      expect(convergence.orderAccepted).toBe(true);
    }
  });

  it("rolls back a rejected deterministic substep attempt before retrying", () => {
    const initial = createPhaseB0HydromechanicsInitialStateV1(fixture, "on");
    const forcedFailure = stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
      fixture,
      initial,
      0.5e-7,
    );
    expect(forcedFailure.converged).toBe(false);
    if (forcedFailure.converged) return;
    const requestedDtSec = 0.5e-3;
    let factorTwoCallCount = 0;
    let factorFourRestartedFromInitial = false;
    const advance = advancePhaseB0HydromechanicsWithDeterministicSubstepsForTestV1(
      fixture,
      initial,
      requestedDtSec,
      (candidateFixture, candidateState, candidateDtSec) => {
        if (candidateDtSec === requestedDtSec) return forcedFailure;
        if (candidateDtSec === requestedDtSec / 2) {
          factorTwoCallCount += 1;
          if (factorTwoCallCount === 2) {
            return Object.freeze({ ...forcedFailure, rollbackState: candidateState });
          }
        }
        if (candidateDtSec === requestedDtSec / 4 && !factorFourRestartedFromInitial) {
          factorFourRestartedFromInitial = candidateState === initial;
        }
        return stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
          candidateFixture,
          candidateState,
          candidateDtSec,
        );
      },
    );
    expect(advance.advanced).toBe(true);
    if (!advance.advanced) return;
    expect(advance.acceptedSubstepFactor).toBe(4);
    expect(advance.rejectedAttempts).toHaveLength(2);
    expect(advance.rejectedAttempts[0].substepFactor).toBe(1);
    expect(advance.rejectedAttempts[0].failedSubstepIndex).toBe(0);
    expect(advance.rejectedAttempts[1].substepFactor).toBe(2);
    expect(advance.rejectedAttempts[1].failedSubstepIndex).toBe(1);
    expect(factorFourRestartedFromInitial).toBe(true);
    expect(advance.steps[0].previousState).toBe(initial);
    expect(advance.rollbackBetweenAttempts).toBe(true);
  });
});

function requireConvergedPathRoot(
  root: PhaseB0PublishedTriSegRootResultV1 | undefined,
): PhaseB0PublishedTriSegRootSuccessV1 {
  if (root === undefined) throw new Error("missing TriSeg continuation root");
  if (root.converged === false) throw new Error(root.message);
  return root;
}

function auditLocalRestoringPathNodes(input: Readonly<{
  fixture: PhaseB0SyntheticHydromechanicsCaseV1;
  rootInput: Omit<PhaseB0PublishedTriSegRootInputV1, "initialCoordinates">;
  path: readonly PhaseB0TriSegContinuationPointV1[];
  roots: readonly PhaseB0PublishedTriSegRootResultV1[];
  manifest: PhaseB0TriSegStaticRestoringGateManifestV1;
}>): void {
  expect(input.roots).toHaveLength(input.path.length);
  input.roots.forEach((result, index) => {
    const root = requireConvergedPathRoot(result);
    expect(root.oracle.taylorTensionErrorDomainEligible).toBe(true);
    expect(root.oracle.domainClassification).toBe("within_2pct_tension_error_domain");
    expect(root.scaledResidualInfinityNorm).toBeLessThanOrEqual(
      input.manifest.workConjugateStaticRestoringClassifier
        .policy.maximumScaledRootResidualInfinityNorm,
    );
    expect(root.scaledUpdateInfinityNorm).toBeLessThanOrEqual(
      input.manifest.workConjugateStaticRestoringClassifier
        .policy.maximumScaledRootUpdateInfinityNorm,
    );
    const node = input.path[index];
    const audit = auditPhaseB0TriSegStaticRestoringRootV1({
      rootInput: {
        ...input.rootInput,
        leftVentricularCavityVolumeM3: node.leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3: node.rightVentricularCavityVolumeM3,
      },
      root,
      generalizedForceResidualScales: {
        septalMidwallVolumePa:
          input.fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
        junctionRadiusN:
          input.fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
      },
      policy: input.manifest.workConjugateStaticRestoringClassifier.policy,
    });
    expect(audit.generalizedForceTransformAudit.accepted).toBe(true);
    expect(audit.rootRegularity.accepted).toBe(true);
    expect(audit.scaledRestoringTangent.classification).toBe("robust-restoring");
    expect(audit.acceptedUnderLocalStaticRestoringTestReference).toBe(true);
    expect(audit.energeticStability.eligible).toBe(false);
    expect(audit.physiologicalRootClaimed).toBe(false);
    expect(audit.globalUniquenessClaimed).toBe(false);
    expect(root.acceptedAsPhysiologicalRoot).toBe(false);
  });
}

function stressEvaluator(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  baseState: ReturnType<typeof createPhaseB0HydromechanicsInitialStateV1>,
) {
  return (geometry: PublishedTriSegGeometryV1) => {
    const state = {
      ...baseState,
      bloodVolumesM3: {
        ...baseState.bloodVolumesM3,
        LV: geometry.leftVentricularCavityVolumeM3,
        RV: geometry.rightVentricularCavityVolumeM3,
      },
      triSegCoordinates: {
        V_m_S: geometry.septalMidwallCapVolumeM3,
        y_m: geometry.junctionRadiusM,
      },
    } as typeof baseState;
    const evaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, state);
    return {
      fiberKirchhoffStressPa: {
        LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
        SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
        RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
      },
    };
  };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
