import {
  canonicalizeJson,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  type PhaseB0HydromechanicsStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1,
  type PhaseB1ColdEtaZeroFromTriSegSeedSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  buildPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID =
  "phase-b0-finite-envelope-center-to-phase-b1-cold-eta-zero-bridge-v1" as const;
export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_REQUIRED_SOURCE_NUMERICAL_EVIDENCE_SHA256_V1 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1" as const;

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b0-finite-envelope-center-to-phase-b1-cold-eta-zero-bridge-policy-v1",
    sourceNodeId: "C" as const,
    requiredSourceNumericalEvidenceSha256:
      PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_REQUIRED_SOURCE_NUMERICAL_EVIDENCE_SHA256_V1,
    transferredFields: Object.freeze(["V_m_S", "y_m"] as const),
    destinationEta: 0 as const,
    maximumAssembledActiveStressAbsoluteDifferencePa: 1e-9,
    maximumSlsOverstressAbsoluteDifferencePa: 1e-9,
    maximumTotalWallStressAbsoluteDifferencePa: 1e-9,
    maximumTotalWallTangentAbsoluteDifferencePa: 1e-9,
    maximumTriSegResidualAbsoluteDifferenceNPerM: 1e-12,
    maximumPressureAbsoluteDifferencePa: 1e-9,
    maximumAtrialPressureRelativeDifference: 1e-12,
    maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2: 1e-15,
    maximumB1ScaledColdResidualInfinityNorm:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm,
    requireExactTimeVolumeFlowCoordinateGeometryAndOracleParity: true,
    rawLandActiveStressAtEtaZeroIsDiagnosticNotAssembledActiveStress: true,
  } as const);

