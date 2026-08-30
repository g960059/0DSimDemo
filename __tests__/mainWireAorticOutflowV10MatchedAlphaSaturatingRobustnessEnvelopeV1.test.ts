import { describe, expect, it } from "vitest";

import {
  auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1,
  classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1,
  mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorProductV1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CENTERLINE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha saturating robustness envelope V1", () => {
  it("owns a predeclared 24-arm screen and 12-arm full-corner certification augmentation", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1,
    ).toHaveLength(16);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CENTERLINE_ARMS_V1,
    ).toHaveLength(4);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
    ).toHaveLength(4);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1,
    ).toHaveLength(24);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
    ).toHaveLength(12);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1,
    ).toHaveLength(36);
    expect(
      new Set(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
          (arm) => arm.armId,
        ),
      ).size,
    ).toBe(36);

    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1.every(
        (arm) =>
          mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorProductV1(
            arm,
          ) === 1,
      ),
    ).toBe(true);
    expect(
      [
        ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
        ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
      ].every(
        (arm) =>
          mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorProductV1(
            arm,
          ) === -1,
      ),
    ).toBe(true);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CENTERLINE_ARMS_V1.every(
        (arm) =>
          mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorProductV1(
            arm,
          ) === null,
      ),
    ).toBe(true);

    const endpointCoordinates = [
      ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1,
      ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
      ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
    ].map((arm) =>
      [
        arm.heartRateBpm,
        arm.systemicResistanceLevel,
        arm.systemicArterialTangentStiffnessLevel,
        arm.stressedVenousVolumeLevel,
        arm.ventricularTrefForceLevel,
      ].join("|"),
    );
    expect(new Set(endpointCoordinates).size).toBe(32);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1.map(
        (arm) => arm.safetyGuardTarget,
      ),
    ).toEqual([
      "ejection-time",
      "mean-doppler-gradient",
      "peak-doppler-gradient",
      "flow-derived-left-ventricular-tei-index",
    ]);
  });

  it("proves declared component hashes are isolated to their owning factor axes", () => {
    const audit =
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        syntheticFactorHashAuditRuns(),
      );

    expect(audit.auditedArmCount).toBe(36);
    expect(audit.allThirtySixCatalogArmsAuditedExactlyOnce).toBe(true);
    expect(
      [
        [audit.calciumDriveFixedParamsHashByHeartRate, 4],
        [audit.mechanicsProviderParameterIdentityHashByTrefForceLevel, 3],
        [audit.mechanicsProviderMetadataHashByTrefForceLevel, 3],
        [audit.bloodVolumeOperatingPointHashByFixedTbvLevel, 3],
        [audit.circulationRuntimeHashByResistanceAndStiffness, 5],
      ].every(
        ([axis, expectedCount]) =>
          typeof axis === "object" &&
          axis.observedCoordinateGroupCount === expectedCount &&
          axis.observedDistinctHashCount === expectedCount &&
          axis.sameCoordinateGroupEqualityPassed &&
          axis.crossCoordinateDistinctnessPassed &&
          axis.declaredAxisIsolationPassed,
      ),
    ).toBe(true);
    expect(audit.circulationTopologyHash.observedDistinctHashCount).toBe(1);
    expect(audit.valveResearchInputHash.observedDistinctHashCount).toBe(1);
    expect(audit.commonPericardiumHash.observedDistinctHashCount).toBe(1);
    expect(audit.periodicPolicyHash.observedDistinctHashCount).toBe(1);
    expect(audit.allFactorIsolationAndInvariantHashGuardsPassed).toBe(true);
  });

  it("detects within-level leaks, cross-level collisions, and invariant-component drift adversarially", () => {
    const baseline = syntheticFactorHashAuditRuns();
    const calciumLeak = replaceAuditRun(baseline, 0, (run) => ({
      ...run,
      periodicResult: {
        ...run.periodicResult,
        protocolComponentHashes: {
          ...run.periodicResult.protocolComponentHashes,
          calciumDriveFixedParamsStableHash: "adversarial-calcium-leak",
        },
      },
    }));
    expect(
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        calciumLeak,
      ).calciumDriveFixedParamsHashByHeartRate.declaredAxisIsolationPassed,
    ).toBe(false);

    const mechanicsLeak = replaceAuditRun(baseline, 0, (run) => ({
      ...run,
      periodicResult: {
        ...run.periodicResult,
        protocolIdentity: {
          ...run.periodicResult.protocolIdentity,
          mechanicsProvider: {
            ...run.periodicResult.protocolIdentity.mechanicsProvider,
            parameterIdentityHash: "adversarial-mechanics-parameter-leak",
          },
        },
        protocolComponentHashes: {
          ...run.periodicResult.protocolComponentHashes,
          mechanicsProviderMetadataStableHash:
            "adversarial-mechanics-metadata-leak",
        },
      },
    }));
    const mechanicsAudit =
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        mechanicsLeak,
      );
    expect(
      mechanicsAudit.mechanicsProviderParameterIdentityHashByTrefForceLevel
        .declaredAxisIsolationPassed,
    ).toBe(false);
    expect(
      mechanicsAudit.mechanicsProviderMetadataHashByTrefForceLevel
        .declaredAxisIsolationPassed,
    ).toBe(false);

    const bloodVolumeLeak = replaceAuditRun(baseline, 0, (run) => ({
      ...run,
      periodicResult: {
        ...run.periodicResult,
        protocolComponentHashes: {
          ...run.periodicResult.protocolComponentHashes,
          bloodVolumeOperatingPointStableHash: "adversarial-blood-volume-leak",
        },
      },
    }));
    expect(
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        bloodVolumeLeak,
      ).bloodVolumeOperatingPointHashByFixedTbvLevel
        .declaredAxisIsolationPassed,
    ).toBe(false);

    const runtimeLeak = replaceAuditRun(baseline, 0, (run) => ({
      ...run,
      periodicResult: {
        ...run.periodicResult,
        protocolComponentHashes: {
          ...run.periodicResult.protocolComponentHashes,
          circulationRuntimeStableHash: "adversarial-runtime-leak",
        },
      },
    }));
    expect(
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        runtimeLeak,
      ).circulationRuntimeHashByResistanceAndStiffness
        .declaredAxisIsolationPassed,
    ).toBe(false);

    const calciumCrossLevelCollision = baseline.map((run) =>
      run.robustnessEnvelopeArm.heartRateBpm === 90
        ? ({
            ...run,
            periodicResult: {
              ...run.periodicResult,
              protocolComponentHashes: {
                ...run.periodicResult.protocolComponentHashes,
                calciumDriveFixedParamsStableHash: "calcium-heart-rate:50",
              },
            },
          } as typeof run)
        : run,
    );
    const collisionAudit =
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        calciumCrossLevelCollision,
      ).calciumDriveFixedParamsHashByHeartRate;
    expect(collisionAudit.sameCoordinateGroupEqualityPassed).toBe(true);
    expect(collisionAudit.crossCoordinateDistinctnessPassed).toBe(false);
    expect(collisionAudit.observedDistinctHashCount).toBe(3);

    const invariantDrift = replaceAuditRun(baseline, 0, (run) => ({
      ...run,
      periodicResult: {
        ...run.periodicResult,
        protocolIdentity: {
          ...run.periodicResult.protocolIdentity,
          circulation: {
            ...run.periodicResult.protocolIdentity.circulation,
            valveResearchInputStableHash: "adversarial-valve-input-drift",
          },
        },
        protocolComponentHashes: {
          ...run.periodicResult.protocolComponentHashes,
          circulationTopologyGraphStableHash: "adversarial-topology-drift",
          commonPericardiumStableHash: "adversarial-pericardium-drift",
          periodicPolicyStableHash: "adversarial-policy-drift",
        },
      },
    }));
    const invariantAudit =
      auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
        invariantDrift,
      );
    expect(invariantAudit.circulationTopologyHash.oneHashAcrossAllArms).toBe(
      false,
    );
    expect(invariantAudit.valveResearchInputHash.oneHashAcrossAllArms).toBe(
      false,
    );
    expect(invariantAudit.commonPericardiumHash.oneHashAcrossAllArms).toBe(
      false,
    );
    expect(invariantAudit.periodicPolicyHash.oneHashAcrossAllArms).toBe(false);
    expect(invariantAudit.allFactorIsolationAndInvariantHashGuardsPassed).toBe(
      false,
    );
  });

  it("classifies functional opening but not redundant pPG as an independent hard gate", () => {
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "activeEoaAtPeakForwardFlowUtilization01",
        0.949,
      ),
    ).toBe(false);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "activeEoaAtPeakForwardFlowUtilization01",
        0.95,
      ),
    ).toBe(true);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "flowWeightedMeanActiveEoaUtilization01",
        0.899,
      ),
    ).toBe(false);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "flowWeightedMeanActiveEoaUtilization01",
        0.9,
      ),
    ).toBe(true);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "peakDopplerGradientMmHg",
        100,
      ),
    ).toBeNull();
  });

  it("retains exact V10 ownership, P1 integration, one flow peak, and full 32-corner readback at cycle/500", () => {
    const runs =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
        (arm) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
            {
              dtSec: 60 / arm.heartRateBpm / 500,
              maximumBeatCount: 72,
            },
            arm.armId,
          ),
      );
    const analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1(
        runs,
      );

    expect(analysis.armsInCatalogOrder).toHaveLength(36);
    expect(analysis.screeningPhaseArmCount).toBe(24);
    expect(analysis.fullCornerCertificationAugmentationArmCount).toBe(12);
    expect(analysis.fullCornerCertificationExecuted).toBe(true);
    expect(analysis.allProtocolIdentityHashesUnique).toBe(true);
    expect(analysis.oneCirculationTopologyHash).toBe(true);
    expect(analysis.oneCommonPericardiumHash).toBe(true);
    expect(analysis.onePeriodicPolicyHash).toBe(true);
    expect(analysis.exactAssemblyAuditsMatchProtocolHashes).toBe(true);
    expect(
      analysis.factorHashIsolation
        .allFactorIsolationAndInvariantHashGuardsPassed,
    ).toBe(true);
    expect(
      analysis.allExactIdentityAndDeclaredFactorIsolationGuardsPassed,
    ).toBe(true);
    expect(
      analysis.allArmsUseSupportedMatchedResolutionAndMaximumBeatCount,
    ).toBe(true);
    expect(analysis.allArmsPeriod1AndIntegrationPassed).toBe(true);
    expect(analysis.allArmsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(analysis.allArmsHaveExactlyOneCompleteOnePercentFlowEpisode).toBe(
      true,
    );
    expect(analysis.allExactStationAuditsPassed).toBe(true);
    expect(
      analysis.allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance,
    ).toBe(true);
    expect(
      analysis.allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched,
    ).toBe(true);
    expect(analysis.allArmLevelAvAntiStenosisRobustnessGatesPassed).toBe(true);
    expect(
      analysis.allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation,
    ).toBe(true);
    expect(analysis.fullCornerEarlyStopRobustnessReadoutPassed).toBe(true);
    expect(analysis.analysisClaim.timingLowerBoundNormalityEstablished).toBe(
      false,
    );
    expect(analysis.analysisClaim.continuousInteriorRobustnessEstablished).toBe(
      false,
    );
    expect(
      analysis.armsInCatalogOrder.every(
        (arm) =>
          arm.physiologyGate.ictAndTeiReportedWithoutHardGate &&
          arm.physiologyGate.rawNodeGradientExcludedFromAsClassification,
      ),
    ).toBe(true);
    expect(analysis.continuityEquivalentEoaVariation.armCount).toBe(36);
    expect(
      analysis.continuityEquivalentEoaVariation.coefficientOfVariation01,
    ).toBeCloseTo(0.008132558267940251, 12);
    const metricRange = (
      metricId: keyof (typeof analysis.armsInCatalogOrder)[number]["metrics"],
    ) => {
      const values = analysis.armsInCatalogOrder
        .map((arm) => arm.metrics[metricId])
        .filter((value): value is number => value !== null);
      return [Math.min(...values), Math.max(...values)] as const;
    };
    expect(metricRange("onePercentFlowEjectionTimeSec")[0]).toBeCloseTo(
      0.19547519388815843,
      12,
    );
    expect(metricRange("onePercentFlowEjectionTimeSec")[1]).toBeCloseTo(
      0.27707256254443513,
      12,
    );
    expect(metricRange("peakVenaContractaVelocityMPerSec")).toEqual([
      0.9223786260823738, 1.4246942661099546,
    ]);
    expect(metricRange("meanDopplerGradientMmHg")).toEqual([
      2.143628838310918, 4.479752093615874,
    ]);
    expect(metricRange("peakDopplerGradientMmHg")).toEqual([
      3.40312931941443, 8.119015007546329,
    ]);
    expect(metricRange("activeEoaAtPeakForwardFlowUtilization01")).toEqual([
      0.9979686023067416, 0.9999780313587507,
    ]);
    expect(metricRange("flowWeightedMeanActiveEoaUtilization01")).toEqual([
      0.9576056938897024, 0.979568692682861,
    ]);
    const targetedGuardResiduals = analysis.safetyGuardResiduals.filter(
      (residual) =>
        (residual.safetyGuardTarget === "ejection-time" &&
          residual.metricId === "onePercentFlowEjectionTimeSec") ||
        (residual.safetyGuardTarget === "mean-doppler-gradient" &&
          residual.metricId === "meanDopplerGradientMmHg") ||
        (residual.safetyGuardTarget === "peak-doppler-gradient" &&
          residual.metricId === "peakDopplerGradientMmHg") ||
        (residual.safetyGuardTarget ===
          "flow-derived-left-ventricular-tei-index" &&
          residual.metricId === "leftVentricularTeiIndex"),
    );
    expect(
      targetedGuardResiduals.map((residual) => ({
        target: residual.safetyGuardTarget,
        materialResidual: residual.materialResidual,
        hardPhysiologyClassFlip: residual.hardPhysiologyClassFlip,
      })),
    ).toEqual([
      {
        target: "ejection-time",
        materialResidual: false,
        hardPhysiologyClassFlip: false,
      },
      {
        target: "mean-doppler-gradient",
        materialResidual: false,
        hardPhysiologyClassFlip: false,
      },
      {
        target: "peak-doppler-gradient",
        materialResidual: false,
        hardPhysiologyClassFlip: null,
      },
      {
        target: "flow-derived-left-ventricular-tei-index",
        materialResidual: true,
        hardPhysiologyClassFlip: null,
      },
    ]);
    expect(
      analysis.safetyGuardResiduals.filter(
        (residual) => residual.materialResidual === true,
      ),
    ).toHaveLength(17);
    expect(
      analysis.safetyGuardScreeningReadout.anyHardPhysiologyClassFlip,
    ).toBe(false);
    expect(analysis.fixedPhysicalHorizonAuditStatus).toBe("not-executed");
    expect(
      analysis.limitingArmsForLaterFixedHorizonAudit
        .vmaxAndPeakGradientSelectSameArm,
    ).toBe(true);
    expect(
      analysis.limitingArmsForLaterFixedHorizonAudit.uniqueFixedHorizonSentinelArmIds.every(
        (armId) =>
          MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.some(
            (arm) => arm.armId === armId,
          ),
      ),
    ).toBe(true);

    const centerline60 = runs.find(
      (run) => run.robustnessEnvelopeArm.armId === "centerline__hr-60",
    )!;
    const existing60 =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        { dtSec: 1 / 500, maximumBeatCount: 72 },
        "matched-alpha-saturating-hr-law-a040-hr-60",
      );
    expect(centerline60.periodicResult).toEqual(existing60.periodicResult);
    expect(centerline60.exactAssemblyAudit).toEqual(
      existing60.exactAssemblyAudit,
    );

    const centerline90 = runs.find(
      (run) => run.robustnessEnvelopeArm.armId === "centerline__hr-90",
    )!;
    const existingOpeningLoad90 =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
        { dtSec: 60 / 90 / 500, maximumBeatCount: 72 },
        "rsys-baseline__stressed-volume-baseline",
      );
    expect(centerline90.periodicResult).toEqual(
      existingOpeningLoad90.periodicResult,
    );
    expect(centerline90.exactAssemblyAudit).toEqual(
      existingOpeningLoad90.exactAssemblyAudit,
    );
  }, 420_000);

  it("rejects free-form factor patches and arms outside the closed catalog", () => {
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
        {
          dtSec: 1 / 500,
          maximumBeatCount: 72,
          systemicResistanceScale: 0.8,
        } as never,
        "centerline__hr-60",
      ),
    ).toThrow("reject unsupported field");
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
        { dtSec: 1 / 500, maximumBeatCount: 72 },
        "not-a-catalog-arm",
      ),
    ).toThrow("unsupported V10 saturating robustness arm");
  });
});

