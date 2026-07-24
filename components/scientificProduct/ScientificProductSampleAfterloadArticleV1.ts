import {
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
} from "./scientificProductCaseCatalogV1";

import {
  STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID,
  STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID,
  STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID,
  STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
  STUDIO_READER_BRIEF_V1_SCHEMA_ID,
  type StudioAuthorDraftV1,
} from "@/studio/contracts/v1";

export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1 =
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1;
export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1 =
  "sample-afterload/healthy-reference";
export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1 =
  "sample-afterload/systemic-resistance";
export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1 =
  "sample-afterload/reader-inflow";
export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_MODEL_REF_V1 =
  `${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id}`
  + `@${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version}`
  + `:sha256:${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256}`;

/**
 * Bundled authoring fixture for the first Studio-native Reader Preview.
 *
 * This is educational draft content. Its runtime source is the official exact
 * healthy reference. Preview materialization extracts that author-side source
 * into manifest runtime bindings so the resolved Reader document stays
 * publication-neutral. The article, experiment, and preview are neither a
 * publication nor a certified clinical claim.
 */
export const SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1:
StudioAuthorDraftV1 = deepFreezeSampleV1({
  schemaId: STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID,
  draftId: "draft/sample-afterload-reader-preview",
  revision: 0,
  document: {
    schemaId: STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID,
    documentId: "document/sample-afterload-reader-preview",
    revision: 0,
    locale: "ja-JP",
    title: "全身血管抵抗を変えると左室と大動脈の圧はどう動くか",
    blocks: [
      {
        blockId: "afterload-introduction",
        kind: "paragraph",
        text:
          "後負荷は心室が血液を駆出するときに向き合う負荷です。"
          + "この短い実験では、全身血管抵抗のモデル倍率だけを変え、"
          + "左室圧と大動脈圧の瞬時波形を同じ時間軸で観察します。",
      },
      {
        blockId: "afterload-question",
        kind: "heading",
        level: 2,
        text: "観察する問い",
      },
      {
        blockId: "afterload-hypothesis",
        kind: "paragraph",
        text:
          "抵抗倍率を上げると左室が駆出中に克服すべき圧負荷が増え、"
          + "大動脈圧との関係も変わります。"
          + "ただし、表示される値は一時点の読み取りであり、"
          + "一拍平均や臨床的な血圧測定値ではありません。",
      },
      {
        blockId: "afterload-experiment-placement",
        kind: "experiment-placement",
        experimentId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
        readerBriefId:
          SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
      },
      {
        blockId: "afterload-reading-guide",
        kind: "heading",
        level: 2,
        text: "読み方",
      },
      {
        blockId: "afterload-reading-guide-copy",
        kind: "paragraph",
        text:
          "まず倍率1.0で左室圧と大動脈圧の時間関係を確認し、"
          + "次に0.75、1.5、2.0へ切り替えてください。"
          + "単一の瞬時値だけで結論を出さず、波形全体が新しい条件へ"
          + "移る過程と、両圧の相対的な変化を観察します。",
      },
      {
        blockId: "afterload-limitations",
        kind: "heading",
        level: 2,
        text: "このプレビューの限界",
      },
      {
        blockId: "afterload-limitations-copy",
        kind: "paragraph",
        text:
          "操作値はWood単位の実測抵抗ではなく、release基準からの"
          + "モデル倍率です。健康基準モデルの教育用プレビューであり、"
          + "患者固有の状態、診断、治療反応、臨床的妥当性を示しません。"
          + "また、このdraft previewは未認証で、公開物として共有できません。",
      },
    ],
  },
  experiments: [
    {
      schemaId: STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID,
      experimentId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
      revision: 0,
      modelRef: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_MODEL_REF_V1,
      scenarios: [
        {
          scenarioId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
          label: "健康成人のexact periodic基準",
          runtimeSource: {
            kind: "preview-bootstrap",
            sourceId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
            qualification: "uncertified-preview-only",
          },
        },
      ],
      readerBriefs: [
        {
          schemaId: STUDIO_READER_BRIEF_V1_SCHEMA_ID,
          briefId:
            SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
          extent: "inflow",
          graphPanes: [
            {
              schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
              paneId: "afterload-pressure-waveform",
              title: "左室圧と大動脈圧",
              kind: "waveform",
              scenarios: [
                {
                  scenarioId:
                    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
                  label: "健康成人のexact periodic基準",
                  color: "#38bdf8",
                  items: [
                    {
                      itemId: "hemodynamics.pressure.absolute.LV",
                      label: "左室圧",
                      unit: "mmHg",
                      color: "#38bdf8",
                    },
                    {
                      itemId: "hemodynamics.pressure.absolute.Ao",
                      label: "大動脈圧",
                      unit: "mmHg",
                      color: "#f97316",
                    },
                  ],
                },
              ],
              presentation: {
                showLegend: true,
                legendPosition: { xPct: 0.68, yPct: 0.06 },
                showGuides: false,
                timeWindowMs: 5_000,
                pvBeatHistoryCount: null,
                pvBeatHistoryMode: null,
                pvParameterHistoryCount: null,
                pvRelationDisplayMode: null,
                pvRelationPressureBasis: null,
                pvRelationShowSamplePoints: null,
                hemodynamicDetailMode: null,
                hemodynamicParameterHistoryCount: null,
                hemodynamicAllowNegativeFillingPressure: null,
              },
            },
            {
              schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
              paneId: "afterload-lv-pv-loop",
              title: "左室 pressure–volume loop",
              kind: "pv-loop",
              scenarios: [
                {
                  scenarioId:
                    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
                  label: "健康成人のexact periodic基準",
                  color: "#38bdf8",
                  items: [
                    {
                      itemId: "lv",
                      label: "LV pressure–volume loop",
                      unit: null,
                      color: "#a78bfa",
                    },
                  ],
                },
              ],
              presentation: {
                showLegend: true,
                legendPosition: { xPct: 0.63, yPct: 0.06 },
                showGuides: true,
                timeWindowMs: null,
                pvBeatHistoryCount: 8,
                pvBeatHistoryMode: "fade",
                pvParameterHistoryCount: 6,
                pvRelationDisplayMode: "off",
                pvRelationPressureBasis: "intracavitary",
                pvRelationShowSamplePoints: false,
                hemodynamicDetailMode: null,
                hemodynamicParameterHistoryCount: null,
                hemodynamicAllowNegativeFillingPressure: null,
              },
            },
            {
              schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
              paneId: "afterload-guyton-left",
              title: "左心 Guyton / Starling",
              kind: "guyton-left",
              scenarios: [
                {
                  scenarioId:
                    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
                  label: "健康成人のexact periodic基準",
                  color: "#38bdf8",
                  items: [],
                },
              ],
              presentation: {
                showLegend: true,
                legendPosition: { xPct: 0.65, yPct: 0.06 },
                showGuides: false,
                timeWindowMs: null,
                pvBeatHistoryCount: null,
                pvBeatHistoryMode: null,
                pvParameterHistoryCount: null,
                pvRelationDisplayMode: null,
                pvRelationPressureBasis: null,
                pvRelationShowSamplePoints: null,
                hemodynamicDetailMode: "compare",
                hemodynamicParameterHistoryCount: 5,
                hemodynamicAllowNegativeFillingPressure: false,
              },
            },
          ],
          instantaneousReadbacks: [
            {
              readbackId: "instantaneous-left-ventricular-pressure",
              signalId: "hemodynamics.pressure.absolute.LV",
              label: "左室圧（瞬時値）",
              unit: "mmHg",
              sampling: "instantaneous",
            },
            {
              readbackId: "instantaneous-aortic-pressure",
              signalId: "hemodynamics.pressure.absolute.Ao",
              label: "大動脈圧（瞬時値）",
              unit: "mmHg",
              sampling: "instantaneous",
            },
          ],
          controls: [
            {
              controlId: "systemic-resistance-scale",
              label: "全身血管抵抗倍率",
              unit: "× release baseline",
              allowedValues: [0.75, 1, 1.5, 2],
              initialValue: 1,
              binding: {
                parameterKey:
                  "circulation.systemic-vascular-resistance-scale",
                readbackSignalId: null,
                target: {
                  scenarioIds: [
                    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
                  ],
                  application: "absolute",
                },
              },
            },
          ],
        },
      ],
    },
  ],
});

function deepFreezeSampleV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreezeSampleV1(child);
    Object.freeze(value);
  }
  return value;
}
