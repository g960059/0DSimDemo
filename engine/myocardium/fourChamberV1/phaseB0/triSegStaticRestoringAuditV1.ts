import { diagnoseScaledJacobian2x2V1 } from
  "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import { evaluatePhaseB0AlgorithmicJacobianV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import { evaluatePublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import { evaluatePublishedTriSegTaylorOracle2009V1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

export const PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID =
  "phase-b0-published-taylor-triseg-static-restoring-audit-v1" as const;

export type PhaseB0TriSegStaticRestoringClassV1 =
  | "robust-restoring"
  | "robust-saddle"
  | "robust-antirestoring-maximum"
  | "indeterminate";

export type PhaseB0TriSegStaticRestoringPolicyV1 = Readonly<{
  coarseDerivativeScaledStep: number;
  fineDerivativeScaledStep: number;
  derivativeDisagreementMultiplier: number;
  relativeUncertaintyFloor: number;
  minimumRobustRestoringMargin: number;
  minimumRootJacobianSigmaMinimum: number;
  maximumRootJacobianConditionNumber2: number;
  maximumScaledRootResidualInfinityNorm: number;
  maximumScaledRootUpdateInfinityNorm: number;
  maximumGeneralizedForceTransformAuditDifference2: number;
}>;

export type PhaseB0TriSegStaticRestoringAuditV1 = Readonly<{
  auditId: typeof PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID;
  coordinates: PhaseB0TriSegCoordinatesV1;
  generalizedForceAtRoot: Readonly<{
    septalMidwallVolumePa: number;
    junctionRadiusN: number;
    definition:
      "G_Vms=(2/y_m)*sum(T_x); G_ym=(2*pi*y_m)*sum(T_y)";
    coordinateOrder: readonly ["septalMidwallCapVolumeM3", "junctionRadiusM"];
    residualOrder: readonly ["septalMidwallVolumePa", "junctionRadiusN"];
  }>;
  scaledRestoringTangent: Readonly<{
    coarse: readonly [number, number, number, number];
    fine: readonly [number, number, number, number];
    symmetricFine: readonly [number, number, number, number];
    skewFine: readonly [number, number, number, number];
    skewDefectTwoNorm: number;
    symmetricPartTwoNorm: number;
    relativeSkewDefect: number;
    eigenvaluesAscending: readonly [number, number];
    derivativeDisagreementTwoNorm: number;
    uncertaintyBound: number;
    robustSignedMargin: number;
    inertia: Readonly<{ positive: number; neutral: number; negative: number }>;
    classification: PhaseB0TriSegStaticRestoringClassV1;
    interpretation:
      "work-conjugate-static-restoring-tangent-not-an-energy-hessian";
  }>;
  generalizedForceTransformAudit: Readonly<{
    independentlyDifferentiatedFine: readonly [number, number, number, number];
    productRuleFromPublishedResidualFine: readonly [number, number, number, number];
    differenceTwoNorm: number;
    tolerance: number;
    accepted: boolean;
  }>;
  rootRegularity: Readonly<{
    sigmaMinimum: number;
    conditionNumber2: number;
    scaledResidualInfinityNorm: number;
    scaledUpdateInfinityNorm: number;
    accepted: boolean;
  }>;
  policy: PhaseB0TriSegStaticRestoringPolicyV1;
  acceptedUnderLocalStaticRestoringTestReference: boolean;
  energeticStability: Readonly<{
    eligible: false;
    reason:
      "published-taylor-equilibrium-is-not-the-gradient-of-the-material-potential";
    energyMinimumClaimed: false;
    thermodynamicStabilityClaimed: false;
  }>;
  physiologicalRootClaimed: false;
  globalUniquenessClaimed: false;
}>;

type RootInputWithoutInitial = Omit<
  PhaseB0PublishedTriSegRootInputV1,
  "initialCoordinates"
>;

