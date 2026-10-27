import { toPosixPath } from "../../utils/file.utils.js";
import type { Issue } from "../finding.types.js";
import { defineTransformer, dropIssues } from "./transformer.types.js";

const SMELL = "non-essential-comment";
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/i;
const AAA_BODY = /^(Arrange|Act|Assert)(?:\s*[/&]\s*(Arrange|Act|Assert))*(?:\s*[—–\-:].*)?$/i;
const QUOTED_COMMENT = /comment:\s*"(.*)"\s*$/;

const commentBody = (message: string): string => {
  const raw = QUOTED_COMMENT.exec(message)?.[1] ?? message;
  return raw
    .replace(/^\/\*+|\*+\/$/g, "")
    .replace(/^\/\//, "")
    .replaceAll(/\s+/g, " ")
    .trim();
};

const isAaaMarkerInTest = (issue: Issue): boolean => {
  const file = toPosixPath(issue.details.file ?? issue.key);
  return TEST_FILE.test(file) && AAA_BODY.test(commentBody(issue.details.message ?? ""));
};

export const allowAaa = defineTransformer((findings) =>
  dropIssues(findings, (issue, finding) => finding.smell === SMELL && isAaaMarkerInTest(issue))
);
