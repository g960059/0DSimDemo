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

// Stepless reading-mode lessons. None carry `steps`, so every official lesson
// routes through ReadingPresenter (a single-column article that auto-derives its
// reading column from the case's panels). The rendered prose lives in the case's
// notes.p_note (see officialCases.ts); noteSpine here is the short summary line
// required by the Lesson type, NOT the rendered article.
const sp = (text: string): NoteContent => [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }];

export const LESSONS: Lesson[] = [
  {
    meta: {
      id: "normal-reference",
      title: "Normal Physiology Reference",
      objective: "Learn to read the four core panels — waveforms, PV loop, metrics, and controls — at a normal resting operating point, so you have an anchor to compare every disease case against.",
      level: "Beginner",
    },
    caseId: "normal-sinus",
    noteSpine: sp("Start with the normal operating point. Use this as the anchor for pressure, loop, and output comparisons."),
  },
  {
    meta: {
      id: "acute-anterior-mi",
      title: "Acute Anterior MI: when the pump stalls",
      objective: "Recognize how an isolated loss of anterior-wall contractility narrows the LV PV loop, drops SV and CO, and raises left atrial pressure.",
      level: "Beginner",
    },
    caseId: "acute-anterior-mi",
    noteSpine: sp("Acute anterior MI as a sudden, isolated contractility problem: a smaller PV loop, lower output, higher filling pressure."),
  },
  {
    meta: {
      id: "systolic-heart-failure",
      title: "Systolic Heart Failure (HFrEF)",
      objective: "Understand how a weak left ventricle lowers stroke volume and cardiac output, raises filling pressure, and reshapes the PV loop.",
      level: "Beginner",
    },
    caseId: "systolic-heart-failure",
    noteSpine: sp("How a failing left ventricle changes the pressure waveforms, PV loop, and output metrics versus normal."),
  },
  {
    meta: {
      id: "diastolic-heart-failure",
      title: "Diastolic Heart Failure (HFpEF)",
      objective: "Understand how a stiff, poorly relaxing LV raises filling pressures while EF stays normal, and recognize the HFpEF signature on the PV loop, waveforms, and metrics.",
      level: "Beginner",
    },
    caseId: "diastolic-heart-failure",
    noteSpine: sp("Diastolic heart failure (HFpEF): preserved ejection fraction, impaired filling."),
  },
  {
    meta: {
      id: "aortic-stenosis",
      title: "Aortic Stenosis: a stiff door on the way out",
      objective: "Understand how a narrowed aortic valve forces the left ventricle to generate high pressure, and read that compensation off the PV loop, the LVP-AoP pressure gradient, and the stroke-volume metrics versus a normal heart.",
      level: "Beginner",
    },
    caseId: "aortic-stenosis",
    noteSpine: sp("How a narrowed aortic valve forces the left ventricle to generate a high pressure gradient — compared against the normal reference."),
  },
  {
    meta: {
      id: "hypovolemic-shock",
      title: "Hypovolemic Shock",
      objective: "Understand how losing circulating blood volume drops preload, stroke volume, and blood pressure.",
      level: "Beginner",
    },
    caseId: "hypovolemic-shock",
    noteSpine: sp("Hypovolemic shock is a preload problem: less circulating volume means less filling, lower stroke volume, and lower pressure."),
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
