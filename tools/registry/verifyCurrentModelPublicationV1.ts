import { build } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { prepareCurrentModelPublicationV1, CURRENT_MODEL_PUBLICATION_FILES_V1 as files } from "./CurrentModelRegistryAdmissionV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 } from "@/domain/model/MainWireStaticCaseIdentityV1";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": root } },
  define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
  build: { target: "es2022", minify: false, sourcemap: false, write: false,
    lib: { entry: resolve(root, "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseExactModelV1.entry.ts"), formats: ["es"] },
    rollupOptions: { output: { inlineDynamicImports: true } } } });
const result = Array.isArray(built) ? built[0]! : built;
const chunks = "output" in result ? result.output.filter(o => o.type === "chunk") : [];
if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Self-contained current artifact required");
const artifact = Buffer.from(chunks[0]!.code);
if (!artifact.equals(readFileSync(resolve(root, files.artifact)))) throw new Error("Current source differs from the reviewed exact artifact");
const admitted = await prepareCurrentModelPublicationV1(root, { artifact,
  lockJson: readFileSync(resolve(root, files.lock), "utf8"), expectedModelId: MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 });
console.log(JSON.stringify({ status: "admitted", modelId: admitted.manifest.modelId,
  artifactRevisionId: admitted.lock.artifactRevisionId, sourceArtifactEqual: true, ownCapturesValidated: 2, writesPerformed: false }));
