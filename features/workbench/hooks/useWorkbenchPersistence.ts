import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  type CaseDocument,
  type CaseSource,
  type CaseStatus,
  type CaseVisibility,
  caseDocumentToSimInstances,
  simInstancesToCaseDocument,
  workspaceForPanels,
} from "@/caseDoc";
import { createUserCaseId, fetchCase, isValidCaseId, saveCase } from "@/caseCloud";
import { exportCaseFile, readCaseFile, saveDraft } from "@/casePersist";
import { resolveLocalizedCaseDocument, upsertCaseLocaleContent } from "@/contentI18n";
import { officialCaseById } from "@/officialCases";
import { remapCaseDocumentViewIds, remapCaseI18nContentIds, remapWorkbenchLoadIds } from "@/workbenchLoad";
import { DEFAULT_MODEL_LIMITATIONS } from "@/features/workbench/workbenchDefaults";
import { graphPanelsOnly, mainDockviewViewStatesOnly } from "@/features/workbench/p1aStructuralHosts";
import { graphBoardLayoutFromPanels, normalizeGraphBoardLayout } from "@/features/workbench/viewSpec";
import { serializableAuthoredViews } from "@/features/workbench/authoredViews";
import type { WorkbenchSceneState } from "@/features/workbench/hooks/useWorkbenchScene";
import type { WorkbenchPanelsState } from "@/features/workbench/hooks/useWorkbenchPanels";
import type { LessonAuthoringState } from "@/features/workbench/hooks/useLessonAuthoring";
import { allCasesHref, caseHref, homeHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

type AuthUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
} | null;

export type BuildCurrentDocOverrides = {
  id?: string;
  title?: string;
  author?: string;
  ownerId?: string;
  status?: CaseStatus;
  visibility?: CaseVisibility;
  source?: CaseSource;
  derivedFrom?: string;
  createdAt?: number;
  updatedAt?: number;
  includeNotes?: boolean;
};

export type BuildCurrentDoc = (overrides?: BuildCurrentDocOverrides) => CaseDocument;

