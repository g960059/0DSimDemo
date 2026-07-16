/**
 * Quasi-static shared left-heart long-axis coordinate.
 *
 * The scalar gains below define a reduced one-fiber isochoric mode after its
 * transverse strains have been analytically eliminated; they are not scalar
 * volumetric strains and this module does not claim a full tensor basis.
 * q therefore changes the strains supplied to the external LA/LV/septal
 * constitutive owners without changing any chamber blood-volume coordinate.
 */
export const SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_V1_ID =
  "shared-atrioventricular-long-axis-mode-v1" as const;

export const SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1 = Object.freeze({
  coordinateCount: 1 as const,
  side: "left-heart" as const,
  dynamics: "quasi-static-generalized-wall-work-balance" as const,
  modeInterpretation:
    "reduced-one-fiber-isochoric-mode-with-eliminated-transverse-strains" as const,
  hiddenBloodVolume: false as const,
  cavityVolumeShift: false as const,
  avPlaneBloodVolumePiston: false as const,
  rightHeartEffectiveStrainsChanged: false as const,
  wallStressInput:
    "owner-supplied-fiber-stress-work-conjugate-to-effective-log-strain" as const,
  wallVolumeInput:
    "owner-consistent-load-bearing-wall-volume-for-the-supplied-stress-measure" as const,
  wallConstitutiveOwnership:
    "external-land-passive-and-sls-constitutive-owners" as const,
  ownsDynamicState: false as const,
  ownsDampingOrDissipation: false as const,
  fullWallTotalEnergyClaim: false as const,
});

export type SharedAtrioventricularLongAxisModeParamsV1 = {
  readonly parameterSetId: string;
  readonly atrialEffectiveStrainGain: number;
  readonly leftFreeWallEffectiveStrainGain: number;
  readonly septalEffectiveStrainGain: number;
  readonly maximumAbsoluteCoordinate: number;
  readonly generalizedForceScaleJ: number;
};

export type SharedAtrioventricularLongAxisBaseLogStrainsV1 = {
  readonly leftAtrium: number;
  readonly rightAtrium: number;
  readonly leftVentricularFreeWall: number;
  readonly rightVentricularFreeWall: number;
  readonly septum: number;
};

export type SharedAtrioventricularLongAxisEffectiveLogStrainsV1 =
  SharedAtrioventricularLongAxisBaseLogStrainsV1;

export type SharedAtrioventricularLongAxisWallVolumesV1 = {
  readonly leftAtriumMl: number;
  readonly leftVentricularFreeWallMl: number;
  readonly septumMl: number;
};

export type SharedAtrioventricularLongAxisTransmittedStressV1 = {
  readonly leftAtriumPa: number;
  readonly leftVentricularFreeWallPa: number;
  readonly septumPa: number;
};

export type SharedAtrioventricularLongAxisPassiveResponseV1 = {
  readonly leftAtrium: {
    readonly stressPa: number;
    readonly tangentPa: number;
  };
  readonly leftVentricularFreeWall: {
    readonly stressPa: number;
    readonly tangentPa: number;
  };
  readonly septum: {
    readonly stressPa: number;
    readonly tangentPa: number;
  };
};

export type SharedAtrioventricularLongAxisKinematicsV1 = {
  readonly coordinate: number;
  readonly baseLogStrains: SharedAtrioventricularLongAxisBaseLogStrainsV1;
  readonly effectiveLogStrains: SharedAtrioventricularLongAxisEffectiveLogStrainsV1;
  readonly fiberProjectionGains: {
    readonly leftAtrium: number;
    readonly leftVentricularFreeWall: number;
    readonly septum: number;
  };
  readonly modeInterpretation:
    typeof SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1.modeInterpretation;
  /** q is reduced isochoric shape mechanics, never a cavity-volume offset. */
  readonly cavityVolumeShiftMl: 0;
};

export type SharedAtrioventricularLongAxisEvaluationV1 = {
  readonly kind: typeof SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_V1_ID;
  readonly parameterSetId: string;
  readonly coordinate: number;
  readonly kinematics: SharedAtrioventricularLongAxisKinematicsV1 | null;
  readonly wallGeneralizedWorkContributionsJ: {
    readonly leftAtrium: number;
    readonly leftVentricularFreeWall: number;
    readonly septum: number;
  } | null;
  readonly totalGeneralizedForceJ: number | null;
  readonly normalizedResidual: number | null;
  readonly strictParamsValid: boolean;
  readonly coordinateWithinBound: boolean;
  readonly finite: boolean;
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly modeInterpretation:
    typeof SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1.modeInterpretation;
  readonly cavityVolumeShiftMl: 0;
  readonly claim: typeof SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1;
};

