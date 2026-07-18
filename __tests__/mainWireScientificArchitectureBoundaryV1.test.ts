import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const SCIENTIFIC_ROOT = path.resolve("engine/scientific");

const FORBIDDEN_HOST_GLOBALS = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "indexedDB",
]);

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
        if (
          /ModelCore|previewController|previewWorker|(?:^|\/)case(?:Doc|Persist|Cloud)(?:$|[./])/i
            .test(specifier)
        ) {
          violations.push(`${relative}: legacy runtime import ${specifier}`);
        }
      }
      for (const label of accessedForbiddenHostGlobals(source, relative)) {
        violations.push(`${relative}: host global ${label}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("distinguishes executable host access from comments and diagnostic strings", () => {
    expect(accessedForbiddenHostGlobals(
      'const path = "document.schema"; // window.location\n',
      "diagnostic.ts",
    )).toEqual([]);
    expect(accessedForbiddenHostGlobals(
      'globalThis.document.body; window["location"]; new Worker("x");',
      "host-bound.ts",
    )).toEqual(["Worker", "document", "window"]);
  });

  it("does not confuse greenfield scientific CaseDocument contracts with legacy case modules", () => {
    const scientificCaseDocument =
      "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
    const legacyCaseDocument = "@/caseDoc";
    const legacyPattern =
      /ModelCore|previewController|previewWorker|(?:^|\/)case(?:Doc|Persist|Cloud)(?:$|[./])/i;

    expect(legacyPattern.test(scientificCaseDocument)).toBe(false);
    expect(legacyPattern.test(legacyCaseDocument)).toBe(true);
  });

  it("keeps research document-case transport free of legacy case and runtime imports", () => {
    const transportFiles = [
      "engine/scientific/presets/mainWireScientificResearchPresetCatalogV1.ts",
      "engine/scientific/worker/scientificCommandProtocolV1.ts",
      "engine/scientific/worker/MainWireScientificInProcessKernelV1.ts",
      "engine/scientificBrowser/MainWireScientificWorkerClientV1.ts",
    ];
    const legacyPattern =
      /ModelCore|previewController|previewWorker|(?:^|\/)case(?:Doc|Persist|Cloud)(?:$|[./])/i;
    const violations = transportFiles.flatMap((relative) =>
      importedSpecifiers(readFileSync(path.resolve(relative), "utf8"))
        .filter((specifier) => legacyPattern.test(specifier))
        .map((specifier) => `${relative}: ${specifier}`)
    );
    expect(violations).toEqual([]);
  });
});

/** Parse executable syntax so comments and diagnostic strings such as
 * `document.schema` cannot create false host-coupling findings. */
function accessedForbiddenHostGlobals(
  source: string,
  fileName: string,
): readonly string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAccessExpression(node)
      || ts.isElementAccessExpression(node)
    ) {
      const label = forbiddenHostRoot(node.expression);
      if (label !== null) found.add(label);
    }
    if (
      ts.isNewExpression(node)
      && ts.isIdentifier(node.expression)
      && (node.expression.text === "Worker"
        || node.expression.text === "SharedWorker")
    ) found.add(node.expression.text);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return Object.freeze([...found].sort());
}

function forbiddenHostRoot(expression: ts.Expression): string | null {
  if (
    ts.isIdentifier(expression)
    && FORBIDDEN_HOST_GLOBALS.has(expression.text)
  ) return expression.text;
  if (
    ts.isPropertyAccessExpression(expression)
    && ts.isIdentifier(expression.expression)
    && expression.expression.text === "globalThis"
    && FORBIDDEN_HOST_GLOBALS.has(expression.name.text)
  ) return expression.name.text;
  if (
    ts.isElementAccessExpression(expression)
    && ts.isIdentifier(expression.expression)
    && expression.expression.text === "globalThis"
    && expression.argumentExpression !== undefined
    && ts.isStringLiteral(expression.argumentExpression)
    && FORBIDDEN_HOST_GLOBALS.has(expression.argumentExpression.text)
  ) return expression.argumentExpression.text;
  return null;
}
