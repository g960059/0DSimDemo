import {
  ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID,
  assertNormalAdultAtrialAnatomyAnchorV2,
  buildNormalAdultAtrialAnatomyAnchorV2,
  createNormalAdultAtrialAnatomyCenterInputV2,
  type AtrialChamberIdV2,
  type AtrialPhasicVolumeIdV2,
  type NormalAdultAtrialAnatomyAnchorV2,
} from "@/engine/myocardium/fourChamberV1/anatomy/atrialAnatomyPassiveTargetsV2";
import {
  evaluateAtrialOneFiberGeometryV1,
  evaluateAtrialOneFiberPressureV1,
  type AtrialOneFiberGeometryPriorV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V3,
  compileMoyer2015AtrialEquibiaxialPassiveV3,
  evaluateMoyer2015AtrialEquibiaxialPassiveV3,
  type CompiledMoyer2015AtrialEquibiaxialPassiveV3,
} from "@/engine/myocardium/fourChamberV1/passive/moyer2015AtrialEquibiaxialPassiveV3";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

const PASCAL_PER_MMHG = 133.322387415;
const CUBIC_METER_PER_MILLILITER = 1e-6;

export const NORMAL_ADULT_ATRIAL_MECHANICS_CANDIDATE_V3_ID =
  "normal-adult-atrial-mechanics-candidate-v3" as const;

export const NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3 = deepFreeze({
  targetId: "normal-adult-atrial-loaded-pressure-targets-si-v3",
  leftAtrialMinimumTransmuralPressurePa: 5 * PASCAL_PER_MMHG,
  rightAtrialMinimumTransmuralPressurePa: 3.5 * PASCAL_PER_MMHG,
  heldOutLeftAtrialReservoirPressureIncrementPa: {
    lower: 2 * PASCAL_PER_MMHG,
    center: 4 * PASCAL_PER_MMHG,
    upper: 6 * PASCAL_PER_MMHG,
  },
  heldOutLeftAtrialFillingSecantPaPerM3: {
    lower: 0.09 * PASCAL_PER_MMHG / CUBIC_METER_PER_MILLILITER,
    center: 0.13 * PASCAL_PER_MMHG / CUBIC_METER_PER_MILLILITER,
    upper: 0.17 * PASCAL_PER_MMHG / CUBIC_METER_PER_MILLILITER,
  },
  heldOutRightAtrialVWavePressurePa: 6.5 * PASCAL_PER_MMHG,
  evidence: {
    leftAtrialMinimumPressure: {
      sourceId: "moyer-2015-normal-la-loaded-minimum-pressure",
      doi: "10.1007/s10439-015-1256-0",
      meaning: "MRI minimum geometry is a loaded five-mmHg configuration",
    },
    leftAtrialReservoirPulse: {
      sourceId: "wright-2024-resting-x-to-v-wave-pulse",
      doi: "10.1152/japplphysiol.00905.2023",
      meaning: "x-to-v pressure increment, not absolute maximum pressure",
    },
    leftAtrialFillingSecant: {
      sourceId: "dernellis-1998-la-filling-limb-secant-stiffness",
      doi: "10.1016/S0002-9149(98)00134-9",
      meaning: "filling-limb secant, not endpoint derivative",
    },
    rightAtrialXAndVWave: {
      sourceId: "wessels-2023-control-ra-x-v-wave",
      doi: "10.1016/j.jacc.2023.05.063",
      meaning:
        "upper control-group intracavitary x-descent interquartile anchor and v-wave readback; interpreted as transmural only for the zero-external-pressure construction state",
    },
  },
  claimBoundary: {
    onlyMinimumPressureUsedForInverseUnloading: true,
    reservoirPulseUsedForFit: false,
    fillingSecantUsedForFit: false,
    rightAtrialVWaveUsedForFit: false,
    pvLoopMorphologyUsedForFit: false,
  },
} as const);

