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

export type ScientificEvidenceParentDirectionComparatorV2 = Readonly<{
  kind: "parent-direction";
  expectedDirection: "higher" | "lower";
  minimumAbsoluteDifferenceExclusive: number;
  parentRole: "declared-healthy-parent";
}>;

export type ScientificEvidenceComparatorV2 =
  | ScientificEvidenceAbsoluteRangeComparatorV2
  | ScientificEvidenceParentDirectionComparatorV2;

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
  domain: ScientificEvidenceDomainV2;
  evidenceRole: ScientificEvidenceRoleV2;
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

export type ScientificEvidenceScenarioDefinitionRefV2 = Readonly<{
  scenarioId: string;
  scenarioVersion: string;
  sha256: string;
}>;

export type ScientificEvidenceMatchedContextRefV2 = Readonly<{
  contextId: string;
  contextVersion: string;
  sha256: string;
  declaredInvariantIds: readonly string[];
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
      | "not-run"
      | "prerequisite-failed";
    rationale: string;
  }>
  | Readonly<{
    state: "error";
    rationale: string;
  }>;

export type ScientificEvidenceUseV2 = Readonly<{
  role: ScientificEvidenceRoleV2;
  rationale: string;
  datasetRefs: readonly ScientificEvidenceDatasetRefV2[];
}>;

export type ScientificEvidenceDatasetRefV2 = Readonly<{
  datasetId: string;
  datasetVersion: string;
  sha256: string;
  use: "calibration" | "held-out-validation" | "reference-context";
}>;

export type ScientificEvidenceComparisonTargetV2 = Readonly<{
  relationship: "declared-healthy-parent";
  bundleId: string;
  declaredBundleContentSha256: string;
  subjectRef: ScientificEvidenceSubjectRefV2;
  scenarioDefinitionRef: ScientificEvidenceScenarioDefinitionRefV2;
  matchedContextRef: ScientificEvidenceMatchedContextRefV2;
  releaseRef: SimulationReleaseRef;
}>;

