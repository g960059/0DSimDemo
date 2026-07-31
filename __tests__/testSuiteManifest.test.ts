import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FAST_SUITE_FILE_BUDGET,
  PR_SMOKE_SUITE_FILE_BUDGET,
  canonicalScientificTests,
  classifyTestFile,
  fastTests,
  regressionTests,
  prSmokeTests,
} from "../vitest.suites";

const IGNORED_DIRECTORIES = new Set([
  ".claude",
  ".codex",
  ".git",
  "artifacts",
  "dist",
  "node_modules",
]);
const fastFiles = new Set<string>(fastTests);
const regressionFiles = new Set<string>(regressionTests);
const canonicalScientificFiles = new Set<string>(canonicalScientificTests);

function discoverTestFiles(directory = process.cwd()): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...discoverTestFiles(absolute));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(path.relative(process.cwd(), absolute).split(path.sep).join("/"));
    }
  }

  return files.sort();
}

function memberships(file: string): string[] {
  return [
    fastFiles.has(file) ? "fast" : null,
    regressionFiles.has(file) ? "regression" : null,
    canonicalScientificFiles.has(file) ? "canonical-scientific" : null,
  ].filter((value): value is string => value !== null);
}

describe("Vitest suite ownership manifest", () => {
  it("classifies every test file into exactly one suite", () => {
    const problems = discoverTestFiles()
      .map((file) => ({ file, suites: memberships(file) }))
      .filter(({ suites }) => suites.length !== 1);

    expect(problems).toEqual([]);
  });

  it("keeps every explicit suite inventory nonempty, current, and unique", () => {
    const inventories: Readonly<Record<string, readonly string[]>> = {
      fast: fastTests,
      regression: regressionTests,
      "canonical-scientific": canonicalScientificTests,
    };
    const empty = Object.entries(inventories)
      .filter(([, files]) => files.length === 0)
      .map(([suite]) => suite);
    const explicitFiles = Object.values(inventories).flat();
    const missing = explicitFiles.filter((file) => !existsSync(path.resolve(file)));
    const duplicates = explicitFiles.filter((file, index) => explicitFiles.indexOf(file) !== index);

    expect(empty).toEqual([]);
    expect(missing).toEqual([]);
    expect(duplicates).toEqual([]);
  });

  it("keeps the fast suite bounded and free of research naming markers", () => {
    const researchMarkers = /(?:Bench|Calibration|Envelope|Replay|Artifact|Attribution)|(?:^|[._/-])(?:bench|calibration|envelope|replay|artifact|attribution)(?=[._/-])/;

    expect(fastTests.length).toBeLessThanOrEqual(FAST_SUITE_FILE_BUDGET);
    expect(fastTests.filter((file) => researchMarkers.test(file))).toEqual([]);
  });

  it("keeps the PR smoke gate bounded and limited to registered tests", () => {
    const registered = new Set(discoverTestFiles());
    const duplicates = prSmokeTests.filter((file, index) =>
      prSmokeTests.indexOf(file) !== index);

    expect(prSmokeTests.length).toBeLessThanOrEqual(PR_SMOKE_SUITE_FILE_BUDGET);
    expect(prSmokeTests.filter((file) => !registered.has(file))).toEqual([]);
    expect(duplicates).toEqual([]);
  });

  it("keeps classifyTestFile consistent with the ownership checks", () => {
    const inconsistent = discoverTestFiles().filter((file) => {
      const [onlySuite] = memberships(file);
      return classifyTestFile(file) !== onlySuite;
    });

    expect(inconsistent).toEqual([]);
  });

  it("routes registered scientific files and rejects unregistered test families", () => {
    expect(classifyTestFile("__tests__/mainWireIntegratedModelTransactionV3.test.ts"))
      .toBe("canonical-scientific");
    expect(classifyTestFile("__tests__/mainWireFutureExperiment.test.ts"))
      .toBeNull();
    expect(classifyTestFile("__tests__/mechanics2FutureBench.test.ts")).toBeNull();
    expect(classifyTestFile("__tests__/unregisteredFeature.test.ts")).toBeNull();
  });
});
