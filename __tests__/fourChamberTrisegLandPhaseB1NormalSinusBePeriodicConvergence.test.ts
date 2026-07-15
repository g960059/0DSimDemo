import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1,
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1,
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1,
  buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  initializePhaseB1NormalSinusBePeriodicStateV1,
  phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1,
  phaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1,
  recordPhaseB1NormalSinusBePeriodicCheckpointV1,
  validatePhaseB1NormalSinusBePeriodicCheckpointV1,
  validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  type PhaseB1NormalSinusBePeriodicCheckpointV1,
  type PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1,
  type PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  type PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1,
  type PhaseB1NormalSinusBePeriodicStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import type {
  FourChamberFlowId,
  FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 normal-sinus BE periodic convergence foundation", () => {
  it.each(["on", "off"] as const)(
    "requires three hash-chained complete-state passes in SLS-%s topology",
    (slsMode) => {
      let context = buildContext(slsMode);
      const checkpointSha256: string[] = [];
      for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
        const finalEndpoint = endpointAtTime(
          context.state.lastEndpoint,
          (cycleIndex + 1) * context.definition.cycleLengthSec,
        );
        const result = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
          state: context.state,
          observation: observation(
            context.state,
            finalEndpoint,
            balancedFlowVolumes(1e-5, 1e-5),
          ),
          sha256Hex: sha256,
        });
        expect(result.checkpoint.previousCheckpointContentSha256).toBe(
          checkpointSha256.at(-1) ?? null,
        );
        expect(result.checkpoint.contentSha256).toBe(computeCanonicalSha256(
          phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1(
            result.checkpoint,
          ),
          sha256,
        ));
        expect(result.checkpoint.flow
          .forwardAndRegurgitantVolumesAuditedSeparately).toBe(true);
        expect(result.checkpoint.flow
          .forwardAndRegurgitantVolumesComparedForEquality).toBe(false);
        expect(result.checkpoint.flow.byFlow.Q_sys.forwardVolumeM3).toBe(2e-5);
        expect(result.checkpoint.flow.byFlow.Q_sys.regurgitantVolumeM3)
          .toBe(1e-5);
        checkpointSha256.push(result.checkpoint.contentSha256);
        context = { ...context, state: result.state };
      }
      expect(context.state.completedSupercycleCount).toBe(3);
      expect(context.state.consecutivePassingSupercycles).toBe(
        PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1,
      );
      expect(context.state.terminalStatus).toBe("converged");
      expect(context.state.periodicConvergenceCriterionPass).toBe(true);
      expect(context.state.singleStartPeriodOneCriterionPass).toBe(true);
      expect(context.state.normalSinusMultiStartAcceptancePass).toBe(false);
      expect(context.state.physiologicalValidationPass).toBe(false);
      expect(context.state.phaseB1AcceptancePass).toBe(false);
      expect(context.state.retainedCheckpointCount).toBe(1);
      expect(context.state.retainedEndpointCount).toBe(3);
      expectRecursivelyFrozen(context.state.lastCheckpoint);
      expect(() => recordPhaseB1NormalSinusBePeriodicCheckpointV1({
        state: context.state,
        observation: observation(
          context.state,
          endpointAtTime(context.state.lastEndpoint, 3.2),
          balancedFlowVolumes(),
        ),
        sha256Hex: sha256,
      })).toThrow("already terminal");
    },
  );

  it("pins an immutable content-hashed definition and rejects a forged payload", () => {
    const context = buildContext("on");
    expect(context.definition.maximumSupercycles).toBe(100);
    expect(context.definition.requiredConsecutivePassingSupercycles).toBe(3);
    expect(context.definition.contentSha256).toBe(computeCanonicalSha256(
      phaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1(
        context.definition,
      ),
      sha256,
    ));
    expectRecursivelyFrozen(context.definition);
    const forged = structuredClone(context.definition) as unknown as
      MutableDefinition;
    forged.completeStateMismatchTolerance = 2e-6;
    recursivelyFreeze(forged);
    expect(() =>
      validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
        forged as PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
        sha256,
      )).toThrow();
    const forgedHash = structuredClone(context.definition) as unknown as
      MutableDefinition;
    (forgedHash as unknown as { contentSha256: string }).contentSha256 =
      "0".repeat(64);
    recursivelyFreeze(forgedHash);
    expect(() =>
      validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
        forgedHash as PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
        sha256,
      )).toThrow("contentSha256");
  });

  it("consumes each running state once and rejects a rehashed semantic checkpoint forgery", () => {
    const context = buildContext("on");
    const cycleObservation = observation(
      context.state,
      endpointAtTime(context.state.lastEndpoint, 0.8),
      balancedFlowVolumes(),
    );
    const first = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: context.state,
      observation: cycleObservation,
      sha256Hex: sha256,
    });
    expect(first.state.terminalStatus).toBe("running");
    expect(() => recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: context.state,
      observation: cycleObservation,
      sha256Hex: sha256,
    })).toThrow("not a live canonical state");

    const forged = structuredClone(first.checkpoint) as unknown as
      Record<string, unknown>;
    forged.consecutivePassingSupercycles = 0;
    forged.periodicConvergenceCriterionPass = true;
    forged.singleStartPeriodOneCriterionPass = true;
    forged.terminalStatus = "converged";
    const { contentSha256: _oldHash, ...forgedPayload } = forged;
    forged.contentSha256 = computeCanonicalSha256(forgedPayload, sha256);
    recursivelyFreeze(forged);
    expect(() => validatePhaseB1NormalSinusBePeriodicCheckpointV1(
      forged as unknown as PhaseB1NormalSinusBePeriodicCheckpointV1,
      context.definition,
      null,
      sha256,
    )).toThrow("claim boundary");

    const chainedContext = buildContext("on");
    const failedFirst = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: chainedContext.state,
      observation: observation(
        chainedContext.state,
        endpointAtTime(chainedContext.state.lastEndpoint, 0.8),
        zeroFlowVolumes(),
      ),
      sha256Hex: sha256,
    });
    expect(failedFirst.checkpoint.consecutivePassingSupercycles).toBe(0);
    const validSecond = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: failedFirst.state,
      observation: observation(
        failedFirst.state,
        endpointAtTime(failedFirst.state.lastEndpoint, 1.6),
        balancedFlowVolumes(),
      ),
      sha256Hex: sha256,
    });
    expect(validSecond.checkpoint.consecutivePassingSupercycles).toBe(1);
    const jumped = structuredClone(validSecond.checkpoint) as unknown as
      Record<string, unknown>;
    jumped.consecutivePassingSupercycles = 3;
    jumped.periodicConvergenceCriterionPass = true;
    jumped.singleStartPeriodOneCriterionPass = true;
    jumped.terminalStatus = "converged";
    const { contentSha256: _validHash, ...jumpedPayload } = jumped;
    jumped.contentSha256 = computeCanonicalSha256(jumpedPayload, sha256);
    recursivelyFreeze(jumped);
    expect(() => validatePhaseB1NormalSinusBePeriodicCheckpointV1(
      jumped as unknown as PhaseB1NormalSinusBePeriodicCheckpointV1,
      chainedContext.definition,
      failedFirst.checkpoint,
      sha256,
    )).toThrow("claim boundary");

    const validThird = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: validSecond.state,
      observation: observation(
        validSecond.state,
        endpointAtTime(
          validSecond.state.lastEndpoint,
          3 * chainedContext.definition.cycleLengthSec,
        ),
        balancedFlowVolumes(),
      ),
      sha256Hex: sha256,
    });
    expect(validThird.checkpoint.consecutivePassingSupercycles).toBe(2);
    const validFourth = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: validThird.state,
      observation: observation(
        validThird.state,
        endpointAtTime(
          validThird.state.lastEndpoint,
          4 * chainedContext.definition.cycleLengthSec,
        ),
        balancedFlowVolumes(),
      ),
      sha256Hex: sha256,
    });
    expect(validFourth.checkpoint.consecutivePassingSupercycles).toBe(3);
    const disconnected = structuredClone(validFourth.checkpoint) as unknown as
      Record<string, unknown>;
    disconnected.initialEndpointContentSha256 = "1".repeat(64);
    const { contentSha256: _connectedHash, ...disconnectedPayload } =
      disconnected;
    disconnected.contentSha256 = computeCanonicalSha256(
      disconnectedPayload,
      sha256,
    );
    recursivelyFreeze(disconnected);
    expect(() => validatePhaseB1NormalSinusBePeriodicCheckpointV1(
      disconnected as unknown as PhaseB1NormalSinusBePeriodicCheckpointV1,
      chainedContext.definition,
      validThird.checkpoint,
      sha256,
    )).toThrow("claim boundary");

    const postTerminal = structuredClone(failedFirst.checkpoint) as unknown as
      Record<string, unknown>;
    postTerminal.cycleIndex = 4;
    postTerminal.completedSupercycleCount = 5;
    postTerminal.startTimeSec =
      4 * chainedContext.definition.cycleLengthSec;
    postTerminal.endTimeSec =
      5 * chainedContext.definition.cycleLengthSec;
    postTerminal.previousCheckpointContentSha256 =
      validFourth.checkpoint.contentSha256;
    postTerminal.initialEndpointContentSha256 =
      validFourth.checkpoint.finalEndpointContentSha256;
    const { contentSha256: _terminalHash, ...postTerminalPayload } =
      postTerminal;
    postTerminal.contentSha256 = computeCanonicalSha256(
      postTerminalPayload,
      sha256,
    );
    recursivelyFreeze(postTerminal);
    expect(() => validatePhaseB1NormalSinusBePeriodicCheckpointV1(
      postTerminal as unknown as PhaseB1NormalSinusBePeriodicCheckpointV1,
      chainedContext.definition,
      validFourth.checkpoint,
      sha256,
    )).toThrow("previous periodic checkpoint is terminal");
  });

  it("rejects a one-beat period-2 alternation", () => {
    let context = buildContext("on");
    const landScale = context.source.model.newtonScaleRegistry
      .unknownScales.landDistortionByWall.LVFW;
    for (let cycleIndex = 0; cycleIndex < 4; cycleIndex += 1) {
      const offset = cycleIndex % 2 === 0 ? 1e-3 * landScale : 0;
      const finalEndpoint = endpointWithLandOffset(
        context.source.warmStart.endpoint,
        (cycleIndex + 1) * context.definition.cycleLengthSec,
        offset,
      );
      const result = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
        state: context.state,
        observation: observation(
          context.state,
          finalEndpoint,
          balancedFlowVolumes(),
        ),
        sha256Hex: sha256,
      });
      expect(result.checkpoint.gates.adjacentCompleteStatePass).toBe(false);
      expect(result.checkpoint.consecutivePassingSupercycles).toBe(0);
      context = { ...context, state: result.state };
    }
    expect(context.state.periodicConvergenceCriterionPass).toBe(false);
    expect(context.state.terminalStatus).toBe("running");
  });

  it("rejects monotone subthreshold adjacent Land drift over the streak window", () => {
    let context = buildContext("on");
    const base = context.source.warmStart.endpoint.differentialState
      .landByWall.LVFW[4];
    const scale = context.source.model.newtonScaleRegistry
      .unknownScales.landDistortionByWall.LVFW;
    const increment = 0.6e-6 * (scale + Math.abs(base));
    let restartObserved = false;
    for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
      const finalEndpoint = endpointWithLandOffset(
        context.source.warmStart.endpoint,
        (cycleIndex + 1) * context.definition.cycleLengthSec,
        (cycleIndex + 1) * increment,
      );
      const result = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
        state: context.state,
        observation: observation(
          context.state,
          finalEndpoint,
          balancedFlowVolumes(),
        ),
        sha256Hex: sha256,
      });
      expect(result.checkpoint.adjacentMetric.maximumLandNormalizedDistance)
        .toBeLessThan(PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1);
      expect(result.checkpoint.gates.cycleLocalPass).toBe(true);
      restartObserved ||= result.checkpoint
        .previousStreakWindowRejectedAndRestartedAtCurrentCycle;
      context = { ...context, state: result.state };
    }
    expect(restartObserved).toBe(true);
    expect(context.state.consecutivePassingSupercycles).toBe(1);
    expect(context.state.periodicConvergenceCriterionPass).toBe(false);
  });

  it("rejects zero systemic net flow and an otherwise balanced one-edge mismatch", () => {
    const zeroContext = buildContext("on");
    const zero = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: zeroContext.state,
      observation: observation(
        zeroContext.state,
        endpointAtTime(zeroContext.state.lastEndpoint, 0.8),
        zeroFlowVolumes(),
      ),
      sha256Hex: sha256,
    });
    expect(zero.checkpoint.flow.systemicNetFlowUsableAsRelativeDenominator)
      .toBe(false);
    expect(zero.checkpoint.flow.maximumRelativeSignedNetFlowMismatch)
      .toBeNull();
    expect(zero.checkpoint.gates.signedFlowAgreementPass).toBe(false);
    expect(zero.checkpoint.consecutivePassingSupercycles).toBe(0);

    const mismatchContext = buildContext("on");
    const mismatched = balancedFlowVolumes();
    mismatched.Q_AoV = Object.freeze({
      signedVolumeM3: 1.01e-5,
      forwardVolumeM3: 1.01e-5,
      regurgitantVolumeM3: 0,
    });
    const mismatch = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: mismatchContext.state,
      observation: observation(
        mismatchContext.state,
        endpointAtTime(mismatchContext.state.lastEndpoint, 0.8),
        Object.freeze(mismatched),
      ),
      sha256Hex: sha256,
    });
    expect(mismatch.checkpoint.flow.maximizingFlowId).toBe("Q_AoV");
    expect(mismatch.checkpoint.flow.maximumRelativeSignedNetFlowMismatch)
      .toBeCloseTo(0.01, 14);
    expect(mismatch.checkpoint.gates.signedFlowAgreementPass).toBe(false);
    expect(mismatch.checkpoint.consecutivePassingSupercycles).toBe(0);
  });

  it("rejects a reported per-supercycle TBV drift above the fixed gate", () => {
    const context = buildContext("on");
    const baseObservation = observation(
      context.state,
      endpointAtTime(context.state.lastEndpoint, 0.8),
      balancedFlowVolumes(),
    );
    const result = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: context.state,
      observation: Object.freeze({
        ...baseObservation,
        maximumRelativeTotalBloodVolumeDrift: 1e-9,
      }),
      sha256Hex: sha256,
    });
    expect(result.checkpoint.gates.adjacentCompleteStatePass).toBe(true);
    expect(result.checkpoint.totalBloodVolume.perSupercyclePass).toBe(false);
    expect(result.checkpoint.gates.totalBloodVolumePass).toBe(false);
    expect(result.checkpoint.consecutivePassingSupercycles).toBe(0);
  });

  it("rejects an SLS topology change before recording a checkpoint", () => {
    const on = buildContext("on");
    const off = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256);
    expect(() => recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: on.state,
      observation: observation(
        on.state,
        endpointAtTime(off.warmStart.endpoint, 0.8),
        balancedFlowVolumes(),
      ),
      sha256Hex: sha256,
    })).toThrow("changed SLS topology");
  });

  it("ends as non-converged when the fixed one-hundred-cycle cap is exhausted", () => {
    let context = buildContext("off");
    for (
      let cycleIndex = 0;
      cycleIndex < PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1;
      cycleIndex += 1
    ) {
      const result = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
        state: context.state,
        observation: observation(
          context.state,
          endpointAtTime(
            context.state.lastEndpoint,
            (cycleIndex + 1) * context.definition.cycleLengthSec,
          ),
          zeroFlowVolumes(),
        ),
        sha256Hex: sha256,
      });
      context = { ...context, state: result.state };
    }
    expect(context.state.completedSupercycleCount).toBe(100);
    expect(context.state.terminalStatus)
      .toBe("maximum-supercycles-exhausted");
    expect(context.state.periodicConvergenceCriterionPass).toBe(false);
    expect(context.state.singleStartPeriodOneCriterionPass).toBe(false);
  });
});

