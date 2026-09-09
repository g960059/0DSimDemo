import { createMainWireIntegratedModelStandard71FixtureV1 as baseFixture,
  MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as baselineHemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as baselineMechanism,
  MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as material } from "./MainWireIntegratedModelStandard71FixtureV1";
import { assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3 as assemble,
  prepareMainWireIntegratedModelFixtureInputsV3 as prepare } from "./MainWireIntegratedModelPeriodicSteadyV3";
import { resolveMainWireStaticCaseAnatomyV1 as anatomyFor,
  type MainWireStaticCaseAnatomyIdV1 } from "@/engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1";
import { createMaterialKernelsWithMechanicsResearchInputsV1 as kernels,
  fingerprintNormalAdultFiveWallMaterialStateCanonicalV1 as fingerprint } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { createMainWireFiveWallLandTriSegProviderV1 as createProvider } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 as coldIterations } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

const assemblyId = "main-wire-integrated-model-static-case-fixture-v1" as const;
export type MainWireIntegratedModelStaticCaseFixtureV1 = ReturnType<typeof createMainWireIntegratedModelStaticCaseFixtureV1>;

/** Engine-owned construction for the pending anatomy-bearing model. Not wired
 * into released72 or its codec. The case selects anatomy only; it does not
 * silently set tension, TBV, resistance, or expand any advertised control range. */
export function createMainWireIntegratedModelStaticCaseFixtureV1(
  anatomyId: MainWireStaticCaseAnatomyIdV1,
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = baselineHemodynamics,
  ventricularContractilityScale = 1,
  mechanism: MainWireIntegratedModelMechanismResearchInputsV3 = baselineMechanism,
) {
  const anatomy = anatomyFor(anatomyId);
  const base = baseFixture(inputs, ventricularContractilityScale, mechanism);
  const { standard71AssemblyId: _baseId, standard71AssemblyClaim: _baseClaim, ...baseAssembly } = base;
  const prepared = prepare(inputs, ventricularContractilityScale, mechanism);
  const pericardium = anatomy.caseId === "baseline-v1" ? base.pericardium : Object.freeze({ ...base.pericardium,
    parameterSetId: `${base.pericardium.parameterSetId}-${anatomy.caseId}-actual-wall-occupancy`,
    wallMaterialVolumesM3: Object.freeze([anatomy.atria.LA.wallMaterialVolumeM3,
      anatomy.trisegWalls.LVFW.wallMaterialVolumeM3, anatomy.trisegWalls.SEP.wallMaterialVolumeM3,
      anatomy.trisegWalls.RVFW.wallMaterialVolumeM3, anatomy.atria.RA.wallMaterialVolumeM3] as const),
  });
  const fixture = anatomy.caseId === "baseline-v1" ? baseAssembly : assemble(prepared, {
    createProvider: () => createProvider({ parameterSetId: `${assemblyId}-${anatomy.caseId}`,
      materialByWall: kernels(prepared.chamberMechanics, material, coldIterations),
      atria: anatomy.atria, trisegWalls: anatomy.trisegWalls,
      initialTriSegCoordinates: anatomy.initialTriSegCoordinates, internalCoordinateScales: anatomy.internalCoordinateScales,
      fingerprintMaterialStateCanonicalV1: fingerprint }),
    createVascularRuntime: () => base.runtime.vascular,
    createCalciumDriveParams: () => base.coronaryStepInput.calciumDriveParams,
    createRhythm: () => base.rhythm, createPericardium: () => pericardium,
  });
  if (fixture.coronaryStepInput.pericardium !== pericardium) throw new Error("Case coronary/pericardial binding differs");
  return Object.freeze({ ...fixture, staticCaseAssemblyId: assemblyId, staticAnatomy: anatomy,
    coronaryConstruction: Object.freeze({ interpretation: "fixed-baseline-reference-bed-and-absolute-demand" as const,
      referenceBedWallMassG: fixture.coronaryStepInput.coronaryPrior.construction.perfusedMyocardialMass.wallMassG,
      currentMechanicalWallMassG: anatomy.wallMassG,
      referenceBedMassRepresentsCurrentAnatomy: anatomy.caseId === "baseline-v1",
      remodeledPerfusionOrOxygenAdequacyClaimed: false as const }),
  });
}
