import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";

export const fittingFileSha256V1 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const member = (name: string) => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) throw new Error("Invalid sealed-run member name");
  return name;
};
type Item = { filename: string; sha256: string };
type Seal = { schemaId: string; sourceSha256: string; archive: Item;
  results: Item[]; files: { path: string; sha256: string }[] };

/** Validate an archived run once; each selected member must be in its seal.
 * This checks file integrity, not current physiological or numerical validity. */
export async function readSealedFittingRunV1(directory: string) {
  const root = resolve(directory), sealPath = join(root, "execution.source.json");
  const seal = JSON.parse(await readFile(sealPath, "utf8")) as Seal;
  if (seal.schemaId !== "fitting-source-snapshot-v1" || !Array.isArray(seal.files) || !Array.isArray(seal.results)
    || fittingFileSha256V1(JSON.stringify(seal.files)) !== seal.sourceSha256
    || new Set(seal.results.map(i => i.filename)).size !== seal.results.length
    || new Set(seal.files.map(i => i.path)).size !== seal.files.length) throw new Error("Invalid fitting source inventory");
  for (const item of [seal.archive, ...seal.results]) {
    if (!/^[a-f0-9]{64}$/.test(item.sha256)
      || fittingFileSha256V1(await readFile(join(root, member(item.filename)))) !== item.sha256)
      throw new Error(`Sealed fitting file differs: ${item.filename}`);
  }
  return { seal, directory: root, sealPath,
    readJson: async (name: string) => {
      const filename = member(name), item = seal.results.find(i => i.filename === filename);
      if (!item) throw new Error(`File is not part of the sealed run: ${filename}`);
      const bytes = await readFile(join(root, filename), "utf8");
      if (fittingFileSha256V1(bytes) !== item.sha256) throw new Error(`Sealed fitting file changed: ${filename}`);
      return JSON.parse(bytes) as unknown;
    },
  };
}
export async function readSealedFittingFileV1(path: string) {
  const run = await readSealedFittingRunV1(dirname(resolve(path)));
  return { ...run, value: await run.readJson(basename(path)) };
}
