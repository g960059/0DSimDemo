export class ExactExecutableArtifactModuleLoadErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio V2 exact executable artifact rejected: ${message}`);
    this.name = "ExactExecutableArtifactModuleLoadErrorV2";
  }
}

/**
 * Evaluates one self-contained ESM artifact from the exact supplied bytes.
 *
 * Browser realms use a short-lived Blob URL. Node-based trusted verification
 * uses a data URL because Node's ESM loader does not support Blob URLs. A
 * self-contained artifact cannot resolve imports relative to either URL, so
 * the deterministic registry build must inline every dependency.
 */
export async function importExactExecutableArtifactModuleV2(
  executableArtifact: Uint8Array,
): Promise<Readonly<Record<string, unknown>>> {
  if (
    !(executableArtifact instanceof Uint8Array)
    || executableArtifact.byteLength === 0
  ) {
    throw new ExactExecutableArtifactModuleLoadErrorV2(
      "artifact must be a nonempty Uint8Array",
    );
  }
  const ownedArtifact = new Uint8Array(executableArtifact);
  const moduleUrl = exactArtifactModuleUrlV2(ownedArtifact);
  try {
    const loaded: unknown = await import(/* @vite-ignore */ moduleUrl.url);
    if (loaded === null || typeof loaded !== "object") {
      throw new ExactExecutableArtifactModuleLoadErrorV2(
        "artifact did not evaluate to an ESM namespace",
      );
    }
    return loaded as Readonly<Record<string, unknown>>;
  } catch (error) {
    if (error instanceof ExactExecutableArtifactModuleLoadErrorV2) throw error;
    throw new ExactExecutableArtifactModuleLoadErrorV2(
      `artifact could not be evaluated: ${errorMessageV2(error)}`,
    );
  } finally {
    moduleUrl.revoke();
  }
}

function exactArtifactModuleUrlV2(
  executableArtifact: Uint8Array,
): Readonly<{ url: string; revoke(): void }> {
  if (
    !isNodeRuntimeV2()
    && typeof Blob !== "undefined"
    && typeof URL.createObjectURL === "function"
    && typeof URL.revokeObjectURL === "function"
  ) {
    const url = URL.createObjectURL(new Blob([
      new Uint8Array(executableArtifact),
    ], { type: "text/javascript" }));
    return Object.freeze({
      url,
      revoke() {
        URL.revokeObjectURL(url);
      },
    });
  }
  return Object.freeze({
    url: `data:text/javascript;base64,${base64EncodeV2(executableArtifact)}`,
    revoke() {},
  });
}

function isNodeRuntimeV2(): boolean {
  return typeof process !== "undefined"
    && process.versions?.node !== undefined;
}

function base64EncodeV2(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const chunks: string[] = [];
  let chunk = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const second = hasSecond ? bytes[index + 1]! : 0;
    const third = hasThird ? bytes[index + 2]! : 0;
    chunk += alphabet[first >>> 2]
      + alphabet[((first & 0x03) << 4) | (second >>> 4)]
      + (hasSecond
        ? alphabet[((second & 0x0f) << 2) | (third >>> 6)]
        : "=")
      + (hasThird ? alphabet[third & 0x3f] : "=");
    if (chunk.length >= 32_768) {
      chunks.push(chunk);
      chunk = "";
    }
  }
  if (chunk.length > 0) chunks.push(chunk);
  return chunks.join("");
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
