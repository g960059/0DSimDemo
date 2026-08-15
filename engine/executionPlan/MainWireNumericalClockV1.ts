/**
 * Exact clock policy shared by the checked-in numerical policy and the
 * historical model-owned ordinal helper. Execution-plan-capable Studio
 * runtimes consume the compiled schedule instead of importing these values.
 */
export const MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 = 0.002 as const;

export const MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1 = 1 as const;

export const MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1 =
  "coupled-hemodynamics-be-step" as const;

export const MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1 =
  "coupled-hemodynamics" as const;
