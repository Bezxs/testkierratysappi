import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { canDependOn, dependencyClosure, packageLayout, parts } from "./workspace-parts.mjs";

const excluded = new Set(["node_modules", "dist", "coverage", ".expo", "ios", "android"]);
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

export function declaredDependencies(manifest) {
  return Object.assign({}, ...dependencyFields.map((key) => manifest[key] ?? {}));
}

export function checkDependencyGraph(packages, selected = new Set(packages.map((p) => p.name))) {
  const byName = new Map(packages.map((p) => [p.name, p]));
  const errors = [];
  for (const pkg of packages) {
    if (!selected.has(pkg.name)) continue;
    for (const [name, version] of Object.entries(declaredDependencies(pkg.manifest))) {
      if (!name.startsWith("@kierratysappi/")) continue;
      const dependency = byName.get(name);
      if (!dependency) {
        errors.push(`${pkg.name}: unknown workspace package ${name}`);
        continue;
      }
      if (!canDependOn(pkg.part, dependency.part))
        errors.push(`${pkg.name}: ${pkg.part} cannot depend on ${dependency.part} (${name})`);
      if (typeof version !== "string" || !version.startsWith("workspace:"))
        errors.push(`${pkg.name}: ${name} must use the checked workspace version`);
    }
  }
  const active = new Set(),
    visited = new Set();
  function visit(pkg) {
    if (active.has(pkg.name)) {
      errors.push(`Dependency cycle: ${pkg.name}`);
      return;
    }
    if (visited.has(pkg.name)) return;
    active.add(pkg.name);
    for (const name of Object.keys(declaredDependencies(pkg.manifest)))
      if (byName.has(name)) visit(byName.get(name));
    active.delete(pkg.name);
    visited.add(pkg.name);
  }
  for (const pkg of packages) if (selected.has(pkg.name)) visit(pkg);
  return errors;
}

export function moduleSpecifiers(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const result = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      result.push(node.moduleSpecifier.text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    )
      result.push(node.argument.literal.text);
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    )
      result.push(node.moduleReference.expression.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      const argument = node.arguments[0];
      result.push(argument && ts.isStringLiteralLike(argument) ? argument.text : null);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result;
}

export function checkSpecifier(specifier, pkg, packages, filename) {
  if (specifier === null) return "Computed module imports cannot bypass package boundaries";
  if (
    pkg.part !== "mobile" &&
    /^(?:react(?:-native(?:-|\/|$)|\/|$)|expo(?:-|\/|$)|@expo\/)/u.test(specifier)
  )
    return "UI/native dependencies belong in mobile, not backend/shared";
  if (
    pkg.part === "mobile" &&
    /^(?:fastify(?:\/|$)|@fastify\/|pg(?:\/|$)|@electric-sql\/)/u.test(specifier)
  )
    return "Server/database dependencies must not enter the mobile app";
  if (
    pkg.part === "shared" &&
    /^(?:fastify(?:\/|$)|@fastify\/|pg(?:\/|$)|@electric-sql\/|node:)/u.test(specifier)
  )
    return "Shared contracts/policy must stay platform-independent";
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const target = resolve(dirname(filename), specifier);
    const within = relative(resolve(pkg.directory), target);
    if (
      within === ".." ||
      within.startsWith("../") ||
      within.startsWith("..\\") ||
      specifier.startsWith("/")
    )
      return "Relative/absolute import leaves its own package; use a public workspace export";
  }
  if (!specifier.startsWith("@kierratysappi/")) return null;
  const [scope, name, ...segments] = specifier.split("/");
  const packageName = `${scope}/${name}`;
  const dependency = packages.find((p) => p.name === packageName);
  if (!dependency) return `Unknown workspace import ${specifier}`;
  if (!canDependOn(pkg.part, dependency.part))
    return `${pkg.part} cannot import ${dependency.part} (${specifier})`;
  if (!Object.hasOwn(declaredDependencies(pkg.manifest), packageName))
    return `Undeclared workspace import ${specifier}`;
  const subpath = segments.length ? `./${segments.join("/")}` : ".";
  if (!Object.hasOwn(dependency.manifest.exports ?? {}, subpath))
    return `Private package path ${specifier}; only declared exports are allowed`;
  return null;
}

