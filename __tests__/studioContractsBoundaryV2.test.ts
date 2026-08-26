import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Studio V2 dependency boundary", () => {
  it("keeps Studio domain and application code independent from engine and UI", () => {
    const studioRoot = path.resolve(process.cwd(), "studio");
    const problems = typescriptFiles(studioRoot)
      .filter((file) => !relative(file).startsWith("studio/integrations/"))
      .flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [
        /(?:from|import\()\s*["'][^"']*(?:\/engine\/|@\/engine\/)/.test(source)
          ? `${relative(file)} imports engine`
          : null,
        /(?:from|import\()\s*["'][^"']*(?:react|components\/)/.test(source)
          ? `${relative(file)} imports presentation/host code`
          : null,
      ].filter((problem): problem is string => problem !== null);
      });

    expect(problems).toEqual([]);
  });

  it("isolates engine imports inside explicit Studio integrations", () => {
    const integrationRoot = path.resolve(process.cwd(), "studio/integrations");
    const sources = typescriptFiles(integrationRoot).map((file) => ({
      file: relative(file),
      source: readFileSync(file, "utf8"),
    }));
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some(({ source }) =>
      /(?:from|import\()\s*["'][^"']*@\/engine\//.test(source))).toBe(true);
    expect(sources.flatMap(({ file, source }) =>
      /(?:from|import\()\s*["'][^"']*(?:react|components\/)/.test(source)
        ? [`${file} imports presentation/host code`]
        : [])).toEqual([]);
  });

  it("keeps domain, analysis, and application dependencies pointed inward", () => {
    const checks = [
      {
        directory: "domain",
        forbidden:
          /(?:from|import\()\s*["'][^"']*@\/(?:analysis|components|engine|runtime|server|studio|supabase)\//,
        reason: "imports an outer layer",
      },
      {
        directory: "analysis/contracts",
        forbidden:
          /(?:from|import\()\s*["'][^"']*@\/(?:analysis\/methods|components|engine|runtime|server|supabase|studio\/(?:application|analysis|composition|infrastructure|integrations|presentation|workers))\//,
        reason: "imports a model family or implementation",
      },
      {
        directory: "analysis/methods",
        forbidden:
          /(?:from|import\()\s*["'][^"']*@\/(?:components|server|supabase|studio\/(?:application|composition|infrastructure|integrations|presentation|workers))\//,
        reason: "imports UI or concrete infrastructure",
      },
      {
        directory: "studio/application",
        forbidden:
          /(?:from|import\()\s*["'][^"']*@\/(?:components|server|supabase|studio\/(?:infrastructure|integrations|presentation))\//,
        reason: "imports UI or concrete infrastructure",
      },
    ] as const;
    const problems = checks.flatMap(({ directory, forbidden, reason }) =>
      typescriptFiles(path.resolve(process.cwd(), directory)).flatMap((file) =>
        forbidden.test(readFileSync(file, "utf8"))
          ? [`${relative(file)} ${reason}`]
          : []));

    expect(problems).toEqual([]);
  });

  it("does not retain the superseded Studio V1 implementation tree", () => {
    const sources = typescriptFiles(path.resolve(process.cwd(), "studio"))
      .map(relative);
    expect(sources.filter((file) => (
      file.startsWith("studio/contracts/v1/")
      || file.startsWith("studio/adapters/mainWire/")
      || file.startsWith("studio/infrastructure/artifacts/")
    ))).toEqual([]);
    expect(existsSync(path.resolve(
      process.cwd(),
      "studio/application/runtime/SimulationSessionCoordinatorV1.ts",
    ))).toBe(false);

    const publicSources = [
      "studio/index.ts",
      "studio/application/index.ts",
      "studio/application/runtime/index.ts",
    ].map((file) => readFileSync(path.resolve(process.cwd(), file), "utf8"))
      .join("\n");
    expect(publicSources).not.toMatch(/contracts\/v1|AdapterV1|CoordinatorV1/);
  });

  it("keeps the Supabase spine aligned with neutral Snapshots and Placement-owned Briefing", () => {
    const migration = readFileSync(path.resolve(
      process.cwd(),
      "supabase/migrations/20260809000100_active_model_bundle.sql",
    ), "utf8").replaceAll('"', "").toLowerCase();
    const snapshotTable = sqlBlock(
      migration,
      "create table if not exists studio.experiment_snapshots",
      "comment on table studio.experiment_snapshots",
    );
    const placementProjection = sqlBlock(
      migration,
      "create table if not exists studio.article_snapshot_refs",
      "comment on table studio.article_snapshot_refs",
    );
    const articleSave = sqlBlock(
      migration,
      "create or replace function public.save_article_v1",
      "alter function public.save_article_v1",
    );

    expect(snapshotTable).not.toMatch(/\bkind\b|\bbriefing\b|qualification|settlement/);
    expect(snapshotTable).toContain("content_id uuid not null");
    expect(snapshotTable).not.toContain("source_experiment_id");
    expect(migration).toContain(
      "create table if not exists studio.experiment_snapshot_sources",
    );
    expect(placementProjection).toContain("briefing jsonb not null");
    expect(articleSave).toContain("project_article_snapshot_refs_v1");
    expect(articleSave).not.toContain("p_snapshot_refs");
    expect(migration).toContain("commit_admitted_experiment_snapshot_v1");
    expect(migration).toContain("operation_receipts");
  });
});

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(absolute);
    return entry.isFile()
      && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      ? [absolute]
      : [];
  });
}

function relative(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}

function sqlBlock(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}
