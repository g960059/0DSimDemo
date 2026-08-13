import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createMainWireAcceptedScalarSlotManifestV1,
} from "@/engine/vnext/MainWireAcceptedScalarSlotsV1";
import {
  TransactionalScalarSlotsV1,
} from "@/engine/vnext/TransactionalScalarSlotsV1";

const warmupTicks = 64;
const measuredTicks = 512;
const session = await MainWireIntegratedModelSessionV3.create();
const slots = new TransactionalScalarSlotsV1(
  createMainWireAcceptedScalarSlotManifestV1(session.currentAcceptedState()),
  session.currentAcceptedState(),
);
let totalSlotWriteMs = 0;

for (let tick = 1; tick <= warmupTicks + measuredTicks; tick += 1) {
  const result = session.advanceToPresentationTime(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
  );
  if (result.status !== "advanced") {
    throw new Error(`Scalar slot benchmark failed at tick ${tick}`);
  }
  const startedAt = performance.now();
  slots.stage(result.observation.acceptedState);
  slots.promote();
  const elapsed = performance.now() - startedAt;
  if (tick > warmupTicks) totalSlotWriteMs += elapsed;
}
slots.assertCurrentMatches(session.currentAcceptedState());

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-scalar-slot-benchmark-v1",
  scope: "phase-1b2a-fixed-scalar-staging-not-a-production-speedup-gate",
  warmupTicks,
  measuredTicks,
  scalarSlots: {
    totalMs: totalSlotWriteMs,
    meanMsPerTick: totalSlotWriteMs / measuredTicks,
    report: slots.report(),
  },
}, null, 2)}\n`);
