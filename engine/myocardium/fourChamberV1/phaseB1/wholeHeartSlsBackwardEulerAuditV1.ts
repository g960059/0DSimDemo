import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import {
  stepOneStateAlphaVSlsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID =
  "four-chamber-phase-b1-whole-heart-sls-backward-euler-audit-v1" as const;

const PHASE_B1_WHOLE_HEART_SLS_BE_AUDITS_V1 = new WeakSet<object>();

export const PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1 =
  1e-10 as const;

/** Dimensionless algorithm-audit tolerance, not a material parameter. */
export const PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1 =
  1e-10 as const;

export type PhaseB1WholeHeartSlsBackwardEulerAuditInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
}>;

export type PhaseB1WallSlsBackwardEulerIdentityAuditV1 = Readonly<{
  wallId: FourChamberWallId;
  wallReferenceMaterialVolumeM3: number;
  acceptedAlphaV: number;
  oracleAlphaV: number;
  alphaMismatch: number;
  stressWorkIncrementJ: number;
  storedEnergyIncrementJ: number;
  numericalDissipationIncrementJ: number;
  physicalDissipationIncrementJ: number;
  acceptedIdentityResidualJ: number;
  expandedIdentityResidualJDiagnostic: number;
  componentOracleIdentityResidualJ: number;
  normalizationDenominatorJ: number;
  normalizedIdentityResidual: number;
}>;

