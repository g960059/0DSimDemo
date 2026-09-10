import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";

// Export an already reviewed repository package; no authoring or model imports.
// Usage: npm run export:model-document -- <package.json> <output-directory>
const separator = process.argv.indexOf("--");
const args = separator < 0 ? process.argv.slice(2) : process.argv.slice(separator + 1);
if (args.length !== 2) throw new Error("Expected saved-package.json and output-directory");
const [input, output] = args;
const raw = await readFile(input, "utf8");
const saved = JSON.parse(raw) as SavedModelDocumentV1;
const { contentSha256, ...content } = saved;
if (saved.schemaId !== "circleheart.saved-model-document.v1"
  || createHash("sha256").update(JSON.stringify(content)).digest("hex") !== contentSha256) {
  throw new Error("Unsupported or modified saved document");
}
await mkdir(output, { recursive: true });
for (const locale of ["ja", "en"] as const) {
  await writeFile(path.join(output, `${locale}.html`), savedDocumentOfflineHtmlV1(saved, locale));
  await writeFile(path.join(output, `${locale}.csv`), saved.views[locale].tablesCsv);
}
await writeFile(path.join(output, "document.json"), raw);
console.log(JSON.stringify({ documentId: saved.documentId, output, contentSha256, simulated: false, promoted: false }));
