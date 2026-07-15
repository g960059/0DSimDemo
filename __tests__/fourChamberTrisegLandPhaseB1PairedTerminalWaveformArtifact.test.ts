import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type {
  PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1,
  PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";

const authentication = vi.hoisted(() => ({
  issued: new WeakSet<object>(),
}));

vi.mock(
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1",
  () => ({
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1:
      (value: object) => {
        if (!authentication.issued.has(value)) {
          throw new Error("terminal timestep observation is not builder-issued in this process");
        }
        return value;
      },
  }),
);

import {
  PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
  buildPhaseB1PairedTerminalWaveformArtifactV1,
  serializePhaseB1PairedTerminalWaveformArtifactV1,
} from "@/tools/myocardium/phaseB1PairedTerminalWaveformArtifactV1";

describe("Phase B1 paired SLS terminal waveform artifact", () => {
  it("authenticates one matched off/on lineage and preserves every raw-SI series", () => {
    const pair = observations();
    const artifact = buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: pair.off,
      slsOnTerminalObservation: pair.on,
      sha256Hex: sha256,
    });

    expect(artifact.artifactId)
      .toBe(PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID);
    expect(artifact.pair).toEqual({
      modeOrder: ["off", "on"],
      gridRole: "coarse",
      nominalDtSec: 0.001,
      canonicalCycleLengthSec: 0.8,
      sameNominalGridAndCanonicalCycle: true,
      slsOffPhysicalSlsEnabled: false,
      slsOnPhysicalSlsEnabled: true,
    });
    expect(artifact.waveforms.off.chamberBloodVolumeM3.LA)
      .toEqual([1e-6, 2e-6]);
    expect(artifact.waveforms.on.chamberBloodVolumeM3.LA)
      .toEqual([1e-6 * 10, 1e-6 * 20]);
    expect(artifact.waveforms.off.chamberBloodVolumeM3.LV)
      .toEqual([2e-6, 4e-6]);
    expect(artifact.waveforms.off.chamberBloodVolumeM3.RA)
      .toEqual([5e-6, 10e-6]);
    expect(artifact.waveforms.off.chamberBloodVolumeM3.RV)
      .toEqual([6e-6, 12e-6]);
    expect(artifact.waveforms.on.compartmentAbsolutePressurePa.LA)
      .toEqual([110, 120]);
    expect(artifact.waveforms.on.compartmentAbsolutePressurePa.PV)
      .toEqual([880, 960]);
    expect(artifact.waveforms.off.valveFlowM3PerSec).toEqual({
      Q_MV: [1e-6, 2e-6],
      Q_AoV: [2e-6, 4e-6],
      Q_TV: [3e-6, 6e-6],
      Q_PuV: [4e-6, 8e-6],
    });
    expect(artifact.waveforms.on.allClosedLoopFlowM3PerSec.Q_sys)
      .toEqual([7e-6 * 10, 7e-6 * 20]);
    expect(artifact.units.valuesConvertedForPresentation).toBe(false);
    expect(artifact.commonSourceHashes.parentManifestContentSha256)
      .toBe(hash("3"));
    expect(artifact.commonSourceHashes)
      .not.toHaveProperty("periodicDefinitionContentSha256");
    expect(artifact.modeSourceHashes.off.periodicDefinitionContentSha256)
      .toBe(hash("7"));
    expect(artifact.modeSourceHashes.on.periodicDefinitionContentSha256)
      .toBe(hash("9"));
    expect(artifact.modeSourceHashes.off.terminalTimestepObservationContentSha256)
      .toBe(hash("a"));
    expect(artifact.modeSourceHashes.on.terminalTimestepObservationContentSha256)
      .toBe(hash("b"));
    expect(artifact.interpretationBoundary).toEqual({
      visualQaProjectionOnly: true,
      pairOutcomeUsedAsPassFailGate: false,
      atrialPvTopologyPreservationRequired: false,
      atrialPvTopologyGenerationOrErasurePreordained: false,
      matchedVolumeAttributionComputed: false,
      serializationReauthenticationSupported: false,
    });
    expect(Object.values(artifact.negativeClaims).every((value) =>
      value === false)).toBe(true);
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.waveforms.off.chamberBloodVolumeM3.LA))
      .toBe(true);
  });

  it("canonically serializes the pair and detects payload/hash drift", () => {
    const pair = observations();
    const artifact = buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: pair.off,
      slsOnTerminalObservation: pair.on,
      sha256Hex: sha256,
    });
    const serialized = serializePhaseB1PairedTerminalWaveformArtifactV1(
      artifact,
      sha256,
    );

    expect(serialized.endsWith("\n")).toBe(true);
    expect(JSON.parse(serialized)).toEqual(artifact);
    expect(() => serializePhaseB1PairedTerminalWaveformArtifactV1({
      ...artifact,
      contentSha256: hash("0"),
    }, sha256)).toThrow(/does not match/i);
  });

  it("rejects unauthenticated or mode-swapped observations", () => {
    const pair = observations();
    const reconstructed = JSON.parse(JSON.stringify(pair.off)) as
      PhaseB1NormalSinusBeTerminalTimestepObservationV1;
    expect(() => buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: reconstructed,
      slsOnTerminalObservation: pair.on,
      sha256Hex: sha256,
    })).toThrow(/not builder-issued/i);
    expect(() => buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: pair.on,
      slsOnTerminalObservation: pair.off,
      sha256Hex: sha256,
    })).toThrow(/SLS-off observation mode drifted/i);
  });

  it.each([
    {
      label: "comparison manifest",
      mutate: (pair: ObservationPair) => issue({
        ...pair.on,
        comparisonManifest: Object.freeze({
          ...pair.on.comparisonManifest,
        }),
      }),
      message: /comparison manifest differs/i,
    },
    {
      label: "initial parity",
      mutate: (pair: ObservationPair) => issue({
        ...pair.on,
        initialSourceParityAudit: Object.freeze({
          ...pair.on.initialSourceParityAudit,
        }),
      }),
      message: /initial source parity differs/i,
    },
    {
      label: "parent",
      mutate: (pair: ObservationPair) => issue({
        ...pair.on,
        terminalCycleCapsule: Object.freeze({
          ...pair.on.terminalCycleCapsule,
          parentManifest: Object.freeze({
            ...pair.on.terminalCycleCapsule.parentManifest,
          }),
        }),
      }),
      message: /parent evidence differs/i,
    },
    {
      label: "schedule",
      mutate: (pair: ObservationPair) => issue({
        ...pair.on,
        terminalCycleCapsule: Object.freeze({
          ...pair.on.terminalCycleCapsule,
          schedule: Object.freeze({
            ...pair.on.terminalCycleCapsule.schedule,
          }),
        }),
      }),
      message: /schedule differs/i,
    },
  ])("rejects a distinct $label object even when serialized values match", ({
    mutate,
    message,
  }) => {
    const pair = observations();
    expect(() => buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: pair.off,
      slsOnTerminalObservation: mutate(pair),
      sha256Hex: sha256,
    })).toThrow(message);
  });

  it("rejects grid drift without interpreting waveform morphology", () => {
    const pair = observations();
    const mismatched = issue({
      ...pair.on,
      nominalDtSec: 0.0005,
    });
    expect(() => buildPhaseB1PairedTerminalWaveformArtifactV1({
      slsOffTerminalObservation: pair.off,
      slsOnTerminalObservation: mismatched,
      sha256Hex: sha256,
    })).toThrow(/grid or common model binding differs/i);
  });
});

