import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
  type MainWireIntegratedModelOutputIdV3,
  type MainWireIntegratedModelOutputValueV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3,
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";
import {
  createFlatNumericalStateBufferV1,
  createFlatNumericalStateLayoutV1,
  createFlatNumericalStringTableV1,
  writeFlatNumericalStateV1,
  type FlatNumericalStateBufferV1,
  type FlatNumericalStateLayoutV1,
} from "@/engine/vnext/FlatNumericalStateV1";

export const MAIN_WIRE_FLAT_REFERENCE_KERNEL_V1_ID =
  "main-wire-flat-reference-kernel-v1" as const;
export const MAIN_WIRE_FLAT_REFERENCE_STATE_LAYOUT_V1_ID =
  "main-wire-integrated-accepted-state-flat-layout-v1" as const;
export const MAIN_WIRE_FLAT_REFERENCE_PRESENTATION_PAGE_V1_ID =
  "main-wire-flat-reference-presentation-page-v1" as const;

const OUTPUT_ID_SET = new Set<string>(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3);
const MAX_PAGE_CAPACITY = 4_096;

export type MainWireFlatReferenceOutputPlanV1 = Readonly<{
  outputIds: readonly MainWireIntegratedModelOutputIdV3[];
}>;

/** One transferable backing buffer with non-overlapping typed views. */
export type MainWireFlatReferencePresentationPageV1 = Readonly<{
  pageId: typeof MAIN_WIRE_FLAT_REFERENCE_PRESENTATION_PAGE_V1_ID;
  capacity: number;
  outputIds: readonly MainWireIntegratedModelOutputIdV3[];
  buffer: ArrayBuffer;
  acceptedTicks: Float64Array;
  acceptedRevisions: Float64Array;
  outputStates: Uint8Array;
  outputValues: Float64Array;
}>;

export type MainWireFlatReferenceAdvanceResultV1 = Readonly<{
  sampleCount: number;
  terminalTick: number;
  terminalRevision: number;
  phaseTimingsMs: Readonly<{
    oracleAdvance: number;
    outputProjection: number;
    total: number;
  }>;
}>;

export type MainWireFlatReferenceStateSnapshotV1 = Readonly<{
  acceptedTick: number;
  acceptedRevision: number;
  continuous: Float64Array;
  booleans: Uint8Array;
  strings: Uint32Array;
  stringTable: readonly string[];
}>;

/** Narrow oracle seam used only to falsify failure atomicity in Phase 1a. */
export type MainWireFlatReferenceOracleV1 = Pick<
  MainWireIntegratedModelSessionV3,
  "currentAcceptedState" | "advanceToPresentationTime"
>;

/**
 * Non-production vertical slice. The default path owns the complete accepted
 * transaction through MainWireFlatAuthoritativeReferenceSessionV1 and writes
 * integer-tick output pages directly. A flattened object snapshot is produced
 * only on explicit diagnostic request, never once per presentation tick.
 * Test-only injected oracles remain available to falsify failure atomicity.
 */
export class MainWireFlatReferenceKernelV1 {
  readonly kernelId = MAIN_WIRE_FLAT_REFERENCE_KERNEL_V1_ID;

  readonly #oracle: MainWireFlatReferenceOracleV1;
  readonly #layout: FlatNumericalStateLayoutV1;
  #acceptedState: ReturnType<
    MainWireFlatReferenceOracleV1["currentAcceptedState"]
  >;
  #acceptedTick: number;
  #acceptedRevision: number;
  #poisonedReason: string | null = null;

