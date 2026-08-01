import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function componentKey(name, version) {
  return `${name}@${version}`;
}

function componentName(component) {
  return component.group ? `${component.group}/${component.name}` : component.name;
}

function declaredLicenses(component) {
  return (component.licenses ?? [])
    .map((entry) => entry.expression ?? entry.license?.id ?? entry.license?.name)
    .filter((license) => typeof license === "string" && license.length > 0);
}

export function collectNpmDependencyKeys(tree) {
  const found = new Set();

  function visit(dependencies) {
    for (const [name, dependency] of Object.entries(dependencies ?? {})) {
      if (!dependency || typeof dependency !== "object" || typeof dependency.version !== "string") {
        throw new Error(`npm dependency ${name} is missing a resolved version`);
      }
      found.add(componentKey(name, dependency.version));
      visit(dependency.dependencies);
    }
  }

  visit(tree.dependencies);
  return found;
}

export function collectSbomComponentKeys(sbom) {
  return new Set(
    (sbom.components ?? []).map((component) => {
      return componentKey(componentName(component), component.version);
    }),
  );
}

export function verifySbomDocument(sbom, npmTree, packageJson) {
  if (sbom.bomFormat !== "CycloneDX" || sbom.specVersion !== "1.6") {
    throw new Error("SBOM must be a CycloneDX 1.6 document");
  }

  const root = sbom.metadata?.component;
  if (componentName(root ?? {}) !== packageJson.name || root?.version !== packageJson.version) {
    throw new Error("SBOM root component does not match package.json");
  }
  if (!declaredLicenses(root).includes(packageJson.license)) {
    throw new Error("SBOM root license does not match package.json");
  }

  const expected = collectNpmDependencyKeys(npmTree);
  const actual = collectSbomComponentKeys(sbom);
  const missing = [...expected].filter((dependency) => !actual.has(dependency)).sort();
  if (missing.length > 0) {
    throw new Error(`SBOM is missing production dependencies: ${missing.join(", ")}`);
  }

  const missingLicenses = (sbom.components ?? [])
    .filter((component) => declaredLicenses(component).length === 0)
    .map((component) => componentKey(componentName(component), component.version))
    .sort();
  if (missingLicenses.length > 0) {
    throw new Error(`SBOM components are missing declared licenses: ${missingLicenses.join(", ")}`);
  }

  return {
    componentCount: actual.size,
    productionDependencyCount: expected.size,
    componentsWithDeclaredLicenses: actual.size,
  };
}

export function verifySbomFile(sbomPath) {
  const sbom = JSON.parse(fs.readFileSync(sbomPath, "utf8"));
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const corepack = process.platform === "win32" ? "corepack.cmd" : "corepack";
  const npmTree = JSON.parse(
    execFileSync(corepack, ["npm", "ls", "--omit=dev", "--all", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  const result = verifySbomDocument(sbom, npmTree, packageJson);
  process.stdout.write(`${JSON.stringify({ sbom: path.basename(sbomPath), ...result })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sbomPath = process.argv[2];
  if (!sbomPath) {
    throw new Error("Usage: node scripts/ci/verify-sbom.mjs <sbom-file>");
  }
  verifySbomFile(sbomPath);
}