type ObservationPair = Readonly<{
  off: PhaseB1NormalSinusBeTerminalTimestepObservationV1;
  on: PhaseB1NormalSinusBeTerminalTimestepObservationV1;
}>;

function observations(): ObservationPair {
  const comparisonManifest = Object.freeze({
    contentSha256: hash("1"),
  });
  const parentManifest = Object.freeze({ contentSha256: hash("3") });
  const parentNumericalEvidence = Object.freeze({
    certificate: Object.freeze({ contentSha256: hash("4") }),
  });
  const schedule = Object.freeze({ contentSha256: hash("5") });
  const initialSourceParityAudit = Object.freeze({
    contentSha256: hash("2"),
    parentManifest,
    parentNumericalEvidence,
    schedule,
  });
  const common = {
    comparisonManifest,
    initialSourceParityAudit,
    sourceComparisonManifestContentSha256: hash("1"),
    sourceComparisonPolicyContentSha256: hash("6"),
    sourceInitialParityAuditContentSha256: hash("2"),
    sourceParentManifestContentSha256: hash("3"),
    sourceParentNumericalEvidenceContentSha256: hash("4"),
    sourceScheduleContentSha256: hash("5"),
    gridRole: "coarse" as const,
    nominalDtSec: 0.001,
    canonicalCycleLengthSec: 0.8,
  };
  const build = (slsMode: "off" | "on", multiplier: number) => {
    const modeHash = slsMode === "off" ? "a" : "b";
    const terminalCycleCapsule = Object.freeze({
      slsMode,
      parentManifest,
      parentNumericalEvidence,
      schedule,
      terminalStatus: "converged" as const,
      liveSingleStartPeriodOneCriterionPass: true as const,
      terminalCycleConvergencePass: true as const,
      completedSupercycleCount: slsMode === "off" ? 5 : 6,
      finalCycleIndex: slsMode === "off" ? 4 : 5,
      definitionContentSha256: hash(slsMode === "off" ? "7" : "9"),
      sourceWallMaterialBindingContentSha256: hash("8"),
      terminalResultContentSha256: hash(modeHash),
      finalCommittedSupercycleAuditContentSha256: hash(modeHash),
      finalPeriodicCheckpointContentSha256: hash(modeHash),
      finalCycleEvidenceContentSha256: hash(modeHash),
    });
    return issue({
      ...common,
      slsMode,
      terminalCycleCapsule,
      sampleTrace: Object.freeze({
        samples: Object.freeze([
          sample(0, 0, multiplier),
          sample(1, 0.001, 2 * multiplier),
        ]),
      }),
      sourceTerminalCycleCapsuleContentSha256: hash(modeHash),
      sourceRunnerAttemptTraceContentSha256: hash(modeHash),
      sourceCommittedIntervalLedgerSummaryContentSha256: hash(modeHash),
      sourceCommittedCycleEnergyAuditContentSha256: hash(modeHash),
      sourceSampleTraceContentSha256: hash(modeHash),
      sourceNewtonScaleRegistryContentSha256: hash(modeHash),
      terminalObservationGatePass: slsMode === "off",
      authenticatedNegativeObservationIssued: slsMode === "on",
      contentSha256: hash(modeHash),
    });
  };
  return Object.freeze({
    off: build("off", 1),
    on: build("on", 10),
  });
}

