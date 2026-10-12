export const parts = Object.freeze({
  mobile: {
    directory: "mobile",
    packages: ["@kierratysappi/mobile", "@kierratysappi/localization"],
  },
  backend: {
    directory: "backend",
    packages: [
      "@kierratysappi/api",
      "@kierratysappi/application",
      "@kierratysappi/data-providers",
      "@kierratysappi/database",
    ],
  },
  shared: {
    directory: "shared",
    packages: [
      "@kierratysappi/domain",
      "@kierratysappi/contracts",
      "@kierratysappi/recycling-engine",
    ],
  },
});

export const packageLayout = Object.freeze([
  { name: "@kierratysappi/mobile", directory: "mobile/app", part: "mobile" },
  { name: "@kierratysappi/localization", directory: "mobile/localization", part: "mobile" },
  { name: "@kierratysappi/api", directory: "backend/api", part: "backend" },
  { name: "@kierratysappi/application", directory: "backend/application", part: "backend" },
  { name: "@kierratysappi/data-providers", directory: "backend/data-providers", part: "backend" },
  { name: "@kierratysappi/database", directory: "backend/database", part: "backend" },
  { name: "@kierratysappi/domain", directory: "shared/domain", part: "shared" },
  { name: "@kierratysappi/contracts", directory: "shared/contracts", part: "shared" },
  { name: "@kierratysappi/recycling-engine", directory: "shared/recycling-engine", part: "shared" },
]);

export function canDependOn(from, to) {
  return from === to || (from !== "shared" && to === "shared");
}

export function dependencyClosure(packages, roots) {
  const byName = new Map(packages.map((p) => [p.name, p]));
  const included = new Set();
  function visit(name) {
    if (included.has(name)) return;
    const pkg = byName.get(name);
    if (!pkg) return;
    included.add(name);
    for (const key of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ])
      for (const dependency of Object.keys(pkg.manifest[key] ?? {}))
        if (byName.has(dependency)) visit(dependency);
  }
  for (const root of roots) visit(root);
  return included;
}
