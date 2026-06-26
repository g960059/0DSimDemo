import protocolDescriptor from "@/data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  evaluatePrescribedCalciumOutput,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumInput,
  type PrescribedCalciumParams,
} from "@/engine/myocardium/calcium";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  solveLand2017BackwardEulerSubsteps,
  type Land2017SubstepSolveOptions,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY =
  "standalone-prescribed-shortening-ca-land-only";
export const CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS =
  "synthetic-prescribed-shortening-transfer-only";

export const CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS = [
  "zero-rate-isometric",
  "low-shortening",
  "physiologic-shortening",
  "high-shortening",
  "lengthening",
  "constant-velocity-shortening",
] as const;

export type CalciumLandPrescribedShorteningTrajectoryId =
  (typeof CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS)[number];

export type CalciumLandPrescribedShorteningTrajectoryShape =
  | "linear"
  | "raised-cosine"
  | "zero-rate";

export type CalciumLandPrescribedShorteningTrajectoryDefinition = {
  readonly id: CalciumLandPrescribedShorteningTrajectoryId;
  readonly kind: string;
  readonly initialFiberEngineeringStrain: number;
  readonly deltaFiberEngineeringStrain: number;
  readonly onsetSec: number;
  readonly durationSec: number;
  readonly shape: CalciumLandPrescribedShorteningTrajectoryShape;
};

export const CALCIUM_LAND_PRESCRIBED_SHORTENING_TRAJECTORY_FAMILY:
  readonly CalciumLandPrescribedShorteningTrajectoryDefinition[] = Object.freeze([
    {
      id: "zero-rate-isometric",
      kind: "zero-rate-comparator",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: 0,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "zero-rate",
    },
    {
      id: "low-shortening",
      kind: "smooth-shortening",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: -0.015,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "raised-cosine",
    },
    {
      id: "physiologic-shortening",
      kind: "smooth-shortening",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: -0.035,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "raised-cosine",
    },
    {
      id: "high-shortening",
      kind: "smooth-shortening",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: -0.055,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "raised-cosine",
    },
    {
      id: "lengthening",
      kind: "smooth-lengthening",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: 0.03,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "raised-cosine",
    },
    {
      id: "constant-velocity-shortening",
      kind: "constant-velocity-control",
      initialFiberEngineeringStrain: 0.02,
      deltaFiberEngineeringStrain: -0.035,
      onsetSec: 0.08,
      durationSec: 0.24,
      shape: "linear",
    },
  ]);

export type CalciumLandPrescribedShorteningProtocolStatus =
  | "closure-pass"
  | "closure-fail"
  | "deferred-target";

export type CalciumLandPrescribedShorteningMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[];

export type CalciumLandPrescribedShorteningProtocolSection = {
  readonly id: string;
  readonly status: CalciumLandPrescribedShorteningProtocolStatus;
  readonly metrics: Record<string, CalciumLandPrescribedShorteningMetricValue>;
};

