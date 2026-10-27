import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Finding } from "../finding.types.js";
import { saveSnoozeIndex } from "../snooze/snooze-index.js";
import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { allowAaa } from "./allow-aaa.js";
import { disableComment } from "./disable-comment.js";
import { runTransformers } from "./run-transformers.js";
import { snooze } from "./snooze.js";
import type { TransformerContext } from "./transformer.types.js";

const commentFinding = (file: string, message: string, line = 1): Finding => ({
  smell: "non-essential-comment",
  details: {},
  issues: [{ key: file, details: { file, line, message } }],
});

describe("transformers", () => {
  let project: TempProject;
  let context: TransformerContext;

  beforeEach(() => {
    project = createTempProject({ withGit: false });
    context = { config: project.config(), scopeMode: { kind: "all" }, skipSnooze: false };
  });

  afterEach(() => project.cleanup());

  describe("allow-aaa", () => {
    it.each`
      file            | comment                        | dropped
      ${"a.test.ts"}  | ${"// arrange"}                | ${true}
      ${"a.spec.tsx"} | ${"// Act & Assert"}           | ${true}
      ${"a.test.ts"}  | ${"// assert: no side effect"} | ${true}
      ${"a.test.ts"}  | ${"// explains the setup"}     | ${false}
      ${"a.ts"}       | ${"// arrange"}                | ${false}
    `("drops=$dropped for $comment in $file", async ({ file, comment, dropped }) => {
      // arrange
      const findings = [commentFinding(file, `single-line comment: "${comment}"`)];

      // act
      const result = await allowAaa(findings, context);

      // assert
      expect(result).toHaveLength(dropped ? 0 : 1);
    });
  });

  describe("disable comments", () => {
    it.each`
      source                                                                     | line | dropped
      ${"const a = 1; // habit-hooks-disable"}                                   | ${1} | ${true}
      ${"const a = 1; // coding-guide-disable non-essential-comment"}            | ${1} | ${true}
      ${"const a = 1; /* habit-hooks-disable other-smell */"}                    | ${1} | ${false}
      ${"// coding-guide-disable-next-line non-essential-comment\nconst a = 1;"} | ${2} | ${true}
      ${"// habit-hooks-disable-next-line\n\nconst a = 1;"}                      | ${3} | ${false}
      ${"const a = 1;"}                                                          | ${1} | ${false}
    `("drops=$dropped for line $line of $source", async ({ source, line, dropped }) => {
      // arrange
      project.write("src/a.ts", source);
      const findings = [commentFinding("src/a.ts", "irrelevant", line)];

      // act
      const result = await disableComment(findings, context);

      // assert
      expect(result).toHaveLength(dropped ? 0 : 1);
    });
  });

  describe("snooze", () => {
    it("drops issues whose key is in the snooze index", async () => {
      // arrange
      saveSnoozeIndex(context.config, ["src/snoozed.ts"]);
      const findings = [commentFinding("src/snoozed.ts", "x"), commentFinding("src/kept.ts", "x")];

      // act
      const result = await snooze(findings, context);

      // assert
      expect(result.map((finding) => finding.issues[0].key)).toEqual(["src/kept.ts"]);
    });

    it("keeps everything when snoozing is skipped", async () => {
      // arrange
      saveSnoozeIndex(context.config, ["src/snoozed.ts"]);

      // act
      const result = await snooze([commentFinding("src/snoozed.ts", "x")], { ...context, skipSnooze: true });

      // assert
      expect(result).toHaveLength(1);
    });
  });

  describe("runTransformers", () => {
    it("loads a custom transformer from a project path", async () => {
      // arrange
      project.write("drop-all.mjs", "export default () => [];");
      const config = { ...context.config, transformers: ["./drop-all.mjs"] };

      // act
      const result = await runTransformers([commentFinding("a.ts", "x")], { ...context, config });

      // assert
      expect(result).toEqual([]);
    });

    it("reports an unknown transformer as an incomplete run", async () => {
      // arrange
      const config = { ...context.config, transformers: ["nope"] };

      // act
      const result = await runTransformers([], { ...context, config });

      // assert
      expect(result.map((finding) => finding.smell)).toEqual(["incomplete-run"]);
    });
  });
});
