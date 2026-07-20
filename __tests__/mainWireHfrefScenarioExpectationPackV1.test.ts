import { describe, expect, it } from "vitest";

import {
  createScientificProductEvidenceBundleV2,
} from "@/components/scientificProduct/ScientificProductEvidenceContractAdapterV2";
import type {
  ScientificProductValidationContextV1,
} from "@/components/scientificProduct/ScientificProductValidationContextV1";
import {
  MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1,
  MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_ID,
} from "@/engine/scientific/evidence/MainWireHfrefScenarioExpectationPackV1";
import {
  assertScientificEvidenceBundleV2,
  type ScientificEvidenceAssessmentRecordV2,
  type ScientificEvidenceAssessmentRuleV2,
  type ScientificEvidenceBundleV2,
} from "@/engine/scientific/evidence/ScientificEvidenceContractV2";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
  MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";

const RELEASE_REF = Object.freeze({
  id: "hfref-foundation-test-release",
  version: "0.0.0",
  sha256: "a".repeat(64),
});

const CHILD_DEFINITION_REF = Object.freeze({
  scenarioId: "future-main-wire-hfref-reduced-contractility-v1",
  scenarioVersion: "1",
  sha256: "b".repeat(64),
});

const PARENT_DEFINITION_REF = Object.freeze({
  scenarioId: "future-main-wire-healthy-parent-v1",
  scenarioVersion: "1",
  sha256: "c".repeat(64),
});

const MATCHED_CONTEXT_REF = Object.freeze({
  contextId: "future-hfref-matched-context-v1",
  contextVersion: "1",
  sha256: "d".repeat(64),
  declaredInvariantIds: Object.freeze([
    "heart-rate",
    "body-surface-area",
    "total-blood-volume",
    "vascular-load",
    "controller-state",
    "observation-phase",
  ]),
});

