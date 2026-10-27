import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { isNullish, safeJsonParse } from "@lichens-innovation/ts-common";

import { isTestFile } from "../../utils/file.utils.js";
import type { Issue } from "../finding.types.js";
import { runProjectTool, toolFailure } from "./project-tool.utils.js";
import { groupBySmell, type Sensor, type SensorReport } from "./sensor.types.js";

interface KnipRow {
  knipKey: string;
  file: string;
  name?: string;
  line?: number;
  col?: number;
}

interface KnipOccurrence {
  name?: string;
  line?: number;
  col?: number;
}

interface KnipReport {
  files?: string[];
  issues?: Record<string, unknown>[];
}

interface PackageManifestWithKnip {
  knip?: KnipSettings;
}

interface KnipSettings {
  entry?: unknown;
  project?: unknown;
}

const SMELL_BY_KEY: Record<string, string> = {
  files: "unused-file",
  exports: "unused-export",
  types: "unused-export",
  nsExports: "unused-export",
  nsTypes: "unused-export",
  dependencies: "unused-dependency",
  devDependencies: "unused-dependency",
  optionalPeerDependencies: "unused-dependency",
  classMembers: "unused-class-member",
  enumMembers: "unused-class-member",
};

const PRODUCTION_SMELL = "test-only-dead-code";
const DEAD_CODE_KEYS = new Set(["files", "exports", "types", "nsExports", "nsTypes", "classMembers", "enumMembers"]);
const KNIP_CONFIG_FILES = ["knip.json", "knip.jsonc", ".knip.json", ".knip.jsonc"];
const ISSUE_META_KEYS = new Set(["file", "owners"]);

const occurrencesOf = (value: unknown): KnipOccurrence[] => {
  if (Array.isArray(value)) return value.flat() as KnipOccurrence[];
  if (typeof value === "object" && !isNullish(value)) return Object.values(value).flat() as KnipOccurrence[];
  return [];
};

const rowsOf = (report: KnipReport): KnipRow[] => {
  const unusedFiles = (report.files ?? []).map((file) => ({ knipKey: "files", file, name: file }));
  const issueRows = (report.issues ?? []).flatMap((issue) =>
    Object.entries(issue)
      .filter(([knipKey]) => !ISSUE_META_KEYS.has(knipKey))
      .flatMap(([knipKey, value]) =>
        occurrencesOf(value).map((occurrence) => ({ knipKey, file: String(issue.file), ...occurrence }))
      )
  );
  return [...unusedFiles, ...issueRows];
};

const toIssue = (row: KnipRow, source: string): Issue => ({
  key: row.name ?? row.file,
  details: { file: row.file, name: row.name, line: row.line, column: row.col, source },
});

const signature = (row: KnipRow): string => `${row.knipKey}\n${row.file}\n${row.name ?? ""}`;

const readKnipSettings = (cwd: string): KnipSettings | null => {
  const configFile = KNIP_CONFIG_FILES.map((name) => join(cwd, name)).find((path) => existsSync(path));
  if (configFile) return safeJsonParse<KnipSettings>(readFileSync(configFile, "utf8")) ?? null;
  const manifest = safeJsonParse<PackageManifestWithKnip>(readFileSync(join(cwd, "package.json"), "utf8"));
  return manifest?.knip ?? null;
};

const marksProduction = (patterns: unknown): boolean =>
  Array.isArray(patterns) && patterns.some((pattern) => typeof pattern === "string" && pattern.endsWith("!"));

const configMarksProduction = (cwd: string): boolean => {
  const settings = readKnipSettings(cwd);
  return marksProduction(settings?.entry) && marksProduction(settings?.project);
};

const knipPass = (cwd: string, extraArgs: string[]): KnipReport => {
  const run = runProjectTool(cwd, "knip", ["--reporter", "json", ...extraArgs]);
  const report = safeJsonParse<KnipReport>(run.stdout);
  if (isNullish(run.status) || run.status > 1 || isNullish(report)) throw toolFailure("knip", run);
  return report;
};

const productionReports = (cwd: string, defaultRows: KnipRow[]): SensorReport[] => {
  if (!configMarksProduction(cwd)) return [];
  const alreadyDead = new Set(defaultRows.map(signature));
  return rowsOf(knipPass(cwd, ["--production"]))
    .filter((row) => DEAD_CODE_KEYS.has(row.knipKey) && !alreadyDead.has(signature(row)) && !isTestFile(row.file))
    .map((row) => ({ smell: PRODUCTION_SMELL, issue: toIssue(row, `knip:production:${row.knipKey}`) }));
};

export const knipSensor: Sensor = {
  name: "knip",
  projectWide: true,
  run: async ({ config }) => {
    const defaultRows = rowsOf(knipPass(config.cwd, []));
    const reports = defaultRows
      .filter((row) => SMELL_BY_KEY[row.knipKey])
      .map((row) => ({ smell: SMELL_BY_KEY[row.knipKey], issue: toIssue(row, `knip:${row.knipKey}`) }));
    return groupBySmell([...reports, ...productionReports(config.cwd, defaultRows)]);
  },
};
