import { canonicalJsonStringify } from "@/engine/integrity";
import { resolveMainWireStaticCaseAnatomyV1 } from "@/engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1";
import { evaluateMainWireIntegratedModelLvMvo2EstimateV1 as original,
  type MainWireIntegratedModelLvMvo2EstimateV1 as Original,
  type MainWireIntegratedModelLvMvo2EstimateInputV1 as Input } from "./MainWireMvo2ReferenceV1";

const estimateId = "main-wire-lv-pva-mvo2-exact-anatomy-literature-estimate-v2" as const;
const methodId = "suga-1986-pva-mvo2-linear-exact-anatomy-mass-v2" as const;
type Available = Extract<Original, { status: "available" }>;
function massReference(anatomy: ReturnType<typeof resolveMainWireStaticCaseAnatomyV1>) {
  return Object.freeze({ sourcePriorId: anatomy.sourcePriorId,
    sourceParameterIdentityHash: anatomy.sourcePriorParameterIdentityHash,
    anatomySchemaId: anatomy.anatomySchemaId, caseId: anatomy.caseId,
    anatomyFingerprint: anatomy.anatomyFingerprint, allocation: anatomy.lvMassAllocation,
    myocardialDensityGPerMl: anatomy.myocardialDensityKgPerM3 / 1000,
    wallMaterialVolumeMl: Object.freeze({ LVFW: anatomy.trisegWalls.LVFW.wallMaterialVolumeM3 * 1e6,
      SEP: anatomy.trisegWalls.SEP.wallMaterialVolumeM3 * 1e6 }),
    myocardialMassG: anatomy.lvMassG });
}
export type MainWireLvMvo2EstimateV2 =
  | (Omit<Available, "estimateId" | "methodId" | "massReference"> & Readonly<{
    estimateId: typeof estimateId; methodId: typeof methodId; massReference: ReturnType<typeof massReference>;
  }>)
  | Readonly<{ estimateId: typeof estimateId; methodId: typeof methodId; status: "unavailable"; ventricleId: "LV"; reason: string }>;

/** Only normalization/absolute unloaded intercept changes. The same canine
 * coefficients remain a literature illustration, not scenario-calibrated O2. */
export function evaluateMainWireLvMvo2EstimateV2(input: Input, exactAnatomy: unknown): MainWireLvMvo2EstimateV2 {
  const unavailable = (reason: string): MainWireLvMvo2EstimateV2 => Object.freeze({ estimateId, methodId,
    status: "unavailable" as const, ventricleId: "LV" as const, reason });
  let anatomy: ReturnType<typeof resolveMainWireStaticCaseAnatomyV1>;
  try {
    anatomy = resolveMainWireStaticCaseAnatomyV1((exactAnatomy as { caseId?: unknown } | null)?.caseId);
    if (canonicalJsonStringify(exactAnatomy) !== canonicalJsonStringify(anatomy)) throw new Error("Anatomy mismatch");
  } catch {
    return unavailable("MVO2 requires the complete, supported exact-case anatomy; baseline mass is not a fallback");
  }
  const base = original(input);
  if (base.status !== "available") return unavailable(base.reason);
  const mass = massReference(anatomy), per100G = 100 / mass.myocardialMassG;
  const unloadedMlO2PerBeat = base.coefficientMapping.unloadedInterceptMlO2PerBeatPer100G * mass.myocardialMassG / 100;
  const totalMlO2PerBeat = base.oxygenDemand.pvaDependentMlO2PerBeat + unloadedMlO2PerBeat;
  const totalMlO2PerBeatPer100G = totalMlO2PerBeat * per100G;
  return Object.freeze({ ...base, estimateId, methodId, massReference: mass,
    pvaSource: Object.freeze({ ...base.pvaSource, pvaEstimateMmHgMlPer100G: base.pvaSource.pvaEstimateMmHgMl * per100G }),
    oxygenDemand: Object.freeze({ ...base.oxygenDemand, unloadedMlO2PerBeat, totalMlO2PerBeat,
      totalMlO2PerBeatPer100G, totalMlO2PerMinPer100G: totalMlO2PerBeatPer100G * input.heartRateBpm }),
  });
}
