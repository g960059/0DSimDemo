import { createHash } from "node:crypto";

export const EXACT_MODEL_ARTIFACT_CACHE_CONTROL_V1 =
  "public, max-age=31536000, immutable";

type ExactModelArtifactFetchV1 = typeof fetch;

/**
 * Stores one content-addressed exact artifact and repairs cache metadata only
 * after proving that an existing object contains the same bytes.
 *
 * A metadata repair uses PUT with the byte-identical body. It cannot rebind an
 * exact model path to another executable, and it is safe from CDN stale-byte
 * propagation because both object versions are identical.
 */
export async function uploadImmutableExactModelArtifactV1(
  input: Readonly<{
    artifact: Uint8Array;
    artifactSha256: string;
    baseUrl: string;
    objectName: string;
    secret: string;
  }>,
  fetchV1: ExactModelArtifactFetchV1 = fetch,
): Promise<void> {
  if (sha256V1(input.artifact) !== input.artifactSha256) {
    throw new Error("Local exact model artifact digest is invalid");
  }
  const publicUrl = `${input.baseUrl}/storage/v1/object/public/model-releases/${encodeObjectPathV1(input.objectName)}`;
  const existing = await fetchV1(publicUrl, { cache: "no-store" });
  if (existing.ok) {
    const bytes = new Uint8Array(await existing.arrayBuffer());
    if (sha256V1(bytes) !== input.artifactSha256) {
      throw new Error("Remote exact model path already contains different bytes");
    }
    if (immutableCacheControlV1(existing.headers.get("cache-control"))) return;
    await writeArtifactV1(input, "PUT", fetchV1);
    return;
  }
  if (existing.status !== 400 && existing.status !== 404) {
    throw new Error(`Could not inspect remote model artifact (${existing.status})`);
  }
  await writeArtifactV1(input, "POST", fetchV1);
}

async function writeArtifactV1(
  input: Readonly<{
    artifact: Uint8Array;
    baseUrl: string;
    objectName: string;
    secret: string;
  }>,
  method: "POST" | "PUT",
  fetchV1: ExactModelArtifactFetchV1,
): Promise<void> {
  const upload = await fetchV1(
    `${input.baseUrl}/storage/v1/object/model-releases/${encodeObjectPathV1(input.objectName)}`,
    {
      method,
      headers: {
        apikey: input.secret,
        authorization: `Bearer ${input.secret}`,
        "cache-control": EXACT_MODEL_ARTIFACT_CACHE_CONTROL_V1,
        "content-type": "text/javascript",
        ...(method === "POST" ? { "x-upsert": "false" } : {}),
      },
      body: new Blob([input.artifact], { type: "text/javascript" }),
    },
  );
  if (!upload.ok) {
    throw new Error(
      `Exact model upload failed (${upload.status}): ${await upload.text()}`,
    );
  }
}

function immutableCacheControlV1(value: string | null): boolean {
  if (value === null) return false;
  const normalized = value.toLowerCase();
  const maxAge = /(?:^|,)\s*max-age=(\d+)\s*(?:,|$)/.exec(normalized);
  return normalized.split(",").some((directive) =>
    directive.trim() === "immutable")
    && Number(maxAge?.[1] ?? 0) >= 31_536_000;
}

function encodeObjectPathV1(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function sha256V1(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
