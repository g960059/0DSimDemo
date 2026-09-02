import {
  runMainWireBaselineNumericalFloorAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";

const coarseDtArgument = process.argv[2];
const audit = await runMainWireBaselineNumericalFloorAuditV1(
  coarseDtArgument === undefined ? undefined : Number(coarseDtArgument),
  (runLabel, phase) => {
    process.stderr.write(`[numerical-floor] ${runLabel} ${phase}\n`);
  },
);
process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
