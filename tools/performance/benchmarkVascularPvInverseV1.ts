import { performance } from "node:perf_hooks";

import {
  buildAuthoritativeCirculationGraphV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  ptmFromStressedVolume,
  stressedVolumeFromPtm,
} from "@/engine/vascularPv";

const graph = buildAuthoritativeCirculationGraphV1();
const targetPressuresMmHg = Object.freeze([
  -19.75,
  -12.5,
  -5,
  0,
  6.123456789,
  12,
  20,
  37.25,
  44.75,
]);
const cases = Object.freeze([0, 0.15, 1].flatMap((venousTone) =>
  graph.nodes.flatMap((node) => {
    if (node.kind !== "venousPressure") return [];
    const law = Object.freeze({
      ...vascularPvLawFromNodeV1(node, {
        venousTone,
        arterialStiffness: 0.75,
      }),
    });
    if (law.kind !== "venous3") {
      throw new Error(`${node.name} must resolve to a venous3 law`);
    }
    return targetPressuresMmHg.map((expectedPressureMmHg) => Object.freeze({
      nodeId: node.name,
      venousTone,
      law,
      expectedPressureMmHg,
      targetStressedVolumeMl: stressedVolumeFromPtm(
        law,
        expectedPressureMmHg,
      ),
    }));
  })
));
const fixed32Options = Object.freeze({
  maxIterations: 32,
  termination: "fixed-iterations" as const,
});
const adaptiveOptions = Object.freeze({
  maxIterations: 32,
  pressureToleranceMmHg: 1e-10,
  stressedVolumeToleranceMl: 1e-10,
  termination: "adaptive" as const,
});
const warmupEvaluations = 20_000;
const measuredEvaluations = 500_000;

function measure(
  options: typeof fixed32Options | typeof adaptiveOptions,
): Readonly<{
  elapsedMs: number;
  nanosecondsPerEvaluation: number;
  checksum: number;
}> {
  let checksum = 0;
  for (let index = 0; index < warmupEvaluations; index += 1) {
    const entry = cases[index % cases.length]!;
    checksum += ptmFromStressedVolume(
      entry.law,
      entry.targetStressedVolumeMl,
      options,
    );
  }
  const startedAtMs = performance.now();
  for (let index = 0; index < measuredEvaluations; index += 1) {
    const entry = cases[index % cases.length]!;
    checksum += ptmFromStressedVolume(
      entry.law,
      entry.targetStressedVolumeMl,
      options,
    );
  }
  const elapsedMs = performance.now() - startedAtMs;
  return Object.freeze({
    elapsedMs,
    nanosecondsPerEvaluation:
      (elapsedMs * 1_000_000) / measuredEvaluations,
    checksum,
  });
}

let maximumAdaptivePressureErrorMmHg = 0;
let maximumAdaptiveVolumeResidualMl = 0;
for (const entry of cases) {
  const pressureMmHg = ptmFromStressedVolume(
    entry.law,
    entry.targetStressedVolumeMl,
    adaptiveOptions,
  );
  maximumAdaptivePressureErrorMmHg = Math.max(
    maximumAdaptivePressureErrorMmHg,
    Math.abs(pressureMmHg - entry.expectedPressureMmHg),
  );
  maximumAdaptiveVolumeResidualMl = Math.max(
    maximumAdaptiveVolumeResidualMl,
    Math.abs(
      stressedVolumeFromPtm(entry.law, pressureMmHg)
        - entry.targetStressedVolumeMl,
    ),
  );
}

const fixed32 = measure(fixed32Options);
const adaptive = measure(adaptiveOptions);
console.log(JSON.stringify({
  schemaId: "circleheart-vascular-pv-inverse-benchmark-v1",
  graphVenousNodeCount: new Set(cases.map(({ nodeId }) => nodeId)).size,
  caseCount: cases.length,
  measuredEvaluations,
  fixed32,
  adaptive,
  speedup: fixed32.nanosecondsPerEvaluation
    / adaptive.nanosecondsPerEvaluation,
  maximumAdaptivePressureErrorMmHg,
  maximumAdaptiveVolumeResidualMl,
}));