  private constructor(oracle: MainWireFlatReferenceOracleV1) {
    this.#oracle = oracle;
    const accepted = oracle.currentAcceptedState();
    this.#acceptedState = accepted;
    this.#acceptedTick = presentationTickForAcceptedTime(accepted.acceptedTimeSec);
    this.#acceptedRevision = accepted.revision;
    this.#layout = createFlatNumericalStateLayoutV1(
      MAIN_WIRE_FLAT_REFERENCE_STATE_LAYOUT_V1_ID,
      accepted,
    );
  }

  static async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireFlatReferenceKernelV1> {
    return new MainWireFlatReferenceKernelV1(
      await MainWireFlatAuthoritativeReferenceSessionV1.create(
        inputs,
        ventricularContractilityScale,
      ),
    );
  }

  /** Test-only failure seam. Production callers must use `create`. */
  static createFromOracleForTesting(
    oracle: MainWireFlatReferenceOracleV1,
  ): MainWireFlatReferenceKernelV1 {
    return new MainWireFlatReferenceKernelV1(oracle);
  }

  stateLayout(): FlatNumericalStateLayoutV1 {
    return this.#layout;
  }

  snapshotCurrentFlatState(): MainWireFlatReferenceStateSnapshotV1 {
    const buffer = createFlatNumericalStateBufferV1(this.#layout);
    const stringTable = createFlatNumericalStringTableV1();
    writeFlatNumericalStateV1(
      this.#layout,
      this.#acceptedState,
      buffer,
      stringTable,
    );
    return Object.freeze({
      acceptedTick: this.#acceptedTick,
      acceptedRevision: this.#acceptedRevision,
      continuous: buffer.continuous,
      booleans: buffer.booleans,
      strings: buffer.strings,
      stringTable: Object.freeze([...stringTable.valuesByCode]),
    });
  }

  /**
   * Advances through integer presentation ticks and writes directly into the
   * caller-owned page. Invalid plans/pages are rejected before the oracle can
   * advance.
   */
  advanceTo(
    targetTick: number,
    outputPlan: MainWireFlatReferenceOutputPlanV1,
    destination: MainWireFlatReferencePresentationPageV1,
  ): MainWireFlatReferenceAdvanceResultV1 {
    if (this.#poisonedReason !== null) {
      throw new Error(
        `Flat reference kernel is poisoned: ${this.#poisonedReason}`,
      );
    }
    assertTargetTick(targetTick, this.#acceptedTick);
    assertDestinationMatchesPlan(destination, outputPlan);
    const sampleCount = targetTick - this.#acceptedTick;
    if (sampleCount > destination.capacity) {
      throw new Error("Flat reference destination page is too small");
    }

    const startedAt = performance.now();
    let oracleAdvanceMs = 0;
    let outputProjectionMs = 0;

    for (let pageIndex = 0; pageIndex < sampleCount; pageIndex += 1) {
      const nextTick = this.#acceptedTick + 1;
      let phaseStartedAt = performance.now();
      let advance: MainWireIntegratedModelPresentationAdvanceV3;
      try {
        advance = this.#oracle.advanceToPresentationTime(
          mainWireIntegratedModelPresentationTargetTimeSecV3(nextTick),
        );
      } catch (error) {
        oracleAdvanceMs += performance.now() - phaseStartedAt;
        const message = error instanceof Error ? error.message : String(error);
        this.#poisonedReason =
          `oracle threw after advance began at tick ${nextTick}: ${message}`;
        throw new Error(
          `Flat reference oracle advance failed: ${this.#poisonedReason}`,
        );
      }
      oracleAdvanceMs += performance.now() - phaseStartedAt;
      if (advance.status !== "advanced") {
        this.#poisonedReason =
          `oracle returned ${advance.status} after advance began at tick ${nextTick}`;
        throw new Error(
          `Flat reference oracle advance failed: ${this.#poisonedReason}`,
        );
      }
      let returnedTick: number;
      try {
        returnedTick = presentationTickForAcceptedTime(advance.acceptedTimeSec);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.#poisonedReason =
          `oracle returned an invalid accepted clock at tick ${nextTick}: ${message}`;
        throw new Error(
          `Flat reference oracle advance failed: ${this.#poisonedReason}`,
        );
      }
      if (
        returnedTick !== nextTick
        || advance.acceptedRevision <= this.#acceptedRevision
      ) {
        this.#poisonedReason =
          `oracle returned a non-monotonic clock at tick ${nextTick}`;
        throw new Error(
          `Flat reference oracle advance failed: ${this.#poisonedReason}`,
        );
      }

      try {
        phaseStartedAt = performance.now();
        const values = projectMainWireIntegratedModelSelectedValuesV3(
          advance.observation,
          outputPlan.outputIds,
        );
        writeProjectedValues(destination, pageIndex, values);
        outputProjectionMs += performance.now() - phaseStartedAt;
      } catch (error) {
        this.#poisonedReason = error instanceof Error
          ? error.message
          : String(error);
        throw new Error(
          `Flat reference post-advance contract failed: ${this.#poisonedReason}`,
        );
      }

      destination.acceptedTicks[pageIndex] = nextTick;
      destination.acceptedRevisions[pageIndex] = advance.acceptedRevision;
      this.#acceptedState = advance.observation.acceptedState;
      this.#acceptedTick = nextTick;
      this.#acceptedRevision = advance.acceptedRevision;
    }

    return Object.freeze({
      sampleCount,
      terminalTick: this.#acceptedTick,
      terminalRevision: this.#acceptedRevision,
      phaseTimingsMs: Object.freeze({
        oracleAdvance: oracleAdvanceMs,
        outputProjection: outputProjectionMs,
        total: performance.now() - startedAt,
      }),
    });
  }
}

