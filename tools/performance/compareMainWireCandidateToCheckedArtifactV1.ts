import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type {
  StudioSimulationFrameV2,
  StudioSimulationOutputValueV2,
} from "@/studio/contracts/v2/simulation";
import {
  createCircleHeartExactModelReleaseV1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";

type ExactReleaseV1 = ReturnType<typeof createCircleHeartExactModelReleaseV1>;

const artifactPath = resolve(
  process.cwd(),
  "studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.artifact.mjs",
);
const artifactNamespace = await import(
  `${pathToFileURL(artifactPath).href}?candidate-comparison=${Date.now()}`
) as Record<string, unknown>;
const artifactFactory = artifactNamespace.createCircleHeartExactModelReleaseV1;
if (typeof artifactFactory !== "function") {
  throw new Error("checked exact artifact does not export its release factory");
}

const checkedArtifact = artifactFactory() as ExactReleaseV1;
const candidate = createCircleHeartExactModelReleaseV1();
const checkedAdapter = checkedArtifact.executables.simulationAdapter;
const candidateAdapter = candidate.executables.simulationAdapter;
const checkedSessionId = "session/checked-standard-artifact-comparison";
const candidateSessionId = "session/candidate-standard-source-comparison";
const scenarioId = "scenario/baseline";
const acceptedStepCount = 500;

await Promise.all([
  checkedAdapter.createSession({
    runtimeSessionId: checkedSessionId,
    scenarios: [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }],
  }),
  candidateAdapter.createSession({
    runtimeSessionId: candidateSessionId,
    scenarios: [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }],
  }),
]);

const differences = new Map<string, {
  maximumAbsoluteDifference: number;
  maximumRelativeDifference: number;
  comparedScalarCount: number;
}>();
let maximumAcceptedTimeDifferenceSec = 0;
let maximumAcceptedRevisionDifference = 0;

try {
  for (let stepIndex = 0; stepIndex < acceptedStepCount; stepIndex += 1) {
    const [checkedFrame, candidateFrame] = await Promise.all([
      checkedAdapter.advanceOnePresentationStep({
        runtimeSessionId: checkedSessionId,
        scenarioId,
      }),
      candidateAdapter.advanceOnePresentationStep({
        runtimeSessionId: candidateSessionId,
        scenarioId,
      }),
    ]);
    maximumAcceptedTimeDifferenceSec = Math.max(
      maximumAcceptedTimeDifferenceSec,
      Math.abs(
        candidateFrame.acceptedTimeSec - checkedFrame.acceptedTimeSec,
      ),
    );
    maximumAcceptedRevisionDifference = Math.max(
      maximumAcceptedRevisionDifference,
      Math.abs(
        candidateFrame.acceptedRevision - checkedFrame.acceptedRevision,
      ),
    );
    compareFrames(checkedFrame, candidateFrame, differences);
  }
} finally {
  checkedAdapter.disposeSession(checkedSessionId);
  candidateAdapter.disposeSession(candidateSessionId);
}

const outputDifferences = [...differences.entries()]
  .map(([outputId, difference]) => Object.freeze({
    outputId,
    ...difference,
  }))
  .sort((left, right) =>
    right.maximumRelativeDifference - left.maximumRelativeDifference
      || right.maximumAbsoluteDifference - left.maximumAbsoluteDifference
      || left.outputId.localeCompare(right.outputId)
  );

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-candidate-artifact-comparison-v1",
  checkedArtifactModelId: checkedArtifact.manifest.modelId,
  candidateModelId: candidate.manifest.modelId,
  acceptedStepCount,
  maximumAcceptedTimeDifferenceSec,
  maximumAcceptedRevisionDifference,
  maximumOutputAbsoluteDifference: Math.max(
    0,
    ...outputDifferences.map(({ maximumAbsoluteDifference }) =>
      maximumAbsoluteDifference
    ),
  ),
  maximumOutputRelativeDifference: Math.max(
    0,
    ...outputDifferences.map(({ maximumRelativeDifference }) =>
      maximumRelativeDifference
    ),
  ),
  changedOutputs: outputDifferences.filter(({ maximumAbsoluteDifference }) =>
    maximumAbsoluteDifference > 0
  ),
}, null, 2)}\n`);

function compareFrames(
  checked: StudioSimulationFrameV2,
  next: StudioSimulationFrameV2,
  destination: Map<string, {
    maximumAbsoluteDifference: number;
    maximumRelativeDifference: number;
    comparedScalarCount: number;
  }>,
): void {
  const checkedIds = Object.keys(checked.outputs).sort();
  const nextIds = Object.keys(next.outputs).sort();
  if (JSON.stringify(checkedIds) !== JSON.stringify(nextIds)) {
    throw new Error("candidate exact output IDs differ from checked artifact");
  }
  for (const outputId of checkedIds) {
    compareOutput(
      outputId,
      checked.outputs[outputId]!,
      next.outputs[outputId]!,
      destination,
    );
  }
}

function compareOutput(
  outputId: string,
  checked: StudioSimulationOutputValueV2,
  next: StudioSimulationOutputValueV2,
  destination: Map<string, {
    maximumAbsoluteDifference: number;
    maximumRelativeDifference: number;
    comparedScalarCount: number;
  }>,
): void {
  if (
    checked.outputId !== next.outputId
    || checked.availability !== next.availability
    || checked.quality !== next.quality
  ) {
    throw new Error(`${outputId} output metadata changed`);
  }
  if (checked.value === null || next.value === null) {
    if (checked.value !== next.value) {
      throw new Error(`${outputId} output availability timing changed`);
    }
    return;
  }
  const checkedValues = typeof checked.value === "number"
    ? [checked.value]
    : checked.value;
  const nextValues = typeof next.value === "number"
    ? [next.value]
    : next.value;
  if (checkedValues.length !== nextValues.length) {
    throw new Error(`${outputId} output vector length changed`);
  }
  const current = destination.get(outputId) ?? {
    maximumAbsoluteDifference: 0,
    maximumRelativeDifference: 0,
    comparedScalarCount: 0,
  };
  for (let index = 0; index < checkedValues.length; index += 1) {
    const checkedValue = checkedValues[index]!;
    const nextValue = nextValues[index]!;
    const absoluteDifference = Math.abs(nextValue - checkedValue);
    const relativeDifference = absoluteDifference / Math.max(
      1,
      Math.abs(checkedValue),
      Math.abs(nextValue),
    );
    current.maximumAbsoluteDifference = Math.max(
      current.maximumAbsoluteDifference,
      absoluteDifference,
    );
    current.maximumRelativeDifference = Math.max(
      current.maximumRelativeDifference,
      relativeDifference,
    );
    current.comparedScalarCount += 1;
  }
  destination.set(outputId, current);
}
