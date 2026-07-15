import {
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";

export const WHOLE_HEART_ENERGY_LEDGER_V1_ID =
  "four-chamber-whole-heart-energy-ledger-v1" as const;

export const VASCULAR_ENERGY_COMPARTMENT_IDS_V1 = Object.freeze([
  "SA",
  "SV",
  "PA",
  "PV",
] as const);
export type VascularEnergyCompartmentIdV1 =
  (typeof VASCULAR_ENERGY_COMPARTMENT_IDS_V1)[number];

export const PERIPHERAL_DISSIPATION_EDGE_IDS_V1 = Object.freeze([
  "systemic",
  "pulmonary",
] as const);
export type PeripheralDissipationEdgeIdV1 =
  (typeof PERIPHERAL_DISSIPATION_EDGE_IDS_V1)[number];

export const PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1 =
  "negative-sum-of-prescribed-environment-pressure-times-blood-volume-rate" as const;

export const PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1 =
  "ventricular-wall-power-minus-lv-rv-transmural-hydraulic-power" as const;

/**
 * The published Taylor assembly is the Phase-B release reference, but its
 * independent strain and tension approximations are not exactly work
 * conjugate. Subtracting the measured residual keeps that approximation
 * visible; it is not evidence that the assembly is work conjugate.
 */
export const PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1 = Object.freeze({
  assembly: "published-Taylor-2009" as const,
  rawResidualRetained: true as const,
  subtractedFromEnergyResidual: true as const,
  diagnosticOnly: true as const,
  workConjugacyProven: false as const,
});

type NumericRecord<Id extends string> = Readonly<Record<Id, number>>;

/** An index signature makes non-empty object literals a type error. */
export type EmptySlsWallRecordV1 = Readonly<Record<string, never>>;

export type WholeHeartSlsStoredEnergyInputV1 =
  | Readonly<{
    mode: "on";
    slsByWallJ: NumericRecord<FourChamberWallId>;
  }>
  | Readonly<{
    mode: "off";
    slsByWallJ: EmptySlsWallRecordV1;
  }>;

export type WholeHeartSlsDissipationInputV1 =
  | Readonly<{
    mode: "on";
    slsByWallW: NumericRecord<FourChamberWallId>;
  }>
  | Readonly<{
    mode: "off";
    slsByWallW: EmptySlsWallRecordV1;
  }>;

export type PrescribedExternalEnvironmentPowerExcludingPericardiumV1 = Readonly<{
  powerW: number;
  convention: typeof PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1;
  pericardialPressureWorkIncluded: false;
}>;

export type RawPublishedTaylorGeometryPowerResidualV1 = Readonly<{
  powerResidualW: number;
  assembly: "published-Taylor-2009";
  definition: typeof PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1;
  workConjugacyProven: false;
}>;

export type PublishedTaylorTriSegStagePowerAuditV1 = Readonly<{
  auditId: "published-taylor-triseg-stage-power-audit-v1";
  wallMechanicalPowerByWallW: NumericRecord<TriSegWallId>;
  hydraulicPowerW: Readonly<{ LV: number; RV: number }>;
  rawGeometryPowerResidualW: number;
  normalization: Readonly<{
    powerFloorW: number;
    numeratorW: number;
    denominatorW: number;
    rhoStage: number;
  }>;
  assembly: "published-Taylor-2009";
  workConjugacyClaimed: false;
  units: Readonly<{ everyPowerTerm: "W"; rhoStage: "1" }>;
}>;

export type WholeHeartEndpointStoredEnergyInputV1 = Readonly<{
  vascularByCompartmentJ: NumericRecord<VascularEnergyCompartmentIdV1>;
  pericardialJ: number;
  equilibriumPassiveByWallJ: NumericRecord<FourChamberWallId>;
  sls: WholeHeartSlsStoredEnergyInputV1;
  inertialByEdgeJ: NumericRecord<InertialFlowId>;
}>;

export type WholeHeartEndpointStoredEnergyBreakdownV1 = Readonly<{
  ledgerId: typeof WHOLE_HEART_ENERGY_LEDGER_V1_ID;
  vascularByCompartmentJ: NumericRecord<VascularEnergyCompartmentIdV1>;
  pericardialJ: number;
  equilibriumPassiveByWallJ: NumericRecord<FourChamberWallId>;
  sls: WholeHeartSlsStoredEnergyInputV1;
  inertialByEdgeJ: NumericRecord<InertialFlowId>;
  totals: Readonly<{
    vascularJ: number;
    pericardialJ: number;
    equilibriumPassiveJ: number;
    slsJ: number;
    inertialJ: number;
    storedEnergyJ: number;
  }>;
  units: Readonly<{
    everyStoredEnergyTerm: "J";
  }>;
}>;

export type WholeHeartStagePowerInputV1 = Readonly<{
  storedEnergyRateW: number;
  peripheralDissipationW: NumericRecord<PeripheralDissipationEdgeIdV1>;
  signedEdgeDissipationByEdgeW: NumericRecord<InertialFlowId>;
  sls: WholeHeartSlsDissipationInputV1;
  activeMechanicalOutputPowerByWallW: NumericRecord<FourChamberWallId>;
  prescribedExternalEnvironmentPowerExcludingPericardium:
    PrescribedExternalEnvironmentPowerExcludingPericardiumV1;
  rawPublishedTaylorGeometryPowerResidual:
    RawPublishedTaylorGeometryPowerResidualV1;
}>;

export type WholeHeartStagePowerBreakdownV1 = Readonly<{
  ledgerId: typeof WHOLE_HEART_ENERGY_LEDGER_V1_ID;
  storedEnergyRateW: number;
  peripheralDissipationW: NumericRecord<PeripheralDissipationEdgeIdV1>;
  signedEdgeDissipationByEdgeW: NumericRecord<InertialFlowId>;
  sls: WholeHeartSlsDissipationInputV1;
  activeMechanicalOutputPowerByWallW: NumericRecord<FourChamberWallId>;
  prescribedExternalEnvironmentPowerExcludingPericardium:
    PrescribedExternalEnvironmentPowerExcludingPericardiumV1;
  rawPublishedTaylorGeometryPowerResidual:
    RawPublishedTaylorGeometryPowerResidualV1;
  totals: Readonly<{
    peripheralDissipationW: number;
    signedEdgeDissipationW: number;
    flowDissipationW: number;
    slsDissipationW: number;
    totalDissipationW: number;
    activeMechanicalOutputPowerW: number;
    prescribedExternalEnvironmentPowerW: number;
    rawPublishedTaylorGeometryPowerResidualW: number;
  }>;
  continuousEnergyResidualW: number;
  normalization: Readonly<{
    powerFloorW: number;
    numeratorW: number;
    denominatorW: number;
    rho: number;
  }>;
  publishedTaylorGeometryPowerTreatment:
    typeof PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1;
  units: Readonly<{
    everyPowerOrDissipationTerm: "W";
    rho: "1";
  }>;
}>;

export type WholeHeartBackwardEulerStepEnergyAuditInputV1 = Readonly<{
  previousEndpoint: WholeHeartEndpointStoredEnergyBreakdownV1;
  nextEndpoint: WholeHeartEndpointStoredEnergyBreakdownV1;
  endpointStage: WholeHeartStagePowerBreakdownV1;
  dtSec: number;
}>;

export type WholeHeartBackwardEulerStepEnergyAuditV1 = Readonly<{
  ledgerId: typeof WHOLE_HEART_ENERGY_LEDGER_V1_ID;
  scheme: "backward-Euler-endpoint-stage";
  slsMode: "on" | "off";
  dtSec: number;
  previousStoredEnergyJ: number;
  nextStoredEnergyJ: number;
  deltaStoredEnergyJ: number;
  increments: Readonly<{
    flowDissipationJ: number;
    slsDissipationJ: number;
    activeMechanicalOutputJ: number;
    prescribedExternalEnvironmentJ: number;
    rawPublishedTaylorGeometryPowerResidualJ: number;
  }>;
  signedBalanceResidualJ: number;
  normalization: Readonly<{
    powerFloorTimesStepJ: number;
    numeratorJ: number;
    denominatorJ: number;
    rho: number;
  }>;
  publishedTaylorGeometryPowerTreatment:
    typeof PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1;
  workConjugacyClaimed: false;
  units: Readonly<{
    everyEnergyOrIncrementTerm: "J";
    dt: "s";
    rho: "1";
  }>;
}>;

const ENDPOINT_BREAKDOWN_REGISTRY = new WeakSet<object>();
const STAGE_BREAKDOWN_REGISTRY = new WeakSet<object>();

export function evaluatePublishedTaylorTriSegStagePowerAuditV1(input: Readonly<{
  wallMechanicalPowerByWallW: NumericRecord<TriSegWallId>;
  hydraulicPowerW: Readonly<{ LV: number; RV: number }>;
}>): PublishedTaylorTriSegStagePowerAuditV1 {
  assertExactPlainRecordV1(
    input,
    ["wallMechanicalPowerByWallW", "hydraulicPowerW"],
    "publishedTaylorTriSegStagePowerAuditInput",
  );
  const wallIds = ["LVFW", "SEP", "RVFW"] as const;
  const wallMechanicalPowerByWallW = copyFiniteRecord(
    input.wallMechanicalPowerByWallW,
    wallIds,
    "wallMechanicalPowerByWallW",
  );
  const hydraulicPowerW = copyFiniteRecord(
    input.hydraulicPowerW,
    ["LV", "RV"] as const,
    "hydraulicPowerW",
  );
  const rawGeometryPowerResidualW = requireDerivedFinite(
    sumRecord(wallMechanicalPowerByWallW, wallIds)
      - hydraulicPowerW.LV
      - hydraulicPowerW.RV,
    "rawGeometryPowerResidualW",
  );
  const numeratorW = Math.abs(rawGeometryPowerResidualW);
  const denominatorW = requirePositiveDerived(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
      + wallIds.reduce(
        (sum, wallId) => sum + Math.abs(wallMechanicalPowerByWallW[wallId]),
        0,
      )
      + Math.abs(hydraulicPowerW.LV)
      + Math.abs(hydraulicPowerW.RV),
    "publishedTaylorTriSegStagePowerAudit.normalization.denominatorW",
  );
  return Object.freeze({
    auditId: "published-taylor-triseg-stage-power-audit-v1",
    wallMechanicalPowerByWallW,
    hydraulicPowerW,
    rawGeometryPowerResidualW,
    normalization: Object.freeze({
      powerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
      numeratorW,
      denominatorW,
      rhoStage: numeratorW / denominatorW,
    }),
    assembly: "published-Taylor-2009",
    workConjugacyClaimed: false,
    units: Object.freeze({ everyPowerTerm: "W", rhoStage: "1" }),
  });
}

export function evaluateWholeHeartEndpointStoredEnergyV1(
  input: WholeHeartEndpointStoredEnergyInputV1,
): WholeHeartEndpointStoredEnergyBreakdownV1 {
  assertExactPlainRecordV1(input, [
    "vascularByCompartmentJ",
    "pericardialJ",
    "equilibriumPassiveByWallJ",
    "sls",
    "inertialByEdgeJ",
  ], "wholeHeartEndpointStoredEnergyInput");

  const vascularByCompartmentJ = copyFiniteRecord(
    input.vascularByCompartmentJ,
    VASCULAR_ENERGY_COMPARTMENT_IDS_V1,
    "vascularByCompartmentJ",
  );
  const pericardialJ = requireFinite(input.pericardialJ, "pericardialJ");
  const equilibriumPassiveByWallJ = copyFiniteRecord(
    input.equilibriumPassiveByWallJ,
    WALL_IDS,
    "equilibriumPassiveByWallJ",
  );
  const sls = copySlsStoredEnergy(input.sls);
  const inertialByEdgeJ = copyFiniteRecord(
    input.inertialByEdgeJ,
    INERTIAL_FLOW_IDS,
    "inertialByEdgeJ",
  );

  const vascularJ = sumRecord(vascularByCompartmentJ, VASCULAR_ENERGY_COMPARTMENT_IDS_V1);
  const equilibriumPassiveJ = sumRecord(equilibriumPassiveByWallJ, WALL_IDS);
  const slsJ = sls.mode === "on" ? sumRecord(sls.slsByWallJ, WALL_IDS) : 0;
  const inertialJ = sumRecord(inertialByEdgeJ, INERTIAL_FLOW_IDS);
  const storedEnergyJ = requireDerivedFinite(
    vascularJ + pericardialJ + equilibriumPassiveJ + slsJ + inertialJ,
    "totals.storedEnergyJ",
  );

  const result: WholeHeartEndpointStoredEnergyBreakdownV1 = Object.freeze({
    ledgerId: WHOLE_HEART_ENERGY_LEDGER_V1_ID,
    vascularByCompartmentJ,
    pericardialJ,
    equilibriumPassiveByWallJ,
    sls,
    inertialByEdgeJ,
    totals: Object.freeze({
      vascularJ,
      pericardialJ,
      equilibriumPassiveJ,
      slsJ,
      inertialJ,
      storedEnergyJ,
    }),
    units: Object.freeze({ everyStoredEnergyTerm: "J" as const }),
  });
  ENDPOINT_BREAKDOWN_REGISTRY.add(result);
  return result;
}

export function evaluateWholeHeartStagePowerV1(
  input: WholeHeartStagePowerInputV1,
): WholeHeartStagePowerBreakdownV1 {
  assertExactPlainRecordV1(input, [
    "storedEnergyRateW",
    "peripheralDissipationW",
    "signedEdgeDissipationByEdgeW",
    "sls",
    "activeMechanicalOutputPowerByWallW",
    "prescribedExternalEnvironmentPowerExcludingPericardium",
    "rawPublishedTaylorGeometryPowerResidual",
  ], "wholeHeartStagePowerInput");

  const storedEnergyRateW = requireFinite(input.storedEnergyRateW, "storedEnergyRateW");
  const peripheralDissipationW = copyNonNegativeRecord(
    input.peripheralDissipationW,
    PERIPHERAL_DISSIPATION_EDGE_IDS_V1,
    "peripheralDissipationW",
  );
  const signedEdgeDissipationByEdgeW = copyNonNegativeRecord(
    input.signedEdgeDissipationByEdgeW,
    INERTIAL_FLOW_IDS,
    "signedEdgeDissipationByEdgeW",
  );
  const sls = copySlsDissipation(input.sls);
  const activeMechanicalOutputPowerByWallW = copyFiniteRecord(
    input.activeMechanicalOutputPowerByWallW,
    WALL_IDS,
    "activeMechanicalOutputPowerByWallW",
  );
  const prescribedExternalEnvironmentPowerExcludingPericardium =
    copyPrescribedExternalPower(input.prescribedExternalEnvironmentPowerExcludingPericardium);
  const rawPublishedTaylorGeometryPowerResidual = copyPublishedTaylorGeometryResidual(
    input.rawPublishedTaylorGeometryPowerResidual,
  );

  const peripheralDissipationTotalW = sumRecord(
    peripheralDissipationW,
    PERIPHERAL_DISSIPATION_EDGE_IDS_V1,
  );
  const signedEdgeDissipationW = sumRecord(
    signedEdgeDissipationByEdgeW,
    INERTIAL_FLOW_IDS,
  );
  const flowDissipationW = requireNonNegativeDerived(
    peripheralDissipationTotalW + signedEdgeDissipationW,
    "totals.flowDissipationW",
  );
  const slsDissipationW = sls.mode === "on" ? sumRecord(sls.slsByWallW, WALL_IDS) : 0;
  const totalDissipationW = requireNonNegativeDerived(
    flowDissipationW + slsDissipationW,
    "totals.totalDissipationW",
  );
  const activeMechanicalOutputPowerW = sumRecord(
    activeMechanicalOutputPowerByWallW,
    WALL_IDS,
  );
  const prescribedExternalEnvironmentPowerW =
    prescribedExternalEnvironmentPowerExcludingPericardium.powerW;
  const rawPublishedTaylorGeometryPowerResidualW =
    rawPublishedTaylorGeometryPowerResidual.powerResidualW;

  const continuousEnergyResidualW = requireDerivedFinite(
    storedEnergyRateW
      + flowDissipationW
      + slsDissipationW
      - activeMechanicalOutputPowerW
      - prescribedExternalEnvironmentPowerW
      - rawPublishedTaylorGeometryPowerResidualW,
    "continuousEnergyResidualW",
  );
  const numeratorW = Math.abs(continuousEnergyResidualW);
  const denominatorW = requirePositiveDerived(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
      + Math.abs(storedEnergyRateW)
      + flowDissipationW
      + slsDissipationW
      + Math.abs(activeMechanicalOutputPowerW)
      + Math.abs(prescribedExternalEnvironmentPowerW)
      + Math.abs(rawPublishedTaylorGeometryPowerResidualW),
    "normalization.denominatorW",
  );
  const rho = requireNonNegativeDerived(numeratorW / denominatorW, "normalization.rho");

  const result: WholeHeartStagePowerBreakdownV1 = Object.freeze({
    ledgerId: WHOLE_HEART_ENERGY_LEDGER_V1_ID,
    storedEnergyRateW,
    peripheralDissipationW,
    signedEdgeDissipationByEdgeW,
    sls,
    activeMechanicalOutputPowerByWallW,
    prescribedExternalEnvironmentPowerExcludingPericardium,
    rawPublishedTaylorGeometryPowerResidual,
    totals: Object.freeze({
      peripheralDissipationW: peripheralDissipationTotalW,
      signedEdgeDissipationW,
      flowDissipationW,
      slsDissipationW,
      totalDissipationW,
      activeMechanicalOutputPowerW,
      prescribedExternalEnvironmentPowerW,
      rawPublishedTaylorGeometryPowerResidualW,
    }),
    continuousEnergyResidualW,
    normalization: Object.freeze({
      powerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
      numeratorW,
      denominatorW,
      rho,
    }),
    publishedTaylorGeometryPowerTreatment:
      PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1,
    units: Object.freeze({
      everyPowerOrDissipationTerm: "W" as const,
      rho: "1" as const,
    }),
  });
  STAGE_BREAKDOWN_REGISTRY.add(result);
  return result;
}

export function evaluateWholeHeartBackwardEulerStepEnergyAuditV1(
  input: WholeHeartBackwardEulerStepEnergyAuditInputV1,
): WholeHeartBackwardEulerStepEnergyAuditV1 {
  assertExactPlainRecordV1(input, [
    "previousEndpoint",
    "nextEndpoint",
    "endpointStage",
    "dtSec",
  ], "wholeHeartBackwardEulerStepEnergyAuditInput");
  assertEndpointBreakdownProvenance(input.previousEndpoint, "previousEndpoint");
  assertEndpointBreakdownProvenance(input.nextEndpoint, "nextEndpoint");
  assertStageBreakdownProvenance(input.endpointStage, "endpointStage");
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousMode = input.previousEndpoint.sls.mode;
  const nextMode = input.nextEndpoint.sls.mode;
  const stageMode = input.endpointStage.sls.mode;
  if (previousMode !== nextMode || previousMode !== stageMode) {
    throw new Error("BE energy audit requires one unchanged explicit SLS mode across the step");
  }

  const previousStoredEnergyJ = input.previousEndpoint.totals.storedEnergyJ;
  const nextStoredEnergyJ = input.nextEndpoint.totals.storedEnergyJ;
  const deltaStoredEnergyJ = requireDerivedFinite(
    nextStoredEnergyJ - previousStoredEnergyJ,
    "deltaStoredEnergyJ",
  );
  const flowDissipationJ = requireNonNegativeDerived(
    dtSec * input.endpointStage.totals.flowDissipationW,
    "increments.flowDissipationJ",
  );
  const slsDissipationJ = requireNonNegativeDerived(
    dtSec * input.endpointStage.totals.slsDissipationW,
    "increments.slsDissipationJ",
  );
  const activeMechanicalOutputJ = requireDerivedFinite(
    dtSec * input.endpointStage.totals.activeMechanicalOutputPowerW,
    "increments.activeMechanicalOutputJ",
  );
  const prescribedExternalEnvironmentJ = requireDerivedFinite(
    dtSec * input.endpointStage.totals.prescribedExternalEnvironmentPowerW,
    "increments.prescribedExternalEnvironmentJ",
  );
  const rawPublishedTaylorGeometryPowerResidualJ = requireDerivedFinite(
    dtSec * input.endpointStage.totals.rawPublishedTaylorGeometryPowerResidualW,
    "increments.rawPublishedTaylorGeometryPowerResidualJ",
  );
  const signedBalanceResidualJ = requireDerivedFinite(
    deltaStoredEnergyJ
      + flowDissipationJ
      + slsDissipationJ
      - activeMechanicalOutputJ
      - prescribedExternalEnvironmentJ
      - rawPublishedTaylorGeometryPowerResidualJ,
    "signedBalanceResidualJ",
  );
  const powerFloorTimesStepJ = requirePositiveDerived(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * dtSec,
    "normalization.powerFloorTimesStepJ",
  );
  const numeratorJ = Math.abs(signedBalanceResidualJ);
  const denominatorJ = requirePositiveDerived(
    powerFloorTimesStepJ
      + Math.abs(deltaStoredEnergyJ)
      + flowDissipationJ
      + slsDissipationJ
      + Math.abs(activeMechanicalOutputJ)
      + Math.abs(prescribedExternalEnvironmentJ)
      + Math.abs(rawPublishedTaylorGeometryPowerResidualJ),
    "normalization.denominatorJ",
  );
  const rho = requireNonNegativeDerived(numeratorJ / denominatorJ, "normalization.rho");

  return Object.freeze({
    ledgerId: WHOLE_HEART_ENERGY_LEDGER_V1_ID,
    scheme: "backward-Euler-endpoint-stage" as const,
    slsMode: previousMode,
    dtSec,
    previousStoredEnergyJ,
    nextStoredEnergyJ,
    deltaStoredEnergyJ,
    increments: Object.freeze({
      flowDissipationJ,
      slsDissipationJ,
      activeMechanicalOutputJ,
      prescribedExternalEnvironmentJ,
      rawPublishedTaylorGeometryPowerResidualJ,
    }),
    signedBalanceResidualJ,
    normalization: Object.freeze({
      powerFloorTimesStepJ,
      numeratorJ,
      denominatorJ,
      rho,
    }),
    publishedTaylorGeometryPowerTreatment:
      PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1,
    workConjugacyClaimed: false as const,
    units: Object.freeze({
      everyEnergyOrIncrementTerm: "J" as const,
      dt: "s" as const,
      rho: "1" as const,
    }),
  });
}

function copySlsStoredEnergy(
  input: WholeHeartSlsStoredEnergyInputV1,
): WholeHeartSlsStoredEnergyInputV1 {
  assertExactPlainRecordV1(input, ["mode", "slsByWallJ"], "slsStoredEnergy");
  if (input.mode === "on") {
    return Object.freeze({
      mode: "on" as const,
      slsByWallJ: copyFiniteRecord(input.slsByWallJ, WALL_IDS, "slsStoredEnergy.slsByWallJ"),
    });
  }
  if (input.mode !== "off") throw new Error("slsStoredEnergy.mode must be on or off");
  assertExactPlainRecordV1(input.slsByWallJ, [], "slsStoredEnergy.slsByWallJ");
  return Object.freeze({
    mode: "off" as const,
    slsByWallJ: Object.freeze({}) as EmptySlsWallRecordV1,
  });
}

function copySlsDissipation(
  input: WholeHeartSlsDissipationInputV1,
): WholeHeartSlsDissipationInputV1 {
  assertExactPlainRecordV1(input, ["mode", "slsByWallW"], "slsDissipation");
  if (input.mode === "on") {
    return Object.freeze({
      mode: "on" as const,
      slsByWallW: copyNonNegativeRecord(
        input.slsByWallW,
        WALL_IDS,
        "slsDissipation.slsByWallW",
      ),
    });
  }
  if (input.mode !== "off") throw new Error("slsDissipation.mode must be on or off");
  assertExactPlainRecordV1(input.slsByWallW, [], "slsDissipation.slsByWallW");
  return Object.freeze({
    mode: "off" as const,
    slsByWallW: Object.freeze({}) as EmptySlsWallRecordV1,
  });
}

function copyPrescribedExternalPower(
  input: PrescribedExternalEnvironmentPowerExcludingPericardiumV1,
): PrescribedExternalEnvironmentPowerExcludingPericardiumV1 {
  assertExactPlainRecordV1(input, [
    "powerW",
    "convention",
    "pericardialPressureWorkIncluded",
  ], "prescribedExternalEnvironmentPowerExcludingPericardium");
  if (input.convention !== PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1) {
    throw new Error("Prescribed external power convention is invalid");
  }
  if (input.pericardialPressureWorkIncluded !== false) {
    throw new Error("Prescribed external environment power must exclude pericardial pressure work");
  }
  return Object.freeze({
    powerW: requireFinite(input.powerW, "prescribedExternalEnvironmentPower.powerW"),
    convention: PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
    pericardialPressureWorkIncluded: false,
  });
}

function copyPublishedTaylorGeometryResidual(
  input: RawPublishedTaylorGeometryPowerResidualV1,
): RawPublishedTaylorGeometryPowerResidualV1 {
  assertExactPlainRecordV1(input, [
    "powerResidualW",
    "assembly",
    "definition",
    "workConjugacyProven",
  ], "rawPublishedTaylorGeometryPowerResidual");
  if (input.assembly !== "published-Taylor-2009") {
    throw new Error("Geometry power residual must come from the published Taylor 2009 assembly");
  }
  if (input.definition !== PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1) {
    throw new Error("Published Taylor geometry power residual definition is invalid");
  }
  if (input.workConjugacyProven !== false) {
    throw new Error("Published Taylor geometry residual must not claim proven work conjugacy");
  }
  return Object.freeze({
    powerResidualW: requireFinite(
      input.powerResidualW,
      "rawPublishedTaylorGeometryPowerResidual.powerResidualW",
    ),
    assembly: "published-Taylor-2009",
    definition: PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
    workConjugacyProven: false,
  });
}

function copyFiniteRecord<Id extends string>(
  input: NumericRecord<Id>,
  keys: readonly Id[],
  field: string,
): NumericRecord<Id> {
  assertExactPlainRecordV1(input, keys, field);
  const entries = keys.map((key) => [key, requireFinite(input[key], `${field}.${key}`)] as const);
  return Object.freeze(Object.fromEntries(entries)) as NumericRecord<Id>;
}

function copyNonNegativeRecord<Id extends string>(
  input: NumericRecord<Id>,
  keys: readonly Id[],
  field: string,
): NumericRecord<Id> {
  assertExactPlainRecordV1(input, keys, field);
  const entries = keys.map((key) => [
    key,
    requireNonNegativeFinite(input[key], `${field}.${key}`),
  ] as const);
  return Object.freeze(Object.fromEntries(entries)) as NumericRecord<Id>;
}

function sumRecord<Id extends string>(
  record: NumericRecord<Id>,
  keys: readonly Id[],
): number {
  return requireDerivedFinite(
    keys.reduce((sum, key) => sum + record[key], 0),
    "record sum",
  );
}

function assertEndpointBreakdownProvenance(
  value: WholeHeartEndpointStoredEnergyBreakdownV1,
  field: string,
): void {
  if (!ENDPOINT_BREAKDOWN_REGISTRY.has(value)) {
    throw new Error(`${field} must be produced by evaluateWholeHeartEndpointStoredEnergyV1`);
  }
}

function assertStageBreakdownProvenance(
  value: WholeHeartStagePowerBreakdownV1,
  field: string,
): void {
  if (!STAGE_BREAKDOWN_REGISTRY.has(value)) {
    throw new Error(`${field} must be produced by evaluateWholeHeartStagePowerV1`);
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function requireDerivedFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
  return value;
}

function requirePositiveDerived(value: number, field: string): number {
  const finite = requireDerivedFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must remain positive`);
  return finite;
}

function requireNonNegativeDerived(value: number, field: string): number {
  const finite = requireDerivedFinite(value, field);
  if (finite < 0) throw new Error(`${field} must remain nonnegative`);
  return finite;
}
