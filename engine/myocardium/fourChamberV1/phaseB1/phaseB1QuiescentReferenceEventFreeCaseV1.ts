import type { CanonicalSha256HexProvider } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  buildFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeEndpointEvaluationV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
  type PhaseB1QuiescentPressureReferenceInverseResultV1,
  type PhaseB1QuiescentPressureReferenceNodeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import type { PhaseB1EndpointStateV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  buildPhaseB1WallMaterialBindingV1,
  getPhaseB1WallPassiveStressScalesV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type FourChamberWallId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID =
  "phase-b1-project-synthetic-quiescent-reference-event-free-case-v1" as const;

export const PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-project-synthetic-quiescent-reference-event-free-case-policy-v1",
    destinationRegistryStageBoundary:
      "compile-once-after-accepted-inverse-before-any-backward-euler-step" as const,
    destinationRegistryReferenceCenteredGeometryEvidenceId:
      "phase-b1-quiescent-pressure-reference-destination-centered-v1" as const,
    geometryChanges: Object.freeze({
      atrialReferenceCavityVolumeM3ByChamber: Object.freeze(["LA", "RA"] as const),
      triSegReferenceMidwallAreaM2ByWall: Object.freeze(["LVFW", "RVFW"] as const),
      septalReferenceMidwallAreaFixedAnchorExact: true as const,
    }),
    maximumAbsoluteChamberTargetPressureDifferencePa:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAbsoluteDestinationPressureDifferencePa,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAbsoluteDestinationFlowAccelerationM3PerSec2,
    inverseAnchorRegistryValuesReverseEngineered: false as const,
    adaptiveRescalingAllowed: false as const,
  } as const);

export type PhaseB1QuiescentReferenceDestinationRegistryAuditV1 = Readonly<{
  stageBoundary:
    typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1.destinationRegistryStageBoundary;
  inverseAnchorRegistryContentSha256: string;
  destinationRegistryContentSha256: string;
  registryContentHashChanged: boolean;
  registryCompilationCount: 1;
  registryCompiledAfterAcceptedDestination: true;
  referenceBloodVolumesTakenFromAcceptedEndpointExact: true;
  triSegReferenceAreasTakenFromAcceptedConfigurationExact: true;
  referenceCenteredOffsetsTakenFromAcceptedEndpointExact: true;
  materialScaleInputsTakenFromCanonicalRuntimeBinding: true;
  anchorRegistryValuesReverseEngineered: false;
  adaptiveRescalingApplied: false;
  destinationRegistryCanonicalAssertionPass: true;
  pass: boolean;
}>;

export type PhaseB1QuiescentReferenceEventFreeStaticAuditV1 = Readonly<{
  inverseAccepted: true;
  inverseEndpointRhoExactOne: boolean;
  inverseEndpointObjectRetained: boolean;
  scaffoldConfigurationSha256Matches: boolean;
  phaseA1TissueManifestBundleSha256Matches: boolean;
  phaseB1WallMaterialBindingSha256Matches: boolean;
  anchorRegistrySha256Matches: boolean;
  atrialReferenceConfigurationAppliedExact: boolean;
  freewallReferenceConfigurationAppliedExact: boolean;
  septalReferenceAreaFixedAnchorExact: boolean;
  wallReferenceMaterialVolumesFixedExact: boolean;
  fixedBloodVolumesExact: boolean;
  fixedInertialFlowsExact: boolean;
  fixedCalciumExactZero: boolean;
  endpointTimeExactZero: boolean;
  unchangedClosedLoopParameterObjectsRetained: boolean;
  maximumAbsoluteChamberTargetPressureDifferencePa: number;
  maximumAbsoluteInertialFlowAccelerationM3PerSec2: number;
  allClosedLoopFlowsExactlyZero: boolean;
  destinationEvaluationReplaysInverseChamberPressuresExact: boolean;
  destinationEvaluationReplaysInverseFlowsExact: boolean;
  pass: boolean;
}>;

