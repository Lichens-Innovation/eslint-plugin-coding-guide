#!/usr/bin/env node
import { getErrorMessage } from "@lichens-innovation/ts-common";

import { CliError } from "./cli-error.js";
import { checkCommand } from "./commands/check-command.js";
import { hooksInstallCommand } from "./commands/hooks-install-command.js";
import { snoozeCommand } from "./commands/snooze-command.js";
import { EXIT_TOOL_ERROR } from "./report/build-report.js";

const USAGE = `Usage: coding-guide <command> [options]

Commands:
  check [--staged | --branch [base] | --since <ref> | --file <path> | --all] [--format text|json] [--config <path>]
  snooze --list | --add <key...> | --prune [--config <path>]
  hooks install

Exit codes: 0 clean, 1 enforced smell found, 2 tool or config error.
`;

const HELP_FLAGS = ["--help", "-h"];

const COMMANDS: Record<string, (args: string[]) => number | Promise<number>> = {
  check: checkCommand,
  snooze: snoozeCommand,
  hooks: hooksInstallCommand,
};

const main = async (argv: string[]): Promise<number> => {
  const [commandName, ...args] = argv;
  const command = COMMANDS[commandName ?? ""];
  if (!command) {
    process.stdout.write(USAGE);
    return HELP_FLAGS.includes(commandName ?? "") ? 0 : EXIT_TOOL_ERROR;
  }
  try {
    return await command(args);
  } catch (error: unknown) {
    const prefix = error instanceof CliError ? "" : "unexpected error: ";
    process.stderr.write(`coding-guide: ${prefix}${getErrorMessage(error)}\n`);
    return EXIT_TOOL_ERROR;
  }
};

process.exitCode = await main(process.argv.slice(2));
