import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { LoadedConfig } from "../config/config.types.js";
import { buildReport } from "../report/build-report.js";
import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { collectFindings } from "./collect-findings.js";

const COMMENT_ONLY_SENSORS = { eslint: { disabled: true }, knip: { disabled: true }, jscpd: { disabled: true } };

describe("collectFindings (comment sensor pipeline)", () => {
  let project: TempProject;
  let config: LoadedConfig;

  beforeEach(() => {
    project = createTempProject();
    project.write("package.json", "{}");
    config = project.config({ sensors: COMMENT_ONLY_SENSORS });
  });

  afterEach(() => project.cleanup());

  it("reports own-line comments and ignores short, trailing, JSX-text and eslint-disable ones", async () => {
    // arrange
    const source = [
      "// this comment explains the obvious",
      "/** a JSDoc block that is long enough */",
      "export const a = 1; // trailing explanation",
      "// short",
      "// eslint-disable-next-line no-console",
      "export const b = () => <div>// not a comment at all</div>;",
    ].join("\n");
    project.write("src/a.tsx", source);

    // act
    const { findings } = await collectFindings({ config, mode: { kind: "all" } });

    // assert
    expect(findings.flatMap((finding) => finding.issues.map((issue) => issue.details.line))).toEqual([1, 2]);
  });

  it("only analyses staged files and honours disable directives", async () => {
    // arrange
    project.write(
      "src/staged.ts",
      "// a why-comment kept on purpose coding-guide-disable non-essential-comment\n// an unexplained remark here\n"
    );
    project.write("src/unstaged.ts", "// an unexplained remark here\n");
    project.git("add", "src/staged.ts");

    // act
    const { findings } = await collectFindings({ config, mode: { kind: "staged" } });
    const report = buildReport(findings, config);

    // assert
    expect(findings.flatMap((finding) => finding.issues.map((issue) => `${issue.key}:${issue.details.line}`))).toEqual([
      "src/staged.ts:2",
    ]);
    expect(report.exitCode).toBe(1);
  });

  it("is clean when nothing is staged", async () => {
    // arrange
    project.write("src/unstaged.ts", "// an unexplained remark here\n");

    // act
    const { findings } = await collectFindings({ config, mode: { kind: "staged" } });

    // assert
    expect(findings).toEqual([]);
  });
});