export type SharedAtrioventricularLongAxisPassiveColdEquilibriumV1 = {
  readonly evaluation: SharedAtrioventricularLongAxisEvaluationV1;
  readonly wallGeneralizedTangentContributionsJ: {
    readonly leftAtrium: number;
    readonly leftVentricularFreeWall: number;
    readonly septum: number;
  } | null;
  readonly generalizedTangentJ: number | null;
  readonly positiveGeneralizedTangent: boolean;
  readonly finite: boolean;
  readonly valid: boolean;
  readonly issues: readonly string[];
};

export function validateSharedAtrioventricularLongAxisModeParamsV1(
  params: SharedAtrioventricularLongAxisModeParamsV1,
): readonly string[] {
  const issues: string[] = [];
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim().length === 0
  ) {
    issues.push("parameterSetId must be non-empty");
  }
  requirePositiveFinite(
    params.atrialEffectiveStrainGain,
    "atrialEffectiveStrainGain",
    issues,
  );
  requireNegativeFinite(
    params.leftFreeWallEffectiveStrainGain,
    "leftFreeWallEffectiveStrainGain",
    issues,
  );
  requireNegativeFinite(
    params.septalEffectiveStrainGain,
    "septalEffectiveStrainGain",
    issues,
  );
  requirePositiveFinite(
    params.maximumAbsoluteCoordinate,
    "maximumAbsoluteCoordinate",
    issues,
  );
  requirePositiveFinite(
    params.generalizedForceScaleJ,
    "generalizedForceScaleJ",
    issues,
  );
  return issues;
}

/** Pure reduced-isochoric effective-strain projection; no cavity volume is accepted. */
export function evaluateSharedAtrioventricularLongAxisKinematicsV1(
  coordinate: number,
  baseLogStrains: SharedAtrioventricularLongAxisBaseLogStrainsV1,
  params: SharedAtrioventricularLongAxisModeParamsV1,
): SharedAtrioventricularLongAxisKinematicsV1 | null {
  if (
    validateSharedAtrioventricularLongAxisModeParamsV1(params).length > 0 ||
    !Number.isFinite(coordinate) ||
    Math.abs(coordinate) > params.maximumAbsoluteCoordinate ||
    !numericLeaves(baseLogStrains).every(Number.isFinite)
  ) return null;

  const effectiveLogStrains = Object.freeze({
    leftAtrium:
      baseLogStrains.leftAtrium +
      params.atrialEffectiveStrainGain * coordinate,
    rightAtrium: baseLogStrains.rightAtrium,
    leftVentricularFreeWall:
      baseLogStrains.leftVentricularFreeWall +
      params.leftFreeWallEffectiveStrainGain * coordinate,
    rightVentricularFreeWall: baseLogStrains.rightVentricularFreeWall,
    septum:
      baseLogStrains.septum +
      params.septalEffectiveStrainGain * coordinate,
  });
  if (!numericLeaves(effectiveLogStrains).every(Number.isFinite)) return null;
  return Object.freeze({
    coordinate,
    baseLogStrains: Object.freeze({ ...baseLogStrains }),
    effectiveLogStrains,
    fiberProjectionGains: Object.freeze({
      leftAtrium: params.atrialEffectiveStrainGain,
      leftVentricularFreeWall: params.leftFreeWallEffectiveStrainGain,
      septum: params.septalEffectiveStrainGain,
    }),
    modeInterpretation:
      SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1.modeInterpretation,
    cavityVolumeShiftMl: 0 as const,
  });
}

/**
 * Quasi-static generalized-force readback
 *
 *   G_q = sum_i V_i a_i sigma_i,       residual = G_q / G_scale.
 *
 * Volumes are converted from mL to m^3, so every contribution has units J.
 * The supplied stresses and wall volumes must form the stress-volume measure
 * work-conjugate to the owner's effective fiber log strain (for example,
 * Cauchy stress/current wall volume in a coaxial incompressible reduction).
 * This function applies no active/passive reshaping and does not infer a full
 * tensor stress from the scalar input.
 */
