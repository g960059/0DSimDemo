import path from "node:path";
import { build } from "vite";

const root = process.cwd();
const hostEntry = path.resolve(
  root,
  "engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1.ts",
);
const result = await build({
  configFile: false,
  root,
  logLevel: "error",
  resolve: {
    alias: {
      "@": root,
    },
  },
  build: {
    write: false,
    minify: false,
    rollupOptions: {
      input: hostEntry,
      preserveEntrySignatures: "strict",
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

const outputs = Array.isArray(result)
  ? result.flatMap(({ output }) => output)
  : result.output;
const sourceByName = new Map(outputs.map((item) => [
  item.fileName,
  item.type === "asset" ? String(item.source) : item.code,
]));
const hostName = exactlyOne(
  outputs
    .filter((item) => item.type === "chunk" && item.isEntry)
    .map(({ fileName }) => fileName),
  "integrated browser host entry",
);
const workerName = exactlyOne(
  [...sourceByName]
    .filter(([, source]) =>
      source.includes("main-wire-integrated-scientific-worker-kernel-v1")
    )
    .map(([fileName]) => fileName),
  "integrated V3 Worker asset",
);
const hostSource = sourceByName.get(hostName);
const workerSource = sourceByName.get(workerName);
if (hostSource === undefined || workerSource === undefined) {
  throw new Error("integrated browser boundary build output disappeared");
}

const workerOnlyMarkers = [
  "main-wire-integrated-scientific-worker-kernel-v1",
  "main-wire-integrated-scientific-session-v1",
  "main-wire-base-coronary-v3-dynamic-mcs-composed-rhythm-transaction-v3",
  "heartmate-ii-literature-r-l-lane-v1-experimental-not-release-approved",
];
for (const marker of workerOnlyMarkers) {
  if (!workerSource.includes(marker)) {
    throw new Error(
      `integrated Worker is missing runtime marker ${JSON.stringify(marker)}`,
    );
  }
  if (hostSource.includes(marker)) {
    throw new Error(
      `integrated runtime marker ${JSON.stringify(marker)} reached the main-thread host bundle`,
    );
  }
}
for (const marker of [
  "integrated browser host rejected",
  "main-wire-integrated-scientific-worker-client-v1",
  "main-wire-integrated-scientific-worker-command-protocol-v1",
]) {
  if (!hostSource.includes(marker)) {
    throw new Error(
      `integrated main-thread transport marker ${JSON.stringify(marker)} is missing`,
    );
  }
}

console.log(JSON.stringify({
  pass: true,
  isolatedEntry:
    "engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1.ts",
  mainThreadHostAsset: hostName,
  mainThreadHostBytes: Buffer.byteLength(hostSource),
  workerAsset: workerName,
  workerBytes: Buffer.byteLength(workerSource),
  workerOnlyMarkers,
}, null, 2));

function exactlyOne(values, label) {
  if (values.length !== 1) {
    throw new Error(
      `${label} must resolve to exactly one output; found ${values.join(", ") || "none"}`,
    );
  }
  return values[0];
}
