import { canonicalJsonStringify } from "@/engine/integrity/canonicalJson";

export const SHA256_DIGEST_ALGORITHM_V1 = "SHA-256" as const;
export const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

export class Sha256DigestUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Sha256DigestUnavailableError";
  }
}

/** Browser/Node-neutral SHA-256 used for persisted-data integrity guards. */
export async function sha256TextHex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Sha256DigestUnavailableError(
      "Web Crypto subtle.digest is required for SHA-256 integrity",
    );
  }
  if (typeof globalThis.TextEncoder !== "function") {
    throw new Sha256DigestUnavailableError(
      "TextEncoder is required for SHA-256 integrity",
    );
  }
  const digest = await subtle.digest(
    SHA256_DIGEST_ALGORITHM_V1,
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

/** Browser/Node-neutral SHA-256 for an already canonical binary image. */
export async function sha256BytesHex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Sha256DigestUnavailableError(
      "Web Crypto subtle.digest is required for SHA-256 integrity",
    );
  }
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("SHA-256 binary input must be a Uint8Array");
  }
  const owned = new Uint8Array(bytes);
  const digest = await subtle.digest(SHA256_DIGEST_ALGORITHM_V1, owned);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256CanonicalJsonHex(value: unknown): Promise<string> {
  return sha256TextHex(canonicalJsonStringify(value));
}
