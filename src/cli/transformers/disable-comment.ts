import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isNullish } from "@lichens-innovation/ts-common";

import type { Issue } from "../finding.types.js";
import { defineTransformer, dropIssues } from "./transformer.types.js";

interface Directive {
  nextLine: boolean;
  smells: Set<string>;
}

const DIRECTIVE = /(?:habit-hooks|coding-guide)-disable(-next-line)?\b[:\s]*(.*)$/i;

const parseDirective = (line = ""): Directive | null => {
  const match = DIRECTIVE.exec(line);
  if (!match) return null;
  const tail = (match[2] ?? "").replace(/\*+\/\s*$/, "").trim();
  const smells = tail
    .split(",")
    .map((smell) => smell.trim().toLowerCase())
    .filter((smell) => smell.length > 0);
  return { nextLine: Boolean(match[1]), smells: new Set(smells) };
};

const covers = (directive: Directive | null, nextLine: boolean, smell: string): boolean =>
  !isNullish(directive) &&
  directive.nextLine === nextLine &&
  (directive.smells.size === 0 || directive.smells.has(smell.toLowerCase()));

const createLineReader = (cwd: string): ((file: string) => string[]) => {
  const cache = new Map<string, string[]>();
  return (file) => {
    if (!cache.has(file)) {
      try {
        cache.set(file, readFileSync(join(cwd, file), "utf8").split(/\r?\n/));
      } catch {
        cache.set(file, []);
      }
    }
    return cache.get(file) ?? [];
  };
};

const issueLine = (issue: Issue): number | null => {
  const line = issue.details.line ?? issue.details.startLine;
  return typeof line === "number" ? line : null;
};

export const disableComment = defineTransformer((findings, { config }) => {
  const linesOf = createLineReader(config.cwd);
  return dropIssues(findings, (issue, finding) => {
    const line = issueLine(issue);
    const file = issue.details.file ?? issue.key;
    if (isNullish(line)) return false;
    const lines = linesOf(file);
    return (
      covers(parseDirective(lines[line - 1]), false, finding.smell) ||
      covers(parseDirective(lines[line - 2]), true, finding.smell)
    );
  });
});
