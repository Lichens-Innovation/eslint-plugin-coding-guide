import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import type { CodingGuideConfig, LoadedConfig } from "../config/config.types.js";
import { loadConfig } from "../config/load-config.js";

export interface TempProject {
  cwd: string;
  write: (file: string, content: string) => void;
  git: (...args: string[]) => string;
  config: (overrides?: Partial<CodingGuideConfig>) => LoadedConfig;
  cleanup: () => void;
}

export const createTempProject = ({ withGit = true } = {}): TempProject => {
  const cwd = mkdtempSync(join(tmpdir(), "coding-guide-test-"));
  const git = (...args: string[]): string => execFileSync("git", args, { cwd, encoding: "utf8" });
  const write = (file: string, content: string): void => {
    mkdirSync(dirname(join(cwd, file)), { recursive: true });
    writeFileSync(join(cwd, file), content);
  };
  if (withGit) {
    git("init", "--quiet", "--initial-branch=main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    git("config", "commit.gpgsign", "false");
  }
  return {
    cwd,
    write,
    git,
    config: (overrides = {}) => ({ ...loadConfig(cwd), ...overrides }),
    cleanup: () => rmSync(cwd, { recursive: true, force: true }),
  };
};
