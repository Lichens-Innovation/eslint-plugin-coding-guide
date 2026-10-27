import { parseArgs } from "node:util";

import { CliError } from "../cli-error.js";
import type { LoadedConfig } from "../config/config.types.js";
import { loadConfig } from "../config/load-config.js";
import { INCOMPLETE_RUN, issuesOf } from "../finding.types.js";
import { EXIT_CLEAN, EXIT_ENFORCED, EXIT_TOOL_ERROR } from "../report/build-report.js";
import { loadSnoozeIndex, saveSnoozeIndex } from "../snooze/snooze-index.js";
import { collectFindings } from "./collect-findings.js";

const listSnoozed = (config: LoadedConfig): number => {
  loadSnoozeIndex(config).forEach((key) => process.stdout.write(`${key}\n`));
  return EXIT_CLEAN;
};

const addSnoozed = (config: LoadedConfig, keys: string[]): number => {
  if (keys.length === 0) throw new CliError("snooze --add expects at least one key (usually a file path)");
  saveSnoozeIndex(config, [...loadSnoozeIndex(config), ...keys]);
  return EXIT_CLEAN;
};

const pruneSnoozed = async (config: LoadedConfig): Promise<number> => {
  const { findings } = await collectFindings({ config, mode: { kind: "all" }, skipSnooze: true });
  if (findings.some((finding) => finding.smell === INCOMPLETE_RUN)) {
    process.stderr.write("coding-guide: --prune refused: the run did not complete. Index left unchanged.\n");
    return EXIT_TOOL_ERROR;
  }
  const present = new Set(issuesOf(findings).map((issue) => issue.key));
  const index = loadSnoozeIndex(config);
  if (index.length > 0 && present.size === 0) {
    process.stderr.write("coding-guide: --prune read no findings; refusing to empty the snooze index.\n");
    return EXIT_ENFORCED;
  }
  saveSnoozeIndex(
    config,
    index.filter((key) => present.has(key))
  );
  return EXIT_CLEAN;
};

export const snoozeCommand = async (args: string[]): Promise<number> => {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      list: { type: "boolean" },
      add: { type: "boolean" },
      prune: { type: "boolean" },
      config: { type: "string" },
    },
  });
  const config = loadConfig(process.cwd(), values.config);
  if (values.add) return addSnoozed(config, positionals);
  if (values.prune) return pruneSnoozed(config);
  if (values.list) return listSnoozed(config);
  throw new CliError("snooze expects --list, --add <key...> or --prune");
};
