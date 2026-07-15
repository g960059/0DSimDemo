import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { computeCanonicalSha256 } from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID } from "@/tools/myocardium/phaseB1PairedTerminalWaveformArtifactV1";
import {
  buildPhaseB1PairedTerminalWaveformReviewHtmlV1,
} from "@/tools/myocardium/phaseB1PairedTerminalWaveformHtmlV1";
import {
  parseRenderPhaseB1PairedTerminalWaveformHtmlArgsV1,
  renderPhaseB1PairedTerminalWaveformHtmlFileV1,
} from "@/tools/myocardium/renderPhaseB1PairedTerminalWaveformHtmlV1";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe("Phase B1 paired terminal waveform self-contained HTML", () => {
  it("verifies the payload, leaves raw SI unchanged, and declares every requested view", () => {
    const artifact = pairedArtifact();
    const rawBefore = JSON.stringify(artifact);
    const html = buildPhaseB1PairedTerminalWaveformReviewHtmlV1(artifact, sha256);

    expect(JSON.stringify(artifact)).toBe(rawBefore);
    expect(html.startsWith("<!doctype html>\n<html lang=\"ja\">"))
      .toBe(true);
    expect(html).toContain(`data-source-artifact-sha256="${artifact.contentSha256}"`);
    for (const chamber of ["LA", "LV", "RA", "RV"]) {
      expect(html).toContain(`id + " pressure–volume loop"`);
      expect(html).toContain(`display[mode].volume[id][index]`);
      expect(html).toContain(`display[mode].pressure[id][index]`);
      expect(html).toContain(chamber);
    }
    for (const valve of ["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"]) {
      expect(html).toContain(valve);
    }
    expect(html).toContain("Four-chamber pressure waveforms");
    expect(html).toContain("Four-valve signed flow waveforms");
    expect(html).toContain("const PA_PER_MMHG = 133.322387415");
    expect(html).toContain("const M3_TO_ML = 1e6");
    expect(html).toContain("const M3_PER_SEC_TO_ML_PER_SEC = 1e6");
    expect(html).toContain('replace(/\\.$/, "")');
    expect(html).not.toContain('replace(/.$/, "")');
    expect(html).toContain("SLS-offで8の字トポロジーを保持することは合否条件ではありません");
    expect(html).toContain("Project-synthetic · test-only · physiology unverified");
    expect(html).toContain("canonical payload hashのみ検証");
    expect(html).toContain(hash("common-parent"));
    expect(html).toContain(hash("off-terminal"));
    expect(html).toContain(hash("on-terminal"));
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
    const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(inlineScript).toBeDefined();
    expect(() => new Function(inlineScript ?? "")).not.toThrow();
  });

  it("rejects canonical payload drift before rendering", () => {
    const artifact = pairedArtifact();
    const tampered = structuredClone(artifact);
    tampered.waveforms.off.chamberBloodVolumeM3.LA[1] += 1e-6;
    expect(() => buildPhaseB1PairedTerminalWaveformReviewHtmlV1(tampered, sha256))
      .toThrow(/contentSha256 does not match/i);
  });

  it("rejects shape drift even when the modified payload is rehashed", () => {
    const artifact = pairedArtifact();
    const malformed = structuredClone(artifact);
    malformed.waveforms.on.valveFlowM3PerSec.Q_MV.pop();
    const { contentSha256: _old, ...payload } = malformed;
    malformed.contentSha256 = computeCanonicalSha256(payload, sha256);
    expect(() => buildPhaseB1PairedTerminalWaveformReviewHtmlV1(malformed, sha256))
      .toThrow(/length must match phaseSec/i);
  });

  it("renders atomically from explicit input/output paths without rewriting input", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "paired-waveform-html-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "paired.json");
    const outputPath = path.join(directory, "nested", "review.html");
    const rawJson = `${JSON.stringify(pairedArtifact(), null, 2)}\n`;
    await writeFile(inputPath, rawJson, "utf8");

    const options = parseRenderPhaseB1PairedTerminalWaveformHtmlArgsV1([
      "--input", inputPath, "--output", outputPath,
    ]);
    await renderPhaseB1PairedTerminalWaveformHtmlFileV1(options);

    expect(await readFile(inputPath, "utf8")).toBe(rawJson);
    expect(await readFile(outputPath, "utf8"))
      .toContain("Four-valve signed flow waveforms");
    expect((await readdir(path.dirname(outputPath))).filter((name) =>
      name.endsWith(".tmp"))).toEqual([]);
    expect(() => parseRenderPhaseB1PairedTerminalWaveformHtmlArgsV1([
      "--input", inputPath, "--output", inputPath,
    ])).toThrow(/raw JSON remains unchanged/i);
  });
});

