import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  runPhaseB1QuiescentPressureReferenceInverseV1,
  type PhaseB1QuiescentPressureReferenceInverseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  buildPhaseB1QuiescentReferenceEventFreeCaseV1,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
  runPhaseB1QuiescentReferenceEventFreeIdentityHoldV1,
  type PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeIdentityHoldV1";
import {
  runPhaseB1ProjectSyntheticColdInitializationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  TRISEG_WALL_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const B0_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

type Candidate = Readonly<{
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1;
  eventFreeCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  hold: PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1;
}>;

const candidates = {} as Record<"on" | "off", Candidate>;

describe("Phase B1 quiescent reference event-free identity hold", () => {
  beforeAll(() => {
    for (const slsMode of ["on", "off"] as const) {
      const bridge = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
        runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256),
        B0_NUMERICAL_EVIDENCE_SHA256,
        sha256,
      );
      const cold = runPhaseB1ProjectSyntheticColdInitializationV1(
        slsMode,
        sha256,
      );
      const stitch =
        stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
          bridge,
          cold,
        );
      const graph = runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
        stitch,
        sha256,
      );
      const inverse = runPhaseB1QuiescentPressureReferenceInverseV1(
        graph,
        sha256,
      );
      const eventFreeCase = buildPhaseB1QuiescentReferenceEventFreeCaseV1(
        inverse,
        sha256,
      );
      candidates[slsMode] = Object.freeze({
        inverse,
        eventFreeCase,
        hold: runPhaseB1QuiescentReferenceEventFreeIdentityHoldV1(
          eventFreeCase,
        ),
      });
    }
  }, 1_800_000);

  it.each(["on", "off"] as const)(
    "compiles one canonical destination registry only after the accepted SLS-%s inverse",
    (slsMode) => {
      const { inverse, eventFreeCase } = candidates[slsMode];
      const endpoint = inverse.endpoint;
      if (endpoint === null) throw new Error("inverse endpoint is required");

      expect(inverse.projectSyntheticQuiescentReferenceInversePass).toBe(true);
      expect(eventFreeCase.projectSyntheticQuiescentReferenceEventFreeCasePass)
        .toBe(true);
      expect(eventFreeCase.acceptedInverseEndpoint).toBe(endpoint);
      expect(eventFreeCase.referenceEndpoint).toBe(endpoint.evaluation.endpoint);
      expect(eventFreeCase.slsMode).toBe(slsMode);
      expect(eventFreeCase.staticAudit.pass).toBe(true);
      expect(eventFreeCase.staticAudit).toMatchObject({
        inverseAccepted: true,
        inverseEndpointRhoExactOne: true,
        inverseEndpointObjectRetained: true,
        scaffoldConfigurationSha256Matches: true,
        phaseA1TissueManifestBundleSha256Matches: true,
        phaseB1WallMaterialBindingSha256Matches: true,
        anchorRegistrySha256Matches: true,
        atrialReferenceConfigurationAppliedExact: true,
        freewallReferenceConfigurationAppliedExact: true,
        septalReferenceAreaFixedAnchorExact: true,
        wallReferenceMaterialVolumesFixedExact: true,
        fixedBloodVolumesExact: true,
        fixedInertialFlowsExact: true,
        fixedCalciumExactZero: true,
        endpointTimeExactZero: true,
        unchangedClosedLoopParameterObjectsRetained: true,
        allClosedLoopFlowsExactlyZero: true,
        destinationEvaluationReplaysInverseChamberPressuresExact: true,
        destinationEvaluationReplaysInverseFlowsExact: true,
      });

      const registryAudit = eventFreeCase.registryAudit;
      expect(registryAudit.pass).toBe(true);
      expect(registryAudit).toMatchObject({
        stageBoundary:
          "compile-once-after-accepted-inverse-before-any-backward-euler-step",
        registryContentHashChanged: true,
        registryCompilationCount: 1,
        registryCompiledAfterAcceptedDestination: true,
        referenceBloodVolumesTakenFromAcceptedEndpointExact: true,
        triSegReferenceAreasTakenFromAcceptedConfigurationExact: true,
        referenceCenteredOffsetsTakenFromAcceptedEndpointExact: true,
        materialScaleInputsTakenFromCanonicalRuntimeBinding: true,
        anchorRegistryValuesReverseEngineered: false,
        adaptiveRescalingApplied: false,
        destinationRegistryCanonicalAssertionPass: true,
      });
      expect(registryAudit.inverseAnchorRegistryContentSha256)
        .toBe(inverse.anchorProvenance.anchorNewtonScaleRegistryContentSha256);
      expect(registryAudit.destinationRegistryContentSha256)
        .toBe(eventFreeCase.destinationRegistry.registryContentSha256);
      expect(registryAudit.destinationRegistryContentSha256)
        .not.toBe(registryAudit.inverseAnchorRegistryContentSha256);
      expect(eventFreeCase.destinationRegistry).toBe(
        eventFreeCase.model.newtonScaleRegistry,
      );
      expect(eventFreeCase.destinationRegistry.fixedBeforeRun).toBe(true);
      expect(eventFreeCase.destinationRegistry.adaptiveRescaling).toBe(false);
      expect(eventFreeCase.destinationRegistry.unknownOffsets).toMatchObject({
        septalMidwallVolumeM3:
          eventFreeCase.referenceEndpoint.triSegCoordinates.V_m_S,
        junctionRadiusM:
          eventFreeCase.referenceEndpoint.triSegCoordinates.y_m,
        evidenceId:
          "phase-b1-quiescent-pressure-reference-destination-centered-v1",
      });

      const configuration = endpoint.referenceConfiguration;
      expect(eventFreeCase.model.closedLoopParameters
        .atrialGeometryPriorByChamber.LA.referenceCavityVolumeM3)
        .toBe(configuration.atrialReferenceCavityVolumeM3ByChamber.LA);
      expect(eventFreeCase.model.closedLoopParameters
        .atrialGeometryPriorByChamber.RA.referenceCavityVolumeM3)
        .toBe(configuration.atrialReferenceCavityVolumeM3ByChamber.RA);
      for (const wallId of TRISEG_WALL_IDS) {
        expect(eventFreeCase.model.closedLoopParameters.triSegWalls[wallId]
          .referenceMidwallAreaM2)
          .toBe(configuration.triSegReferenceMidwallAreaM2ByWall[wallId]);
      }
      expect(Object.isFrozen(eventFreeCase)).toBe(true);
      expect(Object.isFrozen(eventFreeCase.registryAudit)).toBe(true);
      expect(Object.isFrozen(eventFreeCase.staticAudit)).toBe(true);
      expect(Object.isFrozen(eventFreeCase.model)).toBe(true);
      expect(Object.isFrozen(eventFreeCase.model.closedLoopParameters)).toBe(true);
    },
  );

  it.each(["on", "off"] as const)(
    "holds the complete non-time SLS-%s state exactly on the independent 0.125/0.25/0.5 ms grid",
    (slsMode) => {
      const { eventFreeCase, hold } = candidates[slsMode];
      expect(hold.dtGridSec).toBe(
        PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
      );
      expect(hold.dtGridSec).toEqual([0.125e-3, 0.25e-3, 0.5e-3]);
      expect(hold.slsMode).toBe(slsMode);
      expect(hold.case).toBe(eventFreeCase);
      expect(hold.stepAudits).toHaveLength(3);
      expect(hold.everyStepStartedFromSameReferenceEndpointIndependently)
        .toBe(true);
      expect(hold.destinationRegistryObjectReusedAcrossAllSteps).toBe(true);
      expect(hold.destinationRegistryRecompiledDuringHold).toBe(false);
      expect(hold.adaptiveRescalingApplied).toBe(false);
      expect(hold.allDtGridStepsPass).toBe(true);
      expect(hold.projectSyntheticToleranceCertifiedIdentityHoldPass).toBe(true);

      for (const [index, audit] of hold.stepAudits.entries()) {
        expect(audit.dtSec).toBe(hold.dtGridSec[index]);
        expect(audit.pass).toBe(true);
        expect(audit.converged).toBe(true);
        expect(audit.previousEndpointReplaysReferenceTimeExact).toBe(true);
        expect(audit.previousEndpointNonTimeStateExact).toBe(true);
        expect(audit.nextTimeAdvanceExact).toBe(true);
        expect(audit.nextNewtonTopologyExact).toBe(true);
        expect(audit.nextCalciumStateExact).toBe(true);
        expect(audit.allCalciumScalarsExactlyZero).toBe(true);
        expect(audit.comparedNewtonScalarCount).toBe(slsMode === "on" ? 51 : 46);
        expect(audit.comparedCalciumScalarCount).toBe(10);
        expect(audit.acceptedNewtonStepCountExactZero).toBe(true);
        expect(audit.scaledResidualGatePass).toBe(true);
        expect(audit.scaledUpdateGatePass).toBe(true);
        expect(audit.allClosedLoopFlowsExactlyZero).toBe(true);
        expect(audit.maximumAbsoluteVolumeResidualM3PerSec).toBe(0);
        expect(audit.totalBloodVolumeChangeM3).toBe(0);
        expect(audit.exactVolumeIdentityPass).toBe(true);
        expect(audit.chamberPressureGatePass).toBe(true);
        expect(audit.inertialFlowAccelerationGatePass).toBe(true);
        expect(audit.destinationRegistryObjectIdentityAtInvocation).toBe(true);
        expect(audit.eventFree).toBe(true);
        expect(audit.noProjectionClippingClampOrFallback).toBe(true);
        expect(audit.slsTopologyPreserved).toBe(true);
        expect(audit.result.converged).toBe(true);
        if (audit.result.converged === false) continue;
        expect(audit.result.previousEndpoint.timeSec)
          .toBe(eventFreeCase.referenceEndpoint.timeSec);
        expect(audit.result.nextEndpointLeftLimit.timeSec)
          .toBe(eventFreeCase.referenceEndpoint.timeSec + audit.dtSec);
        for (const wallId of WALL_IDS) {
          expect(audit.result.calciumDriveStateByWallAtEndLeftLimit[wallId])
            .toEqual({ r: 0, d: 0 });
        }
      }
      expect(Object.isFrozen(hold)).toBe(true);
      expect(Object.isFrozen(hold.stepAudits)).toBe(true);
      expect(hold.stepAudits.every(Object.isFrozen)).toBe(true);
    },
  );

  it.each(["on", "off"] as const)(
    "keeps every broad acceptance and runtime claim false in SLS-%s",
    (slsMode) => {
      const { eventFreeCase, hold } = candidates[slsMode];
      expect(eventFreeCase).toMatchObject({
        closedLoopStationarityPass: false,
        physiologicalReferenceAcceptancePass: false,
        supportedReferenceEnvelopePass: false,
        fullBeatAcceptancePass: false,
        physiologicalValidationPass: false,
        phaseB1AcceptancePass: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
        testOnly: true,
      });
      expect(hold).toMatchObject({
        analyticalExactEquilibriumClaimed: false,
        closedLoopStationarityPass: false,
        physiologicalReferenceAcceptancePass: false,
        supportedReferenceEnvelopePass: false,
        fullBeatAcceptancePass: false,
        eventIntegratedAcceptancePass: false,
        physiologicalValidationPass: false,
        phaseB1AcceptancePass: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
        testOnly: true,
      });
    },
  );

  it("rejects a shallow promotion of the accepted inverse gate", () => {
    const inverse = candidates.on.inverse;
    const promoted = Object.freeze({
      ...inverse,
      projectSyntheticQuiescentReferenceInversePass: false,
    }) as PhaseB1QuiescentPressureReferenceInverseResultV1;
    expect(() => buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      promoted,
      sha256,
    )).toThrow(/live passing result/);
  });

  it("rejects a frozen top-level copy and all shallow nested substitutions before inverse inspection", () => {
    const inverse = candidates.on.inverse;
    if (inverse.endpoint === null) throw new Error("inverse endpoint is required");
    const frozenTopLevelCopy = Object.freeze({ ...inverse }) as
      PhaseB1QuiescentPressureReferenceInverseResultV1;
    expect(() => buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      frozenTopLevelCopy,
      sha256,
    )).toThrow(/live passing result/);

    const forgedEndpoint = Object.freeze({ ...inverse.endpoint });
    const endpointSubstitution = Object.freeze({
      ...inverse,
      endpoint: forgedEndpoint,
    }) as PhaseB1QuiescentPressureReferenceInverseResultV1;
    expect(() => buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      endpointSubstitution,
      sha256,
    )).toThrow(/live passing result/);

    const forgedSource = Object.freeze({ ...inverse.sourceCanonicalNode });
    const sourceSubstitution = Object.freeze({
      ...inverse,
      sourceCanonicalNode: forgedSource,
    }) as PhaseB1QuiescentPressureReferenceInverseResultV1;
    expect(() => buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      sourceSubstitution,
      sha256,
    )).toThrow(/live passing result/);

    const provenanceSubstitution = Object.freeze({
      ...inverse,
      anchorProvenance: Object.freeze({
        ...inverse.anchorProvenance,
        phaseB1WallMaterialBindingSha256: "0".repeat(64),
      }),
    }) as PhaseB1QuiescentPressureReferenceInverseResultV1;
    expect(() => buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      provenanceSubstitution,
      sha256,
    )).toThrow(/live passing result/);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