export const NORMAL_ADULT_ATRIAL_MECHANICS_CANDIDATE_V3_POLICY = deepFreeze({
  policyId: "normal-adult-atrial-mechanics-candidate-policy-v3",
  loadedGeometryRule:
    "cmr-minimum-is-pressurized-loaded-geometry-not-zero-strain-reference",
  inverseUnloadingRule:
    "one-monotone-prestrain-root-per-atrium-from-minimum-transmural-pressure",
  passiveMaterialRule:
    "moyer-2015-human-la-law-exactly-reduced-along-incompressible-equibiaxial-path",
  crossAtriumRule:
    "same-material-law-for-la-and-ra-with-separate-unloaded-reference-volume",
  landAndSlsKinematics:
    "both-use-the-same-unloaded-reference-log-strain-sls-initialized-equilibrated",
  pericardiumRule: "independent-external-energy-not-used-for-inverse-unloading",
  chamberPressureGainApplied: false,
  additiveResidualStressApplied: false,
  pvLoopShapeUsedForFit: false,
  physiologicalValidationClaimed: false,
} as const);

export type NormalAdultAtrialMechanicsCandidateInputV3 = Readonly<{
  anatomy: NormalAdultAtrialAnatomyAnchorV2;
  minimumTransmuralPressurePaByAtrium: Readonly<Record<AtrialChamberIdV2, number>>;
}>;

export type AtrialInverseUnloadingV3 = Readonly<{
  atriumId: AtrialChamberIdV2;
  loadedMinimumCavityVolumeM3: number;
  unloadedReferenceCavityVolumeM3: number;
  loadedMinimumFiberLogPrestrain: number;
  loadedMinimumFiberStretch: number;
  targetMinimumTransmuralPressurePa: number;
  replayMinimumTransmuralPressurePa: number;
  replayResidualPa: number;
  solver: Readonly<{
    method: "monotone-bracketed-bisection";
    unknown: "loaded-minimum-fiber-log-prestrain";
    lowerBracket: 0;
    upperBracket: number;
    iterations: number;
    finalBracketWidth: number;
    localOrMultistartSearchUsed: false;
  }>;
  pressureGainApplied: false;
  additiveResidualStressApplied: false;
}>;

export type AtrialPassivePhaseEvaluationV3 = Readonly<{
  atriumId: AtrialChamberIdV2;
  phaseId: AtrialPhasicVolumeIdV2;
  cavityVolumeM3: number;
  fiberLogStrainFromUnloadedReference: number;
  passiveTransmuralPressurePa: number;
  passivePressureVolumeSlopePaPerM3: number;
  equilibriumKirchhoffStressPa: number;
  equilibriumMaterialTangentPa: number;
}>;

export type NormalAdultAtrialMechanicsCandidateV3 = Readonly<{
  candidateId: typeof NORMAL_ADULT_ATRIAL_MECHANICS_CANDIDATE_V3_ID;
  anatomyLayerId: typeof ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID;
  input: NormalAdultAtrialMechanicsCandidateInputV3;
  anatomy: NormalAdultAtrialAnatomyAnchorV2;
  compiledPassive: CompiledMoyer2015AtrialEquibiaxialPassiveV3;
  inverseUnloadingByAtrium: Readonly<Record<AtrialChamberIdV2, AtrialInverseUnloadingV3>>;
  geometryPriorByAtrium: Readonly<Record<AtrialChamberIdV2, AtrialOneFiberGeometryPriorV1>>;
  passivePhaseEvaluationByAtrium: Readonly<Record<
    AtrialChamberIdV2,
    Readonly<Record<AtrialPhasicVolumeIdV2, AtrialPassivePhaseEvaluationV3>>
  >>;
  heldOutReadback: Readonly<{
    leftAtrialReservoirPressureIncrementPa: number;
    leftAtrialFillingSecantPaPerM3: number;
    rightAtrialMaximumPressurePa: number;
    rightAtrialVWaveResidualPa: number;
    noneUsedForFit: true;
  }>;
  audit: Readonly<{
    cmrMinimumTreatedAsLoaded: true;
    unloadedReferenceVolumePositiveByAtrium: Readonly<Record<AtrialChamberIdV2, true>>;
    minimumPressureReplayedByAtrium: Readonly<Record<AtrialChamberIdV2, true>>;
    sameHumanPassiveMaterialAppliedToLaAndRa: true;
    passiveEnergyStrictlyConvexOnSupport: true;
    everyPhasicStateWithinConstitutiveSupport: true;
    chamberPressureGainApplied: false;
    additiveResidualStressApplied: false;
    pvLoopMorphologyUsedForFit: false;
    physiologicalValidationClaimed: false;
    pass: true;
  }>;
}>;

