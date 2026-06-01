import { ModelCore } from "@/engine/ModelCore";
import { clamp } from "@/engine/math";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import type {
  StarlingSweepRequest,
  StarlingSweepResponse,
  GuytonCurvePoint,
} from "@/engine/guytonStarling";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<StarlingSweepRequest>) => void) | null;
  postMessage: (message: StarlingSweepResponse) => void;
};

ctx.onmessage = (event: MessageEvent<StarlingSweepRequest>) => {
  const req = event.data;
  try {
    ctx.postMessage(computeSweep(req));
  } catch (err) {
    const response: StarlingSweepResponse = {
      requestId: req.requestId,
      signature: req.signature,
      instanceId: req.instanceId,
      warnings: [],
      error: err instanceof Error ? err.message : "Unknown Starling sweep failure",
    };
    ctx.postMessage(response);
  }
};

function computeSweep(req: StarlingSweepRequest): StarlingSweepResponse {
  const deltas = req.deltasMl ?? [-600, -300, 0, 300, 600];
  const right: GuytonCurvePoint[] = [];
  const left: GuytonCurvePoint[] = [];
  const warnings: string[] = [];

  for (const delta of deltas) {
    const target = clamp(req.targetVolumeMl + delta, 2500, 8500);
    const core = new ModelCore(req.params);
    core.initializeVenousPressuresForTargetTBV(target);
    const settle = core.settleToSteady({ ...PREVIEW_SETTLE_POLICY, capSeconds: 45 }, 0.001, 120);
    const metrics = core.metrics();
    const health = core.health();
    const label = `${delta >= 0 ? "+" : ""}${Math.round(delta)} mL`;

    if (!settle.settled) warnings.push(`${label}: sweep point did not fully settle`);
    if (health.status !== "ok") warnings.push(`${label}: health ${health.status}`);

    right.push({
      x: metrics.RAPMean,
      y: metrics.CO_R,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    });
    left.push({
      x: metrics.LAPMean,
      y: metrics.CO_L,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    });
  }

  right.sort((a, b) => a.x - b.x);
  left.sort((a, b) => a.x - b.x);

  return {
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: { side: "right", points: right, warnings },
    left: { side: "left", points: left, warnings },
    warnings,
  };
}

export {};
