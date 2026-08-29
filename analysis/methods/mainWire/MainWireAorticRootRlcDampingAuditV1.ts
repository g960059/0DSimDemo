import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireArterialTangentComplianceReadbackV1,
  type MainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import type {
  VascularPvRuntimeParameterViewV1,
} from "@/engine/core/circulationGraphKernelV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_V1_ID =
  "main-wire-aortic-root-rlc-damping-audit-v1" as const;

export const MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_CLAIM_V1 = Object.freeze({
  source: "last-retained-complete-beat" as const,
  reducedLinearization:
    "two-compliant-nodes-coupled-by-one-linear-RL-edge" as const,
  equivalentCompliance:
    "harmonic-equivalent-of-cycle-mean-Ao-and-SA-tangent-compliances" as const,
  dampingRatio:
    "R-over-two-times-square-root-of-equivalent-C-over-L" as const,
  undampedNaturalFrequency:
    "square-root-of-one-over-L-times-equivalent-C" as const,
  localLinearizationIsFullClosedLoopEigenanalysis: false as const,
  valuesUsedForMechanismInterpretationNotParameterFit: true as const,
  smoothingApplied: false as const,
});

export type MainWireAorticRootRlcDampingAuditV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_V1_ID;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  tangentCompliance: MainWireArterialTangentComplianceReadbackV1;
  effectiveRootResistanceMmHgSecPerMl: number;
  effectiveRootInertanceMmHgSec2PerMl: number;
  equivalentAoSaTangentComplianceMlPerMmHg: number;
  localLinearizedDampingRatio: number;
  localLinearizedUndampedNaturalFrequencyHz: number;
  localLinearizedDampedNaturalFrequencyHz: number | null;
  positiveAorticRootAccumulationVolumeMl: number;
  claim: typeof MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_CLAIM_V1;
}>;

export function measureMainWireAorticRootRlcDampingAuditV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
  vascular: VascularPvRuntimeParameterViewV1,
  resistanceScaleFromTopology: number,
  inertanceScaleFromTopology: number,
  label: string,
): MainWireAorticRootRlcDampingAuditV1 {
  const edge = result.protocolIdentity.circulation.topologyGraphSnapshot.edges
    .find((candidate) => candidate.name === "Ao_SA");
  if (
    edge === undefined || edge.kind !== "dynamic"
    || !(edge.R > 0) || !(edge.L > 0)
  ) throw new Error(`${label} requires positive dynamic Ao_SA R and L`);
  const tangentCompliance =
    measureMainWireArterialTangentComplianceReadbackV1(result, vascular);
  const cAo = tangentCompliance.byNode.Ao.arithmeticMeanMlPerMmHg;
  const cSa = tangentCompliance.byNode.SA.arithmeticMeanMlPerMmHg;
  const equivalentCompliance = 1 / (1 / cAo + 1 / cSa);
  const resistance = edge.R * resistanceScaleFromTopology;
  const inertance = edge.L * inertanceScaleFromTopology;
  const dampingRatio = resistance * 0.5
    * Math.sqrt(equivalentCompliance / inertance);
  const undampedAngularFrequency = Math.sqrt(
    1 / (inertance * equivalentCompliance),
  );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined) throw new Error(`${label} requires a retained beat`);
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumDriveParams,
    label,
  );
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_V1_ID,
    cycle,
    tangentCompliance,
    effectiveRootResistanceMmHgSecPerMl: resistance,
    effectiveRootInertanceMmHgSec2PerMl: inertance,
    equivalentAoSaTangentComplianceMlPerMmHg: equivalentCompliance,
    localLinearizedDampingRatio: dampingRatio,
    localLinearizedUndampedNaturalFrequencyHz:
      undampedAngularFrequency / (2 * Math.PI),
    localLinearizedDampedNaturalFrequencyHz: dampingRatio < 1
      ? undampedAngularFrequency * Math.sqrt(1 - dampingRatio ** 2)
        / (2 * Math.PI)
      : null,
    positiveAorticRootAccumulationVolumeMl: beat.samples.reduce(
      (sum, sample) => sum + result.dtSec * Math.max(
        0,
        sample.circulationEdgeFlowMlPerSec.AoV
          - sample.circulationEdgeFlowMlPerSec.Ao_SA,
      ),
      0,
    ),
    claim: MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_CLAIM_V1,
  });
}
