import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowCalciumWaveformV1,
  type MainWireAorticOutflowCalciumWaveformArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  compareMainWireAorticOutflowCalciumSourceConstrainedV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumSourceConstrainedComparisonV1";
import {
  compareMainWireAorticValveAreaControlV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAreaControlComparisonV1";
import {
  compareMainWireAorticOutflowCalciumDelayedMixtureV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
  measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1";
import {
  measurePeriodicAorticPressureFlowCouplingV1,
} from "@/analysis/methods/mainWire/MainWireAorticPressureFlowCouplingV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1,
  compareMainWireVentricularLandCalciumSourcesV1,
  type MainWireVentricularLandCalciumSourceArmInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandCalciumSourceComparisonV1";
import {
  LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_CLAIM_V1,
  createMainWireVentricularCalciumSourceAuditInputV1,
  evaluateMainWireVentricularCalciumSourceProtocolV1,
  resolveMainWireVentricularCalciumSourceProtocolV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceProtocolsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_CLAIM_V1,
  fitMainWireVentricularCalciumSourceTraceUnconstrainedAmplitudeSensitivityV1,
  fitMainWireVentricularCalciumSourceTraceV1,
  measureMainWireVentricularCalciumParamsAgainstSourceTraceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitV1";
import {
  MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1,
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialDelayedMixtureShapeV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
  validateMainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumWaveformParamsV1,
  resolveMainWireVentricularCalciumWaveformProfileV1,
  validateMainWireVentricularCalciumWaveformProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumSourceConstrainedParamsV1,
  resolveMainWireVentricularCalciumSourceConstrainedProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumPeakLockedTailParamsV1,
  resolveMainWireVentricularCalciumPeakLockedTailProfileV1,
  validateMainWireVentricularCalciumPeakLockedTailProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumPeakLockedTailAblationV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallAorticValveAreaControlV1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1,
} from "@/engine/valves/MainWireAorticValveAreaControlV1";

describe("main-wire aortic outflow calcium waveform ablation V1", () => {
  it("audits the prescribed calcium-to-Land isometric twitch at periodic closure", () => {
    const audit = measureMainWireVentricularLandIsometricTwitchAuditV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      { dtSec: 0.002, fixedLandStretch: 1 },
    );

    expect(audit.periodicClosure).toMatchObject({
      coldFixedInputConverged: true,
      converged: true,
    });
    expect(audit.periodicClosure.maximumLandStateClosureResidual)
      .toBeLessThanOrEqual(audit.protocol.p1StateClosureTolerance);
    expect(audit.protocol.sampleCount).toBe(500);
    expect(audit.protocol.fixedLandStretch).toBe(1);
    expect(audit.calcium.localPeakCountAboveFivePercentAmplitude).toBe(1);
    expect(audit.activeTwitch.localPeakCountAboveFivePercentAmplitude).toBe(1);
    expect(audit.activeTwitch.peakKPa)
      .toBeGreaterThan(audit.activeTwitch.minimumKPa);
    expect(audit.activeTwitch.relaxationTime50Sec).not.toBeNull();
    expect(audit.activeTwitch.relaxationTime95Sec).not.toBeNull();
    expect(audit.numericalHealth.maximumAbsoluteParallelSlsOverstressPa)
      .toBe(0);
    expect(audit.sourceContext).toMatchObject({
      sourceRestingExtensionRatio: 1,
      currentCalciumInputIsDigitizedSourceTrace: false,
      timeToPeakComparisonBoundary: {
        directComparisonEstablished: false,
      },
      publishedFinalModel: {
        timeToPeakSec: 0.175,
        relaxationTime50Sec: 0.121,
        relaxationTime95Sec: 0.281,
      },
    });
    expect(audit.sourceContext.directionalScreenOnly)
      .toMatchObject({
        fixedStretchMatchesSourceRestingExtensionRatio: true,
        timeToPeakDirectComparisonEstablished: false,
        everyTimingTargetMet: false,
        eligibleForSourceTraceReproductionClaim: false,
      });
    expect(MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1)
      .toMatchObject({
        exactModelStateOrCheckpointChanged: false,
        aorticValveOrCirculationUsed: false,
        sourceTraceReproductionClaimed: false,
        parameterSearchOrFitting: false,
      });
  });

  it("keeps the two Coppini-derived source protocols distinct and explicit", () => {
    const hunter = resolveMainWireVentricularCalciumSourceProtocolV1(
      "land2015-coppini-metric-hunter-construction",
    );
    const figure = resolveMainWireVentricularCalciumSourceProtocolV1(
      "land2017-figure6-coppini-digitized",
    );

    expect(hunter).toMatchObject({
      calciumInputKind: "published-analytic-source-construction",
      originalNumericSourceTraceUsed: false,
      figureDigitizationUsed: false,
      smoothingApplied: false,
      fittingApplied: false,
    });
    expect(figure).toMatchObject({
      calciumInputKind: "figure-digitized-source-trace",
      originalNumericSourceTraceUsed: false,
      figureDigitizationUsed: true,
      smoothingApplied: false,
      fittingApplied: false,
    });
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      0,
      hunter.protocolId,
    )).toBe(LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.diastolicCalciumUM);
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.timeToPeakSec,
      hunter.protocolId,
    )).toBeCloseTo(0.483, 12);
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
        .reportedTimeTo50PercentRelaxationSec,
      hunter.protocolId,
    )).toBeCloseTo(0.1399 + 0.5 * 0.3431, 12);
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
        .reportedTimeTo90PercentRelaxationSec,
      hunter.protocolId,
    )).toBeCloseTo(0.1399 + 0.1 * 0.3431, 12);
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      0.13,
      figure.protocolId,
    )).toBeCloseTo(0.592586, 6);
    expect(evaluateMainWireVentricularCalciumSourceProtocolV1(
      1,
      figure.protocolId,
    )).toBeCloseTo(0.166285, 6);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_CLAIM_V1)
      .toMatchObject({
        exactModelStateOrCheckpointChanged: false,
        sourceProtocolsUsedByCanonicalModel: false,
        sourceMeasurementUncertaintyAvailable: false,
      });
  });

  it("compares current and source calcium inputs under common Land conditions", () => {
    const arms: MainWireVentricularLandCalciumSourceArmInputV1[] = [];
    for (const inputId of
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1) {
      for (const stretch of
        MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1) {
        const audit = inputId === "current-analytic-biexponential"
          ? measureMainWireVentricularLandIsometricTwitchAuditV1(
            FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
            { dtSec: 0.002, fixedLandStretch: stretch.fixedLandStretch },
          )
          : measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
            createMainWireVentricularCalciumSourceAuditInputV1(inputId),
            { dtSec: 0.002, fixedLandStretch: stretch.fixedLandStretch },
          );
        arms.push({
          inputId,
          stretchContextId: stretch.contextId,
          audit,
        });
      }
    }

    const comparison = compareMainWireVentricularLandCalciumSourcesV1(arms);
    const resting = comparison.arms.filter((arm) =>
      arm.stretchContextId === "Land-source-resting-extension-ratio");
    const current = resting.find((arm) =>
      arm.inputId === "current-analytic-biexponential")!;
    const hunter = resting.find((arm) =>
      arm.inputId === "land2015-coppini-metric-hunter-construction")!;
    const figure = resting.find((arm) =>
      arm.inputId === "land2017-figure6-coppini-digitized")!;

    expect(comparison.allArmsPeriodicallyClosed).toBe(true);
    expect(comparison.allProtocolIdentitiesDistinct).toBe(true);
    expect(current.calciumPeakUM).toBeCloseTo(1, 3);
    expect(hunter.calciumPeakUM).toBeCloseTo(0.483, 3);
    expect(figure.calciumPeakUM).toBeCloseTo(0.592586, 5);
    expect(figure.activeTwitchPeakKPa)
      .toBeLessThan(current.activeTwitchPeakKPa);
    expect(hunter.activeTwitchPeakKPa)
      .toBeLessThan(current.activeTwitchPeakKPa);
    expect(figure.calciumLocalPeakCountAboveFivePercentAmplitude)
      .toBeGreaterThan(1);
    expect(figure.activeTwitchLocalPeakCountAboveFivePercentAmplitude)
      .toBe(1);
    expect(arms.find((arm) =>
      arm.inputId === "land2017-figure6-coppini-digitized")!.audit
      .sourceContext).toMatchObject({
        currentCalciumInputIsDigitizedSourceTrace: true,
        currentCalciumInputUsesOriginalNumericSourceTrace: false,
      });
    expect(comparison.claim).toMatchObject({
      currentExactModelChanged: false,
      parameterSearchOrFitting: false,
      canonicalAdoptionEstablished: false,
    });
  });

  it("constructs a low-order Figure 6 prior without a hemodynamic fit", () => {
    const profile =
      resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
        "land2017-figure6-source-constrained-biexponential",
      );
    const params = resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
      profile.profileId,
    );
    const pulseShape = measurePeriodicBiexponentialCalciumPulseShapeV1(
      params.cycleLengthSec,
      params.ventricular.riseTimeConstantSec,
      params.ventricular.decayTimeConstantSec,
    );
    const onset = params.ventricular.electricalToCalciumDelaySec;

    expect(profile).toMatchObject({
      ventricularDiastolicCalciumUM: 0.164321,
      ventricularPeakCalciumUM: 0.592586,
      ventricularRiseToDecayTimeConstantRatioHeld: true,
      wholeTraceCurveFittingUsed: false,
      hemodynamicOutcomeUsedToDeriveProfile: false,
    });
    expect(profile.ventricularPulseTimeToPeakSec).toBeCloseTo(0.13, 14);
    expect(pulseShape.timeToPeakSec).toBeCloseTo(0.13, 14);
    expect(
      params.ventricular.decayTimeConstantSec
      / params.ventricular.riseTimeConstantSec,
    ).toBeCloseTo(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
        .decayTimeConstantSec
      / FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
        .riseTimeConstantSec,
      14,
    );
    expect(evaluateFiveWallNormalCalciumDriveV1(
      onset,
      params,
    ).freeCalciumUMByWall.LVFW).toBeCloseTo(0.164321, 12);
    expect(evaluateFiveWallNormalCalciumDriveV1(
      onset + pulseShape.timeToPeakSec,
      params,
    ).freeCalciumUMByWall.LVFW).toBeCloseTo(0.592586, 12);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1)
      .toMatchObject({
        wholeTraceLeastSquaresFitApplied: false,
        sourceMetricMatchingUsesHemodynamics: false,
        calciumOrMechanicsStateAdded: false,
        canonicalParamsChanged: false,
      });
  });

  it("reproduces the fixed whole-trace alpha fit without using hemodynamics", () => {
    const fit = fitMainWireVentricularCalciumSourceTraceV1();
    const unconstrained =
      fitMainWireVentricularCalciumSourceTraceUnconstrainedAmplitudeSensitivityV1();
    const scalarMatched =
      resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
        "land2017-figure6-source-constrained-biexponential",
      );
    const scalarMatchedApproximation =
      measureMainWireVentricularCalciumParamsAgainstSourceTraceV1(
        scalarMatched,
      );
    const profile =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;

    expect(fit.parameters).toEqual({
      diastolicCalciumUM: profile.ventricularDiastolicCalciumUM,
      peakAmplitudeUM:
        profile.ventricularPeakCalciumUM
        - profile.ventricularDiastolicCalciumUM,
      riseTimeConstantSec: profile.ventricularRiseTimeConstantSec,
      decayTimeConstantSec: profile.ventricularDecayTimeConstantSec,
      sourceTraceOnsetOffsetSec: profile.sourceTraceOnsetOffsetSec,
    });
    expect(fit.shape.shapeRegime).toBe("alpha-limit");
    expect(fit.parameters.riseTimeConstantSec)
      .toBe(fit.parameters.decayTimeConstantSec);
    expect(fit.approximation.normalizedRootMeanSquareErrorBySourceAmplitude)
      .toBeLessThan(
        scalarMatchedApproximation
          .normalizedRootMeanSquareErrorBySourceAmplitude,
      );
    expect(Math.abs(fit.approximation.relativeExposureError))
      .toBeLessThan(0.005);
    expect(unconstrained.approximation
      .normalizedRootMeanSquareErrorBySourceAmplitude)
      .toBeLessThan(
        fit.approximation.normalizedRootMeanSquareErrorBySourceAmplitude,
      );
    expect(unconstrained.approximation.analyticMinimumCalciumUM)
      .toBeLessThan(unconstrained.approximation.sourceMinimumCalciumUM);
    expect(unconstrained.approximation.analyticMaximumCalciumUM)
      .toBeGreaterThan(unconstrained.approximation.sourceMaximumCalciumUM);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1
      .ventricular.riseTimeConstantSec)
      .toBe(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1
        .ventricular.decayTimeConstantSec);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_CLAIM_V1)
      .toMatchObject({
        hemodynamicOutcomeUsed: false,
        landTensionOutcomeUsed: false,
        smoothingApplied: false,
      });
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_CLAIM_V1)
      .toMatchObject({
        sourceOnsetOffsetIsElectricalDelay: false,
        calciumOrMechanicsStateAdded: false,
        canonicalParamsChanged: false,
      });
  });

  it("smoke-wires the whole-trace alpha fit as an identity-owned calcium profile", () => {
    const run =
      runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1({
        dtSec: 0.02,
        maximumBeatCount: 1,
      });
    const audit = measureMainWireVentricularLandIsometricTwitchAuditV1(
      run.calciumDriveParams,
      { dtSec: 0.002, fixedLandStretch: 1 },
    );

    expect(run.profile.profileId)
      .toBe("land2017-figure6-whole-trace-alpha-fit");
    expect(run.periodicResult.protocolIdentity.calciumDrive.parameterSetId)
      .toBe(run.calciumDriveParams.parameterSetId);
    expect(run.periodicResult.protocolComponentHashes
      .calciumDriveFixedParamsStableHash)
      .not.toBe("");
    expect(run.claim).toMatchObject({
      circulationRuntimeChanged: false,
      mechanicsProviderChanged: false,
      calciumOrMechanicsStateAdded: false,
      exactProtocolIdentityIncludesCalciumParams: true,
    });
    expect(audit.periodicClosure.converged).toBe(true);
    expect(audit.calcium.localPeakCountAboveFivePercentAmplitude).toBe(1);
    expect(audit.activeTwitch.localPeakCountAboveFivePercentAmplitude).toBe(1);
  });

  it("smoke-wires the source-constrained prior as a calcium-only protocol", () => {
    const runs =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
            { dtSec: 0.02, maximumBeatCount: 1 },
            profileId,
          ),
      );
    const comparison =
      compareMainWireAorticOutflowCalciumSourceConstrainedV1(runs.map(
        (run) => ({
          profileId: run.profile.profileId,
          periodicResult: run.periodicResult,
        }),
      ));

    expect(comparison.nonCalciumProtocolComponentsCommon).toBe(true);
    expect(comparison.arms).toHaveLength(2);
    expect(comparison.sourceApproximation)
      .toMatchObject({
        alignment: "source-phase-zero-to-analytic-calcium-onset",
        sampleIntervalSec: 0.001,
        sampleCount: 1000,
      });
    expect(comparison.sourceApproximation
      .normalizedRootMeanSquareErrorBySourceAmplitude).toBeGreaterThan(0);
    expect(comparison.sourceApproximation.relativeExposureError)
      .toBeGreaterThan(0);
    expect(comparison.arms[0]!.cycle.calciumDriveStableHash)
      .not.toBe(comparison.arms[1]!.cycle.calciumDriveStableHash);
    expect(comparison.candidateScreen.period1AndIntegrationPassed).toBe(false);
    expect(runs.every((run) =>
      run.claim.exactProtocolIdentityIncludesCalciumParams)).toBe(true);
  });

  it("smoke-wires the fixed AoV-area identifiability control", () => {
    const runs = MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1.map(
      (pointId) => runMainWireNormalAdultFiveWallAorticValveAreaControlV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        pointId,
      ),
    );
    const comparison = compareMainWireAorticValveAreaControlV1(runs.map(
      (run) => ({
        pointId: run.point.pointId,
        periodicResult: run.periodicResult,
      }),
    ));

    expect(comparison.arms.map((arm) => arm.maximumForwardEoaCm2))
      .toEqual([3, 3.5, 4]);
    expect(comparison.allProtocolIdentitiesDistinct).toBe(true);
    expect(comparison.allArmsPeriod1AndIntegrated).toBe(false);
    expect(runs.every((run) =>
      run.periodicResult.valveResearchInput.claim.researchInputRole
        === "continuous-effective-area-research-not-clinical-diagnosis"))
      .toBe(true);
    expect(runs.every((run) =>
      run.claim.onlyAorticMaximumForwardEoaChangedAcrossPoints)).toBe(true);
    expect(MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_CLAIM_V1).toMatchObject({
      aorticValveConstitutiveLawChanged: false,
      openingKineticsChanged: false,
      circulationLoadOrDriverChanged: false,
      parameterSearchOrFitting: false,
    });
    expect(() => compareMainWireAorticValveAreaControlV1([
      {
        pointId: runs[0]!.point.pointId,
        periodicResult: runs[0]!.periodicResult,
      },
    ])).toThrow("missing AoV area control point");
  });

  it("classifies an unsmoothed pressure-flow derivative proxy by sign", () => {
    const phases = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
    const pressures = [80, 80, 82, 86, 87, 84, 80, 80];
    const rootFlows = [0, 0, 20, 50, 40, 20, 0, 0];
    const valveFlows = [0, 0, 100, 200, 150, 100, 0, 0];
    const measured = measurePeriodicAorticPressureFlowCouplingV1(
      phases.map((cyclePhase01, index) => ({
        cyclePhase01,
        aorticRootAbsolutePressureMmHg: pressures[index]!,
        aorticRootFlowMlPerSec: rootFlows[index]!,
        aorticValveFlowMlPerSec: valveFlows[index]!,
      })),
      0.1,
      {
        aorticRootAbsolutePressureMmHg: 80,
        aorticRootFlowMlPerSec: 0,
      },
    );

    expect(measured.ejectionEpisode.durationSec).toBeCloseTo(0.4, 14);
    expect(measured.ejectionEpisode.aorticValveFlowPeakPhase01).toBe(0.375);
    expect(measured.ejectionEpisode
      .signedAorticRootFlowPeakLagFromAorticValveFlowPeakSec).toBe(0);
    const proxy = measured.pressureFlowCouplingProxy;
    expect(proxy.maximumCompressionLikeIntensityMmHgMlPerSec3)
      .toBeCloseTo(12_000, 12);
    expect(proxy.compressionLikePeakPhase01).toBe(0.375);
    expect(proxy.compressionLikeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(1_600, 12);
    expect(proxy.maximumDecompressionLikeIntensityMmHgMlPerSec3)
      .toBeCloseTo(6_000, 12);
    expect(proxy.decompressionLikePeakPhase01).toBe(0.625);
    expect(proxy.decompressionLikeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(600, 12);
    expect(proxy.mismatchMagnitudeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(100, 12);
    expect(proxy.absoluteEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(2_300, 12);
    expect(
      proxy.compressionLikeFractionOfAbsoluteEjectionIntegral01
      + proxy.decompressionLikeFractionOfAbsoluteEjectionIntegral01
      + proxy.mismatchFractionOfAbsoluteEjectionIntegral01,
    ).toBeCloseTo(1, 14);
    expect(measured.aorticRootStorage.flowAtAorticValveFlowPeakMlPerSec)
      .toBe(150);
    expect(measured.aorticRootStorage
      .positiveAccumulationVolumeDuringEjectionMl).toBeCloseTo(42, 12);
  });

  it("matches the periodic pulse peak and cycle integral analytically", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const shapes = [
      [prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec],
      [prior.ventricular.riseTimeConstantSec * 4 / 3,
        prior.ventricular.decayTimeConstantSec],
      [prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec * 4 / 3],
      [prior.ventricular.riseTimeConstantSec * 4 / 3,
        prior.ventricular.decayTimeConstantSec * 4 / 3],
    ] as const;
    const sampleCount = 20_000;

    for (const [riseTimeConstantSec, decayTimeConstantSec] of shapes) {
      const analytic = measurePeriodicBiexponentialCalciumPulseShapeV1(
        prior.cycleLengthSec,
        riseTimeConstantSec,
        decayTimeConstantSec,
      );
      const params = Object.freeze({
        ...prior,
        parameterSetId:
          `numerical-pulse-check-${riseTimeConstantSec}-${decayTimeConstantSec}`,
        ventricular: Object.freeze({
          ...prior.ventricular,
          diastolicCalciumUM: 0,
          peakAmplitudeUM: 1,
          riseTimeConstantSec,
          decayTimeConstantSec,
          electricalToCalciumDelaySec: 0,
        }),
      });
      let numericalIntegral = 0;
      let peakValue = Number.NEGATIVE_INFINITY;
      let peakTimeSec = 0;
      for (let index = 0; index < sampleCount; index += 1) {
        const timeSec = (index + 0.5) / sampleCount;
        const value = evaluateFiveWallNormalCalciumDriveV1(timeSec, params)
          .freeCalciumUMByWall.LVFW;
        numericalIntegral += value / sampleCount;
        if (value > peakValue) {
          peakValue = value;
          peakTimeSec = timeSec;
        }
      }
      expect(numericalIntegral).toBeCloseTo(
        analytic.normalizedPulseCycleIntegralSec,
        8,
      );
      expect(peakTimeSec).toBeCloseTo(analytic.timeToPeakSec, 4);
      expect(peakValue).toBeCloseTo(1, 7);
    }
    expect(() => measurePeriodicBiexponentialCalciumPulseShapeV1(1, 0.2, 0.1))
      .toThrow("decay time constant must not be shorter than rise time constant");
  });

  it("seals an exposure-preserving fixed rise-by-decay factorial", () => {
    const profiles = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
      resolveMainWireVentricularCalciumWaveformProfileV1,
    );
    expect(profiles.map((profile) => [
      profile.riseTimeFactor,
      profile.decayTimeFactor,
    ])).toEqual([
      ["baseline", "baseline"],
      ["high", "baseline"],
      ["baseline", "high"],
      ["high", "high"],
    ]);
    for (const profile of profiles) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile.ventricularSupradiastolicCalciumCycleExposureScaleFromPrior)
        .toBeCloseTo(1, 14);
      expect(profile.parameterSearchOrFitting).toBe(false);
      expect(profile.hemodynamicOutcomeUsedToDeriveProfile).toBe(false);
      expect(validateMainWireVentricularCalciumWaveformProfileV1(profile))
        .toEqual([]);
    }
    expect(profiles[1]!.ventricularRiseTimeScaleFromPrior)
      .toBeCloseTo(4 / 3, 14);
    expect(profiles[2]!.ventricularDecayTimeScaleFromPrior)
      .toBeCloseTo(4 / 3, 14);
    expect(profiles.slice(1).every((profile) =>
      profile.ventricularPeakAmplitudeScaleFromPrior < 1)).toBe(true);
    expect(validateMainWireVentricularCalciumWaveformProfileV1({
      ...profiles[1]!,
      ventricularRiseTimeScaleFromPrior: 2,
    })).toContain(
      "ventricular calcium waveform profile ventricularRiseTimeScaleFromPrior differs from its fixed value",
    );
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1)
      .toMatchObject({
        everyProfilePreservesVentricularCalciumCycleExposure: true,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        parameterSearchOrFitting: false,
      });
  });

  it("locks calcium peak time while redistributing exposure into the tail", () => {
    const profiles =
      MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1.map(
        resolveMainWireVentricularCalciumPeakLockedTailProfileV1,
      );
    const params = profiles.map((profile) =>
      resolveMainWireVentricularCalciumPeakLockedTailParamsV1(
        profile.profileId,
      ));
    expect(params[0]).toBe(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1);
    expect(profiles[1]!.ventricularDecayTimeScaleFromPrior)
      .toBeCloseTo(4 / 3, 14);
    expect(profiles[1]!.ventricularRiseTimeScaleFromPrior).toBeLessThan(1);
    expect(Math.abs(profiles[1]!.ventricularPulseTimeToPeakResidualSec))
      .toBeLessThanOrEqual(1e-14);
    expect(profiles[1]!
      .ventricularSupradiastolicCalciumCycleExposureScaleFromPrior)
      .toBeCloseTo(1, 14);
    expect(profiles[1]!.ventricularPeakAmplitudeScaleFromPrior).toBeLessThan(1);
    expect(validateMainWireVentricularCalciumPeakLockedTailProfileV1(
      profiles[1]!,
    )).toEqual([]);
    const shapes = params.map((value) =>
      measurePeriodicBiexponentialCalciumPulseShapeV1(
        value.cycleLengthSec,
        value.ventricular.riseTimeConstantSec,
        value.ventricular.decayTimeConstantSec,
      ));
    expect(shapes[1]!.timeToPeakSec).toBeCloseTo(shapes[0]!.timeToPeakSec, 14);
    expect(
      params[1]!.ventricular.peakAmplitudeUM
      * shapes[1]!.normalizedPulseCycleIntegralSec,
    ).toBeCloseTo(
      params[0]!.ventricular.peakAmplitudeUM
      * shapes[0]!.normalizedPulseCycleIntegralSec,
      14,
    );
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_CLAIM_V1)
      .toMatchObject({
        everyProfilePreservesCalciumPulsePeakTime: true,
        everyProfilePreservesVentricularCalciumCycleExposure: true,
        calciumOrMechanicsStateAdded: false,
        parameterSearchOrFitting: false,
        hemodynamicOutcomeUsedToDeriveProfile: false,
      });
  });

  it("seals and morphology-classifies an exposure-preserving delayed-mixture factorial", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const profiles =
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
        resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
      );
    expect(profiles.map((profile) => [
      profile.delayedWeightFactor,
      profile.delayReference,
    ])).toEqual([
      ["quarter", "baseline-ventricular-rise-time-constant"],
      ["half", "baseline-ventricular-rise-time-constant"],
      ["quarter", "baseline-ventricular-decay-time-constant"],
      ["half", "baseline-ventricular-decay-time-constant"],
    ]);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1)
      .toBe(profiles[0]);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1)
      .toMatchObject({
        oneSidedFactorial: true,
        everyProfilePreservesVentricularCalciumCycleExposure: true,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        parameterSearchOrFitting: false,
        hemodynamicOutcomeUsedToDeriveProfile: false,
      });
    const base = measurePeriodicBiexponentialCalciumPulseShapeV1(
      prior.cycleLengthSec,
      prior.ventricular.riseTimeConstantSec,
      prior.ventricular.decayTimeConstantSec,
    );
    const sampleCount = 20_000;
    const peakCounts: number[] = [];
    for (const profile of profiles) {
      const params =
        resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
          profile.profileId,
        );
      const measured = measurePeriodicBiexponentialDelayedMixtureShapeV1(
        prior.cycleLengthSec,
        prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec,
        profile.delayedWeight01,
        profile.delaySec,
      );
      expect(profile.unnormalizedMixturePeak01)
        .toBe(measured.unnormalizedMixturePeak01);
      expect(profile
        .ventricularSupradiastolicCalciumCycleExposureScaleFromPrior)
        .toBeCloseTo(1, 14);
      expect(validateMainWireVentricularCalciumDelayedMixtureProfileV1(profile))
        .toEqual([]);
      const pulses = Array.from({ length: sampleCount }, (_, index) =>
        evaluateFiveWallNormalCalciumDriveV1(
          (index + 0.5) / sampleCount,
          params,
        ).ventricularNormalizedPulse01);
      const numericalIntegral = pulses.reduce(
        (sum, value) => sum + value,
        0,
      ) / sampleCount;
      expect(numericalIntegral)
        .toBeCloseTo(measured.normalizedMixtureCycleIntegralSec, 8);
      expect(Math.max(...pulses)).toBeCloseTo(1, 7);
      peakCounts.push(countStrictCyclicLocalMaxima(pulses, 0.05));
      expect(
        params.ventricular.peakAmplitudeUM * numericalIntegral,
      ).toBeCloseTo(
        prior.ventricular.peakAmplitudeUM
          * base.normalizedPulseCycleIntegralSec,
        8,
      );
    }
    expect(peakCounts).toEqual([1, 1, 2, 2]);
  });

  it("preserves the canonical run exactly and changes only calcium identity", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const baseline =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "canonical",
      );
    const broadened =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "ventricular-calcium-rise-decay-high-exposure-preserving",
      );
    const peakLockedTail =
      runMainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "ventricular-calcium-peak-locked-tail-high-exposure-preserving",
      );
    expect(resolveMainWireVentricularCalciumWaveformParamsV1("canonical"))
      .toBe(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1);
    expect(baseline.periodicResult).toEqual(canonical);
    const loadedShortening =
      measureMainWireVentricularLoadedShorteningAuditV1(
        baseline.periodicResult,
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      );
    expect(Object.keys(loadedShortening.walls))
      .toEqual(["LVFW", "SEP", "RVFW"]);
    for (const wall of Object.values(loadedShortening.walls)) {
      expect(wall.fullKinematicsReplay.converged).toBe(true);
      expect(wall.distortionSuppressedReplay.converged).toBe(true);
      expect(wall.fixedAtEjectionOnsetReplay.converged).toBe(true);
      expect(wall.distortionSuppressedReplay.minimumZetaW).toBe(0);
      expect(wall.distortionSuppressedReplay.maximumZetaW).toBe(0);
      expect(wall.distortionSuppressedReplay.minimumZetaS).toBe(0);
      expect(wall.distortionSuppressedReplay.maximumZetaS).toBe(0);
      expect(wall.fixedAtEjectionOnsetReplay.minimumZetaW).toBe(0);
      expect(wall.fixedAtEjectionOnsetReplay.maximumZetaW).toBe(0);
      expect(wall.fixedAtEjectionOnsetReplay.minimumZetaS).toBe(0);
      expect(wall.fixedAtEjectionOnsetReplay.maximumZetaS).toBe(0);
      expect(wall.strainHistory.maximumLandStretch)
        .toBeGreaterThan(wall.strainHistory.minimumLandStretch);
      expect(wall.recordedWholeHeart.peakActiveStressKPa).toBeGreaterThan(0);
    }
    expect(MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1)
      .toMatchObject({
        exactModelStateOrCheckpointChanged: false,
        replayFeedsBackIntoMechanicsOrCirculation: false,
        distortionSuppressedReplayIsProposedModel: false,
        parameterSearchOrFitting: false,
      });
    expect(broadened.periodicResult.protocolIdentityHash)
      .not.toBe(baseline.periodicResult.protocolIdentityHash);
    expect(peakLockedTail.periodicResult.protocolIdentityHash)
      .not.toBe(baseline.periodicResult.protocolIdentityHash);
    expect(peakLockedTail.claim).toMatchObject({
      circulationRuntimeChanged: false,
      mechanicsProviderChanged: false,
      calciumOrMechanicsStateAdded: false,
      acceptedStateOrCheckpointTopologyChanged: false,
    });
    expect(broadened.periodicResult.protocolComponentHashes
      .calciumDriveFixedParamsStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
      );
    const withoutCalciumHash = (
      hashes: typeof baseline.periodicResult.protocolComponentHashes,
    ) => {
      const { calciumDriveFixedParamsStableHash: _, ...rest } = hashes;
      return rest;
    };
    expect(withoutCalciumHash(broadened.periodicResult.protocolComponentHashes))
      .toEqual(withoutCalciumHash(
        baseline.periodicResult.protocolComponentHashes,
      ));
    expect(broadened.claim).toMatchObject({
      circulationRuntimeChanged: false,
      mechanicsProviderChanged: false,
      calciumOrMechanicsStateAdded: false,
      acceptedStateOrCheckpointTopologyChanged: false,
    });
    expect(Object.keys(broadened.periodicResult.terminalCycleBoundaryWarmStart!
      .checkpoint.circulation.state.dynamicEdgeFlowsMlPerSec))
      .toEqual(["Ao_SA", "PA_PArt"]);
    expect(() =>
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1, calciumTau: 0.2 } as never,
        "canonical",
      )).toThrow("reject unsupported field: calciumTau");
  }, 60_000);

  it("reports finite four-arm factorial diagnostics and fail-closed input", () => {
    const inputs: MainWireAorticOutflowCalciumWaveformArmInputV1[] =
      MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
        (profileId) => {
          const run =
            runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
              { dtSec: 0.02, maximumBeatCount: 2 },
              profileId,
            );
          return { profileId, periodicResult: run.periodicResult };
        },
      );
    const comparison = compareMainWireAorticOutflowCalciumWaveformV1(inputs);
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(12);
    expect(comparison.arms.map((arm) => arm.profileId))
      .toEqual(MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1);
    for (const arm of comparison.arms) {
      expect(arm.aorticMaximumFlowMlPerSec).toBeGreaterThan(0);
      expect(arm.aorticStrictlyPositiveFlowTimeSec).toBeGreaterThan(0);
      expect(arm.aorticFlowPeakCountAboveFivePercent).toBeGreaterThanOrEqual(1);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeGreaterThanOrEqual(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeLessThanOrEqual(1);
      const coupling = arm.aorticPressureFlowCoupling.summary
        .pressureFlowCouplingProxy;
      expect(
        coupling.compressionLikeFractionOfAbsoluteEjectionIntegral01
        + coupling.decompressionLikeFractionOfAbsoluteEjectionIntegral01
        + coupling.mismatchFractionOfAbsoluteEjectionIntegral01,
      ).toBeCloseTo(1, 12);
      expect(arm.aorticPressureFlowCoupling.claim.clinicalWaveIntensityAnalysis)
        .toBe(false);
      expect(arm.configuredSupradiastolicCalciumCycleExposureUMSec)
        .toBeCloseTo(
          comparison.arms[0]!
            .configuredSupradiastolicCalciumCycleExposureUMSec,
          12,
        );
      expect(allNumbersFiniteOrNull(arm)).toBe(true);
    }
    expect(comparison.factorialContrasts.every(allNumbersFiniteOrNull))
      .toBe(true);
    expect(comparison.claim.exactFrameMutation).toBe(false);
    expect(comparison.claim.pressureStationDifferencePreserved).toBe(true);
    expect(() => compareMainWireAorticOutflowCalciumWaveformV1(
      inputs.slice(0, 3),
    )).toThrow("missing ventricular calcium arm");
    expect(() => compareMainWireAorticOutflowCalciumWaveformV1([
      ...inputs,
      inputs[0]!,
    ])).toThrow("duplicate ventricular calcium arm");
  }, 60_000);

  it("runs the delayed mixture without changing canonical topology", () => {
    const canonical =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 2 },
        "canonical",
      );
    const delayedRuns =
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
            { dtSec: 0.02, maximumBeatCount: 2 },
            profileId,
          ),
      );
    const withoutCalciumHash = (
      hashes: typeof canonical.periodicResult.protocolComponentHashes,
    ) => {
      const { calciumDriveFixedParamsStableHash: _, ...rest } = hashes;
      return rest;
    };
    for (const delayed of delayedRuns) {
      expect(delayed.periodicResult.protocolIdentityHash)
        .not.toBe(canonical.periodicResult.protocolIdentityHash);
      expect(withoutCalciumHash(
        delayed.periodicResult.protocolComponentHashes,
      )).toEqual(withoutCalciumHash(
        canonical.periodicResult.protocolComponentHashes,
      ));
      expect(delayed.claim).toMatchObject({
        circulationRuntimeChanged: false,
        mechanicsProviderChanged: false,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    }
    const comparison = compareMainWireAorticOutflowCalciumDelayedMixtureV1(
      canonical.periodicResult,
      delayedRuns.map((run) => ({
        profileId: run.profile.profileId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(comparison.delayedMixtures).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(12);
    expect(comparison.externalReferenceSelection
      .morphologySafeCandidateRank).toHaveLength(2);
    expect(comparison.delayedMixtures.every((arm) =>
      arm.kinematicFloor.currentDuration.cauchySchwarzFloorSatisfied))
      .toBe(true);
    expect(comparison.delayedMixtures.every((arm) =>
      arm.preservedMacroFeasibility.claim.necessaryNotSufficient))
      .toBe(true);
    expect(comparison.delayedMixtures.map((arm) =>
      arm.ventricularCalciumStrictLocalPeakCountAboveFivePercent))
      .toEqual([1, 1, 2, 2]);
    expect(comparison.delayedMixtures.map((arm) =>
      arm.morphologyScreen!.morphologyPreserved))
      .toEqual([true, true, false, false]);
    for (const arm of comparison.delayedMixtures) {
      expect(arm.lvfwActiveStressStrictLocalPeakCountAboveFivePercent)
        .toBeGreaterThan(0);
    }
    expect(allNumbersFiniteOrNull(comparison)).toBe(true);
  }, 60_000);

  it("pairs the morphology-safe arm with the fixed systemic-load envelope", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1.map(
        (loadPointId) => ({
          loadPointId,
          canonicalResult:
            runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              loadPointId,
            ),
          candidateResult:
            runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
              loadPointId,
            ).periodicResult,
        }),
      );
    const envelope =
      measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(inputs);
    expect(envelope.arms).toHaveLength(3);
    expect(envelope.profile.profileId)
      .toBe(MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1);
    expect(envelope.morphologyPreservedAcrossEnvelope).toBe(true);
    expect(envelope.claim.outcomeInformedProfileSelection).toBe(true);
    expect(envelope.claim.numericParameterFittingOrOptimization).toBe(false);
    expect(allNumbersFiniteOrNull(envelope)).toBe(true);
    expect(() =>
      measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(
        inputs.slice(1),
      )).toThrow("missing delayed-mixture load point");
  }, 60_000);
});

function countStrictCyclicLocalMaxima(
  values: readonly number[],
  threshold: number,
): number {
  return values.filter((value, index) =>
    value >= threshold
    && value > values[(index - 1 + values.length) % values.length]!
    && value > values[(index + 1) % values.length]!).length;
}

function allNumbersFiniteOrNull(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumbersFiniteOrNull);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumbersFiniteOrNull);
  }
  return true;
}
