import type { CoronaryMechanicsInputV1 } from "@/engine/coronary/intramyocardialPressureV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallVentricularCoronaryBoundaryTangentV1,
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
  /** Same-candidate wall kinematics for shortening-mechanism ablation only. */
  effectiveFiberLogStrainByWall: Readonly<{
    LVFW: number;
    SEP: number;
    RVFW: number;
  }>;
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
 * Typed bridge from a ready main-wire Land/TriSeg cold or trial evaluation to
 * the coronary IMP law. It intentionally reads Land active stress only. Passive
 * equilibrium and SLS overstress already contribute to chamber mechanics and
 * must not be counted a second time as an empirical vascular squeeze term.
 */
export function evaluateMainWireCoronaryMechanicsCouplingV1<TWallState>(
  mechanicsTrial: Pick<
    WholeHeartMechanicsTrialV1<TWallState>,
    "diagnostics" | "transmuralPressuresMmHg"
  >,
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
    effectiveFiberLogStrainByWall:
      readback.effectiveFiberLogStrainByWall,
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

/**
 * Applies one condensed ventricular-volume column to the same-candidate
 * coronary mechanics fields. The ventricular fibre-strain and active-stress
 * rows are an optional acceleration contract: absence returns `null` so the
 * transaction can fall back to whole-heart mechanics probes. The production
 * provider supplies the rows from the center trial's existing TriSeg Schur
 * solve.
 */
export function evaluateMainWireCoronaryMechanicsCouplingVentricularDirectionV1<
  TWallState,
>(
  mechanicsTrial: Pick<
    WholeHeartMechanicsTrialV1<TWallState>,
    | "diagnostics"
    | "transmuralPressuresMmHg"
    | "transmuralPressureVolumeTangentMmHgPerMl"
  >,
  input: Readonly<{
    ventricularVolume: "LV" | "RV";
    signedVolumeDeltaMl: number;
    commonIntrathoracicPressureMmHg: number;
    commonPericardialExcessPressureMmHg: number;
  }>,
): MainWireCoronaryMechanicsCouplingEvaluationV1 | null {
  assertFinite("signedVolumeDeltaMl", input.signedVolumeDeltaMl);
  const boundaryTangent = ventricularCoronaryBoundaryTangent(
    mechanicsTrial.diagnostics.readback,
  );
  if (boundaryTangent === null) return null;
  const base = evaluateMainWireCoronaryMechanicsCouplingV1(
    mechanicsTrial,
    input,
  );
  const pressureTangent =
    mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl;
  if (pressureTangent === undefined) {
    throw new Error(
      "ventricular coronary direction requires the condensed pressure tangent",
    );
  }
  const volumeColumn = input.ventricularVolume;
  const delta = input.signedVolumeDeltaMl;
  const chamberTransmuralPressureMmHg = Object.freeze({
    LV: finiteValue(
      "directed LV transmural pressure",
      base.input.chamberTransmuralPressureMmHg.LV
        + delta * pressureTangent.LV[volumeColumn],
    ),
    RV: finiteValue(
      "directed RV transmural pressure",
      base.input.chamberTransmuralPressureMmHg.RV
        + delta * pressureTangent.RV[volumeColumn],
    ),
  });
  const effectiveFiberLogStrainByWall = ventricularWallRecord(
    (wallId) => finiteValue(
      `directed ${wallId} effective fiber log strain`,
      base.effectiveFiberLogStrainByWall[wallId]
        + delta * boundaryTangent
          .effectiveFiberLogStrainPerMlByWall[wallId][volumeColumn],
    ),
  );
  const landActiveFiberStressPaByWall = ventricularWallRecord((wallId) => {
    const stress = finiteValue(
      `directed ${wallId} Land active stress`,
      base.input.landActiveFiberStressPaByWall[wallId]
        + delta * boundaryTangent
          .landActiveKirchhoffStressPaPerMlByWall[wallId][volumeColumn],
    );
    if (stress < 0) {
      throw new RangeError(
        `directed ${wallId} Land active stress must be non-negative`,
      );
    }
    return stress;
  });
  return Object.freeze({
    ...base,
    input: Object.freeze({
      ...base.input,
      chamberTransmuralPressureMmHg,
      landActiveFiberStressPaByWall,
    }),
    effectiveFiberLogStrainByWall,
  });
}

type MainWireMechanicsReadbackShapeV1 = Readonly<{
  providerModelId: string;
  effectiveFiberLogStrainByWall: Readonly<{
    LVFW: number;
    SEP: number;
    RVFW: number;
  }>;
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
    effectiveFiberLogStrainByWall: Object.freeze({
      LVFW: finiteValue(
        "LVFW effective fiber log strain",
        objectValue(
          record.effectiveFiberLogStrainByWall,
          "five-wall effective fiber log strain",
        ).LVFW,
      ),
      SEP: finiteValue(
        "SEP effective fiber log strain",
        objectValue(
          record.effectiveFiberLogStrainByWall,
          "five-wall effective fiber log strain",
        ).SEP,
      ),
      RVFW: finiteValue(
        "RVFW effective fiber log strain",
        objectValue(
          record.effectiveFiberLogStrainByWall,
          "five-wall effective fiber log strain",
        ).RVFW,
      ),
    }),
    wallMaterialReadbackByWall: Object.freeze({
      LVFW: serializableOrNull(wallMaterialReadbackByWall.LVFW),
      SEP: serializableOrNull(wallMaterialReadbackByWall.SEP),
      RVFW: serializableOrNull(wallMaterialReadbackByWall.RVFW),
    }),
  });
}

function ventricularCoronaryBoundaryTangent(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallVentricularCoronaryBoundaryTangentV1 | null {
  const record = objectValue(value, "five-wall mechanics readback");
  if (record.providerModelId !== MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID) {
    throw new Error("coronary coupling requires the main-wire Land/TriSeg readback");
  }
  if (record.ventricularCoronaryBoundaryTangent === undefined) {
    return null;
  }
  if (record.solveMode !== "trial") {
    throw new Error("ventricular coronary direction requires a trial readback");
  }
  const tangent = objectValue(
    record.ventricularCoronaryBoundaryTangent,
    "ventricular coronary boundary tangent",
  );
  const strain = objectValue(
    tangent.effectiveFiberLogStrainPerMlByWall,
    "ventricular fiber-strain tangent",
  );
  const active = objectValue(
    tangent.landActiveKirchhoffStressPaPerMlByWall,
    "ventricular active-stress tangent",
  );
  return Object.freeze({
    effectiveFiberLogStrainPerMlByWall: ventricularWallRecord((wallId) =>
      ventricularVolumeColumns(
        strain[wallId],
        `${wallId} fiber-strain tangent`,
      )),
    landActiveKirchhoffStressPaPerMlByWall: ventricularWallRecord((wallId) =>
      ventricularVolumeColumns(
        active[wallId],
        `${wallId} active-stress tangent`,
      )),
  });
}

function ventricularVolumeColumns(
  value: unknown,
  name: string,
): Readonly<{ LV: number; RV: number }> {
  const record = objectValue(value, name);
  return Object.freeze({
    LV: finiteValue(`${name}.LV`, record.LV),
    RV: finiteValue(`${name}.RV`, record.RV),
  });
}

function ventricularWallRecord<T>(
  build: (wallId: "LVFW" | "SEP" | "RVFW") => T,
): Readonly<Record<"LVFW" | "SEP" | "RVFW", T>> {
  return Object.freeze({
    LVFW: build("LVFW"),
    SEP: build("SEP"),
    RVFW: build("RVFW"),
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