const CANDIDATES = new WeakSet<object>();

export function buildNormalAdultAtrialMechanicsCenterCandidateV3(
  input: Readonly<{ bodySurfaceAreaM2: number }>,
): NormalAdultAtrialMechanicsCandidateV3 {
  assertExactPlainRecordV1(
    input,
    ["bodySurfaceAreaM2"],
    "normal-adult atrial mechanics center candidate v3 input",
  );
  const anatomy = buildNormalAdultAtrialAnatomyAnchorV2(
    createNormalAdultAtrialAnatomyCenterInputV2(input),
  );
  return buildNormalAdultAtrialMechanicsCandidateV3({
    anatomy,
    minimumTransmuralPressurePaByAtrium: Object.freeze({
      LA: NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3
        .leftAtrialMinimumTransmuralPressurePa,
      RA: NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3
        .rightAtrialMinimumTransmuralPressurePa,
    }),
  });
}

export function buildNormalAdultAtrialMechanicsCandidateV3(
  input: NormalAdultAtrialMechanicsCandidateInputV3,
): NormalAdultAtrialMechanicsCandidateV3 {
  assertExactPlainRecordV1(
    input,
    ["anatomy", "minimumTransmuralPressurePaByAtrium"],
    "normal-adult atrial mechanics candidate v3 input",
  );
  const anatomy = assertNormalAdultAtrialAnatomyAnchorV2(input.anatomy);
  assertExactPlainRecordV1(
    input.minimumTransmuralPressurePaByAtrium,
    ["LA", "RA"],
    "atrial minimum pressure targets",
  );
  const frozenInput = deepFreeze({
    anatomy,
    minimumTransmuralPressurePaByAtrium: {
      LA: requirePositive(input.minimumTransmuralPressurePaByAtrium.LA, "LA minimum pressure"),
      RA: requirePositive(input.minimumTransmuralPressurePaByAtrium.RA, "RA minimum pressure"),
    },
  });
  const compiledPassive = compileMoyer2015AtrialEquibiaxialPassiveV3(
    MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V3,
  );
  const inverseUnloadingByAtrium = deepFreeze({
    LA: solveInverseUnloading(
      "LA",
      anatomy,
      compiledPassive,
      frozenInput.minimumTransmuralPressurePaByAtrium.LA,
    ),
    RA: solveInverseUnloading(
      "RA",
      anatomy,
      compiledPassive,
      frozenInput.minimumTransmuralPressurePaByAtrium.RA,
    ),
  });
  const geometryPriorByAtrium = deepFreeze({
    LA: buildUnloadedGeometryPrior("LA", anatomy, inverseUnloadingByAtrium.LA),
    RA: buildUnloadedGeometryPrior("RA", anatomy, inverseUnloadingByAtrium.RA),
  });
  const passivePhaseEvaluationByAtrium = deepFreeze({
    LA: evaluatePhasicVolumes("LA", anatomy, geometryPriorByAtrium.LA, compiledPassive),
    RA: evaluatePhasicVolumes("RA", anatomy, geometryPriorByAtrium.RA, compiledPassive),
  });
  const la = passivePhaseEvaluationByAtrium.LA;
  const ra = passivePhaseEvaluationByAtrium.RA;
  const laReservoirPressureIncrementPa = la.maximum.passiveTransmuralPressurePa
    - la.minimum.passiveTransmuralPressurePa;
  const laFillingSecantPaPerM3 = laReservoirPressureIncrementPa
    / (la.maximum.cavityVolumeM3 - la.minimum.cavityVolumeM3);
  const heldOutReadback = Object.freeze({
    leftAtrialReservoirPressureIncrementPa: laReservoirPressureIncrementPa,
    leftAtrialFillingSecantPaPerM3: laFillingSecantPaPerM3,
    rightAtrialMaximumPressurePa: ra.maximum.passiveTransmuralPressurePa,
    rightAtrialVWaveResidualPa: ra.maximum.passiveTransmuralPressurePa
      - NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3
        .heldOutRightAtrialVWavePressurePa,
    noneUsedForFit: true as const,
  });
  const support = compiledPassive.prior.supportedFiberLogStrainRange;
  const everyPhasicStateWithinConstitutiveSupport = (["LA", "RA"] as const)
    .every((atriumId) => (["minimum", "preAtrialContraction", "maximum"] as const)
      .every((phaseId) => {
        const strain = passivePhaseEvaluationByAtrium[atriumId][phaseId]
          .fiberLogStrainFromUnloadedReference;
        return strain >= support[0] && strain <= support[1];
      }));
  if (!everyPhasicStateWithinConstitutiveSupport) {
    throw new Error("atrial phasic anatomy lies outside Moyer constitutive support");
  }
  const candidate: NormalAdultAtrialMechanicsCandidateV3 = Object.freeze({
    candidateId: NORMAL_ADULT_ATRIAL_MECHANICS_CANDIDATE_V3_ID,
    anatomyLayerId: ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID,
    input: frozenInput,
    anatomy,
    compiledPassive,
    inverseUnloadingByAtrium,
    geometryPriorByAtrium,
    passivePhaseEvaluationByAtrium,
    heldOutReadback,
    audit: Object.freeze({
      cmrMinimumTreatedAsLoaded: true as const,
      unloadedReferenceVolumePositiveByAtrium: Object.freeze({
        LA: true as const,
        RA: true as const,
      }),
      minimumPressureReplayedByAtrium: Object.freeze({
        LA: true as const,
        RA: true as const,
      }),
      sameHumanPassiveMaterialAppliedToLaAndRa: true as const,
      passiveEnergyStrictlyConvexOnSupport: true as const,
      everyPhasicStateWithinConstitutiveSupport: true as const,
      chamberPressureGainApplied: false as const,
      additiveResidualStressApplied: false as const,
      pvLoopMorphologyUsedForFit: false as const,
      physiologicalValidationClaimed: false as const,
      pass: true as const,
    }),
  });
  CANDIDATES.add(candidate);
  return candidate;
}

