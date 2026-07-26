import {
  CASE_SCHEMA_VERSION,
  type CaseDocument,
  type CaseInstance,
  type SolverConfig,
} from "@/caseDoc";

/**
 * The numerical corpus the PV-loop morphology diagnostic runs.
 *
 * These four scenarios were extracted from the retired teaching-case catalogue
 * when it was deleted. Only what the diagnostic reads is kept — identity,
 * solver, knob mapping and the scenario instances. Nothing here is teaching
 * content: there are no notes, panels, reading manifests, localized copy,
 * expected findings or model-limitation prose, and none may be added. This is
 * a myocardium-lane fixture, owned by the lane that runs it.
 */
export type MorphologyCorpusEntryV1 = Readonly<{
  id: string;
  title: string;
  schemaVersion: number;
  engineVersion: string;
  knobMappingVersion: string;
  solver: SolverConfig;
  instances: readonly CaseInstance[];
}>;

export const MORPHOLOGY_CASE_CORPUS_IDS_V1 = ["normal-sinus","acute-anterior-mi","systolic-heart-failure","lv-failure-dobutamine"] as const;

export const MORPHOLOGY_CASE_CORPUS_V1: readonly MorphologyCorpusEntryV1[] =
  Object.freeze([
    {
      "id": "normal-sinus",
      "title": "Normal physiology",
      "schemaVersion": 2,
      "engineVersion": "circleheart@0.0.0",
      "knobMappingVersion": "knobmap-0.3-activestress",
      "solver": {
        "dt": 0.001,
        "sampleHz": 120,
        "settleSeconds": 8,
        "recordSeconds": 3
      },
      "instances": [
        {
          "id": "1",
          "name": "Normal",
          "color": "#a855f7",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {},
          "interventions": [],
          "rawPatch": {},
          "targetVolume": 5600
        }
      ]
    },
    {
      "id": "acute-anterior-mi",
      "title": "Acute Anterior MI: when the pump stalls",
      "schemaVersion": 2,
      "engineVersion": "circleheart@0.0.0",
      "knobMappingVersion": "knobmap-0.3-activestress",
      "solver": {
        "dt": 0.001,
        "sampleHz": 120,
        "settleSeconds": 8,
        "recordSeconds": 3
      },
      "instances": [
        {
          "id": "1",
          "name": "Normal",
          "color": "#a855f7",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {},
          "interventions": [],
          "rawPatch": {},
          "targetVolume": 5600
        },
        {
          "id": "2",
          "name": "Acute Anterior MI",
          "color": "#f472b6",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {
            "contractility": 0.45
          },
          "interventions": [],
          "rawPatch": {},
          "targetVolume": 5600
        }
      ]
    },
    {
      "id": "systolic-heart-failure",
      "title": "Systolic Heart Failure (HFrEF)",
      "schemaVersion": 2,
      "engineVersion": "circleheart@0.0.0",
      "knobMappingVersion": "knobmap-0.3-activestress",
      "solver": {
        "dt": 0.001,
        "sampleHz": 120,
        "settleSeconds": 8,
        "recordSeconds": 3
      },
      "instances": [
        {
          "id": "1",
          "name": "Normal",
          "color": "#a855f7",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {},
          "interventions": [],
          "rawPatch": {},
          "targetVolume": 5600
        },
        {
          "id": "2",
          "name": "HFrEF",
          "color": "#f472b6",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {
            "contractility": 0.45,
            "afterload": 1.25,
            "HR": 95
          },
          "interventions": [],
          "rawPatch": {},
          "targetVolume": 5600
        }
      ]
    },
    {
      "id": "lv-failure-dobutamine",
      "title": "Cardiogenic shock: LV failure ± dobutamine",
      "schemaVersion": 2,
      "engineVersion": "circleheart@0.0.0",
      "knobMappingVersion": "knobmap-0.3-activestress",
      "solver": {
        "dt": 0.001,
        "sampleHz": 120,
        "settleSeconds": 8,
        "recordSeconds": 3
      },
      "instances": [
        {
          "id": "1",
          "name": "LV failure",
          "color": "#a855f7",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {},
          "interventions": [
            {
              "uid": "f1",
              "id": "lvPumpFailure",
              "args": {
                "severity": 0.8
              }
            }
          ],
          "rawPatch": {},
          "targetVolume": 5600
        },
        {
          "id": "2",
          "name": "+ Dobutamine",
          "color": "#f472b6",
          "isVisible": true,
          "baseline": "active-normal",
          "knobs": {},
          "interventions": [
            {
              "uid": "f2",
              "id": "lvPumpFailure",
              "args": {
                "severity": 0.8
              }
            },
            {
              "uid": "d",
              "id": "dobutamine",
              "args": {
                "dose": 7
              }
            }
          ],
          "rawPatch": {},
          "targetVolume": 5600
        }
      ]
    }
  ]);

/**
 * Adapts a corpus entry to the document shape the diagnostic's helpers take.
 * The empty collections are deliberate: the diagnostic reads none of them, and
 * filling them would reintroduce the content this corpus exists to leave behind.
 */
export function morphologyCorpusCaseDocumentV1(
  entry: MorphologyCorpusEntryV1,
): CaseDocument {
  return {
    schemaVersion: entry.schemaVersion === 1 ? 1 : CASE_SCHEMA_VERSION,
    engineVersion: entry.engineVersion,
    knobMappingVersion: entry.knobMappingVersion,
    solver: entry.solver,
    meta: { id: entry.id, title: entry.title, createdAt: 0, updatedAt: 0 },
    spec: { title: entry.title, description: "", modelLimitations: [] },
    instances: [...entry.instances],
    panels: [],
  };
}

export function morphologyCorpusCaseDocumentsV1(
  ids: readonly string[],
): CaseDocument[] {
  return ids.map((id) => {
    const entry = MORPHOLOGY_CASE_CORPUS_V1.find(
      (candidate) => candidate.id === id,
    );
    if (entry === undefined) {
      throw new Error(`Morphology corpus case not found: ${id}`);
    }
    return morphologyCorpusCaseDocumentV1(entry);
  });
}
