import { describe, expect, it } from "vitest";

import ledgerArtifact from "@/artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json";
import surfaceArtifact from "@/artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID,
  qualifyMainWireIntegratedModelPhaseWisePvaV2,
  runMainWireIntegratedModelPhaseWisePvaQualificationWithDependenciesV2,
  type MainWireIntegratedModelPhaseWisePvaQualificationInputV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWisePvaQualificationV2";
import type { MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import { generateMainWireIntrinsicPassiveCenterSlicesForPvaV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import type { MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1 } from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1";
import type { MainWireIntegratedModelPeriodicSteadyResultV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2,
  sampleMainWireIntegratedModelTransientPvCompactLoopV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

const ledger =
  ledgerArtifact as unknown as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
const surface =
  surfaceArtifact as unknown as MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1;

describe("phase-wise PVA qualification V2", () => {
  it("publishes method-specific estimates from one source transaction", () => {
    const result = qualifyMainWireIntegratedModelPhaseWisePvaV2(inputV2());

    expect(result.qualificationId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID,
    );
    expect(result.status).toBe("completed");
    expect(result.sourceIdentity).toEqual({
      singlePeriodicSourceExecution: true,
      transientAndLedgerShareCheckpoint: true,
      passiveReferenceExecutedInSameAnalysisTransaction: true,
      passiveReferenceCanonicalOwnerBindingsPassed: true,
      allInputsBound: true,
    });
    expect(result.outputs).toHaveLength(2);
    for (const output of result.outputs) {
      expect(output.mainOutputValueJ).toBeGreaterThan(0);
      expect(output.energy.pvaEstimateJ).toBe(output.mainOutputValueJ);
      expect(output.sensitivity.baselineExclusion.available).toBe(true);
      expect(output.sensitivity.phaseResolution.refinedSampleCount).toBe(128);
      expect(output.sensitivity.selectedPhaseStateDispersion.beatCount).toBe(
        11,
      );
      expect(output.passiveReference.canonicalOwnerBindingsPassed).toBe(true);
      expect(output.limitations).toContain(
        "fixed-contralateral-intrinsic-passive-reference",
      );
    }
    expect(result.interpretation).toMatchObject({
      methodSpecificPvaEstimateAvailable: true,
      genericPvaEstablished: false,
      clinicalPvaEstablished: false,
      oxygenConsumptionEstablished: false,
      productValuePublished: false,
    });
  });

  it("detects source-transaction drift before publishing values", () => {
    const input = inputV2();
    expect(() =>
      qualifyMainWireIntegratedModelPhaseWisePvaV2({
        ...input,
        transient: {
          ...input.transient,
          sourceTerminalCheckpointSha256: "f".repeat(64),
        },
      }),
    ).toThrow(/input bindings are incomplete/);
  });

  it("preserves the existing 64-point compact-loop projection exactly", () => {
    const beat = rawBeat(4, 10);
    expect(
      sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2(
        beat,
        "LV",
        64,
      ),
    ).toEqual(
      sampleMainWireIntegratedModelTransientPvCompactLoopV1(beat, "LV"),
    );
  });

  it("retains a compact unavailable result when source execution fails", async () => {
    const result =
      await runMainWireIntegratedModelPhaseWisePvaQualificationWithDependenciesV2(
        {
          runSource: async () => {
            throw new Error("manufactured source failure");
          },
          runTransient: async () => {
            throw new Error("must not run");
          },
          runLedger: async () => {
            throw new Error("must not run");
          },
          runPassiveSurface: async () => {
            throw new Error("must not run");
          },
        },
      );
    expect(result.status).toBe("unavailable");
    expect(result.stages).toEqual({
      source: "failed",
      transient: "not-attempted",
      periodicLedger: "not-attempted",
      passiveReference: "not-attempted",
      qualification: "not-attempted",
    });
    expect(result.outputs).toEqual([]);
    expect(result.failure).toEqual({
      stage: "source",
      message: "manufactured source failure",
    });
  });

  it("settles all downstream stages and retains the failed stage", async () => {
    const source = {
      numericalPeriod1Established: true,
      classification: { status: "period1-converged" },
      terminalCheckpointExactRoundTripVerified: true,
    } as unknown as MainWireIntegratedModelPeriodicSteadyResultV3;
    const calls: string[] = [];
    const result =
      await runMainWireIntegratedModelPhaseWisePvaQualificationWithDependenciesV2(
        {
          runSource: async () => source,
          runTransient: async () => {
            calls.push("transient");
            throw new Error("manufactured transient failure");
          },
          runLedger: async () => {
            calls.push("ledger");
            return ledger;
          },
          runPassiveSurface: async () => {
            calls.push("passive");
            return surface;
          },
        },
      );

    expect(calls.sort()).toEqual(["ledger", "passive", "transient"]);
    expect(result.status).toBe("unavailable");
    expect(result.stages).toEqual({
      source: "completed",
      transient: "failed",
      periodicLedger: "completed",
      passiveReference: "completed",
      qualification: "not-attempted",
    });
    expect(result.failure).toEqual({
      stage: "transient",
      message: "manufactured transient failure",
    });
  });
});

function inputV2(): MainWireIntegratedModelPhaseWisePvaQualificationInputV2 {
  if (ledger.payload.sourceOutcome.status !== "source-p1-established")
    throw new Error("fixture ledger source must be P1");
  const source = ledger.payload.sourceOutcome.summary;
  const rawBeats = Array.from({ length: 21 }, (_, index) =>
    rawBeat(index + 1, source.terminalAcceptedTimeSec),
  );
  const stateBeats = rawBeats.map((beat) => ({
    beatOrdinal: beat.beatOrdinal,
    startTimeSec: beat.startTimeSec,
    endTimeSec: beat.endTimeSec,
    samples: beat.samples.map((sample) =>
      stateSample(sample.timeSec, beat.beatOrdinal),
    ),
  }));
  return {
    source: {
      modelConditionIdentityHash: source.modelConditionIdentityHash,
      protocolIdentityHash: source.protocolIdentityHash,
      terminalCheckpointSha256: source.terminalCheckpointSha256,
      terminalAcceptedTimeSec: source.terminalAcceptedTimeSec,
      terminalAcceptedRevision: source.terminalAcceptedRevision,
      numericalPeriod1Established: true,
    },
    transient: {
      sourceModelConditionIdentityHash: source.modelConditionIdentityHash,
      sourceProtocolIdentityHash: source.protocolIdentityHash,
      sourceTerminalCheckpointSha256: source.terminalCheckpointSha256,
      sourceTerminalAcceptedTimeSec: source.terminalAcceptedTimeSec,
      sourceTerminalAcceptedRevision: source.terminalAcceptedRevision,
      rawBeats,
      stateBeats,
    },
    ledger,
    passive: {
      executedInSameAnalysisTransaction: true,
      surfaceSourceBindingsPassed: true,
      slices: generateMainWireIntrinsicPassiveCenterSlicesForPvaV1(
        surface.payload,
      ),
    },
  };
}

function rawBeat(beatOrdinal: number, sourceTimeSec: number) {
  const startTimeSec = sourceTimeSec + beatOrdinal - 1;
  const occlusionDistance = Math.min(beatOrdinal - 1, 10);
  const releaseDistance = beatOrdinal <= 11 ? 0 : beatOrdinal - 11;
  const loadIndex =
    beatOrdinal <= 11 ? occlusionDistance : 10 - releaseDistance;
  return {
    beatOrdinal,
    startTimeSec,
    endTimeSec: startTimeSec + 1,
    samples: Array.from({ length: 65 }, (_, index) => {
      const phase01 = index / 64;
      const activation = Math.exp(-(((phase01 - 0.3125) / 0.11) ** 2));
      const lvVolume =
        142 - loadIndex * 0.72 + 1.8 * Math.cos(phase01 * Math.PI * 2);
      const rvVolume =
        152 - loadIndex * 0.56 + 2.1 * Math.cos(phase01 * Math.PI * 2);
      const lvPressure = (0.18 + 1.72 * activation) * (lvVolume - 82);
      const rvPressure = (0.08 + 0.72 * activation) * (rvVolume - 105);
      return {
        timeSec: startTimeSec + phase01,
        LV: {
          volumeMl: lvVolume,
          absolutePressureMmHg: lvPressure + 2,
          transmuralPressureMmHg: lvPressure,
          semilunarFlowMlPerSec: Math.sin(phase01 * Math.PI * 2) * 300,
        },
        RV: {
          volumeMl: rvVolume,
          absolutePressureMmHg: rvPressure + 2,
          transmuralPressureMmHg: rvPressure,
          semilunarFlowMlPerSec: Math.sin(phase01 * Math.PI * 2) * 260,
        },
      };
    }),
  } as const;
}

function stateSample(timeSec: number, beatOrdinal: number) {
  const phase01 = timeSec - Math.floor(timeSec);
  const beatScale = 1 + (beatOrdinal - 1) * 0.002;
  const wallRecord = <T>(build: (wallIndex: number) => T) => ({
    LVFW: build(0),
    SEP: build(1),
    RVFW: build(2),
  });
  return {
    timeSec,
    commonPericardialPressureMmHg: 2 + 0.05 * Math.sin(phase01 * Math.PI * 2),
    ventricularPericardialPressureMismatchMmHg: 1e-12,
    internalCoordinates: {
      septalMidwallCapVolumeMl: 2.1 * beatScale + 0.02 * phase01,
      junctionRadiusM: 0.03 * beatScale + 0.0001 * phase01,
    },
    freeCalciumUMByWall: wallRecord(
      (wallIndex) =>
        0.2 + wallIndex * 0.02 + 0.8 * Math.sin(Math.PI * phase01) ** 2,
    ),
    fiberLogStrainByWall: wallRecord(
      (wallIndex) =>
        0.04 + wallIndex * 0.005 + 0.02 * Math.cos(phase01 * Math.PI * 2),
    ),
    landStateByWall: wallRecord(
      (wallIndex) =>
        [0.18, 0.22, 0.04, 0.02, 0.01, -0.01].map(
          (value, index) =>
            value * beatScale + wallIndex * 0.001 + index * 0.0001,
        ) as [number, number, number, number, number, number],
    ),
  } as const;
}