export function auditPhaseB0TriSegStaticRestoringRootV1(input: Readonly<{
  rootInput: RootInputWithoutInitial;
  root: PhaseB0PublishedTriSegRootSuccessV1;
  generalizedForceResidualScales: Readonly<{
    septalMidwallVolumePa: number;
    junctionRadiusN: number;
  }>;
  policy: PhaseB0TriSegStaticRestoringPolicyV1;
}>): PhaseB0TriSegStaticRestoringAuditV1 {
  validatePolicy(input.policy);
  const rootInput = input.rootInput;
  const coordinates = input.root.coordinates;
  const unknowns = coordinatesToVector(coordinates);
  const unknownScales = coordinatesToVector(rootInput.unknownScales);
  const generalizedForceScales = [
    requirePositiveFinite(
      input.generalizedForceResidualScales.septalMidwallVolumePa,
      "generalizedForceResidualScales.septalMidwallVolumePa",
    ),
    requirePositiveFinite(
      input.generalizedForceResidualScales.junctionRadiusN,
      "generalizedForceResidualScales.junctionRadiusN",
    ),
  ] as const;
  const lowerBounds = [null, rootInput.junctionRadiusLowerBoundM] as const;
  const evaluatePublishedResidual = (values: readonly number[]) => {
    const point = vectorToCoordinates(values);
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: rootInput.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: rootInput.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: point.septalMidwallCapVolumeM3,
      junctionRadiusM: point.junctionRadiusM,
      walls: rootInput.walls,
    });
    const wallStress = rootInput.evaluateWallStress(geometry);
    const oracle = evaluatePublishedTriSegTaylorOracle2009V1(
      geometry,
      wallStress.fiberKirchhoffStressPa,
    );
    return [
      requireFinite(oracle.equilibriumResidual.axialNPerM, "publishedResidual.axial"),
      requireFinite(oracle.equilibriumResidual.radialNPerM, "publishedResidual.radial"),
    ] as const;
  };
  const evaluateGeneralizedForce = (values: readonly number[]) => {
    const yM = requirePositiveFinite(values[1], "junctionRadiusM");
    const residual = evaluatePublishedResidual(values);
    return [
      2 * residual[0] / yM,
      2 * Math.PI * yM * residual[1],
    ] as const;
  };
  const derivativeOptions = (scaledStep: number, residualScales: readonly number[]) => ({
    unknownScales,
    residualScales,
    lowerBounds,
    scaledStep,
  } as const);
  const coarse = evaluatePhaseB0AlgorithmicJacobianV1(
    evaluateGeneralizedForce,
    unknowns,
    derivativeOptions(input.policy.coarseDerivativeScaledStep, generalizedForceScales),
  );
  const fine = evaluatePhaseB0AlgorithmicJacobianV1(
    evaluateGeneralizedForce,
    unknowns,
    derivativeOptions(input.policy.fineDerivativeScaledStep, generalizedForceScales),
  );
  const publishedFine = evaluatePhaseB0AlgorithmicJacobianV1(
    evaluatePublishedResidual,
    unknowns,
    derivativeOptions(input.policy.fineDerivativeScaledStep, [
      rootInput.equilibriumResidualScaleNPerM,
      rootInput.equilibriumResidualScaleNPerM,
    ]),
  );
  const coarseMatrix = matrixToTuple(coarse.scaledJacobian);
  const fineMatrix = matrixToTuple(fine.scaledJacobian);
  const symmetricFine = symmetricPart2x2(fineMatrix);
  const skewFine = skewPart2x2(fineMatrix);
  const eigenvaluesAscending = symmetricEigenvalues2x2(symmetricFine);
  const derivativeDisagreementTwoNorm = matrixTwoNorm2x2(
    subtractMatrix2x2(coarseMatrix, fineMatrix),
  );
  const symmetricPartTwoNorm = Math.max(
    Math.abs(eigenvaluesAscending[0]),
    Math.abs(eigenvaluesAscending[1]),
  );
  const uncertaintyBound = Math.max(
    input.policy.derivativeDisagreementMultiplier * derivativeDisagreementTwoNorm,
    input.policy.relativeUncertaintyFloor * Math.max(1, symmetricPartTwoNorm),
  );
  const inertia = classifyInertia(eigenvaluesAscending, uncertaintyBound);
  const classification = classifyRestoring(inertia);
  const robustSignedMargin = restoringMargin(
    classification,
    eigenvaluesAscending,
    uncertaintyBound,
  );
  const generalizedForceAtRootVector = evaluateGeneralizedForce(unknowns);
  const productRuleMatrix = scaledGeneralizedForceProductRuleMatrix({
    rawPublishedResidualJacobian: matrixToTuple(publishedFine.rawJacobian),
    publishedResidualAtRoot: evaluatePublishedResidual(unknowns),
    coordinates,
    unknownScales,
    generalizedForceScales,
  });
  const generalizedForceTransformAuditDifference2 = matrixTwoNorm2x2(
    subtractMatrix2x2(fineMatrix, productRuleMatrix),
  );
  const generalizedForceTransformAuditAccepted =
    generalizedForceTransformAuditDifference2
      <= input.policy.maximumGeneralizedForceTransformAuditDifference2;
  const rootRegularityAccepted =
    input.root.scaledJacobianDiagnostics.sigmaMinimum
      >= input.policy.minimumRootJacobianSigmaMinimum
    && input.root.scaledJacobianDiagnostics.conditionNumber2
      <= input.policy.maximumRootJacobianConditionNumber2
    && input.root.scaledResidualInfinityNorm
      <= input.policy.maximumScaledRootResidualInfinityNorm
    && input.root.scaledUpdateInfinityNorm
      <= input.policy.maximumScaledRootUpdateInfinityNorm;
  const acceptedUnderLocalStaticRestoringTestReference =
    classification === "robust-restoring"
    && robustSignedMargin >= input.policy.minimumRobustRestoringMargin
    && rootRegularityAccepted
    && generalizedForceTransformAuditAccepted;
  const skewDefectTwoNorm = matrixTwoNorm2x2(skewFine);

  return Object.freeze({
    auditId: PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
    coordinates,
    generalizedForceAtRoot: Object.freeze({
      septalMidwallVolumePa: generalizedForceAtRootVector[0],
      junctionRadiusN: generalizedForceAtRootVector[1],
      definition: "G_Vms=(2/y_m)*sum(T_x); G_ym=(2*pi*y_m)*sum(T_y)",
      coordinateOrder: Object.freeze([
        "septalMidwallCapVolumeM3",
        "junctionRadiusM",
      ] as const),
      residualOrder: Object.freeze([
        "septalMidwallVolumePa",
        "junctionRadiusN",
      ] as const),
    }),
    scaledRestoringTangent: Object.freeze({
      coarse: coarseMatrix,
      fine: fineMatrix,
      symmetricFine,
      skewFine,
      skewDefectTwoNorm,
      symmetricPartTwoNorm,
      relativeSkewDefect: skewDefectTwoNorm / Math.max(1, symmetricPartTwoNorm),
      eigenvaluesAscending,
      derivativeDisagreementTwoNorm,
      uncertaintyBound,
      robustSignedMargin,
      inertia,
      classification,
      interpretation: "work-conjugate-static-restoring-tangent-not-an-energy-hessian",
    }),
    generalizedForceTransformAudit: Object.freeze({
      independentlyDifferentiatedFine: fineMatrix,
      productRuleFromPublishedResidualFine: productRuleMatrix,
      differenceTwoNorm: generalizedForceTransformAuditDifference2,
      tolerance: input.policy.maximumGeneralizedForceTransformAuditDifference2,
      accepted: generalizedForceTransformAuditAccepted,
    }),
    rootRegularity: Object.freeze({
      sigmaMinimum: input.root.scaledJacobianDiagnostics.sigmaMinimum,
      conditionNumber2: input.root.scaledJacobianDiagnostics.conditionNumber2,
      scaledResidualInfinityNorm: input.root.scaledResidualInfinityNorm,
      scaledUpdateInfinityNorm: input.root.scaledUpdateInfinityNorm,
      accepted: rootRegularityAccepted,
    }),
    policy: input.policy,
    acceptedUnderLocalStaticRestoringTestReference,
    energeticStability: Object.freeze({
      eligible: false,
      reason: "published-taylor-equilibrium-is-not-the-gradient-of-the-material-potential",
      energyMinimumClaimed: false,
      thermodynamicStabilityClaimed: false,
    }),
    physiologicalRootClaimed: false,
    globalUniquenessClaimed: false,
  });
}