export type PhaseB1QuiescentReferenceEventFreeCaseV1 = Readonly<{
  caseId: typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID;
  slsMode: "on" | "off";
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1;
  acceptedInverseEndpoint: PhaseB1QuiescentPressureReferenceNodeV1;
  referenceEndpoint: PhaseB1EndpointStateV1;
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  destinationEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  destinationRegistry: FourChamberNewtonScaleRegistryV1;
  registryAudit: PhaseB1QuiescentReferenceDestinationRegistryAuditV1;
  staticAudit: PhaseB1QuiescentReferenceEventFreeStaticAuditV1;
  projectSyntheticQuiescentReferenceEventFreeCasePass: boolean;
  closedLoopStationarityPass: false;
  physiologicalReferenceAcceptancePass: false;
  supportedReferenceEnvelopePass: false;
  fullBeatAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

/**
 * Adapts only an accepted project-synthetic inverse endpoint to the existing
 * event-free monolithic model. The inverse uses its anchor registry throughout
 * continuation. A destination registry is compiled exactly once at the stage
 * boundary after acceptance, then remains fixed for every downstream step.
 */
export function buildPhaseB1QuiescentReferenceEventFreeCaseV1(
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceEventFreeCaseV1 {
  if (typeof sha256Hex !== "function") {
    throw new Error("quiescent event-free case requires a sha256 provider");
  }
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(inverse);
  const acceptedInverseEndpoint = requireAcceptedInverseEndpoint(inverse);
  const referenceEndpoint = acceptedInverseEndpoint.evaluation.endpoint;
  const referenceConfiguration = acceptedInverseEndpoint.referenceConfiguration;

  // This deterministic reconstruction authenticates the physical/material
  // source without carrying private solver context across the stage boundary.
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256Hex);
  const wallMaterialBinding = assertPhaseB1WallMaterialBindingV1(
    buildPhaseB1WallMaterialBindingV1(
      scaffold.phaseA1TissueManifestBundle,
      sha256Hex,
    ),
  );
  const scaffoldConfigurationSha256 =
    phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex);
  const anchorProvenance = inverse.anchorProvenance;
  requireSha256(
    anchorProvenance.syntheticClosedLoopScaffoldConfigurationSha256,
    "inverse.anchorProvenance.syntheticClosedLoopScaffoldConfigurationSha256",
  );
  requireSha256(
    anchorProvenance.phaseA1TissueManifestBundleSha256,
    "inverse.anchorProvenance.phaseA1TissueManifestBundleSha256",
  );
  requireSha256(
    anchorProvenance.phaseB1WallMaterialBindingSha256,
    "inverse.anchorProvenance.phaseB1WallMaterialBindingSha256",
  );
  requireSha256(
    anchorProvenance.anchorNewtonScaleRegistryContentSha256,
    "inverse.anchorProvenance.anchorNewtonScaleRegistryContentSha256",
  );

  const atrialGeometryPriorByChamber = Object.freeze({
    LA: Object.freeze({
      ...scaffold.atrialGeometryPriorByChamber.LA,
      referenceCavityVolumeM3:
        referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.LA,
    }),
    RA: Object.freeze({
      ...scaffold.atrialGeometryPriorByChamber.RA,
      referenceCavityVolumeM3:
        referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.RA,
    }),
  });
  if (
    !Object.is(
      referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.SEP,
      scaffold.triSegReference.walls.SEP.referenceMidwallAreaM2,
    )
  ) {
    throw new Error(
      "quiescent event-free case requires the SEP reference area to remain anchor-exact",
    );
  }
  const triSegWalls = Object.freeze({
    LVFW: Object.freeze({
      ...scaffold.triSegReference.walls.LVFW,
      referenceMidwallAreaM2:
        referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.LVFW,
    }),
    // Reuse the exact anchor object: the four-parameter inverse is not allowed
    // to infer a septal reference coordinate without a fifth datum.
    SEP: scaffold.triSegReference.walls.SEP,
    RVFW: Object.freeze({
      ...scaffold.triSegReference.walls.RVFW,
      referenceMidwallAreaM2:
        referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.RVFW,
    }),
  });

  // The accepted endpoint is checked before this call. There is exactly one
  // registry compilation at this adapter boundary and no later rescaling.
  let destinationRegistryCompilationCount = 0;
  destinationRegistryCompilationCount += 1;
  const destinationRegistry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    buildFourChamberNewtonScaleRegistryV1(
      {
        referenceBloodVolumesM3:
          referenceEndpoint.differentialState.bloodVolumesM3,
        landDistortionCoefficientsByWall: wallRecord((wallId) => {
          const material = wallMaterialBinding.runtimeByWall[wallId];
          return Object.freeze({
            Aw: material.landEquationParameters.derived.Aw,
            As: material.landEquationParameters.derived.As,
          });
        }),
        tissueStressInputsByWall: wallRecord((wallId) => {
          const material = wallMaterialBinding.runtimeByWall[wallId];
          const passiveScales = getPhaseB1WallPassiveStressScalesV1(material);
          return Object.freeze({
            landReferenceTensionPa:
              material.landEquationParameters.values.Tref,
            passiveTensileStressScalePa:
              passiveScales.tensileStressScalePa,
            compressionStressScalePa:
              passiveScales.compressionStressScalePa,
          });
        }),
        triSegInputsByWall: triSegRecord((wallId) => Object.freeze({
          wallReferenceMaterialVolumeM3:
            triSegWalls[wallId].wallMaterialVolumeM3,
          midwallReferenceAreaM2:
            triSegWalls[wallId].referenceMidwallAreaM2,
        })),
        referenceCenteredGeometryOffsets: Object.freeze({
          septalMidwallVolumeM3: referenceEndpoint.triSegCoordinates.V_m_S,
          junctionRadiusM: referenceEndpoint.triSegCoordinates.y_m,
          evidenceId:
            PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
              .destinationRegistryReferenceCenteredGeometryEvidenceId,
        }),
      },
      sha256Hex,
    ),
  );
  if (destinationRegistryCompilationCount !== 1) {
    throw new Error("destination registry must be compiled exactly once");
  }

  const model: PhaseB1EventFreeMonolithicModelV1 = Object.freeze({
    modelId: "four-chamber-phase-b1-candidate-prior-test-reference-v1",
    closedLoopParameters: Object.freeze({
      atrialGeometryPriorByChamber,
      triSegWalls,
      vascularComplianceParametersByCompartment:
        scaffold.vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow:
        scaffold.peripheralResistancePaSecPerM3ByFlow,
      valveLossParametersByFlow: scaffold.valveLossParametersByFlow,
      inletLossParametersByFlow: scaffold.inletLossParametersByFlow,
      pericardiumParameters: scaffold.pericardiumParameters,
      intrathoracicPressurePa: scaffold.intrathoracicPressurePa,
    }),
    newtonScaleRegistry: destinationRegistry,
    candidatePriorOnly: true,
    physiologicalValidation: false,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
  const destinationEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    wallMaterialBinding,
    referenceEndpoint,
  );

  const scaffoldConfigurationSha256Matches =
    scaffoldConfigurationSha256
      === anchorProvenance.syntheticClosedLoopScaffoldConfigurationSha256;
  const phaseA1TissueManifestBundleSha256Matches =
    scaffold.phaseA1TissueManifestBundle.contentSha256
      === anchorProvenance.phaseA1TissueManifestBundleSha256;
  const phaseB1WallMaterialBindingSha256Matches =
    wallMaterialBinding.contentSha256
      === anchorProvenance.phaseB1WallMaterialBindingSha256;
  const anchorRegistrySha256Matches =
    scaffold.newtonScaleRegistry.registryContentSha256
      === anchorProvenance.anchorNewtonScaleRegistryContentSha256
    && inverse.anchorNewtonScaleRegistryContentSha256
      === anchorProvenance.anchorNewtonScaleRegistryContentSha256;
  const registryContentHashChanged =
    destinationRegistry.registryContentSha256
      !== anchorProvenance.anchorNewtonScaleRegistryContentSha256;
  const registryAudit: PhaseB1QuiescentReferenceDestinationRegistryAuditV1 =
    Object.freeze({
      stageBoundary:
        PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
          .destinationRegistryStageBoundary,
      inverseAnchorRegistryContentSha256:
        anchorProvenance.anchorNewtonScaleRegistryContentSha256,
      destinationRegistryContentSha256:
        destinationRegistry.registryContentSha256,
      registryContentHashChanged,
      registryCompilationCount: 1 as const,
      registryCompiledAfterAcceptedDestination: true as const,
      referenceBloodVolumesTakenFromAcceptedEndpointExact: true as const,
      triSegReferenceAreasTakenFromAcceptedConfigurationExact: true as const,
      referenceCenteredOffsetsTakenFromAcceptedEndpointExact: true as const,
      materialScaleInputsTakenFromCanonicalRuntimeBinding: true as const,
      anchorRegistryValuesReverseEngineered: false as const,
      adaptiveRescalingApplied: false as const,
      destinationRegistryCanonicalAssertionPass: true as const,
      pass: anchorRegistrySha256Matches
        && registryContentHashChanged
        && destinationRegistry.fixedBeforeRun
        && !destinationRegistry.adaptiveRescaling,
    });

  const inverseEndpointRhoExactOne = Object.is(acceptedInverseEndpoint.rho, 1);
  const atrialReferenceConfigurationAppliedExact =
    Object.is(
      atrialGeometryPriorByChamber.LA.referenceCavityVolumeM3,
      referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.LA,
    )
    && Object.is(
      atrialGeometryPriorByChamber.RA.referenceCavityVolumeM3,
      referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.RA,
    );
  const freewallReferenceConfigurationAppliedExact =
    Object.is(
      triSegWalls.LVFW.referenceMidwallAreaM2,
      referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.LVFW,
    )
    && Object.is(
      triSegWalls.RVFW.referenceMidwallAreaM2,
      referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.RVFW,
    );
  const septalReferenceAreaFixedAnchorExact =
    Object.is(triSegWalls.SEP, scaffold.triSegReference.walls.SEP)
    && Object.is(
      triSegWalls.SEP.referenceMidwallAreaM2,
      scaffold.triSegReference.walls.SEP.referenceMidwallAreaM2,
    );
  const wallReferenceMaterialVolumesFixedExact = TRISEG_WALL_IDS.every(
    (wallId) => Object.is(
      triSegWalls[wallId].wallMaterialVolumeM3,
      scaffold.triSegReference.walls[wallId].wallMaterialVolumeM3,
    ),
  );
  const fixedBloodVolumesExact = BLOOD_COMPARTMENT_IDS.every((id) =>
    Object.is(
      referenceEndpoint.differentialState.bloodVolumesM3[id],
      scaffold.initialState.bloodVolumesM3[id],
    ));
  const fixedInertialFlowsExact = INERTIAL_FLOW_IDS.every((id) =>
    Object.is(
      referenceEndpoint.differentialState.inertialFlowsM3PerSec[id],
      scaffold.initialState.inertialFlowsM3PerSec[id],
    ));
  const fixedCalciumExactZero = WALL_IDS.every((wallId) => {
    const calcium = referenceEndpoint.differentialState.calciumByWall[wallId];
    return Object.is(calcium.r, 0) && Object.is(calcium.d, 0);
  });
  const unchangedClosedLoopParameterObjectsRetained =
    Object.is(
      model.closedLoopParameters.vascularComplianceParametersByCompartment,
      scaffold.vascularComplianceParametersByCompartment,
    )
    && Object.is(
      model.closedLoopParameters.peripheralResistancePaSecPerM3ByFlow,
      scaffold.peripheralResistancePaSecPerM3ByFlow,
    )
    && Object.is(
      model.closedLoopParameters.valveLossParametersByFlow,
      scaffold.valveLossParametersByFlow,
    )
    && Object.is(
      model.closedLoopParameters.inletLossParametersByFlow,
      scaffold.inletLossParametersByFlow,
    )
    && Object.is(
      model.closedLoopParameters.pericardiumParameters,
      scaffold.pericardiumParameters,
    )
    && Object.is(
      model.closedLoopParameters.intrathoracicPressurePa,
      scaffold.intrathoracicPressurePa,
    );
  const maximumAbsoluteChamberTargetPressureDifferencePa = maximumAbsolute(
    Object.values(destinationEvaluation.closedLoop.chamberAbsolutePressurePa)
      .map((pressure) => pressure - inverse.commonVascularTargetPressurePa),
  );
  const maximumAbsoluteInertialFlowAccelerationM3PerSec2 = maximumAbsolute(
    INERTIAL_FLOW_IDS.map((flowId) =>
      destinationEvaluation.closedLoop.inertialMomentum[flowId]
        .flowAccelerationM3PerSec2),
  );
  const allClosedLoopFlowsExactlyZero = Object.values(
    destinationEvaluation.closedLoop.allFlowsM3PerSec,
  ).every((flow) => flow === 0);
  const destinationEvaluationReplaysInverseChamberPressuresExact =
    exactNumberRecord(
      destinationEvaluation.closedLoop.chamberAbsolutePressurePa,
      acceptedInverseEndpoint.evaluation.closedLoop.chamberAbsolutePressurePa,
      ["LA", "LV", "RA", "RV"],
    );
  const destinationEvaluationReplaysInverseFlowsExact = exactNumberRecord(
    destinationEvaluation.closedLoop.allFlowsM3PerSec,
    acceptedInverseEndpoint.evaluation.closedLoop.allFlowsM3PerSec,
    Object.keys(destinationEvaluation.closedLoop.allFlowsM3PerSec),
  );
  const staticAudit: PhaseB1QuiescentReferenceEventFreeStaticAuditV1 =
    Object.freeze({
      inverseAccepted: true as const,
      inverseEndpointRhoExactOne,
      inverseEndpointObjectRetained:
        Object.is(referenceEndpoint, acceptedInverseEndpoint.evaluation.endpoint),
      scaffoldConfigurationSha256Matches,
      phaseA1TissueManifestBundleSha256Matches,
      phaseB1WallMaterialBindingSha256Matches,
      anchorRegistrySha256Matches,
      atrialReferenceConfigurationAppliedExact,
      freewallReferenceConfigurationAppliedExact,
      septalReferenceAreaFixedAnchorExact,
      wallReferenceMaterialVolumesFixedExact,
      fixedBloodVolumesExact,
      fixedInertialFlowsExact,
      fixedCalciumExactZero,
      endpointTimeExactZero: Object.is(referenceEndpoint.timeSec, 0),
      unchangedClosedLoopParameterObjectsRetained,
      maximumAbsoluteChamberTargetPressureDifferencePa,
      maximumAbsoluteInertialFlowAccelerationM3PerSec2,
      allClosedLoopFlowsExactlyZero,
      destinationEvaluationReplaysInverseChamberPressuresExact,
      destinationEvaluationReplaysInverseFlowsExact,
      pass: inverseEndpointRhoExactOne
        && scaffoldConfigurationSha256Matches
        && phaseA1TissueManifestBundleSha256Matches
        && phaseB1WallMaterialBindingSha256Matches
        && anchorRegistrySha256Matches
        && atrialReferenceConfigurationAppliedExact
        && freewallReferenceConfigurationAppliedExact
        && septalReferenceAreaFixedAnchorExact
        && wallReferenceMaterialVolumesFixedExact
        && fixedBloodVolumesExact
        && fixedInertialFlowsExact
        && fixedCalciumExactZero
        && Object.is(referenceEndpoint.timeSec, 0)
        && unchangedClosedLoopParameterObjectsRetained
        && maximumAbsoluteChamberTargetPressureDifferencePa
          <= PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
            .maximumAbsoluteChamberTargetPressureDifferencePa
        && maximumAbsoluteInertialFlowAccelerationM3PerSec2
          <= PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
            .maximumAbsoluteInertialFlowAccelerationM3PerSec2
        && allClosedLoopFlowsExactlyZero
        && destinationEvaluationReplaysInverseChamberPressuresExact
        && destinationEvaluationReplaysInverseFlowsExact,
    });
  const projectSyntheticQuiescentReferenceEventFreeCasePass =
    registryAudit.pass && staticAudit.pass;
  if (!projectSyntheticQuiescentReferenceEventFreeCasePass) {
    throw new Error(
      "accepted inverse endpoint failed the quiescent event-free adapter audit",
    );
  }
  return Object.freeze({
    caseId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
    slsMode: inverse.slsMode,
    inverse,
    acceptedInverseEndpoint,
    referenceEndpoint,
    model,
    wallMaterialBinding,
    destinationEvaluation,
    destinationRegistry,
    registryAudit,
    staticAudit,
    projectSyntheticQuiescentReferenceEventFreeCasePass,
    closedLoopStationarityPass: false as const,
    physiologicalReferenceAcceptancePass: false as const,
    supportedReferenceEnvelopePass: false as const,
    fullBeatAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  });
}

