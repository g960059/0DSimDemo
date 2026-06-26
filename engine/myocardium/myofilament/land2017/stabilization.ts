import {
  evaluateLand2017AlgebraicTerms,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_INDEX,
  assertLand2017StateVectorLength,
  type LandContinuousInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const LAND2017_ACTIVE_STIFFNESS_SOURCE_ID = "regazzoni-quarteroni2020-active-stiffness";
export const LAND2017_ACTIVE_STIFFNESS_PERSISTENT_ID = "arXiv:2007.15714";

export const LAND2017_ACTIVE_STIFFNESS_PROVENANCE = Object.freeze({
  sourceId: LAND2017_ACTIVE_STIFFNESS_SOURCE_ID,
  persistentId: LAND2017_ACTIVE_STIFFNESS_PERSISTENT_ID,
  location: "Regazzoni & Quarteroni 2020 Sec. 5.1.2 Eq. 50",
  role: "stabilization",
  note: "L17 active stiffness K_a; distinct from discrete algorithmic tangent",
} as const);

export function computeLand2017ActiveStiffnessPa(
  state: ArrayLike<number>,
  input: Pick<LandContinuousInput, "fiberEngineeringStrain">,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  assertLand2017StateVectorLength(state, "Land 2017 active-stiffness state");
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const terms = evaluateLand2017AlgebraicTerms(state, input, parameterSet);
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];

  // Regazzoni & Quarteroni 2020, Sec. 5.1.2 Eq. 50 for the Land 2017 model.
  return (terms.h * p.Tref * (d.As * S + d.Aw * W)) / p.rs;
}
