import { describe, expect, it } from "vitest";
import { assessFittingGateProvenanceV1, assertFittingGateProvenanceReadyV1,
  type FittingGateProvenanceV1, type FittingGateSupportV1 } from "@/analysis/registry/FittingGateProvenanceV1";
import { assessRegisteredFittingReferenceEvidenceV1,
  assertRegisteredFittingReferenceEvidenceReadyV1 } from "@/tools/registry/assertFittingReferenceEvidenceV1";
import { MAIN_WIRE_BASELINE_GATE_PROVENANCE_V1, assertMainWireBaselineGateComparisonCoverageV1 } from "@/analysis/registry/MainWireBaselineGateProvenanceV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import baseline from "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { buildMainWireIntegratedModelStandard70BaselineChecksV1,
  type MainWireIntegratedModelStandard70BaselineMeasurementsV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { assertMainWireStandard70PreloadReservePassedV1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";

const empirical: FittingGateSupportV1 = { kind: "empirical", sourceId: "cohort-a", locator: "Table 2, control group",
  verification: "passage-checked", populationAndProtocol: "Healthy resting adults, micromanometer, HR60-70",
  sourceObservation: "Intracavitary LV peak dP/dt, 500 Hz", sourceRange: "Synthetic test-only range",
  operatorMappingAndLimitations: "2 ms accepted-step secants, no sensor filter; peak bandwidth differs.",
  boundRationale: "Synthetic test-only interpretation, not a real normal interval." };
const gate: FittingGateProvenanceV1 = { gateId: "lv.dpdt", basis: "empirical", observationMethodId: "lv-node-secant-v1",
  measurementMeaning: "Peak intracavitary LV pressure derivative", protocol: "resting periodic HR70",
  support: [empirical] };
const input = { requiredGateIds: [gate.gateId], gates: [gate],
  sources: [{ sourceId: "cohort-a", kind: "paper" as const, verification: "passage-checked" as const,
    title: "Synthetic test citation", url: "https://example.org/test" }],
  resolveRepositoryReference: () => true };

describe("per-gate fitting evidence admission", () => {
  it("requires explicit resolved support without claiming scientific validation", () => {
    const result = assessFittingGateProvenanceV1(input);
    expect(result).toEqual({ status: "evidence-ready", issues: [], physiologicalValidationClaimed: false });
    expect(() => assertFittingGateProvenanceReadyV1(result)).not.toThrow();
  });

  it.each(["sourceId", "locator", "populationAndProtocol", "sourceObservation", "sourceRange",
    "operatorMappingAndLimitations", "boundRationale"])("rejects missing or unresolved %s", field => {
    const broken = { ...empirical, [field]: "" };
    const result = assessFittingGateProvenanceV1({ ...input, gates: [{ ...gate, support: [broken] }] });
    expect(result.status).toBe("draft");
    expect(() => assertFittingGateProvenanceReadyV1(result)).toThrow(/evidence admission rejected/);
  });

  it("does not let metadata/context, another gate or a candidate output prove a threshold", () => {
    expect(assessFittingGateProvenanceV1({ ...input,
      sources: [{ ...input.sources[0], verification: "context-only" }] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...input,
      gates: [{ ...gate, support: [{ ...empirical, verification: "context-only" }] }] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...input,
      requiredGateIds: [gate.gateId, "ao.maximum"] }).issues).toContainEqual({ gateId: "ao.maximum", reason: "missing gate provenance" });
    expect(assessFittingGateProvenanceV1({ ...input, gates: [{ ...gate, support: [] }] }).status).toBe("draft");
  });

  it("rejects misspelled, duplicated, out-of-group coverage and unknown verification", () => {
    const group = { groupId: "pressures", checkIds: ["rap.mean"], sourceComparisons: [{ sourceId: "cohort-a", coveredCheckIds: ["rap.mean"] }] };
    expect(() => assertMainWireBaselineGateComparisonCoverageV1([group])).not.toThrow();
    for (const ids of [["aop.maximum"], ["rap.mean", "rap.mean"], []]) {
      expect(() => assertMainWireBaselineGateComparisonCoverageV1([{ ...group,
        sourceComparisons: [{ ...group.sourceComparisons[0], coveredCheckIds: ids }] }])).toThrow(/coveredCheckIds/);
    }
    expect(() => assertMainWireBaselineGateComparisonCoverageV1([{ ...group,
      sourceComparisons: [{ ...group.sourceComparisons[0], thresholdVerification: "typo" as never }] }])).toThrow(/verification/);
  });

  it("admits numerical contracts via specification plus regression, not a borrowed paper", () => {
    const numerical: FittingGateSupportV1 = { kind: "numerical-contract",
      specification: { path: "engine/numerics.ts", locator: "massBalance" },
      regression: { path: "__tests__/numerics.test.ts", locator: "conserves volume" },
      cutoffRationale: "Roundoff bound for the declared discretization",
      applicabilityAndLimitations: "Closed-loop volume invariant, not a healthy reference",
      physiologicalNormalityClaimed: false };
    const numericalInput = { ...input, sources: [], gates: [{ ...gate, basis: "numerical-contract" as const, support: [numerical] }] };
    expect(assessFittingGateProvenanceV1(numericalInput).status).toBe("evidence-ready");
    expect(assessFittingGateProvenanceV1({ ...numericalInput, resolveRepositoryReference: () => false }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...numericalInput,
      gates: [{ ...numericalInput.gates[0], support: [empirical] }] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...numericalInput, gates: [{ ...numericalInput.gates[0],
      support: [{ ...numerical, specification: { path: "../escape", locator: "x" } }] }] }).status).toBe("draft");
  });

  it("fails closed on duplicate identities and missing observations", () => {
    expect(assessFittingGateProvenanceV1({ ...input, gates: [gate, gate] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...input, sources: [...input.sources, ...input.sources] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...input, requiredGateIds: [] }).status).toBe("draft");
    expect(assessFittingGateProvenanceV1({ ...input, gates: [{ ...gate, protocol: "" }] }).status).toBe("draft");
  });

  it("covers baseline rest and all four preload directions, retaining existing evidence gaps", () => {
    expect(MAIN_WIRE_BASELINE_GATE_PROVENANCE_V1.map(g => g.gateId).sort()).toEqual([
      ...evidence.checkGroups.flatMap(g => g.checkIds),
      "preload-reserve.LV.hypovolemic", "preload-reserve.LV.hypervolemic",
      "preload-reserve.RV.hypovolemic", "preload-reserve.RV.hypervolemic",
    ].sort());
    const result = assessRegisteredFittingReferenceEvidenceV1("baseline");
    expect(result.status).toBe("draft");
    expect(result.issues.some(issue => issue.gateId === "aortic-pressure.maximum")).toBe(true);
    expect(result.issues.some(issue => issue.gateId === "pulmonary-valve.ejection-time")).toBe(true);
    for (const group of evidence.checkGroups.filter(group => group.evaluationRole === "reference-warning")) {
      expect(result.issues.filter(issue => group.checkIds.includes(issue.gateId))).toEqual([]);
    }
    expect(() => assertRegisteredFittingReferenceEvidenceReadyV1("baseline")).toThrow(/evidence admission rejected/);
    // The new admission gate does not rewrite observations or stop exploratory fitting.
    expect(resolveMainWireFittingReferenceV1("baseline").evidenceAdmissionRequired).toBe(true);
    expect(resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs).toBeDefined();
    expect(() => assessRegisteredFittingReferenceEvidenceV1("hfref")).toThrow(/Unregistered/);
  });

  it("does not promote newer anatomical CMR comparisons into changed or verified current gates", () => {
    const issues = assessRegisteredFittingReferenceEvidenceV1("baseline").issues;
    expect(issues).toHaveLength(16);
    for (const side of ["left", "right"]) for (const metric of ["edv-index", "esv-index", "ejection-fraction"]) {
      const id = `${side}-ventricle.${metric}`;
      const group = evidence.checkGroups.find(g => g.checkIds.includes(id))!;
      const comparison = group.sourceComparisons.find(c => c.sourceId === "kawel-boehm-2025-scmr-reference-values")!;
      expect(comparison).toMatchObject({ thresholdVerification: "context-only" });
      expect(issues.some(issue => issue.gateId === id)).toBe(true);
    }
    expect(evidence.referenceSubjectInterpretation).toContain("do not identify age, sex or ethnicity");
    expect(baseline.measurements.cardiacSizeAndFunction.bodySurfaceAreaM2).toBe(1.9);
    const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(
      baseline.measurements as MainWireIntegratedModelStandard70BaselineMeasurementsV1, true);
    expect(checks.find(c => c.checkId === "right-ventricle.edv-index")).toMatchObject({ minimum: 32, maximum: 87 });
  });

  it("rejects boundary violations for each semilunar pressure-loss guard", () => {
    for (const [owner, prefix] of [["aorticValve", "aortic-valve"], ["pulmonaryValve", "pulmonary-valve"]] as const) {
      for (const [field, suffix] of [["meanGradientMmHg", "mean-gradient"], ["peakGradientMmHg", "peak-gradient"]] as const) {
        const measures = structuredClone(baseline.measurements) as MainWireIntegratedModelStandard70BaselineMeasurementsV1;
        const id = `${prefix}.${suffix}`;
        const reference = buildMainWireIntegratedModelStandard70BaselineChecksV1(measures, true).find(c => c.checkId === id)!;
        const check = (value: number) => buildMainWireIntegratedModelStandard70BaselineChecksV1({ ...measures,
          [owner]: { ...measures[owner], [field]: value } }, true).find(c => c.checkId === id)!;
        expect(check(reference.maximum).status).toBe("passed");
        expect(check(reference.maximum + 0.01).status).toBe("failed");
        expect(check(reference.minimum - 0.01).status).toBe("failed");
      }
    }
  });

  it("rejects each pulmonary-root morphology failure independently", () => {
    const measures = structuredClone(baseline.measurements) as MainWireIntegratedModelStandard70BaselineMeasurementsV1;
    for (const [field, id, value] of [
      ["papSignificantPeakCount", "waveform.PAP.single-peak-no-ringing", 2],
      ["pvForwardEpisodeCount", "waveform.PV-flow.single-forward-episode", 2],
      ["pvFlowSignificantPeakCount", "waveform.PV-flow.single-peak-no-ringing", 2],
      ["maximumPostClosurePapReboundMmHg", "waveform.PAP.post-PV-closure-rebound", 0.51],
    ] as const) {
      const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1({ ...measures,
        pulmonaryRootMorphology: { ...measures.pulmonaryRootMorphology, [field]: value } }, true);
      expect(checks.find(c => c.checkId === id)!.status).toBe("failed");
    }
  });

  it("rejects each ventricular ringing component and unset settlement", () => {
    const measures = structuredClone(baseline.measurements) as MainWireIntegratedModelStandard70BaselineMeasurementsV1;
    expect(buildMainWireIntegratedModelStandard70BaselineChecksV1(measures, false)
      .find(c => c.checkId === "settlement.period1")!.status).toBe("failed");
    for (const chamber of ["LVP", "RVP"] as const) {
      for (const field of ["significantPeakCount", "forwardEpisodeCount", "totalVariationRatio"] as const) {
        const changed = { ...measures, [chamber]: { ...measures[chamber], [field]: field === "totalVariationRatio" ? 2.21 : 2 } };
        expect(buildMainWireIntegratedModelStandard70BaselineChecksV1(changed, true)
          .find(c => c.checkId === `waveform.${chamber}.single-peak-no-ringing`)!.status).toBe("failed");
      }
    }
  });

  it("rejects deficient Standard70 reserve in each ventricle and volume direction", () => {
    const reference = structuredClone(baseline.preloadReserve);
    const assertReserve = (input: typeof reference) => assertMainWireStandard70PreloadReservePassedV1(
      input as unknown as Parameters<typeof assertMainWireStandard70PreloadReservePassedV1>[0]);
    expect(() => assertReserve(reference)).not.toThrow();
    for (const side of ["left", "right"] as const) {
      for (const direction of ["hypovolemic", "hypervolemic"] as const) {
        for (const field of ["directionalCardiacOutputChangeFraction01", "cardiacOutputSlopeLPerMinPerMmHg",
          "directionalEndDiastolicVolumeChangeFraction01", "directionalFillingPressureChangeMmHg",
          "directionalEndDiastolicTransmuralPressureChangeMmHg"] as const) {
          const broken = structuredClone(reference);
          broken[side][direction][field] = 0;
          expect(() => assertReserve(broken)).toThrow(/preload reserve failed/);
        }
      }
    }
  });
});
