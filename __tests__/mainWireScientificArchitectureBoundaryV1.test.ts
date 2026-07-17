import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SCIENTIFIC_ROOT = path.resolve("engine/scientific");

const FORBIDDEN_SOURCE_PATTERNS = [
  { label: "window", pattern: /\b(?:globalThis\.)?window\s*(?:\.|\[)/ },
  { label: "document", pattern: /\b(?:globalThis\.)?document\s*(?:\.|\[)/ },
  { label: "localStorage", pattern: /\b(?:globalThis\.)?localStorage\b/ },
  { label: "sessionStorage", pattern: /\b(?:globalThis\.)?sessionStorage\b/ },
  { label: "indexedDB", pattern: /\b(?:globalThis\.)?indexedDB\b/ },
  { label: "Worker", pattern: /\bnew\s+(?:Shared)?Worker\b/ },
] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".ts") ? [absolute] : [];
  });
}

function importedSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]!);
  }
  return specifiers;
}

describe("single scientific core architecture boundary", () => {
  it("keeps scientific source independent of UI, persistence, and host APIs", () => {
    const violations: string[] = [];

    for (const file of sourceFiles(SCIENTIFIC_ROOT)) {
      const relative = path.relative(process.cwd(), file).split(path.sep).join("/");
      const source = readFileSync(file, "utf8");
      for (const specifier of importedSpecifiers(source)) {
        const allowed = specifier.startsWith(".") || specifier.startsWith("@/engine/");
        if (!allowed) violations.push(`${relative}: forbidden import ${specifier}`);
        if (/ModelCore|previewController|previewWorker|case(?:Doc|Persist|Cloud)/i.test(specifier)) {
          violations.push(`${relative}: legacy runtime import ${specifier}`);
        }
      }
      for (const { label, pattern } of FORBIDDEN_SOURCE_PATTERNS) {
        if (pattern.test(source)) violations.push(`${relative}: host global ${label}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
