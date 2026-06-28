import { describe, expect, it } from "vitest";
import {
  loadPvLoopCurrentMainBaselineSnapshotValidationInput,
  validatePvLoopCurrentMainBaselineSnapshot,
  type PvLoopCurrentMainBaselineSnapshotValidationInput,
} from "@/tools/myocardium/verifyPvLoopCurrentMainBaselineSnapshot";

const baseValidationInput =
  loadPvLoopCurrentMainBaselineSnapshotValidationInput(process.cwd());

describe("PV-loop current-main baseline snapshot", () => {
  it("validates the post-PR current-main morphology baseline without acceptance claims", () => {
    const input = fixture();
    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(input.snapshot.baseCommit).toBe("5aecda2d1b494aa74fe6c336dde13e8a585c8bf3");
    expect(input.snapshot.runnerSnapshot.branchCount).toBe(7);
    expect(input.snapshot.runnerSnapshot.metricRowCount).toBe(17304);
    expect(input.snapshot.runnerSnapshot.sampleRowCount).toBe(60572);
    expect(input.snapshot.comparatorSnapshots.fillingLimbDiagnosticComparator)
      .toMatchObject({ groupCount: 42, interpretableGroupCount: 12 });
    expect(input.snapshot.comparatorSnapshots.arterialLoadZcReflectionDiagnosticComparator)
      .toMatchObject({ groupCount: 42, interpretableGroupCount: 42 });
  });

  it("fails if a supported correlation is promoted to acceptance", () => {
    const input = fixture();
    input.snapshot.morphologyEvidenceSnapshot.hypotheses[0].evidenceStatus = "root-cause-accepted";

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_hypotheses");
  });

  it("fails if the baseline provenance drifts", () => {
    const input = fixture();
    input.snapshot.runnerSnapshot.summarySha256 = "missing";

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_runner");
  });

  it("fails if Zc/reflection no-proxy records are promoted", () => {
    const input = fixture();
    input.snapshot.comparatorSnapshots.arterialLoadZcReflectionDiagnosticComparator
      .missingNoProxySignals[0].proxyPolicy = "proxy-allowed";

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_no_proxy");
  });

  it("fails if docs promote root-cause or fix acceptance noun claims", () => {
    const input = fixture();
    input.docs.push({
      path: "docs/status/current-lanes.md",
      text: "This establishes root-cause acceptance and fix acceptance.",
    });

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_forbidden_claim");
  });

  it("fails if a forbidden claim only has unrelated trailing negation", () => {
    const input = fixture();
    input.docs.push({
      path: "docs/status/current-lanes.md",
      text: "The root cause accepted, not provisional.",
    });

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_forbidden_claim");
  });

  it("fails if a forbidden claim uses a negative qualifier instead of a non-claim predicate", () => {
    const input = fixture();
    input.docs.push({
      path: "docs/status/current-lanes.md",
      text: "The root cause accepted is not provisional. Runtime replacement is not optional.",
    });

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_forbidden_claim");
  });

  it("fails if committed provenance leaks local absolute artifact paths", () => {
    const input = fixture();
    input.snapshot.runnerSnapshot.summaryArtifactPath =
      "/Users/hirakawa/tmp/pv-loop-summary.json";

    const validation = validatePvLoopCurrentMainBaselineSnapshot(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_runner");
    expect(validation.errors.map((issue) => issue.code))
      .toContain("pv_loop_current_baseline_local_path");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

type MutableValidationInput = PvLoopCurrentMainBaselineSnapshotValidationInput & {
  snapshot: any;
  docs: any[];
};
