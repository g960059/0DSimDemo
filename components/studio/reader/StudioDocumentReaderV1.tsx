import * as React from "react";

import type {
  ScientificProductReaderExperimentControllerV1,
} from "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";
import type { ResolvedReaderDocumentV1 } from "@/studio/contracts/v1";

import { StudioDocumentSurfaceV1 } from "../StudioDocumentSurfaceV1";

export type StudioDocumentReaderV1Props = Readonly<{
  document: ResolvedReaderDocumentV1;
  controllerForPlacement(
    placementBlockId: string,
  ): ScientificProductReaderExperimentControllerV1 | null;
  registryForPlacement(
    placementBlockId: string,
  ): ScientificProductRuntimeRegistryPortV1 | null;
}>;

/**
 * Read-capability projection of the shared document surface.
 *
 * A published resolver must feed this same surface rather than introduce a
 * second published-only Reader implementation.
 */
export function StudioDocumentReaderV1(props: StudioDocumentReaderV1Props) {
  return <StudioDocumentSurfaceV1 {...props} capability="read" />;
}
