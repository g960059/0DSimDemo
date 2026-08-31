import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
  projectMainWireAorticRecoveredRootPortSelectedValuesV1,
  type MainWireAorticRecoveredRootPortOutputIdV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_SNAPSHOT_V1,
  assertMainWireIntegratedModelStandard66OutputCatalogV1,
  mergeMainWireIntegratedModelStandard66SelectedValuesV1,
  partitionMainWireIntegratedModelStandard66OutputIdsV1,
  projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1,
  type MainWireIntegratedModelStandard66NumericalProjectionInputV1,
  type MainWireIntegratedModelStandard66OutputIdV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1,
  type MainWireIntegratedModelNumericalProjectionInputV1,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

const EXPECTED_OVERLAY_OUTPUT_IDS_V1 = Object.freeze([
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
] as const);

const PROXIMAL_PRESSURE_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[0];
const LOCAL_GRADIENT_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[1];
const VENA_CONTRACTA_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[2];
const AORTIC_PRESSURE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1.indexOf(
    "Ao",
  );
if (AORTIC_PRESSURE_READBACK_INDEX_V1 < 0) {
  throw new Error("test readback order is missing Ao");
}

describe("Main Wire Standard66 output registry V1", () => {
  it("extends the exact V3 prefix with three instantaneous signals only", () => {
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1)
      .toHaveLength(3);
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1)
      .toEqual(EXPECTED_OVERLAY_OUTPUT_IDS_V1);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1)
      .toHaveLength(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.length + 3);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1)
      .toEqual([
        ...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
        ...EXPECTED_OVERLAY_OUTPUT_IDS_V1,
      ]);
    for (const [index, definition] of
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.entries()) {
      expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1[index])
        .toBe(definition);
    }
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.every(
      ({ kind, sourceKind }) =>
        kind === "signal" && sourceKind === "accepted-step-readback",
    )).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        historicalRegistryChanged: false,
        historicalCatalogIsExactPrefix: true,
        unavailableValuePolicy: "null-never-zero",
      });
  });

  it("contains no selected beat-derived placeholder outputs", () => {
    const overlayIds = new Set<string>(
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
    );
    for (const removed of [
      "hemodynamics.pressure.mean.aortic-proximal-constitutive-port",
      "hemodynamics.pressure.maximum.aortic-proximal-constitutive-port",
      "hemodynamics.pressure.minimum.aortic-proximal-constitutive-port",
      "hemodynamics.pressure.pulse.aortic-proximal-constitutive-port",
      "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
      "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
      "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
      "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
      "hemodynamics.duration.valve-forward-flow.AoV",
    ]) {
      expect(overlayIds.has(removed)).toBe(false);
    }
  });

  it("rejects collisions, duplicate definitions, and unresolved dependencies", () => {
    expect(() => assertMainWireIntegratedModelStandard66OutputCatalogV1(
      [{ outputId: "base" }],
      [{ outputId: "base" }],
    )).toThrow(/collision: base/);
    expect(() => assertMainWireIntegratedModelStandard66OutputCatalogV1(
      [{ outputId: "base" }],
      [{ outputId: "overlay" }, { outputId: "overlay" }],
    )).toThrow(/duplicates overlay/);
    expect(() => assertMainWireIntegratedModelStandard66OutputCatalogV1(
      [{ outputId: "base" }],
      [{ outputId: "overlay", dependencies: ["missing"] }],
    )).toThrow(/unknown dependency missing/);
  });

  it("projects cold and accepted-step availability without beat state", () => {
    const cold = projectOverlayV1(0, null);
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1) {
      expect(cold[outputId]).toEqual(unavailableV1(outputId));
    }

    const step = projectOverlayV1(0.1, selectedReadbackV1(0.1, 84, 3, 5));
    expect(step[PROXIMAL_PRESSURE_OUTPUT_ID_V1]).toMatchObject({
      value: 84,
      availability: "available",
      quality: "accepted-derived",
    });
    expect(step[LOCAL_GRADIENT_OUTPUT_ID_V1].value).toBe(3);
    expect(step[VENA_CONTRACTA_OUTPUT_ID_V1].value).toBe(5);
  });

  it("partitions owners and merges in caller request order", () => {
    const requested = [
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
      "hemodynamics.pressure.absolute.Ao",
      LOCAL_GRADIENT_OUTPUT_ID_V1,
    ] as const;
    const input = standard66ProjectionInputV1(1);
    const values =
      projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
        input,
        requested,
      );
    expect(Object.keys(values)).toEqual(requested);
    expect(values[PROXIMAL_PRESSURE_OUTPUT_ID_V1].value).toBe(100);
    expect(values["hemodynamics.pressure.absolute.Ao"].value).toBe(82);
    expect(values[LOCAL_GRADIENT_OUTPUT_ID_V1].value).toBe(30);

    expect(partitionMainWireIntegratedModelStandard66OutputIdsV1(requested))
      .toEqual({
        baseOutputIds: ["hemodynamics.pressure.absolute.Ao"],
        selectedAorticPortOutputIds: [
          PROXIMAL_PRESSURE_OUTPUT_ID_V1,
          LOCAL_GRADIENT_OUTPUT_ID_V1,
        ],
      });
    expect(() => partitionMainWireIntegratedModelStandard66OutputIdsV1([
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
    ])).toThrow(/duplicated/);
    expect(() => partitionMainWireIntegratedModelStandard66OutputIdsV1([
      "unregistered.output" as MainWireIntegratedModelStandard66OutputIdV1,
    ])).toThrow(/not registered/);

    const baseOnly =
      projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
        input.base,
        ["hemodynamics.pressure.absolute.Ao"],
      );
    const overlayOnly = projectOverlayV1(
      1,
      input.selectedAorticPort.acceptedNumericalReadbackV3,
      [PROXIMAL_PRESSURE_OUTPUT_ID_V1],
    );
    expect(mergeMainWireIntegratedModelStandard66SelectedValuesV1({
      outputIds: [
        PROXIMAL_PRESSURE_OUTPUT_ID_V1,
        "hemodynamics.pressure.absolute.Ao",
      ],
      baseValues: baseOnly,
      selectedAorticPortValues: overlayOnly,
    })).toEqual({
      [PROXIMAL_PRESSURE_OUTPUT_ID_V1]:
        overlayOnly[PROXIMAL_PRESSURE_OUTPUT_ID_V1],
      "hemodynamics.pressure.absolute.Ao":
        baseOnly["hemodynamics.pressure.absolute.Ao"],
    });
  });

  it("keeps the 73-f64 base and 76-f64 selected owners disjoint", () => {
    const valid = standard66ProjectionInputV1(1);
    const requested = [
      "hemodynamics.pressure.absolute.Ao",
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
    ] as const;
    expect(() =>
      projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
        {
          ...valid,
          base: {
            ...valid.base,
            acceptedNumericalReadback:
              valid.selectedAorticPort.acceptedNumericalReadbackV3!,
          },
        },
        requested,
      )
    ).toThrow(/exactly 73 f64 values/);
    expect(() =>
      projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
        {
          ...valid,
          selectedAorticPort: {
            ...valid.selectedAorticPort,
            acceptedNumericalReadbackV3: valid.base.acceptedNumericalReadback,
          },
        },
        requested,
      )
    ).toThrow(/exactly 76 f64 values/);
  });
});

