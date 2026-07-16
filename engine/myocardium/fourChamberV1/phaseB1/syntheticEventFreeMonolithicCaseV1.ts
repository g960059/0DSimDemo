import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type {
  SymmetricClosedLoopScaffoldV1,
} from "@/engine/myocardium/fourChamberV1/testSupport/symmetricClosedLoopScaffoldV1";
import {
  PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  buildPhaseB1SyntheticGeometryWarmStartV1,
  type PhaseB1SyntheticGeometryWarmStartV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticGeometryWarmStartV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";

export const PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID =
  "four-chamber-phase-b1-synthetic-event-free-monolithic-case-v1" as const;

type PhaseB1ProjectSyntheticEventFreeMonolithicModelV1 =
  PhaseB1EventFreeMonolithicModelV1 & Readonly<{
    modelId: typeof PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID;
  }>;

export type PhaseB1SyntheticEventFreeMonolithicCaseV1 = Readonly<{
  caseId: typeof PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  scaffold: SymmetricClosedLoopScaffoldV1;
  scaffoldConfigurationSha256: string;
  model: PhaseB1ProjectSyntheticEventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  warmStart: PhaseB1SyntheticGeometryWarmStartV1;
  testOnly: true;
  physiologicalValidation: false;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export function buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1SyntheticEventFreeMonolithicCaseV1 {
  if (slsMode !== "on" && slsMode !== "off") {
    throw new Error("synthetic event-free case slsMode must be on or off");
  }
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256Hex);
  const wallMaterialBinding = buildPhaseB1WallMaterialBindingV1(
    scaffold.phaseA1TissueManifestBundle,
    sha256Hex,
  );
  const warmStart = buildPhaseB1SyntheticGeometryWarmStartV1(
    slsMode,
    sha256Hex,
  );
  const scaffoldConfigurationSha256 =
    phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex);
  if (
    warmStart.provenance.symmetricClosedLoopScaffoldConfigurationSha256
      !== scaffoldConfigurationSha256
    || warmStart.provenance.phaseB1WallMaterialBindingSha256
      !== wallMaterialBinding.contentSha256
  ) {
    throw new Error("synthetic event-free case provenance is inconsistent");
  }
  const model: PhaseB1ProjectSyntheticEventFreeMonolithicModelV1 = Object.freeze({
    modelId: PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
    closedLoopParameters: Object.freeze({
      atrialGeometryPriorByChamber: scaffold.atrialGeometryPriorByChamber,
      triSegWalls: scaffold.triSegReference.walls,
      vascularComplianceParametersByCompartment:
        scaffold.vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow:
        scaffold.peripheralResistancePaSecPerM3ByFlow,
      valveLossParametersByFlow: scaffold.valveLossParametersByFlow,
      inletLossParametersByFlow: scaffold.inletLossParametersByFlow,
      pericardiumParameters: scaffold.pericardiumParameters,
      intrathoracicPressurePa: scaffold.intrathoracicPressurePa,
    }),
    newtonScaleRegistry: scaffold.newtonScaleRegistry,
    candidatePriorOnly: true,
    physiologicalValidation: false,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
  return Object.freeze({
    caseId: PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID,
    slsMode,
    scaffold,
    scaffoldConfigurationSha256,
    model,
    wallMaterialBinding,
    warmStart,
    testOnly: true,
    physiologicalValidation: false,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
}
