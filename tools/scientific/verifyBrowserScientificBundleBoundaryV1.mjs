import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.resolve("dist/assets");
const assetNames = (await readdir(assetsDirectory))
  .filter((name) => name.endsWith(".js"));

const workerName = exactlyOne(
  assetNames.filter((name) => name.startsWith("mainWireScientificWorkerV1-")),
  "scientific Worker chunk",
);
const alphaName = exactlyOne(
  assetNames.filter((name) => name.startsWith("ScientificRuntimeAlphaPage-")),
  "scientific alpha page chunk",
);
const workbenchName = exactlyOne(
  assetNames.filter((name) => name.startsWith("ScientificWorkbenchPageV1-")),
  "scientific Workbench page chunk",
);
const productWorkbenchName = exactlyOne(
  assetNames.filter((name) => name.startsWith("ScientificProductWorkbenchPageV1-")),
  "scientific product Workbench page chunk",
);
const performanceLabName = exactlyOne(
  assetNames.filter((name) => name.startsWith("ScientificBrowserPerformanceLabV0-")),
  "scientific browser performance lab chunk",
);
const officialCycleNames = assetNames.filter((name) =>
  name.startsWith("scientificWorkbenchOfficialCycleV1-"));
if (officialCycleNames.length > 1) {
  throw new Error(
    `scientific Workbench official-cycle code split into unexpected duplicate chunks: ${officialCycleNames.join(", ")}`,
  );
}
const officialCycleName = officialCycleNames[0] ?? null;
const clientName = exactlyOne(
  assetNames.filter((name) => name.startsWith("MainWireScientificWorkerClientV1-")),
  "scientific Worker client chunk",
);
const sources = new Map(await Promise.all(assetNames.map(async (name) => [
  name,
  await readFile(path.join(assetsDirectory, name), "utf8"),
])));
const workerSource = sources.get(workerName);
const alphaSource = sources.get(alphaName);
const workbenchSource = sources.get(workbenchName);
const productWorkbenchSource = sources.get(productWorkbenchName);
const performanceLabSource = sources.get(performanceLabName);
const officialCycleSource = officialCycleName === null
  ? ""
  : sources.get(officialCycleName);
const clientSource = sources.get(clientName);
if (
  workerSource === undefined
  || alphaSource === undefined
  || workbenchSource === undefined
  || productWorkbenchSource === undefined
  || performanceLabSource === undefined
  || officialCycleSource === undefined
  || clientSource === undefined
) {
  throw new Error("scientific bundle chunks disappeared during verification");
}
const alphaSurfaceNames = staticImportClosure([alphaName]);
const workbenchSurfaceNames = staticImportClosure([workbenchName]);
const productWorkbenchSurfaceNames = staticImportClosure([productWorkbenchName]);
const performanceLabSurfaceNames = staticImportClosure([performanceLabName]);
const alphaSurfaceSource = sourceFor(alphaSurfaceNames);
const workbenchSurfaceSource = sourceFor(workbenchSurfaceNames);
const productWorkbenchSurfaceSource = sourceFor(productWorkbenchSurfaceNames);
const performanceLabSurfaceSource = sourceFor(performanceLabSurfaceNames);
const allowedOfficialMainThreadChunks = new Set([
  ...workbenchSurfaceNames,
  ...productWorkbenchSurfaceNames,
  ...performanceLabSurfaceNames,
]);

for (const requiredChunk of [clientName]) {
  if (!productWorkbenchSurfaceNames.has(requiredChunk)) {
    throw new Error(
      `product Workbench static import closure is missing ${requiredChunk}; found ${[...productWorkbenchSurfaceNames].join(", ")}`,
    );
  }
}
if (productWorkbenchSurfaceNames.has(workbenchName)) {
  throw new Error(
    "product Workbench must preserve the Workbench shell without importing the research-page UI",
  );
}
if (!productWorkbenchSource.includes("scientific-product-workbench-host-v1")) {
  throw new Error("product Workbench route marker is missing from its page chunk");
}
for (const marker of [
  "main-wire-scientific-workbench-runtime-v1",
  "scientific-workbench-pane-",
  "Unavailable values are never replaced with zero.",
]) {
  if (!productWorkbenchSurfaceSource.includes(marker)) {
    throw new Error(
      `scientific Workbench shell marker ${JSON.stringify(marker)} is missing`,
    );
  }
}
for (const marker of [
  "Experimental boundary/root inertance requires a mechanismId.",
  "previewWorker-",
  "transitionSteadyWorker-",
  "promoteTransitionSteady",
  "resetInstances",
]) {
  if (productWorkbenchSurfaceSource.includes(marker)) {
    throw new Error(
      `legacy runtime marker ${JSON.stringify(marker)} reached the product Workbench static import closure`,
    );
  }
}
for (const prefix of ["LegacyModelPaneBody-", "Controls-", "Charts-"]) {
  const legacyChunk = assetNames.find((name) => name.startsWith(prefix));
  if (legacyChunk !== undefined && productWorkbenchSurfaceNames.has(legacyChunk)) {
    throw new Error(
      `legacy presentation chunk ${legacyChunk} reached the product Workbench static import closure`,
    );
  }
}