export type CalciumLandPrescribedShorteningProtocolReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly trajectoryFamily: {
    readonly trajectoryProvenanceHash: string;
    readonly members: readonly CalciumLandPrescribedShorteningTrajectoryDefinition[];
  };
  readonly sections: readonly CalciumLandPrescribedShorteningProtocolSection[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

export type CalciumLandPrescribedShorteningRunOptions = {
  readonly params?: PrescribedCalciumParams;
  readonly initialLandState?: ArrayLike<number>;
  readonly initialCalciumState?: ArrayLike<number>;
  readonly cycleLengthSec?: number;
  readonly durationSec?: number;
  readonly dtSec?: number;
  readonly landSolveOptions?: Land2017SubstepSolveOptions;
  readonly trajectoryFamily?: readonly CalciumLandPrescribedShorteningTrajectoryDefinition[];
};

export type CalciumLandPrescribedShorteningSample = {
  readonly timeSec: number;
  readonly freeCalciumUM: number;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly dtSec: number;
  readonly derivedFiberEngineeringStrainRatePerSec: number;
  readonly rateAuditResidualPerSec: number;
  readonly sourceActiveFiberStressPa: number;
  readonly sourceActivePowerDensityWPerM3: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
  readonly landHealthFinite: boolean;
  readonly projectionUsed: boolean;
  readonly solverIterations: number;
  readonly solverResidualNorm: number;
  readonly solverSubsteps: number;
};

export type CalciumLandPrescribedShorteningTrajectoryMetrics = {
  readonly peakStressPa: number;
  readonly meanStressPa: number;
  readonly stressTimeIntegralPaSec: number;
  readonly timeToPeakMs: number;
  readonly fwhmMs: number;
  readonly width80Ms: number;
  readonly peakAbsPowerDensityWPerM3: number;
  readonly meanPowerDensityWPerM3: number;
  readonly minimumPopulation: number;
  readonly maxConservationResidual: number;
  readonly sourceHealthConservationTolerance: number;
  readonly allLandHealthFinite: boolean;
  readonly projectionUsed: boolean;
  readonly solverFailureCount: number;
  readonly maxRateAuditResidualPerSec: number;
  readonly samples: number;
};

export type CalciumLandPrescribedShorteningTrajectoryMember = {
  readonly id: CalciumLandPrescribedShorteningTrajectoryId;
  readonly definition: CalciumLandPrescribedShorteningTrajectoryDefinition;
  readonly ok: boolean;
  readonly samples: readonly CalciumLandPrescribedShorteningSample[];
  readonly metrics: CalciumLandPrescribedShorteningTrajectoryMetrics;
  readonly finalLandState: Float64Array;
  readonly finalCalciumState: Float64Array;
  readonly failureReason?: string;
  readonly failureMessage?: string;
};

const STANDALONE_PRESCRIBED_SHORTENING_CA_LAND_TARGET_ID =
  "prescribed-shortening-ca-land-source";
const LAND_SOURCE_HEALTH_CONSERVATION_TOLERANCE = 1e-12;
const DEFAULT_INITIAL_LAND_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_INITIAL_CALCIUM_STATE = Float64Array.from([0, 0]);
const DEFAULT_DURATION_SEC = 0.8;
const DEFAULT_CYCLE_LENGTH_SEC = 0.8;
const DEFAULT_DT_SEC = 0.001;
const DEFAULT_LAND_SOLVE_OPTIONS: Land2017SubstepSolveOptions = {
  maxIterations: 16,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
  substeps: 4,
};

export function runCalciumLandPrescribedShorteningPhase2CReport(
  options: CalciumLandPrescribedShorteningRunOptions = {},
): CalciumLandPrescribedShorteningProtocolReport {
  const family = runCalciumLandPrescribedShorteningTrajectoryFamily(options);
  const trajectoryFamily = resolvedTrajectoryFamily(options);
  const trajectoryProvenanceHash = computeCalciumLandPrescribedShorteningTrajectoryProvenanceHash(options);
  const sections: CalciumLandPrescribedShorteningProtocolSection[] = [
    runTrajectoryFamilyCompletionSection(family, trajectoryProvenanceHash),
    runRateDerivationAuditSection(family),
    runSourceHealthSection(family),
    runMorphologyTransferSmokeSection(family),
    runClaimBoundarySection(trajectoryFamily),
    runDeterministicReplaySection(options),
  ];
  sections.push({
    id: "deferred-experimental-items",
    status: "deferred-target",
    metrics: {
      count: protocolDescriptor.pendingOwnerDecisions.length,
      experimentalTargets: "deferred",
    },
  });
  const closureSections = sections.filter((section) => section.status !== "deferred-target");
  const closurePass = closureSections.every((section) => section.status === "closure-pass");
  const hashInput = {
    trajectoryProvenanceHash,
    memberSummaries: family.map(compactTrajectoryMemberSummary),
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
  };

  return {
    protocolSetId: protocolDescriptor.protocolSetId,
    claimBoundary: CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY,
    evidenceStatus: CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    trajectoryFamily: {
      trajectoryProvenanceHash,
      members: trajectoryFamily,
    },
    sections,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

export function runCalciumLandPrescribedShorteningTrajectoryFamily(
  options: CalciumLandPrescribedShorteningRunOptions = {},
): readonly CalciumLandPrescribedShorteningTrajectoryMember[] {
  return resolvedTrajectoryFamily(options).map((definition) =>
    runCalciumLandPrescribedShorteningTrajectory(definition, options),
  );
}

export function runCalciumLandPrescribedShorteningTrajectory(
  definition: CalciumLandPrescribedShorteningTrajectoryDefinition,
  options: CalciumLandPrescribedShorteningRunOptions = {},
): CalciumLandPrescribedShorteningTrajectoryMember {
  const params = options.params ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET;
  const cycleLengthSec = options.cycleLengthSec ?? DEFAULT_CYCLE_LENGTH_SEC;
  const durationSec = options.durationSec ?? DEFAULT_DURATION_SEC;
  const dtSec = options.dtSec ?? DEFAULT_DT_SEC;
  const steps = Math.max(1, Math.round(durationSec / dtSec));
  const landSolveOptions = { ...DEFAULT_LAND_SOLVE_OPTIONS, ...options.landSolveOptions };
  let calciumState = Float64Array.from(options.initialCalciumState ?? DEFAULT_INITIAL_CALCIUM_STATE);
  let landState = Float64Array.from(options.initialLandState ?? DEFAULT_INITIAL_LAND_STATE);
  let previousFreeCalciumUM = initialPrescribedFreeCalciumUM(calciumState, params, cycleLengthSec, dtSec);
  const samples: CalciumLandPrescribedShorteningSample[] = [];

  for (let step = 1; step <= steps; step += 1) {
    const previousTimeSec = (step - 1) * dtSec;
    const timeSec = step * dtSec;
    const cycleIndex = Math.floor((timeSec + 1e-12) / cycleLengthSec);
    const timeSinceActivationSec = Math.max(0, timeSec - cycleIndex * cycleLengthSec);
    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      prescribedCalciumInput(cycleIndex + 1, timeSinceActivationSec, cycleLengthSec, dtSec),
      params,
    );
    calciumState = calciumStep.nextState;

    const previousFiberEngineeringStrain = strainAtTimeSec(definition, previousTimeSec);
    const stageFiberEngineeringStrain = strainAtTimeSec(definition, timeSec);
    const landInput: LandStepInput = {
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const solved = solveLand2017BackwardEulerSubsteps(
      landState,
      landInput,
      { ...landSolveOptions, previousFreeCalciumUM },
    );
    if (!solved.ok || !solved.output) {
      return makeTrajectoryMember(
        definition,
        false,
        samples,
        landState,
        calciumState,
        solved.failureReason ?? "unknown",
        solved.failureMessage,
      );
    }

    landState = solved.nextState;
    previousFreeCalciumUM = calciumStep.output.freeCalciumUM;
    const derivedFiberEngineeringStrainRatePerSec = deriveFiberEngineeringStrainRatePerSec(
      previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec,
    );
    const auditRate = (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / dtSec;
    samples.push({
      timeSec,
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec,
      derivedFiberEngineeringStrainRatePerSec,
      rateAuditResidualPerSec: derivedFiberEngineeringStrainRatePerSec - auditRate,
      sourceActiveFiberStressPa: solved.output.sourceActiveFiberStressPa,
      sourceActivePowerDensityWPerM3: solved.output.sourceActivePowerDensityWPerM3,
      minimumPopulation: solved.output.health.minimumPopulation,
      stateConservationResidual: solved.output.health.stateConservationResidual,
      landHealthFinite: solved.output.health.finite,
      projectionUsed: solved.output.health.projectionUsed,
      solverIterations: solved.iterations,
      solverResidualNorm: solved.residualNorm,
      solverSubsteps: solved.substeps,
    });
  }

  return makeTrajectoryMember(definition, true, samples, landState, calciumState);
}

export function computeCalciumLandPrescribedShorteningTrajectoryProvenanceHash(
  options: CalciumLandPrescribedShorteningRunOptions = {},
): string {
  return stableHash(sanitizeForStableHash(trajectoryProvenanceInput(options)));
}

function runTrajectoryFamilyCompletionSection(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
  trajectoryProvenanceHash: string,
): CalciumLandPrescribedShorteningProtocolSection {
  const ids = family.map((member) => member.id);
  const expectedIds = Array.from(CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS);
  const completeIds =
    ids.length === expectedIds.length
    && expectedIds.every((id, index) => ids[index] === id);
  const allComplete = family.every((member) => member.ok && member.samples.length > 0);
  return section("trajectory-family-completion-v1", completeIds && allComplete, {
    memberCount: family.length,
    expectedMemberCount: expectedIds.length,
    trajectoryIds: ids,
    expectedTrajectoryIds: expectedIds,
    allComplete,
    trajectoryProvenanceHash,
  });
}

function runRateDerivationAuditSection(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
): CalciumLandPrescribedShorteningProtocolSection {
  const maxRateAuditResidualPerSec = maxMetric(family, (member) => member.metrics.maxRateAuditResidualPerSec);
  const finiteSamples = family.every((member) =>
    member.samples.every((sample) =>
      Number.isFinite(sample.derivedFiberEngineeringStrainRatePerSec)
      && Number.isFinite(sample.previousFiberEngineeringStrain)
      && Number.isFinite(sample.stageFiberEngineeringStrain)
      && Number.isFinite(sample.dtSec)
      && Math.abs(
        sample.derivedFiberEngineeringStrainRatePerSec
        - (sample.stageFiberEngineeringStrain - sample.previousFiberEngineeringStrain) / sample.dtSec,
      ) <= 1e-14,
    ),
  );
  return section("rate-derivation-audit-v1", finiteSamples && maxRateAuditResidualPerSec <= 1e-14, {
    maxRateAuditResidualPerSec,
    finiteSamples,
    inputPolicy: "previous-stage-dt-derived",
  });
}

function runSourceHealthSection(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
): CalciumLandPrescribedShorteningProtocolSection {
  const allLandHealthFinite = family.every((member) => member.metrics.allLandHealthFinite);
  const maxConservationResidual = maxMetric(family, (member) => member.metrics.maxConservationResidual);
  const projectionUsed = family.some((member) => member.metrics.projectionUsed);
  const solverFailureCount = family.reduce((sum, member) => sum + member.metrics.solverFailureCount, 0);
  return section(
    "source-health-v1",
    allLandHealthFinite
      && maxConservationResidual <= LAND_SOURCE_HEALTH_CONSERVATION_TOLERANCE
      && !projectionUsed
      && solverFailureCount === 0,
    {
      allLandHealthFinite,
      maxConservationResidual,
      sourceHealthConservationTolerance: LAND_SOURCE_HEALTH_CONSERVATION_TOLERANCE,
      projectionUsed,
      solverFailureCount,
    },
  );
}

function runMorphologyTransferSmokeSection(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
): CalciumLandPrescribedShorteningProtocolSection {
  const zeroRate = requiredMember(family, "zero-rate-isometric");
  const physiologic = requiredMember(family, "physiologic-shortening");
  const stressPeakDeltaPa = physiologic.metrics.peakStressPa - zeroRate.metrics.peakStressPa;
  const peakAbsPowerDensityDeltaWPerM3 =
    physiologic.metrics.peakAbsPowerDensityWPerM3 - zeroRate.metrics.peakAbsPowerDensityWPerM3;
  const shapeDistance = normalizedStressShapeDistance(physiologic.samples, zeroRate.samples);
  const fwhmDeltaMs = physiologic.metrics.fwhmMs - zeroRate.metrics.fwhmMs;
  const ok =
    zeroRate.ok
    && physiologic.ok
    && Number.isFinite(stressPeakDeltaPa)
    && Math.abs(stressPeakDeltaPa) > 1
    && Number.isFinite(peakAbsPowerDensityDeltaWPerM3)
    && peakAbsPowerDensityDeltaWPerM3 > 0
    && Number.isFinite(shapeDistance)
    && shapeDistance > 1e-4
    && Number.isFinite(fwhmDeltaMs);
  return section("morphology-transfer-smoke-v1", ok, {
    stressPeakDeltaPa,
    peakAbsPowerDensityDeltaWPerM3,
    shapeDistance,
    fwhmDeltaMs,
    syntheticTransferOnly: true,
    sourceMetricsOnly: true,
  });
}

function runClaimBoundarySection(
  trajectoryFamily: readonly CalciumLandPrescribedShorteningTrajectoryDefinition[],
): CalciumLandPrescribedShorteningProtocolSection {
  const descriptorIds = protocolDescriptor.trajectoryFamily.members.map((member) => member.id);
  const implementationIds = trajectoryFamily.map((member) => member.id);
  const descriptorOk =
    protocolDescriptor.claimBoundary === CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && descriptorIds.length === implementationIds.length
    && implementationIds.every((id, index) => descriptorIds[index] === id);
  return section("prescribed-shortening-claim-boundary-v1", descriptorOk, {
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    descriptorMemberCount: descriptorIds.length,
    implementationMemberCount: implementationIds.length,
  });
}

function runDeterministicReplaySection(
  options: CalciumLandPrescribedShorteningRunOptions,
): CalciumLandPrescribedShorteningProtocolSection {
  const first = runCalciumLandPrescribedShorteningTrajectoryFamily(options);
  const second = runCalciumLandPrescribedShorteningTrajectoryFamily(options);
  const firstHash = stableHash(sanitizeForStableHash(first.map(compactTrajectoryMember)));
  const secondHash = stableHash(sanitizeForStableHash(second.map(compactTrajectoryMember)));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function makeTrajectoryMember(
  definition: CalciumLandPrescribedShorteningTrajectoryDefinition,
  ok: boolean,
  samples: readonly CalciumLandPrescribedShorteningSample[],
  finalLandState: Float64Array,
  finalCalciumState: Float64Array,
  failureReason?: string,
  failureMessage?: string,
): CalciumLandPrescribedShorteningTrajectoryMember {
  const memberWithoutMetrics = {
    id: definition.id,
    definition,
    ok,
    samples,
    finalLandState,
    finalCalciumState,
    failureReason,
    failureMessage,
  };
  return {
    ...memberWithoutMetrics,
    metrics: computeTrajectoryMetrics(memberWithoutMetrics),
  };
}

function computeTrajectoryMetrics(
  trajectory: Pick<CalciumLandPrescribedShorteningTrajectoryMember, "ok" | "samples">,
): CalciumLandPrescribedShorteningTrajectoryMetrics {
  if (trajectory.samples.length === 0) {
    return emptyTrajectoryMetrics(trajectory.ok);
  }
  const samples = trajectory.samples;
  const stresses = samples.map((sample) => sample.sourceActiveFiberStressPa);
  const powers = samples.map((sample) => sample.sourceActivePowerDensityWPerM3);
  const times = samples.map((sample) => sample.timeSec);
  const baseline = stresses[0];
  const peak = Math.max(...stresses);
  const peakIndex = stresses.indexOf(peak);
  const meanStressPa = mean(stresses);
  const stressTimeIntegralPaSec = integrateSamples(times, stresses);
  const maxConservationResidual = Math.max(
    ...samples.map((sample) => Math.abs(sample.stateConservationResidual)),
  );
  const maxRateAuditResidualPerSec = Math.max(
    ...samples.map((sample) => Math.abs(sample.rateAuditResidualPerSec)),
  );
  return {
    peakStressPa: peak,
    meanStressPa,
    stressTimeIntegralPaSec,
    timeToPeakMs: (times[peakIndex] ?? 0) * 1000,
    fwhmMs: widthAtFractionMs(times, stresses, baseline, peak, 0.5),
    width80Ms: widthAtFractionMs(times, stresses, baseline, peak, 0.8),
    peakAbsPowerDensityWPerM3: Math.max(...powers.map(Math.abs)),
    meanPowerDensityWPerM3: mean(powers),
    minimumPopulation: Math.min(...samples.map((sample) => sample.minimumPopulation)),
    maxConservationResidual,
    sourceHealthConservationTolerance: LAND_SOURCE_HEALTH_CONSERVATION_TOLERANCE,
    allLandHealthFinite: samples.every((sample) => sample.landHealthFinite),
    projectionUsed: samples.some((sample) => sample.projectionUsed),
    solverFailureCount: trajectory.ok ? 0 : 1,
    maxRateAuditResidualPerSec,
    samples: samples.length,
  };
}

function emptyTrajectoryMetrics(ok: boolean): CalciumLandPrescribedShorteningTrajectoryMetrics {
  return {
    peakStressPa: Number.NaN,
    meanStressPa: Number.NaN,
    stressTimeIntegralPaSec: Number.NaN,
    timeToPeakMs: Number.NaN,
    fwhmMs: Number.NaN,
    width80Ms: Number.NaN,
    peakAbsPowerDensityWPerM3: Number.NaN,
    meanPowerDensityWPerM3: Number.NaN,
    minimumPopulation: Number.NaN,
    maxConservationResidual: Number.NaN,
    sourceHealthConservationTolerance: LAND_SOURCE_HEALTH_CONSERVATION_TOLERANCE,
    allLandHealthFinite: false,
    projectionUsed: false,
    solverFailureCount: ok ? 0 : 1,
    maxRateAuditResidualPerSec: Number.NaN,
    samples: 0,
  };
}

function resolvedTrajectoryFamily(
  options: CalciumLandPrescribedShorteningRunOptions,
): readonly CalciumLandPrescribedShorteningTrajectoryDefinition[] {
  return options.trajectoryFamily ?? CALCIUM_LAND_PRESCRIBED_SHORTENING_TRAJECTORY_FAMILY;
}

function trajectoryProvenanceInput(options: CalciumLandPrescribedShorteningRunOptions): unknown {
  return {
    calciumParameterSetId: (options.params ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET).parameterSetId
      ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
    landParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    cycleLengthSec: options.cycleLengthSec ?? DEFAULT_CYCLE_LENGTH_SEC,
    durationSec: options.durationSec ?? DEFAULT_DURATION_SEC,
    dtSec: options.dtSec ?? DEFAULT_DT_SEC,
    trajectoryFamily: resolvedTrajectoryFamily(options).map((definition) => ({ ...definition })),
  };
}

function strainAtTimeSec(
  definition: CalciumLandPrescribedShorteningTrajectoryDefinition,
  timeSec: number,
): number {
  if (definition.shape === "zero-rate" || definition.deltaFiberEngineeringStrain === 0) {
    return definition.initialFiberEngineeringStrain;
  }
  const progress = clamp01((timeSec - definition.onsetSec) / definition.durationSec);
  if (definition.shape === "linear") {
    return definition.initialFiberEngineeringStrain + definition.deltaFiberEngineeringStrain * progress;
  }
  const smoothProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);
  return definition.initialFiberEngineeringStrain + definition.deltaFiberEngineeringStrain * smoothProgress;
}

function deriveFiberEngineeringStrainRatePerSec(
  previousFiberEngineeringStrain: number,
  stageFiberEngineeringStrain: number,
  dtSec: number,
): number {
  return (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / dtSec;
}

function initialPrescribedFreeCalciumUM(
  calciumState: ArrayLike<number>,
  params: PrescribedCalciumParams,
  cycleLengthSec: number,
  dtSec: number,
): number {
  return evaluatePrescribedCalciumOutput(
    calciumState,
    prescribedCalciumInput(1, 0, cycleLengthSec, dtSec),
    params,
  ).freeCalciumUM;
}

function prescribedCalciumInput(
  activationEventId: number,
  timeSinceActivationSec: number,
  cycleLengthSec: number,
  dtSec: number,
): PrescribedCalciumInput {
  return {
    targetId: STANDALONE_PRESCRIBED_SHORTENING_CA_LAND_TARGET_ID,
    activationEventId,
    timeSinceActivationSec,
    cycleLengthSec,
    activationStrength01: 1,
    dtSec,
  };
}

function requiredMember(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
  id: CalciumLandPrescribedShorteningTrajectoryId,
): CalciumLandPrescribedShorteningTrajectoryMember {
  const member = family.find((candidate) => candidate.id === id);
  if (!member) throw new Error(`Missing prescribed shortening trajectory member: ${id}`);
  return member;
}

function normalizedStressShapeDistance(
  left: readonly CalciumLandPrescribedShorteningSample[],
  right: readonly CalciumLandPrescribedShorteningSample[],
): number {
  const count = Math.min(left.length, right.length);
  if (count === 0) return Number.NaN;
  const scale = Math.max(
    1,
    ...right.slice(0, count).map((sample) => Math.abs(sample.sourceActiveFiberStressPa)),
  );
  let sumSquares = 0;
  for (let index = 0; index < count; index += 1) {
    const diff = left[index].sourceActiveFiberStressPa - right[index].sourceActiveFiberStressPa;
    sumSquares += (diff / scale) ** 2;
  }
  return Math.sqrt(sumSquares / count);
}

function widthAtFractionMs(
  times: readonly number[],
  stresses: readonly number[],
  baseline: number,
  peak: number,
  fraction: number,
): number {
  const threshold = baseline + fraction * (peak - baseline);
  const indices = stresses.flatMap((stress, index) => (stress >= threshold ? [index] : []));
  if (indices.length === 0) return Number.NaN;
  return ((times[indices[indices.length - 1]] ?? 0) - (times[indices[0]] ?? 0)) * 1000;
}

function integrateSamples(times: readonly number[], values: readonly number[]): number {
  if (times.length < 2 || values.length < 2) return 0;
  let integral = 0;
  for (let index = 1; index < times.length; index += 1) {
    const dt = times[index] - times[index - 1];
    integral += 0.5 * dt * (values[index] + values[index - 1]);
  }
  return integral;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxMetric(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
  select: (member: CalciumLandPrescribedShorteningTrajectoryMember) => number,
): number {
  if (family.length === 0) return Number.NaN;
  return Math.max(...family.map(select));
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, CalciumLandPrescribedShorteningMetricValue>,
): CalciumLandPrescribedShorteningProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function compactTrajectoryMemberSummary(member: CalciumLandPrescribedShorteningTrajectoryMember): unknown {
  return {
    id: member.id,
    ok: member.ok,
    metrics: member.metrics,
    failureReason: member.failureReason,
  };
}

function compactTrajectoryMember(member: CalciumLandPrescribedShorteningTrajectoryMember): unknown {
  return {
    id: member.id,
    ok: member.ok,
    samples: member.samples.map((sample) => ({
      timeSec: round(sample.timeSec),
      freeCalciumUM: round(sample.freeCalciumUM),
      previousFiberEngineeringStrain: round(sample.previousFiberEngineeringStrain),
      stageFiberEngineeringStrain: round(sample.stageFiberEngineeringStrain),
      dtSec: round(sample.dtSec),
      derivedFiberEngineeringStrainRatePerSec: round(sample.derivedFiberEngineeringStrainRatePerSec),
      sourceActiveFiberStressPa: round(sample.sourceActiveFiberStressPa),
      sourceActivePowerDensityWPerM3: round(sample.sourceActivePowerDensityWPerM3),
      minimumPopulation: round(sample.minimumPopulation),
      stateConservationResidual: round(sample.stateConservationResidual),
      landHealthFinite: sample.landHealthFinite,
      projectionUsed: sample.projectionUsed,
    })),
    finalLandState: Array.from(member.finalLandState).map(round),
    finalCalciumState: Array.from(member.finalCalciumState).map(round),
    failureReason: member.failureReason,
  };
}

function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
}

function sanitizeForStableHash(value: unknown): unknown {
  if (typeof value === "number") {
    return Number.isFinite(value) ? round(value) : String(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeForStableHash);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, sanitizeForStableHash(child)]),
    );
  }
  return value;
}

function round(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
