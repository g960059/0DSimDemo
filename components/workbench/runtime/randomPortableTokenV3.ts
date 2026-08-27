export function randomPortableTokenV3(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}
