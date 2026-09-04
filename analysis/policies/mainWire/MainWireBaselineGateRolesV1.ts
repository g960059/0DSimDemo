import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";

/** Roles qualify a construction decision, not the numerical observations. */
export type MainWireBaselineGateRoleV1 =
  | "numerical-quality"
  | "physiological-target"
  | "construction-guard"
  | "reference-warning";

export const MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID = evidence.evaluationPolicyId;
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

/** A reference corridor must never excuse an unavailable or invalid signal. */
export function mainWireBaselineCheckBlocksV1(check: CheckV1): boolean {
  const role = mainWireBaselineGateRoleV1(check.checkId);
  if (!Number.isFinite(check.actual) || !Number.isFinite(check.minimum)
    || !Number.isFinite(check.maximum) || check.minimum > check.maximum
    || !["passed", "failed"].includes(check.status)) return true;
  if (role === "reference-warning") {
    // A nonconstant periodic pressure must have both rising and falling limbs.
    if (check.checkId.endsWith(".maximum-dpdt")) return check.actual <= 0;
    if (check.checkId.endsWith(".minimum-dpdt")) return check.actual >= 0;
    return false;
  }
  return check.status !== "passed"
    || check.actual < check.minimum || check.actual > check.maximum;
}

export function mainWireBaselineCheckWarnsV1(check: CheckV1): boolean {
  return mainWireBaselineGateRoleV1(check.checkId) === "reference-warning"
    && !mainWireBaselineCheckBlocksV1(check)
    && (check.status !== "passed" || check.actual < check.minimum || check.actual > check.maximum);
}

export function assertMainWireBaselineCheckCoverageV1(checks: readonly CheckV1[]): void {
  const ids = new Set(checks.map(({ checkId }) => checkId));
  if (ids.size !== checks.length || ids.size !== roles.size
    || [...roles.keys()].some((id) => !ids.has(id))) {
    throw new Error("Standard70 baseline check coverage differs from evidence registry");
  }
}