function pairedArtifact() {
  const waveforms = {
    off: waveform(1),
    on: waveform(1.08),
  };
  const payload = {
    artifactId: PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
    status: "authenticated-in-process-sls-off-on-terminal-waveform-pair-for-visual-qa",
    sourceAuthentication: {
      bothTerminalObservationsBuilderIssuedInProcess: true,
      bothConvergedTerminalCapsulesAuthenticatedInProcess: true,
      bothMatchingCommittedCycleEnergyAuditsAuthenticatedInProcess: true,
      sameComparisonManifestObjectIdentity: true,
      sameInitialSourceParityAuditObjectIdentity: true,
      sameParentManifestObjectIdentity: true,
      sameParentNumericalEvidenceObjectIdentity: true,
      sameScheduleObjectIdentity: true,
      periodicDefinitionsAreModeSpecific: true,
      periodicDefinitionHashEqualityRequired: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
    },
    units: {
      phase: "s",
      volume: "m3",
      absolutePressure: "Pa",
      signedFlow: "m3/s",
      valuesConvertedForPresentation: false,
    },
    pair: {
      modeOrder: ["off", "on"],
      gridRole: "coarse",
      nominalDtSec: 0.001,
      canonicalCycleLengthSec: 0.8,
      sameNominalGridAndCanonicalCycle: true,
      slsOffPhysicalSlsEnabled: false,
      slsOnPhysicalSlsEnabled: true,
    },
    modeDiagnostics: {
      off: { slsMode: "off", selectedSampleCount: 4 },
      on: { slsMode: "on", selectedSampleCount: 4 },
    },
    commonSourceHashes: {
      parentManifestContentSha256: hash("common-parent"),
      scheduleContentSha256: hash("common-schedule"),
    },
    modeSourceHashes: {
      off: {
        periodicDefinitionContentSha256: hash("off-definition"),
        terminalTimestepObservationContentSha256: hash("off-terminal"),
      },
      on: {
        periodicDefinitionContentSha256: hash("on-definition"),
        terminalTimestepObservationContentSha256: hash("on-terminal"),
      },
    },
    waveforms,
    interpretationBoundary: {
      visualQaProjectionOnly: true,
      pairOutcomeUsedAsPassFailGate: false,
      atrialPvTopologyPreservationRequired: false,
      atrialPvTopologyGenerationOrErasurePreordained: false,
      matchedVolumeAttributionComputed: false,
      serializationReauthenticationSupported: false,
    },
    negativeClaims: {
      causalEffectOfSlsEstablished: false,
      atrialPvFigureEightTopologyEvaluated: false,
      physiologicalValidationPass: false,
    },
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  };
  return {
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256),
  };
}

function waveform(multiplier: number) {
  const phaseSec = [0, 0.2, 0.5, 0.8];
  const volumes = {
    LA: [45, 62, 51, 45],
    LV: [70, 120, 85, 70],
    RA: [52, 68, 58, 52],
    RV: [75, 125, 90, 75],
  };
  const pressures = {
    LA: [7, 12, 8, 7],
    LV: [8, 118, 30, 8],
    RA: [4, 7, 5, 4],
    RV: [4, 28, 12, 4],
  };
  const flows = {
    Q_MV: [0, 240, 65, 0],
    Q_AoV: [0, 0, 330, 0],
    Q_TV: [0, 260, 80, 0],
    Q_PuV: [0, 0, 310, 0],
  };
  return {
    sampleIndex: [0, 1, 2, 3],
    phaseSec,
    nominalGridIndex: [0, 200, 500, 800],
    sourceKind: phaseSec.map(() => "requested-segment-exit-endpoint"),
    eventKeysAtEnd: phaseSec.map(() => []),
    chamberBloodVolumeM3: Object.fromEntries(Object.entries(volumes).map(
      ([id, values]) => [id, values.map((value) => value * 1e-6 * multiplier)],
    )),
    compartmentAbsolutePressurePa: {
      ...Object.fromEntries(Object.entries(pressures).map(
        ([id, values]) => [id, values.map((value) => value * 133.322387415 * multiplier)],
      )),
      SA: pressures.LV.map((value) => value * 133.322387415),
      SV: pressures.RA.map((value) => value * 133.322387415),
      PA: pressures.RV.map((value) => value * 133.322387415),
      PV: pressures.LA.map((value) => value * 133.322387415),
    },
    valveFlowM3PerSec: Object.fromEntries(Object.entries(flows).map(
      ([id, values]) => [id, values.map((value) => value * 1e-6 * multiplier)],
    )),
    allClosedLoopFlowM3PerSec: {},
  };
}

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}

function hash(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}
