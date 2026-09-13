import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";

/**
 * Infrastructure-neutral SHA-256 over Studio canonical JSON. Application code
 * uses this for portable identities (plan digests, capture hashes) without
 * importing the engine integrity package; the serialization is the same
 * canonical form, so digests agree with engine-side canonical JSON digests.
 */
export async function sha256StudioCanonicalJsonHex(value: unknown): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto subtle.digest is required for SHA-256 identities");
  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(studioCanonicalJsonStringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
