import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1,
  PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1,
  parsePhaseB1LivePeriodicDiagnosticConfigV1,
  phaseB1LivePeriodicDiagnosticConfigInputFromEnvV1,
} from "@/tools/myocardium/phaseB1LivePeriodicDiagnosticConfigV1";

describe("four-chamber Phase B1 live-periodic diagnostic config", () => {
  it("defaults to SLS-off and one millisecond", () => {
    expect(parsePhaseB1LivePeriodicDiagnosticConfigV1({
      mode: undefined,
      dtMs: undefined,
    })).toEqual({
      mode: "off",
      nominalDtMs: 1,
      nominalDtSec: 0.001,
    });
  });

  it.each([
    ["off", "1", 1, 0.001],
    ["off", "0.5", 0.5, 0.0005],
    ["off", "0.25", 0.25, 0.00025],
    ["on", "1", 1, 0.001],
    ["on", "0.5", 0.5, 0.0005],
    ["on", "0.25", 0.25, 0.00025],
  ] as const)(
    "accepts only closed mode=%s dtMs=%s",
    (mode, dtMs, nominalDtMs, nominalDtSec) => {
      expect(parsePhaseB1LivePeriodicDiagnosticConfigV1({
        mode,
        dtMs,
      })).toEqual({ mode, nominalDtMs, nominalDtSec });
    },
  );

  it.each(["ON", "Off", " off", "off ", "", "0", "true"])(
    "rejects noncanonical mode text %j",
    (mode) => {
      expect(() => parsePhaseB1LivePeriodicDiagnosticConfigV1({
        mode,
        dtMs: "1",
      })).toThrow(`${PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1} must`);
    },
  );

  it.each(["1.0", "0.50", "0.001", "2", "0", "", " 1", "1 "])(
    "rejects noncanonical time-step text %j",
    (dtMs) => {
      expect(() => parsePhaseB1LivePeriodicDiagnosticConfigV1({
        mode: "off",
        dtMs,
      })).toThrow(`${PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1} must`);
    },
  );

  it("rejects undeclared or missing parser fields", () => {
    expect(() => parsePhaseB1LivePeriodicDiagnosticConfigV1({
      mode: "off",
    })).toThrow(/must contain exactly/i);
    expect(() => parsePhaseB1LivePeriodicDiagnosticConfigV1({
      mode: "off",
      dtMs: "1",
      observation: { cycleLocalPass: true },
    })).toThrow(/undeclared=\[observation\]/i);
  });

  it("reads only the two named environment variables", () => {
    expect(phaseB1LivePeriodicDiagnosticConfigInputFromEnvV1({
      [PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_MODE_ENV_V1]: "on",
      [PHASE_B1_LIVE_PERIODIC_DIAGNOSTIC_DT_MS_ENV_V1]: "0.25",
      UNRELATED: "ignored",
    })).toEqual({ mode: "on", dtMs: "0.25" });
  });

  it("serializes cap failure with the authenticated capsule-failure claim boundary", () => {
    const source = readFileSync(
      new URL(
        "../tools/myocardium/diagnoseFourChamberTrisegLandPhaseB1LivePeriodicBe.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const failureStage = source.slice(
      source.indexOf('stage: "terminal-retained-evidence-failure"'),
      source.indexOf("process.exitCode = exitDecision.exitCode"),
    );
    expect(failureStage).toContain(
      "claimBoundary: terminalFinalizationFailure.claimBoundary",
    );
    expect(failureStage).not.toContain("claimBoundary: terminal.claimBoundary");
  });
});
