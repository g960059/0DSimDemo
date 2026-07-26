/**
 * Print the test-suite inventory from the suite registry.
 *
 * CI used to count canonical files with `find __tests__ -name 'mainWire*'`,
 * which is not the registry's answer: some mainWire files are promoted to fast,
 * and the canonical lane additionally owns exact coronary files. Reporting a
 * number that does not match the suite that actually runs makes the gate
 * unreliable, so both come from `classifyTestFile` here.
 *
 * Usage: vite-node --script tools/testing/printSuiteInventory.ts [--canonical-only]
 */
import { readdirSync, type Dirent } from "node:fs";
import path from "node:path";

import { classifyTestFile, type TestSuiteName } from "@/vitest.suites";

const ROOTS = ["__tests__", "engine/__tests__", "components/__tests__"];

function discover(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
        out.push(absolute.split(path.sep).join("/"));
      }
    }
  };
  walk(root);
  return out;
}

const files = ROOTS.flatMap(discover).sort();
const counts = new Map<TestSuiteName | "unclassified", number>();
for (const file of files) {
  const suite = classifyTestFile(file) ?? "unclassified";
  counts.set(suite, (counts.get(suite) ?? 0) + 1);
}

const canonical = counts.get("canonical-scientific") ?? 0;
const unclassified = counts.get("unclassified") ?? 0;

if (process.argv.includes("--canonical-only")) {
  process.stdout.write(`${canonical}\n`);
} else {
  for (const [suite, count] of [...counts].sort()) {
    process.stdout.write(`${suite}=${count}\n`);
  }
  process.stdout.write(`total=${files.length}\n`);
}

if (unclassified > 0) {
  process.stderr.write(`${unclassified} test file(s) are not classified into any suite\n`);
  process.exit(1);
}
