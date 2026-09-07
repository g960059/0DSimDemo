import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETAINED_EXACT_PACKAGE_FILES_V1 as paths, verifyRetainedExactPackageBytesV1 as verify,
  verifyRetainedExactModelPackageV1 as verifyFiles } from "@/tools/registry/verifyRetainedExactModelPackageV1";

const files = () => ({ artifact: readFileSync(paths.artifact),
  client: readFileSync(paths.client, "utf8"), lock: readFileSync(paths.lock, "utf8") });
describe("retained exact package integrity, not current-source reconstruction", () => {
  it("accepts the unchanged active package without building a historical host", () => {
    expect(verifyFiles(process.cwd())).toMatchObject({ scope: "retained-package-integrity" });
  });
  it("fails closed when the comparison reference cannot be read", () => {
    expect(() => verifyFiles(process.cwd(), "refs/heads/nonexistent-retained-package-test")).toThrow();
  });
  it("rejects changed artifact bytes", () => {
    const input = files(); input.artifact[10] ^= 1;
    expect(() => verify(input)).toThrow(/integrity/);
  });
  it("rejects a changed manifest even if its model ID is retained", () => {
    const input = files(), client = JSON.parse(input.client);
    client.manifest.description = "changed manifest";
    expect(() => verify({ ...input, client: JSON.stringify(client) })).toThrow();
  });
  it.each(["modelId", "artifactRevisionId", "artifactSha256"])("rejects a changed lock %s", field => {
    const input = files(), lock = JSON.parse(input.lock);
    lock[field] = "0".repeat(64);
    expect(() => verify({ ...input, lock: JSON.stringify(lock) })).toThrow(/identity|integrity/);
  });
});