const releaseOnlyMarkers = [
  "resolvedNormalAdultPrior",
  "TR moderate research bracket",
];
for (const marker of releaseOnlyMarkers) {
  const owners = [...sources]
    .filter(([, source]) => source.includes(marker))
    .map(([name]) => name);
  if (owners.length !== 1 || owners[0] !== workerName) {
    throw new Error(
      `full release marker ${JSON.stringify(marker)} must exist only in ${workerName}; found ${owners.join(", ") || "none"}`,
    );
  }
}

const officialDocumentChainWorkerOnlyRawMarkers = [
  '{"assembly":"fixed-normal-adult-five-wall-noncoronary","checkpointId":"main-wire-scientific-session-exact-checkpoint-v3"',
  '{"content":{"lineage":{"kind":"preset-instantiation","parentCaseRef":null',
  '{"content":{"releaseRef":{"id":"circleheart/adult-five-wall-noncoronary"',
];
for (const marker of officialDocumentChainWorkerOnlyRawMarkers) {
  const owners = ownersOf(marker);
  if (owners.length !== 1 || owners[0] !== workerName) {
    throw new Error(
      `official V3 document-chain raw marker ${JSON.stringify(marker)} must exist only in ${workerName}; found ${owners.join(", ") || "none"}`,
    );
  }
}

for (const marker of [
  "circleheart-main-wire-scientific-research-preset-catalog-v1",
  "main-wire/mr-severe",
  "createResearchPresetSession",
]) {
  if (!alphaSurfaceSource.includes(marker)) {
    throw new Error(`alpha metadata/command marker ${JSON.stringify(marker)} is missing`);
  }
  if (!workerSource.includes(marker)) {
    throw new Error(`Worker metadata/command marker ${JSON.stringify(marker)} is missing`);
  }
}

const officialLightweightMainThreadMarkers = [
  '{"entry":{"claims":{"clinicalValidationClaimed":false',
  '{"content":{"caseDocumentRef":{"schemaId":"circleheart-main-wire-scientific-case-document-ref-v1"',
];
for (const marker of officialLightweightMainThreadMarkers) {
  const owners = ownersOf(marker);
  const mainThreadOwners = owners.filter((name) => name !== workerName);
  if (
    mainThreadOwners.length === 0
    || mainThreadOwners.some((name) => !allowedOfficialMainThreadChunks.has(name))
  ) {
    throw new Error(
      `lightweight official catalog/Workspace marker ${JSON.stringify(marker)} escaped the allowed main-thread scientific chunks; found ${owners.join(", ") || "none"}`,
    );
  }
  if (!owners.includes(workerName)) {
    throw new Error(
      `official document-chain Worker marker ${JSON.stringify(marker)} is missing from ${workerName}`,
    );
  }
  if (!workbenchSurfaceSource.includes(marker)) {
    throw new Error(
      `official Workbench surface is missing lightweight marker ${JSON.stringify(marker)}`,
    );
  }
  if (!performanceLabSurfaceSource.includes(marker)) {
    throw new Error(
      `performance lab surface is missing lightweight marker ${JSON.stringify(marker)}`,
    );
  }
}

const officialDocumentCaseCommandMarker = "createOfficialDocumentCaseSession";
if (!workbenchSurfaceSource.includes(officialDocumentCaseCommandMarker)) {
  throw new Error(
    `Workbench command marker ${JSON.stringify(officialDocumentCaseCommandMarker)} is missing`,
  );
}
if (!productWorkbenchSurfaceSource.includes(officialDocumentCaseCommandMarker)) {
  throw new Error(
    `Product Workbench command marker ${JSON.stringify(officialDocumentCaseCommandMarker)} is missing`,
  );
}
if (!workerSource.includes(officialDocumentCaseCommandMarker)) {
  throw new Error(
    `Worker command marker ${JSON.stringify(officialDocumentCaseCommandMarker)} is missing`,
  );
}
if (!performanceLabSurfaceSource.includes(officialDocumentCaseCommandMarker)) {
  throw new Error(
    `Performance lab command marker ${JSON.stringify(officialDocumentCaseCommandMarker)} is missing`,
  );
}