export type PhaseB1WholeHeartSlsBackwardEulerAuditV1 = Readonly<{
  auditId: typeof PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID;
  modelObjectAtAudit: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBindingObjectAtAudit: PhaseB1WallMaterialBindingV1;
  wallMaterialBindingContentSha256: string;
  newtonScaleRegistryContentSha256: string;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
  mode: "on" | "off";
  wallAuditByWall:
    | Readonly<Record<FourChamberWallId, PhaseB1WallSlsBackwardEulerIdentityAuditV1>>
    | null;
  maximumAbsoluteAlphaMismatch: number;
  alphaMismatchTolerance:
    typeof PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1;
  alphaMismatchAccepted: boolean;
  maximumAbsoluteAcceptedIdentityResidualJ: number;
  maximumAbsoluteExpandedIdentityResidualJDiagnostic: number;
  maximumAbsoluteComponentOracleIdentityResidualJ: number;
  signedAllWallIdentityResidualJ: number;
  signedAllWallExpandedIdentityResidualJDiagnostic: number;
  normalizationDenominatorJ: number;
  normalizedIdentityResidual: number;
  normalizedIdentityResidualRule:
    "maximum-of-per-wall-scale-normalized-stable-be-identity-residuals";
  normalizedIdentityResidualTolerance:
    typeof PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1;
  normalizedIdentityAccepted: boolean;
  slsStatePhysicallyAbsent: boolean;
  componentOracleUsedOnlyAsIndependentAudit: true;
  units: Readonly<{
    energyTerms: "J";
    normalizedIdentityResidual: "1";
  }>;
  testReferenceOnly: true;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingInputV1 =
  Readonly<{
    audit: PhaseB1WholeHeartSlsBackwardEulerAuditV1;
    model: PhaseB1EventFreeMonolithicModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    previousEndpoint: PhaseB1EndpointStateV1;
    nextEndpointLeftLimit: PhaseB1EndpointStateV1;
    dtSec: number;
  }>;

/**
 * Evaluates the exact one-state SLS backward-Euler passivity identity using
 * the accepted monolithic endpoint. Land active work is deliberately outside
 * this component audit and is not interpreted as chemical energy.
 */
export function auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1(
  input: PhaseB1WholeHeartSlsBackwardEulerAuditInputV1,
): PhaseB1WholeHeartSlsBackwardEulerAuditV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "Phase B1 whole-heart SLS BE audit input");
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const nextEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.nextEndpointLeftLimit.timeSec,
    differentialState: input.nextEndpointLeftLimit.differentialState,
    triSegCoordinates: input.nextEndpointLeftLimit.triSegCoordinates,
  });
  assertRoundoffEqual(
    nextEndpoint.timeSec,
    previousEndpoint.timeSec + dtSec,
    "SLS audit endpoint time",
  );
  const previous = previousEndpoint.differentialState;
  const next = nextEndpoint.differentialState;
  if (previous.slsMode !== next.slsMode) {
    throw new Error("SLS audit cannot change topology within a step");
  }
  const normalizationFloorJ = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * dtSec,
    "SLS identity normalization floor",
  );
  if (next.slsMode === "off") {
    return registerAudit(Object.freeze({
      auditId: PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
      modelObjectAtAudit: input.model,
      wallMaterialBindingObjectAtAudit: binding,
      wallMaterialBindingContentSha256: binding.contentSha256,
      newtonScaleRegistryContentSha256:
        input.model.newtonScaleRegistry.registryContentSha256,
      previousEndpoint,
      nextEndpointLeftLimit: nextEndpoint,
      dtSec,
      mode: "off",
      wallAuditByWall: null,
      maximumAbsoluteAlphaMismatch: 0,
      alphaMismatchTolerance:
        PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
      alphaMismatchAccepted: true,
      maximumAbsoluteAcceptedIdentityResidualJ: 0,
      maximumAbsoluteExpandedIdentityResidualJDiagnostic: 0,
      maximumAbsoluteComponentOracleIdentityResidualJ: 0,
      signedAllWallIdentityResidualJ: 0,
      signedAllWallExpandedIdentityResidualJDiagnostic: 0,
      normalizationDenominatorJ: normalizationFloorJ,
      normalizedIdentityResidual: 0,
      normalizedIdentityResidualRule:
        "maximum-of-per-wall-scale-normalized-stable-be-identity-residuals" as const,
      normalizedIdentityResidualTolerance:
        PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
      normalizedIdentityAccepted: true,
      slsStatePhysicallyAbsent: true,
      componentOracleUsedOnlyAsIndependentAudit: true,
      units: Object.freeze({
        energyTerms: "J" as const,
        normalizedIdentityResidual: "1" as const,
      }),
      testReferenceOnly: true,
      phaseB1Acceptance: false,
      releaseRuntimeReachable: false,
    }));
  }
  if (previous.slsMode !== "on") {
    throw new Error("unreachable SLS topology mismatch");
  }
  const previousEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    previousEndpoint,
  );
  const nextEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    nextEndpoint,
  );
  let absoluteIdentityTermSumJ = 0;
  // Partition the existing whole-heart floor equally across walls. The five
  // denominators therefore retain the same total floor while the maximum of
  // their absolute normalized residuals cannot cancel between walls.
  const perWallNormalizationFloorJ = normalizationFloorJ / WALL_IDS.length;
  const wallAuditByWall = wallRecord((wallId) => {
    const material = binding.runtimeByWall[wallId].passiveSls.compiledSls;
    const previousFiberLogStrain = previousEvaluation.closedLoop
      .wallMechanics[wallId].fiberLogStrain;
    const nextFiberLogStrain = nextEvaluation.closedLoop
      .wallMechanics[wallId].fiberLogStrain;
    const previousAlphaV = previous.slsAlphaVByWall[wallId];
    const acceptedAlphaV = next.slsAlphaVByWall[wallId];
    const oracle = stepOneStateAlphaVSlsBackwardEulerV1({
      previousFiberLogStrain,
      previousAlphaV,
      nextFiberLogStrain,
      dtSec,
    }, material);
    const wallReferenceMaterialVolumeM3 = requirePositiveFinite(
      nextEvaluation.closedLoop.wallMechanics[wallId]
        .wallReferenceMaterialVolumeM3,
      `${wallId}.wallReferenceMaterialVolumeM3`,
    );
    const previousOverstressPa = material.EVPa
      * (previousFiberLogStrain - previousAlphaV);
    const nextOverstressPa = material.EVPa
      * (nextFiberLogStrain - acceptedAlphaV);
    const previousStoredEnergyDensityJPerM3 = previousOverstressPa ** 2
      / (2 * material.EVPa);
    const nextStoredEnergyDensityJPerM3 = nextOverstressPa ** 2
      / (2 * material.EVPa);
    const stressWorkIncrementDensityJPerM3 = nextOverstressPa
      * (nextFiberLogStrain - previousFiberLogStrain);
    const storedEnergyIncrementDensityJPerM3 =
      nextStoredEnergyDensityJPerM3 - previousStoredEnergyDensityJPerM3;
    const numericalDissipationIncrementDensityJPerM3 =
      (nextOverstressPa - previousOverstressPa) ** 2
      / (2 * material.EVPa);
    const physicalDissipationIncrementDensityJPerM3 = dtSec
      * nextOverstressPa ** 2 / (material.EVPa * material.tauSec);
    const expandedIdentityResidualDensityJPerM3 =
      stressWorkIncrementDensityJPerM3
      - storedEnergyIncrementDensityJPerM3
      - numericalDissipationIncrementDensityJPerM3
      - physicalDissipationIncrementDensityJPerM3;
    // Algebraically identical to the expanded four-term energy balance, but
    // evaluated through the BE alpha_v state equation to avoid catastrophic
    // cancellation when all energy increments are individually small.
    const acceptedAlphaVStateResidual = acceptedAlphaV - previousAlphaV
      - dtSec * (nextFiberLogStrain - acceptedAlphaV) / material.tauSec;
    const acceptedIdentityResidualDensityJPerM3 = nextOverstressPa
      * acceptedAlphaVStateResidual;
    const stressWorkIncrementJ = requireFinite(
      stressWorkIncrementDensityJPerM3 * wallReferenceMaterialVolumeM3,
      `${wallId}.stressWorkIncrementJ`,
    );
    const storedEnergyIncrementJ = requireFinite(
      storedEnergyIncrementDensityJPerM3 * wallReferenceMaterialVolumeM3,
      `${wallId}.storedEnergyIncrementJ`,
    );
    const numericalDissipationIncrementJ = requireFinite(
      numericalDissipationIncrementDensityJPerM3
        * wallReferenceMaterialVolumeM3,
      `${wallId}.numericalDissipationIncrementJ`,
    );
    const physicalDissipationIncrementJ = requireFinite(
      physicalDissipationIncrementDensityJPerM3
        * wallReferenceMaterialVolumeM3,
      `${wallId}.physicalDissipationIncrementJ`,
    );
    const acceptedIdentityResidualJ = requireFinite(
      acceptedIdentityResidualDensityJPerM3
        * wallReferenceMaterialVolumeM3,
      `${wallId}.acceptedIdentityResidualJ`,
    );
    const expandedIdentityResidualJDiagnostic = requireFinite(
      expandedIdentityResidualDensityJPerM3
        * wallReferenceMaterialVolumeM3,
      `${wallId}.expandedIdentityResidualJDiagnostic`,
    );
    const componentOracleIdentityResidualJ = requireFinite(
      oracle.discretePassivityIdentityResidualJPerM3
        * wallReferenceMaterialVolumeM3,
      `${wallId}.componentOracleIdentityResidualJ`,
    );
    absoluteIdentityTermSumJ += Math.abs(stressWorkIncrementJ)
      + Math.abs(storedEnergyIncrementJ)
      + numericalDissipationIncrementJ
      + physicalDissipationIncrementJ;
    const normalizationDenominatorJ = requirePositiveFinite(
      perWallNormalizationFloorJ
        + Math.abs(stressWorkIncrementJ)
        + Math.abs(storedEnergyIncrementJ)
        + Math.abs(numericalDissipationIncrementJ)
        + Math.abs(physicalDissipationIncrementJ),
      `${wallId}.normalizationDenominatorJ`,
    );
    return Object.freeze({
      wallId,
      wallReferenceMaterialVolumeM3,
      acceptedAlphaV,
      oracleAlphaV: oracle.nextAlphaV,
      alphaMismatch: requireFinite(
        acceptedAlphaV - oracle.nextAlphaV,
        `${wallId}.alphaMismatch`,
      ),
      stressWorkIncrementJ,
      storedEnergyIncrementJ,
      numericalDissipationIncrementJ,
      physicalDissipationIncrementJ,
      acceptedIdentityResidualJ,
      expandedIdentityResidualJDiagnostic,
      componentOracleIdentityResidualJ,
      normalizationDenominatorJ,
      normalizedIdentityResidual: requireFinite(
        Math.abs(acceptedIdentityResidualJ) / normalizationDenominatorJ,
        `${wallId}.normalizedIdentityResidual`,
      ),
    });
  });
  const values = Object.values(wallAuditByWall);
  const signedAllWallIdentityResidualJ = requireFinite(
    values.reduce((sum, wall) => sum + wall.acceptedIdentityResidualJ, 0),
    "signedAllWallIdentityResidualJ",
  );
  const signedAllWallExpandedIdentityResidualJDiagnostic = requireFinite(
    values.reduce(
      (sum, wall) => sum + wall.expandedIdentityResidualJDiagnostic,
      0,
    ),
    "signedAllWallExpandedIdentityResidualJDiagnostic",
  );
  const normalizationDenominatorJ = requirePositiveFinite(
    normalizationFloorJ + absoluteIdentityTermSumJ,
    "normalizationDenominatorJ",
  );
  const normalizedIdentityResidual = requireFinite(
    Math.max(...values.map((wall) => wall.normalizedIdentityResidual)),
    "normalizedIdentityResidual",
  );
  const maximumAbsoluteAlphaMismatch = Math.max(
    ...values.map((wall) => Math.abs(wall.alphaMismatch)),
  );
  const alphaMismatchAccepted = maximumAbsoluteAlphaMismatch
    < PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1;
  const perWallNormalizedIdentityAccepted = normalizedIdentityResidual
    < PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1;
  return registerAudit(Object.freeze({
    auditId: PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
    modelObjectAtAudit: input.model,
    wallMaterialBindingObjectAtAudit: binding,
    wallMaterialBindingContentSha256: binding.contentSha256,
    newtonScaleRegistryContentSha256:
      input.model.newtonScaleRegistry.registryContentSha256,
    previousEndpoint,
    nextEndpointLeftLimit: nextEndpoint,
    dtSec,
    mode: "on",
    wallAuditByWall,
    maximumAbsoluteAlphaMismatch,
    alphaMismatchTolerance:
      PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
    alphaMismatchAccepted,
    maximumAbsoluteAcceptedIdentityResidualJ: Math.max(
      ...values.map((wall) => Math.abs(wall.acceptedIdentityResidualJ)),
    ),
    maximumAbsoluteExpandedIdentityResidualJDiagnostic: Math.max(
      ...values.map((wall) => Math.abs(
        wall.expandedIdentityResidualJDiagnostic,
      )),
    ),
    maximumAbsoluteComponentOracleIdentityResidualJ: Math.max(
      ...values.map((wall) => Math.abs(
        wall.componentOracleIdentityResidualJ,
      )),
    ),
    signedAllWallIdentityResidualJ,
    signedAllWallExpandedIdentityResidualJDiagnostic,
    normalizationDenominatorJ,
    normalizedIdentityResidual,
    normalizedIdentityResidualRule:
      "maximum-of-per-wall-scale-normalized-stable-be-identity-residuals" as const,
    normalizedIdentityResidualTolerance:
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    normalizedIdentityAccepted:
      perWallNormalizedIdentityAccepted && alphaMismatchAccepted,
    slsStatePhysicallyAbsent: false,
    componentOracleUsedOnlyAsIndependentAudit: true,
    units: Object.freeze({
      energyTerms: "J" as const,
      normalizedIdentityResidual: "1" as const,
    }),
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  }));
}

