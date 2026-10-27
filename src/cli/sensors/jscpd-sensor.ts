import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { safeJsonParse } from "@lichens-innovation/ts-common";

import { toPosixPath } from "../../utils/file.utils.js";
import type { Finding, Issue } from "../finding.types.js";
import { runProjectTool, toolFailure } from "./project-tool.utils.js";
import type { Sensor } from "./sensor.types.js";

interface CloneSide {
  name: string;
  start: number;
  end: number;
}

interface Clone {
  lines: number;
  tokens: number;
  firstFile: CloneSide;
  secondFile: CloneSide;
}

interface PackageManifestWithJscpd {
  jscpd?: unknown;
}

interface JscpdReport {
  duplicates?: Clone[];
}

const FALLBACK_ARGS = ["--min-lines", "5", "--min-tokens", "50", "--ignore", "**/node_modules/**,**/dist/**", "src"];

const projectConfiguresJscpd = (cwd: string): boolean => {
  if (existsSync(join(cwd, ".jscpd.json"))) return true;
  const manifest = safeJsonParse<PackageManifestWithJscpd>(readFileSync(join(cwd, "package.json"), "utf8"));
  return Boolean(manifest?.jscpd);
};

const toIssue = (cwd: string, side: CloneSide): Issue => {
  const file = toPosixPath(relative(cwd, resolve(cwd, side.name)));
  return { key: file, details: { file, startLine: side.start, endLine: side.end, source: "jscpd:duplication" } };
};

const toFinding = (cwd: string, clone: Clone): Finding => ({
  smell: "duplicated-code",
  details: { lines: clone.lines, tokens: clone.tokens },
  issues: [toIssue(cwd, clone.firstFile), toIssue(cwd, clone.secondFile)],
});

const readReport = (outputDir: string, cwd: string): Finding[] | null => {
  const reportPath = join(outputDir, "jscpd-report.json");
  if (!existsSync(reportPath)) return null;
  const report = safeJsonParse<JscpdReport>(readFileSync(reportPath, "utf8"));
  return (report?.duplicates ?? []).map((clone) => toFinding(cwd, clone));
};

export const jscpdSensor: Sensor = {
  name: "jscpd",
  projectWide: true,
  run: async ({ config }) => {
    const outputDir = mkdtempSync(join(tmpdir(), "coding-guide-jscpd-"));
    try {
      const configArgs = projectConfiguresJscpd(config.cwd) ? [] : FALLBACK_ARGS;
      const args = ["--reporters", "json", "--output", outputDir, "--silent", ...configArgs];
      const run = runProjectTool(config.cwd, "jscpd", args);
      const findings = readReport(outputDir, config.cwd);
      if (findings) return findings;
      if (run.status !== 0) throw toolFailure("jscpd", run);
      return [];
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  },
};
