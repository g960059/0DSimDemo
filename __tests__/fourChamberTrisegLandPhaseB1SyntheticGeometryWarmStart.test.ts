import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluateExactEventCalciumV1,
} from
  "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  sourceLand2017StateToRateFreeV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  PHASE_B1_ENDPOINT_STATE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1LandSimplexNewtonDomainV1,
  minimumPhaseB1LandSimplexMarginV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  encodePhaseB1NewtonUnknownStateV1,
} from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID,
  buildPhaseB1SyntheticGeometryWarmStartV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticGeometryWarmStartV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  buildPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  TRISEG_WALL_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  PUBLISHED_TRISEG_ROOT_DEFAULT_NEWTON_OPTIONS_V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";

describe("four-chamber Phase B1 synthetic geometry warm start", () => {
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256);
  const binding = buildPhaseB1WallMaterialBindingV1(
    scaffold.phaseA1TissueManifestBundle,
    sha256,
  );
  const warmStarts = {
    on: buildPhaseB1SyntheticGeometryWarmStartV1("on", sha256),
    off: buildPhaseB1SyntheticGeometryWarmStartV1("off", sha256),
  } as const;

  it("shares one strict analytic steady initializer with both target packs", () => {
    const packs = [
      {
        pack: scaffold.phaseA1TissueManifestBundle.atrialTargetPack,
        parameters: binding.runtimeByWall.LA.landEquationParameters,
      },
      {
        pack: scaffold.phaseA1TissueManifestBundle.ventricularTargetPack,
        parameters: binding.runtimeByWall.LVFW.landEquationParameters,
      },
    ] as const;
    for (const { pack, parameters } of packs) {
      for (const target of pack.forceCalciumTargets) {
        expect(target.steadyState).toEqual(Array.from(
          initializeLand2017IsometricSteadyStateV1(
            target.lambdaLand,
            target.freeCalciumUM,
            parameters,
          ),
        ));
      }
    }
    expect(() => initializeLand2017IsometricSteadyStateV1(
      0,
      0.1,
      binding.runtimeByWall.LA.landEquationParameters,
    )).toThrow(/lambdaLand must be positive/);
    expect(() => initializeLand2017IsometricSteadyStateV1(
      1,
      0,
      binding.runtimeByWall.LA.landEquationParameters,
    )).toThrow(/freeCalciumUM must be positive/);
  });

  it.each(["on", "off"] as const)(
    "constructs the canonical %s endpoint from the neutral V/Q scaffold",
    (slsMode) => {
      const warmStart = warmStarts[slsMode];
      expect(warmStart.initializationId)
        .toBe(PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID);
      expect(warmStart.endpoint.stateId).toBe(PHASE_B1_ENDPOINT_STATE_V1_ID);
      expect(warmStart.endpoint.timeSec).toBe(0);
      expect(warmStart.endpoint.differentialState.bloodVolumesM3)
        .toEqual(scaffold.initialState.bloodVolumesM3);
      expect(warmStart.endpoint.differentialState.inertialFlowsM3PerSec)
        .toEqual(scaffold.initialState.inertialFlowsM3PerSec);
      expect(warmStart.endpoint.differentialState.slsMode).toBe(slsMode);
      expect(warmStart.testOnly).toBe(true);
      expect(warmStart.fullColdInitializationComplete).toBe(false);
      expect(warmStart.atrialEquilibriumClaimed).toBe(false);
      expect(warmStart.closedLoopEquilibriumClaimed).toBe(false);
    },
  );

  it.each(["on", "off"] as const)(
    "uses analytic isometric steady states at final wall geometry inside the %s population simplex",
    (slsMode) => {
      const warmStart = warmStarts[slsMode];
      const state = warmStart.endpoint.differentialState;
      for (const wallId of WALL_IDS) {
        const material = binding.runtimeByWall[wallId];
        const landStretch = warmStart.audit.landStretchByWall[wallId];
        const freeCalciumUM =
          material.prescribedCalciumParameters.calciumDiastolicUM;
        const sourceState = initializeLand2017IsometricSteadyStateV1(
          landStretch,
          freeCalciumUM,
          material.landEquationParameters,
        );
        const expected = sourceLand2017StateToRateFreeV1(
          sourceState,
          landStretch,
          material.landEquationParameters,
        );
        expect(state.landByWall[wallId]).toEqual(expected);
        expect(warmStart.audit.maximumAbsoluteLandRhsPerSecByWall[wallId])
          .toBeLessThan(1e-11);

        const [caTrpn, blocked, weak, strong] = state.landByWall[wallId];
        const directMargin = Math.min(
          caTrpn,
          1 - caTrpn,
          blocked,
          weak,
          strong,
          1 - blocked - weak - strong,
        );
        expect(directMargin).toBeGreaterThan(0);
        expect(warmStart.audit.landSimplexMarginByWall[wallId])
          .toBe(directMargin);
      }
      const newtonState = state.slsMode === "on"
        ? {
          slsMode: "on" as const,
          bloodVolumesM3: state.bloodVolumesM3,
          inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
          landByWall: state.landByWall,
          slsAlphaVByWall: state.slsAlphaVByWall,
          triSegCoordinates: warmStart.endpoint.triSegCoordinates,
        }
        : {
          slsMode: "off" as const,
          bloodVolumesM3: state.bloodVolumesM3,
          inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
          landByWall: state.landByWall,
          triSegCoordinates: warmStart.endpoint.triSegCoordinates,
        };
      const unknowns = encodePhaseB1NewtonUnknownStateV1(newtonState);
      const domain = buildPhaseB1LandSimplexNewtonDomainV1(slsMode);
      expect(minimumPhaseB1LandSimplexMarginV1(unknowns, domain))
        .toBe(warmStart.audit.minimumLandSimplexMargin);
      expect(warmStart.audit.landStatesStrictlyInsidePopulationSimplex)
        .toBe(true);
      expect(warmStart.audit.geometryConsistentIsometricSteadyStateByWall)
        .toBe(true);
    },
  );

  it.each(["on", "off"] as const)(
    "uses the zero calcium-drive pair and wall-specific diastolic calcium in %s mode",
    (slsMode) => {
      const warmStart = warmStarts[slsMode];
      for (const wallId of WALL_IDS) {
        const calcium = warmStart.endpoint.differentialState
          .calciumByWall[wallId];
        expect(calcium).toEqual({ r: 0, d: 0 });
        const parameters =
          binding.runtimeByWall[wallId].prescribedCalciumParameters;
        const evaluated = evaluateExactEventCalciumV1(
          [calcium.r, calcium.d],
          parameters,
        );
        expect(evaluated.freeCalciumUM)
          .toBe(parameters.calciumDiastolicUM);
        expect(warmStart.audit.evaluatedFreeCalciumUMByWall[wallId])
          .toBe(evaluated.freeCalciumUM);
      }
      expect(warmStart.audit.evaluatedFreeCalciumUMByWall.LA).toBe(0.1);
      expect(warmStart.audit.evaluatedFreeCalciumUMByWall.RA).toBe(0.1);
      expect(warmStart.audit.evaluatedFreeCalciumUMByWall.LVFW).toBe(0.11);
      expect(warmStart.audit.evaluatedFreeCalciumUMByWall.SEP).toBe(0.11);
      expect(warmStart.audit.evaluatedFreeCalciumUMByWall.RVFW).toBe(0.11);
    },
  );

  it.each(["on", "off"] as const)(
    "solves the published two-coordinate TriSeg root with real wall stress in %s mode",
    (slsMode) => {
      const warmStart = warmStarts[slsMode];
      expect(warmStart.triSegRoot.converged).toBe(true);
      expect(warmStart.endpoint.triSegCoordinates).toEqual({
        V_m_S: warmStart.triSegRoot.coordinates.septalMidwallCapVolumeM3,
        y_m: warmStart.triSegRoot.coordinates.junctionRadiusM,
      });
      expect(warmStart.audit.triSegScaledResidualInfinityNorm)
        .toBeLessThanOrEqual(
          PUBLISHED_TRISEG_ROOT_DEFAULT_NEWTON_OPTIONS_V1
            .residualInfinityTolerance,
        );
      expect(warmStart.audit.triSegRawResidualNPerM.infinityNorm)
        .toBeLessThanOrEqual(
          scaffold.newtonScaleRegistry.residualScales
            .publishedTriSegEquilibriumNPerM
            * PUBLISHED_TRISEG_ROOT_DEFAULT_NEWTON_OPTIONS_V1
              .residualInfinityTolerance,
        );
      expect(warmStart.audit.activeStressEvaluator)
        .toBe(PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID);
      expect(warmStart.audit.surrogateInstantaneousEquilibriumActiveStressReused)
        .toBe(false);
      for (const wallId of TRISEG_WALL_IDS) {
        const wall = warmStart.triSegWallMaterialAtRootByWall[wallId];
        const material = binding.runtimeByWall[wallId];
        expect(wall.kernelId).toBe(PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID);
        expect(wall.sourceLandOutput.health.projectionUsed).toBe(false);
        expect(wall.reconstructedSourceLandState).toEqual(
          Array.from(initializeLand2017IsometricSteadyStateV1(
            wall.length.landStretch,
            material.prescribedCalciumParameters.calciumDiastolicUM,
            material.landEquationParameters,
          )),
        );
        expect(warmStart.triSegRoot.wallStress.fiberKirchhoffStressPa[wallId])
          .toBe(wall.totalWallKirchhoffStressPa);
      }
    },
  );

  it("physically omits every SLS coordinate in the off topology", () => {
    const warmStart = warmStarts.off;
    expect(Object.hasOwn(
      warmStart.endpoint.differentialState,
      "slsAlphaVByWall",
    )).toBe(false);
    for (const wallId of TRISEG_WALL_IDS) {
      const sls = warmStart.triSegWallMaterialAtRootByWall[wallId].sls;
      expect(sls.statePhysicallyPresent).toBe(false);
      expect(sls.alphaV).toBeNull();
      expect(sls.overstressPa).toBe(0);
    }
  });

  it("places every present SLS coordinate at its final wall log strain", () => {
    const warmStart = warmStarts.on;
    const state = warmStart.endpoint.differentialState;
    expect(state.slsMode).toBe("on");
    if (state.slsMode !== "on") {
      throw new Error("SLS-on warm start returned the wrong topology");
    }
    for (const wallId of WALL_IDS) {
      expect(state.slsAlphaVByWall[wallId])
        .toBe(warmStart.audit.fiberLogStrainByWall[wallId]);
    }
    for (const wallId of TRISEG_WALL_IDS) {
      const sls = warmStart.triSegWallMaterialAtRootByWall[wallId].sls;
      expect(sls.statePhysicallyPresent).toBe(true);
      expect(sls.overstressPa).toBe(0);
    }
  });

  it("records the canonical scaffold, bundle, binding, and target provenance", () => {
    const warmStart = warmStarts.on;
    expect(warmStart.provenance.symmetricClosedLoopScaffoldConfigurationSha256)
      .toBe(phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256));
    expect(warmStart.provenance.phaseA1TissueManifestBundleSha256)
      .toBe(scaffold.phaseA1TissueManifestBundle.contentSha256);
    expect(warmStart.provenance.phaseB1WallMaterialBindingSha256)
      .toBe(binding.contentSha256);
    expect(warmStart.provenance.atrialTargetPackSha256)
      .toBe(scaffold.phaseA1TissueManifestBundle.atrialTargetPack.contentSha256);
    expect(warmStart.provenance.ventricularTargetPackSha256)
      .toBe(
        scaffold.phaseA1TissueManifestBundle.ventricularTargetPack.contentSha256,
      );
  });

  it.each(["on", "off"] as const)(
    "is deterministic in %s mode",
    (slsMode) => {
      expect(buildPhaseB1SyntheticGeometryWarmStartV1(slsMode, sha256))
        .toEqual(warmStarts[slsMode]);
    },
  );
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