function requireAcceptedInverseEndpoint(
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1,
): PhaseB1QuiescentPressureReferenceNodeV1 {
  const failedGates: string[] = [];
  if (inverse.inverseId !== PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID) {
    failedGates.push("inverseId");
  }
  if (inverse.projectSyntheticQuiescentReferenceInversePass !== true) {
    failedGates.push("projectSyntheticQuiescentReferenceInversePass");
  }
  if (!inverse.sourceGraph.phaseB1LandCoupledFiniteVolumeGraphPass) {
    failedGates.push("sourceGraph.phaseB1LandCoupledFiniteVolumeGraphPass");
  }
  if (inverse.sourceGraph.slsMode !== inverse.slsMode) {
    failedGates.push("sourceGraph.slsMode");
  }
  const centerNodes = inverse.sourceGraph.canonicalNodes.filter((node) =>
    node.nodeId === "C");
  if (centerNodes.length !== 1) {
    failedGates.push("sourceGraph.canonicalCCount");
  } else if (
    inverse.sourceCanonicalNodeObjectIdentity !== true
    || !Object.is(centerNodes[0].node, inverse.sourceCanonicalNode)
  ) {
    failedGates.push("sourceCanonicalNodeObjectIdentity");
  }
  if (inverse.sourceIdentityAudit.pass !== true) {
    failedGates.push("sourceIdentityAudit.pass");
  }
  if (
    inverse.anchorNewtonScaleRegistryContentSha256
      !== inverse.anchorProvenance.anchorNewtonScaleRegistryContentSha256
  ) {
    failedGates.push("anchorProvenance.registrySha256Identity");
  }
  if (inverse.endpoint === null) {
    failedGates.push("endpoint");
  } else {
    if (inverse.endpoint.hardGatePass !== true) {
      failedGates.push("endpoint.hardGatePass");
    }
    if (inverse.endpoint.fiftyPercentGuardPass !== true) {
      failedGates.push("endpoint.fiftyPercentGuardPass");
    }
    if (
      inverse.slsMode !== inverse.endpoint.evaluation.endpoint
        .differentialState.slsMode
    ) {
      failedGates.push("endpoint.slsMode");
    }
    if (
      inverse.endpoint.sourceGraphCanonicalNodeObjectIdentity !== true
      || !Object.is(
        inverse.endpoint.sourceGraphCanonicalNode,
        inverse.sourceCanonicalNode,
      )
    ) {
      failedGates.push("endpoint.sourceGraphCanonicalNodeObjectIdentity");
    }
    const selectedAttemptIndex = inverse.selectedAttemptIndex;
    if (
      selectedAttemptIndex === null
      || !Number.isInteger(selectedAttemptIndex)
      || selectedAttemptIndex < 0
      || selectedAttemptIndex >= inverse.attempts.length
    ) {
      failedGates.push("selectedAttemptIndex");
    } else {
      const selectedAttempt = inverse.attempts[selectedAttemptIndex];
      if (
        selectedAttempt.completed !== true
        || !Object.is(selectedAttempt.endpoint, inverse.endpoint)
        || selectedAttempt.refinementFactor !== inverse.selectedRefinementFactor
      ) {
        failedGates.push("selectedAttemptEndpointObjectIdentity");
      }
    }
  }
  for (const [field, value] of Object.entries({
    eventFreeBackwardEulerIdentityHoldPass:
      inverse.eventFreeBackwardEulerIdentityHoldPass,
    closedLoopStationarityPass: inverse.closedLoopStationarityPass,
    physiologicalReferenceAcceptancePass:
      inverse.physiologicalReferenceAcceptancePass,
    supportedReferenceEnvelopePass: inverse.supportedReferenceEnvelopePass,
    fullBeatAcceptancePass: inverse.fullBeatAcceptancePass,
    physiologicalValidationPass: inverse.physiologicalValidationPass,
    phaseB1AcceptancePass: inverse.phaseB1AcceptancePass,
    modelCoreIntegration: inverse.modelCoreIntegration,
    browserRuntimeAdopted: inverse.browserRuntimeAdopted,
    releaseRuntimeReachable: inverse.releaseRuntimeReachable,
    pureCoreParentEvidenceAuthenticationClaimed:
      inverse.pureCoreParentEvidenceAuthenticationClaimed,
  })) {
    if (value !== false) failedGates.push(field);
  }
  if (inverse.testOnly !== true) failedGates.push("testOnly");
  if (failedGates.length > 0 || inverse.endpoint === null) {
    throw new Error(
      "quiescent event-free case requires one accepted test-only inverse endpoint; "
      + `failed gates=${failedGates.join(",")}`,
    );
  }
  return inverse.endpoint;
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<FourChamberWallId, Value>>;
}

function triSegRecord<Value>(
  build: (wallId: TriSegWallId) => Value,
): Readonly<Record<TriSegWallId, Value>> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<TriSegWallId, Value>>;
}

function exactNumberRecord(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
  keys: readonly string[],
): boolean {
  return keys.every((key) => Object.is(left[key], right[key]));
}

function maximumAbsolute(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximumAbsolute requires values");
  return Math.max(...values.map((value, index) => {
    if (!Number.isFinite(value)) {
      throw new Error(`maximumAbsolute values[${index}] must be finite`);
    }
    return Math.abs(value);
  }));
}

function requireSha256(value: string, field: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${field} must be a lowercase SHA-256 digest`);
  }
  return value;
}
