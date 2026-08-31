import type {
  ExactModelFixtureProjectionV1,
  ExactModelProjectedControlValueV1,
} from
  "@/studio/application/model/ExactModelFixtureProjectionV1";

const SELECTED_AORTIC_HEART_RATE_CONTROL_ID_V1 =
  "rhythm.heart-rate-bpm" as const;
const UNSUPPORTED_SELECTED_AORTIC_CONTROL_VALUE_V1 = Object.freeze({
  status: "unsupported" as const,
});

/**
 * Client-only projection for the HR-only selected-aortic fixture Surface.
 * Hidden fixture coordinates cannot become readable controls merely because
 * they share the full exact fixture document.
 */
export function mainWireIntegratedStudioSelectedAorticOutflowControlValueFromFixtureV1(
  fixture: unknown,
  controlId: string,
): ExactModelProjectedControlValueV1 {
  if (controlId !== SELECTED_AORTIC_HEART_RATE_CONTROL_ID_V1) {
    return UNSUPPORTED_SELECTED_AORTIC_CONTROL_VALUE_V1;
  }
  const heartRateBpm = finiteNumberAtSelectedFixturePathV1(
    fixture,
    ["hemodynamicResearchInputs", "heartRateBpm"],
  );
  return heartRateBpm === null
    ? UNSUPPORTED_SELECTED_AORTIC_CONTROL_VALUE_V1
    : Object.freeze({ status: "value" as const, value: heartRateBpm });
}

export const mainWireIntegratedStudioSelectedAorticOutflowFixtureProjectionV1:
ExactModelFixtureProjectionV1 = Object.freeze({
  controlValue:
    mainWireIntegratedStudioSelectedAorticOutflowControlValueFromFixtureV1,
});

function finiteNumberAtSelectedFixturePathV1(
  value: unknown,
  path: readonly string[],
): number | null {
  let current = value;
  for (const key of path) {
    if (
      current === null
      || typeof current !== "object"
      || Array.isArray(current)
    ) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" && Number.isFinite(current)
    ? current
    : null;
}
