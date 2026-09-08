import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve, basename } from "node:path";

/** Verify the local execution archive and unchanged numerical implementation.
 * Presentation/CLI edits do not invalidate a scientific run. The caller must
 * separately re-observe its qualification policy; this is provenance, not a vote.
 */
export async function readBoundFittingQualificationV1(filename: string) {
  const input = resolve(filename), raw = await readFile(input);
  const sha = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
  const source = JSON.parse(await readFile(`${input}.source.json`, "utf8"));
  if (source.schemaId !== "fitting-source-snapshot-v1"
    || !Array.isArray(source.files) || source.sourceSha256 !== sha(Buffer.from(JSON.stringify(source.files)))
    || !source.results.some((r: { filename: string; sha256: string }) => r.filename === basename(input) && r.sha256 === sha(raw))
    || sha(await readFile(resolve(dirname(input), source.archive.filename))) !== source.archive.sha256) {
    throw new Error("Qualification execution source archive/result binding differs");
  }
  for (const file of source.files) {
    if (["engine/", "domain/", "studio/integrations/"].some(prefix => file.path.startsWith(prefix))
      && sha(await readFile(resolve(file.path))) !== file.sha256) throw new Error(`Qualification numerical source changed: ${file.path}; rerun qualification`);
  }
  return { qualification: JSON.parse(raw.toString("utf8")), executionSourceSha256: source.sourceSha256 };
}