export type PhaseB0CenterToPhaseB1EtaZeroParityAuditV1 = Readonly<{
  sourceCenterAccepted: boolean;
  sourceCenterIsUnique: boolean;
  transferredOnlyTriSegCoordinates: true;
  sourceSeedEncodedExactly: boolean;
  destinationEtaIsExactlyZero: boolean;
  destinationColdEquilibriumPass: boolean;
  timeExact: boolean;
  bloodVolumesExact: boolean;
  inertialStateFlowsExact: boolean;
  solvedTriSegCoordinatesExact: boolean;
  wallFiberStrainsExact: boolean;
  wallReferenceVolumesExact: boolean;
  passiveMaterialEvaluationsExact: boolean;
  triSegGeometryExact: boolean;
  triSegOracleExact: boolean;
  pericardiumExact: boolean;
  vascularEvaluationsExact: boolean;
  computedFlowsExact: boolean;
  phaseA1TissueBundleBindingExact: boolean;
  newtonScaleRegistryValuesExact: boolean;
  destinationProvenanceBindingsExact: boolean;
  sharedFlowAndPressureParameterBindingsExact: boolean;
  pinnedEvidenceDigestAndCanonicalCurrentSourceMatched: true;
  maximumAssembledActiveStressAbsoluteDifferencePa: number;
  maximumRawLandActiveDiagnosticDifferencePa: number;
  maximumSlsOverstressAbsoluteDifferencePa: number;
  maximumTotalWallStressAbsoluteDifferencePa: number;
  maximumTotalWallTangentAbsoluteDifferencePa: number;
  maximumTriSegResidualAbsoluteDifferenceNPerM: number;
  maximumPressureAbsoluteDifferencePa: number;
  maximumAtrialPressureRelativeDifference: number;
  maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2: number;
  rawLandActiveStressDirectParityClaimed: false;
  landStateCopiedFromPhaseB0: false;
  slsStateCopiedFromPhaseB0: false;
  calciumStateCopiedFromPhaseB0: false;
  sharedPhysicalStateParityPass: boolean;
}>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1 = Readonly<{
  bridgeId: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID;
  slsMode: "on" | "off";
  upstreamFiniteEnvelopeEvidenceSha256: string;
  source: Readonly<{
    protocolId: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
    nodeId: "C";
    rootId: string;
    algorithmicJacobianId: string;
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }>;
  transfer: Readonly<{
    fieldNames: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1.transferredFields;
    triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
    noOtherPhaseB0StateTransferred: true;
  }>;
  destination: PhaseB1ColdEtaZeroFromTriSegSeedSuccessV1;
  parityAudit: PhaseB0CenterToPhaseB1EtaZeroParityAuditV1;
  phaseB0CenterToPhaseB1EtaZeroBridgePass: boolean;
  acceptedPhaseB1ReferenceBranchPass: false;
  phaseB1LandCoupledVolumeEnvelopePass: false;
  continuousIntervalRegularityPass: false;
  globalRootUniquenessPass: false;
  energeticStabilityPass: false;
  physiologicalInitializationPass: false;
  closedLoopStationarityPass: false;
  fullBeatAcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export function bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
  sourceResult: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  upstreamFiniteEnvelopeEvidenceSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1 {
  if (!/^[0-9a-f]{64}$/.test(upstreamFiniteEnvelopeEvidenceSha256)) {
    throw new Error(
      "upstreamFiniteEnvelopeEvidenceSha256 must be a lowercase 64-hex digest",
    );
  }
  if (
    upstreamFiniteEnvelopeEvidenceSha256
      !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_REQUIRED_SOURCE_NUMERICAL_EVIDENCE_SHA256_V1
  ) throw new Error("bridge requires the pinned canonical B0 numerical evidence");
  if (
    sourceResult.slsMode !== "on" && sourceResult.slsMode !== "off"
  ) throw new Error("bridge source SLS mode must be on or off");
  if (
    sourceResult.protocolId
      !== PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
  ) throw new Error("bridge source protocol identity drifted");
  const centerMatches = sourceResult.canonicalNodes.filter(
    (node) => node.nodeId === "C",
  );
  if (centerMatches.length !== 1) {
    throw new Error("bridge requires exactly one canonical Phase B0 center node");
  }
  const center = centerMatches[0];
  const sourceCenterAccepted = sourceResult.finiteDeclaredGraphEnvelopePass
    && center.hardGatePass
    && center.fiftyPercentGuardPass
    && center.ledger.accepted
    && center.taylorDomainPass;
  if (!sourceCenterAccepted) {
    throw new Error("bridge source center is not accepted by the finite graph");
  }
  const canonicalSourceResult = runPhaseB0TriSegFiniteSupportedEnvelopeV1(
    sourceResult.slsMode,
    sha256Hex,
  );
  if (!deepExactEqual(sourceResult, canonicalSourceResult)) {
    throw new Error(
      "bridge source result is not the canonical Phase B0 finite-envelope mode result",
    );
  }
  const pinnedEvidenceDigestAndCanonicalCurrentSourceMatched = true as const;
  const transferredCoordinates = Object.freeze({
    V_m_S: center.coordinates.septalMidwallCapVolumeM3,
    y_m: center.coordinates.junctionRadiusM,
  });
  const destination = solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1(
    sourceResult.slsMode,
    transferredCoordinates,
    upstreamFiniteEnvelopeEvidenceSha256,
    sha256Hex,
  );
  if (!destination.converged) {
    throw new Error("Phase B1 eta=0 bridge solve failed");
  }

  const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256Hex);
  const destinationScaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(
    sha256Hex,
  );
  const destinationMaterialBinding = buildPhaseB1WallMaterialBindingV1(
    destinationScaffold.phaseA1TissueManifestBundle,
    sha256Hex,
  );
  const baseState = createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    sourceResult.slsMode,
  );
  const sourceState = buildSourceCenterState(
    baseState,
    center.ledger.bloodVolumesM3,
    transferredCoordinates,
  );
  const sourceEvaluation = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    sourceState,
  );
  const destinationEndpoint = destination.node.endpoint;
  const destinationState = destinationEndpoint.differentialState;
  const destinationEvaluation = destination.node.residualEvaluation.closedLoop;

  const maximumAssembledActiveStressAbsoluteDifferencePa = Math.max(
    ...WALL_IDS.map((wallId) => {
      const sourceWall = sourceEvaluation.wallMechanics[wallId];
      const destinationWall = destinationEvaluation.wallMechanics[wallId];
      const destinationAssembledActive =
        destinationWall.totalKirchhoffStressPa
        - destinationWall.equilibriumPassive.equilibriumKirchhoffStressPa
        - destinationWall.slsOverstressPa;
      return Math.abs(
        sourceWall.activeKirchhoffStressPa - destinationAssembledActive,
      );
    }),
  );
  const maximumRawLandActiveDiagnosticDifferencePa = Math.max(
    ...WALL_IDS.map((wallId) => Math.abs(
      sourceEvaluation.wallMechanics[wallId].activeKirchhoffStressPa
      - destinationEvaluation.wallMechanics[wallId].activeKirchhoffStressPa,
    )),
  );
  const maximumSlsOverstressAbsoluteDifferencePa = maximumWallDifference(
    (wallId) => sourceEvaluation.wallMechanics[wallId].slsOverstressPa,
    (wallId) => destinationEvaluation.wallMechanics[wallId].slsOverstressPa,
  );
  const maximumTotalWallStressAbsoluteDifferencePa = maximumWallDifference(
    (wallId) => sourceEvaluation.wallMechanics[wallId].totalKirchhoffStressPa,
    (wallId) => destinationEvaluation.wallMechanics[wallId].totalKirchhoffStressPa,
  );
  const maximumTotalWallTangentAbsoluteDifferencePa = maximumWallDifference(
    (wallId) => sourceEvaluation.wallMechanics[wallId].totalTangentAtFixedAlphaPa,
    (wallId) => destinationEvaluation.wallMechanics[wallId]
      .totalTangentAtFixedInternalStatePa,
  );
  const maximumTriSegResidualAbsoluteDifferenceNPerM = Math.max(
    Math.abs(
      sourceEvaluation.triSegOracle.equilibriumResidual.axialNPerM
      - destinationEvaluation.triSegOracle.equilibriumResidual.axialNPerM,
    ),
    Math.abs(
      sourceEvaluation.triSegOracle.equilibriumResidual.radialNPerM
      - destinationEvaluation.triSegOracle.equilibriumResidual.radialNPerM,
    ),
  );
  const maximumPressureAbsoluteDifferencePa = Math.max(
    maximumRecordAbsoluteDifference(
      sourceEvaluation.chamberTransmuralPressurePa,
      destinationEvaluation.chamberTransmuralPressurePa,
    ),
    maximumRecordAbsoluteDifference(
      sourceEvaluation.chamberAbsolutePressurePa,
      destinationEvaluation.chamberAbsolutePressurePa,
    ),
    maximumRecordAbsoluteDifference(
      sourceEvaluation.compartmentAbsolutePressurePa,
      destinationEvaluation.compartmentAbsolutePressurePa,
    ),
  );
  const maximumAtrialPressureRelativeDifference = Math.max(
    maximumRecursiveRelativeDifference(
      sourceEvaluation.atria.LA.pressure,
      destinationEvaluation.atria.LA.pressure,
    ),
    maximumRecursiveRelativeDifference(
      sourceEvaluation.atria.RA.pressure,
      destinationEvaluation.atria.RA.pressure,
    ),
  );
  const maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2 = Math.max(
    ...INERTIAL_FLOW_IDS.map((flowId) => Math.abs(
      sourceEvaluation.inertialMomentum[flowId].flowAccelerationM3PerSec2
      - destinationEvaluation.inertialMomentum[flowId]
        .flowAccelerationM3PerSec2,
    )),
  );
  const sourceSeedEncodedExactly =
    canonicalizeJson(destination.upstreamTriSegSeed)
      === canonicalizeJson(transferredCoordinates)
    && destination.upstreamEvidenceSha256
      === upstreamFiniteEnvelopeEvidenceSha256;
  const timeExact = sourceState.timeSec === destinationEndpoint.timeSec;
  const bloodVolumesExact = numericRecordExact(
    sourceState.bloodVolumesM3,
    destinationState.bloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
  );
  const inertialStateFlowsExact = numericRecordExact(
    sourceState.inertialFlowsM3PerSec,
    destinationState.inertialFlowsM3PerSec,
    INERTIAL_FLOW_IDS,
  );
  const solvedTriSegCoordinatesExact = canonicalizeJson(transferredCoordinates)
    === canonicalizeJson(destinationEndpoint.triSegCoordinates);
  const wallFiberStrainsExact = WALL_IDS.every((wallId) =>
    sourceEvaluation.wallMechanics[wallId].fiberLogStrain
      === destinationEvaluation.wallMechanics[wallId].fiberLogStrain);
  const wallReferenceVolumesExact = WALL_IDS.every((wallId) =>
    sourceEvaluation.wallMechanics[wallId].wallReferenceMaterialVolumeM3
      === destinationEvaluation.wallMechanics[wallId]
        .wallReferenceMaterialVolumeM3);
  const passiveMaterialEvaluationsExact = WALL_IDS.every((wallId) =>
    canonicalizeJson(sourceEvaluation.wallMechanics[wallId].equilibriumPassive)
      === canonicalizeJson(
        destinationEvaluation.wallMechanics[wallId].equilibriumPassive,
      ));
  const triSegGeometryExact = canonicalizeJson(sourceEvaluation.triSegGeometry)
    === canonicalizeJson(destinationEvaluation.triSegGeometry);
  const triSegOracleExact = canonicalizeJson(sourceEvaluation.triSegOracle)
    === canonicalizeJson(destinationEvaluation.triSegOracle);
  const pericardiumExact = canonicalizeJson(sourceEvaluation.pericardium)
    === canonicalizeJson(destinationEvaluation.pericardium);
  const vascularEvaluationsExact = canonicalizeJson(sourceEvaluation.vascular)
    === canonicalizeJson(destinationEvaluation.vascular);
  const computedFlowsExact = canonicalizeJson(sourceEvaluation.allFlowsM3PerSec)
    === canonicalizeJson(destinationEvaluation.allFlowsM3PerSec);
  const phaseA1TissueBundleBindingExact =
    fixture.phaseA1TissueManifestBundle.contentSha256
      === destination.provenance.phaseA1TissueManifestBundleSha256;
  const newtonScaleRegistryValuesExact = canonicalizeJson(Object.freeze({
    policy: fixture.newtonScaleRegistry.policy,
    unknownScales: fixture.newtonScaleRegistry.unknownScales,
    numericalUnknownOffsets: Object.freeze({
      default: fixture.newtonScaleRegistry.unknownOffsets.default,
      septalMidwallVolumeM3:
        fixture.newtonScaleRegistry.unknownOffsets.septalMidwallVolumeM3,
      junctionRadiusM:
        fixture.newtonScaleRegistry.unknownOffsets.junctionRadiusM,
    }),
    residualScales: fixture.newtonScaleRegistry.residualScales,
    tolerances: fixture.newtonScaleRegistry.tolerances,
  })) === canonicalizeJson(Object.freeze({
    policy: destinationScaffold.newtonScaleRegistry.policy,
    unknownScales: destinationScaffold.newtonScaleRegistry.unknownScales,
    numericalUnknownOffsets: Object.freeze({
      default: destinationScaffold.newtonScaleRegistry.unknownOffsets.default,
      septalMidwallVolumeM3:
        destinationScaffold.newtonScaleRegistry.unknownOffsets
          .septalMidwallVolumeM3,
      junctionRadiusM:
        destinationScaffold.newtonScaleRegistry.unknownOffsets.junctionRadiusM,
    }),
    residualScales: destinationScaffold.newtonScaleRegistry.residualScales,
    tolerances: destinationScaffold.newtonScaleRegistry.tolerances,
  }));
  const destinationProvenanceBindingsExact =
    destination.provenance.symmetricClosedLoopScaffoldConfigurationSha256
      === phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex)
    && destination.provenance.phaseB1WallMaterialBindingSha256
      === destinationMaterialBinding.contentSha256
    &&
    destination.provenance.phaseA1TissueManifestBundleSha256
      === destinationScaffold.phaseA1TissueManifestBundle.contentSha256
    && destination.provenance.newtonScaleRegistryContentSha256
      === destinationScaffold.newtonScaleRegistry.registryContentSha256;
  const sharedFlowAndPressureParameterBindingsExact = canonicalizeJson(
    Object.freeze({
      valveLossParametersByFlow: fixture.valveLossParametersByFlow,
      inletLossParametersByFlow: fixture.inletLossParametersByFlow,
      vascularComplianceParametersByCompartment:
        fixture.vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow:
        fixture.peripheralResistancePaSecPerM3ByFlow,
      pericardiumParameters: fixture.pericardiumParameters,
      intrathoracicPressurePa: fixture.intrathoracicPressurePa,
    }),
  ) === canonicalizeJson(Object.freeze({
    valveLossParametersByFlow: destinationScaffold.valveLossParametersByFlow,
    inletLossParametersByFlow: destinationScaffold.inletLossParametersByFlow,
    vascularComplianceParametersByCompartment:
      destinationScaffold.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      destinationScaffold.peripheralResistancePaSecPerM3ByFlow,
    pericardiumParameters: destinationScaffold.pericardiumParameters,
    intrathoracicPressurePa: destinationScaffold.intrathoracicPressurePa,
  }));
  const policy = PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1;
  const sharedPhysicalStateParityPass = sourceCenterAccepted
    && sourceSeedEncodedExactly
    && destination.eta === 0
    && destination.equilibriumAudit.coupledColdNodeEquilibriumPass
    && timeExact
    && bloodVolumesExact
    && inertialStateFlowsExact
    && solvedTriSegCoordinatesExact
    && wallFiberStrainsExact
    && wallReferenceVolumesExact
    && passiveMaterialEvaluationsExact
    && triSegGeometryExact
    && triSegOracleExact
    && pericardiumExact
    && vascularEvaluationsExact
    && computedFlowsExact
    && phaseA1TissueBundleBindingExact
    && newtonScaleRegistryValuesExact
    && destinationProvenanceBindingsExact
    && sharedFlowAndPressureParameterBindingsExact
    && pinnedEvidenceDigestAndCanonicalCurrentSourceMatched
    && maximumAssembledActiveStressAbsoluteDifferencePa
      <= policy.maximumAssembledActiveStressAbsoluteDifferencePa
    && maximumSlsOverstressAbsoluteDifferencePa
      <= policy.maximumSlsOverstressAbsoluteDifferencePa
    && maximumTotalWallStressAbsoluteDifferencePa
      <= policy.maximumTotalWallStressAbsoluteDifferencePa
    && maximumTotalWallTangentAbsoluteDifferencePa
      <= policy.maximumTotalWallTangentAbsoluteDifferencePa
    && maximumTriSegResidualAbsoluteDifferenceNPerM
      <= policy.maximumTriSegResidualAbsoluteDifferenceNPerM
    && maximumPressureAbsoluteDifferencePa
      <= policy.maximumPressureAbsoluteDifferencePa
    && maximumAtrialPressureRelativeDifference
      <= policy.maximumAtrialPressureRelativeDifference
    && maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2
      <= policy.maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2
    && destination.node.scaledResidualInfinityNorm
      <= policy.maximumB1ScaledColdResidualInfinityNorm;
  const parityAudit: PhaseB0CenterToPhaseB1EtaZeroParityAuditV1 = Object.freeze({
    sourceCenterAccepted,
    sourceCenterIsUnique: centerMatches.length === 1,
    transferredOnlyTriSegCoordinates: true,
    sourceSeedEncodedExactly,
    destinationEtaIsExactlyZero: destination.eta === 0,
    destinationColdEquilibriumPass:
      destination.equilibriumAudit.coupledColdNodeEquilibriumPass,
    timeExact,
    bloodVolumesExact,
    inertialStateFlowsExact,
    solvedTriSegCoordinatesExact,
    wallFiberStrainsExact,
    wallReferenceVolumesExact,
    passiveMaterialEvaluationsExact,
    triSegGeometryExact,
    triSegOracleExact,
    pericardiumExact,
    vascularEvaluationsExact,
    computedFlowsExact,
    phaseA1TissueBundleBindingExact,
    newtonScaleRegistryValuesExact,
    destinationProvenanceBindingsExact,
    sharedFlowAndPressureParameterBindingsExact,
    pinnedEvidenceDigestAndCanonicalCurrentSourceMatched,
    maximumAssembledActiveStressAbsoluteDifferencePa,
    maximumRawLandActiveDiagnosticDifferencePa,
    maximumSlsOverstressAbsoluteDifferencePa,
    maximumTotalWallStressAbsoluteDifferencePa,
    maximumTotalWallTangentAbsoluteDifferencePa,
    maximumTriSegResidualAbsoluteDifferenceNPerM,
    maximumPressureAbsoluteDifferencePa,
    maximumAtrialPressureRelativeDifference,
    maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2,
    rawLandActiveStressDirectParityClaimed: false,
    landStateCopiedFromPhaseB0: false,
    slsStateCopiedFromPhaseB0: false,
    calciumStateCopiedFromPhaseB0: false,
    sharedPhysicalStateParityPass,
  });
  return Object.freeze({
    bridgeId: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
    slsMode: sourceResult.slsMode,
    upstreamFiniteEnvelopeEvidenceSha256,
    source: Object.freeze({
      protocolId: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
      nodeId: "C" as const,
      rootId: center.root.rootId,
      algorithmicJacobianId: center.root.algorithmicJacobianId,
      coordinates: transferredCoordinates,
    }),
    transfer: Object.freeze({
      fieldNames: policy.transferredFields,
      triSegCoordinates: transferredCoordinates,
      noOtherPhaseB0StateTransferred: true as const,
    }),
    destination,
    parityAudit,
    phaseB0CenterToPhaseB1EtaZeroBridgePass: sharedPhysicalStateParityPass,
    acceptedPhaseB1ReferenceBranchPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    continuousIntervalRegularityPass: false,
    globalRootUniquenessPass: false,
    energeticStabilityPass: false,
    physiologicalInitializationPass: false,
    closedLoopStationarityPass: false,
    fullBeatAcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
  });
}

