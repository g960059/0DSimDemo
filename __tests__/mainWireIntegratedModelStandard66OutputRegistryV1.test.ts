import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
  projectMainWireAorticRecoveredRootPortSelectedValuesV1,
  type MainWireAorticRecoveredRootPortNumericalProjectionInputV1,
  type MainWireAorticRecoveredRootPortOutputIdV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MainWireAorticRecoveredRootPortBeatAccumulatorV1,
  type MainWireAorticRecoveredRootPortCompletedBeatMetricsV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortBeatMetricsV1";
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
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

const EXPECTED_OVERLAY_OUTPUT_IDS_V1 = Object.freeze([
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
  "hemodynamics.pressure.mean.aortic-proximal-constitutive-port",
  "hemodynamics.pressure.maximum.aortic-proximal-constitutive-port",
  "hemodynamics.pressure.minimum.aortic-proximal-constitutive-port",
  "hemodynamics.pressure.pulse.aortic-proximal-constitutive-port",
  "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.duration.valve-forward-flow.AoV",
] as const);

const PROXIMAL_PRESSURE_OUTPUT_ID_V1 =
  EXPECTED_OVERLAY_OUTPUT_IDS_V1[0];
const LOCAL_GRADIENT_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[1];
const VENA_CONTRACTA_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[2];
const LOCAL_MEAN_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[7];
const LOCAL_PEAK_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[8];
const VENA_CONTRACTA_MEAN_OUTPUT_ID_V1 =
  EXPECTED_OVERLAY_OUTPUT_IDS_V1[9];
const VENA_CONTRACTA_PEAK_OUTPUT_ID_V1 =
  EXPECTED_OVERLAY_OUTPUT_IDS_V1[10];
const FORWARD_DURATION_OUTPUT_ID_V1 = EXPECTED_OVERLAY_OUTPUT_IDS_V1[11];

const AORTIC_VALVE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.indexOf("AoV");
const AORTIC_PRESSURE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1.indexOf(
    "Ao",
  );
if (AORTIC_VALVE_READBACK_INDEX_V1 < 0 || AORTIC_PRESSURE_READBACK_INDEX_V1 < 0) {
  throw new Error("test readback orders are missing AoV or Ao");
}