export function useWorkbenchPersistence({
  user,
  authLoading,
  signIn,
  scene,
  panels,
  lesson,
  userEditedRef,
  buildCurrentDocRef,
  pushWarningToast,
}: {
  user: AuthUser;
  authLoading: boolean;
  signIn: () => Promise<AuthUser>;
  scene: WorkbenchSceneState;
  panels: WorkbenchPanelsState;
  lesson: LessonAuthoringState;
  userEditedRef: MutableRefObject<boolean>;
  buildCurrentDocRef: MutableRefObject<BuildCurrentDoc | null>;
  pushWarningToast: (name: string, message: string) => void;
}) {
  const { caseId: routeCaseId } = useParams();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSavingCase, setIsSavingCase] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastLoadedCaseIdRef = useRef<string | null>(null);
  const loadNonceRef = useRef(0);
  const routeLoadCaseId = routeCaseId ?? searchParams.get("case");
  const routeLoadKey = routeLoadCaseId ? `${locale}:${routeLoadCaseId}` : undefined;
  const stepsDraftLengthRef = useRef(lesson.stepsDraft.length);
  stepsDraftLengthRef.current = lesson.stepsDraft.length;

  const { replaceSceneFromDoc } = scene;
  const { replacePanelState } = panels;
  const { resetLessonState } = lesson;

  const defaultSceneTitle = useCallback(() => (
    scene.sceneMeta.title.trim() || (scene.instances[0] ? `${scene.instances[0].name} case` : "Workbench case")
  ), [scene.instances, scene.sceneMeta.title]);

  const buildCurrentDoc: BuildCurrentDoc = useCallback((overrides = {}) => {
    const now = Date.now();
    const title = overrides.title ?? defaultSceneTitle();
    const modelLimitations = scene.sceneMeta.modelLimitations.length > 0
      ? scene.sceneMeta.modelLimitations
      : DEFAULT_MODEL_LIMITATIONS;
    const graphPanels = graphPanelsOnly(panels.panels);
    const graphPanelIds = graphPanels.map((panel) => panel.id);
    const normalizedGraphBoardLayout = normalizeGraphBoardLayout(scene.currentCaseGraphBoardLayout, { graphViewIds: graphPanelIds }).layout
      ?? graphBoardLayoutFromPanels(graphPanels);
    const doc = simInstancesToCaseDocument(scene.instances, panels.panels, {
      id: overrides.id ?? `wb-${now}`,
      title,
      author: overrides.author ?? scene.caseAuthor,
      ownerId: overrides.ownerId ?? scene.currentCaseOwnerId,
      status: overrides.status,
      visibility: overrides.visibility,
      source: overrides.source ?? scene.currentCaseSource,
      derivedFrom: overrides.derivedFrom ?? scene.currentCaseDerivedFrom,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      spec: {
        title,
        ...(scene.sceneMeta.description.trim() ? { description: scene.sceneMeta.description.trim() } : {}),
        modelLimitations,
      },
      // P1a keeps legacy PanelDef hosts for document compatibility, but Dockview
      // display state is live only for the main Graph Board. Older documents may
      // load side/bottom/caseRail viewStates; saves intentionally drop them.
      workspace: mainDockviewViewStatesOnly(workspaceForPanels(panels.panels, panels.workspace)),
      notes: overrides.includeNotes === false ? undefined : panels.notes,
      reading: scene.currentCaseReading,
      exposedControllers: scene.currentCaseExposedControllers,
      // P2a re-enables ViewSpec persistence for authored controller/metrics
      // views because they are now live Workbench document content. Graph views
      // remain represented by graphBoardLayout + legacy graph panels here.
      views: serializableAuthoredViews(scene.currentCaseViews),
      graphBoardLayout: normalizedGraphBoardLayout,
      initialActiveScenarioId: scene.currentCaseInitialActiveScenarioId,
      defaultLocale: scene.currentCaseDefaultLocale ?? locale,
      availableLocales: scene.currentCaseAvailableLocales,
      i18n: scene.currentCaseI18n,
    });
    return upsertCaseLocaleContent(doc, locale);
  }, [
    defaultSceneTitle,
    locale,
    panels.notes,
    panels.panels,
    panels.workspace,
    scene.caseAuthor,
    scene.currentCaseAvailableLocales,
    scene.currentCaseDerivedFrom,
    scene.currentCaseDefaultLocale,
    scene.currentCaseI18n,
    scene.currentCaseReading,
    scene.currentCaseExposedControllers,
    scene.currentCaseViews,
    scene.currentCaseGraphBoardLayout,
    scene.currentCaseInitialActiveScenarioId,
    scene.currentCaseOwnerId,
    scene.currentCaseSource,
    scene.instances,
    scene.sceneMeta.description,
    scene.sceneMeta.modelLimitations,
  ]);
  buildCurrentDocRef.current = buildCurrentDoc;

  const replaceWorkbenchDoc = useCallback((doc: CaseDocument, opts: { confirm: boolean; trustedOfficial?: boolean }) => {
    if (opts.confirm && !window.confirm("Load this case? It will replace the current case; unsaved changes are lost.")) return false;

    try {
      const localized = resolveLocalizedCaseDocument(doc, locale).doc;
      const loaded = caseDocumentToSimInstances(localized);
      const nonce = `${Date.now().toString(36)}${(loadNonceRef.current++).toString(36)}`;
      const remapped = remapWorkbenchLoadIds(loaded, localized.panels, nonce);
      const panelIdMap = new Map(localized.panels.map((panel, index) => [panel.id, remapped.panels[index]?.id ?? panel.id]));
      const retainedDoc: CaseDocument = remapCaseDocumentViewIds({
        ...localized,
        i18n: remapCaseI18nContentIds(localized.i18n, {
          instanceIdMap: remapped.idMap,
          panelIdMap,
        }),
      }, {
        instanceIdMap: remapped.idMap,
        panelIdMap,
      });

      replaceSceneFromDoc({
        doc: retainedDoc,
        instances: remapped.instances,
        activeInstanceId: remapped.activeInstanceId,
        panels: remapped.panels,
        trustedOfficial: opts.trustedOfficial,
      });
      replacePanelState({
        panels: remapped.panels,
        workspace: localized.workspace,
        notes: localized.notes ?? {},
        noteCaseKey: `${localized.meta.id}:${nonce}`,
      });
      resetLessonState();
      userEditedRef.current = false;
      return true;
    } catch (err) {
      pushWarningToast("Case load", (err as Error).message);
      return false;
    }
  }, [locale, pushWarningToast, replacePanelState, replaceSceneFromDoc, resetLessonState, userEditedRef]);

  const replaceWorkbenchDocRef = useRef(replaceWorkbenchDoc);
  replaceWorkbenchDocRef.current = replaceWorkbenchDoc;

  useEffect(() => {
    if (!routeLoadCaseId || routeLoadKey === lastLoadedCaseIdRef.current) return;

    let cancelled = false;
    const localDoc = officialCaseById(routeLoadCaseId);
    if (!localDoc && authLoading) return;
    const loadDoc = async (): Promise<{ doc: CaseDocument; trustedOfficial: boolean } | undefined> => {
      if (localDoc) return { doc: localDoc, trustedOfficial: true };
      const cloudDoc = await fetchCase(routeLoadCaseId);
      return cloudDoc ? { doc: cloudDoc, trustedOfficial: cloudDoc.visibility === "official" } : undefined;
    };

    loadDoc().then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        lastLoadedCaseIdRef.current = routeLoadKey ?? routeLoadCaseId;
        pushWarningToast("Case route", `Unknown case "${routeLoadCaseId}" — loaded the default case`);
        return;
      }

      if (replaceWorkbenchDocRef.current(loaded.doc, {
        confirm: userEditedRef.current || stepsDraftLengthRef.current > 0,
        trustedOfficial: loaded.trustedOfficial,
      })) {
        lastLoadedCaseIdRef.current = routeLoadKey ?? routeLoadCaseId;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, pushWarningToast, routeLoadCaseId, routeLoadKey, userEditedRef]);

  const handleExport = useCallback(() => {
    try {
      exportCaseFile(buildCurrentDoc());
    } catch (err) {
      window.alert(`Export failed: ${(err as Error).message}`);
    }
  }, [buildCurrentDoc]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      replaceWorkbenchDoc(await readCaseFile(file), { confirm: userEditedRef.current || lesson.stepsDraft.length > 0 });
    } catch (err) {
      window.alert(`Import failed: ${(err as Error).message}`);
    }
  }, [lesson.stepsDraft.length, replaceWorkbenchDoc, userEditedRef]);

  const cacheCurrentDraft = useCallback((doc: CaseDocument) => {
    saveDraft(doc);
    userEditedRef.current = false;
  }, [userEditedRef]);

  const signedInUserForCaseSave = useCallback(async () => {
    if (user) return user;
    const signedIn = await signIn();
    if (!signedIn) {
      pushWarningToast("Case save", "Sign in is required to save a case.");
      return null;
    }
    return signedIn;
  }, [pushWarningToast, signIn, user]);

  const userDisplayName = useCallback((activeUser: NonNullable<AuthUser>) => (
    activeUser.displayName?.trim() || activeUser.email?.trim() || "User case"
  ), []);

  const saveCurrentCaseToCloud = useCallback(async (opts: { copy: boolean }) => {
    if (isSavingCase) return;

    const activeUser = await signedInUserForCaseSave();
    if (!activeUser) return;

    const now = Date.now();
    const canUpdateCurrentCase = !opts.copy &&
      Boolean(scene.currentCaseId && isValidCaseId(scene.currentCaseId) && scene.currentCaseOwnerId === activeUser.uid);
    const rawSourceCaseId = !canUpdateCurrentCase
      ? (scene.currentCaseId ?? routeCaseId)
      : undefined;
    const sourceCaseId = rawSourceCaseId && isValidCaseId(rawSourceCaseId) ? rawSourceCaseId : undefined;
    const sourceTitle = scene.sceneMeta.title.trim() || defaultSceneTitle();
    const title = opts.copy ? `${sourceTitle} copy` : sourceTitle;
    const sourceDescription = scene.sceneMeta.description.trim();
    const description = opts.copy
      ? [sourceDescription, `Forked from ${sourceTitle}`].filter(Boolean).join("\n\n")
      : sourceDescription;
    const caseId = canUpdateCurrentCase
      ? scene.currentCaseId!
      : createUserCaseId(title, activeUser.uid, now);
    const source: CaseSource = canUpdateCurrentCase
      ? (scene.currentCaseSource ?? { kind: "authored" })
      : sourceCaseId
        ? { kind: "remix", caseId: sourceCaseId }
        : { kind: "authored" };
    const derivedFrom = canUpdateCurrentCase ? scene.currentCaseDerivedFrom : sourceCaseId;
    const caseDoc = buildCurrentDoc({
      id: caseId,
      title,
      author: userDisplayName(activeUser),
      ownerId: activeUser.uid,
      status: "draft",
      visibility: "private",
      source,
      derivedFrom,
      createdAt: canUpdateCurrentCase ? (scene.currentCaseCreatedAt ?? now) : now,
      updatedAt: now,
    });
    const nextDocBase: CaseDocument = {
      ...caseDoc,
      meta: {
        ...caseDoc.meta,
        title,
        updatedAt: now,
      },
      spec: {
        ...caseDoc.spec,
        title,
        ...(description ? { description } : {}),
      },
    };
    const nextDoc = upsertCaseLocaleContent(nextDocBase, locale);

    setIsSavingCase(true);
    try {
      const result = await saveCase(nextDoc, activeUser.uid, { visibility: "private", kind: "case" });
      if (result.ok === false) {
        const details = [result.code, result.message].filter(Boolean).join(": ");
        pushWarningToast("Case save", details || "Case save failed.");
        return;
      }

      cacheCurrentDraft(nextDoc);
      scene.applySavedCase({
        title,
        description,
        modelLimitations: nextDoc.spec.modelLimitations,
        author: nextDoc.meta.author,
        caseId,
        ownerId: activeUser.uid,
        createdAt: nextDoc.meta.createdAt,
        source,
        derivedFrom,
        defaultLocale: nextDoc.defaultLocale,
        availableLocales: nextDoc.availableLocales,
        i18n: nextDoc.i18n,
        reading: nextDoc.reading,
        exposedControllers: nextDoc.exposedControllers,
        views: serializableAuthoredViews(nextDoc.views),
        graphBoardLayout: nextDoc.graphBoardLayout,
        initialActiveScenarioId: nextDoc.initialActiveScenarioId,
      });
      lesson.setSavedLesson(null);
      lesson.setPublishedLesson(null);
      lastLoadedCaseIdRef.current = `${locale}:${caseId}`;
      navigate(caseHref(caseId, locale), { replace: true });
      pushWarningToast("Case save", opts.copy ? "Created an editable copy." : "Saved case.");
    } finally {
      setIsSavingCase(false);
    }
  }, [
    buildCurrentDoc,
    cacheCurrentDraft,
    defaultSceneTitle,
    isSavingCase,
    lesson,
    locale,
    navigate,
    pushWarningToast,
    routeCaseId,
    scene,
    signedInUserForCaseSave,
    userDisplayName,
  ]);

  const runHeaderPrimaryAction = useCallback(() => {
    if (scene.headerMode === "learner") {
      void saveCurrentCaseToCloud({ copy: true });
      return;
    }
    void saveCurrentCaseToCloud({ copy: false });
  }, [saveCurrentCaseToCloud, scene.headerMode]);

  const fromParam = searchParams.get("from");
  const backTarget = fromParam === "cases"
    ? { href: allCasesHref(locale), label: "Cases" }
    : fromParam === "lesson"
      ? { href: homeHref(locale), label: "Home" }
      : { href: homeHref(locale), label: "Home" };

  return {
    routeCaseId,
    fileInputRef,
    defaultSceneTitle,
    buildCurrentDoc,
    replaceWorkbenchDoc,
    handleExport,
    handleImportFile,
    saveCurrentCaseToCloud,
    runHeaderPrimaryAction,
    isSavingCase,
    backTarget,
  };
}
