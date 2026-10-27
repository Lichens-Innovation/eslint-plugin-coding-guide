export interface IssueDetails {
  file?: string;
  line?: number | null;
  column?: number | null;
  startLine?: number;
  endLine?: number;
  message?: string;
  name?: string;
  content?: string;
  source?: string;
}

export interface Issue {
  key: string;
  details: IssueDetails;
}

export interface Finding {
  smell: string;
  details: Record<string, unknown>;
  issues: Issue[];
}

export const INCOMPLETE_RUN = "incomplete-run";

export const incompleteRunFinding = (notices: string[]): Finding => ({
  smell: INCOMPLETE_RUN,
  details: {},
  issues: notices.map((notice) => ({ key: notice, details: { content: notice } })),
});

export const issuesOf = (findings: Finding[]): Issue[] => findings.flatMap((finding) => finding.issues);
