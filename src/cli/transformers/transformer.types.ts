import type { LoadedConfig } from "../config/config.types.js";
import type { Finding, Issue } from "../finding.types.js";
import type { ScopeMode } from "../scope/resolve-scope.js";

export interface TransformerContext {
  config: LoadedConfig;
  scopeMode: ScopeMode;
  skipSnooze: boolean;
}

export type Transformer = (findings: Finding[], context: TransformerContext) => Finding[] | Promise<Finding[]>;

export const defineTransformer = (transformer: Transformer): Transformer => transformer;

export const dropIssues = (findings: Finding[], shouldDrop: (issue: Issue, finding: Finding) => boolean): Finding[] =>
  findings.flatMap((finding) => {
    const kept = finding.issues.filter((issue) => !shouldDrop(issue, finding));
    const droppedAll = finding.issues.length > 0 && kept.length === 0;
    return droppedAll ? [] : [{ ...finding, issues: kept }];
  });
