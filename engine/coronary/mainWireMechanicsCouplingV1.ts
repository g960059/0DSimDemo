import type { CoronaryMechanicsInputV1 } from "@/engine/coronary/intramyocardialPressureV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  WholeHeartMechanicsSerializableValueV1,
  WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_CORONARY_MECHANICS_COUPLING_V1_ID =
  "main-wire-coronary-land-triseg-coupling-v1" as const;

export type MainWireCoronaryMechanicsCouplingEvaluationV1 = Readonly<{
  couplingId: typeof MAIN_WIRE_CORONARY_MECHANICS_COUPLING_V1_ID;
  input: CoronaryMechanicsInputV1;
  commonIntrathoracicPressureMmHg: number;
  commonPericardialExcessPressureMmHg: number;
  source: Readonly<{
    chamberPressure: "same-candidate-five-wall-transmural-pressure";
    activeStress: "same-candidate-land-active-kirchhoff-stress-only";
    passiveAndSlsStressIncludedInActiveStressTerm: false;
    epicardialExternalPressure:
      "common-intrathoracic-plus-common-pericardial-excess";
  }>;
}>;

/**
 * Typed bridge from the accepted main-wire Land/TriSeg mechanics trial to the
 * coronary IMP law. It intentionally reads Land active stress only. Passive
 * equilibrium and SLS overstress already contribute to chamber mechanics and
 * must not be counted a second time as an empirical vascular squeeze term.
 */
export function evaluateMainWireCoronaryMechanicsCouplingV1<TWallState>(
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>,
  input: Readonly<{
    commonIntrathoracicPressureMmHg: number;
    commonPericardialExcessPressureMmHg: number;
  }>,
): MainWireCoronaryMechanicsCouplingEvaluationV1 {
  assertFinite(
    "commonIntrathoracicPressureMmHg",
    input.commonIntrathoracicPressureMmHg,
  );
  assertFinite(
    "commonPericardialExcessPressureMmHg",
    input.commonPericardialExcessPressureMmHg,
  );
  const readback = mechanicsReadback(mechanicsTrial.diagnostics.readback);
  const landActiveFiberStressPaByWall = Object.freeze({
    LVFW: landActiveStressPa(readback.wallMaterialReadbackByWall.LVFW, "LVFW"),
    SEP: landActiveStressPa(readback.wallMaterialReadbackByWall.SEP, "SEP"),
    RVFW: landActiveStressPa(readback.wallMaterialReadbackByWall.RVFW, "RVFW"),
  });
  const coronaryInput: CoronaryMechanicsInputV1 = Object.freeze({
    externalPressureMmHg:
      input.commonIntrathoracicPressureMmHg
      + input.commonPericardialExcessPressureMmHg,
    chamberTransmuralPressureMmHg: Object.freeze({
      LV: finiteValue(
        "mechanicsTrial.transmuralPressuresMmHg.LV",
        mechanicsTrial.transmuralPressuresMmHg.LV,
      ),
      RV: finiteValue(
        "mechanicsTrial.transmuralPressuresMmHg.RV",
        mechanicsTrial.transmuralPressuresMmHg.RV,
      ),
    }),
    landActiveFiberStressPaByWall,
  });
  return Object.freeze({
    couplingId: MAIN_WIRE_CORONARY_MECHANICS_COUPLING_V1_ID,
    input: coronaryInput,
    commonIntrathoracicPressureMmHg:
      input.commonIntrathoracicPressureMmHg,
    commonPericardialExcessPressureMmHg:
      input.commonPericardialExcessPressureMmHg,
    source: Object.freeze({
      chamberPressure:
        "same-candidate-five-wall-transmural-pressure" as const,
      activeStress:
        "same-candidate-land-active-kirchhoff-stress-only" as const,
      passiveAndSlsStressIncludedInActiveStressTerm: false as const,
      epicardialExternalPressure:
        "common-intrathoracic-plus-common-pericardial-excess" as const,
    }),
  });
}

type MainWireMechanicsReadbackShapeV1 = Readonly<{
  providerModelId: string;
  wallMaterialReadbackByWall: Readonly<{
    LVFW: WholeHeartMechanicsSerializableValueV1 | null;
    SEP: WholeHeartMechanicsSerializableValueV1 | null;
    RVFW: WholeHeartMechanicsSerializableValueV1 | null;
  }>;
}>;

function mechanicsReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireMechanicsReadbackShapeV1 {
  const record = objectValue(value, "five-wall mechanics readback");
  if (record.providerModelId !== MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID) {
    throw new Error("coronary coupling requires the main-wire Land/TriSeg readback");
  }
  const wallMaterialReadbackByWall = objectValue(
    record.wallMaterialReadbackByWall,
    "five-wall material readback",
  );
  return Object.freeze({
    providerModelId: record.providerModelId,
    wallMaterialReadbackByWall: Object.freeze({
      LVFW: serializableOrNull(wallMaterialReadbackByWall.LVFW),
      SEP: serializableOrNull(wallMaterialReadbackByWall.SEP),
      RVFW: serializableOrNull(wallMaterialReadbackByWall.RVFW),
    }),
  });
}

function landActiveStressPa(
  value: WholeHeartMechanicsSerializableValueV1 | null,
  wallId: "LVFW" | "SEP" | "RVFW",
): number {
  const record = objectValue(value, `${wallId} material readback`);
  if (record.adapterId !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID) {
    throw new Error(`${wallId} coronary coupling requires normal-adult Land material readback`);
  }
  const stress = finiteValue(
    `${wallId}.landActiveKirchhoffStressPa`,
    record.landActiveKirchhoffStressPa,
  );
  if (stress < 0) {
    throw new RangeError(`${wallId} Land active stress must be non-negative`);
  }
  return stress;
}

function objectValue(
  value: unknown,
  name: string,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function serializableOrNull(
  value: unknown,
): WholeHeartMechanicsSerializableValueV1 | null {
  return (value ?? null) as WholeHeartMechanicsSerializableValueV1 | null;
}

function finiteValue(name: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
  return value;
}

function assertFinite(name: string, value: number): void {
  finiteValue(name, value);
}