export function assertNormalAdultAtrialMechanicsCandidateV3(
  candidate: NormalAdultAtrialMechanicsCandidateV3,
): NormalAdultAtrialMechanicsCandidateV3 {
  if (candidate === null || typeof candidate !== "object" || !CANDIDATES.has(candidate)) {
    throw new Error("atrial mechanics v3 must be a live canonical candidate");
  }
  return candidate;
}

function solveInverseUnloading(
  atriumId: AtrialChamberIdV2,
  anatomy: NormalAdultAtrialAnatomyAnchorV2,
  compiledPassive: CompiledMoyer2015AtrialEquibiaxialPassiveV3,
  targetPressurePa: number,
): AtrialInverseUnloadingV3 {
  const loadedMinimumCavityVolumeM3 = anatomy
    .phasicCavityVolumeM3ByAtrium[atriumId].minimum;
  const wallVolumeM3 = anatomy.wallReferenceMaterialVolumeM3ByAtrium[atriumId];
  const midwallVolumeM3 = loadedMinimumCavityVolumeM3 + 0.5 * wallVolumeM3;
  const pressureAtPrestrain = (prestrain: number): number => {
    const material = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
      prestrain,
      compiledPassive,
    );
    return wallVolumeM3 / (3 * midwallVolumeM3)
      * material.equilibriumKirchhoffStressPa;
  };
  let lower = 0;
  let upper = 0.25;
  const maximumPositiveReferencePrestrain = Math.log(
    midwallVolumeM3 / (0.5 * wallVolumeM3),
  ) / 3;
  upper = Math.min(upper, 0.95 * maximumPositiveReferencePrestrain);
  while (pressureAtPrestrain(upper) < targetPressurePa) {
    upper *= 1.25;
    if (!(upper < maximumPositiveReferencePrestrain)
      || upper > compiledPassive.prior.supportedFiberLogStrainRange[1]) {
      throw new Error(`${atriumId} inverse unloading has no positive-volume bracket`);
    }
  }
  const initialUpper = upper;
  let iterations = 0;
  for (; iterations < 100; iterations += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (pressureAtPrestrain(midpoint) < targetPressurePa) lower = midpoint;
    else upper = midpoint;
    if (upper - lower <= 1e-14) break;
  }
  const prestrain = 0.5 * (lower + upper);
  const unloadedMidwallVolumeM3 = midwallVolumeM3 * Math.exp(-3 * prestrain);
  const unloadedReferenceCavityVolumeM3 = unloadedMidwallVolumeM3
    - 0.5 * wallVolumeM3;
  if (!(unloadedReferenceCavityVolumeM3 > 0)) {
    throw new Error(`${atriumId} inverse unloading produced nonpositive cavity volume`);
  }
  const replayPressure = pressureAtPrestrain(prestrain);
  const replayResidualPa = replayPressure - targetPressurePa;
  if (Math.abs(replayResidualPa) > 1e-8) {
    throw new Error(`${atriumId} inverse unloading did not replay pressure`);
  }
  return Object.freeze({
    atriumId,
    loadedMinimumCavityVolumeM3,
    unloadedReferenceCavityVolumeM3,
    loadedMinimumFiberLogPrestrain: prestrain,
    loadedMinimumFiberStretch: Math.exp(prestrain),
    targetMinimumTransmuralPressurePa: targetPressurePa,
    replayMinimumTransmuralPressurePa: replayPressure,
    replayResidualPa,
    solver: Object.freeze({
      method: "monotone-bracketed-bisection" as const,
      unknown: "loaded-minimum-fiber-log-prestrain" as const,
      lowerBracket: 0 as const,
      upperBracket: initialUpper,
      iterations,
      finalBracketWidth: upper - lower,
      localOrMultistartSearchUsed: false as const,
    }),
    pressureGainApplied: false as const,
    additiveResidualStressApplied: false as const,
  });
}

