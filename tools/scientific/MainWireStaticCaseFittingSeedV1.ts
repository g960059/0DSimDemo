import { CURRENT_MODEL_PRESETS_V1 } from "@/data/model-releases/CurrentModelReleaseV1";
import { resolveMainWireStaticCaseDefinitionV1 as definition,
  type MainWireStaticCaseCandidateV1, type MainWireCaseReferenceIdV1 } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template }
  from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

/** Starting inputs have one adopted source. This never reuses its checkpoint. */
export function mainWireStaticCaseFittingSeedV1(referenceId: MainWireCaseReferenceIdV1): MainWireStaticCaseCandidateV1 {
  const d = definition(referenceId), preset = CURRENT_MODEL_PRESETS_V1.find(p => p.presetId === d.adoptedPresetId);
  if (!preset) throw new Error(`Adopted case is missing: ${d.adoptedPresetId}`);
  const fixture = preset.capture.fixture as unknown as Record<string, unknown>;
  for (const key of ["rhythm", "coronary", "dynamicMechanicalSupport"] as const)
    if (canonical(fixture[key]) !== canonical(template[key])) throw new Error(`Adopted case has unsupported fixed ${key}`);
  return d.ownInputs({ anatomyId: fixture.anatomyId, ventricularContractilityScale: 1,
    hemodynamicResearchInputs: fixture.hemodynamicResearchInputs, mechanismResearchInputs: fixture.mechanismResearchInputs } as MainWireStaticCaseCandidateV1);
}
