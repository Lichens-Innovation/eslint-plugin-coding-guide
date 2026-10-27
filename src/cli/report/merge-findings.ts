import type { Finding, Issue } from "../finding.types.js";

const observationOf = (issue: Issue): string => {
  const { file, line, column, startLine, endLine } = issue.details;
  return JSON.stringify([issue.key, file, line, column, startLine, endLine]);
};

const agreedDetails = (group: Finding[]): Record<string, unknown> => {
  const agreed: Record<string, unknown> = {};
  const contradicted = new Set<string>();
  group
    .flatMap((finding) => Object.entries(finding.details))
    .forEach(([name, fact]) => {
      if (contradicted.has(name)) return;
      if (!(name in agreed)) {
        agreed[name] = fact;
      } else if (JSON.stringify(agreed[name]) !== JSON.stringify(fact)) {
        delete agreed[name];
        contradicted.add(name);
      }
    });
  return agreed;
};

const issuesAcross = ([first, ...later]: Finding[]): Issue[] => {
  const issues = [...first.issues];
  const seen = new Set(issues.map(observationOf));
  later.forEach((finding) => {
    issues.push(...finding.issues.filter((issue) => !seen.has(observationOf(issue))));
    finding.issues.forEach((issue) => seen.add(observationOf(issue)));
  });
  return issues;
};

export const mergeFindings = (findings: Finding[], guideOf: (finding: Finding) => string): Finding[] => {
  const groups = new Map<string, Finding[]>();
  findings.forEach((finding) => {
    const groupKey = `${finding.smell}\n${guideOf(finding)}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), finding]);
  });
  return [...groups.values()].map((group) => ({
    smell: group[0].smell,
    details: agreedDetails(group),
    issues: issuesAcross(group),
  }));
};
