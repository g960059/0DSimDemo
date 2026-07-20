import { describe, expect, it } from "vitest";

import {
  createScientificProductEvidenceBundleV2,
} from "@/components/scientificProduct/ScientificProductEvidenceContractAdapterV2";
import type {
  ScientificProductValidationContextV1,
} from "@/components/scientificProduct/ScientificProductValidationContextV1";
import {
  assertScientificEvidenceBundleV2,
  type ScientificEvidenceBundleV2,
} from "@/engine/scientific/evidence/ScientificEvidenceContractV2";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
  MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";

const RELEASE_REF = Object.freeze({
  id: "evidence-contract-test-release",
  version: "0.0.0",
  sha256: "a".repeat(64),
});

describe("Main-wire Scientific Evidence Contract V2", () => {
  it("separates engineering tolerances from healthy reference context while preserving V1 order", () => {
    expect(MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates.every(
      ({ domain }) => domain === "numerical-integrity",
    )).toBe(true);
    expect(MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates.every(
      ({ domain }) => domain === "physiology-reference",
    )).toBe(true);
    expect(MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.sources.some(
      ({ sourceId }) => String(sourceId) === "circleheart-numerical-contract-v1",
    )).toBe(false);
    expect(MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.gates.map(
      ({ gateId }) => gateId,
    )).toEqual([
      ...MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates,
      ...MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates,
    ].map(({ gateId }) => gateId));
    expect(MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources.map(
      ({ sourceId }) => sourceId,
    )).toEqual([
      ...MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.sources,
      ...MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.sources,
    ].map(({ sourceId }) => sourceId));
  });

  it("keeps metric definitions neutral and assigns evidence roles at record level", () => {
    const bundle = bundleV2(validationContextV1(true));

    expect(() => assertScientificEvidenceBundleV2(bundle)).not.toThrow();
    expect(bundle.metricDefinitions).toHaveLength(10);
    expect(bundle.profiles).toHaveLength(2);
    expect(bundle.rules).toHaveLength(10);
    expect(bundle.records).toHaveLength(10);
    expect(bundle.metricDefinitions.every((definition) =>
      !("evidenceRole" in definition)
      && !("usedForCalibration" in definition)
    )).toBe(true);

    const numerical = bundle.records.filter(({ ruleRef }) =>
      ruleRef.ruleId.startsWith("numerics.")
    );
    const healthy = bundle.records.filter(({ ruleRef }) =>
      ruleRef.ruleId.startsWith("healthy.")
    );
    expect(numerical.every(({ evidenceUse }) =>
      evidenceUse.role === "numerical-verification"
    )).toBe(true);
    expect(healthy.every(({ evidenceUse }) =>
      evidenceUse.role === "exploratory-context"
    )).toBe(true);
    expect(bundle.records.some(({ evidenceUse }) =>
      evidenceUse.role === "calibration-evidence"
      || evidenceUse.role === "independent-validation"
    )).toBe(false);
    expect(numerical[0]?.assessment).toMatchObject({
      state: "assessed",
      outcome: "finding",
      severity: "error",
    });
    expect(healthy[0]?.assessment).toMatchObject({
      state: "assessed",
      outcome: "finding",
      severity: "warning",
    });
    expect(bundle.rules.filter(({ modality }) => modality === "conservation")
      .map(({ ruleId }) => ruleId)).toEqual([
        "numerics.continuity.residual",
        "numerics.total_blood_volume.error",
      ]);
  });

  it("reports a missing complete cycle as not assessed rather than N/A", () => {
    const bundle = bundleV2(validationContextV1(false));

    expect(bundle.records.every(({ applicability, assessment }) =>
      applicability.state === "applicable"
      && assessment.state === "not-assessed"
      && assessment.reason === "not-run"
    )).toBe(true);
  });

  it("requires an explicit rationale and matching assessment for N/A", () => {
    const bundle = bundleV2(validationContextV1(true));
    const record = bundle.records[0];
    if (record === undefined) throw new Error("test bundle has no records");
    const withoutRationale = withFirstRecordV2(bundle, {
      ...record,
      applicability: { state: "not-applicable", rationale: "" },
      assessment: {
        state: "not-assessed",
        reason: "not-applicable",
        rationale: "The rule does not apply to this scenario.",
      },
    });
    expect(() => assertScientificEvidenceBundleV2(withoutRationale))
      .toThrow(/applicability\.rationale/);

    const assessedNa = withFirstRecordV2(bundle, {
      ...record,
      applicability: {
        state: "not-applicable",
        rationale: "The rule does not apply to this scenario.",
      },
    });
    expect(() => assertScientificEvidenceBundleV2(assessedNa))
      .toThrow(/must be explicitly not assessed/);
  });

  it("rejects unknown runtime discriminants and evidence classifications", () => {
    const bundle = bundleV2(validationContextV1(true));
    const profile = bundle.profiles[0];
    const rule = bundle.rules[0];
    const record = bundle.records[0];
    if (profile === undefined || rule === undefined || record === undefined) {
      throw new Error("test bundle is incomplete");
    }

    expect(() => assertScientificEvidenceBundleV2(withFirstProfileV2(bundle, {
      ...profile,
      evidenceRole: "unknown" as never,
    }))).toThrow(/evidence role is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRuleV2(bundle, {
      ...rule,
      domain: "unknown" as never,
    }))).toThrow(/domain is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRuleV2(bundle, {
      ...rule,
      modality: "unknown" as never,
    }))).toThrow(/modality is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRuleV2(bundle, {
      ...rule,
      scope: "unknown" as never,
    }))).toThrow(/scope is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRuleV2(bundle, {
      ...rule,
      applicability: { kind: "unknown" } as never,
    }))).toThrow(/unknown applicability kind/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      evidenceUse: { ...record.evidenceUse, role: "unknown" as never },
    }))).toThrow(/evidence role is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      applicability: { state: "unknown" } as never,
    }))).toThrow(/unknown applicability state/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      assessment: { state: "unknown" } as never,
    }))).toThrow(/unknown assessment state/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      assessment: {
        state: "assessed",
        outcome: "unknown" as never,
        severity: "none",
      },
    }))).toThrow(/assessment outcome is invalid/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      assessment: {
        state: "not-assessed",
        reason: "unknown" as never,
        rationale: "Invalid persisted input.",
      },
    }))).toThrow(/not-assessed reason is invalid/);
  });

  it("binds record units and source provenance across all evidence layers", () => {
    const bundle = bundleV2(validationContextV1(true));
    const profile = bundle.profiles[0];
    const rule = bundle.rules[0];
    const record = bundle.records[0];
    const reference = profile?.references[0];
    if (profile === undefined || rule === undefined || record === undefined
      || reference === undefined) {
      throw new Error("test bundle has no evidence provenance fixture");
    }

    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      unit: "wrong-unit",
    }))).toThrow(/metric definition unit/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRecordV2(bundle, {
      ...record,
      sourceIds: ["undeclared-record-source"],
    }))).toThrow(/source not declared by its rule/);
    expect(() => assertScientificEvidenceBundleV2(withFirstRuleV2(bundle, {
      ...rule,
      sourceIds: ["undeclared-rule-source"],
    }))).toThrow(/source not declared by its profile/);
    expect(() => assertScientificEvidenceBundleV2(withFirstProfileV2(bundle, {
      ...profile,
      references: [...profile.references, reference],
    }))).toThrow(/sourceIds contains duplicate/);
  });
});

