import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID,
  renderMainWireIntegratedModelTerminalCycleTraceSvgV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleSvgV2";
import type {
  MainWireIntegratedModelTerminalCycleTraceV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  renderMainWireIntegratedModelTerminalCycleSvgCliV2,
} from "@/tools/scientific/renderMainWireIntegratedModelTerminalCycleSvgV2";

describe("integrated V2 terminal-cycle raw SVG diagnostic", () => {
  it("plots every raw endpoint across all required panels without resampling or acceptance claims", () => {
    const trace = fixtureTrace();
    const before = JSON.stringify(trace);
    const svg = renderMainWireIntegratedModelTerminalCycleTraceSvgV2(trace);

    expect(JSON.stringify(trace)).toBe(before);
    expect(svg).toContain(MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID);
    expect(svg).toContain("exploratory terminal cycle / periodicity unclassified");
    expect(svg).toContain("no physiology or shape acceptance / no resampling");
    expect(svg).toContain("RAW ACCEPTED ENDPOINTS ONLY");
    expect(svg).toContain("Pressure @ systemic Ao node / absolute LV chamber");
    expect(svg).toContain("LV chamber blood volume vs accepted cycle phase");
    expect(svg).toContain("LV pressure-volume loop");
    expect(svg).toContain("LVAD flow / inlet availability vs phase");
    expect(svg).toContain("LVAD pump-local H-Q");
    expect(svg).toContain("Coronary flows at two distinct model stations");
    expect(svg).toContain("Native valve signed flow @ MV");
    expect(svg).toContain("Valve accepted state / target branch / active EOA");
    expect(svg).toContain("combined forward output");
    expect(svg).toContain("LAD internal Qm kept separate");
    expect(svg).toContain("main-wire-integrated-terminal-cycle-raw-morphology-v2");
    expect(svg).toContain("pump-local delivered pressure rise");
    expect(svg.match(/data-series="aortic-valve-signed-flow"/g))
      .toHaveLength(1);
    expect(svg.match(/data-series="mitral-valve-signed-flow"/g))
      .toHaveLength(1);
    expect(svg.match(/data-series="aov-active-eoa"/g)).toHaveLength(1);
    expect(svg.match(/data-series="mv-active-eoa"/g)).toHaveLength(1);
    expect(svg).toContain("LVAD constraint timeline / raw accepted-step legend");
    expect(svg.match(/data-series="lvad-hq-owner-points"/g)).toHaveLength(4);
    expect(svg.match(/data-series="constraint-timeline"/g)).toHaveLength(4);
    expect(svg.match(/data-series="effective-activation-event"/g))
      .toHaveLength(1);
    expect(svg.match(/data-series="valve-opening-target-transition"/g))
      .toHaveLength(4);
    expect(svg).toContain("data-constraint-owner=\"pressure-collapse\"");
    expect(svg).toContain("data-constraint-owner=\"volume-collapse\"");
    expect(svg).toContain("data-constraint-owner=\"forward-cap\"");
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).not.toContain("<script");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_CLAIM)
      .toMatchObject({
        cycleStatus:
          "explicit-render-context-never-inferred-from-raw-trace",
        physiologyAcceptanceClaimed: false,
        shapeAcceptanceClaimed: false,
        resamplingApplied: false,
        smoothingApplied: false,
        fittingApplied: false,
      });

    const classified = renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      trace,
      "period1-converged",
    );
    expect(classified).toContain("numerical P1 classified");
    expect(classified).toContain("numerical P1 classifier passed");
    expect(classified).toContain(
      "&quot;cycleClassificationContext&quot;:&quot;period1-converged&quot;",
    );
  });

  it("fails closed for empty, non-finite, count-mismatched, or malformed raw traces", () => {
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2({}))
      .toThrow();

    const empty = structuredClone(fixtureTrace()) as MutableTrace;
    empty.sampleCount = 0;
    empty.samples = [];
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(empty))
      .toThrow(/sampleCount/);

    const countMismatch = structuredClone(fixtureTrace()) as MutableTrace;
    countMismatch.sampleCount += 1;
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      countMismatch,
    )).toThrow(/matching sampleCount/);

    const nonFinite = structuredClone(fixtureTrace()) as MutableTrace;
    nonFinite.samples[1]!.signal.aorticPressureMmHg = Number.NaN;
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      nonFinite,
    )).toThrow(/aorticPressureMmHg must be finite/);

    const malformedPhase = structuredClone(fixtureTrace()) as MutableTrace;
    malformedPhase.samples[2]!.cyclePhase01 = 0.4;
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      malformedPhase,
    )).toThrow(/cyclePhase01/);

    const malformedOwner = structuredClone(fixtureTrace()) as MutableTrace;
    malformedOwner.samples[0]!.lvad.constraintOwner = "unknown-owner";
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      malformedOwner,
    )).toThrow(/constraintOwner is invalid/);

    const falseProvenance = structuredClone(fixtureTrace()) as MutableTrace;
    falseProvenance.eligibleForNumericalOrPhysiologicalShapeGate = true;
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      falseProvenance,
    )).toThrow(/provenance/);
    expect(() => renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
      fixtureTrace(),
      "invented-status" as never,
    )).toThrow(/classification context/);
  });

  it("renders a serialized trace envelope to SVG without executing the simulation", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "circleheart-integrated-terminal-svg-"),
    );
    try {
      const inputPath = path.join(temporaryDirectory, "trace.json");
      const outputPath = path.join(temporaryDirectory, "trace.svg");
      writeFileSync(inputPath, JSON.stringify({
        classification: {
          status: "period1-converged",
        },
        terminalCycleExploration: {
          terminalCycleTrace: fixtureTrace(),
        },
      }));

      const rendered = renderMainWireIntegratedModelTerminalCycleSvgCliV2([
        "--input",
        inputPath,
        "--output",
        outputPath,
      ]);

      expect(rendered).toEqual({ inputPath, outputPath });
      expect(readFileSync(outputPath, "utf8")).toContain(
        MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID,
      );
      expect(readFileSync(outputPath, "utf8"))
        .toContain("numerical P1 classified");
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

type MutableTrace = {
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  sampleCount: number;
  samples: Array<{
    cycleIndex: number;
    acceptedStepIndexWithinCycle: number;
    acceptedTimeSec: number;
    cyclePhase01: number;
    acceptedDtSec: number;
    signal: {
      lvadFlowMlPerSec: number;
      lvadPressureRiseMmHg: number;
      aorticPressureMmHg: number;
      leftVentricularPressureMmHg: number;
      leftVentricularVolumeMl: number;
      totalCoronaryInletFlowMlPerSec: number;
      ladSubendocardialQmFlowMlPerSec: number;
    };
    valve: {
      MV: MutableValveEndpoint;
      AoV: MutableValveEndpoint;
    };
    lvad: {
      unrestrictedFlowMlPerSec: number;
      flowAccelerationMlPerSec2: number;
      inletAvailability01: number;
      constraintOwner: string;
      constraintReactionMmHg: number;
      forwardFlowEvidenceStatus: string;
      forwardFlowPublishedExperimentalTraversalUpperLMin: number | null;
      forwardFlowAdvertisedCapacityLMin: number | null;
      prePumpPressureMmHg: number;
      postPumpPressureMmHg: number;
      deliveredPumpPressureRiseMmHg: number;
    };
    acceptedEffectiveActivationEventIds: string[];
  }>;
  retainedForGraphShapeInspection: boolean;
  eligibleForNumericalOrPhysiologicalShapeGate: boolean;
  interpretation: string;
};

type MutableValveEndpoint = {
  signedFlowMlPerSec: number;
  leafletOpeningFraction01: number;
  openingTarget01: number;
  openingDriveState: string;
  activeDirection: string;
  activeEffectiveOrificeAreaCm2: number;
  forwardEffectiveOrificeAreaCm2: number;
  reverseEffectiveOrificeAreaCm2: number;
};

function fixtureTrace(): MainWireIntegratedModelTerminalCycleTraceV2 {
  const owners = [
    "none",
    "pressure-collapse",
    "volume-collapse",
    "forward-cap",
  ] as const;
  return Object.freeze({
    cycleIndex: 5,
    startTimeSec: 2,
    endTimeSec: 3,
    sampleCount: 4,
    samples: Object.freeze(owners.map((constraintOwner, index) => {
      const step = index + 1;
      const phase = step / 4;
      return Object.freeze({
        cycleIndex: 5,
        acceptedStepIndexWithinCycle: step,
        acceptedTimeSec: 2 + phase,
        cyclePhase01: phase,
        acceptedDtSec: 0.25,
        signal: Object.freeze({
          lvadFlowMlPerSec: [30, 42, 55, 38][index]!,
          lvadPressureRiseMmHg: [65, 72, 54, 61][index]!,
          aorticPressureMmHg: [76, 91, 84, 70][index]!,
          leftVentricularPressureMmHg: [8, 92, 34, 6][index]!,
          leftVentricularVolumeMl: [132, 88, 55, 116][index]!,
          totalCoronaryInletFlowMlPerSec: [2, 1, 5, 4][index]!,
          ladSubendocardialQmFlowMlPerSec: [0.4, 0.1, 1.3, 0.8][index]!,
        }),
        valve: Object.freeze({
          MV: valveEndpoint(
            [18, 0, 0, 22][index]!,
            [0.8, 0.3, 0.1, 0.7][index]!,
            [0.6, 0, 0, 0.5][index]!,
          ),
          AoV: valveEndpoint(
            [0, 35, 0, 0][index]!,
            [0.1, 0.8, 0.2, 0.05][index]!,
            [0, 0.7, 0, 0][index]!,
          ),
        }),
        lvad: Object.freeze({
          unrestrictedFlowMlPerSec: [30, 60, 70, 48][index]!,
          flowAccelerationMlPerSec2: [120, -40, -90, 30][index]!,
          inletAvailability01: [1, 0.7, 0.4, 1][index]!,
          constraintOwner,
          constraintReactionMmHg: [0, 4, 7, 2][index]!,
          forwardFlowEvidenceStatus:
            index < 3
              ? "within-published-experimental-domain"
              : "above-published-experimental-domain-within-advertised-capacity",
          forwardFlowPublishedExperimentalTraversalUpperLMin: 9,
          forwardFlowAdvertisedCapacityLMin: 10,
          prePumpPressureMmHg: [4, 3, 2, 4][index]!,
          postPumpPressureMmHg: [69, 75, 56, 65][index]!,
          deliveredPumpPressureRiseMmHg: [65, 72, 54, 61][index]!,
        }),
        acceptedEffectiveActivationEventIds:
          index === 1 ? Object.freeze(["effective-v-1"]) : Object.freeze([]),
      });
    })),
    retainedForGraphShapeInspection: true,
    eligibleForNumericalOrPhysiologicalShapeGate: false,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance",
  });
}

function valveEndpoint(
  signedFlowMlPerSec: number,
  leafletOpeningFraction01: number,
  openingTarget01: number,
) {
  const positive = openingTarget01 > 0;
  return Object.freeze({
    signedFlowMlPerSec,
    leafletOpeningFraction01,
    openingTarget01,
    openingDriveState: positive
      ? "positive-opening-target" as const
      : "zero-opening-target" as const,
    activeDirection: signedFlowMlPerSec > 0
      ? "forward" as const
      : signedFlowMlPerSec < 0 ? "reverse" as const : "zero-gradient" as const,
    activeEffectiveOrificeAreaCm2: positive ? 2 : 0,
    forwardEffectiveOrificeAreaCm2: positive ? 2 : 0,
    reverseEffectiveOrificeAreaCm2: 0,
  });
}