/**
 * Re-authenticates an in-process builder result against the exact transaction
 * inputs without recomputing the constitutive audit after commit.
 */
export function assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1(
  input: PhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingInputV1,
): PhaseB1WholeHeartSlsBackwardEulerAuditV1 {
  assertExactPlainRecordV1(input, [
    "audit",
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "Phase B1 whole-heart SLS BE audit source binding input");
  const audit = input.audit;
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  if (
    audit === null
    || typeof audit !== "object"
    || !PHASE_B1_WHOLE_HEART_SLS_BE_AUDITS_V1.has(audit)
  ) {
    throw new Error("SLS BE audit must be an in-process builder result");
  }
  if (
    audit.auditId !== PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID
    || !Object.is(audit.modelObjectAtAudit, input.model)
    || !Object.is(audit.wallMaterialBindingObjectAtAudit, binding)
    || audit.wallMaterialBindingContentSha256 !== binding.contentSha256
    || audit.newtonScaleRegistryContentSha256
      !== input.model.newtonScaleRegistry.registryContentSha256
    || !Object.is(audit.dtSec, dtSec)
  ) {
    throw new Error("SLS BE audit model, binding, registry, or dt provenance differs");
  }
  assertEndpointExactlyEqual(
    audit.previousEndpoint,
    input.previousEndpoint,
    "SLS BE audit previous endpoint",
  );
  assertEndpointExactlyEqual(
    audit.nextEndpointLeftLimit,
    input.nextEndpointLeftLimit,
    "SLS BE audit next endpoint",
  );
  if (
    audit.mode !== input.previousEndpoint.differentialState.slsMode
    || audit.mode !== input.nextEndpointLeftLimit.differentialState.slsMode
    || audit.alphaMismatchTolerance
      !== PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1
    || audit.normalizedIdentityResidualTolerance
      !== PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1
    || audit.alphaMismatchAccepted
      !== (
        audit.maximumAbsoluteAlphaMismatch
          < PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1
      )
    || audit.normalizedIdentityAccepted
      !== (
        audit.alphaMismatchAccepted
        && audit.normalizedIdentityResidual
          < PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1
      )
  ) {
    throw new Error("SLS BE audit gate or topology provenance differs");
  }
  return audit;
}

function registerAudit(
  audit: PhaseB1WholeHeartSlsBackwardEulerAuditV1,
): PhaseB1WholeHeartSlsBackwardEulerAuditV1 {
  PHASE_B1_WHOLE_HEART_SLS_BE_AUDITS_V1.add(audit);
  return audit;
}

function assertEndpointExactlyEqual(
  actual: PhaseB1EndpointStateV1,
  expected: PhaseB1EndpointStateV1,
  field: string,
): void {
  const actualVectors = encodePhaseB1EndpointTopologyVectorsV1(actual);
  const expectedVectors = encodePhaseB1EndpointTopologyVectorsV1(expected);
  if (
    !Object.is(actual.timeSec, expected.timeSec)
    || actualVectors.slsMode !== expectedVectors.slsMode
    || !vectorsExactlyEqual(
      actualVectors.nonCalciumDifferentialState,
      expectedVectors.nonCalciumDifferentialState,
    )
    || !vectorsExactlyEqual(
      actualVectors.algebraicState,
      expectedVectors.algebraicState,
    )
    || WALL_IDS.some((wallId) =>
      !Object.is(
        actualVectors.calciumByWall[wallId].r,
        expectedVectors.calciumByWall[wallId].r,
      )
      || !Object.is(
        actualVectors.calciumByWall[wallId].d,
        expectedVectors.calciumByWall[wallId].d,
      ))
  ) throw new Error(`${field} differs`);
}

function vectorsExactlyEqual(
  actual: readonly number[],
  expected: readonly number[],
): boolean {
  return actual.length === expected.length
    && actual.every((value, index) => Object.is(value, expected[index]));
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  const tolerance = 128 * Number.EPSILON
    * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} mismatch`);
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}
