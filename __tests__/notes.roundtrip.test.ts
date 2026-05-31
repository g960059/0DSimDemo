import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances, simInstancesToCaseDocument } from "@/caseDoc";
import { parseCaseDocument, serializeCaseDocument } from "@/casePersist";
import type { NoteContent } from "@/noteTypes";
import { officialCaseById } from "@/officialCases";
import { remapWorkbenchLoadIds } from "@/workbenchLoad";

const NOTE_FIXTURE: NoteContent = [
  {
    type: "paragraph",
    content: [{ type: "text", text: "Preserve raw BlockNote JSON.", styles: {} }],
  },
  {
    type: "quiz",
    props: {
      question: "Round-trip?",
      options: "Yes|No",
      answerIndex: "0",
    },
  },
  {
    type: "equation",
    props: { tex: "P = E(t) \\cdot (V - V_0)" },
  },
  {
    type: "controller_ref",
    props: { paramKey: "contractility", label: "Contractility" },
  },
];

describe("case notes round-trip", () => {
  it("preserves raw BlockNote note JSON through case serialization and parse", () => {
    const source = officialCaseById("normal-sinus")!;
    const instances = caseDocumentToSimInstances(source);
    const doc = simInstancesToCaseDocument(instances, source.panels, {
      id: "note-roundtrip",
      title: "Note round-trip",
      createdAt: 1,
      updatedAt: 2,
      spec: source.spec,
      notes: { p_note: NOTE_FIXTURE },
    });

    const parsed = parseCaseDocument(serializeCaseDocument(doc));
    expect(parsed.notes).toEqual({ p_note: NOTE_FIXTURE });
    expect(caseDocumentToSimInstances(parsed).length).toBe(instances.length);
  });

  it("keeps note keys independent from loaded instance id remapping", () => {
    const source = officialCaseById("normal-sinus")!;
    const instances = caseDocumentToSimInstances(source);
    const remapped = remapWorkbenchLoadIds(instances, source.panels, "notes");

    expect(source.notes?.p_note).toEqual(expect.any(Array));
    expect(remapped.panels.some((panel) => panel.id === "p_note")).toBe(true);
    expect(source.notes?.["p_note"]).toEqual(source.notes?.p_note);
  });

  it("drops malformed note entries on parse without making notes mandatory", () => {
    const source = officialCaseById("normal-sinus")!;
    const parsed = parseCaseDocument(JSON.stringify({
      ...source,
      notes: {
        p_note: NOTE_FIXTURE,
        broken: { type: "paragraph" },
      },
    }));

    expect(parsed.notes).toEqual({ p_note: NOTE_FIXTURE });
    expect(parseCaseDocument(JSON.stringify({ ...source, notes: "bad" })).notes).toBeUndefined();
  });
});