export function createMainWireFlatReferenceOutputPlanV1(
  outputIds: readonly string[],
): MainWireFlatReferenceOutputPlanV1 {
  const seen = new Set<string>();
  const validated = outputIds.map((outputId) => {
    if (!OUTPUT_ID_SET.has(outputId)) {
      throw new Error(`Flat reference output ${outputId} is unavailable`);
    }
    if (seen.has(outputId)) {
      throw new Error(`Flat reference output ${outputId} is duplicated`);
    }
    seen.add(outputId);
    return outputId as MainWireIntegratedModelOutputIdV3;
  });
  return Object.freeze({ outputIds: Object.freeze(validated) });
}

export function createMainWireFlatReferencePresentationPageV1(
  capacity: number,
  outputPlan: MainWireFlatReferenceOutputPlanV1,
): MainWireFlatReferencePresentationPageV1 {
  const layout = presentationPageLayout(capacity, outputPlan.outputIds.length);
  return openMainWireFlatReferencePresentationPageV1(
    new ArrayBuffer(layout.byteLength),
    capacity,
    outputPlan,
  );
}

/** Rehydrates the views after a structured-clone ownership transfer. */
export function openMainWireFlatReferencePresentationPageV1(
  buffer: ArrayBuffer,
  capacity: number,
  outputPlan: MainWireFlatReferenceOutputPlanV1,
): MainWireFlatReferencePresentationPageV1 {
  const layout = presentationPageLayout(capacity, outputPlan.outputIds.length);
  if (buffer.byteLength !== layout.byteLength) {
    throw new Error("Flat reference page buffer length is invalid");
  }
  const outputValueCount = capacity * outputPlan.outputIds.length;
  return Object.freeze({
    pageId: MAIN_WIRE_FLAT_REFERENCE_PRESENTATION_PAGE_V1_ID,
    capacity,
    outputIds: outputPlan.outputIds,
    buffer,
    acceptedTicks: new Float64Array(buffer, layout.acceptedTicksOffset, capacity),
    acceptedRevisions: new Float64Array(
      buffer,
      layout.acceptedRevisionsOffset,
      capacity,
    ),
    outputStates: new Uint8Array(
      buffer,
      layout.outputStatesOffset,
      outputValueCount,
    ),
    outputValues: new Float64Array(
      buffer,
      layout.outputValuesOffset,
      outputValueCount,
    ),
  });
}

function presentationPageLayout(capacity: number, outputCount: number) {
  if (
    !Number.isSafeInteger(capacity)
    || capacity < 1
    || capacity > MAX_PAGE_CAPACITY
  ) {
    throw new Error("Flat reference page capacity is invalid");
  }
  if (!Number.isSafeInteger(outputCount) || outputCount < 0) {
    throw new Error("Flat reference page output count is invalid");
  }
  const outputValueCount = capacity * outputCount;
  const acceptedTicksOffset = 0;
  const acceptedRevisionsOffset = acceptedTicksOffset + capacity * 8;
  const outputStatesOffset = acceptedRevisionsOffset + capacity * 8;
  const outputValuesOffset = align8(outputStatesOffset + outputValueCount);
  return {
    acceptedTicksOffset,
    acceptedRevisionsOffset,
    outputStatesOffset,
    outputValuesOffset,
    byteLength: outputValuesOffset + outputValueCount * 8,
  };
}

