import { spawnSync } from "node:child_process";

import { CliError } from "../cli-error.js";

interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

const MAX_BUFFER = 256 * 1024 * 1024;

const runGit = (cwd: string, args: string[]): GitResult => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: MAX_BUFFER });
  return { ok: result.status === 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
};

const gitOutput = (cwd: string, args: string[]): string => {
  const result = runGit(cwd, args);
  if (!result.ok) throw new CliError(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout;
};

const splitNul = (output: string): string[] => output.split("\0").filter((path) => path.length > 0);

export const isGitRepository = (cwd: string): boolean => runGit(cwd, ["rev-parse", "--is-inside-work-tree"]).ok;

export const diffNames = (cwd: string, revisions: string[]): string[] =>
  splitNul(gitOutput(cwd, ["--literal-pathspecs", "diff", "--name-only", "-z", "--relative", ...revisions, "--"]));

export const stagedFiles = (cwd: string): string[] =>
  splitNul(
    gitOutput(cwd, ["--literal-pathspecs", "diff", "--cached", "--name-only", "-z", "--relative", "--diff-filter=ACMR"])
  );

export const untrackedFiles = (cwd: string): string[] =>
  splitNul(gitOutput(cwd, ["ls-files", "--others", "--exclude-standard", "-z"]));

export const trackedAndUntrackedFiles = (cwd: string): string[] =>
  splitNul(gitOutput(cwd, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]));

export const forkPoint = (cwd: string, ref: string): string => {
  const tip = runGit(cwd, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  if (!tip.ok) throw new CliError(`base ref "${ref}" does not resolve in this checkout`);
  const mergeBase = runGit(cwd, ["merge-base", ref, "HEAD"]);
  return mergeBase.ok ? mergeBase.stdout.trim() : tip.stdout.trim();
};

export const fileAtRevision = (cwd: string, revision: string, path: string): string | undefined => {
  const result = runGit(cwd, ["show", `${revision}:./${path}`]);
  return result.ok ? result.stdout : undefined;
};

export const gitConfigValue = (cwd: string, key: string): string => runGit(cwd, ["config", "--get", key]).stdout.trim();

export const gitPath = (cwd: string, path: string): string => gitOutput(cwd, ["rev-parse", "--git-path", path]).trim();
