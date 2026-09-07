/** Evidence admission is separate from numerical pass/fail and from fitting. */
export type FittingGateSourceV1 = Readonly<{
  sourceId: string;
  kind: "paper" | "dataset";
  title: string;
  url: string;
  verification: "passage-checked" | "context-only";
}>;

export type FittingGateRepositoryReferenceV1 = Readonly<{
  path: string;
  locator: string;
}>;

export type FittingGateSupportV1 = Readonly<{
  kind: "empirical";
  sourceId: string;
  locator: string;
  verification: "passage-checked" | "context-only";
  populationAndProtocol: string;
  sourceObservation: string;
  sourceRange: string;
  operatorMappingAndLimitations: string;
  boundRationale: string;
}> | Readonly<{
  kind: "numerical-contract" | "engineering-guard";
  specification: FittingGateRepositoryReferenceV1;
  regression: FittingGateRepositoryReferenceV1;
  cutoffRationale: string;
  applicabilityAndLimitations: string;
  physiologicalNormalityClaimed: false;
}>;

export type FittingGateProvenanceV1 = Readonly<{
  gateId: string;
  basis: FittingGateSupportV1["kind"];
  observationMethodId: string;
  measurementMeaning: string;
  protocol: string;
  support: readonly FittingGateSupportV1[];
}>;

export type FittingGateProvenanceAssessmentV1 = Readonly<{
  status: "evidence-ready" | "draft";
  issues: readonly Readonly<{ gateId: string; reason: string }>[];
  // A verified citation is necessary, not sufficient, for scientific validity.
  physiologicalValidationClaimed: false;
}>;

const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function portableRepositoryReferenceV1(ref: FittingGateRepositoryReferenceV1): boolean {
  return !!ref && nonempty(ref.path) && nonempty(ref.locator)
    && !ref.path.startsWith("/") && !ref.path.includes("\\")
    && !ref.path.split("/").some(part => part === ".." || part === "." || part === "")
    && !ref.path.includes(":");
}

/**
 * Per-gate support cannot be borrowed from another check in the same group.
 * The caller supplies repository resolution; no browser filesystem or network
 * lookup is introduced. Missing checks, sources and observations fail closed.
 */
export function assessFittingGateProvenanceV1(input: Readonly<{
  requiredGateIds: readonly string[];
  gates: readonly FittingGateProvenanceV1[];
  sources: readonly FittingGateSourceV1[];
  resolveRepositoryReference: (ref: FittingGateRepositoryReferenceV1) => boolean;
}>): FittingGateProvenanceAssessmentV1 {
  const issues: { gateId: string; reason: string }[] = [];
  const add = (gateId: string, reason: string) => issues.push({ gateId, reason });
  const sourceIds = new Set(input.sources.map(source => source.sourceId));
  const verifiedSourceIds = new Set(input.sources.filter(source => source.verification === "passage-checked")
    .map(source => source.sourceId));
  if (sourceIds.size !== input.sources.length) add("registry", "duplicate source identity");
  for (const source of input.sources) {
    let urlValid = false;
    try { urlValid = new URL(source.url).protocol === "https:"; } catch { /* invalid */ }
    if (!nonempty(source.sourceId) || !nonempty(source.title) || !urlValid
      || !["paper", "dataset"].includes(source.kind)
      || !["passage-checked", "context-only"].includes(source.verification)) add("registry", "invalid empirical source");
  }
  const ids = input.gates.map(gate => gate.gateId);
  const required = new Set(input.requiredGateIds);
  if (required.size === 0 || required.size !== input.requiredGateIds.length
    || input.requiredGateIds.some(id => !nonempty(id))) add("registry", "invalid required gate inventory");
  if (new Set(ids).size !== ids.length) add("registry", "duplicate gate provenance");
  for (const id of required) if (!ids.includes(id)) add(id, "missing gate provenance");
  for (const gate of input.gates) {
    if (!required.has(gate.gateId)) add(gate.gateId, "unregistered gate provenance");
    if (!nonempty(gate.observationMethodId) || !nonempty(gate.measurementMeaning)
      || !nonempty(gate.protocol)) add(gate.gateId, "missing observation or protocol");
    if (!["empirical", "numerical-contract", "engineering-guard"].includes(gate.basis)) {
      add(gate.gateId, "unknown gate basis");
    }
    const support = gate.support.filter(item => {
      if (item.kind !== gate.basis) return false;
      if (item.kind === "empirical") {
        return verifiedSourceIds.has(item.sourceId) && item.verification === "passage-checked"
          && [item.locator, item.populationAndProtocol, item.sourceObservation,
            item.sourceRange, item.operatorMappingAndLimitations, item.boundRationale].every(nonempty);
      }
      return item.physiologicalNormalityClaimed === false
        && nonempty(item.cutoffRationale) && nonempty(item.applicabilityAndLimitations)
        && [item.specification, item.regression].every(ref =>
          portableRepositoryReferenceV1(ref) && input.resolveRepositoryReference(ref));
    });
    if (support.length === 0) add(gate.gateId, "no resolved, gate-specific support for its declared basis");
  }
  return Object.freeze({ status: issues.length ? "draft" : "evidence-ready",
    issues: Object.freeze(issues.map(issue => Object.freeze(issue))), physiologicalValidationClaimed: false });
}

export function assertFittingGateProvenanceReadyV1(
  assessment: FittingGateProvenanceAssessmentV1,
): void {
  if (assessment.status !== "evidence-ready" || assessment.issues.length !== 0) {
    throw new Error("Fitting reference evidence admission rejected: "
      + assessment.issues.map(issue => `${issue.gateId}: ${issue.reason}`).join("; "));
  }
}
