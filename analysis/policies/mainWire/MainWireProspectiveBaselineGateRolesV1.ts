import evidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";

/** Reviewed assessment's roundoff-only comparison; no discretization slack. */
export function mainWireBaselineRangeIncludesWithRoundoffV1(actual: number, minimum: number, maximum: number): boolean {
  if (![actual, minimum, maximum].every(Number.isFinite) || minimum > maximum) return false;
  const tolerance = 1024 * Number.EPSILON * Math.max(1, Math.abs(actual), Math.abs(minimum), Math.abs(maximum));
  return actual >= minimum - tolerance && actual <= maximum + tolerance;
}

/** Roles qualify a construction decision, not the numerical observations. */
export type MainWireBaselineGateRoleV1 =
  | "numerical-quality"
  | "physiological-target"
  | "construction-guard"
  | "reference-warning";

export const MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID = evidence.evaluationPolicyId;
// Still pinned by the published launch baseline; only its pressure-rate
// corridors were advisory. Never reinterpret its contour checks as warnings.
export const MAIN_WIRE_BASELINE_PRESSURE_RATE_ONLY_GATE_ROLES_V1_ID =
  "main-wire-standard70-baseline-evaluation-roles-v1";
export const MAIN_WIRE_BASELINE_CONTOUR_WARNING_GATE_ROLES_V2_ID =
  "main-wire-standard70-baseline-evaluation-roles-v2";
export const MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 = evidence.checkGroups
  .filter((group) => group.analysisPartition === "objective");

type CheckV1 = Readonly<{
  checkId: string;
  status: "passed" | "failed";
  actual: number;
  minimum: number;
  maximum: number;
}>;

const roles = new Map<string, MainWireBaselineGateRoleV1>();
for (const group of evidence.checkGroups) {
  const role = group.evaluationRole as MainWireBaselineGateRoleV1;
  if (!["numerical-quality", "physiological-target", "construction-guard", "reference-warning"].includes(role)) {
    throw new Error(`Unknown baseline gate role: ${role}`);
  }
  for (const id of group.checkIds) {
    if (roles.has(id)) throw new Error(`Duplicate baseline gate evidence: ${id}`);
    roles.set(id, role);
  }
}

export function mainWireBaselineGateRoleV1(checkId: string): MainWireBaselineGateRoleV1 {
  const role = roles.get(checkId);
  if (role === undefined) throw new Error(`Missing baseline gate evidence: ${checkId}`);
  return role;
}

export function mainWireBaselineGateRoleUnderPolicyV1(checkId: string, policyId: string): MainWireBaselineGateRoleV1 {
  if (policyId !== MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID
    && policyId !== MAIN_WIRE_BASELINE_PRESSURE_RATE_ONLY_GATE_ROLES_V1_ID
    && policyId !== MAIN_WIRE_BASELINE_CONTOUR_WARNING_GATE_ROLES_V2_ID) {
    throw new Error(`Unknown baseline evaluation policy: ${policyId}`);
  }
  const role = mainWireBaselineGateRoleV1(checkId);
  if (policyId === MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID) return role;
  // The two still-referenced historical policies are frozen explicitly, never
  // inferred from a mutable current registry when interpreting old reports.
  if (checkId.endsWith("-dpdt")) return "reference-warning";
  if (checkId.endsWith(".rounded-not-plateau")) return policyId === MAIN_WIRE_BASELINE_PRESSURE_RATE_ONLY_GATE_ROLES_V1_ID
    ? "construction-guard" : "reference-warning";
  if (checkId === "settlement.period1") return "numerical-quality";
  if (checkId.startsWith("waveform.") || checkId.endsWith("-gradient")) return "construction-guard";
  return "physiological-target";
}

/** A reference corridor must never excuse an unavailable or invalid signal. */
export function mainWireBaselineCheckBlocksV1(check: CheckV1): boolean {
  return mainWireBaselineCheckBlocksUnderPolicyV1(check, MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID);
}

export function mainWireBaselineCheckBlocksUnderPolicyV1(check: CheckV1, policyId: string): boolean {
  const role = mainWireBaselineGateRoleUnderPolicyV1(check.checkId, policyId);
  if (!Number.isFinite(check.actual) || !Number.isFinite(check.minimum)
    || !Number.isFinite(check.maximum) || check.minimum > check.maximum
    || !["passed", "failed"].includes(check.status)) return true;
  if (role === "reference-warning") {
    // A nonconstant periodic pressure must have both rising and falling limbs.
    if (check.checkId.endsWith(".maximum-dpdt")) return check.actual <= 0;
    if (check.checkId.endsWith(".minimum-dpdt")) return check.actual >= 0;
    // Either reported contour component is a fraction by construction. A
    // warning corridor does not admit corrupt or impossible observations.
    if (check.checkId.endsWith(".rounded-not-plateau")) return check.actual < 0 || check.actual > 1;
    if (check.checkId.endsWith(".peak-e-to-a") || check.checkId.startsWith("timing.")
      || check.checkId.startsWith("right-timing.")) return check.actual <= 0;
    return false;
  }
  return check.status !== "passed"
    || !mainWireBaselineRangeIncludesWithRoundoffV1(check.actual, check.minimum, check.maximum);
}

export function mainWireBaselineCheckWarnsV1(check: CheckV1): boolean {
  return mainWireBaselineCheckWarnsUnderPolicyV1(check, MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID);
}

export function mainWireBaselineCheckWarnsUnderPolicyV1(check: CheckV1, policyId: string): boolean {
  return mainWireBaselineGateRoleUnderPolicyV1(check.checkId, policyId) === "reference-warning"
    && !mainWireBaselineCheckBlocksUnderPolicyV1(check, policyId)
    && (check.status !== "passed"
      || !mainWireBaselineRangeIncludesWithRoundoffV1(check.actual, check.minimum, check.maximum));
}

export function assertMainWireBaselineCheckCoverageV1(checks: readonly CheckV1[]): void {
  const ids = new Set(checks.map(({ checkId }) => checkId));
  if (ids.size !== checks.length || ids.size !== roles.size
    || [...roles.keys()].some((id) => !ids.has(id))) {
    throw new Error("Standard70 baseline check coverage differs from evidence registry");
  }
}