function buildSourceCenterState(
  baseState: PhaseB0HydromechanicsStateV1,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>,
): PhaseB0HydromechanicsStateV1 {
  const shared = {
    timeSec: 0 as const,
    bloodVolumesM3,
    inertialFlowsM3PerSec: baseState.inertialFlowsM3PerSec,
    triSegCoordinates,
  } as const;
  return baseState.slsMode === "on"
    ? Object.freeze({
      ...shared,
      slsMode: "on" as const,
      slsAlphaVByWall: baseState.slsAlphaVByWall,
    })
    : Object.freeze({ ...shared, slsMode: "off" as const });
}

function maximumWallDifference(
  source: (wallId: FourChamberWallId) => number,
  destination: (wallId: FourChamberWallId) => number,
): number {
  return Math.max(...WALL_IDS.map((wallId) => Math.abs(
    source(wallId) - destination(wallId),
  )));
}

function deepExactEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null || right === null
    || typeof left !== "object" || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) return false;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length
      && left.every((value, index) => deepExactEqual(value, right[index]));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && deepExactEqual(leftRecord[key], rightRecord[key]));
}

function numericRecordExact<K extends string>(
  left: Readonly<Record<K, number>>,
  right: Readonly<Record<K, number>>,
  keys: readonly K[],
): boolean {
  return keys.every((key) => left[key] === right[key]);
}