function scaledGeneralizedForceProductRuleMatrix(input: Readonly<{
  rawPublishedResidualJacobian: readonly [number, number, number, number];
  publishedResidualAtRoot: readonly [number, number];
  coordinates: PhaseB0TriSegCoordinatesV1;
  unknownScales: readonly [number, number];
  generalizedForceScales: readonly [number, number];
}>): readonly [number, number, number, number] {
  const yM = input.coordinates.junctionRadiusM;
  const [gX, gY] = input.publishedResidualAtRoot;
  const [dGxDV, dGxDy, dGyDV, dGyDy] = input.rawPublishedResidualJacobian;
  const rawGeneralized = [
    2 * dGxDV / yM,
    2 * dGxDy / yM - 2 * gX / (yM * yM),
    2 * Math.PI * yM * dGyDV,
    2 * Math.PI * yM * dGyDy + 2 * Math.PI * gY,
  ] as const;
  return Object.freeze([
    rawGeneralized[0] * input.unknownScales[0] / input.generalizedForceScales[0],
    rawGeneralized[1] * input.unknownScales[1] / input.generalizedForceScales[0],
    rawGeneralized[2] * input.unknownScales[0] / input.generalizedForceScales[1],
    rawGeneralized[3] * input.unknownScales[1] / input.generalizedForceScales[1],
  ]);
}

function classifyInertia(
  eigenvalues: readonly [number, number],
  uncertainty: number,
): Readonly<{ positive: number; neutral: number; negative: number }> {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const eigenvalue of eigenvalues) {
    if (eigenvalue > uncertainty) positive += 1;
    else if (eigenvalue < -uncertainty) negative += 1;
    else neutral += 1;
  }
  return Object.freeze({ positive, neutral, negative });
}

