import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseDocumentToSimInstances, type CaseDocument } from "../../caseDoc";
import { fetchCase } from "../../caseCloud";
import { fetchPublishedLesson } from "../../lessonCloud";
import { caseDocumentToLesson, lessonById, resolveLessonCase, type Lesson } from "../../lessonDoc";
import { resolveReadingColumn } from "../../readingConversion";
import { LessonPlayer } from "../LessonPlayer";
import { ReadingPresenter } from "./ReadingPresenter";

export const ENABLE_READING_PRESENTER_FOR_LESSONS = true;

export function shouldUseReading(lesson: Lesson, caseDoc: CaseDocument): boolean {
  if (!ENABLE_READING_PRESENTER_FOR_LESSONS) return false;
  if ((lesson.steps?.length ?? 0) > 0) return false;
  if (caseDoc.panels.length === 0) return false;
  if ("fallback" in resolveReadingColumn(caseDoc)) return false;
  try {
    caseDocumentToSimInstances(caseDoc);
  } catch {
    return false;
  }
  return true;
}

type CloudResolveState =
  | { status: "idle" | "loading" | "notfound" }
  | { status: "ready"; lesson: Lesson };

const LessonNotFound = () => (
  <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
    <div className="max-w-md text-center">
      <h1 className="text-2xl font-bold mb-3">Lesson not found</h1>
      <p className="text-sm text-slate-400 mb-5">This lesson is not available in the current learning path.</p>
      <Link to="/" className="inline-flex px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold">
        Back to Home
      </Link>
    </div>
  </div>
);

const LessonLoading = () => (
  <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
    <div className="text-sm font-bold text-slate-400">Loading lesson...</div>
  </div>
);

export const LessonReadingRoute = () => {
  const { id } = useParams();
  const localLesson = useMemo(() => (id ? lessonById(id) : undefined), [id]);
  const [cloudState, setCloudState] = useState<CloudResolveState>({ status: "idle" });

  useEffect(() => {
    if (!id || localLesson) {
      setCloudState({ status: "idle" });
      return;
    }

    let ignore = false;
    setCloudState({ status: "loading" });
    Promise.all([fetchCase(id), fetchPublishedLesson(id)]).then(([caseDoc, lesson]) => {
      if (ignore) return;
      const caseLesson = caseDoc ? caseDocumentToLesson(caseDoc) : undefined;
      const resolved = caseLesson ?? lesson;
      setCloudState(resolved ? { status: "ready", lesson: resolved } : { status: "notfound" });
    });

    return () => {
      ignore = true;
    };
  }, [id, localLesson]);

  if (!id) return <LessonNotFound />;

  const lesson = localLesson ?? (cloudState.status === "ready" ? cloudState.lesson : undefined);
  if (!lesson) {
    if (cloudState.status === "loading" || cloudState.status === "idle") return <LessonLoading />;
    return <LessonNotFound />;
  }

  const caseDoc = resolveLessonCase(lesson);
  const resolvedColumn = caseDoc ? resolveReadingColumn(caseDoc) : undefined;

  if (caseDoc && resolvedColumn && "column" in resolvedColumn && shouldUseReading(lesson, caseDoc)) {
    return (
      <ReadingPresenter
        key={lesson.meta.id}
        lessonTitle={lesson.meta.title}
        lessonLevel={lesson.meta.level}
        objective={lesson.meta.objective}
        caseDoc={caseDoc}
        column={resolvedColumn.column}
      />
    );
  }

  return <LessonPlayer />;
};
