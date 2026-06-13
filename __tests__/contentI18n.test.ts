import { describe, expect, it } from "vitest";
import { resolveLocalizedCaseDocument, resolveLocalizedLesson, upsertCaseLocaleContent, upsertLessonLocaleContent } from "@/contentI18n";
import { parseCaseDocument, serializeCaseDocument } from "@/casePersist";
import { caseDocumentToSimInstances, simInstancesToCaseDocument, workspaceForPanels } from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import { remapCaseI18nContentIds, remapWorkbenchLoadIds } from "@/workbenchLoad";
import type { Lesson } from "@/lessonDoc";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef } from "@/types";
import type { SimInstance } from "@/types";

const enNote: NoteContent = [{ type: "paragraph", content: [{ type: "text", text: "English note", styles: {} }] }];
const jaNote: NoteContent = [{ type: "paragraph", content: [{ type: "text", text: "日本語ノート", styles: {} }] }];

function baseCase() {
  const base = defaultParams();
  const knobs = { ...neutralKnobs(base), contractility: 0.8 };
  const inst: SimInstance = {
    id: "1",
    name: "Normal",
    color: "#38bdf8",
    isVisible: true,
    knobBaseline: base,
    knobs,
    params: applyKnobs(base, knobs, KNOB_MAPPING_VERSION),
    targetVolume: 5600,
  };
  return simInstancesToCaseDocument([inst], [{ id: "p_note", type: "NOTE", title: "Notes", w: 4, h: 4, config: {}, isSettingsOpen: false }], {
    id: "case-1",
    title: "English case",
    createdAt: 1,
    updatedAt: 2,
    spec: { title: "English case", description: "English description", modelLimitations: ["English limit"] },
    notes: { p_note: enNote },
  });
}

