import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const SCIENTIFIC_EVIDENCE_CONTRACT_V2_ID =
  "scientific-evidence-contract-v2" as const;

export type ScientificEvidenceDomainV2 =
  | "numerical-verification"
  | "reference-context"
  | "scenario-contract"
  | "independent-validation";

export type ScientificEvidenceModalityV2 =
  | "scalar-range"
  | "direction"
  | "ordering"
  | "ratio"
  | "waveform-shape"
  | "relation"
  | "conservation"
  | "availability";

export type ScientificEvidenceScopeV2 =
  | "component"
  | "assembly"
  | "release"
  | "preset"
  | "scenario"
  | "run";

export type ScientificEvidenceRoleV2 =
  | "numerical-verification"
  | "construction-conformance"
  | "calibration-evidence"
  | "independent-validation"
  | "directional-characterization"
  | "exploratory-context";

export type ScientificEvidenceMetricRefV2 = Readonly<{
  metricId: string;
  metricVersion: string;
}>;

export type ScientificEvidenceRuleRefV2 = Readonly<{
  ruleId: string;
  ruleVersion: string;
}>;

export type ScientificEvidenceProfileRefV2 = Readonly<{
  profileId: string;
  profileVersion: string;
}>;

export type ScientificEvidenceMetricDefinitionV2 = Readonly<{
  metricId: string;
  metricVersion: string;
  label: string;
  unit: string;
  description: string;
}>;

export type ScientificEvidenceAbsoluteRangeComparatorV2 = Readonly<{
  kind: "absolute-range";
  lowerInclusive: number | null;
  upperInclusive: number | null;
}>;

export type ScientificEvidenceComparatorV2 =
  ScientificEvidenceAbsoluteRangeComparatorV2;

export type ScientificEvidenceApplicabilityRuleV2 =
  | Readonly<{ kind: "unconditional" }>
  | Readonly<{
    kind: "requirements";
    requirements: readonly Readonly<{
      requirementId: string;
      description: string;
    }>[];
  }>;

export type ScientificEvidenceAssessmentRuleV2 = Readonly<{
  ruleId: string;
  ruleVersion: string;
  metricRef: ScientificEvidenceMetricRefV2;
  profileRef: ScientificEvidenceProfileRefV2;
  domain: ScientificEvidenceDomainV2;
  modality: ScientificEvidenceModalityV2;
  scope: ScientificEvidenceScopeV2;
  applicability: ScientificEvidenceApplicabilityRuleV2;
  comparator: ScientificEvidenceComparatorV2;
  interpretation: string;
  sourceIds: readonly string[];
}>;

export type ScientificEvidenceReferenceV2 = Readonly<{
  sourceId: string;
  citation: string;
  role: string;
  href: string | null;
}>;

export type ScientificEvidenceProfileV2 = Readonly<{
  profileId: string;
  profileVersion: string;
  title: string;
  contextOfUse: string;
  ruleRefs: readonly ScientificEvidenceRuleRefV2[];
  references: readonly ScientificEvidenceReferenceV2[];
  claimBoundaries: readonly string[];
}>;

export type ScientificEvidenceSubjectRefV2 = Readonly<{
  kind: "release" | "preset" | "scenario" | "run";
  subjectId: string;
  label: string;
}>;

export type ScientificEvidenceApplicabilityResultV2 =
  | Readonly<{ state: "applicable" }>
  | Readonly<{
    state: "not-applicable";
    rationale: string;
  }>;

export type ScientificEvidenceAssessmentResultV2 =
  | Readonly<{
    state: "assessed";
    outcome: "meets" | "finding" | "expected-deviation";
    severity: "none" | "information" | "warning" | "error";
  }>
  | Readonly<{
    state: "not-assessed";
    reason:
      | "not-applicable"
      | "no-target"
      | "not-modeled"
      | "source-unavailable"
      | "not-run";
    rationale: string;
  }>
  | Readonly<{
    state: "error";
    rationale: string;
  }>;

export type ScientificEvidenceUseV2 = Readonly<{
  role: ScientificEvidenceRoleV2;
  rationale: string;
  datasetRefs: readonly string[];
}>;

export type ScientificEvidenceAssessmentRecordV2 = Readonly<{
  recordId: string;
  subjectRef: ScientificEvidenceSubjectRefV2;
  releaseRef: SimulationReleaseRef;
  metricRef: ScientificEvidenceMetricRefV2;
  ruleRef: ScientificEvidenceRuleRefV2;
  observedValue: number | string | null;
  unit: string;
  applicability: ScientificEvidenceApplicabilityResultV2;
  assessment: ScientificEvidenceAssessmentResultV2;
  evidenceUse: ScientificEvidenceUseV2;
  sourceIds: readonly string[];
  controlStateSha256: string | null;
  parameterEpoch: number | null;
}>;

export type ScientificEvidenceBundleV2 = Readonly<{
  contractId: typeof SCIENTIFIC_EVIDENCE_CONTRACT_V2_ID;
  schemaVersion: 2;
  bundleId: string;
  subjectRef: ScientificEvidenceSubjectRefV2;
  releaseRef: SimulationReleaseRef;
  metricDefinitions: readonly ScientificEvidenceMetricDefinitionV2[];
  profiles: readonly ScientificEvidenceProfileV2[];
  rules: readonly ScientificEvidenceAssessmentRuleV2[];
  records: readonly ScientificEvidenceAssessmentRecordV2[];
}>;