function bundleV2(
  validation: ScientificProductValidationContextV1,
): ScientificEvidenceBundleV2 {
  return createScientificProductEvidenceBundleV2({
    subjectRef: Object.freeze({
      kind: "scenario" as const,
      subjectId: "evidence-contract-test-scenario",
      label: "Evidence contract test scenario",
    }),
    releaseRef: RELEASE_REF,
    controlStateSha256: "b".repeat(64),
    parameterEpoch: 3,
    validation,
  });
}

function validationContextV1(
  cycleAvailable: boolean,
): ScientificProductValidationContextV1 {
  return Object.freeze({
    cycleAvailable,
    cycleEvidence: cycleAvailable
      ? "validated-periodic-P1" as const
      : "unavailable" as const,
    numericalIntegrityPackId: MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId,
    referenceContextPackId:
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId,
    referenceSubject:
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject,
    numericalResults: cycleAvailable
      ? Object.freeze(MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates.map(
        (gate, index) => Object.freeze({
          gateId: gate.gateId,
          label: gate.gateId,
          value: index === 0 ? 1e-4 : 0,
          unit: gate.metricId.endsWith("_ml") ? "mL" : "1",
          lowerInclusive: gate.lowerInclusive,
          upperInclusive: gate.upperInclusive,
          status: index === 0 ? "error" as const : "pass" as const,
          interpretation: gate.interpretation,
        }),
      ))
      : Object.freeze([]),
    referenceResults: cycleAvailable
      ? Object.freeze(MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates.map(
        (gate, index) => Object.freeze({
          gateId: gate.gateId,
          label: gate.gateId,
          value: index === 0 ? 120 : gate.lowerInclusive,
          unit: referenceUnitV1(gate.metricId),
          lowerInclusive: gate.lowerInclusive,
          upperInclusive: gate.upperInclusive,
          status: index === 0
            ? "outside-reference" as const
            : "within-reference" as const,
          interpretation: gate.interpretation,
          sourceIds: gate.sourceIds,
        }),
      ))
      : Object.freeze([]),
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

function withFirstRecordV2(
  bundle: ScientificEvidenceBundleV2,
  firstRecord: ScientificEvidenceBundleV2["records"][number],
): ScientificEvidenceBundleV2 {
  return {
    ...bundle,
    records: [firstRecord, ...bundle.records.slice(1)],
  };
}

function withFirstProfileV2(
  bundle: ScientificEvidenceBundleV2,
  profile: ScientificEvidenceBundleV2["profiles"][number],
): ScientificEvidenceBundleV2 {
  return {
    ...bundle,
    profiles: [profile, ...bundle.profiles.slice(1)],
  };
}

function withFirstRuleV2(
  bundle: ScientificEvidenceBundleV2,
  rule: ScientificEvidenceBundleV2["rules"][number],
): ScientificEvidenceBundleV2 {
  return {
    ...bundle,
    rules: [rule, ...bundle.rules.slice(1)],
  };
}
