import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_OVERLAY_V1_ID =
  "main-wire-aortic-recovered-root-port-output-overlay-v1" as const;
export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_OVERLAY_V1_SCHEMA_VERSION =
  1 as const;

export type MainWireAorticRecoveredRootPortOutputUnitV1 = "mmHg";
export type MainWireAorticRecoveredRootPortOutputQuantityKindV1 = "pressure";

export type MainWireAorticRecoveredRootPortOutputDefinitionV1<
  TId extends string = string,
> = Readonly<{
  outputId: TId;
  kind: "signal";
  quantityKind: MainWireAorticRecoveredRootPortOutputQuantityKindV1;
  unit: MainWireAorticRecoveredRootPortOutputUnitV1;
  modelingStatus: "modeled";
  sourceKind: "accepted-step-readback";
  sourcePath: string;
  significantDigits: number;
}>;

const PROXIMAL_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port" as const;
const LOCAL_GRADIENT_OUTPUT_ID_V1 =
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV" as const;
const VENA_CONTRACTA_GRADIENT_OUTPUT_ID_V1 =
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV" as const;

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1 =
  Object.freeze([
    signalDefinitionV1(
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
      "acceptedSelectedAorticReadback.algebraicProximalConstitutivePortPressureMmHg",
    ),
    signalDefinitionV1(
      LOCAL_GRADIENT_OUTPUT_ID_V1,
      "acceptedSelectedAorticReadback.localValvePressureGradientMmHg",
    ),
    signalDefinitionV1(
      VENA_CONTRACTA_GRADIENT_OUTPUT_ID_V1,
      "acceptedSelectedAorticReadback.venaContractaBernoulliPressureMmHg",
    ),
  ] as const);

export type MainWireAorticRecoveredRootPortOutputIdV1 =
  (typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1)[number]["outputId"];

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.map(
      ({ outputId }) => outputId,
    ),
  ) as readonly MainWireAorticRecoveredRootPortOutputIdV1[];

export type MainWireAorticRecoveredRootPortOutputValueV1 = Readonly<{
  outputId: MainWireAorticRecoveredRootPortOutputIdV1;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "accepted-derived" | "not-assessed";
}>;

export type MainWireAorticRecoveredRootPortNumericalProjectionInputV1 =
  Readonly<{
    acceptedTimeSec: number;
    /** Borrowed selected-model readback; projection never retains the buffer. */
    acceptedNumericalReadbackV3: Float64Array | null;
  }>;

export class MainWireAorticRecoveredRootPortOutputProjectionErrorV1
  extends Error {
  constructor(message: string) {
    super(`Recovered-root aortic-port output projection rejected: ${message}`);
    this.name = "MainWireAorticRecoveredRootPortOutputProjectionErrorV1";
  }
}

/** Projects only instantaneous selected-model signals from an accepted step. */
export function projectMainWireAorticRecoveredRootPortSelectedValuesV1(
  input: MainWireAorticRecoveredRootPortNumericalProjectionInputV1,
  outputIds: readonly MainWireAorticRecoveredRootPortOutputIdV1[],
): Readonly<Record<string, MainWireAorticRecoveredRootPortOutputValueV1>> {
  validateProjectionInputV1(input);
  const values: Record<
    string,
    MainWireAorticRecoveredRootPortOutputValueV1
  > = {};
  const seen = new Set<string>();
  for (const outputId of outputIds) {
    if (!OUTPUT_ID_SET_V1.has(outputId)) {
      throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
        `selected output ${String(outputId)} is not registered`,
      );
    }
    if (seen.has(outputId)) {
      throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    values[outputId] = projectValueV1(input, outputId);
  }
  return Object.freeze(values);
}

const OUTPUT_ID_SET_V1 = new Set<string>(
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
);

function validateProjectionInputV1(
  input: MainWireAorticRecoveredRootPortNumericalProjectionInputV1,
): void {
  if (!Number.isFinite(input.acceptedTimeSec) || input.acceptedTimeSec < 0) {
    throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
      "accepted time must be finite and nonnegative",
    );
  }
  const readback = input.acceptedNumericalReadbackV3;
  if (readback === null) return;
  if (
    !(readback instanceof Float64Array)
    || readback.length
      !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3
  ) {
    throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
      "accepted selected numerical readback must contain exactly "
        + `${MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3} f64 values`,
    );
  }
  if (
    readback[MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec]
    !== input.acceptedTimeSec
  ) {
    throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
      "accepted selected numerical readback clock differs from the accepted clock",
    );
  }
}

function projectValueV1(
  input: MainWireAorticRecoveredRootPortNumericalProjectionInputV1,
  outputId: MainWireAorticRecoveredRootPortOutputIdV1,
): MainWireAorticRecoveredRootPortOutputValueV1 {
  const readback = input.acceptedNumericalReadbackV3;
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2;
  switch (outputId) {
    case PROXIMAL_PRESSURE_OUTPUT_ID_V1:
      return readbackValueV1(
        outputId,
        readback?.[layout.algebraicProximalConstitutivePortPressureMmHg],
      );
    case LOCAL_GRADIENT_OUTPUT_ID_V1:
      return readbackValueV1(
        outputId,
        readback?.[layout.localValvePressureGradientMmHg],
      );
    case VENA_CONTRACTA_GRADIENT_OUTPUT_ID_V1:
      return readbackValueV1(
        outputId,
        readback?.[layout.venaContractaBernoulliPressureMmHg],
      );
  }
}

function readbackValueV1(
  outputId: MainWireAorticRecoveredRootPortOutputIdV1,
  value: number | undefined,
): MainWireAorticRecoveredRootPortOutputValueV1 {
  if (value === undefined) {
    return Object.freeze({
      outputId,
      value: null,
      availability: "not-evaluated-at-accepted-state" as const,
      quality: "not-assessed" as const,
    });
  }
  if (!Number.isFinite(value)) {
    throw new MainWireAorticRecoveredRootPortOutputProjectionErrorV1(
      `${outputId} is available but is not finite`,
    );
  }
  return Object.freeze({
    outputId,
    value,
    availability: "available" as const,
    quality: "accepted-derived" as const,
  });
}

function signalDefinitionV1<TId extends string>(
  outputId: TId,
  sourcePath: string,
): MainWireAorticRecoveredRootPortOutputDefinitionV1<TId> {
  return Object.freeze({
    outputId,
    kind: "signal" as const,
    quantityKind: "pressure" as const,
    unit: "mmHg" as const,
    modelingStatus: "modeled" as const,
    sourceKind: "accepted-step-readback" as const,
    sourcePath,
    significantDigits: 3,
  });
}
