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
