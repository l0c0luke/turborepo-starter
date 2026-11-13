import { execFileSync } from "node:child_process";
import type { PlopTypes } from "@turbo/gen";

/** Runs pnpm with arguments passed as-is (no shell, so input can't inject). */
const pnpm = (...args: string[]) =>
  execFileSync("pnpm", args, { stdio: "inherit" });

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("init", {
    description: "Generate a new workspace package (with a starter test)",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@example-app/` prefix)",
      },
      {
        type: "input",
        name: "deps",
        message:
          "Enter a space separated list of dependencies you would like to install",
      },
    ],
    actions: [
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@example-app/")) {
            answers.name = answers.name.replace("@example-app/", "");
          }
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/src/index.ts",
        template: "export const name = '{{ name }}';",
      },
      {
        // Shared preset: coverage thresholds, no `.only`.
        type: "add",
        path: "packages/{{ name }}/vitest.config.ts",
        template: [
          'import { createVitestConfig } from "@example-app/vitest-config";',
          "",
          "export default createVitestConfig();",
          "",
        ].join("\n"),
      },
      {
        // Testing is policy: every package ships with at least one test.
        type: "add",
        path: "packages/{{ name }}/src/index.test.ts",
        template: [
          'import { describe, expect, it } from "vitest";',
          "",
          'import { name } from "./index";',
          "",
          'describe("{{ name }}", () => {',
          '  it("exports its name", () => {',
          '    expect(name).toBe("{{ name }}");',
          "  });",
          "});",
          "",
        ].join("\n"),
      },
      (answers) => {
        if (!("name" in answers) || typeof answers.name !== "string") {
          return "Package not scaffolded";
        }
        const pkg = `@example-app/${answers.name}`;
        const deps =
          "deps" in answers && typeof answers.deps === "string"
            ? answers.deps.split(/\s+/).filter(Boolean)
            : [];
        const flag = deps.find((dep) => dep.startsWith("-"));
        if (flag) throw new Error(`Not a package name: ${flag}`);
        // `catalogMode: strict` (pnpm-workspace.yaml) makes `pnpm add` reuse
        // the catalog version, or add the latest to the catalog, and write
        // `catalog:` — so versions stay in one place.
        if (deps.length > 0) pnpm("--filter", pkg, "add", ...deps);
        else pnpm("install");
        pnpm(
          "exec",
          "prettier",
          "--write",
          `packages/${answers.name}`,
          "pnpm-workspace.yaml",
          "--list-different",
        );
        return "Package scaffolded";
      },
    ],
  });
}
