import generatedExecutionPlanV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedExecutionPlanV1.generated.json";
import {
  bindExecutionPlanV1,
  validateAndOwnExecutionPlanDescriptorV1,
  validateAndOwnExecutionPlanKernelCatalogV1,
  type ExecutionPlanKernelBindingCatalogV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type {
  ExecutionPlanDescriptorV1,
} from "@/runtime/executionPlan/ExecutionPlanDescriptorV1";

const WARMUP_ITERATIONS = 32;
const MEASURED_ITERATIONS = 256;
const SAMPLE_COUNT = 7;

const sourceDescriptor = structuredClone(
  generatedExecutionPlanV1,
) as ExecutionPlanDescriptorV1;
const sourceCatalog = catalogFromDescriptorV1(sourceDescriptor);
const ownedDescriptor = validateAndOwnExecutionPlanDescriptorV1(
  sourceDescriptor,
);
const ownedCatalog = validateAndOwnExecutionPlanKernelCatalogV1(sourceCatalog);

runBindingsV1(WARMUP_ITERATIONS, ownedDescriptor, ownedCatalog);
runBindingsV1(WARMUP_ITERATIONS, sourceDescriptor, sourceCatalog);

const ownedSamplesMs: number[] = [];
const repeatedOwnershipSamplesMs: number[] = [];
for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
  if (sample % 2 === 0) {
    ownedSamplesMs.push(measureBindingsV1(ownedDescriptor, ownedCatalog));
    repeatedOwnershipSamplesMs.push(
      measureBindingsV1(sourceDescriptor, sourceCatalog),
    );
  } else {
    repeatedOwnershipSamplesMs.push(
      measureBindingsV1(sourceDescriptor, sourceCatalog),
    );
    ownedSamplesMs.push(measureBindingsV1(ownedDescriptor, ownedCatalog));
  }
}

const ownedMedianMs = medianV1(ownedSamplesMs);
const repeatedOwnershipMedianMs = medianV1(repeatedOwnershipSamplesMs);
const report = Object.freeze({
  schemaId: "circleheart-execution-plan-binding-benchmark-v1",
  scenarioBindingsPerSample: MEASURED_ITERATIONS,
  sampleCount: SAMPLE_COUNT,
  ownedImmutableData: Object.freeze({
    sampleMs: Object.freeze(ownedSamplesMs),
    medianTotalMs: ownedMedianMs,
    medianMsPerBinding: ownedMedianMs / MEASURED_ITERATIONS,
  }),
  repeatedPortableOwnership: Object.freeze({
    sampleMs: Object.freeze(repeatedOwnershipSamplesMs),
    medianTotalMs: repeatedOwnershipMedianMs,
    medianMsPerBinding:
      repeatedOwnershipMedianMs / MEASURED_ITERATIONS,
  }),
  medianSpeedup:
    repeatedOwnershipMedianMs / ownedMedianMs,
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function measureBindingsV1(
  descriptor: ExecutionPlanDescriptorV1,
  catalog: ExecutionPlanKernelBindingCatalogV1,
): number {
  const startedAtMs = performance.now();
  runBindingsV1(MEASURED_ITERATIONS, descriptor, catalog);
  return performance.now() - startedAtMs;
}

function runBindingsV1(
  count: number,
  descriptor: ExecutionPlanDescriptorV1,
  catalog: ExecutionPlanKernelBindingCatalogV1,
): void {
  let allocatedBytes = 0;
  for (let index = 0; index < count; index += 1) {
    allocatedBytes += bindExecutionPlanV1(descriptor, catalog).allocatedBytes;
  }
  if (!Number.isSafeInteger(allocatedBytes) || allocatedBytes <= 0) {
    throw new Error("Execution plan benchmark allocation accounting failed");
  }
}

function catalogFromDescriptorV1(
  descriptor: ExecutionPlanDescriptorV1,
): ExecutionPlanKernelBindingCatalogV1 {
  return Object.freeze({
    componentKernelIds: Object.freeze([...new Set(
      descriptor.stateLayout.blocks.map(({ kernelId }) => kernelId),
    )]),
    hydraulicPathKernelIds: Object.freeze([...new Set(
      descriptor.hydraulicGraph.pathKernelIds,
    )]),
    solveSystemKernelIds: Object.freeze([...new Set(
      descriptor.solveGroups.map(({ systemKernelId }) => systemKernelId),
    )]),
  });
}

function medianV1(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1]! + ordered[middle]!) / 2
    : ordered[middle]!;
}
