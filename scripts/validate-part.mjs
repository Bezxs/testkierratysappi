import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parts } from "./workspace-parts.mjs";

const selected = process.argv[2];
if (!Object.hasOwn(parts, selected ?? "")) throw new Error("Choose mobile, backend or shared");
const part = parts[selected];
const filters = part.packages.flatMap((name) => ["--filter", `${name}...`]);
const commands = [
  ["exec", "node", "scripts/check-workspace-boundaries.mjs", selected],
  ["exec", "biome", "format", part.directory],
  ["exec", "biome", "lint", part.directory],
  [...filters, "--if-present", "typecheck"],
  [...filters, "--if-present", "test"],
  [...filters, "--if-present", "build"],
];
for (const args of commands) {
  const result = spawnSync("pnpm", args, {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error || result.status !== 0) {
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
}
console.log(
  `PASS: ${selected} and its declared dependencies, without building the other consumer.`,
);
