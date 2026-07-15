import {
  FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID,
  FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import type {
  AlgebraicFlowId,
  BloodCompartmentId,
  DirectedFlowEdge,
  FourChamberWallId,
  InertialFlowId,
  TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export type ManifestParameterV1 = {
  readonly name: string;
  readonly kind: "primitive" | "derived";
  readonly runtimeValue: number;
  readonly runtimeUnit: string;
  readonly sourceValue: number | string;
  readonly sourceUnit: string;
  readonly sourceId: string;
  readonly sourceLocation: string;
  readonly transformationRule: string;
};

export type TissueManifestV1 = {
  readonly schemaId: typeof FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID;
  readonly familyId: "ventricular-human-37c-v1" | "atrial-human-prior-v1" | string;
  readonly tissueClass: "atrial" | "ventricular";
  readonly status: "candidate-prior";
  readonly temperatureK: number;
  readonly calciumUnitConvention: "uM";
  readonly land: {
    readonly modelId: "land2017-myofilament-v1";
    readonly equationsVersion: string;
    readonly activeOnly: true;
    readonly sourceStressConvention: "land2017-Ta";
    readonly primitiveParameters: readonly ManifestParameterV1[];
    readonly derivedParameters: readonly ManifestParameterV1[];
  };
  readonly prescribedCalcium: {
    readonly modelId: string;
    readonly parameters: readonly ManifestParameterV1[];
  };
  readonly passiveSls: {
    readonly equilibriumModelId: string;
    readonly slsModelId: string;
    readonly slsEnabled: true;
    readonly parameters: readonly ManifestParameterV1[];
  };
  readonly lengthReference: {
    readonly adapterId: typeof LAND_LENGTH_REFERENCE_ADAPTER_V1_ID;
    readonly lambdaLandSlack: number;
    readonly evidenceId: string;
    readonly owner: "tissue-manifest";
  };
  readonly homogenization: {
    readonly orientationRuleId: typeof IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID;
    readonly stressWorkAdapterId: typeof LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID;
    readonly chiOrient: 1;
    readonly allowFreeGain: false;
    readonly fitToPVLoop: false;
  };
  readonly viability: {
    readonly fViable: number;
    readonly evidenceId: string;
    readonly owner: "independent-scar-viability-evidence";
  };
  readonly provenance: {
    readonly sourceReferences: readonly string[];
    readonly transformationRules: readonly string[];
  };
  readonly targetPack: {
    readonly id: string;
    readonly sha256: string;
  };
  readonly atrialDiff?: {
    readonly baseManifestSha256: string;
    readonly changedPrimitiveParameters: readonly string[];
    readonly derivedParameterRecomputation: {
      readonly status: "required-phase-a1";
    };
  };
  readonly hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  readonly contentSha256: string;
};

export type FourChamberContractManifestV1 = {
  readonly schemaId: typeof FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID;
  readonly modelId: string;
  readonly phase: "Phase A0";
  readonly stateLayout: {
    readonly schemaId: string;
    readonly stateCount: 59;
    readonly layoutDiagnosticHash: string;
    readonly diagnosticHashAlgorithm: string;
    readonly stateInventory: readonly {
      readonly key: string;
      readonly label: string;
      readonly offset: number;
      readonly owner: string;
      readonly equationsId: string;
      readonly unit: string;
      readonly wallId?: string;
      readonly patchId?: string;
    }[];
  };
  readonly runtimeBoundary: {
    readonly modelCoreIntegration: false;
    readonly browserRuntimeAdopted: false;
    readonly mechanics2Dependency: false;
  };
  readonly acuteWallConstraint: {
    readonly deformationJacobianJ: 1;
    readonly myocardialIncompressibility: true;
    readonly currentWallMaterialVolumeEqualsReference: true;
    readonly wallMaterialVolumeRemodelingWithinAcuteBeat: false;
    readonly kirchhoffFiberStressEqualsCauchyFiberStress: true;
    readonly workConjugateStrain: "fiber-log-strain";
    readonly workConjugateStress: "scalar-kirchhoff-fiber-stress";
    readonly wallPowerDensityReferenceMeasure: "tau_f * fiber_log_strain_rate";
    readonly totalWallPower: "V_wall_reference * tau_f * fiber_log_strain_rate";
  };
  readonly foundationalContracts: {
    readonly siUnits: {
      readonly time: "s";
      readonly volume: "m^3";
      readonly flow: "m^3/s";
      readonly pressure: "Pa";
      readonly stress: "Pa";
      readonly length: "m";
      readonly area: "m^2";
      readonly wallMaterialVolume: "m^3";
      readonly calciumAtLandInterface: "uM";
      readonly strain: "1";
    };
    readonly signConventions: {
      readonly directedFlow: "positive from upstream to downstream";
      readonly edgePressureDrop: "P_upstream - P_downstream";
      readonly transmuralPressure: "P_cavity - P_external";
      readonly cavityPressure: "P_transmural + P_intrathoracic + P_pericardial";
      readonly activeStressPower: "V_wall_reference * tau_active * fiber_log_strain_rate";
      readonly activeMechanicalOutputPower: "-activeStressPower";
    };
    readonly ownership: {
      readonly bloodVolume: "circulation-ledger";
      readonly inertialFlow: "circulation-momentum";
      readonly geometryStretch: "wall-geometry";
      readonly passiveStress: "equilibrium-passive-material";
      readonly passiveViscousStress: "one-state-wall-sls";
      readonly landLengthReference: "tissue-manifest";
      readonly activeSourceStress: "land2017-active-only";
      readonly activeStressMeasureConversion: "land-nominal-to-wall-kirchhoff-adapter";
      readonly viableFraction: "independent-scar-viability-evidence";
    };
    readonly topology: {
      readonly bloodCompartmentIds: readonly BloodCompartmentId[];
      readonly inertialFlowIds: readonly InertialFlowId[];
      readonly algebraicFlowIds: readonly AlgebraicFlowId[];
      readonly wallIds: readonly FourChamberWallId[];
      readonly triSegWallIds: readonly TriSegWallId[];
      readonly triSegAlgebraicCoordinates: readonly ["V_m_S", "y_m"];
      readonly directedInertialEdges: readonly DirectedFlowEdge<InertialFlowId>[];
      readonly directedAlgebraicEdges: readonly DirectedFlowEdge<AlgebraicFlowId>[];
      readonly directedClosedLoopEdges: readonly DirectedFlowEdge[];
    };
  };
  readonly adapterIds: {
    readonly landLengthReference: string;
    readonly landNominalToKirchhoff: string;
    readonly oneFiberOrientationRule: string;
  };
  readonly policyIds: {
    readonly landSemismooth: string;
    readonly newtonScales: string;
  };
  readonly requiredTissueManifestFamilies: readonly [
    "ventricular-human-37c-v1",
    "atrial-human-prior-v1",
  ];
  readonly releaseBlockers: readonly string[];
  readonly hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  readonly contentSha256: string;
};

export function tissueManifestHashPayload(manifest: TissueManifestV1): Omit<TissueManifestV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = manifest;
  return payload;
}

export function contractManifestHashPayload(
  manifest: FourChamberContractManifestV1,
): Omit<FourChamberContractManifestV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = manifest;
  return payload;
}