function maximumRecordAbsoluteDifference<K extends string>(
  left: Readonly<Record<K, number>>,
  right: Readonly<Record<K, number>>,
): number {
  const keys = Object.keys(left) as K[];
  if (
    keys.length !== Object.keys(right).length
    || keys.some((key) => !Object.hasOwn(right, key))
  ) throw new Error("bridge numeric record structure drifted");
  return Math.max(0, ...keys.map((key) => Math.abs(left[key] - right[key])));
}

function maximumRecursiveRelativeDifference(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    const scale = Math.max(Math.abs(left), Math.abs(right));
    return scale === 0 ? 0 : Math.abs(left - right) / scale;
  }
  if (
    left === null || right === null
    || typeof left !== "object" || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) {
    if (left !== right) throw new Error("bridge diagnostic structure drifted");
    return 0;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      throw new Error("bridge diagnostic array length drifted");
    }
    return Math.max(0, ...left.map((value, index) =>
      maximumRecursiveRelativeDifference(value, right[index])));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const keys = Object.keys(leftRecord).sort();
  if (canonicalizeJson(keys) !== canonicalizeJson(Object.keys(rightRecord).sort())) {
    throw new Error("bridge diagnostic record keys drifted");
  }
  return Math.max(0, ...keys.map((key) =>
    maximumRecursiveRelativeDifference(leftRecord[key], rightRecord[key])));
}
