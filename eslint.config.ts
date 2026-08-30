/**
 * ESLint flat config — dogfoods this package's own `recommended` preset.
 */
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import { globalIgnores } from "eslint/config";
import { configs as codingGuideConfigs } from "./src/index.js";

const testFiles = ["**/*.test.ts", "**/*.spec.ts"];

export default tseslint.config(
  globalIgnores(["dist"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  codingGuideConfigs.recommended,
  {
    files: ["**/*.ts"],
    plugins: { sonarjs, unicorn },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",
      "no-warning-comments": ["warn", { terms: ["fixme", "xxx", "hack"], location: "anywhere" }],
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "no-nested-ternary": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-useless-catch": "error",
      "max-depth": ["error", 2],
      complexity: ["error", 15],
      "sonarjs/cognitive-complexity": ["error", 15],
      "@typescript-eslint/max-params": ["error", { max: 2 }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "func-style": ["error", "expression"],
      "no-eval": "error",
      "no-new-func": "error",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
    },
  },
  {
    files: testFiles,
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
  {
    files: ["**/*.ts"],
    ignores: testFiles,
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 90, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Rule source/docs contain illustrative placeholder comments that read like pending
    // work items, and heavy AST-node-type narrowing that `.includes()` would break.
    files: ["src/rules/**"],
    rules: {
      "coding-guide/todo-ticket-ref": "off",
      "coding-guide/prefer-includes-over-or-chain": "off",
    },
  },
  {
    // Aggregator entry points — a generic "index" filename is the intended convention here.
    files: ["src/index.ts", "src/rules/index.ts"],
    rules: { "coding-guide/filename-convention-by-export-shape": "off" },
  }
);