/**
 * Runtime boundary for persisted or cross-worker evidence. It deliberately
 * validates relationships between the four contract layers instead of
 * inferring scientific meaning from labels or metric ids.
 */
export function assertScientificEvidenceBundleV2(
  bundle: ScientificEvidenceBundleV2,
): void {
  if (bundle.contractId !== SCIENTIFIC_EVIDENCE_CONTRACT_V2_ID
    || bundle.schemaVersion !== 2) {
    throw new Error("scientific evidence bundle has the wrong contract identity");
  }
  requireTextV2(bundle.bundleId, "bundleId");
  requireTextV2(bundle.subjectRef.subjectId, "subjectRef.subjectId");

  const metricKeys = uniqueKeysV2(
    bundle.metricDefinitions,
    ({ metricId, metricVersion }) => `${metricId}@${metricVersion}`,
    "metric definition",
  );
  const profileKeys = uniqueKeysV2(
    bundle.profiles,
    ({ profileId, profileVersion }) => `${profileId}@${profileVersion}`,
    "evidence profile",
  );
  const ruleKeys = uniqueKeysV2(
    bundle.rules,
    ({ ruleId, ruleVersion }) => `${ruleId}@${ruleVersion}`,
    "assessment rule",
  );
  uniqueKeysV2(bundle.records, ({ recordId }) => recordId, "assessment record");

  for (const rule of bundle.rules) {
    requireRefV2(metricKeys, metricKeyV2(rule.metricRef), "rule metric");
    requireRefV2(profileKeys, profileKeyV2(rule.profileRef), "rule profile");
    if (rule.comparator.lowerInclusive === null
      && rule.comparator.upperInclusive === null) {
      throw new Error(`assessment rule ${rule.ruleId} has no range bound`);
    }
    if (rule.comparator.lowerInclusive !== null
      && rule.comparator.upperInclusive !== null
      && rule.comparator.lowerInclusive > rule.comparator.upperInclusive) {
      throw new Error(`assessment rule ${rule.ruleId} has an inverted range`);
    }
  }

  for (const profile of bundle.profiles) {
    for (const ruleRef of profile.ruleRefs) {
      requireRefV2(ruleKeys, ruleKeyV2(ruleRef), "profile rule");
    }
  }

  const rulesByKey = new Map(bundle.rules.map((rule) => [
    `${rule.ruleId}@${rule.ruleVersion}`,
    rule,
  ]));
  for (const record of bundle.records) {
    requireRefV2(ruleKeys, ruleKeyV2(record.ruleRef), "record rule");
    requireRefV2(metricKeys, metricKeyV2(record.metricRef), "record metric");
    if (record.subjectRef.kind !== bundle.subjectRef.kind
      || record.subjectRef.subjectId !== bundle.subjectRef.subjectId) {
      throw new Error(`assessment record ${record.recordId} has another subject`);
    }
    const rule = rulesByKey.get(ruleKeyV2(record.ruleRef));
    if (rule === undefined || metricKeyV2(rule.metricRef)
      !== metricKeyV2(record.metricRef)) {
      throw new Error(`assessment record ${record.recordId} mismatches its rule metric`);
    }
    requireTextV2(record.evidenceUse.rationale, "evidenceUse.rationale");
    if (record.applicability.state === "not-applicable") {
      requireTextV2(record.applicability.rationale, "applicability.rationale");
      if (record.assessment.state !== "not-assessed"
        || record.assessment.reason !== "not-applicable") {
        throw new Error(
          `not-applicable record ${record.recordId} must be explicitly not assessed`,
        );
      }
    } else if (record.assessment.state === "not-assessed"
      && record.assessment.reason === "not-applicable") {
      throw new Error(
        `applicable record ${record.recordId} cannot use a not-applicable assessment`,
      );
    }
    if (record.assessment.state === "not-assessed"
      || record.assessment.state === "error") {
      requireTextV2(record.assessment.rationale, "assessment.rationale");
    }
    if (record.assessment.state === "assessed"
      && record.observedValue === null) {
      throw new Error(`assessed record ${record.recordId} has no observed value`);
    }
  }
}

function metricKeyV2(ref: ScientificEvidenceMetricRefV2): string {
  return `${ref.metricId}@${ref.metricVersion}`;
}

function profileKeyV2(ref: ScientificEvidenceProfileRefV2): string {
  return `${ref.profileId}@${ref.profileVersion}`;
}

function ruleKeyV2(ref: ScientificEvidenceRuleRefV2): string {
  return `${ref.ruleId}@${ref.ruleVersion}`;
}

function uniqueKeysV2<T>(
  values: readonly T[],
  keyOf: (value: T) => string,
  label: string,
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const value of values) {
    const key = keyOf(value);
    requireTextV2(key, `${label} key`);
    if (keys.has(key)) throw new Error(`duplicate ${label} ${key}`);
    keys.add(key);
  }
  return keys;
}

function requireRefV2(
  keys: ReadonlySet<string>,
  key: string,
  label: string,
): void {
  if (!keys.has(key)) throw new Error(`${label} ${key} is not declared`);
}

function requireTextV2(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must not be empty`);
}
