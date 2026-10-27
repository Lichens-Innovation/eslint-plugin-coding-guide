import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isBlank } from "@lichens-innovation/ts-common";

import type { LoadedConfig } from "../config/config.types.js";
import type { Finding, Issue } from "../finding.types.js";

const GUIDES_DIR = join("docs", "habit-hooks-guides");
const PROJECT_GUIDES_DIR = "guides";
const UNCOACHED_GUIDE = "uncoached";
const TEMPLATE_DIRECTIVE = /^\s*\{%/m;

const findPackageGuidesDir = (from: string): string => {
  const candidate = join(from, GUIDES_DIR);
  if (existsSync(candidate)) return candidate;
  const parent = dirname(from);
  if (parent === from) throw new Error(`cannot locate ${GUIDES_DIR} in the coding-guide package`);
  return findPackageGuidesDir(parent);
};

const packageGuidesDir = findPackageGuidesDir(dirname(fileURLToPath(import.meta.url)));

const withExtension = (name: string): string => (name.endsWith(".md") ? name : `${name}.md`);

const guideCandidates = (smell: string, config: LoadedConfig): string[] => {
  const declared = config.smells[smell]?.guide;
  if (declared) return [withExtension(declared)];
  const ruleName = smell.split("/").at(-1) ?? smell;
  return [...new Set([withExtension(smell.replaceAll("/", "-")), withExtension(ruleName)])];
};

const findGuide = (names: string[], config: LoadedConfig): string | null => {
  const directories = [join(config.configDir, PROJECT_GUIDES_DIR), packageGuidesDir];
  const paths = directories.flatMap((directory) => names.map((name) => join(directory, name)));
  return paths.find((path) => existsSync(path)) ?? null;
};

export const resolveGuidePath = (smell: string, config: LoadedConfig): string =>
  findGuide(guideCandidates(smell, config), config) ??
  findGuide([withExtension(UNCOACHED_GUIDE)], config) ??
  join(packageGuidesDir, withExtension(UNCOACHED_GUIDE));

const location = (issue: Issue): string => {
  const { file, line, startLine, endLine } = issue.details;
  if (isBlank(file)) return "";
  if (startLine && endLine) return `${file}:${startLine}-${endLine}`;
  return line ? `${file}:${line}` : file;
};

const issueLine = (issue: Issue): string => {
  const what = issue.details.message ?? issue.details.content ?? issue.details.name ?? "";
  const where = location(issue);
  return [where, what === issue.details.file ? "" : what].filter((part) => !isBlank(part)).join("  ");
};

const guideProse = (path: string): string => {
  const text = readFileSync(path, "utf8");
  const directive = TEMPLATE_DIRECTIVE.exec(text);
  return (directive ? text.slice(0, directive.index) : text).trim();
};

export const renderGuide = (path: string, finding: Finding): string =>
  [guideProse(path), finding.issues.map(issueLine).join("\n")].filter((part) => !isBlank(part)).join("\n\n");

export const renderNamedGuide = (name: string, config: LoadedConfig): string =>
  guideProse(findGuide([withExtension(name)], config) ?? join(packageGuidesDir, withExtension(name)));
