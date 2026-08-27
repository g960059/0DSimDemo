import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const config = readFileSync(`${repositoryRoot}/supabase/config.toml`, "utf8");
const projectId = config.match(/^project_id\s*=\s*"([a-zA-Z0-9_-]+)"$/m)?.[1];
if (projectId === undefined) {
  throw new Error("supabase/config.toml must contain a simple project_id");
}

const testPath = `${repositoryRoot}/supabase/tests/migrations/authoring_retry_upgrade.test.sql`;
const migrationPath = `${repositoryRoot}/supabase/migrations/20260827000100_simplify_authoring_retry_authority.sql`;
const includeMarker = "\\ir ../../migrations/20260827000100_simplify_authoring_retry_authority.sql";
const test = readFileSync(testPath, "utf8");
if (!test.includes(includeMarker)) {
  throw new Error("Authoring retry upgrade test is missing its migration marker");
}
const sql = test.replace(includeMarker, () => readFileSync(migrationPath, "utf8"));

const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    `supabase_db_${projectId}`,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-X",
  ],
  { cwd: repositoryRoot, encoding: "utf8", input: sql },
);

const output = result.stdout ?? "";
process.stdout.write(output);
process.stderr.write(result.stderr ?? "");
if (
  result.status !== 0
  || /\bnot ok \d+\b/.test(output)
  || !/\bok 5 - A binding-only retry fails closed\b/.test(output)
) {
  process.exit(result.status || 1);
}