export function evaluateSharedAtrioventricularLongAxisModeV1(
  coordinate: number,
  baseLogStrains: SharedAtrioventricularLongAxisBaseLogStrainsV1,
  wallVolumes: SharedAtrioventricularLongAxisWallVolumesV1,
  transmittedWallStressPa: SharedAtrioventricularLongAxisTransmittedStressV1,
  params: SharedAtrioventricularLongAxisModeParamsV1,
): SharedAtrioventricularLongAxisEvaluationV1 {
  const paramIssues = [...validateSharedAtrioventricularLongAxisModeParamsV1(params)];
  const issues = [...paramIssues];
  const coordinateWithinBound =
    Number.isFinite(coordinate) &&
    Math.abs(coordinate) <= params.maximumAbsoluteCoordinate;
  if (!coordinateWithinBound) {
    issues.push("coordinate must be finite and within maximumAbsoluteCoordinate");
  }
  validateWallVolumes(wallVolumes, issues);
  if (!numericLeaves(transmittedWallStressPa).every(Number.isFinite)) {
    issues.push("transmitted wall stresses must be finite");
  }
  if (!numericLeaves(baseLogStrains).every(Number.isFinite)) {
    issues.push("base log strains must be finite");
  }
  const kinematics = evaluateSharedAtrioventricularLongAxisKinematicsV1(
    coordinate,
    baseLogStrains,
    params,
  );
  if (issues.length > 0 || kinematics === null) {
    return failedEvaluation(
      coordinate,
      params,
      paramIssues.length === 0,
      coordinateWithinBound,
      issues,
    );
  }

  const leftAtrium = generalizedWorkContributionJ(
    wallVolumes.leftAtriumMl,
    params.atrialEffectiveStrainGain,
    transmittedWallStressPa.leftAtriumPa,
  );
  const leftVentricularFreeWall = generalizedWorkContributionJ(
    wallVolumes.leftVentricularFreeWallMl,
    params.leftFreeWallEffectiveStrainGain,
    transmittedWallStressPa.leftVentricularFreeWallPa,
  );
  const septum = generalizedWorkContributionJ(
    wallVolumes.septumMl,
    params.septalEffectiveStrainGain,
    transmittedWallStressPa.septumPa,
  );
  const wallGeneralizedWorkContributionsJ = Object.freeze({
    leftAtrium,
    leftVentricularFreeWall,
    septum,
  });
  const totalGeneralizedForceJ =
    leftAtrium + leftVentricularFreeWall + septum;
  const normalizedResidual = totalGeneralizedForceJ /
    params.generalizedForceScaleJ;
  const finite = numericLeaves({
    kinematics,
    wallGeneralizedWorkContributionsJ,
    totalGeneralizedForceJ,
    normalizedResidual,
  }).every(Number.isFinite);
  return Object.freeze({
    kind: SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_V1_ID,
    parameterSetId: params.parameterSetId,
    coordinate,
    kinematics,
    wallGeneralizedWorkContributionsJ,
    totalGeneralizedForceJ,
    normalizedResidual,
    strictParamsValid: true,
    coordinateWithinBound: true,
    finite,
    valid: finite,
    issues: finite ? Object.freeze([]) : Object.freeze(["non-finite readback"]),
    modeInterpretation:
      SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1.modeInterpretation,
    cavityVolumeShiftMl: 0 as const,
    claim: SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1,
  });
}

/**
 * Cold passive quasi-static audit.  For positive constitutive tangents,
 *
 *   dG_q/dq = sum_i V_i a_i^2 (d sigma_i / d e_i) > 0.
 *
 * This is a local root/tangent evaluation, not a dynamic state update.
 */