function classifyRestoring(
  inertia: Readonly<{ positive: number; neutral: number; negative: number }>,
): PhaseB0TriSegStaticRestoringClassV1 {
  if (inertia.positive === 2) return "robust-restoring";
  if (inertia.positive === 1 && inertia.negative === 1) return "robust-saddle";
  if (inertia.negative === 2) return "robust-antirestoring-maximum";
  return "indeterminate";
}

function restoringMargin(
  classification: PhaseB0TriSegStaticRestoringClassV1,
  eigenvalues: readonly [number, number],
  uncertainty: number,
): number {
  if (classification === "robust-restoring") return eigenvalues[0] - uncertainty;
  if (classification === "robust-saddle") {
    return Math.min(-eigenvalues[0] - uncertainty, eigenvalues[1] - uncertainty);
  }
  if (classification === "robust-antirestoring-maximum") {
    return -eigenvalues[1] - uncertainty;
  }
  return Math.min(Math.abs(eigenvalues[0]), Math.abs(eigenvalues[1])) - uncertainty;
}

function symmetricPart2x2(
  matrix: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  const offDiagonal = 0.5 * (matrix[1] + matrix[2]);
  return Object.freeze([matrix[0], offDiagonal, offDiagonal, matrix[3]]);
}

function skewPart2x2(
  matrix: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  const offDiagonal = 0.5 * (matrix[1] - matrix[2]);
  return Object.freeze([0, offDiagonal, -offDiagonal, 0]);
}

function symmetricEigenvalues2x2(
  matrix: readonly [number, number, number, number],
): readonly [number, number] {
  const discriminant = Math.hypot(matrix[0] - matrix[3], 2 * matrix[1]);
  return Object.freeze([
    0.5 * (matrix[0] + matrix[3] - discriminant),
    0.5 * (matrix[0] + matrix[3] + discriminant),
  ]);
}

function matrixTwoNorm2x2(
  matrix: readonly [number, number, number, number],
): number {
  return diagnoseScaledJacobian2x2V1(matrix).sigmaMaximum;
}

function subtractMatrix2x2(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  return Object.freeze([
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
    left[3] - right[3],
  ]);
}

function matrixToTuple(
  matrix: readonly (readonly number[])[],
): readonly [number, number, number, number] {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) {
    throw new Error("TriSeg restoring tangent must be 2x2");
  }
  return Object.freeze([
    requireFinite(matrix[0][0], "matrix[0,0]"),
    requireFinite(matrix[0][1], "matrix[0,1]"),
    requireFinite(matrix[1][0], "matrix[1,0]"),
    requireFinite(matrix[1][1], "matrix[1,1]"),
  ]);
}

function coordinatesToVector(
  coordinates: PhaseB0TriSegCoordinatesV1,
): readonly [number, number] {
  return Object.freeze([
    coordinates.septalMidwallCapVolumeM3,
    coordinates.junctionRadiusM,
  ]);
}

function vectorToCoordinates(values: readonly number[]): PhaseB0TriSegCoordinatesV1 {
  if (values.length !== 2) throw new Error("TriSeg coordinate vector must have length two");
  return Object.freeze({
    septalMidwallCapVolumeM3: requireFinite(values[0], "septalMidwallCapVolumeM3"),
    junctionRadiusM: requirePositiveFinite(values[1], "junctionRadiusM"),
  });
}

function validatePolicy(policy: PhaseB0TriSegStaticRestoringPolicyV1): void {
  requirePositiveFinite(policy.coarseDerivativeScaledStep, "coarseDerivativeScaledStep");
  requirePositiveFinite(policy.fineDerivativeScaledStep, "fineDerivativeScaledStep");
  if (!(policy.fineDerivativeScaledStep < policy.coarseDerivativeScaledStep)) {
    throw new Error("fineDerivativeScaledStep must be smaller than coarseDerivativeScaledStep");
  }
  requirePositiveFinite(
    policy.derivativeDisagreementMultiplier,
    "derivativeDisagreementMultiplier",
  );
  requirePositiveFinite(policy.relativeUncertaintyFloor, "relativeUncertaintyFloor");
  requirePositiveFinite(policy.minimumRobustRestoringMargin, "minimumRobustRestoringMargin");
  requirePositiveFinite(policy.minimumRootJacobianSigmaMinimum, "minimumRootJacobianSigmaMinimum");
  requirePositiveFinite(
    policy.maximumRootJacobianConditionNumber2,
    "maximumRootJacobianConditionNumber2",
  );
  requirePositiveFinite(
    policy.maximumScaledRootResidualInfinityNorm,
    "maximumScaledRootResidualInfinityNorm",
  );
  requirePositiveFinite(
    policy.maximumScaledRootUpdateInfinityNorm,
    "maximumScaledRootUpdateInfinityNorm",
  );
  requirePositiveFinite(
    policy.maximumGeneralizedForceTransformAuditDifference2,
    "maximumGeneralizedForceTransformAuditDifference2",
  );
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
