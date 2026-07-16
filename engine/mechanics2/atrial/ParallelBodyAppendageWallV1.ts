import {
  commitLandActivePassiveSlsTrialV1,
  initialLandActivePassiveSlsStateV1,
  trialLandActivePassiveSlsV1,
  type LandActivePassiveSlsParamsV1,
  type LandActivePassiveSlsStateV1,
  type LandActivePassiveSlsTrialV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
  type OneFiberVolumeGeometryParamsV1,
  type OneFiberVolumeGeometryV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";

const PA_PER_MMHG = 133.322;

export const PARALLEL_BODY_APPENDAGE_WALL_V1_ID =
  "parallel-body-appendage-wall-v1" as const;

export type ParallelAtrialRegionParamsV1 = {
  readonly geometry: OneFiberVolumeGeometryParamsV1;
  readonly material: LandActivePassiveSlsParamsV1;
};

export type ParallelBodyAppendageWallParamsV1 = {
  readonly body: ParallelAtrialRegionParamsV1;
  readonly appendage: ParallelAtrialRegionParamsV1;
  /** Cold-start partition only; it is not a prescribed trajectory. */
  readonly initialAppendageFraction01: number;
  readonly minimumAppendageFraction01: number;
  readonly maximumAppendageFraction01: number;
  readonly solver: {
    readonly scanIntervals: number;
    readonly maxBracketedIterations: number;
    readonly pressureToleranceMmHg: number;
    readonly volumeToleranceMl: number;
    readonly monotonicityToleranceMmHg: number;
  };
};

export type ParallelBodyAppendageWallStateV1 = {
  readonly kind: typeof PARALLEL_BODY_APPENDAGE_WALL_V1_ID;
  /** Accepted algebraic coordinate retained only as the next Newton seed. */
  readonly appendageVolumeMl: number;
  readonly body: LandActivePassiveSlsStateV1;
  readonly appendage: LandActivePassiveSlsStateV1;
};

export type ParallelAtrialRegionTrialV1 = {
  readonly volumeMl: number;
  readonly geometry: OneFiberVolumeGeometryV1;
  readonly materialTrial: LandActivePassiveSlsTrialV1;
  readonly pressureMmHg: number;
};

export type ParallelBodyAppendageWallTrialV1 = {
  readonly previousState: ParallelBodyAppendageWallStateV1;
  readonly nextState: ParallelBodyAppendageWallStateV1 | null;
  readonly totalVolumeMl: number;
  readonly body: ParallelAtrialRegionTrialV1 | null;
  readonly appendage: ParallelAtrialRegionTrialV1 | null;
  readonly commonPressureMmHg: number | null;
  readonly pressureMismatchMmHg: number | null;
  readonly pressureBracketCount: number;
  readonly residualMonotone: boolean;
  readonly iterations: number;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
};

type AcceptedMaterialTrial = LandActivePassiveSlsTrialV1 & {
  readonly nextState: LandActivePassiveSlsStateV1;
  readonly readback: NonNullable<LandActivePassiveSlsTrialV1["readback"]>;
};

type PartitionEvaluation = {
  readonly body: ParallelAtrialRegionTrialV1;
  readonly appendage: ParallelAtrialRegionTrialV1;
  readonly residualMmHg: number;
};

export function initialParallelBodyAppendageWallStateV1(
  totalVolumeMl: number,
  freeCalciumUm: number,
  params: ParallelBodyAppendageWallParamsV1,
): ParallelBodyAppendageWallStateV1 {
  validateParams(params);
  requirePositive(totalVolumeMl, "totalVolumeMl");
  const appendageVolumeMl =
    totalVolumeMl * params.initialAppendageFraction01;
  const bodyVolumeMl = totalVolumeMl - appendageVolumeMl;
  const bodyGeometry = evaluateOneFiberVolumeGeometryV1(
    bodyVolumeMl,
    params.body.geometry,
  );
  const appendageGeometry = evaluateOneFiberVolumeGeometryV1(
    appendageVolumeMl,
    params.appendage.geometry,
  );
  return Object.freeze({
    kind: PARALLEL_BODY_APPENDAGE_WALL_V1_ID,
    appendageVolumeMl,
    body: initialLandActivePassiveSlsStateV1(
      bodyGeometry.fiberNaturalStrain,
      freeCalciumUm,
      params.body.material,
    ),
    appendage: initialLandActivePassiveSlsStateV1(
      appendageGeometry.fiberNaturalStrain,
      freeCalciumUm,
      params.appendage.material,
    ),
  });
}

/**
 * Solves the local constrained minimum
 *
 *   V_body + V_appendage = V_LA,
 *   P_body = P_appendage.
 *
 * Both regions share one pressure node; no artificial ostial pressure drop or
 * hidden blood reservoir is introduced.  The bounded scan rejects missing or
 * multiple sign-changing equilibria; the residual-monotonicity flag remains
 * explicit because active force-length behavior need not be monotone.  A
 * safeguarded bracketed secant solve then fails closed if it cannot converge.
 */
export function trialParallelBodyAppendageWallV1(
  previousState: ParallelBodyAppendageWallStateV1,
  input: {
    readonly dtSec: number;
    readonly totalVolumeMl: number;
    readonly freeCalciumUm: number;
  },
  params: ParallelBodyAppendageWallParamsV1,
): ParallelBodyAppendageWallTrialV1 {
  validateParams(params);
  const issues: string[] = [];
  if (previousState.kind !== PARALLEL_BODY_APPENDAGE_WALL_V1_ID) {
    issues.push("state-kind-mismatch");
  }
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0) {
    issues.push("invalid-dt");
  }
  if (!Number.isFinite(input.totalVolumeMl) || input.totalVolumeMl <= 0) {
    issues.push("invalid-total-volume");
  }
  if (!Number.isFinite(input.freeCalciumUm) || input.freeCalciumUm < 0) {
    issues.push("invalid-free-calcium");
  }
  if (issues.length > 0) return invalidTrial(previousState, input, issues);

  const minimumAppendageVolumeMl =
    input.totalVolumeMl * params.minimumAppendageFraction01;
  const maximumAppendageVolumeMl =
    input.totalVolumeMl * params.maximumAppendageFraction01;
  const cache = new Map<number, PartitionEvaluation | null>();
  const evaluateAt = (appendageVolumeMl: number) => {
    const cached = cache.get(appendageVolumeMl);
    if (cached !== undefined || cache.has(appendageVolumeMl)) return cached;
    const evaluation = evaluatePartition(
      previousState,
      input,
      params,
      appendageVolumeMl,
    );
    cache.set(appendageVolumeMl, evaluation);
    return evaluation;
  };

  const samples: { volumeMl: number; value: PartitionEvaluation }[] = [];
  for (let index = 0; index <= params.solver.scanIntervals; index += 1) {
    const fraction = index / params.solver.scanIntervals;
    const volumeMl = minimumAppendageVolumeMl +
      fraction * (maximumAppendageVolumeMl - minimumAppendageVolumeMl);
    const value = evaluateAt(volumeMl);
    if (value === null) {
      issues.push("invalid-partition-sample");
      return invalidTrial(previousState, input, issues);
    }
    samples.push({ volumeMl, value });
  }

  let residualMonotone = true;
  for (let index = 1; index < samples.length; index += 1) {
    if (
      samples[index]!.value.residualMmHg >
      samples[index - 1]!.value.residualMmHg +
        params.solver.monotonicityToleranceMmHg
    ) {
      residualMonotone = false;
      break;
    }
  }
  const brackets: Array<readonly [number, number]> = [];
  let exact: PartitionEvaluation | null = null;
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index]!;
    if (
      Math.abs(current.value.residualMmHg) <=
      params.solver.pressureToleranceMmHg
    ) {
      exact = current.value;
      break;
    }
    const next = samples[index + 1];
    if (
      next !== undefined &&
      Math.sign(current.value.residualMmHg) !==
        Math.sign(next.value.residualMmHg)
    ) {
      brackets.push([current.volumeMl, next.volumeMl]);
    }
  }
  const pressureBracketCount = exact === null ? brackets.length : 1;
  if (pressureBracketCount !== 1) {
    issues.push(
      pressureBracketCount === 0
        ? "no-pressure-equilibrium-bracket"
        : "multiple-pressure-equilibria",
    );
    return invalidTrial(
      previousState,
      input,
      issues,
      pressureBracketCount,
      residualMonotone,
    );
  }

  let solution = exact;
  let iterations = 0;
  if (solution === null) {
    let [lower, upper] = brackets[0]!;
    let lowerEvaluation = evaluateAt(lower)!;
    let upperEvaluation = evaluateAt(upper)!;
    let lowerResidual = lowerEvaluation.residualMmHg;
    let upperResidual = upperEvaluation.residualMmHg;
    let retainedSide: "lower" | "upper" | null = null;
    for (; iterations < params.solver.maxBracketedIterations; iterations += 1) {
      const secant =
        upper -
        upperResidual * (upper - lower) /
          (upperResidual - lowerResidual);
      const guard = 0.05 * (upper - lower);
      const candidateVolume =
        Number.isFinite(secant) &&
          secant > lower + guard &&
          secant < upper - guard
          ? secant
          : 0.5 * (lower + upper);
      const candidateEvaluation = evaluateAt(candidateVolume);
      if (candidateEvaluation === null) {
        issues.push("invalid-bracketed-secant-trial");
        break;
      }
      solution = candidateEvaluation;
      if (
        Math.abs(solution.residualMmHg) <=
          params.solver.pressureToleranceMmHg ||
        upper - lower <= params.solver.volumeToleranceMl
      ) {
        break;
      }
      if (
        Math.sign(lowerEvaluation.residualMmHg) ===
        Math.sign(candidateEvaluation.residualMmHg)
      ) {
        lower = candidateVolume;
        lowerEvaluation = candidateEvaluation;
        lowerResidual = candidateEvaluation.residualMmHg;
        if (retainedSide === "upper") upperResidual *= 0.5;
        retainedSide = "upper";
      } else {
        upper = candidateVolume;
        upperEvaluation = candidateEvaluation;
        upperResidual = candidateEvaluation.residualMmHg;
        if (retainedSide === "lower") lowerResidual *= 0.5;
        retainedSide = "lower";
      }
    }
  }

  if (
    solution === null ||
    Math.abs(solution.residualMmHg) >
      params.solver.pressureToleranceMmHg
  ) {
    issues.push("pressure-equilibrium-not-converged");
    return invalidTrial(
      previousState,
      input,
      issues,
      pressureBracketCount,
      residualMonotone,
      iterations,
    );
  }

  const nextState = Object.freeze({
    kind: PARALLEL_BODY_APPENDAGE_WALL_V1_ID,
    appendageVolumeMl: solution.appendage.volumeMl,
    body: commitLandActivePassiveSlsTrialV1(
      solution.body.materialTrial as AcceptedMaterialTrial,
    ),
    appendage: commitLandActivePassiveSlsTrialV1(
      solution.appendage.materialTrial as AcceptedMaterialTrial,
    ),
  });
  return Object.freeze({
    previousState,
    nextState,
    totalVolumeMl: input.totalVolumeMl,
    body: solution.body,
    appendage: solution.appendage,
    commonPressureMmHg:
      0.5 *
      (solution.body.pressureMmHg + solution.appendage.pressureMmHg),
    pressureMismatchMmHg: solution.residualMmHg,
    pressureBracketCount,
    residualMonotone,
    iterations,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

/**
 * Pure constitutive trial at an explicit algebraic partition coordinate.
 *
 * The global 15-variable formulation uses pressureMismatchMmHg as its final
 * residual.  This avoids nesting a converged scalar root inside every finite-
 * difference evaluation while retaining the bounded standalone root solver
 * for unit and cold-start diagnostics.
 */
export function trialParallelBodyAppendageWallAtPartitionV1(
  previousState: ParallelBodyAppendageWallStateV1,
  input: {
    readonly dtSec: number;
    readonly totalVolumeMl: number;
    readonly appendageVolumeMl: number;
    readonly freeCalciumUm: number;
  },
  params: ParallelBodyAppendageWallParamsV1,
): ParallelBodyAppendageWallTrialV1 {
  validateParams(params);
  const issues: string[] = [];
  if (previousState.kind !== PARALLEL_BODY_APPENDAGE_WALL_V1_ID) {
    issues.push("state-kind-mismatch");
  }
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0) {
    issues.push("invalid-dt");
  }
  if (!Number.isFinite(input.totalVolumeMl) || input.totalVolumeMl <= 0) {
    issues.push("invalid-total-volume");
  }
  if (
    !Number.isFinite(input.appendageVolumeMl) ||
    input.appendageVolumeMl <= 0
  ) {
    issues.push("invalid-appendage-volume");
  }
  if (!Number.isFinite(input.freeCalciumUm) || input.freeCalciumUm < 0) {
    issues.push("invalid-free-calcium");
  }
  const fraction = input.appendageVolumeMl / input.totalVolumeMl;
  if (
    Number.isFinite(fraction) &&
    (fraction < params.minimumAppendageFraction01 ||
      fraction > params.maximumAppendageFraction01)
  ) {
    issues.push("appendage-fraction-outside-bounds");
  }
  if (issues.length > 0) return invalidTrial(previousState, input, issues);

  const solution = evaluatePartition(
    previousState,
    input,
    params,
    input.appendageVolumeMl,
  );
  if (solution === null) {
    return invalidTrial(previousState, input, ["invalid-partition-trial"]);
  }
  const nextState = Object.freeze({
    kind: PARALLEL_BODY_APPENDAGE_WALL_V1_ID,
    appendageVolumeMl: solution.appendage.volumeMl,
    body: commitLandActivePassiveSlsTrialV1(
      solution.body.materialTrial as AcceptedMaterialTrial,
    ),
    appendage: commitLandActivePassiveSlsTrialV1(
      solution.appendage.materialTrial as AcceptedMaterialTrial,
    ),
  });
  return Object.freeze({
    previousState,
    nextState,
    totalVolumeMl: input.totalVolumeMl,
    body: solution.body,
    appendage: solution.appendage,
    commonPressureMmHg:
      0.5 *
      (solution.body.pressureMmHg + solution.appendage.pressureMmHg),
    pressureMismatchMmHg: solution.residualMmHg,
    pressureBracketCount: 0,
    residualMonotone: true,
    iterations: 0,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

export function commitParallelBodyAppendageWallTrialV1(
  trial: ParallelBodyAppendageWallTrialV1,
): ParallelBodyAppendageWallStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState === null) {
    throw new Error("cannot commit an invalid parallel body-appendage trial");
  }
  return trial.nextState;
}

function accepted(
  trial: LandActivePassiveSlsTrialV1,
): trial is AcceptedMaterialTrial {
  return (
    trial.valid &&
    trial.finite &&
    trial.nextState !== null &&
    trial.readback !== null
  );
}

function evaluatePartition(
  previousState: ParallelBodyAppendageWallStateV1,
  input: {
    readonly dtSec: number;
    readonly totalVolumeMl: number;
    readonly freeCalciumUm: number;
  },
  params: ParallelBodyAppendageWallParamsV1,
  appendageVolumeMl: number,
): PartitionEvaluation | null {
  try {
    const bodyVolumeMl = input.totalVolumeMl - appendageVolumeMl;
    const bodyGeometry = evaluateOneFiberVolumeGeometryV1(
      bodyVolumeMl,
      params.body.geometry,
    );
    const appendageGeometry = evaluateOneFiberVolumeGeometryV1(
      appendageVolumeMl,
      params.appendage.geometry,
    );
    const bodyTrial = trialLandActivePassiveSlsV1(
      previousState.body,
      {
        dtSec: input.dtSec,
        fiberLogStrain: bodyGeometry.fiberNaturalStrain,
        freeCalciumUm: input.freeCalciumUm,
      },
      params.body.material,
    );
    const appendageTrial = trialLandActivePassiveSlsV1(
      previousState.appendage,
      {
        dtSec: input.dtSec,
        fiberLogStrain: appendageGeometry.fiberNaturalStrain,
        freeCalciumUm: input.freeCalciumUm,
      },
      params.appendage.material,
    );
    if (!accepted(bodyTrial) || !accepted(appendageTrial)) return null;
    const bodyPressureMmHg =
      oneFiberCavityPressurePaV1(
        bodyGeometry,
        bodyTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG;
    const appendagePressureMmHg =
      oneFiberCavityPressurePaV1(
        appendageGeometry,
        appendageTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG;
    if (
      !Number.isFinite(bodyPressureMmHg) ||
      !Number.isFinite(appendagePressureMmHg)
    ) return null;
    return Object.freeze({
      body: Object.freeze({
        volumeMl: bodyVolumeMl,
        geometry: bodyGeometry,
        materialTrial: bodyTrial,
        pressureMmHg: bodyPressureMmHg,
      }),
      appendage: Object.freeze({
        volumeMl: appendageVolumeMl,
        geometry: appendageGeometry,
        materialTrial: appendageTrial,
        pressureMmHg: appendagePressureMmHg,
      }),
      residualMmHg: bodyPressureMmHg - appendagePressureMmHg,
    });
  } catch {
    return null;
  }
}

function invalidTrial(
  previousState: ParallelBodyAppendageWallStateV1,
  input: { readonly totalVolumeMl: number },
  issues: readonly string[],
  pressureBracketCount = 0,
  residualMonotone = false,
  iterations = 0,
): ParallelBodyAppendageWallTrialV1 {
  return Object.freeze({
    previousState,
    nextState: null,
    totalVolumeMl: input.totalVolumeMl,
    body: null,
    appendage: null,
    commonPressureMmHg: null,
    pressureMismatchMmHg: null,
    pressureBracketCount,
    residualMonotone,
    iterations,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
  });
}

function validateParams(params: ParallelBodyAppendageWallParamsV1): void {
  requireFraction(
    params.initialAppendageFraction01,
    "initialAppendageFraction01",
  );
  requireFraction(
    params.minimumAppendageFraction01,
    "minimumAppendageFraction01",
  );
  requireFraction(
    params.maximumAppendageFraction01,
    "maximumAppendageFraction01",
  );
  if (
    params.minimumAppendageFraction01 >=
      params.initialAppendageFraction01 ||
    params.initialAppendageFraction01 >=
      params.maximumAppendageFraction01
  ) {
    throw new Error(
      "appendage fractions must satisfy minimum < initial < maximum",
    );
  }
  if (
    !Number.isInteger(params.solver.scanIntervals) ||
    params.solver.scanIntervals < 4
  ) {
    throw new Error("scanIntervals must be an integer >= 4");
  }
  if (
    !Number.isInteger(params.solver.maxBracketedIterations) ||
    params.solver.maxBracketedIterations < 1
  ) {
    throw new Error("maxBracketedIterations must be a positive integer");
  }
  requirePositive(
    params.solver.pressureToleranceMmHg,
    "pressureToleranceMmHg",
  );
  requirePositive(params.solver.volumeToleranceMl, "volumeToleranceMl");
  requirePositive(
    params.solver.monotonicityToleranceMmHg,
    "monotonicityToleranceMmHg",
  );
  const totalWallVolume =
    params.body.geometry.wallVolumeMl +
    params.appendage.geometry.wallVolumeMl;
  const totalReferenceCavityVolume =
    params.body.geometry.referenceCavityVolumeMl +
    params.appendage.geometry.referenceCavityVolumeMl;
  requirePositive(totalWallVolume, "total wall volume");
  requirePositive(totalReferenceCavityVolume, "total reference cavity volume");
}

function requireFraction(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new Error(`${name} must lie strictly inside (0, 1)`);
  }
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive and finite`);
  }
}
