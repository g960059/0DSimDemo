import { performance } from "node:perf_hooks";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";

const WARMUP_TICKS = 128;
const MEASURED_TICKS = 1_024;
const session = await MainWireFlatAuthoritativeReferenceSessionV1.create();

for (let tick = 1; tick <= WARMUP_TICKS; tick += 1) {
  const result = session.advanceToPresentationTime(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
  );
  if (result.status !== "advanced") {
    throw new Error(`flat authority warm-up failed at tick ${tick}`);
  }
}

const startedAt = performance.now();
for (
  let tick = WARMUP_TICKS + 1;
  tick <= WARMUP_TICKS + MEASURED_TICKS;
  tick += 1
) {
  const result = session.advanceToPresentationTime(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
  );
  if (result.status !== "advanced") {
    throw new Error(`flat authority measurement failed at tick ${tick}`);
  }
}
const elapsedMs = performance.now() - startedAt;
const outputs = projectMainWireIntegratedModelSelectedValuesV3(
  session.observe(),
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-flat-authority-profile-v1",
  warmupTicks: WARMUP_TICKS,
  measuredTicks: MEASURED_TICKS,
  elapsedMs,
  meanMsPerTick: elapsedMs / MEASURED_TICKS,
  outputCount: Object.keys(outputs).length,
  authority: session.authorityReport(),
}, null, 2)}\n`);
