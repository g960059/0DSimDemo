import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createFlatNumericalStateBufferV1,
  createFlatNumericalStateLayoutV1,
  createFlatNumericalStringTableV1,
  flatNumericalStateBuffersEqualV1,
  writeFlatNumericalStateV1,
} from "@/engine/vnext/FlatNumericalStateV1";
import {
  MainWireFlatReferenceKernelV1,
  createMainWireFlatReferenceOutputPlanV1,
  createMainWireFlatReferencePresentationPageV1,
  openMainWireFlatReferencePresentationPageV1,
} from "@/engine/vnext/MainWireFlatReferenceKernelV1";
import {
  MainWireFlatReferenceWorkerRuntimeV1,
  createMainWireFlatReferenceWorkerCommandV1,
  mainWireFlatReferenceWorkerCommandTransferV1,
  mainWireFlatReferenceWorkerResultTransferV1,
} from "@/engine/vnext/MainWireFlatReferenceWorkerProtocolV1";

describe("FlatNumericalStateV1", () => {
  it("owns a deterministic flat layout and keeps a failed write atomic", () => {
    const state = Object.freeze({
      clock: 0,
      active: true,
      label: "baseline",
      secondaryLabel: "fixed",
      nested: Object.freeze({ values: new Float64Array([1, 2, 3]) }),
      optional: null,
    });
    const layout = createFlatNumericalStateLayoutV1("test-layout", state);
    const table = createFlatNumericalStringTableV1();
    const buffer = createFlatNumericalStateBufferV1(layout);
    writeFlatNumericalStateV1(layout, state, buffer, table);
    const before = {
      continuous: buffer.continuous.slice(),
      booleans: buffer.booleans.slice(),
      strings: buffer.strings.slice(),
    };

    expect(layout.continuousSlots.map(({ pointer }) => pointer)).toEqual([
      "/clock",
      "/nested/values/0",
      "/nested/values/1",
      "/nested/values/2",
    ]);
    expect(() => writeFlatNumericalStateV1(
      layout,
      { ...state, nested: { values: new Float64Array([1, Number.NaN, 3]) } },
      buffer,
      table,
    )).toThrow("/nested/values/1 must be finite");
    expect(buffer.continuous).toEqual(before.continuous);
    expect(buffer.booleans).toEqual(before.booleans);
    expect(buffer.strings).toEqual(before.strings);
    const stringTableBefore = [...table.valuesByCode];
    expect(() => writeFlatNumericalStateV1(
      layout,
      { ...state, label: "changed", secondaryLabel: 4 },
      buffer,
      table,
    )).toThrow("/secondaryLabel must be a string");
    expect(table.valuesByCode).toEqual(stringTableBefore);
  });

  it("rejects accessors without invoking them", () => {
    let calls = 0;
    const state = Object.defineProperty({ clock: 0 }, "hidden", {
      enumerable: true,
      get() {
        calls += 1;
        return 1;
      },
    });
    expect(() => createFlatNumericalStateLayoutV1("accessor", state))
      .toThrow("is an accessor");
    expect(calls).toBe(0);
  });
});

