import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1 =
  "PHASE_B1_LIVE_PERIODIC_MODE" as const;

export const PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1 =
  "PHASE_B1_LIVE_PERIODIC_DT_MS" as const;

export type PhaseB1LivePeriodicDiagnosticConfigInputV1 = Readonly<{
  mode: string | undefined;
  dtMs: string | undefined;
}>;

export type PhaseB1LivePeriodicDiagnosticConfigV1 = Readonly<{
  mode: "on" | "off";
  nominalDtMs: 1 | 0.5 | 0.25;
  nominalDtSec: 0.001 | 0.0005 | 0.00025;
}>;

export function phaseB1LivePeriodicDiagnosticConfigInputFromEnvV1(
  env: Readonly<Record<string, string | undefined>>,
): PhaseB1LivePeriodicDiagnosticConfigInputV1 {
  return Object.freeze({
    mode: env[PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1],
    dtMs: env[PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1],
  });
}

export function parsePhaseB1LivePeriodicDiagnosticConfigV1(
  input: unknown,
): PhaseB1LivePeriodicDiagnosticConfigV1 {
  assertExactPlainRecordV1(input, [
    "mode",
    "dtMs",
  ], "Phase B1 live-periodic diagnostic config input");
  const mode = input.mode === undefined ? "off" : input.mode;
  if (mode !== "on" && mode !== "off") {
    throw new Error(
      `${PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1} must be exactly on or off`,
    );
  }
  const dtMsText = input.dtMs === undefined ? "1" : input.dtMs;
  const timeStep = timeStepFromClosedText(dtMsText);
  return Object.freeze({
    mode,
    nominalDtMs: timeStep.nominalDtMs,
    nominalDtSec: timeStep.nominalDtSec,
  });
}

function timeStepFromClosedText(
  value: unknown,
): Readonly<{
  nominalDtMs: 1 | 0.5 | 0.25;
  nominalDtSec: 0.001 | 0.0005 | 0.00025;
}> {
  switch (value) {
    case "1":
      return Object.freeze({ nominalDtMs: 1, nominalDtSec: 0.001 });
    case "0.5":
      return Object.freeze({ nominalDtMs: 0.5, nominalDtSec: 0.0005 });
    case "0.25":
      return Object.freeze({ nominalDtMs: 0.25, nominalDtSec: 0.00025 });
    default:
      throw new Error(
        `${PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1} must be exactly 1, 0.5, or 0.25 milliseconds`,
      );
  }
}