function buildUnloadedGeometryPrior(
  atriumId: AtrialChamberIdV2,
  anatomy: NormalAdultAtrialAnatomyAnchorV2,
  inverse: AtrialInverseUnloadingV3,
): AtrialOneFiberGeometryPriorV1 {
  return deepFreeze({
    priorId: `normal-adult-${atriumId.toLowerCase()}-inverse-unloaded-geometry-v3`,
    status: "candidate-prior",
    evidenceClass: "literature-informed-anatomy-construction",
    atriumId,
    wallReferenceMaterialVolumeM3:
      anatomy.wallReferenceMaterialVolumeM3ByAtrium[atriumId],
    referenceCavityVolumeM3: inverse.unloadedReferenceCavityVolumeM3,
    fixedSelfSimilarAreaShapeFactor: 1,
    pressureGain: 1,
    extraSphericalLaplaceFactor: false,
    units: {
      wallReferenceMaterialVolume: "m^3",
      referenceCavityVolume: "m^3",
      pressure: "Pa",
      stress: "Pa",
      strain: "1",
    },
  });
}

function evaluatePhasicVolumes(
  atriumId: AtrialChamberIdV2,
  anatomy: NormalAdultAtrialAnatomyAnchorV2,
  geometryPrior: AtrialOneFiberGeometryPriorV1,
  compiledPassive: CompiledMoyer2015AtrialEquibiaxialPassiveV3,
): Readonly<Record<AtrialPhasicVolumeIdV2, AtrialPassivePhaseEvaluationV3>> {
  return deepFreeze({
    maximum: evaluatePhase("maximum"),
    preAtrialContraction: evaluatePhase("preAtrialContraction"),
    minimum: evaluatePhase("minimum"),
  });

  function evaluatePhase(phaseId: AtrialPhasicVolumeIdV2): AtrialPassivePhaseEvaluationV3 {
    const cavityVolumeM3 = anatomy.phasicCavityVolumeM3ByAtrium[atriumId][phaseId];
    const geometry = evaluateAtrialOneFiberGeometryV1(cavityVolumeM3, geometryPrior);
    const material = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
      geometry.fiberLogStrain,
      compiledPassive,
    );
    const pressure = evaluateAtrialOneFiberPressureV1({
      cavityVolumeM3,
      kirchhoffFiberStressPa: material.equilibriumKirchhoffStressPa,
      dKirchhoffStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
    }, geometryPrior);
    return Object.freeze({
      atriumId,
      phaseId,
      cavityVolumeM3,
      fiberLogStrainFromUnloadedReference: geometry.fiberLogStrain,
      passiveTransmuralPressurePa: pressure.transmuralPressurePa,
      passivePressureVolumeSlopePaPerM3:
        pressure.dTransmuralPressureDCavityVolumePaPerM3,
      equilibriumKirchhoffStressPa: material.equilibriumKirchhoffStressPa,
      equilibriumMaterialTangentPa: material.dStressDFiberLogStrainPa,
    });
  }
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}
