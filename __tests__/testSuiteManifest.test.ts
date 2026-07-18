import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FAST_SUITE_FILE_BUDGET,
  PR_SMOKE_SUITE_FILE_BUDGET,
  classifyTestFile,
  fastTests,
  heavyTests,
  isArchivedResearchTest,
  isCanonicalScientificTest,
  regressionTests,
  prSmokeTests,
  rulesTests,
} from "../vitest.suites";

const IGNORED_DIRECTORIES = new Set([
  ".claude",
  ".codex",
  ".firebase",
  ".git",
  "artifacts",
  "dist",
  "node_modules",
]);
const fastFiles = new Set<string>(fastTests);
const regressionFiles = new Set<string>(regressionTests);
const heavyFiles = new Set<string>(heavyTests);
const rulesFiles = new Set<string>(rulesTests);

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
    heavyFiles.has(file) ? "heavy" : null,
    rulesFiles.has(file) ? "rules" : null,
    isCanonicalScientificTest(file) ? "canonical-scientific" : null,
    isArchivedResearchTest(file) ? "archived-research" : null,
  ].filter((value): value is string => value !== null);
}

describe("Vitest suite ownership manifest", () => {
  it("classifies every test file into exactly one suite", () => {
    const problems = discoverTestFiles()
      .map((file) => ({ file, suites: memberships(file) }))
      .filter(({ suites }) => suites.length !== 1);

    expect(problems).toEqual([]);
  });

  it("does not retain stale explicit manifest entries", () => {
    const explicitFiles = [...fastTests, ...regressionTests, ...heavyTests, ...rulesTests];
    const missing = explicitFiles.filter((file) => !existsSync(path.resolve(file)));
    const duplicates = explicitFiles.filter((file, index) => explicitFiles.indexOf(file) !== index);

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

  it("defaults future scientific files away from fast", () => {
    expect(classifyTestFile("__tests__/mainWireFutureExperiment.test.ts"))
      .toBe("canonical-scientific");
    expect(classifyTestFile("__tests__/mechanics2FutureBench.test.ts"))
      .toBe("archived-research");
    expect(classifyTestFile("__tests__/unregisteredFeature.test.ts")).toBeNull();
  });
});
