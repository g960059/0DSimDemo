import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { writeNoAvpdPassiveLvEdpvrReportV1 } from "@/tools/mechanics2/runNoAvpdPassiveLvEdpvrV1";

describe("NoAvpdPassiveLvEdpvrV1 report runner", () => {
  it("writes a deterministic, source-hashed raw component report", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "passive-lv-edpvr-"));
    const destination = resolve(directory, "report.json");
    try {
      const artifact = writeNoAvpdPassiveLvEdpvrReportV1(destination);
      const persisted = JSON.parse(readFileSync(destination, "utf8"));
      const { normalizedSha256, ...body } = artifact;

      expect(persisted).toEqual(artifact);
      expect(sha256Json(body)).toBe(normalizedSha256);
      expect(artifact.summary.allPointsAvailable).toBe(true);
      expect(artifact.points).toHaveLength(25);
      expect(artifact.provenance.deterministic).toBe(true);
      expect(artifact.provenance.generatedAtIncluded).toBe(false);
      expect(artifact.provenance.rawPointTreatment).toMatch(
        /no-smoothing-no-decimation/,
      );
      expect(JSON.stringify(artifact)).not.toContain('"generatedAt":');
      for (const source of artifact.provenance.sourceFiles) {
        expect(source.sha256).toBe(
          createHash("sha256")
            .update(readFileSync(resolve(process.cwd(), source.path)))
            .digest("hex"),
        );
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
