export const MYOCARDIUM_UNIT_LABELS = {
  second: "s",
  kelvin: "K",
  unitInterval01: "0..1",
} as const;

export function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

export function requirePositiveFiniteSeconds(value: unknown, label: string): number {
  const seconds = requireFiniteNumber(value, `${label} (${MYOCARDIUM_UNIT_LABELS.second})`);
  if (seconds <= 0) {
    throw new Error(`${label} must be greater than 0 ${MYOCARDIUM_UNIT_LABELS.second}`);
  }
  return seconds;
}

export function requireNonNegativeFiniteSeconds(value: unknown, label: string): number {
  const seconds = requireFiniteNumber(value, `${label} (${MYOCARDIUM_UNIT_LABELS.second})`);
  if (seconds < 0) {
    throw new Error(`${label} must be at least 0 ${MYOCARDIUM_UNIT_LABELS.second}`);
  }
  return seconds;
}

export function requireUnitInterval01(value: unknown, label: string): number {
  const scalar = requireFiniteNumber(value, `${label} (${MYOCARDIUM_UNIT_LABELS.unitInterval01})`);
  if (scalar < 0 || scalar > 1) {
    throw new Error(`${label} must be within ${MYOCARDIUM_UNIT_LABELS.unitInterval01}`);
  }
  return scalar;
}
