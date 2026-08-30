import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_METRIC_IDS_V1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1";
import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

type Run =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1;

const FOCUSED_NUMERICAL_REGRESSION_STEPS_PER_BEAT = 500 as const;
const PRIMARY_SCIENTIFIC_READOUT_STEPS_PER_BEAT = 2_000 as const;

describe("main-wire V10 matched-alpha saturating HR90 opening-load mechanism analysis V1", () => {
  let runs: readonly Run[];
  let analysis: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1;

  beforeAll(() => {
    runs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.map(
        (arm) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
            {
              dtSec: 60 / 90 / FOCUSED_NUMERICAL_REGRESSION_STEPS_PER_BEAT,
              maximumBeatCount: 72,
            },
            arm.armId,
          ),
      ),
    );
    analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        runs,
      );
  }, 180_000);

  it("reuses the shared event ledger and retains all four per-arm ledgers", () => {
    expect(analysis.experimentId).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID,
    );
    expect(analysis.armsInCatalogOrder.map((arm) => arm.arm.armId)).toEqual(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.map(
        (arm) => arm.armId,
      ),
    );
    expect(analysis.allArmsPeriod1AndIntegrationPassed).toBe(true);
    expect(analysis.allArmsInterpretationEligible).toBe(true);

    analysis.armsInCatalogOrder.forEach((measured, index) => {
      const run = runs[index]!;
      const direct =
        measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
          {
            sourceLabel: measured.arm.armId,
            calciumDriveParams: run.calciumDriveParams,
            periodicResult: run.periodicResult,
          },
        );
      expect(measured.ledger).toEqual(direct);
      expect(measured.ledger.period1AndIntegrationPassed).toBe(true);
      expect(measured.ledger.singleDistinctAorticFlowPeakPassed).toBe(true);
      expect(measured.ledger.exactStationAuditPassed).toBe(true);
      expect(measured.ledger.ictDecomposition.identityWithinTolerance).toBe(
        true,
      );
      const ledger = measured.ledger;
      const ict = ledger.ictDecomposition;
      const pressure = ledger.calciumRisePressureBuildToLocalOpening;
      const cycle = ledger.cycleMetrics;
      const mitral = ledger.mitralFilling.existingDiastolicFlowReadback;
      expect(measured.metrics).toEqual({
        canonicalIctSec: ict.canonicalFlowThresholdIctSec,
        mitralClosureToCalciumRiseSignedSec:
          ict.mitralClosureToCalciumRiseSignedSec,
        calciumRiseToExactLocalGradientPositiveSec:
          ict.calciumRiseToExactLocalGradientPositiveSec,
        exactLocalGradientPositiveToStrictPositiveFlowSec:
          ict.exactLocalGradientPositiveToStrictPositiveFlowSec,
        strictPositiveFlowToCanonicalOnePercentAvoSec:
          ict.strictPositiveFlowToCanonicalOnePercentAvoSec,
        calciumRiseToCanonicalAvoSec: ict.calciumRiseToCanonicalAvoSec,
        calciumRiseInitialProximalPortMinusLvDeficitMmHg:
          pressure.initialProximalPortMinusLeftVentricleDeficitMmHg,
        calciumRiseInitialLvPressureMmHg:
          pressure.initialLeftVentricularPressureMmHg,
        calciumRiseInitialProximalPortPressureMmHg:
          pressure.initialProximalPortPressureMmHg,
        calciumRiseLvPressureRiseToLocalZeroMmHg:
          pressure.leftVentricularPressureRiseMmHg,
        calciumRiseProximalPortPressureChangeToLocalZeroMmHg:
          pressure.proximalPortPressureChangeMmHg,
        calciumRiseMeanLvPressureRiseRateMmHgPerSec:
          pressure.meanLeftVentricularPressureRiseRateMmHgPerSec,
        calciumRiseMeanProximalPortPressureChangeRateMmHgPerSec:
          pressure.meanProximalPortPressureChangeRateMmHgPerSec,
        maximumLeftVentricularVolumeMl: cycle.maximumLeftVentricularVolumeMl,
        calciumRiseAcceptedEndpointLeftVentricularVolumeMl:
          ledger.eventSnapshots.ventricularCalciumRise.leftVentricularVolumeMl,
        onePercentFlowInterpolatedEjectionTimeSec:
          ledger.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
        meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
        strokeVolumeMl: cycle.aorticForwardVolumeMl,
        meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
        maximumPositiveLeftVentricularDpdtMmHgPerSec:
          cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
        leftVentricularIvrtSec:
          cycle.leftVentricularIsovolumicRelaxationTimeSec,
        mitralPeakEToARatio: mitral.peakEToARatio,
        mitralForwardVolumeEToARatio: mitral.forwardVolumeEToARatio,
        mitralModeledVtiEToARatio: mitral.modeledVtiEToARatio,
      });
    });
  });

  it("proves the two declared hash axes are isolated", () => {
    expect(analysis.hashIsolation).toEqual({
      allFourProtocolIdentityHashesUnique: true,
      allMechanicsProviderParameterIdentityHashesIdentical: true,
      allMechanicsProviderMetadataHashesIdentical: true,
      allCalciumDriveHashesIdentical: true,
      allTopologyHashesIdentical: true,
      allCommonPericardiumHashesIdentical: true,
      allPeriodicPolicyHashesIdentical: true,
      exactlyTwoCirculationRuntimeHashes: true,
      circulationRuntimeHashDependsOnlyOnSystemicResistanceLevel: true,
      exactlyTwoBloodVolumeOperatingPointHashes: true,
      bloodVolumeOperatingPointHashDependsOnlyOnStressedVolumeLevel: true,
      exactAssemblyAuditMatchesProtocolComponentHashes: true,
      onlyDeclaredLoadHashAxesDiffer: true,
    });
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1,
    ).toMatchObject({
      mechanismAblationOnly: true,
      focusedNumericalRegressionResolutionPerBeat:
        FOCUSED_NUMERICAL_REGRESSION_STEPS_PER_BEAT,
      primaryScientificReadoutResolutionPerBeat:
        PRIMARY_SCIENTIFIC_READOUT_STEPS_PER_BEAT,
      volumeAxisIntervention: {
        baselineFixedTotalBloodVolumeMl: 5_522.11,
        highFixedTotalBloodVolumeMl: 5_832.994143468708,
        highMinusBaselineTotalBloodVolumeMl: 310.8841434687083,
        canonicalAdditionalInitialSvVcLedgerScaleFromBaseline: 4 / 3,
        totalBloodVolumeFixedWithinEachRun: true,
        totalBloodVolumeDiffersAcrossVolumeAxisArms: true,
        convergedVolumeAndPressureDistributionIsEndogenous: true,
        purePreloadMechanismClaimed: false,
        independentlyControlledStressedVenousVolumeMechanismClaimed: false,
      },
      canonicalHeartRateDependentTotalBloodVolumePolicyProposed: false,
      canonicalHeartRateDependentSystemicResistancePolicyProposed: false,
      outcomeTargetedRecalibrationApplied: false,
      parameterSearchOrFitting: false,
      canonicalAdoptionEstablished: false,
    });
    for (const run of runs) {
      const high =
        run.openingLoadMechanismArm.stressedVenousVolumeLevel === "high";
      const expectedTotalBloodVolumeMl = high ? 5_832.994143468708 : 5_522.11;
      expect(run.stressedVenousVolumePoint.fixedTotalBloodVolumeMl).toBeCloseTo(
        expectedTotalBloodVolumeMl,
        10,
      );
      expect(
        run.periodicResult.bloodVolumeOperatingPointAudit
          .resolvedTotalBloodVolumeMl,
      ).toBeCloseTo(expectedTotalBloodVolumeMl, 8);
      expect(
        run.stressedVenousVolumePoint.canonicalAdditionalSvVcVolumeScale,
      ).toBe(high ? 4 / 3 : 1);
    }
  });

  it("returns exact simple effects at both opposing levels and the interaction for every metric", () => {
    expect(analysis.factorialContrasts).toHaveLength(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_METRIC_IDS_V1.length,
    );
    const [baseline, highVolume, lowResistance, combined] =
      analysis.armsInCatalogOrder;
    for (const contrast of analysis.factorialContrasts) {
      const metricId = contrast.metricId;
      const b = baseline!.metrics[metricId];
      const v = highVolume!.metrics[metricId];
      const r = lowResistance!.metrics[metricId];
      const rv = combined!.metrics[metricId];
      const allAvailable =
        b !== null && v !== null && r !== null && rv !== null;
      expect(contrast.allFourArmValuesAvailable).toBe(allAvailable);
      expect(contrast.baselineResistanceBaselineVolumeValue).toBe(b);
      expect(contrast.systemicResistanceLowMinusBaselineAtBaselineVolume).toBe(
        allAvailable ? r! - b! : null,
      );
      expect(contrast.systemicResistanceLowMinusBaselineAtHighVolume).toBe(
        allAvailable ? rv! - v! : null,
      );
      expect(
        contrast.stressedVenousVolumeHighMinusBaselineAtBaselineResistance,
      ).toBe(allAvailable ? v! - b! : null);
      expect(
        contrast.stressedVenousVolumeHighMinusBaselineAtLowResistance,
      ).toBe(allAvailable ? rv! - r! : null);
      expect(contrast.interactionDifferenceOfDifferences).toBe(
        allAvailable ? rv! - v! - r! + b! : null,
      );
    }

    const caToG0 = analysis.factorialContrasts.find(
      (contrast) =>
        contrast.metricId === "calciumRiseToExactLocalGradientPositiveSec",
    );
    expect(caToG0).toBeDefined();
    expect(caToG0!.unit).toBe("sec");
    expect(caToG0!.allFourArmValuesAvailable).toBe(true);
  });

  it("pins the focused cycle/500 physiological regression separately from the cycle/2000 primary readout", () => {
    expect(new Set(runs.map((run) => run.periodicResult.stepsPerBeat))).toEqual(
      new Set([FOCUSED_NUMERICAL_REGRESSION_STEPS_PER_BEAT]),
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1.primaryScientificReadoutResolutionPerBeat,
    ).toBe(PRIMARY_SCIENTIFIC_READOUT_STEPS_PER_BEAT);

    // These values are a focused cycle/500 numerical regression. They are not
    // the cycle/2000 primary scientific estimates emitted by the tool.
    const expectedArms = [
      {
        canonicalIctSec: 0.09066666666666666,
        mitralClosureToCalciumRiseSignedSec: 0.025752445275310176,
        calciumRiseToExactLocalGradientPositiveSec: 0.06478901727915031,
        calciumRiseInitialProximalPortMinusLvDeficitMmHg: 66.61648196119769,
        onePercentFlowInterpolatedEjectionTimeSec: 0.2149973053971191,
        meanDopplerGradientMmHg: 2.753312246038643,
        peakDopplerGradientMmHg: 4.523345092721162,
        strokeVolumeMl: 56.63937433376658,
        meanAorticPressureMmHg: 82.54265672671968,
      },
      {
        canonicalIctSec: 0.076,
        mitralClosureToCalciumRiseSignedSec: 0.016419111939521503,
        calciumRiseToExactLocalGradientPositiveSec: 0.0594391204789303,
        calciumRiseInitialProximalPortMinusLvDeficitMmHg: 69.4828175617507,
        onePercentFlowInterpolatedEjectionTimeSec: 0.22989263379109974,
        meanDopplerGradientMmHg: 2.8666316719816405,
        peakDopplerGradientMmHg: 4.818893961422045,
        strokeVolumeMl: 62.01045228021446,
        meanAorticPressureMmHg: 90.72634139471663,
      },
      {
        canonicalIctSec: 0.088,
        mitralClosureToCalciumRiseSignedSec: 0.025752445275310176,
        calciumRiseToExactLocalGradientPositiveSec: 0.061982347415101444,
        calciumRiseInitialProximalPortMinusLvDeficitMmHg: 55.847388269787515,
        onePercentFlowInterpolatedEjectionTimeSec: 0.2112385504513811,
        meanDopplerGradientMmHg: 3.041382929334169,
        peakDopplerGradientMmHg: 4.950677154935173,
        strokeVolumeMl: 58.46474321758474,
        meanAorticPressureMmHg: 70.02588815546719,
      },
      {
        canonicalIctSec: 0.07866666666666666,
        mitralClosureToCalciumRiseSignedSec: 0.021752445274491716,
        calciumRiseToExactLocalGradientPositiveSec: 0.05672647003943809,
        calciumRiseInitialProximalPortMinusLvDeficitMmHg: 58.35865598543471,
        onePercentFlowInterpolatedEjectionTimeSec: 0.22586839911261868,
        meanDopplerGradientMmHg: 3.1794958704024237,
        peakDopplerGradientMmHg: 5.330952686831453,
        strokeVolumeMl: 64.04795290711772,
        meanAorticPressureMmHg: 77.07477573865215,
      },
    ] as const;
    analysis.armsInCatalogOrder.forEach((arm, index) => {
      const expected = expectedArms[index]!;
      for (const metricId of Object.keys(
        expected,
      ) as (keyof typeof expected)[]) {
        expect(arm.metrics[metricId]).toBeCloseTo(expected[metricId], 8);
      }
    });

    const expectedContrasts = [
      [
        "canonicalIctSec",
        [
          -0.0026666666666666644, 0.0026666666666666644, -0.014666666666666661,
          -0.009333333333333332, 0.005333333333333329,
        ],
      ],
      [
        "mitralClosureToCalciumRiseSignedSec",
        [
          0, 0.005333333334970214, -0.009333333335788674, -0.00400000000081846,
          0.005333333334970214,
        ],
      ],
      [
        "calciumRiseToExactLocalGradientPositiveSec",
        [
          -0.002806669864048872, -0.0027126504394922035, -0.005349896800220022,
          -0.005255877375663354, 0.00009401942455666834,
        ],
      ],
      [
        "calciumRiseInitialProximalPortMinusLvDeficitMmHg",
        [
          -10.769093691410177, -11.124161576315984, 2.8663356005530005,
          2.511267715647193, -0.3550678849058073,
        ],
      ],
      [
        "onePercentFlowInterpolatedEjectionTimeSec",
        [
          -0.0037587549457380187, -0.0040242346784810645, 0.014895328393980611,
          0.014629848661237566, -0.0002654797327430458,
        ],
      ],
      [
        "meanDopplerGradientMmHg",
        [
          0.2880706832955262, 0.31286419842078317, 0.11331942594299749,
          0.13811294106825445, 0.02479351512525696,
        ],
      ],
      [
        "peakDopplerGradientMmHg",
        [
          0.42733206221401066, 0.5120587254094078, 0.2955488687008829,
          0.38027553189628005, 0.08472666319539712,
        ],
      ],
      [
        "strokeVolumeMl",
        [
          1.8253688838181574, 2.0375006269032596, 5.371077946447876,
          5.583209689532978, 0.2121317430851022,
        ],
      ],
      [
        "meanAorticPressureMmHg",
        [
          -12.516768571252499, -13.651565656064477, 8.183684667996943,
          7.048887583184964, -1.1347970848119786,
        ],
      ],
    ] as const;
    for (const [metricId, expected] of expectedContrasts) {
      const actual = analysis.factorialContrasts.find(
        (contrast) => contrast.metricId === metricId,
      )!;
      const actualValues = [
        actual.systemicResistanceLowMinusBaselineAtBaselineVolume,
        actual.systemicResistanceLowMinusBaselineAtHighVolume,
        actual.stressedVenousVolumeHighMinusBaselineAtBaselineResistance,
        actual.stressedVenousVolumeHighMinusBaselineAtLowResistance,
        actual.interactionDifferenceOfDifferences,
      ];
      actualValues.forEach((value, index) => {
        expect(value).toBeCloseTo(expected[index]!, 8);
      });
    }

    const ict = analysis.factorialContrasts[0]!;
    const caToG0 = analysis.factorialContrasts[2]!;
    expect(
      Math.abs(
        caToG0.stressedVenousVolumeHighMinusBaselineAtBaselineResistance!,
      ),
    ).toBeGreaterThan(
      Math.abs(caToG0.systemicResistanceLowMinusBaselineAtBaselineVolume!),
    );
    expect(
      Math.abs(caToG0.stressedVenousVolumeHighMinusBaselineAtLowResistance!),
    ).toBeGreaterThan(
      Math.abs(caToG0.systemicResistanceLowMinusBaselineAtHighVolume!),
    );
    expect(
      ict.stressedVenousVolumeHighMinusBaselineAtBaselineResistance,
    ).toBeLessThan(0);
    expect(ict.systemicResistanceLowMinusBaselineAtHighVolume).toBeGreaterThan(
      0,
    );
  });

  it("rejects incomplete, duplicate, altered execution, catalog, and hash identities", () => {
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        runs.slice(0, -1),
      ),
    ).toThrow(/missing HR90 opening-load analysis arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [...runs.slice(0, -1), runs[0]!],
      ),
    ).toThrow(/duplicate HR90 opening-load analysis arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [
          Object.freeze({
            ...runs[0]!,
            openingLoadMechanismArm: Object.freeze({
              ...runs[0]!.openingLoadMechanismArm,
            }),
          }) as Run,
          ...runs.slice(1),
        ],
      ),
    ).toThrow(/arm catalog identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [
          Object.freeze({
            ...runs[0]!,
            periodicResult: Object.freeze({
              ...runs[0]!.periodicResult,
              requestedMaximumBeatCount: 71,
            }),
          }) as Run,
          ...runs.slice(1),
        ],
      ),
    ).toThrow(/execution identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [
          Object.freeze({
            ...runs[0]!,
            exactAssemblyAudit: Object.freeze({
              ...runs[0]!.exactAssemblyAudit,
              mechanicsProviderParameterIdentityHash: "altered",
            }),
          }),
          ...runs.slice(1),
        ],
      ),
    ).toThrow(/hash isolation failed/);
    const crossAxisRuntimeHash = "cross-axis-runtime-hash";
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [
          runs[0]!,
          Object.freeze({
            ...runs[1]!,
            exactAssemblyAudit: Object.freeze({
              ...runs[1]!.exactAssemblyAudit,
              circulationRuntimeStableHash: crossAxisRuntimeHash,
            }),
            periodicResult: Object.freeze({
              ...runs[1]!.periodicResult,
              protocolComponentHashes: Object.freeze({
                ...runs[1]!.periodicResult.protocolComponentHashes,
                circulationRuntimeStableHash: crossAxisRuntimeHash,
              }),
            }),
          }),
          ...runs.slice(2),
        ],
      ),
    ).toThrow(/hash isolation failed/);
    const crossAxisBloodVolumeHash = "cross-axis-blood-volume-hash";
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
        [
          runs[0]!,
          runs[1]!,
          Object.freeze({
            ...runs[2]!,
            exactAssemblyAudit: Object.freeze({
              ...runs[2]!.exactAssemblyAudit,
              bloodVolumeOperatingPointStableHash: crossAxisBloodVolumeHash,
            }),
            periodicResult: Object.freeze({
              ...runs[2]!.periodicResult,
              protocolComponentHashes: Object.freeze({
                ...runs[2]!.periodicResult.protocolComponentHashes,
                bloodVolumeOperatingPointStableHash: crossAxisBloodVolumeHash,
              }),
            }),
          }),
          runs[3]!,
        ],
      ),
    ).toThrow(/hash isolation failed/);
  });
});