function projectOverlayV1(
  acceptedTimeSec: number,
  acceptedNumericalReadbackV3: Float64Array | null,
  outputIds: readonly MainWireAorticRecoveredRootPortOutputIdV1[] =
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
) {
  return projectMainWireAorticRecoveredRootPortSelectedValuesV1(
    Object.freeze({ acceptedTimeSec, acceptedNumericalReadbackV3 }),
    outputIds,
  );
}

function standard66ProjectionInputV1(
  acceptedTimeSec: number,
): MainWireIntegratedModelStandard66NumericalProjectionInputV1 {
  const base = historicalReadbackV1(acceptedTimeSec, 82);
  const selected = selectedReadbackV1(acceptedTimeSec, 100, 30, 25);
  selected.set(base);
  const baseInput: MainWireIntegratedModelNumericalProjectionInputV1 =
    Object.freeze({
      acceptedTimeSec,
      regularSinusCycleLengthSec: 1,
      regularSinusNextActivationTimeSec: acceptedTimeSec + 1,
      dynamicMechanicalSupportLvadFlowMlPerSec: 0,
      runtimeSignals: Object.freeze({
        pleuralPressureMmHg: 0,
        alveolarPressureMmHg: 0,
      }),
      completedBeatMetrics: null,
      mechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
      acceptedNumericalReadback: base,
    });
  return Object.freeze({
    base: baseInput,
    selectedAorticPort: Object.freeze({
      acceptedTimeSec,
      acceptedNumericalReadbackV3: selected,
    }),
  });
}

function historicalReadbackV1(
  timeSec: number,
  aorticPressureMmHg: number,
): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  readback[layout.timeSec] = timeSec;
  readback[layout.absolutePressureMmHg + AORTIC_PRESSURE_READBACK_INDEX_V1] =
    aorticPressureMmHg;
  return readback;
}

function selectedReadbackV1(
  timeSec: number,
  proximalPressureMmHg: number,
  localGradientMmHg: number,
  venaContractaGradientMmHg: number,
): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  const historicalLayout =
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  const selectedLayout =
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2;
  readback[historicalLayout.timeSec] = timeSec;
  readback[selectedLayout.algebraicProximalConstitutivePortPressureMmHg] =
    proximalPressureMmHg;
  readback[selectedLayout.localValvePressureGradientMmHg] =
    localGradientMmHg;
  readback[selectedLayout.venaContractaBernoulliPressureMmHg] =
    venaContractaGradientMmHg;
  return readback;
}

function unavailableV1(outputId: string) {
  return {
    outputId,
    value: null,
    availability: "not-evaluated-at-accepted-state",
    quality: "not-assessed",
  };
}
