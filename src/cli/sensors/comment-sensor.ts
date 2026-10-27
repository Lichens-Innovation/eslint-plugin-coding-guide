import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isBlank } from "@lichens-innovation/ts-common";
import type * as TypeScript from "typescript";

import type { Finding, Issue } from "../finding.types.js";
import { importFromProject } from "./project-tool.utils.js";
import type { Sensor } from "./sensor.types.js";

type Ts = typeof TypeScript;

interface CommentThresholds {
  singleLine: number;
  block: number;
}

interface FileToScan {
  file: string;
  text: string;
}

const SMELL = "non-essential-comment";
const EXEMPT_MARKER = "eslint-disable";
const SNIPPET_LENGTH = 50;
const SCANNABLE = /\.(tsx?|jsx?|[cm][jt]s)$/;

const commentRanges = (ts: Ts, source: TypeScript.SourceFile): TypeScript.CommentRange[] => {
  const byPosition = new Map<number, TypeScript.CommentRange>();
  const collect = (position: number): void => {
    (ts.getLeadingCommentRanges(source.text, position) ?? []).forEach((range) => byPosition.set(range.pos, range));
  };
  const visit = (node: TypeScript.Node): void => {
    if (ts.isJsxText(node)) return;
    collect(node.getFullStart());
    if (!ts.isJSDoc(node)) node.getChildren(source).forEach(visit);
  };
  visit(source);
  collect(source.endOfFileToken.getFullStart());
  return [...byPosition.values()].sort((one, other) => one.pos - other.pos);
};

const startsItsLine = (text: string, position: number): boolean => {
  const lineStart = text.lastIndexOf("\n", position - 1) + 1;
  return isBlank(text.slice(lineStart, position));
};

const kindOf = (comment: string): string => {
  if (comment.startsWith("//")) return "single";
  return comment.startsWith("/**") ? "JSDoc" : "block";
};

const isReportable = (comment: string, thresholds: CommentThresholds): boolean => {
  if (comment.includes(EXEMPT_MARKER) || comment.startsWith("#!")) return false;
  const minimum = comment.startsWith("//") ? thresholds.singleLine : thresholds.block;
  return comment.length >= minimum;
};

const snippet = (comment: string): string => {
  const collapsed = comment.replaceAll(/\s+/g, " ").trim();
  return collapsed.length > SNIPPET_LENGTH ? `${collapsed.slice(0, SNIPPET_LENGTH)}...` : collapsed;
};

const commentIssues = (ts: Ts, { file, text }: FileToScan, thresholds: CommentThresholds): Issue[] => {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  return commentRanges(ts, source)
    .filter((range) => startsItsLine(text, range.pos))
    .map((range) => ({ range, comment: text.slice(range.pos, range.end).trim() }))
    .filter(({ comment }) => isReportable(comment, thresholds))
    .map(({ range, comment }) => ({
      key: file,
      details: {
        file,
        line: source.getLineAndCharacterOfPosition(range.pos).line + 1,
        message: `${kindOf(comment)}-line comment: "${snippet(comment)}"`,
        source: "comment:non-essential",
      },
    }));
};

export const commentSensor: Sensor = {
  name: "comment",
  projectWide: false,
  run: async ({ config, files }): Promise<Finding[]> => {
    const scannable = files.filter((file) => SCANNABLE.test(file));
    if (scannable.length === 0) return [];
    const ts = await importFromProject<Ts>(config.cwd, "typescript");
    const thresholds = {
      singleLine: config.sensors.comment?.singleLineMinLength ?? 10,
      block: config.sensors.comment?.blockMinLength ?? 15,
    };
    const issues = scannable.flatMap((file) =>
      commentIssues(ts, { file, text: readFileSync(join(config.cwd, file), "utf8") }, thresholds)
    );
    return issues.length > 0 ? [{ smell: SMELL, details: {}, issues }] : [];
  },
};
