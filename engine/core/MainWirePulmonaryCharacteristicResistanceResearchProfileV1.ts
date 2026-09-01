import { buildEdges } from "@/engine/core/topology";

export const MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1_ID =
  "main-wire-pulmonary-characteristic-resistance-research-profile-v1" as const;

export type MainWirePulmonaryCharacteristicResistanceResearchProfileV1 =
  Readonly<{
    profileId:
      typeof MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1_ID;
    sourceRootEdgeId: "PA_PArt";
    residualDownstreamEdgeId: "PArt_PCap";
    characteristicResistanceMmHgSecPerMl: 0.015;
    residualDownstreamTopologyResistanceMmHgSecPerMl: 0.026;
    referencePulmonaryResistanceScale: 0.625;
    referenceProximalSeriesResistancePreserved: true;
    parameterSearchOrFitting: false;
  }>;

const sourceRoot = buildEdges().find((edge) => edge.name === "PA_PArt");
const sourceResidual = buildEdges().find((edge) => edge.name === "PArt_PCap");
if (sourceRoot === undefined || sourceResidual === undefined) {
  throw new Error("pulmonary characteristic-resistance source edges are missing");
}
const characteristicResistanceMmHgSecPerMl = 0.015 as const;
const residualDownstreamTopologyResistanceMmHgSecPerMl = 0.026 as const;
const referencePulmonaryResistanceScale = 0.625 as const;
if (
  characteristicResistanceMmHgSecPerMl
    + residualDownstreamTopologyResistanceMmHgSecPerMl
      * referencePulmonaryResistanceScale
  !== (sourceRoot.R + sourceResidual.R)
      * referencePulmonaryResistanceScale
) {
  throw new Error(
    "pulmonary characteristic-resistance profile does not preserve reference proximal series resistance",
  );
}

/**
 * Research-only normal-pulmonary Zc allocation. The fixed 0.015
 * mmHg*s/mL proximal value corresponds to 20 dyn*s/cm^5 reported in normal
 * invasive human impedance data (Murgo & Westerhof, Circ Res 1984,
 * doi:10.1161/01.RES.54.6.666). The residual PArt_PCap resistance preserves
 * PA_PArt + PArt_PCap series R exactly at the shipped PVR scale 0.625. No
 * waveform or model-output fitting was used.
 */
export const MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1 =
  Object.freeze({
    profileId:
      MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1_ID,
    sourceRootEdgeId: "PA_PArt" as const,
    residualDownstreamEdgeId: "PArt_PCap" as const,
    characteristicResistanceMmHgSecPerMl,
    residualDownstreamTopologyResistanceMmHgSecPerMl,
    referencePulmonaryResistanceScale,
    referenceProximalSeriesResistancePreserved: true as const,
    parameterSearchOrFitting: false as const,
  }) satisfies MainWirePulmonaryCharacteristicResistanceResearchProfileV1;

export function validateMainWirePulmonaryCharacteristicResistanceResearchProfileV1(
  input: MainWirePulmonaryCharacteristicResistanceResearchProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "pulmonary characteristic-resistance research profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1;
  const actualKeys = Object.keys(input).sort();
  const expectedKeys = Object.keys(expected).sort();
  const issues: string[] = [];
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "pulmonary characteristic-resistance research profile fields are invalid",
    );
  }
  for (const key of expectedKeys) {
    if (input[key as keyof typeof input] !== expected[key as keyof typeof expected]) {
      issues.push(
        `pulmonary characteristic-resistance research ${key} is invalid`,
      );
    }
  }
  return Object.freeze(issues);
}
