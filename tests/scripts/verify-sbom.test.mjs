import { describe, expect, it } from "vitest";

import { verifySbomDocument } from "../../scripts/ci/verify-sbom.mjs";

const packageJson = { name: "@example/package", version: "1.0.0", license: "ISC" };
const npmTree = {
  dependencies: {
    zod: { version: "4.4.3" },
    "@example/runtime": {
      version: "2.0.0",
      dependencies: { transitive: { version: "3.0.0" } },
    },
  },
};

function sbomWith(components) {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    metadata: {
      component: {
        group: "@example",
        name: "package",
        version: "1.0.0",
        licenses: [{ license: { id: "ISC" } }],
      },
    },
    components,
  };
}

describe("verifySbomDocument", () => {
  it("accepts a complete production dependency inventory", () => {
    expect(
      verifySbomDocument(
        sbomWith([
          { name: "zod", version: "4.4.3", licenses: [{ license: { id: "MIT" } }] },
          {
            group: "@example",
            name: "runtime",
            version: "2.0.0",
            licenses: [{ license: { id: "MIT" } }],
          },
          { name: "transitive", version: "3.0.0", licenses: [{ expression: "MIT" }] },
        ]),
        npmTree,
        packageJson,
      ),
    ).toEqual({
      componentCount: 3,
      productionDependencyCount: 3,
      componentsWithDeclaredLicenses: 3,
    });
  });

  it("fails closed when a production dependency is absent", () => {
    expect(() =>
      verifySbomDocument(
        sbomWith([
          {
            group: "@example",
            name: "runtime",
            version: "2.0.0",
            licenses: [{ license: { id: "MIT" } }],
          },
          { name: "transitive", version: "3.0.0", licenses: [{ license: { id: "MIT" } }] },
        ]),
        npmTree,
        packageJson,
      ),
    ).toThrow("SBOM is missing production dependencies: zod@4.4.3");
  });

  it("fails closed when a component has no declared license", () => {
    expect(() =>
      verifySbomDocument(
        sbomWith([
          { name: "zod", version: "4.4.3" },
          {
            group: "@example",
            name: "runtime",
            version: "2.0.0",
            licenses: [{ license: { id: "MIT" } }],
          },
          { name: "transitive", version: "3.0.0", licenses: [{ license: { id: "MIT" } }] },
        ]),
        npmTree,
        packageJson,
      ),
    ).toThrow("SBOM components are missing declared licenses: zod@4.4.3");
  });

  it("rejects a document for a different package", () => {
    expect(() =>
      verifySbomDocument(
        { ...sbomWith([]), metadata: { component: { name: "other", version: "1.0.0" } } },
        { dependencies: {} },
        packageJson,
      ),
    ).toThrow("SBOM root component does not match package.json");
  });
});