export function evaluateSharedAtrioventricularLongAxisPassiveColdEquilibriumV1(
  coordinate: number,
  baseLogStrains: SharedAtrioventricularLongAxisBaseLogStrainsV1,
  wallVolumes: SharedAtrioventricularLongAxisWallVolumesV1,
  passiveResponse: SharedAtrioventricularLongAxisPassiveResponseV1,
  params: SharedAtrioventricularLongAxisModeParamsV1,
): SharedAtrioventricularLongAxisPassiveColdEquilibriumV1 {
  const evaluation = evaluateSharedAtrioventricularLongAxisModeV1(
    coordinate,
    baseLogStrains,
    wallVolumes,
    {
      leftAtriumPa: passiveResponse.leftAtrium.stressPa,
      leftVentricularFreeWallPa:
        passiveResponse.leftVentricularFreeWall.stressPa,
      septumPa: passiveResponse.septum.stressPa,
    },
    params,
  );
  const issues = [...evaluation.issues];
  for (const [name, response] of Object.entries(passiveResponse)) {
    if (!(response.tangentPa > 0) || !Number.isFinite(response.tangentPa)) {
      issues.push(`${name}.tangentPa must be positive and finite`);
    }
  }
  if (!evaluation.valid || issues.length > 0) {
    return Object.freeze({
      evaluation,
      wallGeneralizedTangentContributionsJ: null,
      generalizedTangentJ: null,
      positiveGeneralizedTangent: false,
      finite: false,
      valid: false,
      issues: Object.freeze(issues),
    });
  }
  const wallGeneralizedTangentContributionsJ = Object.freeze({
    leftAtrium: generalizedTangentContributionJ(
      wallVolumes.leftAtriumMl,
      params.atrialEffectiveStrainGain,
      passiveResponse.leftAtrium.tangentPa,
    ),
    leftVentricularFreeWall: generalizedTangentContributionJ(
      wallVolumes.leftVentricularFreeWallMl,
      params.leftFreeWallEffectiveStrainGain,
      passiveResponse.leftVentricularFreeWall.tangentPa,
    ),
    septum: generalizedTangentContributionJ(
      wallVolumes.septumMl,
      params.septalEffectiveStrainGain,
      passiveResponse.septum.tangentPa,
    ),
  });
  const generalizedTangentJ =
    wallGeneralizedTangentContributionsJ.leftAtrium +
    wallGeneralizedTangentContributionsJ.leftVentricularFreeWall +
    wallGeneralizedTangentContributionsJ.septum;
  const finite = numericLeaves({
    wallGeneralizedTangentContributionsJ,
    generalizedTangentJ,
  }).every(Number.isFinite);
  const positiveGeneralizedTangent = generalizedTangentJ > 0;
  return Object.freeze({
    evaluation,
    wallGeneralizedTangentContributionsJ,
    generalizedTangentJ,
    positiveGeneralizedTangent,
    finite,
    valid: finite && positiveGeneralizedTangent,
    issues: finite && positiveGeneralizedTangent
      ? Object.freeze([])
      : Object.freeze(["passive generalized tangent must be positive and finite"]),
  });
}

function generalizedWorkContributionJ(
  wallVolumeMl: number,
  effectiveStrainGain: number,
  transmittedStressPa: number,
): number {
  return wallVolumeMl * 1e-6 * effectiveStrainGain * transmittedStressPa;
}

function generalizedTangentContributionJ(
  wallVolumeMl: number,
  effectiveStrainGain: number,
  passiveTangentPa: number,
): number {
  return wallVolumeMl * 1e-6 * effectiveStrainGain * effectiveStrainGain *
    passiveTangentPa;
}

function validateWallVolumes(
  wallVolumes: SharedAtrioventricularLongAxisWallVolumesV1,
  issues: string[],
): void {
  requirePositiveFinite(
    wallVolumes.leftAtriumMl,
    "leftAtriumMl",
    issues,
  );
  requirePositiveFinite(
    wallVolumes.leftVentricularFreeWallMl,
    "leftVentricularFreeWallMl",
    issues,
  );
  requirePositiveFinite(wallVolumes.septumMl, "septumMl", issues);
}

function requirePositiveFinite(
  value: number,
  name: string,
  issues: string[],
): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    issues.push(`${name} must be positive and finite`);
  }
}

function requireNegativeFinite(
  value: number,
  name: string,
  issues: string[],
): void {
  if (!(value < 0) || !Number.isFinite(value)) {
    issues.push(`${name} must be negative and finite`);
  }
}

function failedEvaluation(
  coordinate: number,
  params: SharedAtrioventricularLongAxisModeParamsV1,
  strictParamsValid: boolean,
  coordinateWithinBound: boolean,
  issues: readonly string[],
): SharedAtrioventricularLongAxisEvaluationV1 {
  return Object.freeze({
    kind: SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_V1_ID,
    parameterSetId: params.parameterSetId,
    coordinate,
    kinematics: null,
    wallGeneralizedWorkContributionsJ: null,
    totalGeneralizedForceJ: null,
    normalizedResidual: null,
    strictParamsValid,
    coordinateWithinBound,
    finite: false,
    valid: false,
    issues: Object.freeze([...issues]),
    modeInterpretation:
      SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1.modeInterpretation,
    cavityVolumeShiftMl: 0 as const,
    claim: SHARED_ATRIOVENTRICULAR_LONG_AXIS_MODE_CLAIM_V1,
  });
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || value === undefined || typeof value !== "object") {
    return [];
  }
  return Object.values(value).flatMap(numericLeaves);
}
