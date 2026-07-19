import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1_ID =
  "main-wire-normal-adult-five-wall-circulatory-load-points-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "systemic-resistance-low",
    "systemic-resistance-high",
    "pulmonary-resistance-low",
    "pulmonary-resistance-high",
  ] as const);

export type MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1)[number];

export type MainWireNormalAdultFiveWallCirculatoryLoadAxisV1 =
  | "baseline"
  | "systemic-resistance"
  | "pulmonary-resistance";

export type MainWireNormalAdultFiveWallCirculatoryLoadLevelV1 =
  | "baseline"
  | "low"
  | "high";

export type MainWireNormalAdultFiveWallCirculatoryLoadPointV1 = Readonly<{
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
  axis: MainWireNormalAdultFiveWallCirculatoryLoadAxisV1;
  level: MainWireNormalAdultFiveWallCirculatoryLoadLevelV1;
  systemicResistanceScaleFromBaseline: number;
  pulmonaryResistanceScaleFromBaseline: number;
  design: Readonly<{
    lowScale: 0.75;
    highScale: 1.3333333333333333;
    lowAndHighAreReciprocal: true;
    oneFactorAtATime: true;
    parameterSearchOrFitting: false;
  }>;
}>;

const DESIGN = Object.freeze({
  lowScale: 0.75 as const,
  highScale: 1.3333333333333333 as const,
  lowAndHighAreReciprocal: true as const,
  oneFactorAtATime: true as const,
  parameterSearchOrFitting: false as const,
});

/**
 * A deliberately small, log-symmetric, one-factor-at-a-time research grid.
 * These five points are a structural load-response probe, not a parameter
 * search space and not a set of user controls.
 */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1 =
  Object.freeze([
    point("baseline", "baseline", "baseline", 1, 1),
    point("systemic-resistance-low", "systemic-resistance", "low", 0.75, 1),
    point(
      "systemic-resistance-high",
      "systemic-resistance",
      "high",
      1.3333333333333333,
      1,
    ),
    point("pulmonary-resistance-low", "pulmonary-resistance", "low", 1, 0.75),
    point(
      "pulmonary-resistance-high",
      "pulmonary-resistance",
      "high",
      1,
      1.3333333333333333,
    ),
  ] satisfies readonly MainWireNormalAdultFiveWallCirculatoryLoadPointV1[]);

export function resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
): MainWireNormalAdultFiveWallCirculatoryLoadPointV1 {
  const resolved = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1
    .find((candidate) => candidate.pointId === pointId);
  if (resolved === undefined) {
    throw new Error(`unsupported fixed circulatory load point: ${String(pointId)}`);
  }
  return resolved;
}

export function resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
): NonCoronaryCirculationRuntimeParamsV1 {
  const definition =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(pointId);
  const baseline = normalAdultMainWireRuntimeV1();
  return Object.freeze({
    vascular: baseline.vascular,
    losses: Object.freeze({
      systemicResistance: baseline.losses.systemicResistance
        * definition.systemicResistanceScaleFromBaseline,
      pulmonaryResistance: baseline.losses.pulmonaryResistance
        * definition.pulmonaryResistanceScaleFromBaseline,
    }),
    respiratory: baseline.respiratory,
    valvePreset: baseline.valvePreset,
  });
}

function point(
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  axis: MainWireNormalAdultFiveWallCirculatoryLoadAxisV1,
  level: MainWireNormalAdultFiveWallCirculatoryLoadLevelV1,
  systemicResistanceScaleFromBaseline: number,
  pulmonaryResistanceScaleFromBaseline: number,
): MainWireNormalAdultFiveWallCirculatoryLoadPointV1 {
  return Object.freeze({
    pointId,
    axis,
    level,
    systemicResistanceScaleFromBaseline,
    pulmonaryResistanceScaleFromBaseline,
    design: DESIGN,
  });
}
