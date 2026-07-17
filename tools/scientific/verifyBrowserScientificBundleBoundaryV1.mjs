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
const sources = new Map(await Promise.all(assetNames.map(async (name) => [
  name,
  await readFile(path.join(assetsDirectory, name), "utf8"),
])));
const workerSource = sources.get(workerName);
const alphaSource = sources.get(alphaName);
if (workerSource === undefined || alphaSource === undefined) {
  throw new Error("scientific bundle chunks disappeared during verification");
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

for (const marker of [
  "circleheart-main-wire-scientific-research-preset-catalog-v1",
  "main-wire/mr-severe",
  "createResearchPresetSession",
]) {
  if (!alphaSource.includes(marker)) {
    throw new Error(`alpha metadata/command marker ${JSON.stringify(marker)} is missing`);
  }
  if (!workerSource.includes(marker)) {
    throw new Error(`Worker metadata/command marker ${JSON.stringify(marker)} is missing`);
  }
}

console.log(JSON.stringify({
  pass: true,
  workerChunk: workerName,
  workerBytes: Buffer.byteLength(workerSource),
  alphaChunk: alphaName,
  alphaBytes: Buffer.byteLength(alphaSource),
  fullReleaseMarkersOwnedOnlyByWorker: releaseOnlyMarkers,
}, null, 2));

function exactlyOne(values, label) {
  if (values.length !== 1) {
    throw new Error(`${label} must resolve to exactly one asset; found ${values.join(", ") || "none"}`);
  }
  return values[0];
}
