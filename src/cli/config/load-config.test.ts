import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { loadConfig } from "./load-config.js";

describe("loadConfig", () => {
  let project: TempProject;

  beforeEach(() => {
    project = createTempProject({ withGit: false });
  });

  afterEach(() => project.cleanup());

  it("uses the defaults when the project has no config", () => {
    // act
    const config = loadConfig(project.cwd);

    // assert
    expect(config.transformers).toEqual(["allow-aaa", "snooze", "habit-hooks-disable"]);
    expect(config.smells["coding-guide/todo-ticket-ref"]?.severity).toBe("suggested");
  });

  it("merges project smells over the default preset", () => {
    // arrange
    project.write(
      ".coding-guide/config.json",
      JSON.stringify({ smells: { "coding-guide/todo-ticket-ref": { severity: "enforced" } } })
    );

    // act
    const config = loadConfig(project.cwd);

    // assert
    expect(config.smells["coding-guide/todo-ticket-ref"]).toEqual({ severity: "enforced", guide: "todo-ticket-ref" });
  });

  it.each`
    content                                    | problem
    ${{ unknown: true }}                       | ${'unknown key(s) "unknown"'}
    ${{ uncoached: "maybe" }}                  | ${"expected one of suggest, ignore, enforce"}
    ${{ smells: { a: { severity: "high" } } }} | ${"expected one of enforced, suggested, disabled"}
    ${{ sensors: { eslint: { args: [] } } }}   | ${'unknown key(s) "args"'}
    ${{ files: "src" }}                        | ${"expected a list of strings"}
  `("rejects $content", ({ content, problem }) => {
    // arrange
    project.write(".coding-guide/config.json", JSON.stringify(content));

    // act & assert
    expect(() => loadConfig(project.cwd)).toThrow(problem);
  });

  it("fails when an explicit config path does not exist", () => {
    // act & assert
    expect(() => loadConfig(project.cwd, "missing.json")).toThrow("config file not found");
  });
});
