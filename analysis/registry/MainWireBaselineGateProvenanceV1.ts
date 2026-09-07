import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  assessFittingGateProvenanceV1,
  type FittingGateProvenanceV1,
  type FittingGateRepositoryReferenceV1,
  type FittingGateSupportV1,
} from "./FittingGateProvenanceV1";

type VerifiedComparisonV1 = {
  sourceId: string;
  coveredCheckIds?: readonly string[];
  thresholdVerification?: "passage-checked" | "context-only";
  thresholdRationale?: string;
};

export function assertMainWireBaselineGateComparisonCoverageV1(groups: readonly {
  groupId: string; checkIds: readonly string[];
  sourceComparisons: readonly (Omit<VerifiedComparisonV1, "thresholdVerification"> & { thresholdVerification?: string })[];
}[]): void {
  for (const group of groups) for (const comparison of group.sourceComparisons) {
    const ids = comparison.coveredCheckIds;
    if (ids !== undefined && (!Array.isArray(ids) || ids.length === 0
      || new Set(ids).size !== ids.length || ids.some(id => !group.checkIds.includes(id)))) {
      throw new Error(`Invalid coveredCheckIds: ${group.groupId}/${comparison.sourceId}`);
    }
    if (comparison.thresholdVerification !== undefined
      && !["passage-checked", "context-only"].includes(comparison.thresholdVerification)) {
      throw new Error(`Unknown threshold verification: ${group.groupId}/${comparison.sourceId}`);
    }
  }
}
assertMainWireBaselineGateComparisonCoverageV1(evidence.checkGroups);

const basePolicy = "engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1.ts";
const rightPolicy = "engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1.ts";
const regressionFor = (gateId: string): FittingGateRepositoryReferenceV1 =>
  gateId === "settlement.period1"
    ? { path: "__tests__/fittingGateProvenanceV1.test.ts", locator: "rejects each ventricular ringing component and unset settlement" }
    : gateId.endsWith("-gradient")
      ? { path: "__tests__/fittingGateProvenanceV1.test.ts", locator: "rejects boundary violations for each semilunar pressure-loss guard" }
      : gateId.startsWith("waveform.P")
        ? { path: "__tests__/fittingGateProvenanceV1.test.ts", locator: "rejects each pulmonary-root morphology failure independently" }
        : { path: "__tests__/fittingGateProvenanceV1.test.ts", locator: "rejects each ventricular ringing component and unset settlement" };

/** Retrospective group citations are context, never automatic threshold support. */
export const MAIN_WIRE_BASELINE_GATE_PROVENANCE_V1: readonly FittingGateProvenanceV1[] = Object.freeze([
  ...evidence.checkGroups.flatMap(group => group.checkIds.map(gateId => {
    const basis = group.evaluationRole === "numerical-quality" ? "numerical-contract"
      : group.evaluationRole === "construction-guard" ? "engineering-guard" : "empirical";
    const support: FittingGateSupportV1[] = basis === "empirical"
      ? group.sourceComparisons.flatMap(comparison => {
        const qualified = comparison as typeof comparison & VerifiedComparisonV1;
        if (!qualified.coveredCheckIds?.includes(gateId)) return [];
        return [{ kind: "empirical", sourceId: comparison.sourceId, locator: comparison.locator,
          verification: qualified.thresholdVerification ?? "context-only",
          populationAndProtocol: comparison.targetPopulation,
          sourceObservation: comparison.observationMeaning, sourceRange: comparison.sourceRange ?? "",
          operatorMappingAndLimitations: group.observationLimitations,
          boundRationale: qualified.thresholdRationale ?? "" } satisfies FittingGateSupportV1];
      })
      : [{ kind: basis,
        specification: { path: group.analysisPartition === "right-heart-sentinel" ? rightPolicy : basePolicy,
          locator: gateId },
        regression: regressionFor(gateId),
        cutoffRationale: `${group.thresholdBasis}: ${group.changeReason}`,
        applicabilityAndLimitations: `${group.measurementMeaning} ${group.observationLimitations} ${group.evidenceGap}`,
        physiologicalNormalityClaimed: false }];
    return Object.freeze({ gateId, basis, observationMethodId: evidence.observationMethodId,
      measurementMeaning: group.measurementMeaning,
      protocol: "Settled resting sinus construction at the declared HR and fixed controls; not a universal case gate.",
      support: Object.freeze(support) });
  })),
  ...["LV", "RV"].flatMap(ventricle => ["hypovolemic", "hypervolemic"].map(direction => ({
    gateId: `preload-reserve.${ventricle}.${direction}`,
    basis: "engineering-guard" as const,
    observationMethodId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
    measurementMeaning: "Directional model forward cardiac output, EDV, filling pressure, transmural end-diastolic pressure and local CO/filling-pressure slope. Forward output must not be interpreted as net systemic output in regurgitant cases.",
    protocol: `Fixed-control, settled ${direction} ${ventricle} endpoint under the registered formal preload protocol.`,
    support: [{ kind: "engineering-guard" as const,
      specification: { path: "analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1.ts",
        locator: "mainWireStandard70PreloadReserveDirectionalResponsePassedV1" },
      regression: { path: "__tests__/fittingGateProvenanceV1.test.ts",
        locator: "rejects deficient Standard70 reserve in each ventricle and volume direction" },
      cutoffRationale: "Re-admitted construction non-regression floors: CO and EDV directional fractions >=0.03, CO/pressure slope >=0.02. Not clinical fluid-response thresholds or independent confirmation data.",
      applicabilityAndLimitations: "Requires the formal protocol's convergence, complete endpoints, directional filling-pressure and transmural-pressure responses. No afterload test; not a transient bedside fluid challenge.",
      physiologicalNormalityClaimed: false as const }],
  }))),
]);

export function assessMainWireBaselineGateProvenanceV1(
  resolveRepositoryReference: (ref: FittingGateRepositoryReferenceV1) => boolean,
) {
  // Advisory corridors retain provenance/gaps in the registry but are not
  // promoted back into mandatory admission gates by an evidence audit. This
  // is the current research policy; the saved launch's older policy is not rewritten.
  const warningIds = new Set(evidence.checkGroups.filter(group => group.evaluationRole === "reference-warning")
    .flatMap(group => group.checkIds));
  return assessFittingGateProvenanceV1({
    requiredGateIds: [
      ...evidence.checkGroups.filter(group => group.evaluationRole !== "reference-warning").flatMap(group => group.checkIds),
      ...["LV", "RV"].flatMap(wall => ["hypovolemic", "hypervolemic"].map(side => `preload-reserve.${wall}.${side}`)),
    ],
    gates: MAIN_WIRE_BASELINE_GATE_PROVENANCE_V1.filter(gate => !warningIds.has(gate.gateId)),
    sources: evidence.sources.map(source => ({ ...source, kind: "paper" as const,
      verification: source.verification === "primary-full-text-methods-and-figures-4-5-checked"
        || source.verification === "primary-full-text-methods-and-results-checked"
        || source.verification === "primary-table-11-and-rhc-methods-checked"
        ? "passage-checked" as const : "context-only" as const })),
    resolveRepositoryReference,
  });
}
