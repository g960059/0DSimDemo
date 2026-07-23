import type {
  MainWireIntegratedPreviewMcsPresetIdV1,
  MainWireIntegratedPreviewRunArtifactV1,
  MainWireIntegratedPreviewRunPresentationV1,
} from "@/engine/scientific/integratedPreview";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID =
  "circleheart-integrated-preview-command-protocol-v1" as const;

type CommandBase<TKind extends string> = Readonly<{
  protocolId: typeof INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID;
  kind: TKind;
  requestId: string;
  sessionId: string;
}>;

export type IntegratedPreviewCreateSessionCommandV1 =
  CommandBase<"createSession"> & Readonly<{
    mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1;
  }>;
export type IntegratedPreviewRunNextBeatCommandV1 =
  CommandBase<"runNextBeat">;
export type IntegratedPreviewDisposeSessionCommandV1 =
  CommandBase<"disposeSession">;

export type IntegratedPreviewCommandV1 =
  | IntegratedPreviewCreateSessionCommandV1
  | IntegratedPreviewRunNextBeatCommandV1
  | IntegratedPreviewDisposeSessionCommandV1;

export type IntegratedPreviewSuccessResponseV1 = Readonly<{
  protocolId: typeof INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID;
  ok: true;
  requestId: string;
  sessionId: string;
  commandKind: IntegratedPreviewCommandV1["kind"];
  releaseRef: SimulationReleaseRef;
  artifact: MainWireIntegratedPreviewRunArtifactV1 | null;
  presentation: MainWireIntegratedPreviewRunPresentationV1 | null;
  disposed: boolean;
}>;

export type IntegratedPreviewErrorResponseV1 = Readonly<{
  protocolId: typeof INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  commandKind: IntegratedPreviewCommandV1["kind"] | null;
  releaseRef: SimulationReleaseRef | null;
  error: Readonly<{
    code:
      | "invalid-command"
      | "duplicate-session-id"
      | "unknown-session-id"
      | "session-capacity-exceeded"
      | "command-failed";
    message: string;
  }>;
}>;

export type IntegratedPreviewCommandResponseV1 =
  | IntegratedPreviewSuccessResponseV1
  | IntegratedPreviewErrorResponseV1;