function issue(
  value: object,
): PhaseB1NormalSinusBeTerminalTimestepObservationV1 {
  const issued = Object.freeze(value) as unknown as
    PhaseB1NormalSinusBeTerminalTimestepObservationV1;
  authentication.issued.add(issued);
  return issued;
}

function sample(
  sampleIndex: number,
  phaseSec: number,
  multiplier: number,
): PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1 {
  return Object.freeze({
    sampleIndex,
    sourceKind: sampleIndex === 0
      ? "run-initial-endpoint" as const
      : "requested-segment-exit-endpoint" as const,
    requestedSegmentIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    absoluteTimeSec: 10 + phaseSec,
    phaseSec,
    nominalGridIndex: sampleIndex,
    runnerNominalGridIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    eventKeysAtEnd: Object.freeze(sampleIndex === 0 ? [] : ["event"]),
    endedAtNominalGridBoundary: sampleIndex !== 0,
    endedAtRunBoundary: false,
    endedAtEventBoundary: false,
    eventOnlyExtraEndpoint: false,
    oneUlpNominalGridBoundaryCoalesced: false,
    oneUlpRunEndNominalGridBoundaryCoalesced: false,
    rightContinuousSameTimeLevelReevaluation: true as const,
    bloodVolumesM3: Object.freeze({
      LA: 1e-6 * multiplier,
      LV: 2e-6 * multiplier,
      SA: 3e-6 * multiplier,
      SV: 4e-6 * multiplier,
      RA: 5e-6 * multiplier,
      RV: 6e-6 * multiplier,
      PA: 7e-6 * multiplier,
      PV: 8e-6 * multiplier,
    }),
    compartmentAbsolutePressurePa: Object.freeze({
      LA: 100 + multiplier,
      LV: 200 + multiplier,
      SA: 300 + multiplier,
      SV: 400 + multiplier,
      RA: 500 + multiplier,
      RV: 600 + multiplier,
      PA: 700 + multiplier,
      PV: 800 + 8 * multiplier,
    }),
    allFlowsM3PerSec: Object.freeze({
      Q_MV: 1e-6 * multiplier,
      Q_AoV: 2e-6 * multiplier,
      Q_TV: 3e-6 * multiplier,
      Q_PuV: 4e-6 * multiplier,
      Q_VC: 5e-6 * multiplier,
      Q_PV: 6e-6 * multiplier,
      Q_sys: 7e-6 * multiplier,
      Q_pul: 8e-6 * multiplier,
    }),
    wallFiberLogStrain: Object.freeze({
      LA: 0.01 * multiplier,
      RA: 0.02 * multiplier,
      LVFW: 0.03 * multiplier,
      SEP: 0.04 * multiplier,
      RVFW: 0.05 * multiplier,
    }),
    wallActiveKirchhoffStressPa: Object.freeze({
      LA: 10 * multiplier,
      RA: 20 * multiplier,
      LVFW: 30 * multiplier,
      SEP: 40 * multiplier,
      RVFW: 50 * multiplier,
    }),
    septalSignedMidwallCurvaturePerM: 1 * multiplier,
    septalMidwallVolumeM3: 2e-6 * multiplier,
    junctionRadiusM: 0.03 * multiplier,
    pericardialExcessPressurePa: 100 * multiplier,
  });
}

function hash(character: string): string {
  return character.repeat(64);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
