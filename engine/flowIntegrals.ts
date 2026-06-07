import type { SimSample } from "@/engine/protocol";

export const VALVE_FLOW_KEYS = ["QMV", "QAo", "QTV", "QPV"] as const;

export type ValveFlowKey = typeof VALVE_FLOW_KEYS[number];

export type ValveFlowIntegral = {
  forwardVolumeMl: number;
  reverseVolumeMl: number;
  netVolumeMl: number;
  regurgitantFraction: number;
};

const ZERO_FLOW_EPSILON_ML = 1e-9;

export function integrateFlowVolume(
  samples: readonly SimSample[],
  key: ValveFlowKey,
  transform: (flowMlPerS: number) => number,
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (transform(samples[i - 1][key]) + transform(samples[i][key]));
  }
  return area;
}

export function regurgitantFractionFromVolumes(forwardVolumeMl: number, reverseVolumeMl: number): number {
  if (forwardVolumeMl > ZERO_FLOW_EPSILON_ML) return reverseVolumeMl / forwardVolumeMl;
  return reverseVolumeMl > ZERO_FLOW_EPSILON_ML ? 1 : 0;
}

export function valveFlowIntegral(samples: readonly SimSample[], key: ValveFlowKey): ValveFlowIntegral {
  const forwardVolumeMl = integrateFlowVolume(samples, key, (flow) => Math.max(0, flow));
  const reverseVolumeMl = integrateFlowVolume(samples, key, (flow) => Math.max(0, -flow));
  const netVolumeMl = integrateFlowVolume(samples, key, (flow) => flow);
  return {
    forwardVolumeMl,
    reverseVolumeMl,
    netVolumeMl,
    regurgitantFraction: regurgitantFractionFromVolumes(forwardVolumeMl, reverseVolumeMl),
  };
}
