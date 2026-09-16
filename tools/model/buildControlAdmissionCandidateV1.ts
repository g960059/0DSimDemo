import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { canonicalJsonStringify } from "@/engine/integrity";
import { importExactExecutableArtifactModuleV2 } from "@/runtime/ExactExecutableArtifactModuleLoaderV2";
import type { createMainWireControlAdmissionCandidateV1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireControlAdmissionCandidateHostV1";
import { VASCULAR_PRESSURE_INVERSE_POLICY_V1 } from "@/engine/vascularPvConvergentV1";

// Reproducible local-only artifact; never publishes or changes the active bundle.
const originalInverse = resolve("engine/vascularPv.ts");
const candidateInverse = resolve("engine/vascularPvConvergentV1.ts");
const originalIntegrity = resolve("engine/integrity/index.ts");
const candidateIntegrity = resolve("engine/integrity/immutableCanonicalJsonV1.ts");
const originalValidation = resolve("engine/validationStampModeV1.ts");
const candidateValidation = resolve("engine/immutableValidationProofV1.ts");
const redirectedImporters = new Set<string>();
const integrityImporters = new Set<string>();
const validationImporters = new Set<string>();
const built = await build({ configFile: false, logLevel: "silent",
  resolve: { alias: { "@": process.cwd() } },
  plugins: [{ name: "candidate-exact-dependencies", enforce: "pre",
    async resolveId(source, importer) {
      if (!importer || importer === candidateInverse || importer === candidateValidation
        || !/(?:vascularPv(?:\.ts)?|integrity(?:\/index(?:\.ts)?)?|validationStampModeV1(?:\.ts)?)$/.test(source)) return null;
      const dependency = await this.resolve(source, importer, { skipSelf: true });
      if (dependency?.id === originalValidation) {
        validationImporters.add(importer);
        return candidateValidation;
      }
      if (dependency?.id === originalIntegrity) {
        if (importer === candidateIntegrity) return null;
        integrityImporters.add(importer);
        return candidateIntegrity;
      }
      if (dependency?.id !== originalInverse) return null;
      redirectedImporters.add(importer);
      return candidateInverse;
    },
  }],
  define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean"),
    "import.meta.env.VITE_CIRCLEHEART_CANDIDATE_COMPUTE": JSON.stringify("1"),
    __CIRCLEHEART_CANDIDATE_INVERSE_POLICY__: JSON.stringify(VASCULAR_PRESSURE_INVERSE_POLICY_V1) },
  build: { target: "es2022", minify: false, sourcemap: false, write: false,
    lib: { entry: resolve("studio/integrations/mainWireIntegratedV3/MainWireControlAdmissionCandidateV1.entry.ts"), formats: ["es"] },
    rollupOptions: { output: { inlineDynamicImports: true } } } });
const output = Array.isArray(built) ? built[0]! : built;
const chunks = "output" in output ? output.output.filter(chunk => chunk.type === "chunk") : [];
if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Candidate must be self-contained");
const artifact = Buffer.from(chunks[0]!.code);
if (!redirectedImporters.has(resolve("engine/core/circulationGraphKernelV1.ts")))
  throw new Error("Candidate build did not bind the corrected vascular inverse");
if (!integrityImporters.has(resolve("engine/myocardium/MainWireIntegratedModelTransactionV3.ts"))
  || !integrityImporters.has(resolve("engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2.ts")))
  throw new Error("Candidate build did not bind immutable configuration encoding");
if (!validationImporters.has(candidateIntegrity)
  || !validationImporters.has(resolve("engine/coronary/acceptedAutoregulationWindowV3.ts")))
  throw new Error("Candidate build did not bind allocation-free immutable proof reuse");
const module = await importExactExecutableArtifactModuleV2(artifact);
const release = (module.createCircleHeartExactModelReleaseV1 as typeof createMainWireControlAdmissionCandidateV1)();
const manifestBytes = Buffer.from(canonicalJsonStringify(release.manifest));
const lengths = Buffer.alloc(8);
lengths.writeUInt32BE(manifestBytes.length, 0); lengths.writeUInt32BE(artifact.length, 4);
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const directory = resolve("data/model-candidates/control-admission-v1");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, "artifact.mjs.txt"), artifact);
await writeFile(resolve(directory, "candidate.json"), JSON.stringify({
  scope: "ephemeral-review-only", manifest: release.manifest,
  numericalPolicy: VASCULAR_PRESSURE_INVERSE_POLICY_V1,
  artifactRevisionId: sha(Buffer.concat([lengths, manifestBytes, artifact])), artifactSha256: sha(artifact),
}, null, 2) + "\n");
console.log(JSON.stringify({ modelId: release.manifest.modelId, artifactSha256: sha(artifact), publicRegistration: false }));
