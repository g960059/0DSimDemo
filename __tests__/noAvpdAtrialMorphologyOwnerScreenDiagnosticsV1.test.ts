import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { NoAvpdFourChamberBenchResultV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1 } from "@/engine/mechanics2/diagnostics/NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1", () => {
  it("reconstructs the established dt5 baseline without applying an E/A gate", () => {
    const report = JSON.parse(
      readFileSync(
        resolve(
          repoRoot,
          "data/mechanics2/reports/no-avpd-four-chamber-hill-triseg-settled-report-v1.json",
        ),
        "utf8",
      ),
    ) as NoAvpdFourChamberBenchResultV1;
    const diagnostics =
      summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1(report);

    expect(diagnostics.availability).toBe("available");
    expect(diagnostics.eaSeparationObjectiveApplied).toBe(false);
    expect(diagnostics.eaSeparationGateApplied).toBe(false);
    expect(diagnostics.continuousEaReadback?.gateApplied).toBe(false);
    expect(diagnostics.matchedVolume?.availability).toBe("available");
    expect(diagnostics.matchedVolume?.overlapWidthMl).toBeCloseTo(
      11.976315917574212,
      8,
    );
    expect(diagnostics.matchedVolume?.gapMmHg?.mean).toBeCloseTo(
      0.26880296582985913,
      8,
    );
    expect(diagnostics.matchedVolume?.integratedGapAreaMmHgMl).toBeCloseTo(
      3.0773780849784855,
      8,
    );

    const aLoop = diagnostics.aLoopMorphology;
    expect(aLoop?.sequenceAvailability).toBe("available-complete-max-min-max");
    expect(aLoop?.primaryPeak?.pressureMmHg).toBeCloseTo(12.09933416, 6);
    expect(aLoop?.interveningTrough?.pressureMmHg).toBeCloseTo(10.93605952, 6);
    expect(aLoop?.latePeak?.pressureMmHg).toBeCloseTo(11.652905765, 6);
    expect(aLoop?.rebound.amplitudeMmHg).toBeCloseTo(0.716846247, 6);
    expect(aLoop?.primaryPeak?.corner?.absoluteTurnAngleDeg).toBeCloseTo(
      67.6173,
      3,
    );
    expect(
      aLoop?.onsetToPrimaryRiseKinetics.thinFilament10To90?.rise10To90Ms,
    ).toBeGreaterThan(0);
    expect(
      aLoop?.onsetToPrimaryRiseKinetics.lapActiveRise10To90?.rise10To90Ms,
    ).toBeGreaterThan(0);

    expect(diagnostics.mvcSeriesFraction?.availability).toBe("available");
    expect(
      diagnostics.mvcSeriesFraction?.readback?.seriesFractionOfLaPressure,
    ).toBeGreaterThan(0.6);
    expect(
      diagnostics.hemodynamics?.fixedPhaseWindowProxies.lvEjectionFraction01,
    ).toBe(report.reportOnlyPhysiology.lvEjectionFraction01);
  });
});
