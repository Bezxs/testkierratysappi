import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  checkCompilerAliases,
  checkDependencyGraph,
  checkSpecifier,
  checkWorkspace,
  moduleSpecifiers,
  readWorkspace,
} from "../check-workspace-boundaries.mjs";
import { canDependOn, dependencyClosure, parts } from "../workspace-parts.mjs";

const root = resolve(new URL("../../", import.meta.url).pathname);
const fixture = (name, part, dependencies = {}) => ({
  name,
  part,
  directory: resolve(root, part, name.split("/").at(-1)),
  manifest: { dependencies, exports: { ".": "./src/index.ts", "./public": "./src/public.ts" } },
});
const shared = fixture("@kierratysappi/test-core", "shared");
const backend = fixture("@kierratysappi/test-api", "backend", { [shared.name]: "workspace:*" });
const mobile = fixture("@kierratysappi/test-app", "mobile", { [shared.name]: "workspace:*" });
const packages = [mobile, backend, shared];
const check = (specifier, pkg = mobile) =>
  checkSpecifier(specifier, pkg, packages, resolve(pkg.directory, "src/example.ts"));

test("exactly three ownership parts allow common contracts but not consumer coupling", () => {
  assert.deepEqual(Object.keys(parts).sort(), ["backend", "mobile", "shared"]);
  for (const from of Object.keys(parts))
    for (const to of Object.keys(parts))
      assert.equal(canDependOn(from, to), from === to || (from !== "shared" && to === "shared"));
  assert.deepEqual(checkDependencyGraph(packages), []);
});
test("rejects mobile-to-backend and shared-to-consumer dependencies", () => {
  assert.match(check(backend.name), /cannot import backend/);
  assert.match(check(mobile.name, shared), /cannot import mobile/);
  assert.match(check(backend.name, shared), /cannot import backend/);
  assert.match(
    checkDependencyGraph([
      { ...mobile, manifest: { dependencies: { [backend.name]: "workspace:*" } } },
      backend,
      shared,
    ]).join("\n"),
    /cannot depend on backend/,
  );
});
test("private paths, undeclared workspace imports and computed imports fail closed", () => {
  assert.equal(check(shared.name + "/public"), null);
  assert.match(check(shared.name + "/src/index"), /Private package path/);
  assert.match(check(shared.name, { ...mobile, manifest: { dependencies: {} } }), /Undeclared/);
  assert.match(check(null), /Computed/);
  assert.match(check("@kierratysappi/missing"), /Unknown workspace/);
});
test("relative and absolute imports cannot escape a package boundary", () => {
  assert.equal(check("./local"), null);
  assert.equal(check("../within-package"), null);
  assert.match(check("../../../backend/api/src/app"), /leaves its own package/);
  assert.match(check(resolve(root, "backend/api/src/app")), /leaves its own package/);
});

test("compiler aliases cannot hide cross-part paths or shadow public exports", () => {
  assert.match(
    checkCompilerAliases(mobile, { compilerOptions: { baseUrl: "../../backend" } }).join("\n"),
    /baseUrl leaves/,
  );
  assert.deepEqual(
    checkCompilerAliases(mobile, { compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
    [],
  );
  assert.match(
    checkCompilerAliases(mobile, {
      compilerOptions: { paths: { "@/*": ["../../backend/*"] } },
    }).join("\n"),
    /leaves its own package/,
  );
  assert.match(
    checkCompilerAliases(mobile, {
      compilerOptions: { paths: { "@kierratysappi/test-core": ["./src/private.ts"] } },
    }).join("\n"),
    /shadow/,
  );
});
test("backend/shared UI and mobile server dependencies are rejected", () => {
  for (const specifier of ["react", "react-native", "expo-location", "@expo/metro-runtime"])
    assert.match(check(specifier, shared), /UI\/native/);
  assert.match(check("react", backend), /UI\/native/);
  for (const specifier of ["fastify", "@fastify/cors", "pg", "@electric-sql/pglite"])
    assert.match(check(specifier), /Server\/database/);
  assert.match(check("node:fs", shared), /platform-independent/);
});
test("TypeScript parsing checks type imports, exports, dynamic imports and require, not comments", () => {
  assert.deepEqual(
    moduleSpecifiers(
      `// import("ignored")
import type { T } from "one";
export { value } from "two";
const a = import("three"); const b = require("four");
const c = import(name); const d = require(name);
type T = import("five").T; import legacy = require("six");`,
      "fixture.ts",
    ),
    ["one", "two", "three", "four", null, null, "five", "six"],
  );
});
test("dependency cycles, missing packages and non-workspace versions are rejected", () => {
  const a = fixture("@kierratysappi/a", "shared", { "@kierratysappi/b": "workspace:*" });
  const b = fixture("@kierratysappi/b", "shared", { "@kierratysappi/a": "workspace:*" });
  assert.match(checkDependencyGraph([a, b]).join("\n"), /Dependency cycle/);
  assert.match(
    checkDependencyGraph([
      fixture("@kierratysappi/x", "shared", { "@kierratysappi/missing": "workspace:*" }),
    ]).join("\n"),
    /unknown workspace/,
  );
  assert.match(
    checkDependencyGraph([
      { ...mobile, manifest: { dependencies: { [shared.name]: "*" } } },
      shared,
    ]).join("\n"),
    /checked workspace version/,
  );
});
test("mobile-only dependency closure excludes the server and database", () => {
  const workspace = readWorkspace(root);
  const selected = dependencyClosure(workspace, parts.mobile.packages);
  assert.ok(selected.has("@kierratysappi/contracts"));
  assert.ok(selected.has("@kierratysappi/recycling-engine"));
  for (const pkg of parts.backend.packages) assert.equal(selected.has(pkg), false);
  const scoped = new Set([mobile.name, shared.name]);
  const brokenBackend = {
    ...backend,
    manifest: { dependencies: { [mobile.name]: "workspace:*" } },
  };
  assert.deepEqual(checkDependencyGraph([mobile, brokenBackend, shared], scoped), []);
  assert.ok(checkDependencyGraph([mobile, brokenBackend, shared]).length > 0);
});
test("real repository passes all boundaries and each scoped boundary check", () => {
  assert.deepEqual(checkWorkspace(root), []);
  for (const part of Object.keys(parts)) assert.deepEqual(checkWorkspace(root, part), []);
  assert.throws(() => checkWorkspace(root, "unknown"), /Unknown project part/);
});
test("integration and per-part commands retain the mandatory boundary and build gates", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.ok(manifest.scripts.validate.startsWith("pnpm check:boundaries &&"));
  for (const part of Object.keys(parts))
    assert.equal(manifest.scripts["validate:" + part], "node scripts/validate-part.mjs " + part);
  const ci = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(ci, /part: \[mobile, backend, shared\]/);
  assert.match(ci, /pnpm validate:\$\{\{ matrix\.part \}\}/);
});
