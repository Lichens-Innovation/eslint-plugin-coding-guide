import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { LoadedConfig } from "../config/config.types.js";
import type { Finding } from "../finding.types.js";
import { createTempProject, type TempProject } from "../test-utils/temp-project.js";
import { buildReport, renderReportText } from "./build-report.js";

const finding = (smell: string, file = "src/a.ts", line = 3): Finding => ({
  smell,
  details: {},
  issues: [{ key: file, details: { file, line, message: `${smell} here` } }],
});

describe("buildReport", () => {
  let project: TempProject;
  let config: LoadedConfig;

  beforeEach(() => {
    project = createTempProject({ withGit: false });
    config = project.config();
  });

  afterEach(() => project.cleanup());

  it.each`
    smell                             | exitCode
    ${"oversized-file"}               | ${1}
    ${"coding-guide/todo-ticket-ref"} | ${0}
    ${"some-plugin/uncoached-rule"}   | ${0}
    ${"incomplete-run"}               | ${2}
  `("exits $exitCode for $smell", ({ smell, exitCode }) => {
    // act
    const report = buildReport([finding(smell)], config);

    // assert
    expect(report.exitCode).toBe(exitCode);
  });

  it("drops disabled smells and uncoached ones under the ignore policy", () => {
    // arrange
    const ignoring = {
      ...config,
      uncoached: "ignore" as const,
      smells: { ...config.smells, "oversized-file": { severity: "disabled" as const } },
    };

    // act
    const report = buildReport([finding("oversized-file"), finding("x/uncoached")], ignoring);

    // assert
    expect(report).toEqual({ findings: [], exitCode: 0 });
  });

  it("merges findings rendering the same guide and deduplicates their issues", () => {
    // arrange
    const findings = [finding("oversized-file"), finding("oversized-file"), finding("oversized-file", "src/b.ts")];

    // act
    const report = buildReport(findings, config);

    // assert
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].issues.map((issue) => issue.key)).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("renders a banner, the guide prose and the issue lines", () => {
    // arrange
    const report = buildReport([finding("coding-guide/no-eval-like", "src/a.ts", 7)], config);

    // act
    const text = renderReportText(report, config);

    // assert
    expect(text).toContain("── coding-guide/no-eval-like (1 issue) ──");
    expect(text).toContain("General guidance");
    expect(text).toContain("src/a.ts:7  coding-guide/no-eval-like here");
    expect(text).not.toContain("{%");
  });

  it("prefers a project guide override", () => {
    // arrange
    project.write(".coding-guide/guides/oversized-file.md", "Project-specific advice.");
    const report = buildReport([finding("oversized-file")], config);

    // act
    const text = renderReportText(report, config);

    // assert
    expect(text).toContain("Project-specific advice.");
  });

  it("renders the clean guide when nothing is left", () => {
    // act
    const text = renderReportText(buildReport([], config), config);

    // assert
    expect(text).toContain("automated checks passed");
  });
});