describe("Main-wire HFrEF scenario expectation foundation V1", () => {
  it("declares only the two defensible directions and stays inactive", () => {
    expect(MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1).toMatchObject({
      packId: MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_ID,
      packVersion: "1",
      activation: "deferred-until-release-bound-scenario",
    });
    expect(MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1.expectations.map(
      ({ metricId, expectedDirection, activation }) => ({
        metricId,
        expectedDirection,
        activation,
      }),
    )).toEqual([
      {
        metricId: "hemodynamics.lv.ejection_fraction_01",
        expectedDirection: "lower",
        activation: "guard-band-and-runtime-binding-required",
      },
      {
        metricId: "hemodynamics.lv.esv_index_ml_per_m2",
        expectedDirection: "higher",
        activation: "guard-band-and-runtime-binding-required",
      },
    ]);
    expect(MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1.expectations.some(
      ({ metricId }) => metricId.includes("cardiac_index"),
    )).toBe(false);
    expect(MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1.activationRequirements)
      .toEqual(expect.arrayContaining([
        expect.stringContaining("positive scenario-owned guard band"),
        expect.stringContaining("runtime adapter"),
      ]));
    expect(MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1.references.some(
      ({ href }) => href === "https://doi.org/10.1093/eurheartj/ehag500",
    )).toBe(true);
    for (const expectation of
      MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1.expectations) {
      const sourceGates = MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates
        .filter(({ gateId }) => gateId === expectation.sourceGateId);
      expect(sourceGates).toHaveLength(1);
      expect(sourceGates[0]?.metricId).toBe(expectation.metricId);
    }
  });

  it("does not auto-apply the dormant pack from an HFrEF label", () => {
    const bundle = baseBundleV2("label-only", "HFrEF");

    expect(bundle.metricDefinitions).toHaveLength(10);
    expect(bundle.profiles).toHaveLength(2);
    expect(bundle.rules).toHaveLength(10);
    expect(bundle.records).toHaveLength(10);
    expect(bundle.profiles.map(({ profileId }) => profileId)).not.toContain(
      MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_ID,
    );
  });

  it("accepts a content-addressed paired-direction record with a positive guard band", () => {
    const bundle = directionBundleV2();

    expect(() => assertScientificEvidenceBundleV2(bundle)).not.toThrow();
    expect(bundle.records.at(-1)).toMatchObject({
      assessment: { state: "assessed", outcome: "meets", severity: "none" },
      evidenceUse: {
        role: "construction-conformance",
        datasetRefs: [],
      },
      scenarioDefinitionRef: CHILD_DEFINITION_REF,
      matchedContextRef: MATCHED_CONTEXT_REF,
      comparisonTarget: {
        declaredBundleContentSha256: "e".repeat(64),
        scenarioDefinitionRef: PARENT_DEFINITION_REF,
        matchedContextRef: MATCHED_CONTEXT_REF,
      },
    });
  });

  it("retains target provenance when assessment is blocked but forbids an observation", () => {
    const bundle = directionBundleV2();
    const record = requiredLastRecordV2(bundle);
    const blocked = withLastRecordV2(bundle, {
      ...record,
      assessment: {
        state: "not-assessed",
        reason: "prerequisite-failed",
        rationale: "The numerical prerequisite failed.",
      },
      comparison: undefined,
    });
    expect(() => assertScientificEvidenceBundleV2(blocked)).not.toThrow();
    expect(blocked.records.at(-1)?.comparisonTarget).toBeDefined();

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      blocked,
      { ...blocked.records.at(-1)!, comparison: record.comparison },
    ))).toThrow(/must not carry a comparison observation/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      blocked,
      { ...blocked.records.at(-1)!, comparisonTarget: undefined },
    ))).toThrow(/has no comparison target/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      blocked,
      {
        ...blocked.records.at(-1)!,
        comparisonTarget: {
          ...record.comparisonTarget!,
          releaseRef: { ...RELEASE_REF, version: "other" },
        },
      },
    ))).toThrow(/compares another release/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      blocked,
      {
        ...blocked.records.at(-1)!,
        comparisonTarget: {
          ...record.comparisonTarget!,
          matchedContextRef: {
            ...MATCHED_CONTEXT_REF,
            sha256: "f".repeat(64),
          },
        },
      },
    ))).toThrow(/compares another matched context/);
  });

  it("rejects zero, negative, non-finite, and unknown direction comparators", () => {
    const bundle = directionBundleV2();
    const rule = requiredLastRuleV2(bundle);
    for (const threshold of [0, -1, Number.NaN]) {
      expect(() => assertScientificEvidenceBundleV2(withLastRuleV2(bundle, {
        ...rule,
        comparator: {
          kind: "parent-direction",
          expectedDirection: "lower",
          minimumAbsoluteDifferenceExclusive: threshold,
          parentRole: "declared-healthy-parent",
        },
      }))).toThrow(/invalid minimum difference/);
    }
    expect(() => assertScientificEvidenceBundleV2(withLastRuleV2(bundle, {
      ...rule,
      comparator: { kind: "unknown" } as never,
    }))).toThrow(/unknown comparator kind/);
  });

  it("rejects unbound definitions, target content, and matched contexts", () => {
    const bundle = directionBundleV2();
    const record = requiredLastRecordV2(bundle);
    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      scenarioDefinitionRef: {
        ...CHILD_DEFINITION_REF,
        sha256: "not-a-digest",
      },
    }))).toThrow(/scenario definition\.sha256/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      scenarioDefinitionRef: {
        ...CHILD_DEFINITION_REF,
        scenarioId: "aliased-parent-definition",
        sha256: PARENT_DEFINITION_REF.sha256,
      },
    }))).toThrow(/compares the same scenario definition/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      comparisonTarget: {
        ...record.comparisonTarget!,
        declaredBundleContentSha256: "self-attested-label",
      },
    }))).toThrow(/declaredBundleContentSha256/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      comparisonTarget: {
        ...record.comparisonTarget!,
        matchedContextRef: {
          ...MATCHED_CONTEXT_REF,
          sha256: "f".repeat(64),
        },
      },
    }))).toThrow(/compares another matched context/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      controlStateSha256: null,
    }))).toThrow(/controlStateSha256/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      comparison: {
        ...record.comparison!,
        controlStateSha256: null,
      },
    }))).toThrow(/comparison\.controlStateSha256/);
  });

  it("recomputes the paired outcome from the observation and guard band", () => {
    const bundle = directionBundleV2();
    const record = requiredLastRecordV2(bundle);
    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(bundle, {
      ...record,
      observedValue: 0.595,
    }))).toThrow(/assessment inconsistent with its observations/);
  });

  it("requires structured declared held-out provenance for independent validation", () => {
    const bundle = directionBundleV2();
    const rule = requiredLastRuleV2(bundle);
    const record = requiredLastRecordV2(bundle);
    const relabelledRule: ScientificEvidenceAssessmentRuleV2 = {
      ...rule,
      domain: "independent-validation",
    };
    const relabelledRecord: ScientificEvidenceAssessmentRecordV2 = {
      ...record,
      evidenceUse: {
        ...record.evidenceUse,
        role: "independent-validation",
        datasetRefs: [{
          datasetId: "future-held-out-hfref-cohort",
          datasetVersion: "1",
          sha256: "1".repeat(64),
          use: "held-out-validation",
        }],
      },
    };
    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      withLastRuleV2(bundle, relabelledRule),
      relabelledRecord,
    ))).toThrow(/profile domain|profile evidence role/);

    const validationProfileId = "fixture-hfref-independent-validation-profile";
    const validationRule: ScientificEvidenceAssessmentRuleV2 = {
      ...rule,
      ruleId: "fixture.hfref.lv.ef.independent-validation",
      profileRef: { profileId: validationProfileId, profileVersion: "1" },
      domain: "independent-validation",
      sourceIds: ["fixture-held-out-validation-protocol"],
    };
    const validationRecord: ScientificEvidenceAssessmentRecordV2 = {
      ...relabelledRecord,
      recordId: "fixture:hfref-child:lv-ef-independent-validation",
      ruleRef: {
        ruleId: validationRule.ruleId,
        ruleVersion: validationRule.ruleVersion,
      },
      sourceIds: ["fixture-held-out-validation-protocol"],
    };
    const validationBundle: ScientificEvidenceBundleV2 = {
      ...bundle,
      profiles: [...bundle.profiles, {
        profileId: validationProfileId,
        profileVersion: "1",
        domain: "independent-validation",
        evidenceRole: "independent-validation",
        title: "Fixture HFrEF independent validation",
        contextOfUse: "Structural contract fixture only.",
        ruleRefs: [{
          ruleId: validationRule.ruleId,
          ruleVersion: validationRule.ruleVersion,
        }],
        references: [{
          sourceId: "fixture-held-out-validation-protocol",
          citation: "Synthetic held-out test fixture.",
          role: "Structural testing only.",
          href: null,
        }],
        claimBoundaries: ["No scientific claim."],
      }],
      rules: [...bundle.rules, validationRule],
      records: [...bundle.records, validationRecord],
    };
    expect(() => assertScientificEvidenceBundleV2(validationBundle)).not.toThrow();

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      validationBundle,
      {
        ...validationRecord,
        evidenceUse: {
          ...validationRecord.evidenceUse,
          datasetRefs: ["fake"] as never,
        },
      },
    ))).toThrow(/datasetRef\.datasetId/);

    expect(() => assertScientificEvidenceBundleV2(withLastRecordV2(
      validationBundle,
      {
        ...validationRecord,
        evidenceUse: {
          ...validationRecord.evidenceUse,
          datasetRefs: [{
            datasetId: "calibration-cohort",
            datasetVersion: "1",
            sha256: "2".repeat(64),
            use: "calibration",
          }],
        },
      },
    ))).toThrow(/declared held-out dataset reference/);
  });
});

