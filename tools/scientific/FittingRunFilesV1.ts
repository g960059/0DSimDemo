import { writeFile, link, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

/** A complete file becomes visible atomically; existing results are never replaced. */
export async function writeFittingRunTextV1(directory: string, filename: string, text: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) throw new Error("Invalid run filename");
  const target = join(directory, filename), temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, text, { flag: "wx" });
  try { await link(temporary, target); }
  finally { await unlink(temporary); }
  return target;
}
export function writeFittingRunJsonV1(directory: string, filename: string, value: unknown) {
  return writeFittingRunTextV1(directory, filename, JSON.stringify(value, null, 2) + "\n");
}
