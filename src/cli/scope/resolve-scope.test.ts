import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { matchesFileGlobs } from "./glob.utils.js";
import { resolveScope } from "./resolve-scope.js";

describe("matchesFileGlobs", () => {
  it.each`
    file                       | matches
    ${"a.ts"}                  | ${true}
    ${"src/deep/b.tsx"}        | ${true}
    ${"src/c.js"}              | ${false}
    ${"node_modules/pkg/d.ts"} | ${false}
  `("matches=$matches for $file", ({ file, matches }) => {
    // act & assert
    expect(matchesFileGlobs(file, ["**/*.ts", "**/*.tsx", "!**/node_modules/**"])).toBe(matches);
  });
});

describe("resolveScope", () => {
  let project: TempProject;

  beforeEach(() => {
    project = createTempProject();
    project.write("src/committed.ts", "export const a = 1;\n");
    project.write("README.md", "# readme\n");
    project.git("add", ".");
    project.git("commit", "--quiet", "-m", "initial");
  });

  afterEach(() => project.cleanup());

  it("lists every tracked and untracked source file for --all", () => {
    // arrange
    project.write("src/untracked.ts", "export const b = 2;\n");

    // act
    const scope = resolveScope({ kind: "all" }, project.config());

    // assert
    expect(scope.files).toEqual(["src/committed.ts", "src/untracked.ts"]);
  });

  it("keeps only staged source files for --staged and flags partial staging", () => {
    // arrange
    project.write("src/staged.ts", "export const c = 3;\n");
    project.write("src/unstaged.ts", "export const d = 4;\n");
    project.git("add", "src/staged.ts");
    project.write("src/staged.ts", "export const c = 33;\n");

    // act
    const scope = resolveScope({ kind: "staged" }, project.config());

    // assert
    expect(scope.files).toEqual(["src/staged.ts"]);
    expect(scope.notices).toEqual(["src/staged.ts is partially staged: its unstaged changes are analysed too"]);
  });

  it("includes branch commits, staged and untracked work for --branch", () => {
    // arrange
    project.git("checkout", "--quiet", "-b", "feature");
    project.write("src/feature.ts", "export const e = 5;\n");
    project.git("add", ".");
    project.git("commit", "--quiet", "-m", "feature");
    project.write("src/wip.ts", "export const f = 6;\n");

    // act
    const scope = resolveScope({ kind: "branch" }, project.config());

    // assert
    expect(scope.files).toEqual(["src/feature.ts", "src/wip.ts"]);
  });

  it("re-checks files removed from the snooze index for --staged", () => {
    // arrange
    project.write("src/snoozed.ts", "export const g = 7;\n");
    project.write(".coding-guide/snooze.json", '["src/kept.ts", "src/snoozed.ts"]\n');
    project.git("add", ".");
    project.git("commit", "--quiet", "-m", "snooze");
    project.write(".coding-guide/snooze.json", '["src/kept.ts"]\n');
    project.git("add", ".coding-guide/snooze.json");

    // act
    const scope = resolveScope({ kind: "staged" }, project.config());

    // assert
    expect(scope.files).toEqual(["src/snoozed.ts"]);
    expect(scope.notices).toEqual(["src/snoozed.ts was removed from the snooze index: analysed in full"]);
  });

  it("re-checks files removed from the snooze index since the fork point for --branch", () => {
    // arrange
    project.write(".coding-guide/snooze.json", '["src/committed.ts"]\n');
    project.git("add", ".");
    project.git("commit", "--quiet", "-m", "snooze");
    project.git("checkout", "--quiet", "-b", "feature");
    project.write(".coding-guide/snooze.json", "[]\n");
    project.git("commit", "--quiet", "-am", "unsnooze");

    // act
    const scope = resolveScope({ kind: "branch" }, project.config());

    // assert
    expect(scope.files).toEqual(["src/committed.ts"]);
  });

  it("ignores keys added to the snooze index", () => {
    // arrange
    project.write(".coding-guide/snooze.json", '["src/committed.ts"]\n');
    project.git("add", ".coding-guide/snooze.json");

    // act
    const scope = resolveScope({ kind: "staged" }, project.config());

    // assert
    expect(scope.files).toEqual([]);
    expect(scope.notices).toEqual([]);
  });

  it("fails on a base ref the checkout does not have", () => {
    // act & assert
    expect(() => resolveScope({ kind: "since", ref: "nope" }, project.config())).toThrow('base ref "nope"');
  });
});