function baseBundleV2(
  subjectId: string,
  label = "Scenario",
): ScientificEvidenceBundleV2 {
  return createScientificProductEvidenceBundleV2({
    subjectRef: Object.freeze({
      kind: "scenario" as const,
      subjectId,
      label,
    }),
    releaseRef: RELEASE_REF,
    controlStateSha256: "3".repeat(64),
    parameterEpoch: 2,
    validation: validationContextV1(subjectId.includes("parent") ? 0.6 : 0.4),
  });
}

function directionBundleV2(): ScientificEvidenceBundleV2 {
  const child = baseBundleV2("hfref-child", "Future HFrEF child");
  const parent = baseBundleV2("healthy-parent", "Future healthy parent");
  const parentRecord = parent.records.find(
    ({ ruleRef }) => ruleRef.ruleId === "healthy.lv.ef",
  );
  if (parentRecord === undefined
    || typeof parentRecord.observedValue !== "number") {
    throw new Error("test parent has no EF record");
  }
  const rule: ScientificEvidenceAssessmentRuleV2 = Object.freeze({
    ruleId: "fixture.hfref.lv.ef.direction",
    ruleVersion: "1",
    metricRef: Object.freeze({
      metricId: "hemodynamics.lv.ejection_fraction_01",
      metricVersion: "1",
    }),
    profileRef: Object.freeze({
      profileId: "fixture-hfref-direction-profile",
      profileVersion: "1",
    }),
    domain: "scenario-contract",
    modality: "direction",
    scope: "scenario",
    applicability: Object.freeze({ kind: "unconditional" }),
    comparator: Object.freeze({
      kind: "parent-direction",
      expectedDirection: "lower",
      minimumAbsoluteDifferenceExclusive: 0.01,
      parentRole: "declared-healthy-parent",
    }),
    interpretation: "Contract fixture for a content-addressed paired direction.",
    sourceIds: Object.freeze(["fixture-construction-specification"]),
  });
  const record: ScientificEvidenceAssessmentRecordV2 = Object.freeze({
    recordId: "fixture:hfref-child:lv-ef-direction",
    subjectRef: child.subjectRef,
    releaseRef: child.releaseRef,
    metricRef: rule.metricRef,
    ruleRef: Object.freeze({ ruleId: rule.ruleId, ruleVersion: rule.ruleVersion }),
    observedValue: 0.4,
    unit: "1",
    applicability: Object.freeze({ state: "applicable" }),
    assessment: Object.freeze({
      state: "assessed",
      outcome: "meets",
      severity: "none",
    }),
    evidenceUse: Object.freeze({
      role: "construction-conformance",
      rationale: "A synthetic fixture exercises the structural contract only.",
      datasetRefs: Object.freeze([]),
    }),
    sourceIds: Object.freeze(["fixture-construction-specification"]),
    controlStateSha256: "3".repeat(64),
    parameterEpoch: 2,
    scenarioDefinitionRef: CHILD_DEFINITION_REF,
    matchedContextRef: MATCHED_CONTEXT_REF,
    comparisonTarget: Object.freeze({
      relationship: "declared-healthy-parent",
      bundleId: parent.bundleId,
      declaredBundleContentSha256: "e".repeat(64),
      subjectRef: parent.subjectRef,
      scenarioDefinitionRef: PARENT_DEFINITION_REF,
      matchedContextRef: MATCHED_CONTEXT_REF,
      releaseRef: parent.releaseRef,
    }),
    comparison: Object.freeze({
      kind: "subject-record",
      recordId: parentRecord.recordId,
      metricRef: parentRecord.metricRef,
      observedValue: parentRecord.observedValue,
      unit: parentRecord.unit,
      controlStateSha256: parentRecord.controlStateSha256,
      parameterEpoch: parentRecord.parameterEpoch,
    }),
  });
  return {
    ...child,
    profiles: [...child.profiles, {
      profileId: "fixture-hfref-direction-profile",
      profileVersion: "1",
      domain: "scenario-contract",
      evidenceRole: "construction-conformance",
      title: "Fixture HFrEF direction",
      contextOfUse: "Structural contract fixture only.",
      ruleRefs: [{ ruleId: rule.ruleId, ruleVersion: rule.ruleVersion }],
      references: [{
        sourceId: "fixture-construction-specification",
        citation: "Synthetic test fixture.",
        role: "Structural testing only.",
        href: null,
      }],
      claimBoundaries: ["No scientific claim."],
    }],
    rules: [...child.rules, rule],
    records: [...child.records, record],
  };
}