describe("content i18n helpers", () => {
  it("migrates legacy lesson text into the default locale and falls back gracefully", () => {
    const lesson: Lesson = {
      meta: { id: "lesson-1", title: "English lesson", objective: "English objective" },
      caseId: "normal-sinus",
      noteSpine: enNote,
      steps: [{
        id: "step-1",
        title: "English step",
        note: enNote,
        stage: { visibleInstances: ["1"], challenge: { kind: "predict", prompt: "Predict", revealLabel: "Reveal" } },
      }],
    };

    const resolved = resolveLocalizedLesson(lesson, "ja");

    expect(resolved.isFallback).toBe(true);
    expect(resolved.resolvedLocale).toBe("en");
    expect(resolved.doc.schemaVersion).toBe(2);
    expect(resolved.doc.availableLocales).toEqual(["en"]);
    expect(resolved.doc.i18n?.en?.steps?.["step-1"].label).toBe("English step");
  });

  it("writes authored lesson text into the active locale", () => {
    const lesson: Lesson = {
      meta: { id: "lesson-1", title: "日本語レッスン" },
      caseId: "normal-sinus",
      noteSpine: jaNote,
    };

    const saved = upsertLessonLocaleContent(lesson, "ja");

    expect(saved.defaultLocale).toBe("ja");
    expect(saved.availableLocales).toEqual(["ja"]);
    expect(saved.i18n?.ja?.title).toBe("日本語レッスン");
    expect(resolveLocalizedLesson(saved, "ja").doc.noteSpine).toEqual(jaNote);
  });

  it("resolves localized case display fields without changing structural fields", () => {
    const source = baseCase();
    const saved = upsertCaseLocaleContent({
      ...source,
      meta: { ...source.meta, title: "日本語ケース" },
      spec: { ...source.spec, title: "日本語ケース", description: "日本語説明", modelLimitations: ["日本語の制約"] },
      instances: source.instances.map((instance) => ({ ...instance, name: "正常" })),
      panels: source.panels.map((panel) => ({ ...panel, title: "ノート" })),
      notes: { p_note: jaNote },
    }, "ja");

    const resolvedJa = resolveLocalizedCaseDocument(saved, "ja").doc;
    const resolvedFr = resolveLocalizedCaseDocument(saved, "fr");

    expect(resolvedJa.meta.title).toBe("日本語ケース");
    expect(resolvedJa.notes?.p_note).toEqual(jaNote);
    expect(resolvedJa.instances[0].id).toBe(source.instances[0].id);
    expect(resolvedJa.instances[0].knobs).toEqual(source.instances[0].knobs);
    expect(resolvedFr.isFallback).toBe(true);
    expect(resolvedFr.doc.meta.title).toBe("English case");
  });

  it("migrates v1 case files on parse", () => {
    const legacy = { ...baseCase(), schemaVersion: 1, defaultLocale: undefined, availableLocales: undefined, i18n: undefined };
    const parsed = parseCaseDocument(serializeCaseDocument(legacy));

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.defaultLocale).toBe("en");
    expect(parsed.availableLocales).toEqual(["en"]);
    expect(parsed.i18n?.en?.title).toBe("English case");
  });

  it("preserves non-current case locales after a remapped non-default locale workbench save", () => {
    const source = baseCase();
    const wavePanel: PanelDef = {
      id: "p_wave",
      type: "WAVEFORM",
      title: "Waveforms",
      w: 6,
      h: 6,
      config: { "1": { visible: true, selectedSignals: ["pressure.LA", "pressure.Ao"] } },
      isSettingsOpen: true,
      timeWindow: 3000,
    };
    const sourcePanels = [...source.panels, wavePanel];
    const sourceWithLayout = {
      ...source,
      panels: sourcePanels,
      workspace: workspaceForPanels(sourcePanels),
    };
    expect(sourceWithLayout.workspace).toEqual({
      schemaVersion: 2,
      hosts: {
        note: { open: true },
        rightRail: { open: true },
        metrics: { open: false },
        main: {},
      },
      learnerLocked: true,
    });
    const twoLocale = upsertCaseLocaleContent({
      ...sourceWithLayout,
      meta: { ...sourceWithLayout.meta, title: "日本語ケース" },
      spec: { ...sourceWithLayout.spec, title: "日本語ケース", description: "日本語説明", modelLimitations: ["日本語の制約"] },
      instances: sourceWithLayout.instances.map((instance) => ({ ...instance, name: "正常" })),
      panels: sourceWithLayout.panels.map((panel) => ({ ...panel, title: panel.id === "p_note" ? "ノート" : "波形" })),
      notes: { p_note: jaNote },
    }, "ja");

    const localized = resolveLocalizedCaseDocument(twoLocale, "ja").doc;
    const remapped = remapWorkbenchLoadIds(caseDocumentToSimInstances(localized), localized.panels, "rt");
    const panelIdMap = new Map(localized.panels.map((panel, index) => [panel.id, remapped.panels[index]?.id ?? panel.id]));
    const retainedI18n = remapCaseI18nContentIds(localized.i18n, {
      instanceIdMap: remapped.idMap,
      panelIdMap,
    });
    const editedInstances = remapped.instances.map((instance) => ({ ...instance, name: "正常（編集）" }));
    const editedPanels = remapped.panels.map((panel) => (
      panel.id === "p_note" ? { ...panel, title: "編集ノート" } : panel
    ));
    const editedNotes = {
      p_note: [{ type: "paragraph", content: [{ type: "text", text: "編集済みノート", styles: {} }] }] as NoteContent,
    };

    const saved = upsertCaseLocaleContent(simInstancesToCaseDocument(editedInstances, editedPanels, {
      id: "case-1",
      title: "日本語ケース編集",
      createdAt: 1,
      updatedAt: 3,
      spec: { title: "日本語ケース編集", description: "日本語説明編集", modelLimitations: ["日本語の制約"] },
      workspace: workspaceForPanels(editedPanels, localized.workspace),
      notes: editedNotes,
      defaultLocale: localized.defaultLocale,
      availableLocales: localized.availableLocales,
      i18n: retainedI18n,
    }), "ja");

    const remappedId = remapped.instances[0].id;
    expect(saved.defaultLocale).toBe("en");
    expect(saved.availableLocales).toEqual(["en", "ja"]);
    expect(Object.keys(saved.i18n ?? {}).sort()).toEqual(["en", "ja"]);
    expect(saved.i18n?.en?.title).toBe("English case");
    expect(saved.i18n?.en?.instances?.[remappedId]?.name).toBe("Normal");
    expect(saved.i18n?.en?.panels?.p_note?.title).toBe("Notes");
    expect(saved.i18n?.en?.notes?.p_note).toEqual(enNote);
    expect(saved.i18n?.ja?.title).toBe("日本語ケース編集");
    expect(saved.i18n?.ja?.instances?.[remappedId]?.name).toBe("正常（編集）");
    expect(saved.i18n?.ja?.panels?.p_note?.title).toBe("編集ノート");
    expect(saved.i18n?.ja?.notes?.p_note).toEqual(editedNotes.p_note);

    const reloaded = caseDocumentToSimInstances(saved);
    expect(reloaded[0].params).toEqual(remapped.instances[0].params);
    expect(reloaded[0].knobs).toEqual(remapped.instances[0].knobs);
    expect(saved.instances.map(({ id, baseline, baselinePatch, knobs, rawPatch, targetVolume, source }) => ({
      id,
      baseline,
      baselinePatch,
      knobs,
      rawPatch,
      targetVolume,
      source,
    }))).toEqual(twoLocale.instances.map((instance) => ({
      id: remapped.idMap.get(instance.id) ?? instance.id,
      baseline: instance.baseline,
      baselinePatch: instance.baselinePatch,
      knobs: instance.knobs,
      rawPatch: instance.rawPatch,
      targetVolume: instance.targetVolume,
      source: instance.source,
    })));
    expect(saved.workspace).toEqual(workspaceForPanels(editedPanels, localized.workspace));
    expect(saved.workspace?.schemaVersion).toBe(2);
    expect(saved.workspace?.hosts.rightRail.open).toBe(true);
    expect("regions" in saved.workspace!).toBe(false);
    expect(editedPanels.map(({ title, ...panel }) => panel)).toEqual(remapped.panels.map(({ title, ...panel }) => panel));
  });
});