describe("MainWireFlatReferenceKernelV1", () => {
  it("packs 1,024 exact ticks and completed-beat outputs without numerical drift", async () => {
    const kernel = await MainWireFlatReferenceKernelV1.create();
    const oracle = await MainWireIntegratedModelSessionV3.create();
    const outputPlan = createMainWireFlatReferenceOutputPlanV1(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
    );
    const batchSize = 16;
    expect(kernel.stateLayout()).toMatchObject({
      continuousSlots: { length: 440 },
      booleanSlots: { length: 4 },
      stringSlots: { length: 205 },
      excludedDynamicRoots: { length: 45 },
    });
    expect(kernel.stateLayout().excludedDynamicRoots.map(({ pointer }) => pointer))
      .toEqual(expect.arrayContaining([
        "/coronary/coronaryAutoregulation/windowControl",
        "/composedRhythm/pendingCalciumDeposits",
      ]));

    let sawCompletedBeatOutput = false;
    for (let batch = 0; batch < 64; batch += 1) {
      const page = createMainWireFlatReferencePresentationPageV1(
        batchSize,
        outputPlan,
      );
      expect(new Set([
        page.acceptedTicks.buffer,
        page.acceptedRevisions.buffer,
        page.outputStates.buffer,
        page.outputValues.buffer,
      ]).size).toBe(1);
      const firstTick = batch * batchSize + 1;
      const terminalTick = (batch + 1) * batchSize;
      const result = kernel.advanceTo(terminalTick, outputPlan, page);
      expect(result).toMatchObject({
        sampleCount: batchSize,
        terminalTick,
      });
      expect(result.phaseTimingsMs.oracleAdvance).toBeGreaterThanOrEqual(0);

      for (let pageIndex = 0; pageIndex < batchSize; pageIndex += 1) {
        const tick = firstTick + pageIndex;
        const advance = oracle.advanceToPresentationTime(
          mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
        );
        expect(advance.status).toBe("advanced");
        if (advance.status !== "advanced") {
          throw new Error(`oracle failed at ${tick}`);
        }
        expect(page.acceptedTicks[pageIndex]).toBe(tick);
        expect(page.acceptedRevisions[pageIndex]).toBe(advance.acceptedRevision);
        const expected = projectMainWireIntegratedModelSelectedValuesV3(
          advance.observation,
          outputPlan.outputIds,
        );
        for (let outputIndex = 0; outputIndex < outputPlan.outputIds.length; outputIndex += 1) {
          const outputId = outputPlan.outputIds[outputIndex]!;
          const expectedOutput = expected[outputId]!;
          const packedIndex = pageIndex * outputPlan.outputIds.length + outputIndex;
          expect(page.outputStates[packedIndex]).toBe(outputStateCode(expectedOutput));
          if (expectedOutput.value === null) {
            expect(Number.isNaN(page.outputValues[packedIndex])).toBe(true);
          } else {
            expect(page.outputValues[packedIndex]).toBe(expectedOutput.value);
            if (outputId === "hemodynamics.output.native-left") {
              sawCompletedBeatOutput = true;
            }
          }
        }
      }
    }

    const kernelState = kernel.snapshotCurrentFlatState();
    const oracleState = oracle.currentAcceptedState();
    const oracleLayout = kernel.stateLayout();
    const oracleBuffer = createFlatNumericalStateBufferV1(oracleLayout);
    const oracleStrings = createFlatNumericalStringTableV1();
    writeFlatNumericalStateV1(
      oracleLayout,
      oracleState,
      oracleBuffer,
      oracleStrings,
    );

    expect(kernelState.continuous).toEqual(oracleBuffer.continuous);
    expect(kernelState.booleans).toEqual(oracleBuffer.booleans);
    expect(decodeStrings(kernelState.strings, kernelState.stringTable))
      .toEqual(decodeStrings(oracleBuffer.strings, oracleStrings.valuesByCode));
    expect(sawCompletedBeatOutput).toBe(true);
    expect(kernelState.acceptedTick).toBe(1_024);
    expect(kernelState.acceptedRevision).toBe(oracleState.revision);
  }, 120_000);

  it("rejects invalid page ownership before advancing", async () => {
    const kernel = await MainWireFlatReferenceKernelV1.create();
    const firstPlan = createMainWireFlatReferenceOutputPlanV1([
      "hemodynamics.pressure.absolute.LV",
    ]);
    const secondPlan = createMainWireFlatReferenceOutputPlanV1([
      "hemodynamics.volume.LV",
    ]);
    const page = createMainWireFlatReferencePresentationPageV1(1, firstPlan);
    const foreignValues = new Float64Array(page.outputValues.length);
    const forgedPage = Object.freeze({
      ...page,
      outputValues: foreignValues,
    });
    const before = kernel.snapshotCurrentFlatState();

    expect(() => kernel.advanceTo(1, secondPlan, page))
      .toThrow("does not match output plan");
    expect(() => kernel.advanceTo(1, firstPlan, forgedPage))
      .toThrow("does not match output plan");
    expect(foreignValues[0]).toBe(0);
    expect(() => kernel.advanceTo(2, firstPlan, page))
      .toThrow("destination page is too small");
    const after = kernel.snapshotCurrentFlatState();
    expect(after.acceptedTick).toBe(before.acceptedTick);
    expect(after.acceptedRevision).toBe(before.acceptedRevision);
    expect(flatNumericalStateBuffersEqualV1(
      {
        continuous: after.continuous,
        nullableContinuous: after.nullableContinuous,
        nullableContinuousPresent: after.nullableContinuousPresent,
        booleans: after.booleans,
        strings: after.strings,
      },
      {
        continuous: before.continuous,
        nullableContinuous: before.nullableContinuous,
        nullableContinuousPresent: before.nullableContinuousPresent,
        booleans: before.booleans,
        strings: before.strings,
      },
    )).toBe(true);
  }, 120_000);

  it("poisons after an oracle partially advances and then reports failure", async () => {
    const oracle = await MainWireIntegratedModelSessionV3.create();
    let advanceCalls = 0;
    const injectedOracle = Object.freeze({
      currentAcceptedState: () => oracle.currentAcceptedState(),
      advanceToPresentationTime(
        targetTimeSec: number,
      ): MainWireIntegratedModelPresentationAdvanceV3 {
        advanceCalls += 1;
        const advanced = oracle.advanceToPresentationTime(targetTimeSec);
        if (advanced.status !== "advanced") return advanced;
        return Object.freeze({
          status: "failed" as const,
          reason: "integrated-promotion-rejected" as const,
          message: "injected failure after accepted substeps",
          acceptedTimeSec: advanced.acceptedTimeSec,
          acceptedRevision: advanced.acceptedRevision,
          partiallyAdvanced: true,
          internalAcceptedSubstepCount: advanced.internalAcceptedSubstepCount,
          boundaryClippedSubstepCount: advanced.boundaryClippedSubstepCount,
          substeps: advanced.substeps,
          requestedPresentationTimeSec: targetTimeSec,
        });
      },
    });
    const kernel = MainWireFlatReferenceKernelV1
      .createFromOracleForTesting(injectedOracle);
    const plan = createMainWireFlatReferenceOutputPlanV1([
      "hemodynamics.pressure.absolute.LV",
    ]);
    const firstPage = createMainWireFlatReferencePresentationPageV1(1, plan);

    expect(() => kernel.advanceTo(1, plan, firstPage))
      .toThrow("oracle returned failed");
    expect(oracle.currentAcceptedState().acceptedTimeSec).toBeGreaterThan(0);
    expect(kernel.snapshotCurrentFlatState()).toMatchObject({
      acceptedTick: 0,
      acceptedRevision: 0,
    });

    const retryPage = createMainWireFlatReferencePresentationPageV1(1, plan);
    expect(() => kernel.advanceTo(1, plan, retryPage)).toThrow("is poisoned");
    expect(advanceCalls).toBe(1);
  }, 120_000);

  it("poisons when an advanced oracle returns an off-grid accepted clock", async () => {
    const oracle = await MainWireIntegratedModelSessionV3.create();
    let advanceCalls = 0;
    const injectedOracle = Object.freeze({
      currentAcceptedState: () => oracle.currentAcceptedState(),
      advanceToPresentationTime(
        targetTimeSec: number,
      ): MainWireIntegratedModelPresentationAdvanceV3 {
        advanceCalls += 1;
        const advanced = oracle.advanceToPresentationTime(targetTimeSec);
        if (advanced.status !== "advanced") return advanced;
        return Object.freeze({
          ...advanced,
          acceptedTimeSec: advanced.acceptedTimeSec - 0.0005,
        });
      },
    });
    const kernel = MainWireFlatReferenceKernelV1
      .createFromOracleForTesting(injectedOracle);
    const plan = createMainWireFlatReferenceOutputPlanV1([
      "hemodynamics.pressure.absolute.LV",
    ]);

    expect(() => kernel.advanceTo(
      1,
      plan,
      createMainWireFlatReferencePresentationPageV1(1, plan),
    )).toThrow("invalid accepted clock");
    expect(oracle.currentAcceptedState().acceptedTimeSec).toBe(0.002);
    expect(kernel.snapshotCurrentFlatState().acceptedTick).toBe(0);

    expect(() => kernel.advanceTo(
      1,
      plan,
      createMainWireFlatReferencePresentationPageV1(1, plan),
    )).toThrow("is poisoned");
    expect(advanceCalls).toBe(1);
  }, 120_000);

  it("round-trips one caller-owned page through the Worker command seam", async () => {
    const runtime = await MainWireFlatReferenceWorkerRuntimeV1.create();
    const plan = createMainWireFlatReferenceOutputPlanV1([
      "hemodynamics.pressure.absolute.LV",
      "hemodynamics.volume.LV",
    ]);
    const page = createMainWireFlatReferencePresentationPageV1(16, plan);
    const command = createMainWireFlatReferenceWorkerCommandV1({
      requestId: "request/1",
      targetTick: 16,
      capacity: 16,
      outputIds: plan.outputIds,
      destinationBuffer: page.buffer,
    });
    expect(mainWireFlatReferenceWorkerCommandTransferV1(command))
      .toEqual([page.buffer]);

    const clonedCommand = structuredClone(command, {
      transfer: mainWireFlatReferenceWorkerCommandTransferV1(command),
    });
    expect(page.buffer.byteLength).toBe(0);
    const result = runtime.execute(clonedCommand);
    expect(result.advance).toMatchObject({ sampleCount: 16, terminalTick: 16 });
    expect(mainWireFlatReferenceWorkerResultTransferV1(result))
      .toEqual([result.destinationBuffer]);

    const clonedResult = structuredClone(result, {
      transfer: mainWireFlatReferenceWorkerResultTransferV1(result),
    });
    expect(result.destinationBuffer.byteLength).toBe(0);
    const returned = openMainWireFlatReferencePresentationPageV1(
      clonedResult.destinationBuffer,
      clonedResult.capacity,
      plan,
    );
    expect(returned.acceptedTicks[0]).toBe(1);
    expect(returned.acceptedTicks[15]).toBe(16);
    expect(returned.outputValues.every(Number.isFinite)).toBe(true);
  }, 120_000);
});

function outputStateCode(output: Readonly<{
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>): number {
  return (output.availability === "available" ? 0 : 3)
    + (output.quality === "authoritative-state"
      ? 0
      : output.quality === "accepted-derived"
      ? 1
      : 2);
}

function decodeStrings(codes: Uint32Array, values: readonly string[]) {
  return [...codes].map((code) => values[code - 1]);
}