function buildContext(slsMode: "on" | "off") {
  const source = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    sha256,
  );
  const definition =
    buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1({
      schedule,
      sourceEndpoint: source.warmStart.endpoint,
      registry: source.model.newtonScaleRegistry,
      nominalDtSec: 0.001,
      sha256Hex: sha256,
    });
  const state = initializePhaseB1NormalSinusBePeriodicStateV1({
    definition,
    schedule,
    registry: source.model.newtonScaleRegistry,
    initialEndpoint: source.warmStart.endpoint,
    sha256Hex: sha256,
  });
  return { source, schedule, definition, state };
}

function observation(
  state: PhaseB1NormalSinusBePeriodicStateV1,
  finalEndpoint: PhaseB1EndpointStateV1,
  integratedFlowVolumeByFlow: Readonly<Record<
    FourChamberFlowId,
    PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1
  >>,
): PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1 {
  return Object.freeze({
    cycleIndex: state.completedSupercycleCount,
    initialEndpoint: state.lastEndpoint,
    finalEndpoint,
    integratedFlowVolumeByFlow,
    maximumRelativeTotalBloodVolumeDrift: 0,
    exactOneScheduleSupercycleVerified: true,
    committedIntervalProvenanceVerified: true,
    structuralAndNumericalIntervalLedgerGatesPass: true,
    projectionClippingClampAndFallbackFree: true,
  });
}

