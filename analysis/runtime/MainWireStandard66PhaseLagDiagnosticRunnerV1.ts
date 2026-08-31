import {
  MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID,
  measureMainWireStandard66PhaseLagDiagnosticV1,
  type MainWireStandard66PhaseLagDiagnosticV1,
} from "@/analysis/methods/mainWire/MainWireStandard66PhaseLagDiagnosticV1";
import {
  MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
  readMainWireStandard66P1SettlingExactBoundarySuffixV1,
  runMainWireStandard66P1SettlingOnLiveSessionV1,
  type MainWireStandard66P1SettlingResultV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
  createMainWireStandard66SelectedTraceLiveSessionV1,
  readMainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTraceLiveSessionConstructionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireIntegratedModelStandard66ValidationClockArmIdV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_V1_ID =
  "main-wire-standard66-phase-lag-diagnostic-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_CLAIM_V1 =
  Object.freeze({
    purpose: "research-diagnostic-outside-formal-validation-protocol" as const,
    coldStart: true as const,
    exactModelMutation: false as const,
    settlementProtocolIdentityChanged: false as const,
    formalValidationOutcomeProduced: false as const,
    formalPeriodicClassifierEligible: false as const,
    numericalPeriodicityEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });

export type MainWireStandard66PhaseLagDiagnosticRunnerInputV1 = Readonly<{
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale?: number;
}>;

export type MainWireStandard66PhaseLagDiagnosticSettlementSummaryV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
  protocolIdentityHash: string;
  executionPurpose: "research-eager";
  status: MainWireStandard66P1SettlingResultV1["status"];
  clock: MainWireStandard66P1SettlingResultV1["clock"];
  periodicBoundary: MainWireStandard66P1SettlingResultV1["periodicBoundary"];
  counters: MainWireStandard66P1SettlingResultV1["counters"];
  diagnosticConsecutivePeriod1Closures: number;
  numericalPeriod1Established: false;
  terminalAcceptedTimeSec: number;
  terminalAcceptedRevision: number;
  failure: MainWireStandard66P1SettlingResultV1["failure"];
}>;

export type MainWireStandard66PhaseLagDiagnosticRunV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_V1_ID;
  runIdentity: Readonly<{
    runnerId: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_V1_ID;
    methodId: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID;
    liveSessionRouteIdentity: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
    clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    exactConstruction: MainWireStandard66SelectedTraceLiveSessionConstructionV1;
  }>;
  runIdentityHash: string;
  status:
    | "diagnostic-complete"
    | "settling-not-qualified"
    | "settling-failed"
    | "analysis-failed";
  settlement: MainWireStandard66PhaseLagDiagnosticSettlementSummaryV1;
  diagnostic: MainWireStandard66PhaseLagDiagnosticV1 | null;
  formalProtocolEligibility: false;
  numericalPeriodicityEstablished: false;
  failure: Readonly<{
    stage: "settling" | "qualification" | "analysis";
    message: string;
  }> | null;
  claim: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_CLAIM_V1;
}>;

export async function runMainWireStandard66PhaseLagDiagnosticV1(
  input: MainWireStandard66PhaseLagDiagnosticRunnerInputV1,
): Promise<MainWireStandard66PhaseLagDiagnosticRunV1> {
  const liveSession = await createMainWireStandard66SelectedTraceLiveSessionV1({
    hemodynamicResearchInputs: input.hemodynamicResearchInputs,
    mechanismResearchInputs: input.mechanismResearchInputs,
    ventricularContractilityScale: input.ventricularContractilityScale,
  });
  const exactConstruction =
    readMainWireStandard66SelectedTraceLiveSessionConstructionV1(liveSession);
  const runIdentity = Object.freeze({
    runnerId: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_V1_ID,
    methodId: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID,
    liveSessionRouteIdentity:
      MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
    clockArmId: input.clockArmId,
    exactConstruction,
  });
  const runIdentityHash = await sha256CanonicalJsonHex(runIdentity);
  const settling = await runMainWireStandard66P1SettlingOnLiveSessionV1({
    liveSession,
    clockArmId: input.clockArmId,
    executionPurpose: "research-eager",
  });
  const settlement = compactSettlementV1(settling);
  if (settling.status === "failed") {
    return resultV1({
      runIdentity,
      runIdentityHash,
      status: "settling-failed",
      settlement,
      diagnostic: null,
      failure: Object.freeze({
        stage: "settling" as const,
        message: settling.failure?.message ?? "settling failed without detail",
      }),
    });
  }
  if (
    settling.status !== "research-period1-candidate" &&
    settling.status !== "maximum-horizon-reached"
  ) {
    return resultV1({
      runIdentity,
      runIdentityHash,
      status: "settling-not-qualified",
      settlement,
      diagnostic: null,
      failure: Object.freeze({
        stage: "qualification" as const,
        message: "research-eager settling did not reach an analyzable terminal",
      }),
    });
  }
  try {
    const exactBoundarySuffix =
      readMainWireStandard66P1SettlingExactBoundarySuffixV1({
        liveSession,
        settling,
      });
    const diagnostic = measureMainWireStandard66PhaseLagDiagnosticV1({
      settling,
      exactBoundarySuffix,
    });
    return resultV1({
      runIdentity,
      runIdentityHash,
      status: "diagnostic-complete",
      settlement,
      diagnostic,
      failure: null,
    });
  } catch (error) {
    return resultV1({
      runIdentity,
      runIdentityHash,
      status: "analysis-failed",
      settlement,
      diagnostic: null,
      failure: Object.freeze({
        stage: "analysis" as const,
        message: error instanceof Error ? error.message : String(error),
      }),
    });
  }
}

function compactSettlementV1(
  settling: MainWireStandard66P1SettlingResultV1,
): MainWireStandard66PhaseLagDiagnosticSettlementSummaryV1 {
  if (settling.executionPurpose !== "research-eager") {
    throw new Error("Standard66 phase-lag settlement purpose is invalid");
  }
  return Object.freeze({
    runnerId: settling.runnerId,
    protocolIdentityHash: settling.protocolIdentityHash,
    executionPurpose: "research-eager" as const,
    status: settling.status,
    clock: settling.clock,
    periodicBoundary: settling.periodicBoundary,
    counters: settling.counters,
    diagnosticConsecutivePeriod1Closures:
      settling.diagnosticConsecutivePeriod1Closures,
    numericalPeriod1Established: false as const,
    terminalAcceptedTimeSec: settling.terminalAcceptedTimeSec,
    terminalAcceptedRevision: settling.terminalAcceptedRevision,
    failure: settling.failure,
  });
}

function resultV1(
  input: Readonly<{
    runIdentity: MainWireStandard66PhaseLagDiagnosticRunV1["runIdentity"];
    runIdentityHash: string;
    status: MainWireStandard66PhaseLagDiagnosticRunV1["status"];
    settlement: MainWireStandard66PhaseLagDiagnosticSettlementSummaryV1;
    diagnostic: MainWireStandard66PhaseLagDiagnosticV1 | null;
    failure: MainWireStandard66PhaseLagDiagnosticRunV1["failure"];
  }>,
): MainWireStandard66PhaseLagDiagnosticRunV1 {
  return Object.freeze({
    runnerId: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_V1_ID,
    runIdentity: input.runIdentity,
    runIdentityHash: input.runIdentityHash,
    status: input.status,
    settlement: input.settlement,
    diagnostic: input.diagnostic,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    failure: input.failure,
    claim: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_RUNNER_CLAIM_V1,
  });
}
