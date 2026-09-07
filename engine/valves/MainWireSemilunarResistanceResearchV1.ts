import { sanitizeForStableHash, stableHash } from '@/engine/integrity';
import { validationStampIssuanceEligibleV1, validationStampReuseEligibleV1 } from '@/engine/validationStampModeV1';
import { validateMainWireFourValveDiseaseResearchInputV1,
  type MainWireFourValveDiseaseResearchInputV1 } from './MainWireFourValveDiseaseResearchBracketsV1';

const ID = 'main-wire-semilunar-resistance-ablation-v1' as const;
export type MainWireSemilunarResistanceResearchV1 = Readonly<{
  researchProfileId: typeof ID;
  sourceValveParameterIdentityHash: string;
  /** Zero is a causal ablation endpoint, not a proposed healthy prior. */
  resistanceScaleByValve: Readonly<{ AoV: 0 | 1; PV: 0 | 1 }>;
  parameterIdentityHash: string;
}>;
type Parameters = MainWireFourValveDiseaseResearchInputV1['valves'];
const compiled = new WeakMap<MainWireSemilunarResistanceResearchV1,
  WeakMap<MainWireFourValveDiseaseResearchInputV1, Parameters>>();

export function createMainWireSemilunarResistanceResearchV1(
  source: MainWireFourValveDiseaseResearchInputV1,
  scale: MainWireSemilunarResistanceResearchV1['resistanceScaleByValve'],
): MainWireSemilunarResistanceResearchV1 {
  assertScale(scale);
  const body = Object.freeze({ researchProfileId: ID,
    sourceValveParameterIdentityHash: source.parameterIdentityHash,
    resistanceScaleByValve: Object.freeze({ ...scale }) });
  const profile = Object.freeze({ ...body,
    parameterIdentityHash: stableHash(sanitizeForStableHash(body)) });
  resolveMainWireSemilunarResistanceResearchParametersV1(source, profile);
  return profile;
}

/** Validate the canonical source unchanged, then apply a separately owned
 * research contrast. No valve area, opening law, or public default is relaxed. */
export function resolveMainWireSemilunarResistanceResearchParametersV1(
  source: MainWireFourValveDiseaseResearchInputV1,
  profile: MainWireSemilunarResistanceResearchV1,
): Parameters {
  const cached = validationStampReuseEligibleV1() ? compiled.get(profile)?.get(source) : undefined;
  if (cached) return cached;
  const issues = validateMainWireFourValveDiseaseResearchInputV1(source);
  if (issues.length) throw new Error(`invalid canonical valve source: ${issues.join('; ')}`);
  if (!profile || typeof profile !== 'object'
    || Object.keys(profile).sort().join(',') !== 'parameterIdentityHash,researchProfileId,resistanceScaleByValve,sourceValveParameterIdentityHash'
    || profile.researchProfileId !== ID
    || profile.sourceValveParameterIdentityHash !== source.parameterIdentityHash) {
    throw new Error('semilunar resistance research source/profile mismatch');
  }
  assertScale(profile.resistanceScaleByValve);
  const { parameterIdentityHash, ...body } = profile;
  if (parameterIdentityHash !== stableHash(sanitizeForStableHash(body))) {
    throw new Error('semilunar resistance research identity mismatch');
  }
  const result: Parameters = Object.freeze({ ...source.valves,
    ...Object.fromEntries((['AoV', 'PV'] as const).map(v => [v,
      profile.resistanceScaleByValve[v] === 1 ? source.valves[v] : Object.freeze({
        ...source.valves[v],
        parameterSetId: `${source.valves[v].parameterSetId}-${ID}-${parameterIdentityHash}`,
        backgroundLinearResistanceMmHgSecPerMl: 0,
      })])) });
  if (validationStampIssuanceEligibleV1(source) && validationStampIssuanceEligibleV1(profile)) {
    const bySource = compiled.get(profile) ?? new WeakMap();
    bySource.set(source, result); compiled.set(profile, bySource);
  }
  return result;
}

function assertScale(scale: MainWireSemilunarResistanceResearchV1['resistanceScaleByValve']): void {
  if (!scale || typeof scale !== 'object'
    || Object.keys(scale).sort().join(',') !== 'AoV,PV'
    || ![0, 1].includes(scale.AoV) || ![0, 1].includes(scale.PV)
    || Object.is(scale.AoV, -0) || Object.is(scale.PV, -0)) {
    throw new Error('semilunar resistance research admits exactly AoV/PV multipliers 0 or 1');
  }
}
