import type { NoteContent } from "@/noteTypes";

export type LessonStep = {
  id: string;
  title: string;
  prompt?: string;
};

export type Lesson = {
  meta: {
    id: string;
    title: string;
    objective?: string;
    level?: string;
  };
  caseId: string;
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
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.meta.id === id);
}
