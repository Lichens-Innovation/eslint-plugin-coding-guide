import type { LoadedConfig, Severity } from "../config/config.types.js";
import { INCOMPLETE_RUN, type Finding } from "../finding.types.js";
import { renderGuide, renderNamedGuide, resolveGuidePath } from "./guides.js";
import { mergeFindings } from "./merge-findings.js";
import { severityOf } from "./severity.js";

interface ReportedFinding extends Finding {
  severity: Severity;
  guide: string;
}

export interface Report {
  findings: ReportedFinding[];
  exitCode: number;
}

export const EXIT_CLEAN = 0;
export const EXIT_ENFORCED = 1;
export const EXIT_TOOL_ERROR = 2;

const exitCodeOf = (findings: ReportedFinding[]): number => {
  if (findings.some((finding) => finding.smell === INCOMPLETE_RUN)) return EXIT_TOOL_ERROR;
  return findings.some((finding) => finding.severity === "enforced") ? EXIT_ENFORCED : EXIT_CLEAN;
};

export const buildReport = (findings: Finding[], config: LoadedConfig): Report => {
  const coached = findings.filter((finding) => severityOf(finding.smell, config) !== "disabled");
  const guideOf = (finding: Finding): string => resolveGuidePath(finding.smell, config);
  const reported = mergeFindings(coached, guideOf).map((finding) => ({
    ...finding,
    severity: severityOf(finding.smell, config),
    guide: guideOf(finding),
  }));
  return { findings: reported, exitCode: exitCodeOf(reported) };
};

const banner = (finding: Finding): string => {
  const count = finding.issues.length;
  return `── ${finding.smell} (${count} ${count === 1 ? "issue" : "issues"}) ──`;
};

export const renderReportText = (report: Report, config: LoadedConfig): string => {
  if (report.findings.length === 0) return `${renderNamedGuide("clean", config)}\n`;
  const blocks = report.findings.map((finding) => `${banner(finding)}\n\n${renderGuide(finding.guide, finding)}`);
  return `${blocks.join("\n\n")}\n`;
};

export const renderReportJson = (report: Report): string => `${JSON.stringify(report, null, 2)}\n`;