describe("Main Wire Standard66 output registry V1", () => {
  it("composes an immutable 173+12 catalog without changing the exact V3 prefix", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3).toHaveLength(173);
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3).toHaveLength(173);
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1)
      .toHaveLength(12);
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1)
      .toEqual(EXPECTED_OVERLAY_OUTPUT_IDS_V1);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1)
      .toHaveLength(185);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1)
      .toEqual([
        ...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
        ...EXPECTED_OVERLAY_OUTPUT_IDS_V1,
      ]);
    for (let index = 0; index < 173; index += 1) {
      expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1[index])
        .toBe(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3[index]);
    }
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1.filter(
        ({ kind }) => kind === "signal",
      ),
    ).toHaveLength(80);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1.filter(
        ({ kind }) => kind === "metric",
      ),
    ).toHaveLength(105);
    expect(
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1.find(
        ({ outputId }) => outputId === FORWARD_DURATION_OUTPUT_ID_V1,
      ),
    ).toMatchObject({
      quantityKind: "duration",
      unit: "s",
      kind: "metric",
      scope: "beat",
      dependencies: ["hemodynamics.flow.valve.AoV"],
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.some(
        ({ quantityKind, unit }) =>
          (quantityKind as string) === "duration" || (unit as string) === "s",
      ),
    ).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        historicalRegistryChanged: false,
        historicalCatalogIsExactPrefix: true,
        unavailableValuePolicy: "null-never-zero",
      });
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

  it("projects cold, accepted-step, completed-beat, zero-forward, and restored availability", () => {
    const cold = projectOverlayV1(0, null, null);
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1) {
      expect(cold[outputId]).toEqual(unavailableV1(outputId));
    }

    const stepReadback = selectedReadbackV1(0.1, 8, 84, 3, 5);
    const step = projectOverlayV1(0.1, stepReadback, null);
    expect(step[PROXIMAL_PRESSURE_OUTPUT_ID_V1]).toMatchObject({
      value: 84,
      availability: "available",
      quality: "accepted-derived",
    });
    expect(step[LOCAL_GRADIENT_OUTPUT_ID_V1].value).toBe(3);
    expect(step[VENA_CONTRACTA_OUTPUT_ID_V1].value).toBe(5);
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1.slice(3)) {
      expect(step[outputId]).toEqual(unavailableV1(outputId));
    }

    const completedMetrics = completedMetricsV1(10);
    const completed = projectOverlayV1(
      1,
      selectedReadbackV1(1, 10, 100, 30, 25),
      completedMetrics,
    );
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1) {
      expect(completed[outputId]).toMatchObject({
        availability: "available",
        quality: "accepted-derived",
      });
    }
    expect(completed[LOCAL_MEAN_OUTPUT_ID_V1].value).toBe(25);
    expect(completed[LOCAL_PEAK_OUTPUT_ID_V1].value).toBe(30);
    expect(completed[VENA_CONTRACTA_MEAN_OUTPUT_ID_V1].value).toBe(20.5);
    expect(completed[VENA_CONTRACTA_PEAK_OUTPUT_ID_V1].value).toBe(25);
    expect(completed[FORWARD_DURATION_OUTPUT_ID_V1]).toMatchObject({
      value: 1,
      availability: "available",
    });

    const zeroForward = projectOverlayV1(
      1,
      selectedReadbackV1(1, 0, 100, 0, 0),
      completedMetricsV1(0),
    );
    for (const outputId of [
      LOCAL_MEAN_OUTPUT_ID_V1,
      LOCAL_PEAK_OUTPUT_ID_V1,
      VENA_CONTRACTA_MEAN_OUTPUT_ID_V1,
      VENA_CONTRACTA_PEAK_OUTPUT_ID_V1,
    ]) {
      expect(zeroForward[outputId]).toEqual(unavailableV1(outputId));
    }
    expect(zeroForward[FORWARD_DURATION_OUTPUT_ID_V1]).toMatchObject({
      value: 0,
      availability: "available",
      quality: "accepted-derived",
    });
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1.slice(3, 7)) {
      expect(zeroForward[outputId].availability).toBe("available");
    }

    const restored = projectOverlayV1(1, null, completedMetrics);
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1.slice(0, 3)) {
      expect(restored[outputId]).toEqual(unavailableV1(outputId));
    }
    for (const outputId of EXPECTED_OVERLAY_OUTPUT_IDS_V1.slice(3)) {
      expect(restored[outputId].availability).toBe("available");
    }
  });

  it("partitions owners, rejects duplicate requests, and merges in request order", () => {
    const requested = [
      PROXIMAL_PRESSURE_OUTPUT_ID_V1,
      "hemodynamics.pressure.absolute.Ao",
      FORWARD_DURATION_OUTPUT_ID_V1,
    ] as const;
    const input = standard66ProjectionInputV1(1, completedMetricsV1(10));
    const values =
      projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
        input,
        requested,
      );
    expect(Object.keys(values)).toEqual(requested);
    expect(values[PROXIMAL_PRESSURE_OUTPUT_ID_V1].value).toBe(100);
    expect(values["hemodynamics.pressure.absolute.Ao"].value).toBe(82);
    expect(values[FORWARD_DURATION_OUTPUT_ID_V1].value).toBe(1);

    expect(partitionMainWireIntegratedModelStandard66OutputIdsV1(requested))
      .toEqual({
        baseOutputIds: ["hemodynamics.pressure.absolute.Ao"],
        selectedAorticPortOutputIds: [
          PROXIMAL_PRESSURE_OUTPUT_ID_V1,
          FORWARD_DURATION_OUTPUT_ID_V1,
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
      input.selectedAorticPort.completedBeatMetrics,
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
      [PROXIMAL_PRESSURE_OUTPUT_ID_V1]: overlayOnly[
        PROXIMAL_PRESSURE_OUTPUT_ID_V1
      ],
      "hemodynamics.pressure.absolute.Ao": baseOnly[
        "hemodynamics.pressure.absolute.Ao"
      ],
    });
  });

  it("keeps the 73-f64 V3 and 76-f64 overlay readback owners disjoint", () => {
    const valid = standard66ProjectionInputV1(1, completedMetricsV1(10));
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
  completedBeatMetrics:
    | MainWireAorticRecoveredRootPortCompletedBeatMetricsV1
    | null,
  outputIds: readonly MainWireAorticRecoveredRootPortOutputIdV1[] =
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
) {
  return projectMainWireAorticRecoveredRootPortSelectedValuesV1(
    Object.freeze({
      acceptedTimeSec,
      acceptedNumericalReadbackV3,
      completedBeatMetrics,
    }),
    outputIds,
  );
}

function standard66ProjectionInputV1(
  acceptedTimeSec: number,
  completedBeatMetrics: MainWireAorticRecoveredRootPortCompletedBeatMetricsV1,
): MainWireIntegratedModelStandard66NumericalProjectionInputV1 {
  const base = historicalReadbackV1(acceptedTimeSec, 82);
  const selected = selectedReadbackV1(
    acceptedTimeSec,
    10,
    100,
    30,
    25,
  );
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
  const selectedInput: MainWireAorticRecoveredRootPortNumericalProjectionInputV1 =
    Object.freeze({
      acceptedTimeSec,
      acceptedNumericalReadbackV3: selected,
      completedBeatMetrics,
    });
  return Object.freeze({ base: baseInput, selectedAorticPort: selectedInput });
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
  aorticValveFlowMlPerSec: number,
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
  readback[
    historicalLayout.valveFlowMlPerSec + AORTIC_VALVE_READBACK_INDEX_V1
  ] = aorticValveFlowMlPerSec;
  readback[selectedLayout.algebraicProximalConstitutivePortPressureMmHg] =
    proximalPressureMmHg;
  readback[selectedLayout.localValvePressureGradientMmHg] =
    localGradientMmHg;
  readback[selectedLayout.venaContractaBernoulliPressureMmHg] =
    venaContractaGradientMmHg;
  return readback;
}

function completedMetricsV1(
  aorticValveFlowMlPerSec: number,
): MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 {
  const accumulator = new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
  accumulator.acceptNumericalReadbackV3(
    selectedReadbackV1(
      0,
      aorticValveFlowMlPerSec,
      80,
      20,
      16,
    ),
    "capture/start",
  );
  const completed = accumulator.acceptNumericalReadbackV3(
    selectedReadbackV1(
      1,
      aorticValveFlowMlPerSec,
      100,
      30,
      25,
    ),
    "capture/end",
  );
  if (completed === null) throw new Error("test beat did not complete");
  return completed;
}

function unavailableV1(outputId: string) {
  return {
    outputId,
    value: null,
    availability: "not-evaluated-at-accepted-state",
    quality: "not-assessed",
  };
}
