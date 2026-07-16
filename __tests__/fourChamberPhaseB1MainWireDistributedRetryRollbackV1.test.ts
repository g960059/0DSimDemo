import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  mainWireDefaultHemodynamicRuntimeControlsV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  transformPhaseB1EndpointToMainWireDistributedV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1";
import {
  createPhaseB1MainWireDistributedResearchModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  initializeMainWireNonCoronaryVascularStateV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1";
import {
  runPhaseB1MainWireDistributedCycleV1,
} from "@/tools/myocardium/runPhaseB1MainWireDistributedV1";

const retryProbe = vi.hoisted(() => ({
  calls: [] as Array<Readonly<{
    startTimeSec: number;
    durationSec: number;
    injectedFailure: boolean;
  }>>,
}));

vi.mock(
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import(
      "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1"
    )>();
    return {
      ...actual,
      stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1: (
        input: Parameters<
          typeof actual.stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1
        >[0],
      ) => {
        const result =
          actual.stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1(input);
        const invocation = retryProbe.calls.length;
        const injectedFailure = invocation === 0 || invocation === 2;
        retryProbe.calls.push(Object.freeze({
          startTimeSec: input.previousEndpoint.timeSec,
          durationSec: input.dtSec,
          injectedFailure,
        }));
        if (!injectedFailure) return result;
        return Object.freeze({
          converged: false as const,
          solverId: result.solverId,
          modelId: result.modelId,
          slsMode: result.slsMode,
          unknownCount: result.unknownCount,
          reason: "maximum-iterations" as const,
          failureClass: "recoverable-nonlinear-convergence" as const,
          retryableByStepSubdivision: true,
          message: `test-injected retry failure ${invocation}`,
          rollbackEndpoint: input.previousEndpoint,
          lastAcceptedDiagnosticEndpoint: null,
          newtonDiagnostics: result.newtonDiagnostics,
          projectionApplied: false as const,
          hiddenStateClippingApplied: false as const,
          postStepBloodVolumeProjectionApplied: false as const,
          flowClampApplied: false as const,
          fallbackApplied: false as const,
          researchOnly: true as const,
          physiologicalValidation: false as const,
          phaseB1Acceptance: false as const,
          browserRuntimeAdopted: false as const,
          releaseRuntimeReachable: false as const,
        });
      },
    };
  },
);

describe("Phase B1 main-wire recursive retry rollback", () => {
  it("discards a successful left half and rolls a failed right half back to the parent entry", () => {
    retryProbe.calls.length = 0;
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "off",
      sha256,
    );
    const sourceEndpoint = candidate.warmStart.endpoint;
    const sourceEvaluation = evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      candidate.wallMaterialBinding,
      sourceEndpoint,
    );
    const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
    const externalPressurePa = Object.freeze({ pth: 0, palv: 0 });
    const initialized = initializeMainWireNonCoronaryVascularStateV1({
      targetTotalBloodVolumeM3: 5e-3,
      chamberVolumeM3ByNode: Object.freeze({
        LV: sourceEndpoint.differentialState.bloodVolumesM3.LV,
        LA: sourceEndpoint.differentialState.bloodVolumesM3.LA,
        RV: sourceEndpoint.differentialState.bloodVolumesM3.RV,
        RA: sourceEndpoint.differentialState.bloodVolumesM3.RA,
      }),
      chamberAbsolutePressurePaByNode:
        sourceEvaluation.closedLoop.chamberAbsolutePressurePa,
      mainWireRuntimeControls: controls,
      externalPressurePa,
    });
    const entryEndpoint = transformPhaseB1EndpointToMainWireDistributedV1({
      sourceEndpoint,
      vascularBloodVolumesM3: initialized.vascularVolumeM3ByNode,
      chamberAbsolutePressurePaByNode:
        initialized.chamberAbsolutePressurePaByNode,
      vascularAbsolutePressurePaByNode:
        initialized.vascularAbsolutePressurePaByNode,
      rootDynamicFlowsM3PerSec:
        initialized.solverFlowPartition.dynamicRootFlowsM3PerSec,
    }).endpoint;
    const model = createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: candidate.model,
      mainWireRuntimeControls: controls,
      vascularExternalPressurePa: externalPressurePa,
      maximumNewtonIterations: 24,
    });
    const requestedDurationSec = 0.05e-3;
    const result = runPhaseB1MainWireDistributedCycleV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: entryEndpoint,
      endTimeSec: entryEndpoint.timeSec + requestedDurationSec,
      nominalDtSec: requestedDurationSec,
      maximumRetryDepth: 1,
      orderedEvents: Object.freeze([]),
    });

    expect(retryProbe.calls).toEqual([
      {
        startTimeSec: entryEndpoint.timeSec,
        durationSec: requestedDurationSec,
        injectedFailure: true,
      },
      {
        startTimeSec: entryEndpoint.timeSec,
        durationSec: 0.5 * requestedDurationSec,
        injectedFailure: false,
      },
      {
        startTimeSec: entryEndpoint.timeSec + 0.5 * requestedDurationSec,
        durationSec: 0.5 * requestedDurationSec,
        injectedFailure: true,
      },
    ]);
    expect(result.completed).toBe(false);
    if (result.completed !== false) throw new Error("expected retry failure");
    expect(result.acceptedIntervals).toHaveLength(0);
    expect(result.lastAcceptedEndpoint).toBe(entryEndpoint);
    expect(result.failedSegment.rollbackEndpoint).toBe(entryEndpoint);
    expect(result.failedSegment.rollbackEndpoint.timeSec)
      .toBe(entryEndpoint.timeSec);
    expect(result.failedSegment.failure.rollbackEndpoint.timeSec)
      .toBe(entryEndpoint.timeSec + 0.5 * requestedDurationSec);
    expect(result.solverRetrySubdivisionCount).toBe(1);
    expect(result.maximumRetryDepthUsed).toBe(1);
  }, 60_000);
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
