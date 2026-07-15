import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  auditRateFreeLand2017BackwardEulerEquivalenceV1,
  evaluateRateFreeLand2017OutputV1,
  rateFreeLand2017StateToSourceV1,
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017BackwardEulerResidualJacobianV1,
  writeRateFreeLand2017BackwardEulerResidualV1,
  writeRateFreeLand2017RhsV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  landDistortionEquivalenceParametersV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildPhaseB1RateFreeLandFoundationManifestV1,
  phaseB1RateFreeLandFoundationManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/rateFreeLandFoundationManifestV1";
import {
  validateLand2017EquationState,
  writeLand2017Rhs,
} from "@/engine/myocardium/myofilament/land2017/equations";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_INDEX,
} from "@/engine/myocardium/myofilament/land2017/types";

describe("four-chamber Phase B1 rate-free Land foundation", () => {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
  const manifest = buildPhaseB1RateFreeLandFoundationManifestV1(bundle, sha256);
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

  it.each(cases)(
    "is exactly backward-Euler equivalent to the $familyId source coordinates",
    ({ parameterSet, targets }) => {
      expect(targets).toHaveLength(
        manifest.backwardEulerContract.sourceTargetCaseCountPerTissue,
      );
      for (const target of targets) {
        const previousRateFree = sourceLand2017StateToRateFreeV1(
          target.previousState,
          target.lambdaLandPrevious,
          parameterSet,
        );
        const nextRateFree = sourceLand2017StateToRateFreeV1(
          target.nextState,
          target.lambdaLandNext,
          parameterSet,
        );
        const step = {
          freeCalciumUM: target.freeCalciumUM,
          previousLandStretch: target.lambdaLandPrevious,
          stageLandStretch: target.lambdaLandNext,
          dtSec: target.dtSec,
        } as const;
        const audit = auditRateFreeLand2017BackwardEulerEquivalenceV1({
          previousRateFreeState: previousRateFree,
          nextRateFreeState: nextRateFree,
          step,
          parameterSet,
        });
        expect(audit.maximumAbsoluteResidualDifference)
          .toBeLessThan(64 * Number.EPSILON);
        expect(Math.abs(audit.activeStressDifferencePa)).toBeLessThan(1e-12);
        expect(maxAbs(audit.rateFreeResidual)).toBeLessThan(2e-11);
        expect(maxAbs(audit.sourceResidual)).toBeLessThan(2e-11);
        expect(audit.productionStateResidualUsesStrainRate).toBe(false);
        expect(audit.sourceRateReconstructedForAuditOnly).toBe(true);
        expect(audit.projectionApplied).toBe(false);
        const reconstructed = rateFreeLand2017StateToSourceV1(
          nextRateFree,
          target.lambdaLandNext,
          parameterSet,
        );
        expect(maxAbsDifference(reconstructed, target.nextState))
          .toBeLessThan(16 * Number.EPSILON);
        const output = evaluateRateFreeLand2017OutputV1(
          nextRateFree,
          {
            freeCalciumUM: target.freeCalciumUM,
            landStretch: target.lambdaLandNext,
          },
          (target.lambdaLandNext - target.lambdaLandPrevious) / target.dtSec,
          parameterSet,
        );
        expect(output.sourceOutput.sourceActiveFiberStressPa)
          .toBeCloseTo(target.sourceActiveStressPa, 10);
        expect(output.strainRateUsedByStateEquations).toBe(false);
      }
    },
  );

  it.each(cases)(
    "preserves all six nonzero BE residual rows off-solution for $familyId",
    ({ parameterSet, targets }) => {
      const target = targets[0];
      const deliberatelyOffSolutionNext = buildOffSolutionSourceState(
        target.nextState,
      );
      const previousRateFree = sourceLand2017StateToRateFreeV1(
        target.previousState,
        target.lambdaLandPrevious,
        parameterSet,
      );
      const nextRateFree = sourceLand2017StateToRateFreeV1(
        deliberatelyOffSolutionNext,
        target.lambdaLandNext,
        parameterSet,
      );
      const audit = auditRateFreeLand2017BackwardEulerEquivalenceV1({
        previousRateFreeState: previousRateFree,
        nextRateFreeState: nextRateFree,
        step: {
          freeCalciumUM: target.freeCalciumUM,
          previousLandStretch: target.lambdaLandPrevious,
          stageLandStretch: target.lambdaLandNext,
          dtSec: target.dtSec,
        },
        parameterSet,
      });
      expect(maxAbs(audit.sourceResidual)).toBeGreaterThan(
        manifest.numericalPolicy.minimumOffSolutionSourceResidualInfinityNorm,
      );
      for (let index = 0; index < audit.sourceResidual.length; index += 1) {
        expect(Math.abs(audit.sourceResidual[index])).toBeGreaterThan(
          manifest.numericalPolicy
            .minimumAbsoluteOffSolutionSourceResidualEntry,
        );
        expect(Math.abs(
          audit.rateFreeResidual[index] - audit.sourceResidual[index],
        )).toBeLessThan(
          manifest.numericalPolicy
            .maximumAbsoluteSourceResidualEquivalenceDifference,
        );
      }
    },
  );

  it.each(cases)(
    "removes explicit stretch rate from all six $familyId state equations",
    ({ parameterSet, targets }) => {
      const target = targets[0];
      const lambda = target.lambdaLandPrevious;
      const lambdaRate = (
        target.lambdaLandNext - target.lambdaLandPrevious
      ) / target.dtSec;
      const sourceState = Float64Array.from(target.previousState);
      const rateFreeState = sourceLand2017StateToRateFreeV1(
        sourceState,
        lambda,
        parameterSet,
      );
      const sourceRhs = writeLand2017Rhs(
        sourceState,
        {
          freeCalciumUM: target.freeCalciumUM,
          fiberEngineeringStrain: lambda - 1,
          fiberEngineeringStrainRatePerSec: lambdaRate,
          zetaDriveFiberEngineeringStrainRatePerSec: lambdaRate,
        },
        parameterSet,
      );
      const rateFreeRhs = writeRateFreeLand2017RhsV1(
        rateFreeState,
        {
          freeCalciumUM: target.freeCalciumUM,
          landStretch: lambda,
        },
        parameterSet,
      );
      for (let index = 0; index < 4; index += 1) {
        expect(rateFreeRhs[index]).toBeCloseTo(sourceRhs[index], 13);
      }
      const distortion = landDistortionEquivalenceParametersV1(parameterSet.derived);
      expect(rateFreeRhs[4] + distortion.A.w * lambdaRate)
        .toBeCloseTo(sourceRhs[LAND2017_STATE_INDEX.zetaW], 13);
      expect(rateFreeRhs[5] + distortion.A.s * lambdaRate)
        .toBeCloseTo(sourceRhs[LAND2017_STATE_INDEX.zetaS], 13);
      expect(() => writeRateFreeLand2017RhsV1(
        rateFreeState,
        {
          freeCalciumUM: target.freeCalciumUM,
          landStretch: lambda,
          landStretchRatePerSec: lambdaRate,
        } as never,
        parameterSet,
      )).toThrow(/must contain exactly/);
    },
  );

  it.each(cases)(
    "has an independently differenced 6x6 BE Jacobian for $familyId",
    ({ parameterSet, targets }) => {
      for (const target of targets) {
        const previous = sourceLand2017StateToRateFreeV1(
          target.previousState,
          target.lambdaLandPrevious,
          parameterSet,
        );
        const next = sourceLand2017StateToRateFreeV1(
          target.nextState,
          target.lambdaLandNext,
          parameterSet,
        );
        const step = {
          freeCalciumUM: target.freeCalciumUM,
          previousLandStretch: target.lambdaLandPrevious,
          stageLandStretch: target.lambdaLandNext,
          dtSec: target.dtSec,
        } as const;
        const analytic = writeRateFreeLand2017BackwardEulerResidualJacobianV1(
          next,
          step,
          parameterSet,
        );
        const independent = independentlyDifferenceJacobian(
          next,
          (values) => writeRateFreeLand2017BackwardEulerResidualV1(
            values,
            previous,
            step,
            parameterSet,
          ),
        );
        expect(relativeTwoNormDifference(analytic, independent)).toBeLessThan(2e-7);
      }
    },
  );

  it("freezes a canonical component-only manifest without monolithic claims", () => {
    const payload = phaseB1RateFreeLandFoundationManifestHashPayloadV1(manifest);
    expect(manifest.contentSha256).toBe(sha256(canonicalizeJson(payload)));
    expect(manifest.contentSha256)
      .toBe("fa588cd7d59169795429679eb5c4c824a8d4f68a20c8868a36ea2d950d6dfd2d");
    expect(manifest.bindings.phaseA1TissueManifestBundleSha256)
      .toBe(bundle.contentSha256);
    expect(manifest.bindings.ventricularTargetPackSha256)
      .toBe(bundle.ventricularTargetPack.contentSha256);
    expect(manifest.bindings.atrialTargetPackSha256)
      .toBe(bundle.atrialTargetPack.contentSha256);
    expect(manifest.coordinateContract.productionStateResidualUsesStrainRate)
      .toBe(false);
    expect(manifest.backwardEulerContract.noProjection).toBe(true);
    expect(manifest.backwardEulerContract.noStateClamp).toBe(true);
    expect(manifest.implementationBoundary
      .exactCalciumPropagationComponentAvailable).toBe(true);
    for (const [key, value] of Object.entries(manifest.implementationBoundary)) {
      if (key !== "exactCalciumPropagationComponentAvailable") {
        expect(value).toBe(false);
      }
    }
    expect(Object.values(manifest.negativeClaims).every((claim) => !claim))
      .toBe(true);
  });
});

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
): Float64Array {
  const dimension = state.length;
  const output = new Float64Array(dimension * dimension);
  for (let column = 0; column < dimension; column += 1) {
    const h = 2 ** -20 * Math.max(1, Math.abs(state[column]));
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
  return Math.sqrt(differenceSquared) / Math.max(Math.sqrt(referenceSquared), 1e-15);
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