const performanceSidebandMarker =
  "circleheart-scientific-performance-sideband-v0";
const performanceSidebandOwners = ownersOf(performanceSidebandMarker);
if (
  performanceSidebandOwners.length !== 2
  || !performanceSidebandOwners.includes(workerName)
  || !performanceSidebandOwners.includes(performanceLabName)
) {
  throw new Error(
    `performance sideband marker must be owned only by the Worker and hidden lab chunks; found ${performanceSidebandOwners.join(", ") || "none"}`,
  );
}

const researchDocumentCaseCommandMarker =
  "createResearchDocumentCaseSession";
if (!workbenchSurfaceSource.includes(researchDocumentCaseCommandMarker)) {
  throw new Error(
    `Workbench research command marker ${JSON.stringify(researchDocumentCaseCommandMarker)} is missing`,
  );
}
if (!productWorkbenchSurfaceSource.includes(researchDocumentCaseCommandMarker)) {
  throw new Error(
    `Product Workbench research command marker ${JSON.stringify(researchDocumentCaseCommandMarker)} is missing`,
  );
}
if (!workerSource.includes(researchDocumentCaseCommandMarker)) {
  throw new Error(
    `Worker research command marker ${JSON.stringify(researchDocumentCaseCommandMarker)} is missing`,
  );
}

const researchDocumentCaseWorkerOnlyMarkers = [
  "circleheart-main-wire-scientific-preset-document-content-v1",
  "main-wire-normal-adult-five-wall-fixed-tbv-cold-initialization-v1",
];
for (const marker of researchDocumentCaseWorkerOnlyMarkers) {
  const owners = ownersOf(marker);
  if (owners.length !== 1 || owners[0] !== workerName) {
    throw new Error(
      `research Case/resolved-input marker ${JSON.stringify(marker)} must exist only in ${workerName}; found ${owners.join(", ") || "none"}`,
    );
  }
}

console.log(JSON.stringify({
  pass: true,
  workerChunk: workerName,
  workerBytes: Buffer.byteLength(workerSource),
  alphaChunk: alphaName,
  alphaBytes: Buffer.byteLength(alphaSource),
  workbenchChunk: workbenchName,
  workbenchBytes: Buffer.byteLength(workbenchSource),
  productWorkbenchChunk: productWorkbenchName,
  productWorkbenchBytes: Buffer.byteLength(productWorkbenchSource),
  productWorkbenchStaticImportClosure: [...productWorkbenchSurfaceNames].sort(),
  performanceLabChunk: performanceLabName,
  performanceLabBytes: Buffer.byteLength(performanceLabSource),
  officialCycleSharedChunk: officialCycleName,
  officialCycleSharedBytes: Buffer.byteLength(officialCycleSource),
  clientChunk: clientName,
  clientBytes: Buffer.byteLength(clientSource),
  fullReleaseMarkersOwnedOnlyByWorker: releaseOnlyMarkers,
  officialDocumentChainRawMarkersOwnedOnlyByWorker: officialDocumentChainWorkerOnlyRawMarkers,
  officialLightweightMainThreadMarkers,
  officialDocumentCaseCommandMarker,
  performanceSidebandMarker,
  researchDocumentCaseCommandMarker,
  researchDocumentCaseWorkerOnlyMarkers,
}, null, 2));

function ownersOf(marker) {
  return [...sources]
    .filter(([, source]) => source.includes(marker))
    .map(([name]) => name);
}

function exactlyOne(values, label) {
  if (values.length !== 1) {
    throw new Error(`${label} must resolve to exactly one asset; found ${values.join(", ") || "none"}`);
  }
  return values[0];
}

function sourceFor(names) {
  return [...names]
    .map((name) => sources.get(name))
    .filter((source) => source !== undefined)
    .join("\n");
}

function staticImportClosure(entryNames) {
  const visited = new Set();
  const pending = [...entryNames];
  while (pending.length > 0) {
    const name = pending.pop();
    if (name === undefined || visited.has(name)) continue;
    const source = sources.get(name);
    if (source === undefined) {
      throw new Error(`static import references missing asset ${name}`);
    }
    visited.add(name);
    for (const dependency of staticImportsOf(source)) {
      if (!visited.has(dependency)) pending.push(dependency);
    }
  }
  return visited;
}

function staticImportsOf(source) {
  const dependencies = new Set();
  const patterns = [
    /\bimport(?!\s*\()[^;]*?\bfrom\s*["']\.\/([^"']+\.js)["']/g,
    /\bimport\s*["']\.\/([^"']+\.js)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1] !== undefined) dependencies.add(match[1]);
    }
  }
  return dependencies;
}
