import {
  EXACT_LAND_SEMISMOOTH_POLICY_V1_ID,
  FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID,
  FOUR_CHAMBER_TRISEG_LAND_MODEL_V1_ID,
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  NEWTON_SCALE_POLICY_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import { FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1 } from "@/engine/myocardium/fourChamberV1/state/fourChamberStateLayoutV1";
import { FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS } from "@/engine/myocardium/fourChamberV1/scope";
import {
  ALGEBRAIC_FLOW_IDS,
  BLOOD_COMPARTMENT_IDS,
  DIRECTED_ALGEBRAIC_EDGES,
  DIRECTED_CLOSED_LOOP_EDGES,
  DIRECTED_INERTIAL_EDGES,
  FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS,
  FOUR_CHAMBER_OWNERSHIP,
  FOUR_CHAMBER_SIGN_CONVENTIONS,
  FOUR_CHAMBER_SI_UNITS,
  INERTIAL_FLOW_IDS,
  TRISEG_ALGEBRAIC_COORDINATES,
  TRISEG_WALL_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import type { CanonicalSha256HexProvider } from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { FourChamberContractManifestV1 } from "@/engine/myocardium/fourChamberV1/manifests/contracts";
import { finalizeFourChamberContractManifestV1 } from "@/engine/myocardium/fourChamberV1/manifests/validate";

export function createPhaseA0ContractManifestPayloadV1(): Omit<FourChamberContractManifestV1, "contentSha256"> {
  return {
    schemaId: FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID,
    modelId: FOUR_CHAMBER_TRISEG_LAND_MODEL_V1_ID,
    phase: "Phase A0",
    stateLayout: {
      schemaId: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.schemaId,
      stateCount: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.size,
      layoutDiagnosticHash: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.layoutDiagnosticHash,
      diagnosticHashAlgorithm: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.diagnosticHashAlgorithm,
      stateInventory: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states.map((state) => ({
        key: state.key,
        label: state.label,
        offset: state.offset,
        owner: state.owner,
        equationsId: state.equationsId,
        unit: state.unit,
        ...(state.wallId === undefined ? {} : { wallId: state.wallId, patchId: state.patchId }),
      })),
    },
    runtimeBoundary: {
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      mechanics2Dependency: false,
    },
    acuteWallConstraint: {
      deformationJacobianJ: FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.deformationJacobianJ,
      myocardialIncompressibility: FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.myocardialIncompressibility,
      currentWallMaterialVolumeEqualsReference:
        FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.currentWallMaterialVolumeEqualsReference,
      wallMaterialVolumeRemodelingWithinAcuteBeat:
        FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.wallMaterialVolumeRemodelingWithinAcuteBeat,
      kirchhoffFiberStressEqualsCauchyFiberStress:
        FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.kirchhoffFiberStressEqualsCauchyFiberStress,
      workConjugateStrain: FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.workConjugateStrain,
      workConjugateStress: FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.workConjugateStress,
      wallPowerDensityReferenceMeasure:
        FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.wallPowerDensityReferenceMeasure,
      totalWallPower: FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS.totalWallPower,
    },
    foundationalContracts: {
      siUnits: FOUR_CHAMBER_SI_UNITS,
      signConventions: FOUR_CHAMBER_SIGN_CONVENTIONS,
      ownership: FOUR_CHAMBER_OWNERSHIP,
      topology: {
        bloodCompartmentIds: BLOOD_COMPARTMENT_IDS,
        inertialFlowIds: INERTIAL_FLOW_IDS,
        algebraicFlowIds: ALGEBRAIC_FLOW_IDS,
        wallIds: WALL_IDS,
        triSegWallIds: TRISEG_WALL_IDS,
        triSegAlgebraicCoordinates: TRISEG_ALGEBRAIC_COORDINATES,
        directedInertialEdges: DIRECTED_INERTIAL_EDGES,
        directedAlgebraicEdges: DIRECTED_ALGEBRAIC_EDGES,
        directedClosedLoopEdges: DIRECTED_CLOSED_LOOP_EDGES,
      },
    },
    adapterIds: {
      landLengthReference: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
      landNominalToKirchhoff: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
      oneFiberOrientationRule: IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
    },
    policyIds: {
      landSemismooth: EXACT_LAND_SEMISMOOTH_POLICY_V1_ID,
      newtonScales: NEWTON_SCALE_POLICY_V1_ID,
    },
    requiredTissueManifestFamilies: ["ventricular-human-37c-v1", "atrial-human-prior-v1"],
    releaseBlockers: FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  };
}

export function buildPhaseA0ContractManifestV1(
  contentSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
): FourChamberContractManifestV1 {
  return finalizeFourChamberContractManifestV1({
    ...createPhaseA0ContractManifestPayloadV1(),
    contentSha256,
  }, sha256Hex);
}
