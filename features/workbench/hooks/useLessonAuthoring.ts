import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useLocation } from "react-router-dom";
import type { CaseDocument, CaseStatus, CaseVisibility } from "@/caseDoc";
import { createUserLessonId, getUserLesson, saveLesson } from "@/lessonPersist";
import { publishLesson } from "@/lessonCloud";
import { normalizeStepsForSave } from "@/lessonAuthoring";
import type { Lesson, LessonStep } from "@/lessonDoc";
import { upsertCaseLocaleContent, upsertLessonLocaleContent } from "@/contentI18n";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef } from "@/types";
import { EMPTY_NOTE_SPINE } from "@/features/workbench/workbenchDefaults";
import { lessonHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

type AuthUser = {
  uid: string;
} | null;

type BuildCurrentDocOverrides = {
  id?: string;
  title?: string;
  author?: string;
  ownerId?: string;
  status?: CaseStatus;
  visibility?: CaseVisibility;
  source?: CaseDocument["source"];
  derivedFrom?: string;
  createdAt?: number;
  updatedAt?: number;
  includeNotes?: boolean;
};

type BuildCurrentDoc = (overrides?: BuildCurrentDocOverrides) => CaseDocument;

export function useLessonAuthoring({
  user,
  isAdmin,
  signIn,
  panels,
  notes,
  defaultSceneTitle,
  buildCurrentDocRef,
  pushWarningToast,
  setAuthoringMode,
}: {
  user: AuthUser;
  isAdmin: boolean;
  signIn: () => Promise<AuthUser>;
  panels: PanelDef[];
  notes: Record<string, NoteContent>;
  defaultSceneTitle: () => string;
  buildCurrentDocRef: MutableRefObject<BuildCurrentDoc | null>;
  pushWarningToast: (name: string, message: string) => void;
  setAuthoringMode: Dispatch<SetStateAction<boolean>>;
}) {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [savedLesson, setSavedLesson] = useState<{ id: string; title: string } | null>(null);
  const [stepsDraft, setStepsDraft] = useState<LessonStep[]>([]);
  const [lessonDraftId, setLessonDraftId] = useState<string | null>(null);
  const [publishedLesson, setPublishedLesson] = useState<{ id: string; title: string; url: string } | null>(null);
  const [isPublishingLesson, setIsPublishingLesson] = useState(false);

  const openLessonDialog = useCallback(() => {
    setLessonTitle(savedLesson?.title ?? defaultSceneTitle());
    setIsLessonDialogOpen(true);
  }, [defaultSceneTitle, savedLesson?.title]);

  const nextLessonId = useCallback((now: number) => (
    savedLesson?.id ?? lessonDraftId ?? createUserLessonId(now)
  ), [lessonDraftId, savedLesson?.id]);

  const buildLessonDraft = useCallback((id: string, title: string, now: number): { lesson?: Lesson; message?: string } => {
    const buildCurrentDoc = buildCurrentDocRef.current;
    if (!buildCurrentDoc) return { message: "Could not build this lesson." };
    const notePanel = panels.find((panel) => panel.type === "NOTE");
    const noteSpine = notePanel ? (notes[notePanel.id] ?? EMPTY_NOTE_SPINE) : EMPTY_NOTE_SPINE;
    // Case text is captured at the embedded-case layer; lesson step localization stays lesson-native.
    const caseDoc = upsertCaseLocaleContent(
      buildCurrentDoc({ id, title, createdAt: now, updatedAt: now, includeNotes: false }),
      locale,
    );
    const normalizedSteps = normalizeStepsForSave(stepsDraft, caseDoc.instances.map((instance) => instance.id));
    if (normalizedSteps.ok === false) return { message: normalizedSteps.message };

    const lesson: Lesson = {
      meta: { id, title, createdAt: now },
      case: caseDoc,
      noteSpine,
      ...(normalizedSteps.steps ? { steps: normalizedSteps.steps } : {}),
    };
    return {
      lesson: upsertLessonLocaleContent(lesson, locale),
    };
  }, [buildCurrentDocRef, locale, notes, panels, stepsDraft]);

  const saveCurrentLesson = useCallback(() => {
    try {
      const title = lessonTitle.trim() || defaultSceneTitle();
      const now = Date.now();
      const id = nextLessonId(now);
      const draft = buildLessonDraft(id, title, now);
      if (!draft.lesson) {
        pushWarningToast("Lesson save", draft.message ?? "Could not build this lesson.");
        return;
      }

      if (!saveLesson(draft.lesson) || !getUserLesson(id)) {
        pushWarningToast("Lesson save", "Could not save this lesson locally.");
        return;
      }
      setSavedLesson({ id, title });
      setLessonDraftId(id);
      setIsLessonDialogOpen(false);
    } catch (err) {
      pushWarningToast("Lesson save", (err as Error).message);
    }
  }, [buildLessonDraft, defaultSceneTitle, lessonTitle, nextLessonId, pushWarningToast]);

  const shareUrlFor = useCallback((id: string) => (
    `${window.location.origin}${lessonHref(id, locale)}`
  ), [locale]);

  const copyShareUrl = useCallback(async () => {
    if (!publishedLesson) return;
    try {
      await navigator.clipboard.writeText(publishedLesson.url);
      pushWarningToast("Lesson publish", "Share URL copied.");
    } catch {
      pushWarningToast("Lesson publish", "Could not copy the share URL.");
    }
  }, [publishedLesson, pushWarningToast]);

  const publishCurrentLesson = useCallback(async () => {
    if (isPublishingLesson) return;
    if (!user) {
      await signIn();
      pushWarningToast("Lesson publish", "Signed in. If this account is admin, click Publish again.");
      return;
    }
    if (!isAdmin) {
      pushWarningToast("Lesson publish", "公開権限がない/規則未デプロイ: current user is not an admin.");
      return;
    }

    const now = Date.now();
    const id = nextLessonId(now);
    const title = savedLesson?.title ?? (lessonTitle.trim() || defaultSceneTitle());
    const draft = buildLessonDraft(id, title, now);
    if (!draft.lesson) {
      pushWarningToast("Lesson publish", draft.message ?? "Could not build this lesson.");
      return;
    }

    setIsPublishingLesson(true);
    try {
      const result = await publishLesson(draft.lesson, user.uid);
      if (result.ok === false) {
        const details = result.code === "permission-denied"
          ? `公開権限がない/規則未デプロイ (${result.code})`
          : [result.code, result.message].filter(Boolean).join(": ");
        pushWarningToast("Lesson publish", details || "Lesson publish failed.");
        return;
      }

      const url = shareUrlFor(id);
      setLessonDraftId(id);
      setPublishedLesson({ id, title, url });
      pushWarningToast("Lesson publish", "Published. Share URL is ready.");
    } finally {
      setIsPublishingLesson(false);
    }
  }, [
    buildLessonDraft,
    defaultSceneTitle,
    isAdmin,
    isPublishingLesson,
    lessonTitle,
    nextLessonId,
    pushWarningToast,
    savedLesson?.title,
    shareUrlFor,
    signIn,
    user,
  ]);

  const resetLessonState = useCallback(() => {
    setStepsDraft([]);
    setIsLessonDialogOpen(false);
    setAuthoringMode(false);
    setSavedLesson(null);
    setLessonDraftId(null);
    setPublishedLesson(null);
  }, [setAuthoringMode]);

  const exitAuthoring = useCallback(() => {
    setIsLessonDialogOpen(false);
    setAuthoringMode(false);
  }, [setAuthoringMode]);

  return {
    isLessonDialogOpen,
    setIsLessonDialogOpen,
    lessonTitle,
    setLessonTitle,
    savedLesson,
    setSavedLesson,
    stepsDraft,
    setStepsDraft,
    lessonDraftId,
    publishedLesson,
    setPublishedLesson,
    isPublishingLesson,
    openLessonDialog,
    saveCurrentLesson,
    copyShareUrl,
    publishCurrentLesson,
    resetLessonState,
    exitAuthoring,
  };
}

export type LessonAuthoringState = ReturnType<typeof useLessonAuthoring>;
