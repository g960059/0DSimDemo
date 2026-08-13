import type {
  RegisteredModelExecutableBundleV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
} from "@/studio/contracts/v2/simulation";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  importExactExecutableArtifactModuleV2,
} from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  freezeExactRuntimeV2,
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

const MAXIMUM_EXACT_MODEL_ARTIFACT_BYTES_V2 = 32 * 1024 * 1024;

type ArtifactFetchResponseV2 = Readonly<{
  ok: boolean;
  status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export type ExactModelArtifactFetchPortV2 = (
  url: string,
) => Promise<ArtifactFetchResponseV2>;

/**
 * Worker-side exact runtime loader. Registry identity and ABI choose the
 * artifact and export. The client performs schema/binding checks but never
 * computes or compares a release digest.
 */
export class DynamicExactModelRuntimeLoaderV2 {
  readonly #fetchArtifact: ExactModelArtifactFetchPortV2;
  readonly #runtimePromises = new Map<string, Readonly<{
    canonicalTicket: string;
    promise: Promise<ResolvedExactModelRuntimeV2>;
  }>>();

  constructor(
    fetchArtifact: ExactModelArtifactFetchPortV2 = defaultArtifactFetchV2,
  ) {
    this.#fetchArtifact = fetchArtifact;
  }

  load(ticketValue: unknown): Promise<ResolvedExactModelRuntimeV2> {
    const ticket = validateStudioModelWorkerReleaseTicketV2(ticketValue);
    const canonicalTicket = studioCanonicalJsonStringify(ticket);
    const cached = this.#runtimePromises.get(ticket.modelId);
    if (cached !== undefined) {
      if (cached.canonicalTicket !== canonicalTicket) {
        return Promise.reject(new Error(
          "Exact modelId was requested with another immutable release ticket",
        ));
      }
      return cached.promise;
    }
    const pending = this.#loadUncached(ticket);
    const entry = Object.freeze({ canonicalTicket, promise: pending });
    this.#runtimePromises.set(ticket.modelId, entry);
    void pending.catch(() => {
      if (this.#runtimePromises.get(ticket.modelId) === entry) {
        this.#runtimePromises.delete(ticket.modelId);
      }
    });
    return pending;
  }

  async #loadUncached(
    ticket: StudioModelWorkerReleaseTicketV2,
  ): Promise<ResolvedExactModelRuntimeV2> {
    const response = await this.#fetchArtifact(ticket.artifactUrl);
    if (!response.ok) {
      throw new Error(`Exact model artifact fetch failed (${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAXIMUM_EXACT_MODEL_ARTIFACT_BYTES_V2) {
      throw new Error("Exact model artifact size is outside the supported range");
    }
    const namespace = await importExactExecutableArtifactModuleV2(
      new Uint8Array(buffer),
    );
    const exportName = "createCircleHeartExactModelReleaseV1";
    const factory = namespace[exportName];
    if (typeof factory !== "function") {
      throw new Error(`Exact model artifact does not export ${exportName}`);
    }
    const produced = await factory();
    const release = exactExecutableReleaseRecordV2(produced);
    if (
      studioCanonicalJsonStringify(release.manifest)
      !== studioCanonicalJsonStringify(ticket.manifest)
    ) {
      throw new Error("Exact model artifact manifest does not match the registry");
    }
    const composed = composeStandardModelContractV1(
      ticket.manifest,
      ticket.surfaceRelease,
    );
    validateExecutableBundleV2(release.executables, composed.contract, {
      requiresPresentationBatch: ticket.manifest.capabilities.includes(
        STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
      ),
    });
    return freezeExactRuntimeV2(release.executables, composed.contract);
  }
}

function exactExecutableReleaseRecordV2(
  value: unknown,
): Readonly<{
  manifest: ExactModelKernelManifestV3;
  executables: RegisteredModelExecutableBundleV2;
}> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error("Exact model artifact factory must return a plain object");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = ["executables", "manifest"];
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      `Exact model artifact release must contain exactly ${expected.join(", ")}`,
    );
  }
  for (const key of expected) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) {
      throw new Error(`Exact model artifact release ${key} must be data`);
    }
  }
  return Object.freeze({
    manifest: record.manifest as ExactModelKernelManifestV3,
    executables: record.executables as RegisteredModelExecutableBundleV2,
  });
}

async function defaultArtifactFetchV2(url: string): Promise<ArtifactFetchResponseV2> {
  return fetch(url, {
    cache: "default",
    credentials: "omit",
    redirect: "error",
  });
}
