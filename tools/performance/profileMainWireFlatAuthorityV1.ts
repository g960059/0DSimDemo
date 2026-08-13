import { performance } from "node:perf_hooks";

import {
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";

const WARMUP_TICKS = 128;
const MEASURED_TICKS = 1_024;
selectHotPathIntegrityTierV1("hot-path-lean");
const session = await MainWireFlatAuthoritativeReferenceSessionV1.create();
let outputs: ReturnType<
  MainWireFlatAuthoritativeReferenceSessionV1[
    "advanceToPresentationTimeWithSelectedOutputProjectionV1"
  ]
>["projectedValues"] = null;

for (let tick = 1; tick <= WARMUP_TICKS; tick += 1) {
  const result = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
    MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  );
  outputs = result.projectedValues;
  if (result.advance.status !== "advanced" || outputs === null) {
    throw new Error(`flat authority warm-up failed at tick ${tick}`);
  }
}

const startedAt = performance.now();
for (
  let tick = WARMUP_TICKS + 1;
  tick <= WARMUP_TICKS + MEASURED_TICKS;
  tick += 1
) {
  const result = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
    MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  );
  outputs = result.projectedValues;
  if (result.advance.status !== "advanced" || outputs === null) {
    throw new Error(`flat authority measurement failed at tick ${tick}`);
  }
}
const elapsedMs = performance.now() - startedAt;
if (outputs === null) {
  throw new Error("flat authority profiler produced no projected outputs");
}

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-flat-authority-profile-v1",
  warmupTicks: WARMUP_TICKS,
  measuredTicks: MEASURED_TICKS,
  hotPathIntegrityTier: hotPathIntegrityTierV1(),
  elapsedMs,
  meanMsPerTick: elapsedMs / MEASURED_TICKS,
  outputCount: Object.keys(outputs).length,
  authority: session.authorityReport(),
}, null, 2)}\n`);
