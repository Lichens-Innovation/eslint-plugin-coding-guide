import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/blob/main/docs/rules/${name}.md`
);