function validationContextV1(ef: number): ScientificProductValidationContextV1 {
  return Object.freeze({
    cycleAvailable: true,
    cycleEvidence: "validated-periodic-P1" as const,
    numericalIntegrityPackId: MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId,
    referenceContextPackId:
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId,
    referenceSubject:
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject,
    numericalResults: Object.freeze(
      MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates.map((gate) => Object.freeze({
        gateId: gate.gateId,
        label: gate.gateId,
        value: 0,
        unit: gate.metricId.endsWith("_ml") ? "mL" : "1",
        lowerInclusive: gate.lowerInclusive,
        upperInclusive: gate.upperInclusive,
        status: "pass" as const,
        interpretation: gate.interpretation,
      })),
    ),
    referenceResults: Object.freeze(
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates.map((gate) => {
        const value = gate.gateId === "healthy.lv.ef"
          ? ef
          : gate.lowerInclusive ?? gate.upperInclusive ?? 0;
        const within = (gate.lowerInclusive === null
            || value >= gate.lowerInclusive)
          && (gate.upperInclusive === null || value <= gate.upperInclusive);
        return Object.freeze({
          gateId: gate.gateId,
          label: gate.gateId,
          value,
          unit: referenceUnitV1(gate.metricId),
          lowerInclusive: gate.lowerInclusive,
          upperInclusive: gate.upperInclusive,
          status: within
            ? "within-reference" as const
            : "outside-reference" as const,
          interpretation: gate.interpretation,
          sourceIds: gate.sourceIds,
        });
      }),
    ),
    valveFlow: Object.freeze([]),
    waveformAvailability: Object.freeze([]),
    references: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources,
    deferredAcceptance:
      MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance,
  });
}

