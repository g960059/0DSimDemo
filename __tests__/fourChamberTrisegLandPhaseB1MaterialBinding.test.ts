import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluateLandLengthReferenceV1,
  evaluateLandLengthStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateLandNominalToKirchhoffAtStateV1,
  evaluateLandNominalToKirchhoffV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landNominalToKirchhoffV1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  buildPhaseB1WallMaterialBindingV1,
  tissueClassForWall,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 wall material binding", () => {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256);

  it("binds the two atrial and three ventricular walls without free gains", () => {
    expect(binding.descriptor.wallOrder).toEqual(WALL_IDS);
    expect(binding.descriptor.wallBindings.map((wall) => wall.wallId))
      .toEqual(WALL_IDS);
    expect(binding.descriptor.atrialWalls).toEqual(["LA", "RA"]);
    expect(binding.descriptor.ventricularWalls)
      .toEqual(["LVFW", "SEP", "RVFW"]);
    for (const wallId of WALL_IDS) {
      const runtime = binding.runtimeByWall[wallId];
      const descriptor = binding.descriptor.wallBindings.find(
        (candidate) => candidate.wallId === wallId,
      );
      expect(descriptor).toBeDefined();
      expect(runtime.wallId).toBe(wallId);
      expect(runtime.tissueClass).toBe(tissueClassForWall(wallId));
      expect(runtime.passiveSls.tissueManifestSha256)
        .toBe(runtime.landWallAdapterContext.tissueManifestSha256);
      expect(runtime.passiveSls.tissueManifestSha256)
        .toBe(descriptor?.tissueManifestSha256);
      expect(runtime.landEquationParameters.parameterSetId)
        .toBe(descriptor?.landParameterSetId);
      expect(runtime.prescribedCalciumParameters.evidenceId)
        .toBe(descriptor?.prescribedCalciumEvidenceId);
      expect(runtime.landWallAdapterContext.allowFreeGain).toBe(false);
      expect(runtime.landWallAdapterContext.fitToPVLoop).toBe(false);
    }
    expect(binding.runtimeByWall.LA.landEquationParameters)
      .toBe(binding.runtimeByWall.RA.landEquationParameters);
    expect(binding.runtimeByWall.LVFW.landEquationParameters)
      .toBe(binding.runtimeByWall.SEP.landEquationParameters);
    expect(binding.runtimeByWall.SEP.landEquationParameters)
      .toBe(binding.runtimeByWall.RVFW.landEquationParameters);
    expect(binding.runtimeByWall.LA.landEquationParameters)
      .not.toBe(binding.runtimeByWall.LVFW.landEquationParameters);
  });

  it("freezes a canonical component-only wall material descriptor", () => {
    expect(assertPhaseB1WallMaterialBindingV1(binding)).toBe(binding);
    expect(binding.contentSha256).toBe(
      sha256(canonicalizeJson(binding.descriptor)),
    );
    expect(binding.contentSha256)
      .toBe("820d04ce7c374a262eaf91e1356684b338d54aa66d233dd22402b6a19b40eb51");
    expect(binding.descriptor.phaseA1TissueManifestBundleSha256)
      .toBe(bundle.contentSha256);
    expect(binding.descriptor.wallWiseFreeGainAllowed).toBe(false);
    expect(binding.descriptor.pvLoopShapeFittingAllowed).toBe(false);
    expect(binding.descriptor.physiologicalValidationClaimed).toBe(false);
    expect(binding.descriptor.phaseB1AcceptanceClaimed).toBe(false);
  });

  it("rejects copied or accessor-forged bindings even when their public fields match", () => {
    const copied = Object.freeze({ ...binding });
    expect(() => assertPhaseB1WallMaterialBindingV1(
      copied as PhaseB1WallMaterialBindingV1,
    )).toThrow(/canonical compiled binding/);

    let accessorReadCount = 0;
    const accessorForged = Object.freeze(Object.defineProperty(
      { ...binding },
      "runtimeByWall",
      {
        enumerable: true,
        configurable: false,
        get: () => {
          accessorReadCount += 1;
          return binding.runtimeByWall;
        },
      },
    ));
    expect(() => assertPhaseB1WallMaterialBindingV1(
      accessorForged as PhaseB1WallMaterialBindingV1,
    )).toThrow(/canonical compiled binding/);
    expect(accessorReadCount).toBe(0);
  });

  it("maps log strain to Land length without requiring a stage rate", () => {
    const context = binding.runtimeByWall.LVFW.landWallAdapterContext;
    const length = evaluateLandLengthStateV1(context, {
      fiberLogStrain: 0.08,
    });
    expect(length.landStretch).toBeCloseTo(Math.exp(0.08), 14);
    expect(length.landStretchDerivativeByLogStrain)
      .toBe(length.landStretch);
    expect("landStretchRatePerSec" in length).toBe(false);
    expect(() => evaluateLandLengthStateV1(context, {
      fiberLogStrain: 0.08,
      fiberLogStrainRatePerSec: 1,
    } as never)).toThrow(/must contain exactly/);
  });

  it("has the work-conjugate fixed-state active-stress partial", () => {
    const context = binding.runtimeByWall.LVFW.landWallAdapterContext;
    const baseStrain = 0.08;
    const baseLength = evaluateLandLengthStateV1(context, {
      fiberLogStrain: baseStrain,
    });
    const baseSourceStressPa = 12_000;
    const sourcePartialPaPerLandStretch = 5_000;
    const transformed = evaluateLandNominalToKirchhoffAtStateV1(context, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: baseSourceStressPa,
      landActiveNominalPartialPaPerLandStretch:
        sourcePartialPaPerLandStretch,
      length: baseLength,
    });
    const h = 2 ** -20;
    const wallStress = (strain: number): number => {
      const length = evaluateLandLengthStateV1(context, {
        fiberLogStrain: strain,
      });
      const sourceStress = baseSourceStressPa
        + sourcePartialPaPerLandStretch
          * (length.landStretch - baseLength.landStretch);
      return evaluateLandNominalToKirchhoffAtStateV1(context, {
        sourceStressConvention: "land2017-Ta",
        landActiveNominalStressPa: sourceStress,
        landActiveNominalPartialPaPerLandStretch:
          sourcePartialPaPerLandStretch,
        length,
      }).wallActiveKirchhoffStressPa;
    };
    const independent = (
      wallStress(baseStrain + h) - wallStress(baseStrain - h)
    ) / (2 * h);
    expect(transformed.wallActivePartialPaPerFiberLogStrain)
      .toBeCloseTo(independent, 5);
  });

  it("rejects undeclared keys at every public length and stress adapter entry", () => {
    const context = binding.runtimeByWall.LVFW.landWallAdapterContext;
    const stateLength = evaluateLandLengthStateV1(context, {
      fiberLogStrain: 0.08,
    });
    const rateLength = evaluateLandLengthReferenceV1(context, {
      fiberLogStrain: 0.08,
      fiberLogStrainRatePerSec: 0.2,
    });
    expect(() => evaluateLandLengthReferenceV1(context, {
      fiberLogStrain: 0.08,
      fiberLogStrainRatePerSec: 0.2,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => evaluateLandNominalToKirchhoffAtStateV1(context, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: 12_000,
      length: stateLength,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => evaluateLandNominalToKirchhoffV1(context, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: 12_000,
      length: rateLength,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
