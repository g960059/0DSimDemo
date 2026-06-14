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
import { graphPanelsOnly } from "@/features/workbench/p1aStructuralHosts";
import { graphBoardLayoutFromPanels, normalizeGraphBoardLayout } from "@/features/workbench/viewSpec";
import { serializableAuthoredViews } from "@/features/workbench/authoredViews";
import { applyPublishDraft, isPublishable, validatePublishableCase, type PublishIssue } from "@/features/workbench/casePublish";
import type { WorkbenchSceneState } from "@/features/workbench/hooks/useWorkbenchScene";
import type { WorkbenchPanelsState } from "@/features/workbench/hooks/useWorkbenchPanels";
import type { PublishDialogDraft } from "@/features/workbench/publish/publishDialogState";
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
  initialActiveScenarioId?: string;
  defaultEntry?: CaseDocument["defaultEntry"];
};

export type BuildCurrentDoc = (overrides?: BuildCurrentDocOverrides) => CaseDocument;

type PersistCaseResult =
  | { ok: true; caseId: string; doc: CaseDocument }
  | { ok: false; issues?: PublishIssue[] };

export function useWorkbenchPersistence({
  user,
  authLoading,
  signIn,
  scene,
  panels,
  userEditedRef,
  buildCurrentDocRef,
  pushWarningToast,
}: {
  user: AuthUser;
  authLoading: boolean;
  signIn: () => Promise<AuthUser>;
  scene: WorkbenchSceneState;
  panels: WorkbenchPanelsState;
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

  const { replaceSceneFromDoc } = scene;
  const { replacePanelState } = panels;

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
    const nextDefaultEntry = "defaultEntry" in overrides ? overrides.defaultEntry : scene.currentCaseDefaultEntry;
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
      workspace: workspaceForPanels(panels.panels, panels.workspace),
      notes: overrides.includeNotes === false ? undefined : panels.notes,
      reading: scene.currentCaseReading,
      exposedControllers: scene.currentCaseExposedControllers,
      // P2a re-enables ViewSpec persistence for authored controller/metrics
      // views because they are now live Workbench document content. Graph views
      // remain represented by graphBoardLayout + legacy graph panels here.
      views: serializableAuthoredViews(scene.currentCaseViews),
      graphBoardLayout: normalizedGraphBoardLayout,
      initialActiveScenarioId: overrides.initialActiveScenarioId ?? scene.activeInstanceId,
      defaultEntry: nextDefaultEntry,
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
    scene.currentCaseDefaultEntry,
    scene.currentCaseViews,
    scene.currentCaseGraphBoardLayout,
    scene.activeInstanceId,
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
        notes: retainedDoc.notes ?? {},
        noteCaseKey: `${localized.meta.id}:${nonce}`,
      });
      userEditedRef.current = false;
      return true;
    } catch (err) {
      pushWarningToast("Case load", (err as Error).message);
      return false;
    }
  }, [locale, pushWarningToast, replacePanelState, replaceSceneFromDoc, userEditedRef]);

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
        confirm: userEditedRef.current,
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
      replaceWorkbenchDoc(await readCaseFile(file), { confirm: userEditedRef.current });
    } catch (err) {
      window.alert(`Import failed: ${(err as Error).message}`);
    }
  }, [replaceWorkbenchDoc, userEditedRef]);

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

  const persistCaseToCloud = useCallback(async (opts: {
    copy: boolean;
    status: CaseStatus;
    visibility: CaseVisibility;
    buildStatus?: CaseStatus;
    buildVisibility?: CaseVisibility;
    defaultEntry?: CaseDocument["defaultEntry"];
    applyDraft?: (doc: CaseDocument) => CaseDocument;
    validateBeforeSave?: (doc: CaseDocument) => PublishIssue[];
    saveOptions: { publish?: boolean; visibility?: CaseVisibility; kind: "case" };
    requireExistingOwned?: boolean;
    savedDefaultEntry?: CaseDocument["defaultEntry"];
    successToast?: string;
  }): Promise<PersistCaseResult> => {
    if (isSavingCase) return { ok: false };

    const activeUser = await signedInUserForCaseSave();
    if (!activeUser) return { ok: false };

    const now = Date.now();
    const canUpdateCurrentCase = !opts.copy &&
      Boolean(scene.currentCaseId && isValidCaseId(scene.currentCaseId) && scene.currentCaseOwnerId === activeUser.uid);
    if (opts.requireExistingOwned && !canUpdateCurrentCase) {
      pushWarningToast("Case save", "Only the owner can update this cloud case.");
      return { ok: false };
    }
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
      // Fork seeds the copy from the VIEWER's current runtime state — the
      // active scenario is part of that state (ADR-0007).
      ...(opts.copy ? { initialActiveScenarioId: scene.activeInstanceId } : {}),
      author: userDisplayName(activeUser),
      ownerId: activeUser.uid,
      status: opts.buildStatus,
      visibility: opts.buildVisibility,
      source,
      derivedFrom,
      createdAt: canUpdateCurrentCase ? (scene.currentCaseCreatedAt ?? now) : now,
      updatedAt: now,
      // Only override defaultEntry when a caller explicitly provides one (publish). For
      // Save/Fork/Unpublish, OMIT the key so buildCurrentDoc's `"defaultEntry" in overrides`
      // presence-check preserves scene.currentCaseDefaultEntry (passing `undefined` would be a
      // present key = an explicit override that drops the case's chosen entry — e.g. an
      // "explore" published case silently reverting on a normal Save).
      ...(opts.defaultEntry !== undefined ? { defaultEntry: opts.defaultEntry } : {}),
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
    const localizedDoc = upsertCaseLocaleContent(nextDocBase, locale);
    const nextDoc = opts.applyDraft ? opts.applyDraft(localizedDoc) : localizedDoc;
    const issues = opts.validateBeforeSave?.(nextDoc) ?? [];
    if (issues.length > 0 && !isPublishable(issues)) {
      return { ok: false, issues };
    }

    setIsSavingCase(true);
    try {
      const result = await saveCase(nextDoc, activeUser.uid, opts.saveOptions);
      if (result.ok === false) {
        const details = [result.code, result.message].filter(Boolean).join(": ");
        pushWarningToast("Case save", details || "Case save failed.");
        return { ok: false };
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
        defaultEntry: opts.savedDefaultEntry ?? nextDoc.defaultEntry,
        status: nextDoc.status ?? opts.status,
        visibility: nextDoc.visibility ?? opts.visibility,
        views: serializableAuthoredViews(nextDoc.views),
        graphBoardLayout: nextDoc.graphBoardLayout,
        initialActiveScenarioId: nextDoc.initialActiveScenarioId,
      });
      lastLoadedCaseIdRef.current = `${locale}:${caseId}`;
      navigate(caseHref(caseId, locale), { replace: true });
      if (opts.successToast) pushWarningToast("Case save", opts.successToast);
      return { ok: true, caseId, doc: nextDoc };
    } finally {
      setIsSavingCase(false);
    }
  }, [
    buildCurrentDoc,
    cacheCurrentDraft,
    defaultSceneTitle,
    isSavingCase,
    locale,
    navigate,
    pushWarningToast,
    routeCaseId,
    scene,
    signedInUserForCaseSave,
    userDisplayName,
  ]);

  const saveCurrentCaseToCloud = useCallback(async (opts: { copy: boolean }) => {
    const status: CaseStatus = opts.copy ? "draft" : (scene.currentCaseStatus ?? "draft");
    const visibility: CaseVisibility = opts.copy ? "private" : (scene.currentCaseVisibility ?? "private");
    await persistCaseToCloud({
      copy: opts.copy,
      status,
      visibility,
      buildStatus: status,
      buildVisibility: visibility,
      saveOptions: { visibility, kind: "case" },
      successToast: opts.copy ? "Created an editable copy." : "Saved case.",
    });
  }, [persistCaseToCloud, scene.currentCaseStatus, scene.currentCaseVisibility]);

  const publishCurrentCase = useCallback(async (draft: PublishDialogDraft): Promise<PersistCaseResult> => {
    const defaultEntry = draft.defaultEntry;
    return persistCaseToCloud({
      copy: false,
      status: "published",
      visibility: draft.visibility,
      defaultEntry,
      applyDraft: (doc) => applyPublishDraft(doc, {
        status: "published",
        visibility: draft.visibility,
        defaultEntry,
      }),
      validateBeforeSave: validatePublishableCase,
      saveOptions: { publish: true, visibility: draft.visibility, kind: "case" },
      savedDefaultEntry: defaultEntry,
    });
  }, [persistCaseToCloud]);

  const unpublishCurrentCase = useCallback(async (): Promise<PersistCaseResult> => {
    const visibility: CaseVisibility = scene.currentCaseVisibility === "public" || scene.currentCaseVisibility === "unlisted"
      ? scene.currentCaseVisibility
      : "unlisted";
    return persistCaseToCloud({
      copy: false,
      status: "draft",
      visibility,
      buildStatus: "draft",
      buildVisibility: visibility,
      saveOptions: { visibility, kind: "case" },
      requireExistingOwned: true,
    });
  }, [persistCaseToCloud, scene.currentCaseVisibility]);

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
    publishCurrentCase,
    unpublishCurrentCase,
    runHeaderPrimaryAction,
    isSavingCase,
    backTarget,
  };
}
