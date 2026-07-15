import {
  evaluateStrictAffineConstraintMarginsV1,
  normalizeStrictAffineConstraintsV1,
  type StrictAffineConstraintV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import {
  buildPhaseB1NewtonUnknownLabelsV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID =
  "four-chamber-phase-b1-land-simplex-newton-domain-v1" as const;

export type PhaseB1LandSimplexNewtonDomainV1 = Readonly<{
  domainId: typeof PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 51 | 46;
  strictLowerBounds: readonly (number | null)[];
  strictAffineConstraints: readonly StrictAffineConstraintV1[];
  populationCoordinateRule: "CaTRPN-B-W-S-strictly-positive";
  upperOccupancyRule: "one-minus-CaTRPN-and-U-strictly-positive";
  projectionAllowed: false;
  hiddenClippingAllowed: false;
}>;

export function buildPhaseB1LandSimplexNewtonDomainV1(
  mode: PhaseB1SlsModeV1,
): PhaseB1LandSimplexNewtonDomainV1 {
  if (mode !== "on" && mode !== "off") {
    throw new Error("Phase B1 Land simplex SLS mode must be on or off");
  }
  const labels = buildPhaseB1NewtonUnknownLabelsV1(mode);
  const strictLowerBounds = labels.map((label) =>
    isStrictlyPositiveLandCoordinate(label) ? 0 : null);
  const constraints: StrictAffineConstraintV1[] = [];
  for (const wallId of WALL_IDS) {
    const caIndex = requiredLabelIndex(
      labels,
      `tissue.${wallId}.patch-0.land.CaTRPN`,
    );
    const bIndex = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.B`);
    const wIndex = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.W`);
    const sIndex = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.S`);
    constraints.push(Object.freeze({
      constraintId: `${wallId}.one-minus-CaTRPN-positive`,
      coefficients: basis(labels.length, [[caIndex, -1]]),
      lowerBound: -1,
    }));
    constraints.push(Object.freeze({
      constraintId: `${wallId}.unbound-population-U-positive`,
      coefficients: basis(labels.length, [
        [bIndex, -1],
        [wIndex, -1],
        [sIndex, -1],
      ]),
      lowerBound: -1,
    }));
  }
  const unknownCount = labels.length as 51 | 46;
  if (unknownCount !== (mode === "on" ? 51 : 46)) {
    throw new Error("Phase B1 Land domain disagrees with the Newton topology");
  }
  return Object.freeze({
    domainId: PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID,
    slsMode: mode,
    unknownCount,
    strictLowerBounds: Object.freeze(strictLowerBounds),
    strictAffineConstraints: normalizeStrictAffineConstraintsV1(
      Object.freeze(constraints),
      labels.length,
    ),
    populationCoordinateRule: "CaTRPN-B-W-S-strictly-positive",
    upperOccupancyRule: "one-minus-CaTRPN-and-U-strictly-positive",
    projectionAllowed: false,
    hiddenClippingAllowed: false,
  });
}

export function minimumPhaseB1LandSimplexMarginV1(
  unknowns: readonly number[],
  domain: PhaseB1LandSimplexNewtonDomainV1,
): number {
  if (unknowns.length !== domain.unknownCount) {
    throw new Error(`Phase B1 Land domain expected ${domain.unknownCount} unknowns`);
  }
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < unknowns.length; index += 1) {
    const value = requireFinite(unknowns[index], `unknowns[${index}]`);
    const lower = domain.strictLowerBounds[index];
    if (lower !== null) minimum = Math.min(minimum, value - lower);
  }
  for (const { margin } of evaluateStrictAffineConstraintMarginsV1(
    unknowns,
    domain.strictAffineConstraints,
  )) {
    minimum = Math.min(minimum, margin);
  }
  return requireFinite(minimum, "minimum Land simplex margin");
}

export function assertInsidePhaseB1LandSimplexNewtonDomainV1(
  unknowns: readonly number[],
  domain: PhaseB1LandSimplexNewtonDomainV1,
): void {
  const margin = minimumPhaseB1LandSimplexMarginV1(unknowns, domain);
  if (!(margin > 0)) {
    throw new Error("Phase B1 Land population state must be strictly inside its simplex");
  }
}

function isStrictlyPositiveLandCoordinate(label: string): boolean {
  return /\.land\.(CaTRPN|B|W|S)$/.test(label);
}

function requiredLabelIndex(labels: readonly string[], label: string): number {
  const index = labels.indexOf(label);
  if (index < 0) throw new Error(`Phase B1 Newton topology is missing ${label}`);
  return index;
}

function basis(
  dimension: number,
  entries: readonly (readonly [index: number, coefficient: number])[],
): readonly number[] {
  const coefficients = Array.from({ length: dimension }, () => 0);
  for (const [index, coefficient] of entries) {
    coefficients[index] = coefficient;
  }
  return Object.freeze(coefficients);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}
