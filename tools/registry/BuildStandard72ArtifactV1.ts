import { build } from "vite";
import { resolve } from "node:path";

export async function buildStandard72ArtifactV1(root: string): Promise<Uint8Array> {
  const built = await build({ configFile: false, logLevel: "silent",
    define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
    resolve: { alias: { "@": root } },
    build: { target: "es2022", minify: false, sourcemap: false, write: false,
      lib: { entry: resolve(root, "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.entry.ts"), formats: ["es"] },
      rollupOptions: { output: { inlineDynamicImports: true } } } });
  const outputs = Array.isArray(built) ? built : [built];
  const chunks = outputs.length === 1 && "output" in outputs[0]! ? outputs[0].output.filter(o => o.type === "chunk") : [];
  if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Self-contained Standard72 artifact required");
  return new TextEncoder().encode(chunks[0]!.code);
}
