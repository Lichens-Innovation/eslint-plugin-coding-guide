import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { toPosixPath } from "../../utils/file.utils.js";
import { CliError } from "../cli-error.js";
import type { LoadedConfig } from "../config/config.types.js";
import {
  diffNames,
  forkPoint,
  isGitRepository,
  stagedFiles,
  trackedAndUntrackedFiles,
  untrackedFiles,
} from "./git.utils.js";
import { matchesFileGlobs } from "./glob.utils.js";

export type ScopeMode =
  | { kind: "all" }
  | { kind: "staged" }
  | { kind: "branch"; base?: string }
  | { kind: "since"; ref: string }
  | { kind: "file"; file: string };

export interface Scope {
  mode: ScopeMode;
  files: string[];
  touched: string[];
  notices: string[];
}

const IGNORED_DIRECTORIES = new Set(["node_modules", ".git"]);

const filesOnDisk = (cwd: string, directory = cwd): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return IGNORED_DIRECTORIES.has(entry.name) ? [] : filesOnDisk(cwd, path);
    return [toPosixPath(relative(cwd, path))];
  });

const requireGit = (cwd: string): void => {
  if (!isGitRepository(cwd)) throw new CliError("not a git repository");
};

const changedSince = (cwd: string, ref: string): string[] => {
  requireGit(cwd);
  const since = forkPoint(cwd, ref);
  return [...diffNames(cwd, [since]), ...diffNames(cwd, ["--cached"]), ...untrackedFiles(cwd)];
};

const partiallyStagedNotices = (cwd: string, staged: string[]): string[] => {
  const unstaged = new Set(diffNames(cwd, []));
  return staged
    .filter((file) => unstaged.has(file))
    .map((file) => `${file} is partially staged: its unstaged changes are analysed too`);
};

const selectedFiles = (mode: ScopeMode, config: LoadedConfig): string[] => {
  const { cwd } = config;
  switch (mode.kind) {
    case "all":
      return isGitRepository(cwd) ? trackedAndUntrackedFiles(cwd) : filesOnDisk(cwd);
    case "staged":
      requireGit(cwd);
      return stagedFiles(cwd);
    case "branch":
      return changedSince(cwd, mode.base ?? config.scope.branchBase);
    case "since":
      return changedSince(cwd, mode.ref);
    case "file":
      return [toPosixPath(relative(cwd, join(cwd, mode.file)))];
  }
};

const isPresentFile = (cwd: string, file: string): boolean => {
  const path = join(cwd, file);
  return existsSync(path) && statSync(path).isFile();
};

export const resolveScope = (mode: ScopeMode, config: LoadedConfig): Scope => {
  const touched = [...new Set(selectedFiles(mode, config))].filter((file) => isPresentFile(config.cwd, file)).sort();
  const files = touched.filter((file) => matchesFileGlobs(file, config.files));
  const notices = mode.kind === "staged" ? partiallyStagedNotices(config.cwd, files) : [];
  return { mode, files, touched, notices };
};
