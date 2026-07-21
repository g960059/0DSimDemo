import {
  runHeartMateIiStanfieldMeanOperatingPointContextV1,
} from "@/engine/devices/experiments/HeartMateIiStanfieldMeanOperatingPointContextV1";

process.stdout.write(`${JSON.stringify(
  runHeartMateIiStanfieldMeanOperatingPointContextV1(),
  null,
  2,
)}\n`);
