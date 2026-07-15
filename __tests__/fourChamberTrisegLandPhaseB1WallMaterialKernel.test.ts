import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  sourceLand2017StateToRateFreeV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  evaluatePhaseB1WallBackwardEulerV1,
  evaluatePhaseB1WallMaterialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallRuntimeMaterialV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  LAND2017_STATE_INDEX,
} from "@/engine/myocardium/myofilament/land2017/types";

describe("four-chamber Phase B1 rate-free wall material kernel", () => {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256);
  const cases = [
    { wallId: "LA", slsMode: "on" },
    { wallId: "LA", slsMode: "off" },
    { wallId: "LVFW", slsMode: "on" },
    { wallId: "LVFW", slsMode: "off" },
  ] as const;

  it.each(cases)(
    "has complete fixed-internal-state stress partials for $wallId SLS-$slsMode",
    ({ wallId, slsMode }) => {
      const wallMaterial = binding.runtimeByWall[wallId];
      const fiberLogStrain = 0.05;
      const landState = interiorRateFreeState(
        wallMaterial,
        fiberLogStrain,
        [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
      );
      const alphaV = slsMode === "on" ? 0.035 : null;
      const base = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial,
        fiberLogStrain,
        freeCalciumUM: 0.4,
        landState,
        slsMode,
        alphaV,
      });
      const h = 2 ** -22;
      const strainDerivative = centralDifference(
        (strain) => evaluatePhaseB1WallMaterialStateV1({
          wallMaterial,
          fiberLogStrain: strain,
          freeCalciumUM: 0.4,
          landState,
          slsMode,
          alphaV,
        }).totalWallKirchhoffStressPa,
        fiberLogStrain,
        h,
      );
      expect(relativeDifference(
        base.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
        strainDerivative,
      )).toBeLessThan(2e-7);
      for (let column = 0; column < landState.length; column += 1) {
        const stateDerivative = centralDifference(
          (value) => {
            const candidate = [...landState];
            candidate[column] = value;
            return evaluatePhaseB1WallMaterialStateV1({
              wallMaterial,
              fiberLogStrain,
              freeCalciumUM: 0.4,
              landState: candidate as unknown as RateFreeLand2017StateV1,
              slsMode,
              alphaV,
            }).totalWallKirchhoffStressPa;
          },
          landState[column],
          h,
        );
        expect(relativeDifference(
          base.totalStressPartialsPaByLandState[column],
          stateDerivative,
        )).toBeLessThan(2e-7);
      }
      if (slsMode === "on") {
        const alphaDerivative = centralDifference(
          (alpha) => evaluatePhaseB1WallMaterialStateV1({
            wallMaterial,
            fiberLogStrain,
            freeCalciumUM: 0.4,
            landState,
            slsMode,
            alphaV: alpha,
          }).totalWallKirchhoffStressPa,
          alphaV,
          h,
        );
        expect(relativeDifference(
          base.totalStressPartialPaPerAlphaV ?? Number.NaN,
          alphaDerivative,
        )).toBeLessThan(2e-7);
      } else {
        expect(base.sls.statePhysicallyPresent).toBe(false);
        expect(base.totalStressPartialPaPerAlphaV).toBeNull();
      }
      expect(base.stabilizationStiffnessIncludedInStressOrTangent).toBe(false);
      expect(base.productionStateResidualUsesStrainRate).toBe(false);
      expect(base.sourceLandOutput.health.projectionUsed).toBe(false);
    },
  );

  it.each(cases)(
    "has the analytic Land strain cross-column for $wallId SLS-$slsMode",
    ({ wallId, slsMode }) => {
      const wallMaterial = binding.runtimeByWall[wallId];
      const previousFiberLogStrain = 0.04;
      const nextFiberLogStrain = 0.05;
      const previousLandState = interiorRateFreeState(
        wallMaterial,
        previousFiberLogStrain,
        [0.32, 0.11, 0.14, 0.18, 0.04, -0.25],
      );
      const nextLandState = interiorRateFreeState(
        wallMaterial,
        nextFiberLogStrain,
        [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
      );
      const previousAlphaV = slsMode === "on" ? 0.03 : null;
      const nextAlphaV = slsMode === "on" ? 0.035 : null;
      const common = {
        wallMaterial,
        previousFiberLogStrain,
        endpointFreeCalciumUM: 0.4,
        previousLandState,
        nextLandState,
        slsMode,
        previousAlphaV,
        nextAlphaV,
        dtSec: 2.5e-4,
      } as const;
      const base = evaluatePhaseB1WallBackwardEulerV1({
        ...common,
        nextFiberLogStrain,
      });
      const h = 2 ** -22;
      const plus = evaluatePhaseB1WallBackwardEulerV1({
        ...common,
        nextFiberLogStrain: nextFiberLogStrain + h,
      });
      const minus = evaluatePhaseB1WallBackwardEulerV1({
        ...common,
        nextFiberLogStrain: nextFiberLogStrain - h,
      });
      const independent = plus.landResidual.map(
        (value, row) => (value - minus.landResidual[row]) / (2 * h),
      );
      expect(base.landResidualPartialByNextFiberLogStrain).toHaveLength(6);
      expect(independent).toHaveLength(6);
      expect(relativeTwoNormDifference(
        base.landResidualPartialByNextFiberLogStrain,
        independent,
      )).toBeLessThan(2e-7);
      for (let row = 0; row < 6; row += 1) {
        expect(relativeDifference(
          base.landResidualPartialByNextFiberLogStrain[row],
          independent[row],
        )).toBeLessThan(2e-7);
      }
      expect(Math.abs(
        base.landResidualPartialByNextFiberLogStrain[LAND2017_STATE_INDEX.B],
      )).toBe(0);
      expect(Math.abs(independent[LAND2017_STATE_INDEX.B])).toBe(0);
      expect(base.landStateJacobianRowMajor).toHaveLength(36);
      expect(base.calciumResidualPresent).toBe(false);
      expect(base.calciumIsKnownEndpointForcing).toBe(true);
      if (slsMode === "on") {
        const independentSlsStrain = (
          (plus.slsResidual ?? Number.NaN) - (minus.slsResidual ?? Number.NaN)
        ) / (2 * h);
        expect(relativeDifference(
          base.slsResidualPartialByNextFiberLogStrain ?? Number.NaN,
          independentSlsStrain,
        )).toBeLessThan(2e-9);
        const alphaPlus = evaluatePhaseB1WallBackwardEulerV1({
          ...common,
          nextFiberLogStrain,
          nextAlphaV: (nextAlphaV ?? 0) + h,
        });
        const alphaMinus = evaluatePhaseB1WallBackwardEulerV1({
          ...common,
          nextFiberLogStrain,
          nextAlphaV: (nextAlphaV ?? 0) - h,
        });
        const independentSlsAlpha = (
          (alphaPlus.slsResidual ?? Number.NaN)
          - (alphaMinus.slsResidual ?? Number.NaN)
        ) / (2 * h);
        expect(relativeDifference(
          base.slsResidualPartialByNextAlphaV ?? Number.NaN,
          independentSlsAlpha,
        )).toBeLessThan(2e-9);
      } else {
        expect(base.slsResidual).toBeNull();
        expect(base.slsResidualPartialByNextFiberLogStrain).toBeNull();
        expect(base.slsResidualPartialByNextAlphaV).toBeNull();
      }
    },
  );

  it("rejects an SLS coordinate in the physically absent topology", () => {
    const wallMaterial = binding.runtimeByWall.LVFW;
    const landState = interiorRateFreeState(
      wallMaterial,
      0.05,
      [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
    );
    expect(() => evaluatePhaseB1WallMaterialStateV1({
      wallMaterial,
      fiberLogStrain: 0.05,
      freeCalciumUM: 0.4,
      landState,
      slsMode: "off",
      alphaV: 0,
    })).toThrow(/must be null/);
  });

  it("rejects both previous and next SLS ghost coordinates in backward Euler", () => {
    const wallMaterial = binding.runtimeByWall.LVFW;
    const previousFiberLogStrain = 0.04;
    const nextFiberLogStrain = 0.05;
    const previousLandState = interiorRateFreeState(
      wallMaterial,
      previousFiberLogStrain,
      [0.32, 0.11, 0.14, 0.18, 0.04, -0.25],
    );
    const nextLandState = interiorRateFreeState(
      wallMaterial,
      nextFiberLogStrain,
      [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
    );
    const common = {
      wallMaterial,
      previousFiberLogStrain,
      nextFiberLogStrain,
      endpointFreeCalciumUM: 0.4,
      previousLandState,
      nextLandState,
      slsMode: "off",
      dtSec: 2.5e-4,
    } as const;
    expect(() => evaluatePhaseB1WallBackwardEulerV1({
      ...common,
      previousAlphaV: 0,
      nextAlphaV: null,
    })).toThrow(/previousAlphaV must be null/);
    expect(() => evaluatePhaseB1WallBackwardEulerV1({
      ...common,
      previousAlphaV: null,
      nextAlphaV: 0,
    })).toThrow(/nextAlphaV must be null/);
  });

  it("rejects wall materials forged outside the canonical binding", () => {
    const wallMaterial = binding.runtimeByWall.LVFW;
    const forged = { ...wallMaterial } as PhaseB1WallRuntimeMaterialV1;
    const previousFiberLogStrain = 0.04;
    const nextFiberLogStrain = 0.05;
    const previousLandState = interiorRateFreeState(
      wallMaterial,
      previousFiberLogStrain,
      [0.32, 0.11, 0.14, 0.18, 0.04, -0.25],
    );
    const nextLandState = interiorRateFreeState(
      wallMaterial,
      nextFiberLogStrain,
      [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
    );
    expect(() => evaluatePhaseB1WallMaterialStateV1({
      wallMaterial: forged,
      fiberLogStrain: nextFiberLogStrain,
      freeCalciumUM: 0.4,
      landState: nextLandState,
      slsMode: "off",
      alphaV: null,
    })).toThrow(/canonical Phase A1 binding/);
    expect(() => evaluatePhaseB1WallBackwardEulerV1({
      wallMaterial: forged,
      previousFiberLogStrain,
      nextFiberLogStrain,
      endpointFreeCalciumUM: 0.4,
      previousLandState,
      nextLandState,
      slsMode: "off",
      previousAlphaV: null,
      nextAlphaV: null,
      dtSec: 2.5e-4,
    })).toThrow(/canonical Phase A1 binding/);
  });

  it("locks the exact semismooth strain cross-column conventions", () => {
    const wallMaterial = binding.runtimeByWall.LVFW;
    const beta0 = wallMaterial.landEquationParameters.values.beta0;
    const zeroLengthFactorStretch = (1.87 - 1 / beta0) / 2;
    const kinkCases: readonly {
      id: string;
      landStretch: number;
      zetaW: number;
      zetaS: number;
      convention: DifferenceConvention;
      zeroResidualRow?: number;
      zeroActiveStress?: boolean;
    }[] = [
      {
        id: "lambda=0.87 uses the capped inner-minimum branch",
        landStretch: 0.87,
        zetaW: 0.05,
        zetaS: -0.2,
        convention: "forward",
      },
      {
        id: "lambda=1.2 uses the capped outer-minimum branch",
        landStretch: 1.2,
        zetaW: 0.05,
        zetaS: -0.2,
        convention: "forward",
      },
      {
        id: "h=0 uses the zero positive-part branch",
        landStretch: zeroLengthFactorStretch,
        zetaW: 0.05,
        zetaS: -0.2,
        convention: "backward",
        zeroActiveStress: true,
      },
      {
        id: "zetaW=0 uses the central absolute-value derivative zero",
        landStretch: 1.05,
        zetaW: 0,
        zetaS: -0.2,
        convention: "central",
        zeroResidualRow: LAND2017_STATE_INDEX.W,
      },
      {
        id: "zetaS=-1 uses the right plateau derivative zero",
        landStretch: 1.05,
        zetaW: 0.05,
        zetaS: -1,
        convention: "forward",
        zeroResidualRow: LAND2017_STATE_INDEX.S,
      },
      {
        id: "zetaS=0 uses the left plateau derivative zero",
        landStretch: 1.05,
        zetaW: 0.05,
        zetaS: 0,
        convention: "backward",
        zeroResidualRow: LAND2017_STATE_INDEX.S,
      },
    ];
    const h = 2 ** -22;

    for (const kink of kinkCases) {
      const nextFiberLogStrain = Math.log(
        kink.landStretch
          / wallMaterial.landWallAdapterContext.lambdaLandSlack,
      );
      const previousFiberLogStrain = nextFiberLogStrain - 0.01;
      const previousLandState = interiorRateFreeState(
        wallMaterial,
        previousFiberLogStrain,
        [0.32, 0.11, 0.14, 0.18, 0.04, -0.25],
      );
      const nextLandState = interiorRateFreeState(
        wallMaterial,
        nextFiberLogStrain,
        [0.36, 0.10, 0.16, 0.19, kink.zetaW, kink.zetaS],
      );
      const common = {
        wallMaterial,
        previousFiberLogStrain,
        endpointFreeCalciumUM: 0.4,
        previousLandState,
        nextLandState,
        slsMode: "off",
        previousAlphaV: null,
        nextAlphaV: null,
        dtSec: 2.5e-4,
      } as const;
      const evaluateStep = (strain: number) =>
        evaluatePhaseB1WallBackwardEulerV1({
          ...common,
          nextFiberLogStrain: strain,
        });
      const base = evaluateStep(nextFiberLogStrain);
      const independentResidual = directionalVectorDifference(
        (strain) => evaluateStep(strain).landResidual,
        nextFiberLogStrain,
        h,
        kink.convention,
      );
      expect(
        base.landResidualPartialByNextFiberLogStrain,
        kink.id,
      ).toHaveLength(6);
      for (let row = 0; row < 6; row += 1) {
        expect(
          relativeDifference(
            base.landResidualPartialByNextFiberLogStrain[row],
            independentResidual[row],
          ),
          `${kink.id}, residual row ${row}`,
        ).toBeLessThan(5e-6);
      }
      const independentStress = directionalDifference(
        (strain) => evaluatePhaseB1WallMaterialStateV1({
          wallMaterial,
          fiberLogStrain: strain,
          freeCalciumUM: 0.4,
          landState: nextLandState,
          slsMode: "off",
          alphaV: null,
        }).totalWallKirchhoffStressPa,
        nextFiberLogStrain,
        h,
        kink.convention,
      );
      expect(
        relativeDifference(
          base.state.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
          independentStress,
        ),
        `${kink.id}, total stress`,
      ).toBeLessThan(5e-6);
      if (kink.zeroResidualRow !== undefined) {
        expect(Math.abs(
          base.landResidualPartialByNextFiberLogStrain[kink.zeroResidualRow],
        ), kink.id).toBe(0);
      }
      if (kink.zeroActiveStress) {
        expect(base.state.sourceLandOutput.sourceActiveFiberStressPa, kink.id)
          .toBe(0);
      }
    }
  });
});

function interiorRateFreeState(
  wallMaterial: PhaseB1WallRuntimeMaterialV1,
  fiberLogStrain: number,
  values: readonly [
    CaTRPN: number,
    B: number,
    W: number,
    S: number,
    zetaW: number,
    zetaS: number,
  ],
): RateFreeLand2017StateV1 {
  const landStretch = wallMaterial.landWallAdapterContext.lambdaLandSlack
    * Math.exp(fiberLogStrain);
  return sourceLand2017StateToRateFreeV1(
    values,
    landStretch,
    wallMaterial.landEquationParameters,
  );
}

function centralDifference(
  fn: (value: number) => number,
  value: number,
  h: number,
): number {
  return (fn(value + h) - fn(value - h)) / (2 * h);
}

type DifferenceConvention = "forward" | "backward" | "central";

function directionalDifference(
  fn: (value: number) => number,
  value: number,
  h: number,
  convention: DifferenceConvention,
): number {
  if (convention === "forward") return (fn(value + h) - fn(value)) / h;
  if (convention === "backward") return (fn(value) - fn(value - h)) / h;
  return centralDifference(fn, value, h);
}

function directionalVectorDifference(
  fn: (value: number) => readonly number[],
  value: number,
  h: number,
  convention: DifferenceConvention,
): readonly number[] {
  const base = fn(value);
  if (convention === "forward") {
    const plus = fn(value + h);
    return plus.map((entry, index) => (entry - base[index]) / h);
  }
  if (convention === "backward") {
    const minus = fn(value - h);
    return base.map((entry, index) => (entry - minus[index]) / h);
  }
  const plus = fn(value + h);
  const minus = fn(value - h);
  return plus.map((entry, index) => (entry - minus[index]) / (2 * h));
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
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

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
