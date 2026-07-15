import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { FivePatchEnvelopeArmIdV1 } from
  "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
  type FivePatchEnvelopeAcceptedStepSampleV1,
  type FivePatchEnvelopeProtocolRunResultV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1,
  armReadinessResultFileNameV1,
  renderFivePatchModelEnvelopeArmReadinessFileV1,
  renderFivePatchModelEnvelopeArmReadinessHtmlV1,
} from "@/tools/mechanics2/renderFivePatchModelEnvelopeArmReadinessV1";

const ARM_IDS = [
  "land-equilibrium-passive-sls-off",
  "land-equilibrium-passive-sls-atrial-only",
  "land-equilibrium-passive-sls-all-patch",
] as const;

describe("renderFivePatchModelEnvelopeArmReadinessV1", () => {
  it("overlays three predeclared arms on six panels using straight raw-endpoint paths", () => {
    const results = ARM_IDS.map((armId, armIndex) =>
      syntheticResult(armId, armIndex)
    ).reverse();

    const html = renderFivePatchModelEnvelopeArmReadinessHtmlV1(results);

    expect(html).toContain("LA blood-volume PV");
    expect(html).toContain("LV PV");
    expect(html).toContain("LAP vs phase");
    expect(html).toContain("LVP vs phase");
    expect(html).toContain("MV flow vs phase");
    expect(html).toContain("Pulmonary venous flow vs phase");
    expect(html).toContain("Independent cold-start comparison; periodicity is not established.");
    expect(html).toContain("No smoothing, phase segmentation, event annotation, or shape acceptance is applied.");
    expect(html).not.toContain("Reservoir");
    expect(html).not.toContain("Conduit");
    expect(html).not.toContain("Pumping");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("fetch(");

    const pathData = [...html.matchAll(
      /<path class="raw-series [^"]+" d="([^"]+)"\/>/g,
    )].map((match) => match[1]!);
    expect(pathData).toHaveLength(18);
    for (const data of pathData) {
      expect(data).toMatch(/^M-?[0-9.]+,-?[0-9.]+(?: L-?[0-9.]+,-?[0-9.]+)+$/);
      expect(data.match(/[ML]/g)).toHaveLength(200);
      expect(data).not.toMatch(/[CQSAZ]/);
      expect(data).not.toMatch(/NaN|Infinity/);
    }
  });

  it("rejects missing, duplicate, or periodicity-claimed arm-readiness inputs", () => {
    const off = syntheticResult(ARM_IDS[0], 0);
    const atrial = syntheticResult(ARM_IDS[1], 1);
    const all = syntheticResult(ARM_IDS[2], 2);

    expect(() => renderFivePatchModelEnvelopeArmReadinessHtmlV1([
      off,
      atrial,
    ])).toThrow("exactly one result");
    expect(() => renderFivePatchModelEnvelopeArmReadinessHtmlV1([
      off,
      atrial,
      atrial,
    ])).toThrow("duplicate arm-readiness result");
    expect(() => renderFivePatchModelEnvelopeArmReadinessHtmlV1([
      off,
      atrial,
      {
        ...all,
        periodicity: {
          ...all.periodicity,
          periodicityEstablished: true,
          status: "established",
        },
      },
    ])).toThrow("unexpectedly classifies periodicity");
  });

  it("loads the three persisted-coordinate files and atomically replaces one output", () => {
    const directory = mkdtempSync(join(tmpdir(), "five-patch-arm-readiness-"));
    const destination = join(directory, "visual.html");
    try {
      for (const armId of ARM_IDS) {
        const fileName = armReadinessResultFileNameV1(armId);
        writeFileSync(
          join(directory, fileName),
          readFileSync(
            join(DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1, fileName),
            "utf8",
          ),
          "utf8",
        );
      }
      writeFileSync(destination, "stale", "utf8");

      const summary = renderFivePatchModelEnvelopeArmReadinessFileV1(
        directory,
        destination,
      );

      expect(summary.rawEndpointCounts).toEqual({
        "land-equilibrium-passive-sls-off": 200,
        "land-equilibrium-passive-sls-atrial-only": 200,
        "land-equilibrium-passive-sls-all-patch": 200,
      });
      expect(readFileSync(destination, "utf8")).toContain(
        "Five-patch envelope arm-readiness raw overlays V1",
      );
      expect(readdirSync(directory).filter((name) => name.endsWith(".tmp")))
        .toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function syntheticResult(
  armId: FivePatchEnvelopeArmIdV1,
  armIndex: number,
): FivePatchEnvelopeProtocolRunResultV1 {
  const samples = Array.from({ length: 200 }, (_unused, index) =>
    syntheticSample((index + 1) / 200, index, armIndex)
  );
  return {
    runnerId: FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
    runId: `arm-readiness::${armId}`,
    request: {
      phase: "arm-readiness",
      armId,
      candidateIndex: 0,
      scenarioId: "hr60-reference",
      beats: 1,
      dtSec: 0.005,
      stepCount: samples.length,
      retainEveryEndpointOfFinalCycle: true,
    },
    slsVariant: armId.endsWith("off")
      ? "off"
      : armId.endsWith("atrial-only")
        ? "atrial-only"
        : "all-patch",
    unitPoint: [],
    parameterVector: {},
    parameterIdentityCanonicalJson: "{}",
    parameterIdentitySha256: createHash("sha256")
      .update("{}", "utf8")
      .digest("hex"),
    initialVolumeOverridesMl: {},
    initialization: "independent-cold-start",
    requestedStepsAttemptedUnlessRejected: samples.length,
    stepsAttempted: samples.length,
    stepsAccepted: samples.length,
    failureReasons: [],
    initialTotalBloodVolumeMl: 5_000,
    finalTotalBloodVolumeMl: 5_000,
    maximumAbsoluteBloodVolumeResidualMl: 0,
    minimumCompartmentVolumeMl: 20,
    finalTimeSec: 1,
    finalCycleSamples: samples,
    cycleEndpointRetention: {
      policy:
        "every-accepted-endpoint-of-final-complete-cycle-or-partial-current-cycle-on-failure",
      exactEndpointsPerCycle: samples.length,
      retainedEndpointCount: samples.length,
      retainedCycleKind: "latest-complete-cycle",
      boundedToAtMostOneCycle: true,
    },
    periodicity: {
      exactCycleBoundaryStates: [],
      normalizedReturnMap: null,
      maxAbsDimensionlessTolerance: null,
      toleranceSource: "none",
      periodicityEstablished: null,
      status: "unavailable-fewer-than-two-exact-cycle-boundaries",
    },
    status: "protocol-run-complete",
    contributesToPhysiologyOrModelClassPassFraction: false,
  } as unknown as FivePatchEnvelopeProtocolRunResultV1;
}

function syntheticSample(
  phase01: number,
  index: number,
  armIndex: number,
): FivePatchEnvelopeAcceptedStepSampleV1 {
  const offset = 0.3 * armIndex;
  return {
    acceptedStepIndex: index + 1,
    timeSec: phase01,
    phase01,
    volumesMl: {
      leftAtriumMl: 55 + 5 * index + offset,
      leftVentricleMl: 130 - 12 * index + offset,
      systemicArteryMl: 700,
      systemicVeinMl: 3_000,
      rightAtriumMl: 55,
      rightVentricleMl: 125,
      pulmonaryArteryMl: 180,
      pulmonaryVeinMl: 650,
    },
    pressuresMmHg: {
      leftAtriumMmHg: 6 + index + offset,
      leftVentricleMmHg: 8 + 20 * index + offset,
      systemicArteryMmHg: 90,
      systemicVeinMmHg: 3,
      rightAtriumMmHg: 3,
      rightVentricleMmHg: 15,
      pulmonaryArteryMmHg: 14,
      pulmonaryVeinMmHg: 8,
    },
    flowsMlPerSec: {
      mitralMlPerSec: 10 + 25 * index + offset,
      aorticMlPerSec: 40,
      systemicPeripheralMlPerSec: 60,
      systemicVenousMlPerSec: 65,
      tricuspidMlPerSec: 55,
      pulmonaryValveMlPerSec: 45,
      pulmonaryPeripheralMlPerSec: 50,
      pulmonaryVenousMlPerSec: 70 - 8 * index + offset,
    },
    freeCalciumUm: {},
    activations01: {},
    reportOnlyMechanismReadback: {
      leftAtrium: {
        fiberLogStrain: 0.01 * index,
        fiberLogStrainBackwardDifferenceRatePerSec: 0.1,
        pressureComponentsMmHg: {
          equilibriumPassiveMmHg: 6 + index + offset,
          effectiveLandActiveMmHg: 0,
          slsOverstressMmHg: 0,
          totalMmHg: 6 + index + offset,
          componentSumMinusTotalMmHg: 0,
        },
      },
      mitralValve: {
        pressureGradientMmHg:
          (6 + index + offset) - (8 + 20 * index + offset),
        openFraction01: index === 0 ? 1 : 0,
      },
      leftVentricularPressureBackwardDifferenceRateMmHgPerSec:
        index === 0 ? null : 20,
      leftVentricularPressureDecayRatePositiveMmHgPerSec:
        index === 0 ? null : 0,
    },
    totalBloodVolumeResidualMl: 0,
  };
}
