import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadResumeReport,
  writeNoAvpdFourChamberHillTriSegReportV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("NoAvpdFourChamberHillTriSeg report checkpoint", () => {
  it("round-trips an accepted checkpoint and rejects content tampering", () => {
    const directory = mkdtempSync(join(tmpdir(), "no-avpd-report-v1-"));
    temporaryDirectories.push(directory);
    const reportPath = join(directory, "report.json");
    const report = writeNoAvpdFourChamberHillTriSegReportV1({
      beats: 1,
      dtSec: 0.005,
      sampleEverySteps: 10,
      sampleRetention: "last-two-complete-beats",
    }, reportPath);

    const checkpoint = loadResumeReport(reportPath, report.parameterSha256, 0.005);
    expect(checkpoint.initialState).toEqual(report.finalState);
    expect(checkpoint.provenance.sourceNormalizedSha256).toBe(report.normalizedSha256);
    expect(checkpoint.provenance.sourceImplementationSha256)
      .toBe(report.implementationSha256);

    const tampered = JSON.parse(readFileSync(reportPath, "utf8")) as {
      finalState: { volumes: { leftAtriumMl: number } };
    };
    tampered.finalState.volumes.leftAtriumMl += 1;
    writeFileSync(reportPath, `${JSON.stringify(tampered, null, 2)}\n`);

    expect(() => loadResumeReport(reportPath, report.parameterSha256, 0.005))
      .toThrow(/normalized hash does not match/);
  });
});
