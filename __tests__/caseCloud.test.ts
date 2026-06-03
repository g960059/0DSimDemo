import { describe, expect, it } from "vitest";
import { caseDocFields, createUserCaseId, docContentToCaseDocument, isValidCaseId, slugifyCaseTitle } from "@/caseCloud";
import { simInstancesToCaseDocument } from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import type { SimInstance } from "@/types";

const base = defaultParams();
const knobs = { ...neutralKnobs(base), contractility: 0.8 };
const inst: SimInstance = {
  id: "normal",
  name: "Normal",
  color: "#38bdf8",
  isVisible: true,
  knobBaseline: base,
  knobs,
  params: applyKnobs(base, knobs, KNOB_MAPPING_VERSION),
  targetVolume: 5600,
};

const doc = simInstancesToCaseDocument([inst], [], {
  id: "case-1",
  title: "Normal vs AMI",
  ownerId: "u1",
  createdAt: 1,
  updatedAt: 2,
  spec: { title: "Normal vs AMI", description: "Compare baseline with AMI.", modelLimitations: ["0D model."] },
});

describe("caseCloud pure helpers", () => {
  it("builds metadata wrapper fields while preserving canonical content", () => {
    const remixedDoc = { ...doc, source: { kind: "remix" as const, caseId: "normal-sinus" }, derivedFrom: "normal-sinus" };
    const fields = caseDocFields(remixedDoc, "u1", { status: "published", visibility: "public" });
    const content = JSON.parse(fields.content);

    expect(fields.title).toBe("Normal vs AMI");
    expect(fields.description).toBe("Compare baseline with AMI.");
    expect(fields.status).toBe("published");
    expect(fields.visibility).toBe("public");
    expect(fields.ownerId).toBe("u1");
    expect(fields.schemaVersion).toBe(doc.schemaVersion);
    expect(fields.workspaceSchemaVersion).toBe(1);
    expect(fields.source).toBe("remix:normal-sinus");
    expect(fields.derivedFrom).toBe("normal-sinus");
    expect(content.meta.id).toBe("case-1");
    expect(content.ownerId).toBe("u1");
    expect(content.source).toEqual({ kind: "remix", caseId: "normal-sinus" });
  });

  it("parses content only when the expected case id matches", () => {
    const fields = caseDocFields(doc, "u1");

    expect(docContentToCaseDocument(fields.content, "case-1")?.meta.id).toBe("case-1");
    expect(docContentToCaseDocument(fields.content, "other")).toBeUndefined();
    expect(docContentToCaseDocument("{bad json", "case-1")).toBeUndefined();
  });

  it("validates Firestore-safe case ids", () => {
    expect(isValidCaseId("abc-XYZ_123")).toBe(true);
    expect(isValidCaseId("")).toBe(false);
    expect(isValidCaseId("has space")).toBe(false);
    expect(isValidCaseId("slash/id")).toBe(false);
    expect(isValidCaseId("x".repeat(128))).toBe(true);
    expect(isValidCaseId("x".repeat(129))).toBe(false);
  });

  it("creates Firestore-safe user case ids from arbitrary titles", () => {
    expect(slugifyCaseTitle("Normal vs AMI")).toBe("normal-vs-ami");
    expect(slugifyCaseTitle("正常とAMI")).toBe("ami");

    const id = createUserCaseId("正常とAMI", "uid.with/slash", 1, "n*o*n*c*e");
    expect(id).toBe("ami-uidwithslash-1-nonce");
    expect(isValidCaseId(id)).toBe(true);
    expect(createUserCaseId("x".repeat(500), "u", 1, "n").length).toBeLessThanOrEqual(128);
  });
});
