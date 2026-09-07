import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { prepareStandard72RegistryAdmissionV1 as prepare, readStandard72AdmissionFilesV1 as read,
  verifyStandard72ScientificEvidenceV1 as verifyScience,
  assertStandard72AdmissionLockV1 as assertLock, STANDARD72_RELEASE_FILES_V1 as paths } from "@/tools/registry/Standard72RegistryAdmissionV1";
import * as builder from "@/tools/registry/BuildStandard72ArtifactV1";
import { verifyMainWireStandard72RegistryV1 as verifyRegistry } from "@/tools/registry/verifyMainWireStandard72RegistryV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import type { ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";

const directory = "studio/integrations/mainWireIntegratedV3/";
const candidate = () => ({
  artifact: readFileSync(directory + "MainWireIntegratedStudioStandard72ExactModelV1.artifact.mjs"),
  clientJson: readFileSync(directory + "MainWireIntegratedStudioStandard72ExactModelV1.client.json", "utf8"),
});
function edit(raw: string, patch: (value: any) => void) {
  const value = JSON.parse(raw); patch(value); return JSON.stringify(value, null, 2) + "\n";
}
describe("Standard72 bounded reviewed scientific admission", () => {
  it("binds both actual checkpoint restores and launch step to the reviewed artifact/Surface", async () => {
    const result = await prepare(read(process.cwd(), candidate()), modelId);
    expect(result.lock.scientificAdmission).toMatchObject({
      policyId: "main-wire-prospective-baseline-admission-v1", clinicalNormalityClaimed: false,
    });
    expect(result.lock.releaseQualification.surfaceReleaseId).toBe(surface.surfaceReleaseId);
    expect(result.lock.scientificAdmission).toEqual(verifyScience(read(process.cwd())).scientificAdmission);
    expect(result.published).toBe(false);
    expect(result.referenceFlags.some(f => f.metricId === "timing.tei-index")).toBe(true);
    expect(result.referenceFlags.some(f => f.metricId === "left-ventricle.maximum-dpdt")).toBe(true);
    expect(() => assertLock(JSON.stringify(result.lock), result.lock)).not.toThrow();
    expect(() => assertLock(JSON.stringify({ ...result.lock, scientificAdmission: undefined }), result.lock)).toThrow(/complete qualification/);
    expect(() => assertLock(JSON.stringify({ ...result.lock, releaseQualification: undefined }), result.lock)).toThrow(/complete qualification/);
    expect(() => assertLock(JSON.stringify({ ...result.lock, artifactRevisionId: "0".repeat(64) }), result.lock)).toThrow(/complete qualification/);
  });

  it("does not invalidate the scientific assessment when release packaging changes, but still rejects an unqualified release", async () => {
    const files = read(process.cwd(), candidate());
    const science = verifyScience(files).scientificAdmission;
    expect(Object.keys(science).sort()).toEqual([
      "clinicalNormalityClaimed", "constructionSha256", "eligibility", "policyId", "provenance",
    ]);
    const changed = { ...files, executable: "{}", artifact: new Uint8Array([0]) };
    expect(verifyScience(changed).scientificAdmission).toEqual(science);
    await expect(prepare(changed, modelId)).rejects.toThrow(/executable qualification/);
    await expect(prepare(files, modelId, { ...surface, derivedOutputCatalog: [] })).rejects.toThrow(/Surface/);
    expect(verifyScience(files).scientificAdmission).toEqual(science);
  });

  it.each([
    ["one-grid", (p: any) => p.sources.pop()],
    ["no-observations", (p: any) => p.observations = []],
    ["rest-only", (p: any) => { p.reserve.responses = []; p.pressureRateQuality = []; }],
    ["missing-operating", (p: any) => p.observations[0].rest.operating.pop()],
    ["one-CMR-stratum", (p: any) => p.observations[0].rest.comparison.entries.find((e: any) => e.role === "demographic-comparison").comparisons.pop()],
    ["missing-pressure-rate", (p: any) => p.pressureRateQuality.pop()],
    ["missing-reserve-direction", (p: any) => p.reserve.responses.pop()],
    ["missing-reserve-margin", (p: any) => p.reserve.responses[0].ratioMargins.pop()],
    ["unresolved-tau", (p: any) => p.observations[0].tau.status = "unavailable"],
    ["hidden-rebound", (p: any) => p.observations[0].tau.relaxationTrace.maximumRiseFromRunningMinimumMmHg = 1],
    ["erased-warning", (p: any) => p.referenceFlags = []],
    ["relaxed-target", (p: any) => p.policy.operating[0].lower = 0],
  ] as const)("rejects changed reviewed evidence: %s", async (_name, patch) => {
    const files = read(process.cwd(), candidate());
    await expect(prepare({ ...files, eligibility: edit(files.eligibility, patch) }, modelId)).rejects.toThrow(/sealed evidence/);
  });

  it("rejects altered sources, cold binding, executable evidence, fixtures, checkpoints and pins before any publication effects", async () => {
    const files = read(process.cwd(), candidate()), upload = vi.fn(), rpc = vi.fn(), write = vi.fn();
    const publishAfterAdmission = async (input: typeof files, id = modelId, selected: ModelSurfaceReleaseManifestV1 = surface) => {
      const admitted = await prepare(input, id, selected);
      write(admitted); upload(admitted.artifact); rpc(admitted.lock);
    };
    for (const key of ["provenance", "binding", "executable"] as const) {
      await expect(publishAfterAdmission({ ...files, [key]: "{}" })).rejects.toThrow(/sealed evidence/);
    }
    await expect(publishAfterAdmission(files, "unknown" as typeof modelId)).rejects.toThrow(/modelId/);
    await expect(publishAfterAdmission({ ...files, artifact: new Uint8Array([1]) })).rejects.toThrow(/artifact/);
    await expect(publishAfterAdmission({ ...files, clientJson: edit(files.clientJson, c =>
      c.defaultFixture.hemodynamicResearchInputs.totalBloodVolumeMl = 4940) })).rejects.toThrow(/fixture/);
    for (const key of ["periodic", "launch"] as const) {
      await expect(publishAfterAdmission({ ...files, [key]: edit(files[key], c => c.acceptedTimeSec += .002) })).rejects.toThrow(/SHA|clock/);
    }
    await expect(publishAfterAdmission(files, modelId, { ...surface, surfaceReleaseId: "changed" })).rejects.toThrow(/Surface/);
    await expect(publishAfterAdmission(files, modelId, { ...surface, derivedOutputCatalog: [] })).rejects.toThrow(/Surface/);
    expect(write).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
  });

  it("owns the same detached bytes across async validation", async () => {
    const files = read(process.cwd(), candidate()), original = Uint8Array.from(files.artifact);
    const pending = prepare(files, modelId);
    files.artifact.fill(0);
    const result = await pending;
    // Compare every byte natively. Generic deep-object assertions traverse
    // millions of byte properties and consumed the CI timeout by themselves.
    expect(Buffer.from(result.artifact).equals(original)).toBe(true);
    expect(result.artifact).not.toBe(files.artifact);
  });

  it("the real --update path writes nothing when scientific evidence is missing or changed", async () => {
    const root = mkdtempSync(join(tmpdir(), "standard72-admission-test-"));
    // Building is tested by the deterministic registry CLI. Here only replace
    // its expensive build with the exact committed bytes, not the real guard.
    const build = vi.spyOn(builder, "buildStandard72ArtifactV1").mockImplementation(async () => candidate().artifact);
    const files = read(process.cwd(), candidate());
    try {
      for (const key of ["provenance", "executable", "binding", "periodic", "launch"] as const) {
        mkdirSync(dirname(join(root, paths[key])), { recursive: true });
        writeFileSync(join(root, paths[key]), files[key]);
      }
      const noReleaseFiles = () => [paths.artifact, paths.client, paths.lock].every(p => !existsSync(join(root, p)));
      await expect(verifyRegistry(root, true)).rejects.toThrow(/ENOENT/);
      expect(noReleaseFiles()).toBe(true);
      writeFileSync(join(root, paths.eligibility), edit(files.eligibility, p => p.reserve.responses = []));
      await expect(verifyRegistry(root, true)).rejects.toThrow(/sealed evidence/);
      expect(noReleaseFiles()).toBe(true);
      writeFileSync(join(root, paths.eligibility), files.eligibility);
      await expect(verifyRegistry(root, true)).resolves.toMatchObject({ status: "admitted-local-package", published: false });
      expect(readFileSync(join(root, paths.artifact)).equals(candidate().artifact)).toBe(true);
      await expect(verifyRegistry(root)).resolves.toMatchObject({ updated: false });
    } finally { build.mockRestore(); rmSync(root, { recursive: true, force: true }); }
  });
});
