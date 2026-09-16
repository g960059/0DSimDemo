import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Plugin, type ResolvedConfig, type ViteDevServer } from "vite";
import type * as BuildModule from "./buildModelDocumentPagesV1";
import type * as ServerModule from "../../server/ModelDocumentContentV1";

const cache = "public, max-age=0, s-maxage=300, must-revalidate";

/** Same generated assets and route semantics in development, preview and production. */
export function modelDocumentPagesPluginV1(): Plugin {
  let config: ResolvedConfig;
  let runtime: Promise<ViteDevServer> | undefined;
  // Load application TS through Vite's alias/SSR transform, rather than Node's config loader.
  const getRuntime = () => runtime ??= createServer({ configFile: false, root: config.root, appType: "custom",
    server: { middlewareMode: true, hmr: false },
    resolve: { alias: { "@": config.root }, dedupe: ["react", "react-dom"] },
    define: { "import.meta.env.PROD": String(config.isProduction) },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: { noExternal: ["react-router", "react-router-dom"], resolve: { conditions: ["module", "module-sync", "node"] } },
  });
  const loadBuild = async () => (await getRuntime()).ssrLoadModule("/tools/modelDocumentation/buildModelDocumentPagesV1.tsx") as Promise<typeof BuildModule>;
  const loadHandler = async () => (await getRuntime()).ssrLoadModule("/server/ModelDocumentContentV1.ts") as Promise<typeof ServerModule>;
  const closeRuntime = async () => { if (runtime) { await (await runtime).close(); runtime = undefined; } };
  const diskRead = async (path: string) => {
    try { return await readFile(resolve(config.root, config.build.outDir, `.${path}`), "utf8"); }
    catch (error) { if (["ENOENT", "ENAMETOOLONG"].includes((error as NodeJS.ErrnoException).code ?? "")) return null; throw error; }
  };
  const middleware = (readAsset: (path: string) => Promise<string | null>, template: () => Promise<string>, production: boolean) =>
    async (incoming: IncomingMessage, outgoing: ServerResponse, next: (error?: unknown) => void) => {
      try {
        const url = new URL(incoming.url ?? "/", "http://localhost");
        const request = new Request(url, { method: incoming.method, headers: incoming.headers as Record<string, string> });
        let response: Response | null;
        if (url.pathname.startsWith("/model-documents/")) {
          // Only generated, validated paths are served, never arbitrary repository files.
          const safe = /^\/model-documents\/v1\/[a-z0-9.-]+\/[0-9a-f]{64}\/(?:(?:ja|en)\/(?:guide|presets)(?:-r-[0-9a-f]+)?\.(?:json|html)|(?:ja|en)\/(?:archive\.html|tables\.csv)|measurements\.json)$/.test(url.pathname);
          const body = safe && (request.method === "GET" || request.method === "HEAD") ? await readAsset(url.pathname) : null;
          response = new Response(request.method === "HEAD" ? null : body ?? "Not found", { status: body === null ? 404 : 200, headers: {
            "Content-Type": url.pathname.endsWith(".json") ? "application/json; charset=utf-8" : url.pathname.endsWith(".csv") ? "text/csv; charset=utf-8" : "text/html; charset=utf-8",
            "Cache-Control": body === null ? "no-store" : cache,
          } });
        } else if (/^\/(ja|en)\/models(?:\/|$)/.test(url.pathname)) {
          const { handleModelDocumentRequestV1 } = await loadHandler();
          response = await handleModelDocumentRequestV1(request, { canonicalOrigin: "http://localhost", clientTemplate: await template(), readAsset, production });
        } else return next();
        if (!response) return next();
        outgoing.statusCode = response.status;
        response.headers.forEach((value, key) => outgoing.setHeader(key, value));
        outgoing.end(request.method === "HEAD" ? undefined : Buffer.from(await response.arrayBuffer()));
      } catch (error) { next(error); }
    };
  return {
    name: "model-document-pages-v1",
    configResolved(value) { config = value; },
    async writeBundle() {
      if (config.build.ssr) return;
      const { buildModelDocumentPagesV1 } = await loadBuild();
      await buildModelDocumentPagesV1({ root: config.root, production: config.isProduction,
        emit: async (path, content) => {
          const target = resolve(config.root, config.build.outDir, `.${path}`);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, content);
        } });
    },
    closeBundle: closeRuntime,
    configurePreviewServer(server) {
      server.httpServer.on("close", () => { void closeRuntime(); });
      server.middlewares.use(middleware(diskRead, () => readFile(resolve(config.root, config.build.outDir, "index.html"), "utf8"), true));
    },
    configureServer(server) {
      server.httpServer?.on("close", () => { void closeRuntime(); });
      let assets: Promise<Map<string, string>> | undefined;
      const load = () => assets ??= (async () => {
        const result = new Map<string, string>();
        const { buildModelDocumentPagesV1 } = await loadBuild();
        await buildModelDocumentPagesV1({ root: config.root, production: false, emit: (path, content) => { result.set(path, content); } });
        return result;
      })();
      server.watcher.on("change", path => {
        if (path.includes("modelDocumentation") || path.includes("components/model/") || path.endsWith("current-baseline-selection-v1.json")) assets = undefined;
      });
      server.middlewares.use(middleware(async path => (await load()).get(path) ?? null,
        async () => server.transformIndexHtml("/", await readFile(resolve(config.root, "index.html"), "utf8")), false));
    },
  };
}
