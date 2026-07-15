import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2 } from
  "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2";

const repoRoot = process.cwd();
const entryPath =
  "engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2.ts";

describe("No-AVPD atrial Land V2 implementation provenance closure", () => {
  it("hashes every repository-owned runtime import in the state transition", () => {
    const closure = runtimeImportClosure(entryPath);
    const allowlist = new Set<string>(
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2,
    );
    const missing = [...closure].filter((path) => !allowlist.has(path)).sort();
    expect(missing).toEqual([]);
    expect([...allowlist].sort()).toEqual([...closure].sort());
    expect(closure).not.toContain(
      "data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json",
    );
    expect(closure).not.toContain(
      "data/myocardium/protocols/land2017-phase1c-source-protocols.json",
    );
  });
});

function runtimeImportClosure(entry: string): Set<string> {
  const visited = new Set<string>();
  const visit = (relativePath: string): void => {
    if (visited.has(relativePath)) return;
    visited.add(relativePath);
    const absolutePath = resolve(repoRoot, relativePath);
    if (relativePath.endsWith(".json")) return;
    const source = ts.createSourceFile(
      absolutePath,
      readFileSync(absolutePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      const specifier = runtimeModuleSpecifier(statement);
      if (
        specifier == null ||
        (!specifier.startsWith("@/") && !specifier.startsWith("."))
      ) {
        continue;
      }
      visit(resolveRepositoryModule(absolutePath, specifier));
    }
  };
  visit(entry);
  return visited;
}

function runtimeModuleSpecifier(statement: ts.Statement): string | null {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (clause?.isTypeOnly) return null;
    if (
      clause != null &&
      clause.name == null &&
      clause.namedBindings != null &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.every((element) => element.isTypeOnly)
    ) {
      return null;
    }
    return ts.isStringLiteral(statement.moduleSpecifier)
      ? statement.moduleSpecifier.text
      : null;
  }
  if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly || statement.moduleSpecifier == null) return null;
    return ts.isStringLiteral(statement.moduleSpecifier)
      ? statement.moduleSpecifier.text
      : null;
  }
  return null;
}

function resolveRepositoryModule(importer: string, specifier: string): string {
  const base = specifier.startsWith("@/")
    ? resolve(repoRoot, specifier.slice(2))
    : resolve(dirname(importer), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    resolve(base, "index.ts"),
  ];
  const match = candidates.find(existsSync);
  if (match == null) {
    throw new Error(`cannot resolve repository import ${specifier} from ${importer}`);
  }
  return relative(repoRoot, match);
}
