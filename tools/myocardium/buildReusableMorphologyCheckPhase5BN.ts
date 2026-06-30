import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import { runVerification } from "@/engine/verification/report";

const OUT = "data/myocardium/protocols/reusable-morphology-check-phase5bn-result-v1.json";

type RunSpec = {
  readonly id: string;
  readonly runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
};

const runs: readonly RunSpec[] = [
  {
    id: "user0-staged-default",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE,
  },
  {
    id: "legacy-frozen-reference",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  },
];

const startedAt = new Date().toISOString();
const results = runs.map((run) => {
  const report = runVerification(DEFAULT_PARAMS, {
    profile: "fitFast",
    gateSet: "normalBaseline",
    runtimeActiveSourceMode: run.runtimeActiveSourceMode,
    now: new Date("2026-06-30T00:00:00.000Z"),
  });
  return {
    id: run.id,
    runtimeActiveSourceMode: run.runtimeActiveSourceMode,
    verificationPass: report.summary.pass,
    hardFailures: report.summary.hardFailures,
    softFailures: report.summary.softFailures,
    morphology: report.morphology,
    metrics: report.metrics == null
      ? null
      : {
          AoPMean: report.metrics.AoPMean,
          CO_L: report.metrics.CO_L,
          CO_R: report.metrics.CO_R,
          LAPMean: report.metrics.LAPMean,
          RAPMean: report.metrics.RAPMean,
          LVEDPApprox: report.metrics.LVEDPApprox,
          EF_LApprox: report.metrics.EF_LApprox,
          EF_RApprox: report.metrics.EF_RApprox,
        },
    failedGateIds: report.gates
      .filter((gate) => gate.status === "fail")
      .map((gate) => ({ id: gate.id, severity: gate.severity, value: gate.value })),
  };
});

const artifact = {
  id: "reusable-morphology-check-phase5bn",
  version: 1,
  generatedAt: startedAt,
  intent: "Reusable deterministic morphology checker contract for UI, CI, subagent summaries, and future preset/case/lesson validation.",
  claimBoundary: {
    noModelFixClaim: true,
    noAtrialPhysiologyAcceptance: true,
    noOfficialMorphologyAcceptance: true,
    expectedCurrentFailuresAreRecordedNotTuned: true,
  },
  runner: {
    profile: "fitFast",
    gateSet: "normalBaseline",
    morphologyProfileId: "normal_sinus_default",
  },
  results,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(artifact, null, 2)}\n`);

// eslint-disable-next-line no-console
console.log(`wrote ${OUT}`);
for (const result of results) {
  // eslint-disable-next-line no-console
  console.log(
    `${result.id}: verification=${result.verificationPass ? "PASS" : "FAIL"} ` +
    `morphology=${result.morphology?.status ?? "n/a"} ` +
    `badges=${JSON.stringify(result.morphology?.badges ?? {})}`,
  );
}
