import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { prepareMainWireBaselineLaunchV1 } from "./mainWireBaselineLaunchSelectionV1";

const { values } = parseArgs({ options: { run: { type: "string" }, output: { type: "string" },
  "baseline-id": { type: "string" } } });
if (!values.run || !values.output || !values["baseline-id"]) {
  throw new Error("--run QUALIFIED_RUN_DIRECTORY --baseline-id ID --output NEW_FILE");
}
const record = await prepareMainWireBaselineLaunchV1(values.run, values["baseline-id"]);
await writeFile(values.output, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${values.output}\n`);
