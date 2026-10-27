import { join, relative } from "node:path";

import type { ESLint, Linter } from "eslint";

import { toPosixPath } from "../../utils/file.utils.js";
import { importFromProject } from "./project-tool.utils.js";
import { groupBySmell, type Sensor, type SensorReport } from "./sensor.types.js";

interface EslintModule {
  ESLint: typeof ESLint;
}

const SMELL_BY_RULE = new Map(
  Object.entries({
    "max-lines-per-function": "oversized-function",
    "max-params": "too-many-parameters",
    "@typescript-eslint/max-params": "too-many-parameters",
    complexity: "high-complexity",
    "max-depth": "deep-nesting",
    "max-lines": "oversized-file",
    "no-unused-vars": "unused-variable",
    "@typescript-eslint/no-unused-vars": "unused-variable",
    eqeqeq: "loose-equality",
    "no-var": "var-declaration",
    "prefer-const": "non-const-binding",
    "no-duplicate-imports": "duplicate-import",
    "no-warning-comments": "warning-comment",
    "@typescript-eslint/no-explicit-any": "explicit-any",
    "@typescript-eslint/no-non-null-assertion": "non-null-assertion",
    "@typescript-eslint/no-inferrable-types": "redundant-type-annotation",
  })
);

const PARSE_ERROR = "parse-error";
const FILE_LEVEL_SMELLS = new Set(["oversized-file"]);
const LINTABLE = /\.(tsx?|jsx?|[cm][jt]s)$/;

const smellOf = (message: Linter.LintMessage): string =>
  message.fatal ? PARSE_ERROR : (SMELL_BY_RULE.get(message.ruleId ?? "") ?? message.ruleId ?? PARSE_ERROR);

const isReportable = (message: Linter.LintMessage): boolean => Boolean(message.ruleId) || Boolean(message.fatal);

const toReport = (file: string, message: Linter.LintMessage): SensorReport => {
  const smell = smellOf(message);
  const positioned = !FILE_LEVEL_SMELLS.has(smell);
  return {
    smell,
    issue: {
      key: file,
      details: {
        file,
        line: positioned ? message.line : null,
        column: positioned ? message.column : null,
        message: message.message,
        source: `eslint:${message.ruleId ?? "fatal"}`,
      },
    },
  };
};

export const eslintSensor: Sensor = {
  name: "eslint",
  projectWide: false,
  run: async ({ config, files }) => {
    const lintable = files.filter((file) => LINTABLE.test(file));
    if (lintable.length === 0) return [];
    const { ESLint: EslintClass } = await importFromProject<EslintModule>(config.cwd, "eslint");
    const eslint = new EslintClass({ cwd: config.cwd, warnIgnored: false });
    const results = await eslint.lintFiles(lintable.map((file) => join(config.cwd, file)));
    const reports = results.flatMap((result) => {
      const file = toPosixPath(relative(config.cwd, result.filePath));
      return result.messages.filter(isReportable).map((message) => toReport(file, message));
    });
    return groupBySmell(reports);
  },
};
