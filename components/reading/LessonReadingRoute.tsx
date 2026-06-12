import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { caseDocumentToSimInstances, type CaseDocument, type ReadingColumnEntry } from "../../caseDoc";
import { fetchCase } from "../../caseCloud";
import { fetchPublishedLesson } from "../../lessonCloud";
import { caseDocumentToLesson, lessonById, resolveLessonCase, type Lesson } from "../../lessonDoc";
import { resolveReadingColumn } from "../../readingConversion";
import { LessonPlayer } from "../LessonPlayer";
import { ReadingPresenter } from "./ReadingPresenter";
import { homeHref } from "../../homeLinks";
import { localeFromPathname } from "../../localeRouting";
import { resolveLocalizedCaseDocument, resolveLocalizedLesson } from "../../contentI18n";
import { PreviewController } from "../../engine/previewController";
import { resolveKnobEdit, resolveRawEdit } from "../../engine/instanceKnobs";
import type { ClinicalKnobs } from "../../engine/knobs";
import type { SimulationHealth } from "../../engine/protocol";
import type { PhysicsRefState, SimInstance, SimulationParams } from "../../types";

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

function useReadingPresenterRuntime(caseDoc: CaseDocument) {
  const [controller] = useState(() => new PreviewController());
  const [instances, setInstances] = useState<SimInstance[]>(() => caseDocumentToSimInstances(caseDoc));
  const [instanceHealth, setInstanceHealth] = useState<Record<string, SimulationHealth>>({});
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(controller.refs);
  const pendingSteadyTransitionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    controller.onHealthChange = setInstanceHealth;
    controller.start();
    return () => {
      controller.onHealthChange = undefined;
      controller.stop();
    };
  }, [controller]);

  useEffect(() => {
    const steadyTransitionIds = [...pendingSteadyTransitionIdsRef.current];
    pendingSteadyTransitionIdsRef.current.clear();
    controller.setInstances(instances, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
  }, [controller, instances]);

  const updateWith = useCallback((project: (instance: SimInstance) => SimInstance, steadyTransitionIds: string[] = []) => {
    setInstances((current) => {
      const next = current.map(project);
      steadyTransitionIds.forEach((id) => pendingSteadyTransitionIdsRef.current.add(id));
      controller.setInstances(next, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
      for (const id of steadyTransitionIds) {
        const target = next.find((instance) => instance.id === id);
        if (target) controller.requestNextSteady(target);
      }
      return next;
    });
  }, [controller]);

  const updateInstanceParams = useCallback((id: string, params: Partial<SimulationParams>) => {
    updateWith((instance) => {
      if (instance.id !== id) return instance;
      const next = resolveRawEdit({
        params: instance.params,
        knobs: instance.knobs,
        knobBaseline: instance.knobBaseline,
      }, params);
      return { ...instance, ...next };
    });
  }, [updateWith]);

  const updateInstanceKnobs = useCallback((id: string, knobs: ClinicalKnobs) => {
    updateWith((instance) => {
      if (instance.id !== id) return instance;
      const next = resolveKnobEdit({
        params: instance.params,
        knobs: instance.knobs,
        knobBaseline: instance.knobBaseline,
      }, knobs);
      return { ...instance, ...next };
    }, [id]);
  }, [updateWith]);

  const updateInstanceVolume = useCallback((id: string, vol: number) => {
    setInstances((current) => {
      const next = current.map((instance) => (instance.id === id ? { ...instance, targetVolume: vol } : instance));
      pendingSteadyTransitionIdsRef.current.add(id);
      controller.setInstances(next, { steadyTransitionIds: [id] });
      const target = next.find((instance) => instance.id === id);
      if (target) controller.requestNextSteady(target);
      return next;
    });
  }, [controller]);

  return {
    instances,
    physicsRefs,
    instanceHealth,
    activeInstanceId: instances[0]?.id ?? "",
    updateInstanceParams,
    updateInstanceKnobs,
    updateInstanceVolume,
  };
}

const LessonNotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3">{t("lessonPlayer.notFound.title")}</h1>
        <p className="text-sm text-slate-400 mb-5">{t("lessonPlayer.notFound.description")}</p>
        <Link to={homeHref(locale)} className="inline-flex px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold">
          {t("lessonPlayer.backToHome")}
        </Link>
      </div>
    </div>
  );
};

const LessonLoading = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      <div className="text-sm font-bold text-slate-400">{t("lessonPlayer.loading")}</div>
    </div>
  );
};

export const LessonReadingRoute = () => {
  const { id } = useParams();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
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

  const rawLesson = localLesson ?? (cloudState.status === "ready" ? cloudState.lesson : undefined);
  const lessonResolution = rawLesson ? resolveLocalizedLesson(rawLesson, locale) : undefined;
  const lesson = lessonResolution?.doc;
  if (!lesson) {
    if (cloudState.status === "loading" || cloudState.status === "idle") return <LessonLoading />;
    return <LessonNotFound />;
  }

  const rawCaseDoc = resolveLessonCase(lesson);
  const caseResolution = rawCaseDoc ? resolveLocalizedCaseDocument(rawCaseDoc, locale) : undefined;
  const caseDoc = caseResolution?.doc;
  const resolvedColumn = caseDoc ? resolveReadingColumn(caseDoc) : undefined;
  const fallbackLocale = lessonResolution?.isFallback
    ? lessonResolution.resolvedLocale
    : caseResolution?.isFallback
      ? caseResolution.resolvedLocale
      : undefined;

  if (caseDoc && resolvedColumn && "column" in resolvedColumn && shouldUseReading(lesson, caseDoc)) {
    return (
      <LessonReadingPresenter
        key={`${lesson.meta.id}:${caseDoc.meta.id}`}
        lessonTitle={lesson.meta.title}
        lessonLevel={lesson.meta.level}
        objective={lesson.meta.objective}
        caseDoc={caseDoc}
        column={resolvedColumn.column}
        fallbackLocale={fallbackLocale}
      />
    );
  }

  return <LessonPlayer />;
};

const LessonReadingPresenter = (props: {
  lessonTitle: string;
  lessonLevel?: string;
  objective?: string;
  caseDoc: CaseDocument;
  column: ReadingColumnEntry[];
  fallbackLocale?: string;
}) => {
  const runtime = useReadingPresenterRuntime(props.caseDoc);
  return (
    <div className="workbench-root flex h-full min-h-0 w-full" data-workbench-theme="dark">
      <ReadingPresenter {...props} runtime={runtime} />
    </div>
  );
};
