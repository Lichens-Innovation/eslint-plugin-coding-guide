import { INCOMPLETE_RUN } from "../finding.types.js";
import { loadSnoozeIndex } from "../snooze/snooze-index.js";
import { defineTransformer, dropIssues } from "./transformer.types.js";

export const snooze = defineTransformer((findings, { config, skipSnooze }) => {
  if (skipSnooze) return findings;
  const snoozed = new Set(loadSnoozeIndex(config));
  if (snoozed.size === 0) return findings;
  return dropIssues(findings, (issue, finding) => finding.smell !== INCOMPLETE_RUN && snoozed.has(issue.key));
});
