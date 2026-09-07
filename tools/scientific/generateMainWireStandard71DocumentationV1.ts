import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { canonicalJsonStringify } from "@/engine/integrity";
import { createMainWireIntegratedModelStandard71FixtureV1,
  MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1,
  MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ControlsV1";
import { mainWireBaselineGateRoleV1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_RELAXATION_TAU_POLICY_V1 } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import binding from "@/studio/integrations/mainWireIntegratedV3/standard71-baseline-binding-evidence.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71SurfaceV1";
import { MAIN_WIRE_STANDARD71_DEFAULT_FIXTURE_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ExactModelV1";

// A compact, frozen presentation projection of already qualified evidence.
// No simulation, threshold change, new scientific vote, or registry admission.
const sha = (raw: string) => createHash("sha256").update(raw).digest("hex");
async function readPinned(source: { path: string; sha256: string }) {
  const raw = await readFile(source.path, "utf8");
  if (sha(raw) !== source.sha256) throw new Error(`Documentation source changed: ${source.path}`);
  return JSON.parse(raw);
}
const admission = await readPinned(binding.sources.admission);
const results = await Promise.all(admission.sources.map(readPinned));
if (admission.status !== "eligible-for-exact-model-promotion"
  || canonicalJsonStringify(admission.observations[0].rest) !== canonicalJsonStringify(binding.rest)) {
  throw new Error("Documentation requires the reviewed admission and cold binding of the same construction");
}
const fixture = createMainWireIntegratedModelStandard71FixtureV1();
const material = MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1;
const land = MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1;
const qualified = results[0].construction;
for (const [name, actual, expected] of [
  ["hemodynamics", fixture.hemodynamicResearchInputs, qualified.hemodynamicResearchInputs],
  ["mechanisms", fixture.mechanismResearchInputs, qualified.mechanismResearchInputs],
  ["Land values", land.values, qualified.landParameters.values],
  ["bridge exit", land.strongBridgeDeactivationExit, qualified.ventricularBridgeExit],
  ["calcium", fixture.rhythm.configuration.calciumParametersByWall, qualified.calciumEventParametersByWall],
  ["vascular runtime", fixture.runtime, qualified.runtime],
  ["slack stretch", material.landSlackStretch, qualified.ventricularLandSlackStretch],
] as const) {
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw new Error(`Cannot document changed ${name} with the old baseline evidence`);
  }
}
const snapshot = {
  schemaId: "main-wire-model-documentation-snapshot-v1", modelId: binding.modelId,
  surfaceReleaseId: surface.surfaceReleaseId, surfaceSeriesId: surface.surfaceSeriesId,
  baselineId: "standard71-reference-baseline-4935-hr70-v1",
  releaseStatus: "local-candidate-not-registered", clinicalNormalityClaimed: false,
  fixtureIdentity: MAIN_WIRE_STANDARD71_DEFAULT_FIXTURE_V1,
  settings: MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1,
  material: { parameterSetId: material.parameterSetId, landSlackStretch: material.landSlackStretch,
    values: land.values, sourceParameters: land.sourceParameters, doi: land.doi,
    strongBridgeDeactivation: land.strongBridgeDeactivationExit },
  calcium: fixture.rhythm.configuration.calciumParametersByWall,
  assembly: fixture.standard71AssemblyClaim,
  qualification: { cycles: binding.cycles, classification: binding.classification,
    checkpoint: binding.checkpoint, launchPreparation: binding.launchPreparation,
    parity: binding.parity, inheritedQualification: binding.inheritedQualification },
  admission: { policy: admission.policy, constructionSha256: admission.constructionSha256,
    status: admission.status, sources: admission.sources, implementation: admission.implementation,
    referenceFlags: admission.referenceFlags, pressureRateQuality: admission.pressureRateQuality,
    reserve: admission.reserve, evidenceTrustBoundary: admission.evidenceTrustBoundary },
  observations: results.map((result, index) => ({
    dtSec: result.nominalDtSec,
    rest: admission.observations[index].rest,
    native: admission.observations[index].native,
    tau: admission.observations[index].tau,
    checks: result.checks.map((check: { checkId: Parameters<typeof mainWireBaselineGateRoleV1>[0] }) => ({
      ...check, historicalRole: mainWireBaselineGateRoleV1(check.checkId),
    })),
    measurements: result.measurements,
    shape: result.ejectionShape,
    reserveMeasurement: result.preloadReserve.measurement,
  })),
  // Snapshot explanations with the results: later registry edits must not
  // silently rewrite this model's historical interpretation or source ranges.
  evidence,
  morphologyPolicy: MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1.pressureMorphology,
  settlementPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  tauPolicy: MAIN_WIRE_RELAXATION_TAU_POLICY_V1,
  provenance: { generator: "tools/scientific/generateMainWireStandard71DocumentationV1.ts",
    bindingSha256: sha(await readFile("studio/integrations/mainWireIntegratedV3/standard71-baseline-binding-evidence.json", "utf8")),
    admissionSource: binding.sources.admission,
    evidenceSha256: sha(await readFile("data/physiology/main-wire-normal-reference-evidence-v1.json", "utf8")) },
};
const target = "studio/presentation/modelDocumentation/standard71-documentation-snapshot-v1.json";
await writeFile(target, JSON.stringify(snapshot, null, 2) + "\n");
console.log(JSON.stringify({ target, bytes: JSON.stringify(snapshot).length, simulated: false, admitted: false }));