function writeProjectedValues(
  destination: MainWireFlatReferencePresentationPageV1,
  pageIndex: number,
  values: Readonly<Record<string, MainWireIntegratedModelOutputValueV3>>,
): void {
  for (let outputIndex = 0; outputIndex < destination.outputIds.length; outputIndex += 1) {
    const outputId = destination.outputIds[outputIndex]!;
    const output = values[outputId];
    if (output === undefined) {
      throw new Error(`Flat reference output ${outputId} was not projected`);
    }
    const packedIndex = pageIndex * destination.outputIds.length + outputIndex;
    destination.outputStates[packedIndex] = outputStateCode(output);
    destination.outputValues[packedIndex] = output.value ?? Number.NaN;
  }
}

function assertDestinationMatchesPlan(
  destination: MainWireFlatReferencePresentationPageV1,
  outputPlan: MainWireFlatReferenceOutputPlanV1,
): void {
  const outputValueCount = destination.capacity * outputPlan.outputIds.length;
  const layout = presentationPageLayout(
    destination.capacity,
    outputPlan.outputIds.length,
  );
  if (destination.pageId !== MAIN_WIRE_FLAT_REFERENCE_PRESENTATION_PAGE_V1_ID) {
    throw new Error("Flat reference destination pageId is invalid");
  }
  if (
    !(destination.buffer instanceof ArrayBuffer)
    || destination.buffer.byteLength !== layout.byteLength
    || !canonicalTypedView(
      destination.acceptedTicks,
      Float64Array,
      destination.buffer,
      layout.acceptedTicksOffset,
      destination.capacity,
    )
    || !canonicalTypedView(
      destination.acceptedRevisions,
      Float64Array,
      destination.buffer,
      layout.acceptedRevisionsOffset,
      destination.capacity,
    )
    || !canonicalTypedView(
      destination.outputStates,
      Uint8Array,
      destination.buffer,
      layout.outputStatesOffset,
      outputValueCount,
    )
    || !canonicalTypedView(
      destination.outputValues,
      Float64Array,
      destination.buffer,
      layout.outputValuesOffset,
      outputValueCount,
    )
    || destination.outputIds.length !== outputPlan.outputIds.length
    || destination.outputIds.some(
      (outputId, index) => outputId !== outputPlan.outputIds[index],
    )
  ) {
    throw new Error("Flat reference destination page does not match output plan");
  }
}

function canonicalTypedView<
  T extends Float64Array | Uint8Array,
  C extends Float64ArrayConstructor | Uint8ArrayConstructor,
>(
  view: T,
  constructor: C,
  buffer: ArrayBuffer,
  byteOffset: number,
  length: number,
): boolean {
  return view instanceof constructor
    && view.buffer === buffer
    && view.byteOffset === byteOffset
    && view.length === length
    && view.byteLength === length * constructor.BYTES_PER_ELEMENT;
}

function assertTargetTick(targetTick: number, acceptedTick: number): void {
  if (!Number.isSafeInteger(targetTick) || targetTick <= acceptedTick) {
    throw new Error("Flat reference target tick must advance");
  }
}

function presentationTickForAcceptedTime(acceptedTimeSec: number): number {
  const tick = Math.round(
    acceptedTimeSec / MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3,
  );
  if (
    !Number.isSafeInteger(tick)
    || tick < 0
    || Math.abs(
      mainWireIntegratedModelPresentationTargetTimeSecV3(tick)
        - acceptedTimeSec,
    ) > 1e-12
  ) {
    throw new Error("Flat reference accepted time is not on an integer tick");
  }
  return tick;
}

function outputStateCode(output: MainWireIntegratedModelOutputValueV3): number {
  const availability = output.availability === "available" ? 0 : 3;
  const quality = output.quality === "authoritative-state"
    ? 0
    : output.quality === "accepted-derived"
    ? 1
    : 2;
  return availability + quality;
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8;
}
