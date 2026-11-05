import { execSync } from "node:child_process";
import type { PlopTypes } from "@turbo/gen";

interface PackageJson {
  name: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

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
      {
        type: "modify",
        path: "packages/{{ name }}/package.json",
        async transform(content, answers) {
          const deps: unknown = (answers as { deps?: unknown }).deps;
          if (typeof deps === "string") {
            const pkg = JSON.parse(content) as PackageJson;
            for (const dep of deps.split(" ").filter(Boolean)) {
              const res = await fetch(
                `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
              );
              const tags = (await res.json()) as { latest?: string };
              if (!tags.latest) {
                throw new Error(`Could not resolve a version for ${dep}`);
              }
              pkg.dependencies[dep] = `^${tags.latest}`;
            }
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      async (answers) => {
        /**
         * Install deps and format everything
         */
        if ("name" in answers && typeof answers.name === "string") {
          // execSync("pnpm dlx sherif@latest --fix", {
          //   stdio: "inherit",
          // });
          execSync("pnpm i", { stdio: "inherit" });
          execSync(
            `pnpm prettier --write packages/${answers.name}/** --list-different`,
          );
          return "Package scaffolded";
        }
        return "Package not scaffolded";
      },
    ],
  });
}
