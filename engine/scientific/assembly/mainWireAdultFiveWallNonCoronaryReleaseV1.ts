import {
  buildNonCoronaryCirculationGraphV1,
  NON_CORONARY_CIRCULATION_BE_V1_ID,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1,
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_PRESET_CLAIM_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_PRESET_V1_ID,
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import {
  MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2,
  MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
} from "@/engine/scientific/observables";
import {
  cloneAndFreezeCanonicalJson,
  createSimulationReleaseV1,
  type CanonicalJsonObject,
  type SimulationReleaseManifestInputV1,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID =
  "circleheart/adult-five-wall-noncoronary" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION =
  "0.1.0" as const;

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID =
  "main-wire-normal-adult-five-wall-fixed-tbv-cold-initialization-v1" as const;

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1 =
  Object.freeze({
    protocolVersion: "1.0.0" as const,
    approvedDtSec: Object.freeze([0.002] as const),
    dtSensitivityEvidenceSec: Object.freeze([0.001] as const),
    nonApprovedDtClassification: "exploratory-parameterization" as const,
    stepCommitPolicy: "each-step-atomic-partial-progress-retained" as const,
    observationPolicy: "explicit-accepted-step-stride-plus-final" as const,
  });

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1 = Object.freeze({
  repository: "g960059/0DSimDemo" as const,
  commitSha: "f229143d5e7cb728227dd41d07d55e186c131063" as const,
  mergedPullRequests: Object.freeze([475, 476, 477, 478] as const),
  role: "promoted-main-wire-scientific-oracle-source" as const,
  immutableSourceRequired: true as const,
  futureReleasePolicy:
    "update-source-commit-whenever-equation-or-numerical-implementation-changes" as const,
});

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1 = Object.freeze({
  evidenceSetId: "circleheart-mainwire-five-wall-oracle-pack-v1" as const,
  evidenceSetVersion: "1.0.0" as const,
  artifactPath: "data/scientific/releases/0.1.0/oracle-pack-v1.json" as const,
  artifactSha256:
    "34ea2e7139f1866ab4cd636a1d48a89dc4558c115187cf4b8b2263617b9d7ebb" as const,
  source: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1,
  status: "verified-research" as const,
  clinicalValidationClaimed: false as const,
  packLevelSha256Linked: true as const,
});

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_CAPABILITIES_V1 =
  Object.freeze({
    scientificCore: "single-atomic-main-wire-transaction" as const,
    chamberMechanics: Object.freeze([
      "LA", "LVFW", "SEP", "RVFW", "RA",
    ] as const),
    ventricularGeometry: "finite-thickness-membrane-only-triseg" as const,
    atrialGeometry: "fixed-wall-self-similar-one-fiber" as const,
    activeMaterial: "full-land-with-history" as const,
    passiveMaterial: "equilibrium-passive-plus-parallel-one-state-sls" as const,
    commonPericardium: true as const,
    valveHydraulics:
      "quasi-steady-signed-orifice-with-leaflet-opening-memory" as const,
    valveBulkFlowState: false as const,
    semilunarRootInertance: true as const,
    fixedTotalBloodVolume: true as const,
    periodicSteadyProtocol: true as const,
    fixedDurationTransientProtocol: true as const,
    acceptedStepDiagnostics: true as const,
  });

export const MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_LIMITATIONS_V1 =
  Object.freeze([
    "acute valve presets are research hydraulic brackets, not clinical diagnoses",
    "no coronary circulation",
    "no device graph",
    "no multipatch regional geometry or conduction",
    "no patient-specific fitting claim",
  ] as const);

/**
 * Returns a new detached and recursively frozen manifest input on every call.
 * Existing main-wire short stable hashes may occur inside source snapshots,
 * but only the resulting canonical manifest SHA-256 is a release identity.
 */
export function mainWireAdultFiveWallNonCoronaryReleaseInputV1():
SimulationReleaseManifestInputV1 {
  const graph = buildNonCoronaryCirculationGraphV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "healthy-slack",
  );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
    runtime,
  );
  const raw = {
    id: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
    version: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
    lifecycleStatus: "candidate" as const,
    evidenceStatus: "verified-research" as const,
    evidence: {
      evidenceSetId:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.evidenceSetId,
      evidenceSetVersion:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.evidenceSetVersion,
      status: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.status,
      snapshot: {
        artifactPath:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.artifactPath,
        artifactSha256:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.artifactSha256,
        source: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.source,
        clinicalValidationClaimed:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1
            .clinicalValidationClaimed,
        packLevelSha256Linked:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1
            .packLevelSha256Linked,
      },
    },
    scientificModel: {
      modelId: "adult-five-wall-noncoronary-scientific-model",
      modelVersion: "0.1.0",
      assemblyId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
      assemblyVersion: "1.0.0",
      snapshot: {
        implementationProvenance:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1,
        capabilities:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_CAPABILITIES_V1,
        transaction: {
          id: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
          claim: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1,
        },
        mechanics: {
          providerId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
          providerMetadata: {
            contractId: provider.contractId,
            providerId: provider.providerId,
            parameterSetId: provider.parameterSetId,
            parameterIdentityHash: provider.parameterIdentityHash,
            stateSchemaVersion: provider.stateSchemaVersion,
          },
          wallIds: MAIN_WIRE_FIVE_WALL_IDS_V1,
          claim: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
          resolvedNormalAdultPrior: NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
        },
        activation: {
          driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
          fixedPrior: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        },
        circulation: {
          topologyId: graph.topologyId,
          nodes: graph.nodes,
          edges: graph.edges,
          scope: graph.scope,
        },
        valve: {
          modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
          claim: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2,
          presetId: MAIN_WIRE_FOUR_VALVE_DISEASE_PRESET_V1_ID,
          presetClaim: MAIN_WIRE_FOUR_VALVE_DISEASE_PRESET_CLAIM_V1,
          healthyPreset: MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
          researchBracketCatalog: MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1,
          researchPresetCatalog: MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1,
        },
        commonPericardium: {
          mode: "on",
          caseId: "healthy-slack",
          resolvedBinding: pericardium,
        },
        initialization: {
          bloodVolumeOperatingPoint: {
            identity: bloodVolume.identity,
            fixedTotalBloodVolumeMl: bloodVolume.fixedTotalBloodVolumeMl,
            resolvedNodeVolumesMl: bloodVolume.nodeVolumesMl,
            audit: bloodVolume.audit,
          },
        },
      },
    },
    numericalRuntime: {
      runtimeId: "main-wire-five-wall-atomic-runtime",
      runtimeVersion: "0.1.0",
      solverId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      solverVersion: "1.0.0",
      snapshot: {
        implementationProvenance:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1,
        circulationSolverId: NON_CORONARY_CIRCULATION_BE_V1_ID,
        fixedHealthyRuntime: runtime,
        mechanicsInternalSolve:
          MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM.internalSolve,
        mechanicsFiniteDifferenceJacobian:
          MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
            .finiteDifferenceJacobian,
        transactionCommit:
          MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
            .circulationAndMechanicsCommit,
        transactionFailure:
          MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1.failureSemantics,
      },
    },
    stateSchema: {
      schemaId: "main-wire-five-wall-noncoronary-accepted-state",
      schemaVersion: 1,
      snapshot: {
        transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
        circulationNodeIds: NON_CORONARY_CIRCULATION_SCOPE_V1.includedNodes,
        circulationEdgeIds: NON_CORONARY_CIRCULATION_SCOPE_V1.includedEdges,
        mechanicsWallIds: MAIN_WIRE_FIVE_WALL_IDS_V1,
        valveAcceptedMemory:
          NON_CORONARY_CIRCULATION_SCOPE_V1.valveAcceptedMemory,
        valveFlow: NON_CORONARY_CIRCULATION_SCOPE_V1.valveFlow,
      },
    },
    observableSchema: {
      schemaId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
      schemaVersion:
        MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
      snapshot: {
        registry: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
        diagnosticSampleId:
          MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID,
        claim:
          MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM,
        capabilities: {
          fourChamberPressureVolume: true,
          systemicAndPulmonaryPressureWaveforms: true,
          fourValveFlowAndOpeningFraction: true,
          continuityAndTotalBloodVolumeAudit: true,
          coronarySignals: false,
          deviceSignals: false,
        },
      },
    },
    approvedProtocols: [
      {
        protocolId:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
        protocolVersion: "1.0.0",
        snapshot: {
          role: "fixed-tbv-canonical-cold-initialization",
          exactResolvedOperatingPoint:
            bloodVolume.identity,
        },
      },
      {
        protocolId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
        protocolVersion:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1
            .protocolVersion,
        snapshot: {
          role: "fixed-duration-transient-research-protocol",
          ...MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1,
        },
      },
      {
        protocolId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
        protocolVersion: "1.0.0",
        snapshot: {
          identityId:
            MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID,
          policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
        },
      },
    ],
    claims: [
      "atomic whole-system commit and rollback",
      "non-coronary verified-research release",
    ],
    limitations: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_LIMITATIONS_V1,
  } satisfies SimulationReleaseManifestInputV1;

  const detached: unknown = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(raw);
  return detached as SimulationReleaseManifestInputV1;
}

export async function createMainWireAdultFiveWallNonCoronaryReleaseV1():
Promise<SimulationReleaseV1> {
  return createSimulationReleaseV1(
    mainWireAdultFiveWallNonCoronaryReleaseInputV1(),
  );
}