export type ScientificEvidenceComparisonObservationV2 = Readonly<{
  kind: "subject-record";
  recordId: string;
  metricRef: ScientificEvidenceMetricRefV2;
  observedValue: number;
  unit: string;
  controlStateSha256: string | null;
  parameterEpoch: number | null;
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
  scenarioDefinitionRef?: ScientificEvidenceScenarioDefinitionRefV2;
  matchedContextRef?: ScientificEvidenceMatchedContextRefV2;
  comparisonTarget?: ScientificEvidenceComparisonTargetV2;
  comparison?: ScientificEvidenceComparisonObservationV2;
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
  assertSubjectRefV2(bundle.subjectRef, "subjectRef");
  assertReleaseRefV2(bundle.releaseRef, "releaseRef");

  for (const definition of bundle.metricDefinitions) {
    requireTextV2(definition.metricId, "metricDefinition.metricId");
    requireTextV2(definition.metricVersion, "metricDefinition.metricVersion");
    requireTextV2(definition.label, "metricDefinition.label");
    requireTextV2(definition.unit, "metricDefinition.unit");
    requireTextV2(definition.description, "metricDefinition.description");
  }
  for (const profile of bundle.profiles) assertProfileV2(profile);
  for (const rule of bundle.rules) assertRuleV2(rule);
  for (const record of bundle.records) {
    requireTextV2(record.recordId, "record.recordId");
  }

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

  const profilesByKey = new Map(bundle.profiles.map((profile) => [
    `${profile.profileId}@${profile.profileVersion}`,
    profile,
  ]));
  const rulesByKey = new Map(bundle.rules.map((rule) => [
    `${rule.ruleId}@${rule.ruleVersion}`,
    rule,
  ]));
  const metricDefinitionsByKey = new Map(bundle.metricDefinitions.map(
    (definition) => [
      `${definition.metricId}@${definition.metricVersion}`,
      definition,
    ],
  ));

  for (const rule of bundle.rules) {
    requireRefV2(metricKeys, metricKeyV2(rule.metricRef), "rule metric");
    requireRefV2(profileKeys, profileKeyV2(rule.profileRef), "rule profile");
    const profile = profilesByKey.get(profileKeyV2(rule.profileRef));
    if (profile === undefined || profile.domain !== rule.domain) {
      throw new Error(`assessment rule ${rule.ruleId} mismatches its profile domain`);
    }
    if (!profile.ruleRefs.some((ref) => ruleKeyV2(ref) === ruleKeyV2(rule))) {
      throw new Error(`assessment rule ${rule.ruleId} is not owned by its profile`);
    }
    const declaredSourceIds = new Set(
      profile.references.map(({ sourceId }) => sourceId),
    );
    if (rule.sourceIds.some((sourceId) => !declaredSourceIds.has(sourceId))) {
      throw new Error(
        `assessment rule ${rule.ruleId} cites a source not declared by its profile`,
      );
    }
    assertComparatorV2(rule);
  }

  for (const profile of bundle.profiles) {
    for (const ruleRef of profile.ruleRefs) {
      requireRefV2(ruleKeys, ruleKeyV2(ruleRef), "profile rule");
      const rule = rulesByKey.get(ruleKeyV2(ruleRef));
      if (rule === undefined
        || profileKeyV2(rule.profileRef) !== profileKeyV2(profile)) {
        throw new Error(
          `evidence profile ${profile.profileId} contains a rule owned by another profile`,
        );
      }
    }
  }

  for (const record of bundle.records) {
    assertSubjectRefV2(record.subjectRef, `record ${record.recordId} subjectRef`);
    assertReleaseRefV2(record.releaseRef, `record ${record.recordId} releaseRef`);
    assertApplicabilityResultV2(record);
    assertAssessmentResultV2(record);
    assertEvidenceUseV2(record);
    requireRefV2(ruleKeys, ruleKeyV2(record.ruleRef), "record rule");
    requireRefV2(metricKeys, metricKeyV2(record.metricRef), "record metric");
    if (record.subjectRef.kind !== bundle.subjectRef.kind
      || record.subjectRef.subjectId !== bundle.subjectRef.subjectId) {
      throw new Error(`assessment record ${record.recordId} has another subject`);
    }
    if (!sameReleaseRefV2(record.releaseRef, bundle.releaseRef)) {
      throw new Error(`assessment record ${record.recordId} has another release`);
    }
    const rule = rulesByKey.get(ruleKeyV2(record.ruleRef));
    if (rule === undefined || metricKeyV2(rule.metricRef)
      !== metricKeyV2(record.metricRef)) {
      throw new Error(`assessment record ${record.recordId} mismatches its rule metric`);
    }
    const metricDefinition = metricDefinitionsByKey.get(
      metricKeyV2(record.metricRef),
    );
    requireTextV2(record.unit, `record ${record.recordId} unit`);
    if (metricDefinition === undefined || record.unit !== metricDefinition.unit) {
      throw new Error(
        `assessment record ${record.recordId} mismatches its metric definition unit`,
      );
    }
    requireArrayV2(record.sourceIds, `record ${record.recordId} sourceIds`);
    uniqueTextValuesV2(record.sourceIds, `record ${record.recordId} sourceIds`);
    const ruleSourceIds = new Set(rule.sourceIds);
    if (record.sourceIds.some((sourceId) => !ruleSourceIds.has(sourceId))) {
      throw new Error(
        `assessment record ${record.recordId} cites a source not declared by its rule`,
      );
    }
    const profile = profilesByKey.get(profileKeyV2(rule.profileRef));
    if (profile === undefined
      || profile.evidenceRole !== record.evidenceUse.role) {
      throw new Error(
        `assessment record ${record.recordId} mismatches its profile evidence role`,
      );
    }
    if (record.evidenceUse.role === "independent-validation"
      && (rule.domain !== "independent-validation"
        || !record.evidenceUse.datasetRefs.some(
          ({ use }) => use === "held-out-validation",
        ))) {
      throw new Error(
        `independent-validation record ${record.recordId} requires its domain and a content-addressed declared held-out dataset reference`,
      );
    }
    if (rule.domain === "independent-validation"
      && record.evidenceUse.role !== "independent-validation") {
      throw new Error(
        `independent-validation rule ${rule.ruleId} requires an independent-validation evidence role`,
      );
    }
    if (record.applicability.state === "not-applicable") {
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
    if (record.assessment.state === "assessed"
      && record.observedValue === null) {
      throw new Error(`assessed record ${record.recordId} has no observed value`);
    }
    assertRecordComparatorV2(record, rule);
  }
}

function assertProfileV2(profile: ScientificEvidenceProfileV2): void {
  requireTextV2(profile.profileId, "profile.profileId");
  requireTextV2(profile.profileVersion, "profile.profileVersion");
  requireEnumV2(profile.domain, [
    "numerical-verification",
    "reference-context",
    "scenario-contract",
    "independent-validation",
  ], `profile ${profile.profileId} domain`);
  requireEnumV2(profile.evidenceRole, [
    "numerical-verification",
    "construction-conformance",
    "calibration-evidence",
    "independent-validation",
    "directional-characterization",
    "exploratory-context",
  ], `profile ${profile.profileId} evidence role`);
  const allowedRolesByDomain: Readonly<
    Record<ScientificEvidenceDomainV2, readonly ScientificEvidenceRoleV2[]>
  > = {
    "numerical-verification": ["numerical-verification"],
    "reference-context": ["calibration-evidence", "exploratory-context"],
    "scenario-contract": [
      "construction-conformance",
      "directional-characterization",
    ],
    "independent-validation": ["independent-validation"],
  };
  if (!allowedRolesByDomain[profile.domain].includes(profile.evidenceRole)) {
    throw new Error(
      `evidence profile ${profile.profileId} has an incompatible domain and evidence role`,
    );
  }
  requireTextV2(profile.title, `profile ${profile.profileId} title`);
  requireTextV2(
    profile.contextOfUse,
    `profile ${profile.profileId} contextOfUse`,
  );
  requireArrayV2(profile.ruleRefs, `profile ${profile.profileId} ruleRefs`);
  for (const ruleRef of profile.ruleRefs) {
    requireTextV2(ruleRef.ruleId, `profile ${profile.profileId} ruleRef.ruleId`);
    requireTextV2(
      ruleRef.ruleVersion,
      `profile ${profile.profileId} ruleRef.ruleVersion`,
    );
  }
  requireArrayV2(profile.references, `profile ${profile.profileId} references`);
  for (const reference of profile.references) {
    requireTextV2(reference.sourceId, `profile ${profile.profileId} sourceId`);
    requireTextV2(reference.citation, `profile ${profile.profileId} citation`);
    requireTextV2(reference.role, `profile ${profile.profileId} reference role`);
    if (reference.href !== null) {
      requireTextV2(reference.href, `profile ${profile.profileId} reference href`);
    }
  }
  uniqueTextValuesV2(
    profile.references.map(({ sourceId }) => sourceId),
    `profile ${profile.profileId} sourceIds`,
  );
  requireArrayV2(
    profile.claimBoundaries,
    `profile ${profile.profileId} claimBoundaries`,
  );
  uniqueTextValuesV2(
    profile.claimBoundaries,
    `profile ${profile.profileId} claimBoundaries`,
  );
}

function assertRuleV2(rule: ScientificEvidenceAssessmentRuleV2): void {
  requireTextV2(rule.ruleId, "rule.ruleId");
  requireTextV2(rule.ruleVersion, `rule ${rule.ruleId} ruleVersion`);
  requireTextV2(rule.metricRef.metricId, `rule ${rule.ruleId} metricId`);
  requireTextV2(
    rule.metricRef.metricVersion,
    `rule ${rule.ruleId} metricVersion`,
  );
  requireTextV2(rule.profileRef.profileId, `rule ${rule.ruleId} profileId`);
  requireTextV2(
    rule.profileRef.profileVersion,
    `rule ${rule.ruleId} profileVersion`,
  );
  requireEnumV2(rule.domain, [
    "numerical-verification",
    "reference-context",
    "scenario-contract",
    "independent-validation",
  ], `rule ${rule.ruleId} domain`);
  requireEnumV2(rule.modality, [
    "scalar-range",
    "direction",
    "ordering",
    "ratio",
    "waveform-shape",
    "relation",
    "conservation",
    "availability",
  ], `rule ${rule.ruleId} modality`);
  requireEnumV2(rule.scope, [
    "component",
    "assembly",
    "release",
    "preset",
    "scenario",
    "run",
  ], `rule ${rule.ruleId} scope`);
  switch (rule.applicability.kind) {
    case "unconditional":
      break;
    case "requirements":
      requireArrayV2(
        rule.applicability.requirements,
        `rule ${rule.ruleId} applicability requirements`,
      );
      if (rule.applicability.requirements.length === 0) {
        throw new Error(
          `rule ${rule.ruleId} applicability requirements must not be empty`,
        );
      }
      for (const requirement of rule.applicability.requirements) {
        requireTextV2(
          requirement.requirementId,
          `rule ${rule.ruleId} requirementId`,
        );
        requireTextV2(
          requirement.description,
          `rule ${rule.ruleId} requirement description`,
        );
      }
      break;
    default:
      throw new Error(`rule ${rule.ruleId} has an unknown applicability kind`);
  }
  requireTextV2(rule.interpretation, `rule ${rule.ruleId} interpretation`);
  requireArrayV2(rule.sourceIds, `rule ${rule.ruleId} sourceIds`);
  uniqueTextValuesV2(rule.sourceIds, `rule ${rule.ruleId} sourceIds`);
}

function assertApplicabilityResultV2(
  record: ScientificEvidenceAssessmentRecordV2,
): void {
  switch (record.applicability.state) {
    case "applicable":
      return;
    case "not-applicable":
      requireTextV2(record.applicability.rationale, "applicability.rationale");
      return;
    default:
      throw new Error(
        `assessment record ${record.recordId} has an unknown applicability state`,
      );
  }
}

function assertAssessmentResultV2(
  record: ScientificEvidenceAssessmentRecordV2,
): void {
  switch (record.assessment.state) {
    case "assessed":
      requireEnumV2(record.assessment.outcome, [
        "meets",
        "finding",
        "expected-deviation",
      ], `record ${record.recordId} assessment outcome`);
      requireEnumV2(record.assessment.severity, [
        "none",
        "information",
        "warning",
        "error",
      ], `record ${record.recordId} assessment severity`);
      return;
    case "not-assessed":
      requireEnumV2(record.assessment.reason, [
        "not-applicable",
        "no-target",
        "not-modeled",
        "source-unavailable",
        "not-run",
        "prerequisite-failed",
      ], `record ${record.recordId} not-assessed reason`);
      requireTextV2(record.assessment.rationale, "assessment.rationale");
      return;
    case "error":
      requireTextV2(record.assessment.rationale, "assessment.rationale");
      return;
    default:
      throw new Error(
        `assessment record ${record.recordId} has an unknown assessment state`,
      );
  }
}

function assertEvidenceUseV2(
  record: ScientificEvidenceAssessmentRecordV2,
): void {
  requireEnumV2(record.evidenceUse.role, [
    "numerical-verification",
    "construction-conformance",
    "calibration-evidence",
    "independent-validation",
    "directional-characterization",
    "exploratory-context",
  ], `record ${record.recordId} evidence role`);
  requireTextV2(record.evidenceUse.rationale, "evidenceUse.rationale");
  requireArrayV2(
    record.evidenceUse.datasetRefs,
    `record ${record.recordId} datasetRefs`,
  );
  for (const datasetRef of record.evidenceUse.datasetRefs) {
    assertDatasetRefV2(datasetRef, record.recordId);
  }
}

function assertComparatorV2(rule: ScientificEvidenceAssessmentRuleV2): void {
  switch (rule.comparator.kind) {
    case "absolute-range": {
      const { lowerInclusive, upperInclusive } = rule.comparator;
      if (lowerInclusive === null && upperInclusive === null) {
        throw new Error(`assessment rule ${rule.ruleId} has no range bound`);
      }
      if (lowerInclusive !== null && !Number.isFinite(lowerInclusive)) {
        throw new Error(`assessment rule ${rule.ruleId} has a non-finite lower bound`);
      }
      if (upperInclusive !== null && !Number.isFinite(upperInclusive)) {
        throw new Error(`assessment rule ${rule.ruleId} has a non-finite upper bound`);
      }
      if (lowerInclusive !== null && upperInclusive !== null
        && lowerInclusive > upperInclusive) {
        throw new Error(`assessment rule ${rule.ruleId} has an inverted range`);
      }
      return;
    }
    case "parent-direction":
      if (rule.modality !== "direction") {
        throw new Error(
          `parent-direction rule ${rule.ruleId} must use the direction modality`,
        );
      }
      if (!Number.isFinite(
        rule.comparator.minimumAbsoluteDifferenceExclusive,
      ) || rule.comparator.minimumAbsoluteDifferenceExclusive <= 0) {
        throw new Error(
          `parent-direction rule ${rule.ruleId} has an invalid minimum difference`,
        );
      }
      if (rule.comparator.expectedDirection !== "higher"
        && rule.comparator.expectedDirection !== "lower") {
        throw new Error(
          `parent-direction rule ${rule.ruleId} has an invalid expected direction`,
        );
      }
      if (rule.comparator.parentRole !== "declared-healthy-parent") {
        throw new Error(
          `parent-direction rule ${rule.ruleId} has an invalid parent role`,
        );
      }
      return;
    default:
      throw new Error(
        `assessment rule ${rule.ruleId} has an unknown comparator kind`,
      );
  }
}

function assertRecordComparatorV2(
  record: ScientificEvidenceAssessmentRecordV2,
  rule: ScientificEvidenceAssessmentRuleV2,
): void {
  if (rule.comparator.kind !== "parent-direction") {
    if (record.comparisonTarget !== undefined
      || record.comparison !== undefined) {
      throw new Error(
        `absolute-range record ${record.recordId} must not carry a parent comparison`,
      );
    }
    return;
  }
  if (record.scenarioDefinitionRef === undefined) {
    throw new Error(
      `parent-direction record ${record.recordId} has no scenario definition`,
    );
  }
  assertScenarioDefinitionRefV2(
    record.scenarioDefinitionRef,
    `record ${record.recordId} scenario definition`,
  );
  if (record.matchedContextRef === undefined) {
    throw new Error(
      `parent-direction record ${record.recordId} has no matched context`,
    );
  }
  assertMatchedContextRefV2(
    record.matchedContextRef,
    `record ${record.recordId} matched context`,
  );
  const target = record.comparisonTarget;
  if (target === undefined) {
    throw new Error(
      `parent-direction record ${record.recordId} has no comparison target`,
    );
  }
  if (target.relationship !== rule.comparator.parentRole) {
    throw new Error(
      `parent-direction record ${record.recordId} has the wrong comparison relationship`,
    );
  }
  requireTextV2(target.bundleId, "comparisonTarget.bundleId");
  requireSha256V2(
    target.declaredBundleContentSha256,
    "comparisonTarget.declaredBundleContentSha256",
  );
  assertSubjectRefV2(
    target.subjectRef,
    `record ${record.recordId} parent subjectRef`,
  );
  assertReleaseRefV2(
    target.releaseRef,
    `record ${record.recordId} parent releaseRef`,
  );
  assertScenarioDefinitionRefV2(
    target.scenarioDefinitionRef,
    `record ${record.recordId} parent scenario definition`,
  );
  assertMatchedContextRefV2(
    target.matchedContextRef,
    `record ${record.recordId} parent matched context`,
  );
  if ((record.scenarioDefinitionRef.scenarioId
        === target.scenarioDefinitionRef.scenarioId
      && record.scenarioDefinitionRef.scenarioVersion
        === target.scenarioDefinitionRef.scenarioVersion)
    || record.scenarioDefinitionRef.sha256
      === target.scenarioDefinitionRef.sha256) {
    throw new Error(
      `parent-direction record ${record.recordId} compares the same scenario definition`,
    );
  }
  if (record.subjectRef.kind === target.subjectRef.kind
    && record.subjectRef.subjectId === target.subjectRef.subjectId) {
    throw new Error(
      `parent-direction record ${record.recordId} compares the same subject`,
    );
  }
  if (!sameReleaseRefV2(record.releaseRef, target.releaseRef)) {
    throw new Error(
      `parent-direction record ${record.recordId} compares another release`,
    );
  }
  if (!sameMatchedContextRefV2(
    record.matchedContextRef,
    target.matchedContextRef,
  )) {
    throw new Error(
      `parent-direction record ${record.recordId} compares another matched context`,
    );
  }
  if (record.assessment.state !== "assessed") {
    if (record.comparison !== undefined) {
      throw new Error(
        `unassessed parent-direction record ${record.recordId} must not carry a comparison observation`,
      );
    }
    return;
  }
  if (typeof record.observedValue !== "number"
    || !Number.isFinite(record.observedValue)) {
    throw new Error(
      `assessed parent-direction record ${record.recordId} has no finite numeric observation`,
    );
  }
  requireSha256V2(
    record.controlStateSha256,
    `record ${record.recordId} controlStateSha256`,
  );
  const comparison = record.comparison;
  if (comparison === undefined) {
    throw new Error(
      `assessed parent-direction record ${record.recordId} has no comparison observation`,
    );
  }
  if (comparison.kind !== "subject-record") {
    throw new Error(
      `parent-direction record ${record.recordId} has the wrong comparison observation kind`,
    );
  }
  requireTextV2(comparison.recordId, "comparison.recordId");
  requireSha256V2(
    comparison.controlStateSha256,
    `record ${record.recordId} comparison.controlStateSha256`,
  );
  if (metricKeyV2(record.metricRef) !== metricKeyV2(comparison.metricRef)) {
    throw new Error(
      `parent-direction record ${record.recordId} compares another metric`,
    );
  }
  if (record.unit !== comparison.unit) {
    throw new Error(
      `parent-direction record ${record.recordId} compares another unit`,
    );
  }
  if (!Number.isFinite(comparison.observedValue)) {
    throw new Error(
      `parent-direction record ${record.recordId} has a non-finite comparison observation`,
    );
  }
  const difference = rule.comparator.expectedDirection === "higher"
    ? record.observedValue - comparison.observedValue
    : comparison.observedValue - record.observedValue;
  const meets = difference
    > rule.comparator.minimumAbsoluteDifferenceExclusive;
  const expectedOutcome = meets ? "meets" : "finding";
  const expectedSeverity = meets ? "none" : "warning";
  if (record.assessment.outcome !== expectedOutcome
    || record.assessment.severity !== expectedSeverity) {
    throw new Error(
      `parent-direction record ${record.recordId} has an assessment inconsistent with its observations`,
    );
  }
}

function sameMatchedContextRefV2(
  left: ScientificEvidenceMatchedContextRefV2,
  right: ScientificEvidenceMatchedContextRefV2,
): boolean {
  return left.contextId === right.contextId
    && left.contextVersion === right.contextVersion
    && left.sha256 === right.sha256
    && left.declaredInvariantIds.length === right.declaredInvariantIds.length
    && left.declaredInvariantIds.every(
      (value, index) => value === right.declaredInvariantIds[index],
    );
}

function assertScenarioDefinitionRefV2(
  ref: ScientificEvidenceScenarioDefinitionRefV2,
  label: string,
): void {
  requireTextV2(ref.scenarioId, `${label}.scenarioId`);
  requireTextV2(ref.scenarioVersion, `${label}.scenarioVersion`);
  requireSha256V2(ref.sha256, `${label}.sha256`);
}

function assertMatchedContextRefV2(
  ref: ScientificEvidenceMatchedContextRefV2,
  label: string,
): void {
  requireTextV2(ref.contextId, `${label}.contextId`);
  requireTextV2(ref.contextVersion, `${label}.contextVersion`);
  requireSha256V2(ref.sha256, `${label}.sha256`);
  if (ref.declaredInvariantIds.length === 0) {
    throw new Error(`${label}.declaredInvariantIds must not be empty`);
  }
  uniqueTextValuesV2(ref.declaredInvariantIds, `${label}.declaredInvariantIds`);
}

function assertDatasetRefV2(
  ref: ScientificEvidenceDatasetRefV2,
  recordId: string,
): void {
  requireTextV2(ref.datasetId, `record ${recordId} datasetRef.datasetId`);
  requireTextV2(
    ref.datasetVersion,
    `record ${recordId} datasetRef.datasetVersion`,
  );
  requireSha256V2(ref.sha256, `record ${recordId} datasetRef.sha256`);
  if (ref.use !== "calibration"
    && ref.use !== "held-out-validation"
    && ref.use !== "reference-context") {
    throw new Error(`record ${recordId} datasetRef.use is invalid`);
  }
}

function sameReleaseRefV2(
  left: SimulationReleaseRef,
  right: SimulationReleaseRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256;
}

function assertSubjectRefV2(
  ref: ScientificEvidenceSubjectRefV2,
  label: string,
): void {
  requireEnumV2(ref.kind, ["release", "preset", "scenario", "run"], `${label}.kind`);
  requireTextV2(ref.subjectId, `${label}.subjectId`);
  requireTextV2(ref.label, `${label}.label`);
}

function assertReleaseRefV2(
  ref: SimulationReleaseRef,
  label: string,
): void {
  requireTextV2(ref.id, `${label}.id`);
  requireTextV2(ref.version, `${label}.version`);
  requireSha256V2(ref.sha256, `${label}.sha256`);
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

function requireTextV2(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must not be empty`);
  }
}

function requireSha256V2(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase 64-character SHA-256 digest`);
  }
}

function requireEnumV2<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): asserts value is T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} is invalid`);
  }
}

function requireArrayV2(
  value: unknown,
  label: string,
): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function uniqueTextValuesV2(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    requireTextV2(value, label);
    if (seen.has(value)) throw new Error(`${label} contains duplicate ${value}`);
    seen.add(value);
  }
}
