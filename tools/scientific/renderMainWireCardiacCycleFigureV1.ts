import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { prepareMainWireCardiacCycleFigureV1, renderMainWireCardiacCyclePvSvgV1, renderMainWireCardiacCycleWaveSvgV1, renderMainWireCardiacCycleEaSvgV1, renderMainWireCardiacCycleFillingSvgV1 } from "@/studio/presentation/scientificFigures/MainWireCardiacCycleFigureV1";

const [inputPath, scenarioId, outputPrefix] = process.argv.slice(2);
if (!inputPath || !scenarioId || !outputPrefix) throw new Error("Usage: vite-node --script tools/scientific/renderMainWireCardiacCycleFigureV1.ts <experiment.trace.result.json> <scenarioId> <output-prefix>");
const bytes = readFileSync(inputPath), command = JSON.parse(bytes.toString());
if (command.ok !== true || command.action !== "experiment.trace") throw new Error("Expected a successful experiment.trace command result");
const figure = prepareMainWireCardiacCycleFigureV1(command.result, scenarioId);
for (const locale of ["ja", "en"] as const) {
  writeFileSync(`${outputPrefix}.pv.${locale}.svg`, renderMainWireCardiacCyclePvSvgV1(figure, locale));
  writeFileSync(`${outputPrefix}.wave.${locale}.svg`, renderMainWireCardiacCycleWaveSvgV1(figure, locale));
  writeFileSync(`${outputPrefix}.ea.${locale}.svg`, renderMainWireCardiacCycleEaSvgV1(figure, locale));
  if (figure.points[0]!.values["hemodynamics.pressure.mean.LA"] !== undefined)
    writeFileSync(`${outputPrefix}.filling.${locale}.svg`, renderMainWireCardiacCycleFillingSvgV1(figure, locale));
}
writeFileSync(`${outputPrefix}.json`, JSON.stringify({ ...figure, traceFileSha256: createHash("sha256").update(bytes).digest("hex") }, null, 2));
process.stdout.write(`${JSON.stringify({ outputPrefix, measurement: figure.measurement, methodId: figure.metrics.methodId })}\n`);