function balancedFlowVolumes(
  signedVolumeM3 = 1e-5,
  regurgitantVolumeM3 = 0,
): Record<FourChamberFlowId, PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1> {
  return Object.fromEntries(FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => [
    flowId,
    Object.freeze({
      signedVolumeM3,
      forwardVolumeM3: signedVolumeM3 + regurgitantVolumeM3,
      regurgitantVolumeM3,
    }),
  ])) as Record<
    FourChamberFlowId,
    PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1
  >;
}

function zeroFlowVolumes(): Readonly<Record<
  FourChamberFlowId,
  PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1
>> {
  return Object.freeze(balancedFlowVolumes(0, 0));
}

function endpointAtTime(
  endpoint: PhaseB1EndpointStateV1,
  timeSec: number,
): PhaseB1EndpointStateV1 {
  return createPhaseB1EndpointStateV1({
    timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function endpointWithLandOffset(
  source: PhaseB1EndpointStateV1,
  timeSec: number,
  offset: number,
): PhaseB1EndpointStateV1 {
  const differentialState = structuredClone(source.differentialState);
  const mutableLand = differentialState.landByWall as unknown as Record<
    FourChamberWallId,
    number[]
  >;
  mutableLand.LVFW[4] += offset;
  return createPhaseB1EndpointStateV1({
    timeSec,
    differentialState,
    triSegCoordinates: source.triSegCoordinates,
  });
}

type MutableDefinition = Omit<
  PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  "completeStateMismatchTolerance"
> & { completeStateMismatchTolerance: number };

function recursivelyFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      recursivelyFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function expectRecursivelyFrozen(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectRecursivelyFrozen(child);
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
