import {
  evaluateFourChamberVolumeRatesV1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  evaluateSignedFlowMomentumV1,
  evaluateValveMomentumV1,
  type SignedFlowLossParametersV1,
  type ValveLossParametersV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  buildFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeEndpointEvaluationV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  buildPhaseB1QuiescentReferenceEventFreeCaseV1,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import type {
  PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  ALGEBRAIC_FLOW_IDS,
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type AlgebraicFlowId,
  type BloodCompartmentId,
  type FourChamberWallId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import type {
  LinearVascularComplianceParametersV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_V1_ID =
  "phase-b1-four-chamber-physiology-envelope-candidate-case-v1" as const;

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1 = Object.freeze({
  policyId: "phase-b1-four-chamber-physiology-envelope-candidate-policy-v1",
  totalBloodVolumeResidualOwner: "SV" as const,
  totalBloodVolumeResidualRole:
    "initial-pressure-preserving-bootstrap-only" as const,
  failedPressureOrVolumeGateAction:
    "reject-candidate-and-rebuild-declared-multicompartment-initial-allocation" as const,
  physiologicalDistributionEstablishedBySvResidual: false as const,
  sourceRole: "warm-start-state-material-and-geometry-only" as const,
  vascularUnstressedVolumeRule:
    "V0_new=V_initial_new-C_new*(P_initial_source-P_external_source)" as const,
  newtonRegistryStageBoundary:
    "compile-once-after-overlay-before-any-backward-euler-step" as const,
  newtonRegistryReferenceCenteredGeometryEvidenceId:
    "phase-b1-physiology-envelope-initial-centered-v1" as const,
  totalBloodVolumeRelativeTolerance: 4096 * Number.EPSILON,
  maximumAbsoluteInitialPressureReplayDifferencePa: 1e-5,
  maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2: 1e-8,
  maximumAbsoluteInitialVolumeRateM3PerSec: 1e-12,
  maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM: 1e-10,
  adaptiveRescalingAllowed: false as const,
  projectionAllowed: false as const,
} as const);

const VASCULAR_COMPARTMENT_IDS = Object.freeze(["SA", "SV", "PA", "PV"] as const);
const VALVE_FLOW_IDS = Object.freeze(["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"] as const);
const INLET_FLOW_IDS = Object.freeze(["Q_VC", "Q_PV"] as const);
const NON_SV_BLOOD_COMPARTMENT_IDS = Object.freeze(
  BLOOD_COMPARTMENT_IDS.filter((id) => id !== "SV"),
) as readonly Exclude<BloodCompartmentId, "SV">[];

type VascularCompartmentId = typeof VASCULAR_COMPARTMENT_IDS[number];
type ValveFlowId = typeof VALVE_FLOW_IDS[number];
type InletFlowId = typeof INLET_FLOW_IDS[number];

export type PhaseB1PhysiologyEnvelopeOverlayV1 = Readonly<{
  totalBloodVolumeM3: number;
  vascularComplianceM3PerPaByCompartment: Readonly<
    Record<VascularCompartmentId, number>
  >;
  peripheralResistancePaSecPerM3ByFlow: Readonly<
    Record<AlgebraicFlowId, number>
  >;
  valveLossParametersByFlow: Readonly<Record<ValveFlowId, ValveLossParametersV1>>;
  inletLossParametersByFlow: Readonly<
    Record<InletFlowId, SignedFlowLossParametersV1>
  >;
}>;

export type PhaseB1PhysiologyEnvelopeTotalBloodVolumeAuditV1 = Readonly<{
  targetTotalBloodVolumeM3: number;
  sourceTotalBloodVolumeM3: number;
  retainedNonSvSubtotalM3: number;
  assignedSvResidualVolumeM3: number;
  destinationTotalBloodVolumeM3: number;
  totalBloodVolumeDifferenceM3: number;
  totalBloodVolumeRelativeDifference: number;
  nonSvBloodVolumesRetainedExact: boolean;
  residualAssignedOnlyToSv: true;
  residualAllocationRole:
    typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.totalBloodVolumeResidualRole;
  physiologicalBloodVolumeDistributionClaimed: false;
  bloodVolumeProjectionApplied: false;
  pass: boolean;
}>;

export type PhaseB1PhysiologyEnvelopeRegistryAuditV1 = Readonly<{
  stageBoundary:
    typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.newtonRegistryStageBoundary;
  sourceRegistryContentSha256: string;
  destinationRegistryContentSha256: string;
  registryContentHashChanged: boolean;
  registryCompilationCount: 1;
  referenceBloodVolumesTakenFromEnvelopeInitialEndpointExact: true;
  referenceCenteredOffsetsTakenFromEnvelopeInitialEndpointExact: true;
  geometryAndMaterialScaleInputsTakenFromCanonicalWarmStart: true;
  adaptiveRescalingApplied: false;
  destinationRegistryCanonicalAssertionPass: true;
  pass: boolean;
}>;

export type PhaseB1PhysiologyEnvelopeInitialStationarityAuditV1 = Readonly<{
  canonicalWarmStartStaticAuditPass: true;
  sourceMaterialStateRetainedExact: boolean;
  sourceInertialFlowsRetainedExact: boolean;
  sourceTriSegCoordinatesRetainedExact: boolean;
  sourceGeometryAndExternalPressureObjectsRetained: boolean;
  sourceWallStressReplayExact: boolean;
  sourceChamberPressureReplayExact: boolean;
  maximumAbsoluteInitialPressureReplayDifferencePa: number;
  maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2: number;
  maximumAbsoluteInitialVolumeRateM3PerSec: number;
  maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM: number;
  initialTotalVolumeRateM3PerSec: number;
  vascularPressureReplayPass: boolean;
  inertialMomentumStationarityPass: boolean;
  volumeRateStationarityPass: boolean;
  triSegEquilibriumReplayPass: boolean;
  projectionApplied: false;
  flowClampApplied: false;
  initialStationarityPass: boolean;
}>;

export type PhaseB1PhysiologyEnvelopeCaseProvenanceV1 = Readonly<{
  canonicalWarmStartCaseId:
    typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID;
  canonicalWarmStartReconstructedFromAuthenticatedInverse: true;
  canonicalWarmStartSlsMode: "on" | "off";
  canonicalWarmStartWallMaterialBindingSha256: string;
  canonicalWarmStartRegistryContentSha256: string;
  overlayContentSha256: string;
  destinationRegistryContentSha256: string;
  sourceRole:
    typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.sourceRole;
  sourceClosedLoopHemodynamicParametersRetained: false;
  sourceWallMaterialBindingRetained: true;
  sourceChamberGeometryRetained: true;
  totalBloodVolumeResidualOwner: "SV";
  totalBloodVolumeResidualRole:
    typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.totalBloodVolumeResidualRole;
  failedPressureOrVolumeGateAction:
    typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.failedPressureOrVolumeGateAction;
  physiologicalDistributionEstablishedBySvResidual: false;
  vascularInitialPressurePreservedByDerivedUnstressedVolume: true;
}>;

export type PhaseB1PhysiologyEnvelopeCaseV1 = Readonly<{
  caseId: typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_V1_ID;
  slsMode: "on" | "off";
  warmStartSourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  overlay: PhaseB1PhysiologyEnvelopeOverlayV1;
  overlayContentSha256: string;
  initialEndpoint: PhaseB1EndpointStateV1;
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  initialEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  vascularComplianceParametersByCompartment: Readonly<
    Record<VascularCompartmentId, LinearVascularComplianceParametersV1>
  >;
  totalBloodVolumeAudit: PhaseB1PhysiologyEnvelopeTotalBloodVolumeAuditV1;
  registryAudit: PhaseB1PhysiologyEnvelopeRegistryAuditV1;
  initialStationarityAudit: PhaseB1PhysiologyEnvelopeInitialStationarityAuditV1;
  provenance: PhaseB1PhysiologyEnvelopeCaseProvenanceV1;
  physiologyEnvelopeCasePass: true;
  warmStartOnly: true;
  initialStationarityPass: true;
  normalOperatingPointAcceptancePass: false;
  fullBeatAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

export function buildPhaseB1PhysiologyEnvelopeCaseV1(input: Readonly<{
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  overlay: PhaseB1PhysiologyEnvelopeOverlayV1;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1PhysiologyEnvelopeCaseV1 {
  assertExactPlainRecordV1(
    input,
    ["sourceCase", "overlay", "sha256Hex"],
    "Phase B1 physiology-envelope case input",
  );
  if (typeof input.sha256Hex !== "function") {
    throw new Error("Phase B1 physiology-envelope case requires a SHA-256 provider");
  }
  const warmStartSourceCase = authenticateCanonicalWarmStartCase(
    input.sourceCase,
    input.sha256Hex,
  );
  const overlay = validateAndFreezeOverlay(input.overlay);
  const overlayContentSha256 = computeCanonicalSha256(overlay, input.sha256Hex);
  const sourceEndpoint = warmStartSourceCase.referenceEndpoint;
  const sourceBloodVolumesM3 = sourceEndpoint.differentialState.bloodVolumesM3;
  const sourceTotalBloodVolumeM3 = sumRecord(
    BLOOD_COMPARTMENT_IDS,
    sourceBloodVolumesM3,
  );
  const retainedNonSvSubtotalM3 = sumRecord(
    NON_SV_BLOOD_COMPARTMENT_IDS,
    sourceBloodVolumesM3,
  );
  const assignedSvResidualVolumeM3 = requirePositiveFinite(
    overlay.totalBloodVolumeM3 - retainedNonSvSubtotalM3,
    "overlay total blood-volume residual assigned to SV",
  );
  const destinationBloodVolumesM3 = Object.freeze({
    ...sourceBloodVolumesM3,
    SV: assignedSvResidualVolumeM3,
  });
  const destinationTotalBloodVolumeM3 = sumRecord(
    BLOOD_COMPARTMENT_IDS,
    destinationBloodVolumesM3,
  );
  const totalBloodVolumeDifferenceM3 =
    destinationTotalBloodVolumeM3 - overlay.totalBloodVolumeM3;
  const totalBloodVolumeRelativeDifference = Math.abs(totalBloodVolumeDifferenceM3)
    / overlay.totalBloodVolumeM3;
  const nonSvBloodVolumesRetainedExact = NON_SV_BLOOD_COMPARTMENT_IDS.every(
    (id) => Object.is(destinationBloodVolumesM3[id], sourceBloodVolumesM3[id]),
  );
  const totalBloodVolumeAudit: PhaseB1PhysiologyEnvelopeTotalBloodVolumeAuditV1 =
    Object.freeze({
      targetTotalBloodVolumeM3: overlay.totalBloodVolumeM3,
      sourceTotalBloodVolumeM3,
      retainedNonSvSubtotalM3,
      assignedSvResidualVolumeM3,
      destinationTotalBloodVolumeM3,
      totalBloodVolumeDifferenceM3,
      totalBloodVolumeRelativeDifference,
      nonSvBloodVolumesRetainedExact,
      residualAssignedOnlyToSv: true as const,
      residualAllocationRole:
        PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.totalBloodVolumeResidualRole,
      physiologicalBloodVolumeDistributionClaimed: false as const,
      bloodVolumeProjectionApplied: false as const,
      pass: nonSvBloodVolumesRetainedExact
        && totalBloodVolumeRelativeDifference
          <= PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
            .totalBloodVolumeRelativeTolerance,
    });
  if (!totalBloodVolumeAudit.pass) {
    throw new Error("physiology-envelope total blood-volume allocation audit failed");
  }

  const initialEndpoint = createEnvelopeInitialEndpoint(
    sourceEndpoint,
    destinationBloodVolumesM3,
  );
  const vascularComplianceParametersByCompartment =
    derivePressurePreservingVascularParameters(
      warmStartSourceCase,
      initialEndpoint,
      overlay,
    );
  const wallMaterialBinding = warmStartSourceCase.wallMaterialBinding;

  let registryCompilationCount = 0;
  registryCompilationCount += 1;
  const destinationRegistry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    buildFourChamberNewtonScaleRegistryV1(
      {
        referenceBloodVolumesM3: initialEndpoint.differentialState.bloodVolumesM3,
        landDistortionCoefficientsByWall: wallRecord((wallId) => {
          const material = wallMaterialBinding.runtimeByWall[wallId];
          return Object.freeze({
            Aw: material.landEquationParameters.derived.Aw,
            As: material.landEquationParameters.derived.As,
          });
        }),
        tissueStressInputsByWall: wallRecord((wallId) => {
          const material = wallMaterialBinding.runtimeByWall[wallId];
          return Object.freeze({
            landReferenceTensionPa: material.landEquationParameters.values.Tref,
            passiveTensileStressScalePa:
              material.passiveSls.compiledPassive.prior.APa,
            compressionStressScalePa:
              material.passiveSls.compiledPassive.prior.KCompEffPa,
          });
        }),
        triSegInputsByWall: triSegRecord((wallId) => Object.freeze({
          wallReferenceMaterialVolumeM3:
            warmStartSourceCase.model.closedLoopParameters.triSegWalls[wallId]
              .wallMaterialVolumeM3,
          midwallReferenceAreaM2:
            warmStartSourceCase.model.closedLoopParameters.triSegWalls[wallId]
              .referenceMidwallAreaM2,
        })),
        referenceCenteredGeometryOffsets: Object.freeze({
          septalMidwallVolumeM3: initialEndpoint.triSegCoordinates.V_m_S,
          junctionRadiusM: initialEndpoint.triSegCoordinates.y_m,
          evidenceId:
            PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
              .newtonRegistryReferenceCenteredGeometryEvidenceId,
        }),
      },
      input.sha256Hex,
    ),
  );
  if (registryCompilationCount !== 1) {
    throw new Error("physiology-envelope Newton registry must be compiled exactly once");
  }
  const registryAudit: PhaseB1PhysiologyEnvelopeRegistryAuditV1 = Object.freeze({
    stageBoundary:
      PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.newtonRegistryStageBoundary,
    sourceRegistryContentSha256:
      warmStartSourceCase.destinationRegistry.registryContentSha256,
    destinationRegistryContentSha256: destinationRegistry.registryContentSha256,
    registryContentHashChanged:
      destinationRegistry.registryContentSha256
        !== warmStartSourceCase.destinationRegistry.registryContentSha256,
    registryCompilationCount: 1 as const,
    referenceBloodVolumesTakenFromEnvelopeInitialEndpointExact: true as const,
    referenceCenteredOffsetsTakenFromEnvelopeInitialEndpointExact: true as const,
    geometryAndMaterialScaleInputsTakenFromCanonicalWarmStart: true as const,
    adaptiveRescalingApplied: false as const,
    destinationRegistryCanonicalAssertionPass: true as const,
    pass: destinationRegistry.fixedBeforeRun
      && destinationRegistry.adaptiveRescaling === false,
  });

  const sourceClosedLoop = warmStartSourceCase.model.closedLoopParameters;
  const model: PhaseB1EventFreeMonolithicModelV1 = Object.freeze({
    modelId: PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
    closedLoopParameters: Object.freeze({
      atrialGeometryPriorByChamber: sourceClosedLoop.atrialGeometryPriorByChamber,
      triSegWalls: sourceClosedLoop.triSegWalls,
      vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow:
        overlay.peripheralResistancePaSecPerM3ByFlow,
      valveLossParametersByFlow: overlay.valveLossParametersByFlow,
      inletLossParametersByFlow: overlay.inletLossParametersByFlow,
      pericardiumParameters: sourceClosedLoop.pericardiumParameters,
      intrathoracicPressurePa: sourceClosedLoop.intrathoracicPressurePa,
    }),
    newtonScaleRegistry: destinationRegistry,
    candidatePriorOnly: true,
    physiologicalValidation: false,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    wallMaterialBinding,
    initialEndpoint,
  );
  const initialStationarityAudit = buildInitialStationarityAudit(
    warmStartSourceCase,
    model,
    initialEndpoint,
    initialEvaluation,
  );
  if (!initialStationarityAudit.initialStationarityPass) {
    throw new Error("physiology-envelope pressure-preserving initial stationarity audit failed");
  }
  if (!registryAudit.pass) {
    throw new Error("physiology-envelope destination Newton registry audit failed");
  }

  const provenance: PhaseB1PhysiologyEnvelopeCaseProvenanceV1 = Object.freeze({
    canonicalWarmStartCaseId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
    canonicalWarmStartReconstructedFromAuthenticatedInverse: true as const,
    canonicalWarmStartSlsMode: warmStartSourceCase.slsMode,
    canonicalWarmStartWallMaterialBindingSha256: wallMaterialBinding.contentSha256,
    canonicalWarmStartRegistryContentSha256:
      warmStartSourceCase.destinationRegistry.registryContentSha256,
    overlayContentSha256,
    destinationRegistryContentSha256: destinationRegistry.registryContentSha256,
    sourceRole: PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.sourceRole,
    sourceClosedLoopHemodynamicParametersRetained: false as const,
    sourceWallMaterialBindingRetained: true as const,
    sourceChamberGeometryRetained: true as const,
    totalBloodVolumeResidualOwner: "SV" as const,
    totalBloodVolumeResidualRole:
      PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.totalBloodVolumeResidualRole,
    failedPressureOrVolumeGateAction:
      PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1.failedPressureOrVolumeGateAction,
    physiologicalDistributionEstablishedBySvResidual: false as const,
    vascularInitialPressurePreservedByDerivedUnstressedVolume: true as const,
  });

  return Object.freeze({
    caseId: PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_V1_ID,
    slsMode: warmStartSourceCase.slsMode,
    warmStartSourceCase,
    overlay,
    overlayContentSha256,
    initialEndpoint,
    model,
    wallMaterialBinding,
    initialEvaluation,
    vascularComplianceParametersByCompartment,
    totalBloodVolumeAudit,
    registryAudit,
    initialStationarityAudit,
    provenance,
    physiologyEnvelopeCasePass: true as const,
    warmStartOnly: true as const,
    initialStationarityPass: true as const,
    normalOperatingPointAcceptancePass: false as const,
    fullBeatAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  });
}

function authenticateCanonicalWarmStartCase(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceEventFreeCaseV1 {
  if (
    sourceCase.caseId !== PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID
    || sourceCase.projectSyntheticQuiescentReferenceEventFreeCasePass !== true
    || sourceCase.staticAudit.pass !== true
    || sourceCase.registryAudit.pass !== true
    || sourceCase.testOnly !== true
    || sourceCase.releaseRuntimeReachable !== false
  ) {
    throw new Error("physiology-envelope warm start requires a canonical quiescent source case");
  }
  const canonical = buildPhaseB1QuiescentReferenceEventFreeCaseV1(
    sourceCase.inverse,
    sha256Hex,
  );
  if (
    canonical.slsMode !== sourceCase.slsMode
    || !Object.is(canonical.referenceEndpoint, sourceCase.referenceEndpoint)
    || canonical.wallMaterialBinding.contentSha256
      !== sourceCase.wallMaterialBinding.contentSha256
    || canonical.destinationRegistry.registryContentSha256
      !== sourceCase.destinationRegistry.registryContentSha256
  ) {
    throw new Error("physiology-envelope warm-start wrapper differs from canonical reconstruction");
  }
  return canonical;
}

function validateAndFreezeOverlay(
  value: PhaseB1PhysiologyEnvelopeOverlayV1,
): PhaseB1PhysiologyEnvelopeOverlayV1 {
  assertExactPlainRecordV1(value, [
    "totalBloodVolumeM3",
    "vascularComplianceM3PerPaByCompartment",
    "peripheralResistancePaSecPerM3ByFlow",
    "valveLossParametersByFlow",
    "inletLossParametersByFlow",
  ], "Phase B1 physiology-envelope overlay");
  const totalBloodVolumeM3 = requirePositiveFinite(
    value.totalBloodVolumeM3,
    "overlay.totalBloodVolumeM3",
  );
  assertExactPlainRecordV1(
    value.vascularComplianceM3PerPaByCompartment,
    VASCULAR_COMPARTMENT_IDS,
    "overlay.vascularComplianceM3PerPaByCompartment",
  );
  const vascularComplianceM3PerPaByCompartment = vascularRecord((id) =>
    requirePositiveFinite(
      value.vascularComplianceM3PerPaByCompartment[id],
      `overlay.vascularComplianceM3PerPaByCompartment.${id}`,
    ));
  assertExactPlainRecordV1(
    value.peripheralResistancePaSecPerM3ByFlow,
    ALGEBRAIC_FLOW_IDS,
    "overlay.peripheralResistancePaSecPerM3ByFlow",
  );
  const peripheralResistancePaSecPerM3ByFlow = algebraicRecord((id) =>
    requirePositiveFinite(
      value.peripheralResistancePaSecPerM3ByFlow[id],
      `overlay.peripheralResistancePaSecPerM3ByFlow.${id}`,
    ));
  assertExactPlainRecordV1(
    value.valveLossParametersByFlow,
    VALVE_FLOW_IDS,
    "overlay.valveLossParametersByFlow",
  );
  const valveLossParametersByFlow = valveRecord((id) => {
    const parameters = value.valveLossParametersByFlow[id];
    evaluateValveMomentumV1(parameters, 0, 0);
    return Object.freeze({ ...parameters });
  });
  assertExactPlainRecordV1(
    value.inletLossParametersByFlow,
    INLET_FLOW_IDS,
    "overlay.inletLossParametersByFlow",
  );
  const inletLossParametersByFlow = inletRecord((id) => {
    const parameters = value.inletLossParametersByFlow[id];
    evaluateSignedFlowMomentumV1(parameters, 0, 0);
    return Object.freeze({ ...parameters });
  });
  return Object.freeze({
    totalBloodVolumeM3,
    vascularComplianceM3PerPaByCompartment,
    peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow,
    inletLossParametersByFlow,
  });
}

function createEnvelopeInitialEndpoint(
  source: PhaseB1EndpointStateV1,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): PhaseB1EndpointStateV1 {
  const state = source.differentialState;
  const differentialState = state.slsMode === "on"
    ? Object.freeze({
      slsMode: "on" as const,
      bloodVolumesM3,
      inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
      calciumByWall: state.calciumByWall,
      landByWall: state.landByWall,
      slsAlphaVByWall: state.slsAlphaVByWall,
    })
    : Object.freeze({
      slsMode: "off" as const,
      bloodVolumesM3,
      inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
      calciumByWall: state.calciumByWall,
      landByWall: state.landByWall,
    });
  return createPhaseB1EndpointStateV1({
    timeSec: source.timeSec,
    differentialState,
    triSegCoordinates: source.triSegCoordinates,
  });
}

function derivePressurePreservingVascularParameters(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  initialEndpoint: PhaseB1EndpointStateV1,
  overlay: PhaseB1PhysiologyEnvelopeOverlayV1,
): Readonly<Record<VascularCompartmentId, LinearVascularComplianceParametersV1>> {
  return vascularRecord((id) => {
    const complianceM3PerPa =
      overlay.vascularComplianceM3PerPaByCompartment[id];
    const sourceParameters =
      sourceCase.model.closedLoopParameters
        .vascularComplianceParametersByCompartment[id];
    const sourceAbsolutePressurePa =
      sourceCase.destinationEvaluation.closedLoop.vascular[id].absolutePressurePa;
    const volumeM3 = initialEndpoint.differentialState.bloodVolumesM3[id];
    const unstressedVolumeM3 = requireNonNegativeFinite(
      volumeM3 - complianceM3PerPa
        * (sourceAbsolutePressurePa - sourceParameters.externalPressurePa),
      `derived vascular unstressed volume ${id}`,
    );
    return Object.freeze({
      unstressedVolumeM3,
      complianceM3PerPa,
      externalPressurePa: sourceParameters.externalPressurePa,
    });
  });
}

function buildInitialStationarityAudit(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  model: PhaseB1EventFreeMonolithicModelV1,
  initialEndpoint: PhaseB1EndpointStateV1,
  initialEvaluation: PhaseB1EventFreeEndpointEvaluationV1,
): PhaseB1PhysiologyEnvelopeInitialStationarityAuditV1 {
  const sourceEndpoint = sourceCase.referenceEndpoint;
  const sourceEvaluation = sourceCase.destinationEvaluation;
  const sourceMaterialStateRetainedExact = canonicalizeJson(
    materialStatePayload(initialEndpoint),
  ) === canonicalizeJson(materialStatePayload(sourceEndpoint));
  const sourceInertialFlowsRetainedExact = INERTIAL_FLOW_IDS.every((id) =>
    Object.is(
      initialEndpoint.differentialState.inertialFlowsM3PerSec[id],
      sourceEndpoint.differentialState.inertialFlowsM3PerSec[id],
    ));
  const sourceTriSegCoordinatesRetainedExact = Object.is(
    initialEndpoint.triSegCoordinates.V_m_S,
    sourceEndpoint.triSegCoordinates.V_m_S,
  ) && Object.is(
    initialEndpoint.triSegCoordinates.y_m,
    sourceEndpoint.triSegCoordinates.y_m,
  );
  const sourceGeometryAndExternalPressureObjectsRetained =
    Object.is(
      model.closedLoopParameters.atrialGeometryPriorByChamber,
      sourceCase.model.closedLoopParameters.atrialGeometryPriorByChamber,
    )
    && Object.is(
      model.closedLoopParameters.triSegWalls,
      sourceCase.model.closedLoopParameters.triSegWalls,
    )
    && Object.is(
      model.closedLoopParameters.pericardiumParameters,
      sourceCase.model.closedLoopParameters.pericardiumParameters,
    )
    && Object.is(
      model.closedLoopParameters.intrathoracicPressurePa,
      sourceCase.model.closedLoopParameters.intrathoracicPressurePa,
    )
    && VASCULAR_COMPARTMENT_IDS.every((id) => Object.is(
      model.closedLoopParameters.vascularComplianceParametersByCompartment[id]
        .externalPressurePa,
      sourceCase.model.closedLoopParameters
        .vascularComplianceParametersByCompartment[id].externalPressurePa,
    ));
  const sourceWallStressReplayExact = WALL_IDS.every((wallId) => Object.is(
    initialEvaluation.wallMaterialByWall[wallId].totalWallKirchhoffStressPa,
    sourceEvaluation.wallMaterialByWall[wallId].totalWallKirchhoffStressPa,
  ));
  const sourceChamberPressureReplayExact = (["LA", "LV", "RA", "RV"] as const)
    .every((id) => Object.is(
      initialEvaluation.closedLoop.chamberAbsolutePressurePa[id],
      sourceEvaluation.closedLoop.chamberAbsolutePressurePa[id],
    ));
  const maximumAbsoluteInitialPressureReplayDifferencePa = maximumAbsolute(
    BLOOD_COMPARTMENT_IDS.map((id) =>
      initialEvaluation.closedLoop.compartmentAbsolutePressurePa[id]
        - sourceEvaluation.closedLoop.compartmentAbsolutePressurePa[id]),
  );
  const maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2 = maximumAbsolute(
    INERTIAL_FLOW_IDS.map((id) =>
      initialEvaluation.closedLoop.inertialMomentum[id].flowAccelerationM3PerSec2),
  );
  const volumeRates = evaluateFourChamberVolumeRatesV1(
    initialEvaluation.closedLoop.allFlowsM3PerSec,
  );
  const maximumAbsoluteInitialVolumeRateM3PerSec = maximumAbsolute(
    Object.values(volumeRates.volumeRatesM3PerSec),
  );
  const sourceTriSegResidual = sourceEvaluation.closedLoop.triSegOracle.equilibriumResidual;
  const initialTriSegResidual = initialEvaluation.closedLoop.triSegOracle.equilibriumResidual;
  const maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM =
    maximumAbsolute([
      initialTriSegResidual.axialNPerM - sourceTriSegResidual.axialNPerM,
      initialTriSegResidual.radialNPerM - sourceTriSegResidual.radialNPerM,
    ]);
  const vascularPressureReplayPass =
    maximumAbsoluteInitialPressureReplayDifferencePa
      <= PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
        .maximumAbsoluteInitialPressureReplayDifferencePa;
  const inertialMomentumStationarityPass =
    maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2
      <= PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
        .maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2;
  const volumeRateStationarityPass = maximumAbsoluteInitialVolumeRateM3PerSec
    <= PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
      .maximumAbsoluteInitialVolumeRateM3PerSec;
  const triSegEquilibriumReplayPass =
    maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM
      <= PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1
        .maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM;
  const initialStationarityPass = sourceMaterialStateRetainedExact
    && sourceInertialFlowsRetainedExact
    && sourceTriSegCoordinatesRetainedExact
    && sourceGeometryAndExternalPressureObjectsRetained
    && sourceWallStressReplayExact
    && sourceChamberPressureReplayExact
    && vascularPressureReplayPass
    && inertialMomentumStationarityPass
    && volumeRateStationarityPass
    && triSegEquilibriumReplayPass
    && initialEvaluation.projectionApplied === false
    && initialEvaluation.closedLoop.flowClampApplied === false;
  return Object.freeze({
    canonicalWarmStartStaticAuditPass: true as const,
    sourceMaterialStateRetainedExact,
    sourceInertialFlowsRetainedExact,
    sourceTriSegCoordinatesRetainedExact,
    sourceGeometryAndExternalPressureObjectsRetained,
    sourceWallStressReplayExact,
    sourceChamberPressureReplayExact,
    maximumAbsoluteInitialPressureReplayDifferencePa,
    maximumAbsoluteInitialInertialFlowAccelerationM3PerSec2,
    maximumAbsoluteInitialVolumeRateM3PerSec,
    maximumAbsoluteTriSegEquilibriumResidualReplayDifferenceNPerM,
    initialTotalVolumeRateM3PerSec: volumeRates.totalVolumeRateM3PerSec,
    vascularPressureReplayPass,
    inertialMomentumStationarityPass,
    volumeRateStationarityPass,
    triSegEquilibriumReplayPass,
    projectionApplied: false as const,
    flowClampApplied: false as const,
    initialStationarityPass,
  });
}

function materialStatePayload(endpoint: PhaseB1EndpointStateV1): object {
  const state = endpoint.differentialState;
  return state.slsMode === "on"
    ? {
      slsMode: state.slsMode,
      calciumByWall: state.calciumByWall,
      landByWall: state.landByWall,
      slsAlphaVByWall: state.slsAlphaVByWall,
    }
    : {
      slsMode: state.slsMode,
      calciumByWall: state.calciumByWall,
      landByWall: state.landByWall,
    };
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((id) => [id, build(id)]))) as
    Readonly<Record<FourChamberWallId, Value>>;
}

function triSegRecord<Value>(
  build: (wallId: TriSegWallId) => Value,
): Readonly<Record<TriSegWallId, Value>> {
  return Object.freeze(Object.fromEntries(TRISEG_WALL_IDS.map((id) => [id, build(id)]))) as
    Readonly<Record<TriSegWallId, Value>>;
}

function vascularRecord<Value>(
  build: (id: VascularCompartmentId) => Value,
): Readonly<Record<VascularCompartmentId, Value>> {
  return Object.freeze(Object.fromEntries(VASCULAR_COMPARTMENT_IDS.map((id) =>
    [id, build(id)]))) as Readonly<Record<VascularCompartmentId, Value>>;
}

function algebraicRecord<Value>(
  build: (id: AlgebraicFlowId) => Value,
): Readonly<Record<AlgebraicFlowId, Value>> {
  return Object.freeze(Object.fromEntries(ALGEBRAIC_FLOW_IDS.map((id) =>
    [id, build(id)]))) as Readonly<Record<AlgebraicFlowId, Value>>;
}

function valveRecord<Value>(
  build: (id: ValveFlowId) => Value,
): Readonly<Record<ValveFlowId, Value>> {
  return Object.freeze(Object.fromEntries(VALVE_FLOW_IDS.map((id) =>
    [id, build(id)]))) as Readonly<Record<ValveFlowId, Value>>;
}

function inletRecord<Value>(
  build: (id: InletFlowId) => Value,
): Readonly<Record<InletFlowId, Value>> {
  return Object.freeze(Object.fromEntries(INLET_FLOW_IDS.map((id) =>
    [id, build(id)]))) as Readonly<Record<InletFlowId, Value>>;
}

function sumRecord<Id extends string>(
  ids: readonly Id[],
  record: Readonly<Record<Id, number>>,
): number {
  return ids.reduce((sum, id) => sum + record[id], 0);
}

function maximumAbsolute(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be non-negative`);
  return result;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result <= 0) throw new Error(`${field} must be positive`);
  return result;
}