export function readWorkspace(root) {
  return packageLayout.map((entry) => {
    const path = join(root, entry.directory);
    if (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())
      throw new Error(`Workspace source must be a real directory: ${entry.directory}`);
    const manifest = JSON.parse(readFileSync(join(root, entry.directory, "package.json"), "utf8"));
    if (manifest.name !== entry.name)
      throw new Error(`Unexpected package identity at ${entry.directory}`);
    return { ...entry, directory: resolve(root, entry.directory), manifest };
  });
}

export function checkCompilerAliases(pkg, config) {
  const errors = [];
  const base = resolve(pkg.directory, config.compilerOptions?.baseUrl ?? ".");
  const baseWithin = relative(resolve(pkg.directory), base);
  if (baseWithin === ".." || baseWithin.startsWith("../") || baseWithin.startsWith("..\\"))
    errors.push("Compiler baseUrl leaves its own package");
  for (const [alias, targets] of Object.entries(config.compilerOptions?.paths ?? {})) {
    if (alias.startsWith("@kierratysappi/"))
      errors.push("Compiler alias must not shadow public workspace exports");
    if (!Array.isArray(targets) || targets.some((target) => typeof target !== "string")) {
      errors.push("Invalid compiler alias");
      continue;
    }
    for (const target of targets) {
      const within = relative(resolve(pkg.directory), resolve(base, target));
      if (within === ".." || within.startsWith("../") || within.startsWith("..\\"))
        errors.push("Compiler alias leaves its own package");
    }
  }
  return errors;
}

function sourceFiles(directory, errors, root) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (excluded.has(entry.name)) continue;
    if (entry.isSymbolicLink()) {
      errors.push(`Source symlink may bypass a package boundary: ${relative(root, path)}`);
      continue;
    }
    if (entry.isDirectory()) files.push(...sourceFiles(path, errors, root));
    else if (/\.(?:tsx?|[cm]?js)$/u.test(entry.name) && entry.name !== "expo-env.d.ts")
      files.push(path);
  }
  return files;
}

export function checkWorkspace(root, selectedPart) {
  if (selectedPart !== undefined && !Object.hasOwn(parts, selectedPart))
    throw new Error("Unknown project part");
  const packages = readWorkspace(root);
  const selected = dependencyClosure(
    packages,
    selectedPart === undefined ? packages.map((p) => p.name) : parts[selectedPart].packages,
  );
  const errors = checkDependencyGraph(packages, selected);
  for (const part of ["mobile", "backend", "shared"]) {
    for (const entry of readdirSync(join(root, part), { withFileTypes: true })) {
      if (!entry.isDirectory() || !existsSync(join(root, part, entry.name, "package.json")))
        continue;
      if (!packageLayout.some((p) => p.directory === `${part}/${entry.name}`))
        errors.push(`Unregistered workspace package ${part}/${entry.name}`);
    }
  }
  for (const pkg of packages) {
    if (!selected.has(pkg.name)) continue;
    if (lstatSync(pkg.directory).isSymbolicLink())
      errors.push(`Workspace source must not be a symlink: ${pkg.name}`);
    const parsedConfig = ts.readConfigFile(join(pkg.directory, "tsconfig.json"), ts.sys.readFile);
    if (parsedConfig.error) throw new Error(`Invalid TypeScript config in ${pkg.name}`);
    const config = parsedConfig.config;
    errors.push(...checkCompilerAliases(pkg, config).map((issue) => `${pkg.name}: ${issue}`));
    for (const filename of sourceFiles(pkg.directory, errors, root))
      for (const specifier of moduleSpecifiers(readFileSync(filename, "utf8"), filename)) {
        const issue = checkSpecifier(specifier, pkg, packages, filename);
        if (issue) errors.push(`${relative(root, filename)}: ${issue}`);
      }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const errors = checkWorkspace(root, process.argv[2]);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else
    console.log(
      "PASS: mobile/backend/shared package boundaries, declared public imports and dependency DAG.",
    );
}
