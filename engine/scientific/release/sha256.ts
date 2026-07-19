import {
  canonicalJsonStringify,
} from "@/engine/scientific/release/canonicalJson";

export const RELEASE_DIGEST_ALGORITHM_V1 = "SHA-256" as const;
export const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

export class ReleaseDigestUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseDigestUnavailableError";
  }
}

/** Browser/Node-neutral SHA-256. Engine code intentionally has no node:crypto import. */
export async function sha256TextHex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new ReleaseDigestUnavailableError(
      "Web Crypto subtle.digest is required for release identity",
    );
  }
  if (typeof globalThis.TextEncoder !== "function") {
    throw new ReleaseDigestUnavailableError(
      "TextEncoder is required for release identity",
    );
  }
  const digest = await subtle.digest(
    RELEASE_DIGEST_ALGORITHM_V1,
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256CanonicalJsonHex(value: unknown): Promise<string> {
  return sha256TextHex(canonicalJsonStringify(value));
}