type FactorHashAuditRuns = Parameters<
  typeof auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1
>[0];

function syntheticFactorHashAuditRuns(): FactorHashAuditRuns {
  return MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
    (arm) => ({
      robustnessEnvelopeArm: arm,
      periodicResult: {
        protocolIdentity: {
          mechanicsProvider: {
            parameterIdentityHash: `mechanics-parameter-tref:${arm.ventricularTrefForceLevel}`,
          },
          circulation: {
            valveResearchInputStableHash: "fixed-valve-research-input",
          },
        },
        protocolComponentHashes: {
          mechanicsProviderMetadataStableHash: `mechanics-metadata-tref:${arm.ventricularTrefForceLevel}`,
          calciumDriveFixedParamsStableHash: `calcium-heart-rate:${arm.heartRateBpm}`,
          circulationTopologyGraphStableHash: "fixed-topology",
          circulationRuntimeStableHash: `runtime-resistance:${arm.systemicResistanceLevel}-stiffness:${arm.systemicArterialTangentStiffnessLevel}`,
          bloodVolumeOperatingPointStableHash: `blood-volume:${arm.stressedVenousVolumeLevel}`,
          commonPericardiumStableHash: "fixed-pericardium",
          periodicPolicyStableHash: "fixed-periodic-policy",
        },
      },
    }),
  ) as unknown as FactorHashAuditRuns;
}

function replaceAuditRun(
  runs: FactorHashAuditRuns,
  index: number,
  replace: (run: FactorHashAuditRuns[number]) => FactorHashAuditRuns[number],
): FactorHashAuditRuns {
  return runs.map((run, runIndex) => (runIndex === index ? replace(run) : run));
}
