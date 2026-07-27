// Minimal source-map position resolver: generated (line,column) -> original source.
import { readFileSync } from "node:fs";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeVlq(segment) {
  const values = []; let shift = 0, value = 0;
  for (const char of segment) {
    const digit = CHARS.indexOf(char);
    if (digit === -1) throw new Error(`bad vlq ${char}`);
    const cont = digit & 32;
    value += (digit & 31) << shift;
    if (cont) shift += 5;
    else { const negate = value & 1; value >>= 1; values.push(negate ? -value : value); value = 0; shift = 0; }
  }
  return values;
}
export function buildIndex(mapPath) {
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const lines = map.mappings.split(";");
  const index = [];
  let sourceIndex = 0, originalLine = 0, originalColumn = 0, nameIndex = 0;
  for (let generatedLine = 0; generatedLine < lines.length; generatedLine++) {
    let generatedColumn = 0;
    const entries = [];
    for (const segment of lines[generatedLine].split(",")) {
      if (segment === "") continue;
      const fields = decodeVlq(segment);
      generatedColumn += fields[0];
      if (fields.length > 1) {
        sourceIndex += fields[1]; originalLine += fields[2]; originalColumn += fields[3];
        if (fields.length > 4) nameIndex += fields[4];
        entries.push({ generatedColumn, source: map.sources[sourceIndex], originalLine: originalLine + 1, name: fields.length > 4 ? map.names[nameIndex] : null });
      }
    }
    index[generatedLine] = entries;
  }
  return index;
}
export function lookup(index, line, column) {
  const entries = index[line] ?? [];
  let best = null;
  for (const entry of entries) {
    if (entry.generatedColumn <= column) best = entry; else break;
  }
  return best;
}
