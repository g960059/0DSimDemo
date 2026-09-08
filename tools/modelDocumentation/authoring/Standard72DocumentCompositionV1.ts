import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import historicalDocument from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.json";
import { MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import client from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import binding from "@/studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json";
import launch from "@/studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json";
import eligibility from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import executable from "@/data/model-baselines/standard72-reviewed-executable-v1.json";
import admission from "@/studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import type { MainWireDocumentContentV1 } from "./MainWireDocumentV1";

// A new composition, never a rewrite of historical HTML or assessment identity.
// Reuse is limited to the reviewed identical physical construction. Current
// exact checkpoints, controls, Surface and admission evidence are bound below.
const historical = historicalDocument.scientificRecord.measurements;
const same = (a: unknown, b: unknown) => studioCanonicalJsonStringify(a) === studioCanonicalJsonStringify(b);
if (!same(client.defaultFixture, historical.fixtureIdentity)
  || eligibility.constructionSha256 !== historical.admission.constructionSha256
  || !same(binding.rest, eligibility.observations[0].rest)
  || !same(eligibility.observations.map(o => o.rest), historical.observations.map(o => o.rest))
  || binding.modelId !== client.manifest.modelId
  || binding.priorCheckpointImported !== false
  || launch.checkpointSha256 !== binding.launchPreparation.targetCheckpointSha256
  || launch.checkpointSha256 !== admission.releaseQualification.launchCheckpointSha256
  || surface.surfaceReleaseId !== admission.releaseQualification.surfaceReleaseId) {
  throw new Error("Documentation cannot reuse evidence for a changed construction or mismatched exact/Surface release");
}

const numerical = launch.baseStandardCheckpointV2.numericalCheckpoint;
const base = numerical.coronary.baseCheckpointV2;
const equations = {
  ...historicalDocument.scientificRecord.equations,
  schemaId: "main-wire-reference-construction-equation-data-v1",
  initial: {
    timeSec: launch.acceptedTimeSec, totalBloodVolumeMl: base.fixedGlobalTotalBloodVolumeMl,
    volumesMl: base.circulation.state.nodeVolumesMl, valveStates: base.circulation.state.valveStates,
    coronary: base.coronary.acceptedState, mechanics: base.mechanics.materialState,
    rhythm: numerical.composedRhythm.acceptedState, shorteningReference: base.mvcReferenceState,
    coronaryAutoregulation: numerical.coronary.coronaryAutoregulation,
  },
  // Physical-coefficient provenance belongs to the saved construction. The
  // initial-state source is this exact model's checkpoint, not its predecessor.
  sources: [
    ...historicalDocument.scientificRecord.equations.sources.filter(s => !s.path.endsWith("standard71-launch-checkpoint.json")),
    { path: "studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json",
      sha256: createHash("sha256").update(readFileSync("studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json")).digest("hex") },
  ],
};

const measurements = {
  schemaId: "main-wire-model-documentation-snapshot-v1",
  modelId: client.manifest.modelId, surfaceReleaseId: surface.surfaceReleaseId,
  surfaceSeriesId: surface.surfaceSeriesId, baselineId: "standard72-reference-baseline-4935-hr70-v1",
  releaseStatus: "local-candidate-not-registered", clinicalNormalityClaimed: false,
  fixtureIdentity: client.defaultFixture, settings: client.manifest.primitiveControlCatalog,
  material: historical.material, calcium: historical.calcium, assembly: historical.assembly,
  qualification: {
    cycles: binding.cycles, classification: binding.classification, checkpoint: binding.checkpoint,
    launchPreparation: binding.launchPreparation, parity: binding.parity,
    inheritedQualification: binding.inheritedQualification,
  },
  admission: {
    policy: eligibility.policy, constructionSha256: eligibility.constructionSha256,
    status: eligibility.status, sources: eligibility.sources, implementation: eligibility.implementation,
    referenceFlags: eligibility.referenceFlags, pressureRateQuality: eligibility.pressureRateQuality,
    reserve: eligibility.reserve, evidenceTrustBoundary: eligibility.evidenceTrustBoundary,
  },
  observations: eligibility.observations.map((observation, index) => ({
    dtSec: historical.observations[index].dtSec,
    rest: observation.rest, native: observation.native, tau: observation.tau,
    checks: historical.observations[index].checks, measurements: historical.observations[index].measurements,
    shape: historical.observations[index].shape, reserveMeasurement: historical.observations[index].reserveMeasurement,
  })),
  evidence: historical.evidence, morphologyPolicy: historical.morphologyPolicy,
  settlementPolicy: historical.settlementPolicy, tauPolicy: historical.tauPolicy,
  provenance: {
    generator: "tools/modelDocumentation/generateSavedModelDocumentV1.tsx",
    bindingSha256: admission.releaseQualification.binding,
    admissionSource: binding.sources.admission,
    evidenceSha256: historical.provenance.evidenceSha256,
    inheritedScientificDocumentId: historicalDocument.documentId,
    inheritedScientificDocumentSha256: historicalDocument.contentSha256,
    reuseScope: "Identical physical coefficients and reviewed 2/1 ms, morphology and preload-reserve evidence; Standard72 cold replay is bound at 2 ms. No new fine-grid or reserve experiment.",
  },
  checkpointSemantics: {
    checkpointId: launch.checkpointId,
    predictorCheckpointId: launch.coupledPredictor.checkpointId,
    coupledPredictor: launch.coupledPredictor,
    scope: "Checkpoint includes accepted coupled-solver predictor history. Continuation requires the same exact model and compatible runtime; this does not change the physical model or imply cross-engine bit equality.",
  },
  surfaceDefinition: surface,
  executableQualification: executable,
  registryAdmission: admission,
};

export const STANDARD72_DOCUMENT_COMPOSITION_V1 = {
  documentId: "standard72-document-v1",
  measurements,
  content: {
    ...measurements, title: "Main Wire Standard 72", equations,
    moduleIds: MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1,
    analysisMethods: executable.analysisCapabilities,
    copy: {
      release: { ja: "研究・教育用 · ローカル採択候補（公開登録前）· 臨床的妥当性は未確立", en: "Research and education · local candidate, not publicly registered · not clinically validated" },
      changes: {
        ja: "Standard71と同じ物理構成・係数を使い、連立計算の予測に必要な過去の受理状態をexact checkpointへ保存するStandard72です。心筋・Ca源・弁・血管の式や採択基準は変更していません。最新の互換Model Surfaceと、そのESPVR・EDPVR・Starling・PVA/PE解析を引き継ぎます。",
        en: "Standard72 uses the same physical construction and coefficients as Standard71, and persists accepted coupled-solver predictor history in its exact checkpoint. Myocardial, calcium, valve and vascular equations and assessment criteria are unchanged. It inherits the latest compatible Model Surface and its ESPVR, EDPVR, Starling and PVA/PE analyses.",
      },
      provenance: {
        ja: "Standard72自身の初期状態から2 msで再計算し、周期定常状態と起動状態を保存しました。1 ms・波形・preload reserveの評価は、同一物理構成の保存された研究記録に基づき、Standard72で新しく実行した試験ではありません。checkpointは連立計算の予測履歴も保持します。同一ブラウザーエンジン・同一artifact内の継続を検証しており、異なるエンジン間のビット一致は主張しません。Standard71の文書と評価は独立した履歴として保存しています。",
        en: "Standard72 was cold-replayed at 2 ms and has its own periodic and launch checkpoints. Fine-grid, waveform and preload-reserve assessments reuse saved evidence from the identical physical construction; they are not new Standard72 experiments. Checkpoints also retain coupled-solver predictor history. Continuation was checked within the same browser engine and artifact, without a cross-engine bit-equality claim. Standard71 documentation and assessments remain independent historical records.",
      },
      assessment: { ja: "保存された採択基準への適合を確認したローカルbaseline候補です。公開登録と臨床的な正常性の保証は別です。", en: "This local baseline candidate meets the saved eligibility criteria. Public registration and clinical normality are separate." },
      records: [
        { ja: "2 ms · Standard72独立再実行と一致", en: "2 ms · matched independent Standard72 replay" },
        { ja: "1 ms · 同一物理構成の継承研究記録", en: "1 ms · inherited identical physical research construction" },
      ],
    },
  } satisfies MainWireDocumentContentV1,
};
