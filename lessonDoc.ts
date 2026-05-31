import type { NoteContent } from "@/noteTypes";
import type { CaseDocument } from "@/caseDoc";
import { caseDocumentToSimInstances, isCaseDisplayable } from "@/caseDoc";
import { officialCaseById } from "@/officialCases";
import { listUserLessons } from "@/lessonPersist";

export type LessonStep = {
  id: string;
  title?: string;
  note: NoteContent;
  stage: StageManifest;
};

export type PanelKey = "waveform" | "pvloop" | "metrics";

export type StageManifest = {
  visibleInstances: string[];
  visiblePanels?: PanelKey[];
  challenge?: {
    kind: "predict" | "free";
    prompt?: string;
    revealLabel?: string;
  };
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
