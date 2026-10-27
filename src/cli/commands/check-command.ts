import { parseArgs } from "node:util";

import { isBlank } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";
import { loadConfig } from "../config/load-config.js";
import { buildReport, renderReportJson, renderReportText } from "../report/build-report.js";
import type { ScopeMode } from "../scope/resolve-scope.js";
import { collectFindings } from "./collect-findings.js";

interface CheckValues {
  staged?: boolean;
  branch?: string;
  since?: string;
  file?: string;
  all?: boolean;
}

const BRANCH_DEFAULT = "";

const normalizeArgs = (args: string[]): string[] =>
  args.flatMap((arg, index) => {
    const isBareBranch = arg === "--branch" && (args[index + 1] ?? "--").startsWith("--");
    return isBareBranch ? [`--branch=${BRANCH_DEFAULT}`] : [arg];
  });

const scopeModeOf = (values: CheckValues): ScopeMode => {
  const chosen = [values.staged, values.branch, values.since, values.file, values.all].filter(
    (value) => value !== undefined && value !== false
  );
  if (chosen.length > 1) throw new CliError("--staged, --branch, --since, --file and --all are mutually exclusive");
  if (values.staged) return { kind: "staged" };
  if (values.branch !== undefined)
    return isBlank(values.branch) ? { kind: "branch" } : { kind: "branch", base: values.branch };
  if (values.since) return { kind: "since", ref: values.since };
  if (values.file) return { kind: "file", file: values.file };
  return { kind: "all" };
};

export const checkCommand = async (args: string[]): Promise<number> => {
  const { values } = parseArgs({
    args: normalizeArgs(args),
    options: {
      staged: { type: "boolean" },
      branch: { type: "string" },
      since: { type: "string" },
      file: { type: "string" },
      all: { type: "boolean" },
      format: { type: "string", default: "text" },
      config: { type: "string" },
    },
  });
  if (values.format !== "text" && values.format !== "json") throw new CliError("--format must be text or json");
  const config = loadConfig(process.cwd(), values.config);
  const { scope, findings } = await collectFindings({ config, mode: scopeModeOf(values) });
  scope.notices.forEach((notice) => process.stderr.write(`coding-guide: ${notice}\n`));
  const report = buildReport(findings, config);
  const output = values.format === "json" ? renderReportJson(report) : renderReportText(report, config);
  process.stdout.write(output);
  return report.exitCode;
};
