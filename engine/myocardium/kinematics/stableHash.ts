export function stableHash(value: unknown): string {
  const text = stableCanonicalStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function sanitizeForStableHash(value: unknown): unknown {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundForStableHash(value) : String(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeForStableHash);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, sanitizeForStableHash(child)]),
    );
  }
  return value;
}

export function roundForStableHash(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

export function stableCanonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableCanonicalStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return `{${entries.map(([key, child]) =>
    `${JSON.stringify(key)}:${stableCanonicalStringify(child)}`).join(",")}}`;
}
