import type { NoteContent } from "@/noteTypes";
import type { CaseDocument, CaseLessonLayer } from "@/caseDoc";
import { caseDocumentToSimInstances, isCaseDisplayable } from "@/caseDoc";
import type { KnobKey } from "@/engine/knobs";
import { officialCaseById } from "@/officialCases";
import { listUserLessons } from "@/lessonPersist";

export type LessonStep = {
  id: string;
  title?: string;
  note: NoteContent;
  stage: StageManifest;
};

export type PanelKey = "waveform" | "pvloop" | "metrics";
export type NumericKnobKey = Exclude<KnobKey, "baroreflexEnabled">;

export type StageManifest = {
  visibleInstances: string[];
  visiblePanels?: PanelKey[];
  challenge?: {
    kind: "predict" | "free";
    prompt?: string;
    revealLabel?: string;
  };
  exposedKnobs?: NumericKnobKey[];
  knobInstanceId?: string;
  initialState?: Partial<Record<NumericKnobKey, number>>;
};

export type Lesson = {
  meta: {
    id: string;
    title: string;
    objective?: string;
    level?: string;
    createdAt?: number;
  };
  caseId?: string;
  case?: CaseDocument;
  noteSpine: NoteContent;
  steps?: LessonStep[];
};

export const LESSONS: Lesson[] = [
  {
    meta: {
      id: "normal-reference",
      title: "Normal Physiology Reference",
      objective: "Read baseline waveforms and metrics before comparing disease states.",
      level: "Intro",
    },
    caseId: "normal-sinus",
    noteSpine: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Start with the normal operating point. Use this as the anchor for pressure, loop, and output comparisons.", styles: {} }],
      },
      {
        type: "quiz",
        props: {
          question: "Which stage panel summarizes cardiac output and blood pressure most directly?",
          options: "PV Loop|Metrics|Waveforms",
          answerIndex: "1",
        },
      },
      {
        type: "controller_ref",
        props: { paramKey: "contractility", label: "Contractility control" },
      },
    ],
  },
  {
    meta: {
      id: "lv-failure-inotrope",
      title: "LV Failure and Dobutamine",
      objective: "Compare low-output LV failure with an inotrope response.",
      level: "Case",
    },
    caseId: "lv-failure-dobutamine",
    noteSpine: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "The failure case depresses LV pump function. Dobutamine raises contractility, improving output while reducing congestion.", styles: {} }],
      },
      {
        type: "equation",
        props: { tex: "CO = HR \\times SV" },
      },
      {
        type: "quiz",
        props: {
          question: "After dobutamine, which direction should cardiac output move?",
          options: "Down|Up|No change",
          answerIndex: "1",
        },
      },
    ],
    steps: [
      {
        id: "predict-dobutamine",
        title: "Predict the inotrope response",
        note: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "First inspect LV failure alone. Predict how adding dobutamine will change output and filling pressure before revealing the treated trace.", styles: {} }],
          },
          {
            type: "quiz",
            props: {
              question: "What should dobutamine do to cardiac output in this low-contractility state?",
              options: "Lower it|Raise it|Leave it unchanged",
              answerIndex: "1",
            },
          },
        ],
        stage: {
          visibleInstances: ["1"],
          exposedKnobs: ["contractility"],
          knobInstanceId: "1",
          challenge: {
            kind: "predict",
            prompt: "Make your prediction before revealing the treated trace.",
            revealLabel: "Reveal dobutamine",
          },
        },
      },
      {
        id: "reveal-dobutamine",
        title: "Reveal the dobutamine response",
        note: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Now compare LV failure with + Dobutamine. Output and arterial pressure recover while congestion falls.", styles: {} }],
          },
          {
            type: "equation",
            props: { tex: "CO = HR \\times SV" },
          },
        ],
        stage: {
          visibleInstances: ["1", "2"],
        },
      },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.meta.id === id)
    ?? listUserLessons().find((lesson) => lesson.meta.id === id);
}

export function resolveLessonCase(lesson: Lesson): CaseDocument | undefined {
  if (lesson.case) {
    try {
      if (!isCaseDisplayable(lesson.case)) return undefined;
      caseDocumentToSimInstances(lesson.case);
      return lesson.case;
    } catch {
      return undefined;
    }
  }
  return lesson.caseId ? officialCaseById(lesson.caseId) : undefined;
}

export function lessonLayerFromLesson(lesson: Lesson): CaseLessonLayer {
  return {
    noteSpine: lesson.noteSpine,
    ...(lesson.meta.objective ? { objective: lesson.meta.objective } : {}),
    ...(lesson.meta.level ? { level: lesson.meta.level } : {}),
    ...(lesson.steps ? { steps: lesson.steps.map((step) => ({
      id: step.id,
      ...(step.title ? { title: step.title } : {}),
      note: step.note,
      stage: {
        visibleInstances: step.stage.visibleInstances,
        ...(step.stage.visiblePanels ? { visiblePanels: step.stage.visiblePanels } : {}),
        ...(step.stage.challenge ? { challenge: step.stage.challenge } : {}),
        ...(step.stage.exposedKnobs ? { exposedKnobs: step.stage.exposedKnobs } : {}),
        ...(step.stage.knobInstanceId ? { knobInstanceId: step.stage.knobInstanceId } : {}),
        ...(step.stage.initialState ? { initialState: step.stage.initialState } : {}),
      },
    })) } : {}),
  };
}

export function caseDocumentToLesson(doc: CaseDocument): Lesson | undefined {
  if (!doc.lesson) return undefined;
  return {
    meta: {
      id: doc.meta.id,
      title: doc.spec.title || doc.meta.title,
      ...(doc.lesson.objective ? { objective: doc.lesson.objective } : {}),
      ...(doc.lesson.level ? { level: doc.lesson.level } : {}),
      createdAt: doc.meta.createdAt,
    },
    case: doc,
    noteSpine: doc.lesson.noteSpine,
    ...(doc.lesson.steps ? { steps: doc.lesson.steps.map((step) => ({
      id: step.id,
      ...(step.title ? { title: step.title } : {}),
      note: step.note,
      stage: {
        visibleInstances: step.stage.visibleInstances,
        ...(step.stage.visiblePanels ? { visiblePanels: step.stage.visiblePanels as PanelKey[] } : {}),
        ...(step.stage.challenge ? { challenge: step.stage.challenge } : {}),
        ...(step.stage.exposedKnobs ? { exposedKnobs: step.stage.exposedKnobs as NumericKnobKey[] } : {}),
        ...(step.stage.knobInstanceId ? { knobInstanceId: step.stage.knobInstanceId } : {}),
        ...(step.stage.initialState ? { initialState: step.stage.initialState as Partial<Record<NumericKnobKey, number>> } : {}),
      },
    })) } : {}),
  };
}

export function lessonToCaseDocument(lesson: Lesson): CaseDocument | undefined {
  const caseDoc = resolveLessonCase(lesson);
  if (!caseDoc) return undefined;
  return {
    ...caseDoc,
    kind: "lesson",
    meta: {
      ...caseDoc.meta,
      id: lesson.meta.id,
      title: lesson.meta.title,
      createdAt: lesson.meta.createdAt ?? caseDoc.meta.createdAt,
    },
    spec: {
      ...caseDoc.spec,
      title: lesson.meta.title,
    },
    lesson: lessonLayerFromLesson(lesson),
  };
}
