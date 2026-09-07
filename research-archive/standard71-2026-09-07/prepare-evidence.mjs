// Archival branch utility, not production infrastructure. Run from repository root.
// Existing simulation records are copied byte-for-byte; no fitting or re-scoring.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir, stat, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const destination = 'research-archive/standard71-2026-09-07';
const evidence = `${destination}/evidence.tar.gz`;
const required = new Set([
  'artifacts/physiology-evaluation-2026-09-07/admission-coarse-confirmation-v1/same-material-TBV4935.result.json',
  'artifacts/physiology-evaluation-2026-09-07/volume-midpoint-fine-v1/same-material-TBV4935.result.json',
]);
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const p = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(p) : entry.isFile() ? [p] : [];
  }));
  return nested.flat().sort();
}
async function digest(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}
const records = [];
const allowed = new Set(['.md', '.json', '.ts', '.tsx', '.mjs', '.png', '.svg', '.csv', '.html', '.diff']);
for (const file of await walk('artifacts')) {
  const bytes = (await stat(file)).size;
  const downloaded = file.endsWith('.pdf') || /(?:manuscript|references)\//.test(file) || /manuscript.*\.txt$/.test(file);
  const browserDuplicate = /\/browser\//.test(file);
  const included = !downloaded && !browserDuplicate && allowed.has(path.extname(file)) && (bytes <= 2_000_000 || required.has(file));
  records.push({ path: file, bytes, sha256: await digest(file), included,
    reason: included ? required.has(file) ? 'selected-admission-original-input' : 'report-protocol-source-or-compact-evidence'
      : downloaded ? 'third-party-document-not-redistributed'
      : browserDuplicate ? 'repeat-browser-artifact-local-only'
      : 'large-exploratory-or-operational-record-local-only' });
  if (included && file.endsWith('.md')) {
    const output = `${destination}/${file}`;
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(file, output);
  }
}
for (const file of required) if (!records.some(record => record.path === file && record.included)) throw new Error(`Missing selected evidence: ${file}`);

// Final reviewer prose is preserved verbatim when only a CLI transcript existed.
// Operational envelopes are not published; retain their file hashes in inventory.
const reviews = [];
for (const record of records.filter(record => /review.*\.jsonl$/.test(record.path))) {
  const events = (await readFile(record.path, 'utf8')).split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } });
  const result = events.findLast(event => event?.type === 'result' && typeof event.result === 'string');
  const init = events.find(event => event?.type === 'system' && event?.subtype === 'init');
  if (!result) continue;
  const output = `${destination}/${record.path.replace(/\.jsonl$/, '.final.md')}`;
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, result.result);
  reviews.push({ source: record.path, sourceSha256: record.sha256, output, model: init?.model ?? null,
    isError: result.is_error ?? null, resultSubtype: result.subtype ?? null });
}
await mkdir(destination, { recursive: true });
const list = records.filter(record => record.included).map(record => record.path).join('\n') + '\n';
// Explicit inventory only: never archive .env, credentials, third-party PDFs,
// working-tree metadata, node_modules, or a broad parent directory.
execFileSync('tar', ['-czf', evidence, '-T', '-'], { cwd: root, input: list, env: { ...process.env, COPYFILE_DISABLE: '1' } });
const inventory = {
  schemaId: 'standard71-research-evidence-archive-v1',
  sourceBaseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceWasUncommitted: true,
  scope: 'Research lane in this worktree, 2026-09-05 through 2026-09-07; not the entire project history.',
  bundle: { path: evidence, bytes: (await stat(evidence)).size, sha256: await digest(evidence) },
  preservedCount: records.filter(record => record.included).length,
  omittedCount: records.filter(record => !record.included).length,
  omittedFilesAreNotBackedUpByThisArchive: true,
  originalFilesDeleted: false,
  reviews,
  files: records,
};
await writeFile(`${destination}/inventory.json`, JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify({ bundle: inventory.bundle, preservedCount: inventory.preservedCount, omittedCount: inventory.omittedCount, reviewFinals: reviews.length }));
