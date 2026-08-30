import type { ESLint, Linter } from "eslint";

interface CodingGuidePlugin {
  rules: Record<string, unknown>;
}

export const recommended = (plugin: CodingGuidePlugin): Linter.Config => ({
  name: "coding-guide/recommended",
  files: ["**/*.{ts,tsx}"],
  plugins: { "coding-guide": plugin as unknown as ESLint.Plugin },
  rules: Object.fromEntries(Object.keys(plugin.rules).map((ruleName) => [`coding-guide/${ruleName}`, "error"])),
});
