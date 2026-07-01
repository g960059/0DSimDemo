import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  HILL_SERIES_FIBER_REPLAY_REPORT_ID_V1,
  runHillSeriesFiberReplayBenchV1,
} from "@/engine/mechanics2/benches/HillSeriesFiberReplayBench";
import {
  REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1,
  buildMechanics2InitialReplayFixturesV1,
  validateFiberReplayFixtureV1,
} from "@/engine/mechanics2/fixtures/TraceFixtureV1";

describe("MechanicsCore2 HillSeriesFiberV1 replay gate", () => {
  it("keeps the fixture contract explicit and complete for the first replay gate", () => {
    const fixtures = buildMechanics2InitialReplayFixturesV1();
    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([...REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1]);
    for (const fixture of fixtures) {
      expect(validateFiberReplayFixtureV1(fixture)).toEqual([]);
      expect(fixture.lSUnits).toBe("normalized");
      expect(fixture.provenance.derivedCode).toBe(false);
      expect(fixture.annotation.morphologyProfileId).toBe("normal_sinus_default");
    }
  });

  it("pre-registers the replay gate outside the result artifact", () => {
    const yaml = readFileSync("data/mechanics2/gates/hill-series-fiber-replay-gate-v1.yaml", "utf8");
    expect(yaml).toContain("maxDominantPeakCount: 1");
    expect(yaml).toContain("maxLSeAbsorptionRatio: 0.70");
    expect(yaml).toContain("runtimeImprovement: false");
  });

  it("runs the isolated replay bench without creating runtime claims", () => {
    const report = runHillSeriesFiberReplayBenchV1();
    expect(report.reportId).toBe(HILL_SERIES_FIBER_REPLAY_REPORT_ID_V1);
    expect(report.gateId).toBe("hillSeriesFiberReplayGateV1");
    expect(report.parameterSweepSummary.total).toBe(REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1.length);
    expect(report.parameterSweepSummary.inconclusive).toBe(0);
    expect(["go", "no-go"]).toContain(report.overallStatus);
    expect(typeof report.decision.mayProceedToOneFiberChamber).toBe("boolean");
  });

  it("fails closed on duplicate or non-normalized replay fixtures", () => {
    const fixtures = buildMechanics2InitialReplayFixturesV1();
    const duplicateReport = runHillSeriesFiberReplayBenchV1([...fixtures, fixtures[0]!]);
    expect(duplicateReport.overallStatus).toBe("no-go");
    expect(duplicateReport.decision.mayProceedToOneFiberChamber).toBe(false);
    expect(duplicateReport.decision.reason).toContain("Duplicate fixtures");

    const umFixture = { ...fixtures[0]!, lSUnits: "um" as const };
    expect(validateFiberReplayFixtureV1(umFixture)).toContain("lSUnits must be normalized for MechanicsCore2 V1 replay");
    const unitReport = runHillSeriesFiberReplayBenchV1([umFixture, ...fixtures.slice(1)]);
    expect(unitReport.overallStatus).toBe("no-go");
    expect(unitReport.decision.mayProceedToOneFiberChamber).toBe(false);
  });
});
