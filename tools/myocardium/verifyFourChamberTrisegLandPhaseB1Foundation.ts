import { createHash } from "node:crypto";
import {
  auditRateFreeLand2017BackwardEulerEquivalenceV1,
  rateFreeLand2017StateToSourceV1,
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017BackwardEulerResidualJacobianV1,
  writeRateFreeLand2017BackwardEulerResidualV1,
  writeRateFreeLand2017RhsV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildFourChamberPhaseB1FoundationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ReadinessV1";
import {
  buildPhaseB1RateFreeLandFoundationManifestV1,
  phaseB1RateFreeLandFoundationManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/rateFreeLandFoundationManifestV1";
import {
  validateLand2017EquationState,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

const EXPECTED_FOUNDATION_MANIFEST_SHA256 =
  "fa588cd7d59169795429679eb5c4c824a8d4f68a20c8868a36ea2d950d6dfd2d";
const EXPECTED_FOUNDATION_READINESS_SHA256 =
  "e8b12dc997c4f9b159db7f6a516bc885a2a7bbb6aee8d0061f6f0a8e474949e6";

const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
const manifest = buildPhaseB1RateFreeLandFoundationManifestV1(bundle, sha256);
const readiness = buildFourChamberPhaseB1FoundationStatusV1(manifest);
const readinessSha256 = sha256(canonicalizeJson(readiness));
const failures: string[] = [];

const cases = [
  {
    familyId: "ventricular-human-37c-v1",
    parameterSet: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    targets: bundle.ventricularTargetPack.backwardEulerTargets,
  },
  {
    familyId: "atrial-human-prior-v1",
    parameterSet: buildAtrialHumanPriorLandEquationParametersV1(),
    targets: bundle.atrialTargetPack.backwardEulerTargets,
  },
] as const;

const metrics = {
  maximumAbsoluteSourceResidualEquivalenceDifference: 0,
  maximumAbsoluteTargetResidual: 0,
  maximumAbsoluteActiveStressDifferencePa: 0,
  maximumAbsoluteCoordinateRoundTripDifference: 0,
  minimumOffSolutionSourceResidualInfinityNorm: Number.POSITIVE_INFINITY,
  minimumAbsoluteOffSolutionSourceResidualEntry: Number.POSITIVE_INFINITY,
  maximumJacobianRelativeTwoNormDifference: 0,
};

for (const family of cases) {
  if (
    family.targets.length
      !== manifest.backwardEulerContract.sourceTargetCaseCountPerTissue
  ) {
    failures.push(
      family.familyId + " Phase A1 source target count drifted from the manifest",
    );
  }
  for (const target of family.targets) {
    const previous = sourceLand2017StateToRateFreeV1(
      target.previousState,
      target.lambdaLandPrevious,
      family.parameterSet,
    );
    const next = sourceLand2017StateToRateFreeV1(
      target.nextState,
      target.lambdaLandNext,
      family.parameterSet,
    );
    const step = {
      freeCalciumUM: target.freeCalciumUM,
      previousLandStretch: target.lambdaLandPrevious,
      stageLandStretch: target.lambdaLandNext,
      dtSec: target.dtSec,
    } as const;
    const audit = auditRateFreeLand2017BackwardEulerEquivalenceV1({
      previousRateFreeState: previous,
      nextRateFreeState: next,
      step,
      parameterSet: family.parameterSet,
    });
    const reconstructed = rateFreeLand2017StateToSourceV1(
      next,
      target.lambdaLandNext,
      family.parameterSet,
    );
    const analytic = writeRateFreeLand2017BackwardEulerResidualJacobianV1(
      next,
      step,
      family.parameterSet,
    );
    const independent = independentlyDifferenceJacobian(
      next,
      (values) => writeRateFreeLand2017BackwardEulerResidualV1(
        values,
        previous,
        step,
        family.parameterSet,
      ),
      manifest.numericalPolicy.independentJacobianScaledStep,
    );
    metrics.maximumAbsoluteSourceResidualEquivalenceDifference = Math.max(
      metrics.maximumAbsoluteSourceResidualEquivalenceDifference,
      audit.maximumAbsoluteResidualDifference,
    );
    metrics.maximumAbsoluteTargetResidual = Math.max(
      metrics.maximumAbsoluteTargetResidual,
      maxAbs(audit.rateFreeResidual),
      maxAbs(audit.sourceResidual),
    );
    metrics.maximumAbsoluteActiveStressDifferencePa = Math.max(
      metrics.maximumAbsoluteActiveStressDifferencePa,
      Math.abs(audit.activeStressDifferencePa),
    );
    metrics.maximumAbsoluteCoordinateRoundTripDifference = Math.max(
      metrics.maximumAbsoluteCoordinateRoundTripDifference,
      maxAbsDifference(reconstructed, target.nextState),
    );
    metrics.maximumJacobianRelativeTwoNormDifference = Math.max(
      metrics.maximumJacobianRelativeTwoNormDifference,
      relativeTwoNormDifference(analytic, independent),
    );
  }
  const offSolutionTarget = family.targets[0];
  const offSolutionNextSource = buildOffSolutionSourceState(
    offSolutionTarget.nextState,
  );
  const offSolutionPrevious = sourceLand2017StateToRateFreeV1(
    offSolutionTarget.previousState,
    offSolutionTarget.lambdaLandPrevious,
    family.parameterSet,
  );
  const offSolutionNext = sourceLand2017StateToRateFreeV1(
    offSolutionNextSource,
    offSolutionTarget.lambdaLandNext,
    family.parameterSet,
  );
  const offSolutionAudit = auditRateFreeLand2017BackwardEulerEquivalenceV1({
    previousRateFreeState: offSolutionPrevious,
    nextRateFreeState: offSolutionNext,
    step: {
      freeCalciumUM: offSolutionTarget.freeCalciumUM,
      previousLandStretch: offSolutionTarget.lambdaLandPrevious,
      stageLandStretch: offSolutionTarget.lambdaLandNext,
      dtSec: offSolutionTarget.dtSec,
    },
    parameterSet: family.parameterSet,
  });
  metrics.maximumAbsoluteSourceResidualEquivalenceDifference = Math.max(
    metrics.maximumAbsoluteSourceResidualEquivalenceDifference,
    offSolutionAudit.maximumAbsoluteResidualDifference,
  );
  metrics.minimumOffSolutionSourceResidualInfinityNorm = Math.min(
    metrics.minimumOffSolutionSourceResidualInfinityNorm,
    maxAbs(offSolutionAudit.sourceResidual),
  );
  metrics.minimumAbsoluteOffSolutionSourceResidualEntry = Math.min(
    metrics.minimumAbsoluteOffSolutionSourceResidualEntry,
    ...Array.from(offSolutionAudit.sourceResidual, (value) => Math.abs(value)),
  );
  verifyExplicitRateIsRejected(family.parameterSet, family.targets[0]);
}

if (
  manifest.contentSha256
    !== sha256(canonicalizeJson(
      phaseB1RateFreeLandFoundationManifestHashPayloadV1(manifest),
    ))
) {
  failures.push("Phase B1 foundation manifest content hash is not canonical");
}
if (manifest.contentSha256 !== EXPECTED_FOUNDATION_MANIFEST_SHA256) {
  failures.push("Phase B1 foundation manifest drifted without a version update");
}
if (readinessSha256 !== EXPECTED_FOUNDATION_READINESS_SHA256) {
  failures.push("Phase B1 foundation readiness boundary drifted without a version update");
}
if (
  metrics.maximumAbsoluteSourceResidualEquivalenceDifference
    >= manifest.numericalPolicy
      .maximumAbsoluteSourceResidualEquivalenceDifference
) {
  failures.push("Six-state rate-free and source-coordinate BE residuals diverged");
}
if (
  metrics.maximumAbsoluteTargetResidual
    >= manifest.numericalPolicy.maximumAbsoluteTargetResidual
) {
  failures.push("Rate-free Land BE target residual exceeded its component threshold");
}
if (
  metrics.maximumAbsoluteActiveStressDifferencePa
    >= manifest.numericalPolicy.maximumAbsoluteActiveStressDifferencePa
) {
  failures.push("Rate-free and source-coordinate Land active stress diverged");
}
if (
  metrics.maximumAbsoluteCoordinateRoundTripDifference
    >= manifest.numericalPolicy.maximumAbsoluteCoordinateRoundTripDifference
) {
  failures.push("Rate-free/source coordinate round trip exceeded roundoff tolerance");
}
if (
  metrics.minimumOffSolutionSourceResidualInfinityNorm
    <= manifest.numericalPolicy.minimumOffSolutionSourceResidualInfinityNorm
) {
  failures.push("Deliberate off-solution equivalence cases are too close to a BE root");
}
if (
  metrics.minimumAbsoluteOffSolutionSourceResidualEntry
    <= manifest.numericalPolicy.minimumAbsoluteOffSolutionSourceResidualEntry
) {
  failures.push("A deliberate off-solution case failed to excite every Land row");
}
if (
  metrics.maximumJacobianRelativeTwoNormDifference
    >= manifest.numericalPolicy.maximumJacobianRelativeTwoNormDifference
) {
  failures.push("Analytic fixed-stretch 6x6 BE Jacobian failed independent differencing");
}
if (
  manifest.coordinateContract.productionStateResidualUsesStrainRate
  || !manifest.backwardEulerContract.noProjection
  || !manifest.backwardEulerContract.noStateClamp
) {
  failures.push("Rate-free Land production residual boundary is inconsistent");
}
if (
  manifest.implementationBoundary.exactCalciumPropagationComponentAvailable
    !== true
  || Object.entries(manifest.implementationBoundary)
    .filter(([key]) => key !== "exactCalciumPropagationComponentAvailable")
    .some(([, value]) => value !== false)
  || Object.values(manifest.negativeClaims).some(Boolean)
) {
  failures.push("Phase B1 deferred implementation or negative-claim boundary drifted");
}
if (
  !readiness.phaseB1ComponentFoundationComplete
  || readiness.phaseB1MonolithicImplementationComplete
  || readiness.phaseB1AcceptanceComplete
  || readiness.supportedEnvelopeComplete
  || readiness.closedLoopReleaseEligible
  || readiness.clinicalReleaseReady
  || readiness.declaredMonolithicTopology.topologyImplemented
  || readiness.declaredMonolithicTopology.slsOnUnknownAndResidualCount !== 51
  || readiness.declaredMonolithicTopology.slsOffUnknownAndResidualCount !== 46
  || readiness.declaredMonolithicTopology
    .exactlyPropagatedStoredCalciumStatesExcludedFromNewton !== 10
) {
  failures.push("Phase B1 foundation readiness overclaims monolithic or release status");
}

const report = {
  pass: failures.length === 0,
  implementationPass: failures.length === 0,
  phaseB1MonolithicImplementationPass: false,
  phaseB1AcceptancePass: false,
  manifestSha256: manifest.contentSha256,
  readinessSha256,
  phaseA1TissueManifestBundleSha256: bundle.contentSha256,
  evidenceBoundary: readiness.evidenceBoundary,
  targetCaseCount: cases.reduce(
    (count, family) => count + family.targets.length,
    0,
  ),
  deliberatelyOffSolutionEquivalenceCaseCount: cases.length,
  tissueFamilyCount: cases.length,
  metrics,
  thresholds: manifest.numericalPolicy,
  declaredMonolithicTopology: readiness.declaredMonolithicTopology,
  deferred: readiness.deferred,
  negativeClaims: manifest.negativeClaims,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function verifyExplicitRateIsRejected(
  parameterSet: Land2017EquationParameters,
  target: (typeof cases)[number]["targets"][number],
): void {
  const state = sourceLand2017StateToRateFreeV1(
    target.previousState,
    target.lambdaLandPrevious,
    parameterSet,
  );
  let rejected = false;
  try {
    writeRateFreeLand2017RhsV1(
      state,
      {
        freeCalciumUM: target.freeCalciumUM,
        landStretch: target.lambdaLandPrevious,
        landStretchRatePerSec: 0,
      } as never,
      parameterSet,
    );
  } catch (error) {
    rejected = error instanceof Error && /must contain exactly/.test(error.message);
  }
  if (!rejected) {
    failures.push("Production rate-free Land RHS accepted an explicit stretch rate");
  }
}

function buildOffSolutionSourceState(
  targetState: readonly number[],
): Float64Array {
  const state = Float64Array.from(targetState);
  state[0] = 0.9 * state[0] + 0.02;
  state[1] *= 0.97;
  state[2] *= 0.93;
  state[3] *= 0.96;
  state[4] += 0.007;
  state[5] -= 0.006;
  validateLand2017EquationState(state);
  return state;
}

function independentlyDifferenceJacobian(
  state: readonly number[],
  residual: (state: readonly number[]) => ArrayLike<number>,
  scaledStep: number,
): Float64Array {
  const dimension = state.length;
  const output = new Float64Array(dimension * dimension);
  for (let column = 0; column < dimension; column += 1) {
    const h = scaledStep * Math.max(1, Math.abs(state[column]));
    const plus = [...state];
    const minus = [...state];
    plus[column] += h;
    minus[column] -= h;
    const residualPlus = residual(plus);
    const residualMinus = residual(minus);
    for (let row = 0; row < dimension; row += 1) {
      output[row * dimension + column] =
        (residualPlus[row] - residualMinus[row]) / (2 * h);
    }
  }
  return output;
}

function relativeTwoNormDifference(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  let differenceSquared = 0;
  let referenceSquared = 0;
  for (let index = 0; index < left.length; index += 1) {
    differenceSquared += (left[index] - right[index]) ** 2;
    referenceSquared += right[index] ** 2;
  }
  return Math.sqrt(differenceSquared)
    / Math.max(Math.sqrt(referenceSquared), 1e-15);
}

function maxAbs(values: ArrayLike<number>): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]));
  }
  return maximum;
}

function maxAbsDifference(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  if (left.length !== right.length) throw new Error("array lengths must match");
  let maximum = 0;
  for (let index = 0; index < left.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(left[index] - right[index]));
  }
  return maximum;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