function referenceUnitV1(metricId: string): string {
  if (metricId.endsWith("_ml_per_m2")) return "mL/m²";
  if (metricId.endsWith("_l_per_min_per_m2")) return "L/min/m²";
  if (metricId.endsWith("_mmhg")) return "mmHg";
  return "1";
}

function requiredLastRuleV2(
  bundle: ScientificEvidenceBundleV2,
): ScientificEvidenceAssessmentRuleV2 {
  const rule = bundle.rules.at(-1);
  if (rule === undefined) throw new Error("test bundle has no rule");
  return rule;
}

function requiredLastRecordV2(
  bundle: ScientificEvidenceBundleV2,
): ScientificEvidenceAssessmentRecordV2 {
  const record = bundle.records.at(-1);
  if (record === undefined) throw new Error("test bundle has no record");
  return record;
}

function withLastRuleV2(
  bundle: ScientificEvidenceBundleV2,
  rule: ScientificEvidenceAssessmentRuleV2,
): ScientificEvidenceBundleV2 {
  return { ...bundle, rules: [...bundle.rules.slice(0, -1), rule] };
}

function withLastRecordV2(
  bundle: ScientificEvidenceBundleV2,
  record: ScientificEvidenceAssessmentRecordV2,
): ScientificEvidenceBundleV2 {
  return { ...bundle, records: [...bundle.records.slice(0, -1), record] };
}
