import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import { isNotBlank } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";
import { EXIT_CLEAN } from "../report/build-report.js";
import { gitConfigValue, gitPath, isGitRepository } from "../scope/git.utils.js";

const MARKER = "# coding-guide pre-commit";
const HUSKY_COMMAND = "coding-guide check --staged";
const GIT_HOOK_COMMAND = "./node_modules/.bin/coding-guide check --staged";
const SHEBANG = "#!/usr/bin/env sh";

interface HookTarget {
  path: string;
  command: string;
}

const hookTarget = (cwd: string): HookTarget => {
  const hooksPath = gitConfigValue(cwd, "core.hooksPath");
  if (hooksPath.includes(".husky")) {
    return { path: join(cwd, ".husky", "pre-commit"), command: HUSKY_COMMAND };
  }
  const hooksDir = gitPath(cwd, "hooks");
  return { path: join(isAbsolute(hooksDir) ? hooksDir : join(cwd, hooksDir), "pre-commit"), command: GIT_HOOK_COMMAND };
};

const installLine = ({ path, command }: HookTarget): boolean => {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : `${SHEBANG}\n`;
  if (existing.includes(MARKER)) return false;
  const separator = existing.endsWith("\n") ? "" : "\n";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${existing}${separator}\n${MARKER}\n${command}\n`);
  chmodSync(path, 0o755);
  return true;
};

export const hooksInstallCommand = (args: string[]): number => {
  if (args[0] !== "install") throw new CliError("usage: coding-guide hooks install");
  const cwd = process.cwd();
  if (isNotBlank(process.env.CI) || !isGitRepository(cwd)) {
    process.stdout.write("coding-guide: not a git checkout (or CI), skipping hook installation\n");
    return EXIT_CLEAN;
  }
  const target = hookTarget(cwd);
  const installed = installLine(target);
  process.stdout.write(
    `coding-guide: pre-commit hook ${installed ? "installed in" : "already present in"} ${target.path}\n`
  );
  return EXIT_CLEAN;
};
