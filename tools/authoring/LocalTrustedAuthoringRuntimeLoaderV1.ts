import { readFileSync } from "node:fs";

import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  DynamicExactModelRuntimeLoaderV2,
} from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";

const LOCAL_STANDARD_ARTIFACT_V1 = new URL(
  "../../studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.artifact.mjs",
  import.meta.url,
);

/**
 * AI authoring deliberately executes only the reviewed artifact checked into
 * the installed CircleHeart source tree. The registry ticket still pins and
 * validates the exact manifest and Surface release, but remote ESM is never
 * evaluated in the authenticated CLI process.
 *
 * A future multi-model CLI must move dynamic artifacts into a tokenless,
 * permission-restricted subprocess before widening this boundary.
 */
export class LocalTrustedAuthoringRuntimeLoaderV1 {
  readonly #loader = new DynamicExactModelRuntimeLoaderV2(async () => {
    const bytes = readFileSync(LOCAL_STANDARD_ARTIFACT_V1);
    const owned = Uint8Array.from(bytes);
    return Object.freeze({
      ok: true,
      status: 200,
      async arrayBuffer() {
        return owned.buffer.slice(
          owned.byteOffset,
          owned.byteOffset + owned.byteLength,
        );
      },
    });
  });

  load(
    ticket: StudioModelWorkerReleaseTicketV2,
  ): Promise<ResolvedExactModelRuntimeV2> {
    return this.#loader.load(ticket);
  }
}
