import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { hooksInstallCommand } from "./hooks-install-command.js";

const countOccurrences = (text: string, needle: string): number => text.split(needle).length - 1;

describe("hooks install", () => {
  let project: TempProject;

  beforeEach(() => {
    project = createTempProject();
    vi.spyOn(process, "cwd").mockReturnValue(project.cwd);
    vi.spyOn(process.stdout, "write").mockReturnValue(true);
    vi.stubEnv("CI", "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    project.cleanup();
  });

  it("writes a git pre-commit hook once, even when run twice", () => {
    // act
    hooksInstallCommand(["install"]);
    hooksInstallCommand(["install"]);

    // assert
    const hook = readFileSync(join(project.cwd, ".git", "hooks", "pre-commit"), "utf8");
    expect(hook.startsWith("#!/usr/bin/env sh")).toBe(true);
    expect(countOccurrences(hook, "coding-guide check --staged")).toBe(1);
  });

  it("appends to the husky pre-commit hook when husky owns core.hooksPath", () => {
    // arrange
    project.git("config", "core.hooksPath", ".husky/_");
    project.write(".husky/pre-commit", "bun run typecheck\n");

    // act
    hooksInstallCommand(["install"]);

    // assert
    const hook = readFileSync(join(project.cwd, ".husky", "pre-commit"), "utf8");
    expect(hook).toBe("bun run typecheck\n\n# coding-guide pre-commit\ncoding-guide check --staged\n");
    expect(existsSync(join(project.cwd, ".git", "hooks", "pre-commit"))).toBe(false);
  });

  it("skips installation on CI", () => {
    // arrange
    vi.stubEnv("CI", "true");

    // act
    hooksInstallCommand(["install"]);

    // assert
    expect(existsSync(join(project.cwd, ".git", "hooks", "pre-commit"))).toBe(false);
  });
});
