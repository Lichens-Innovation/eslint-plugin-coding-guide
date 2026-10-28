import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { safeJsonParse } from "@lichens-innovation/ts-common";

import { toPosixPath } from "../../utils/file.utils.js";
import { CliError } from "../cli-error.js";
import type { LoadedConfig } from "../config/config.types.js";
import { fileAtRevision } from "../scope/git.utils.js";

const INDEX_FILE = "snooze.json";

const indexPath = (config: LoadedConfig): string => join(config.configDir, INDEX_FILE);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((key) => typeof key === "string");

const parseIndex = (path: string, content: string): string[] => {
  const parsed = safeJsonParse<unknown>(content);
  if (!isStringList(parsed)) throw new CliError(`${path}: expected a JSON list of string keys`);
  return parsed;
};

export const loadSnoozeIndex = (config: LoadedConfig): string[] => {
  const path = indexPath(config);
  return existsSync(path) ? parseIndex(path, readFileSync(path, "utf8")) : [];
};

export const loadSnoozeIndexAt = (config: LoadedConfig, revision: string): string[] => {
  const path = toPosixPath(relative(config.cwd, indexPath(config)));
  const content = fileAtRevision(config.cwd, revision, path);
  return content === undefined ? [] : parseIndex(`${revision}:${path}`, content);
};

export const saveSnoozeIndex = (config: LoadedConfig, keys: string[]): void => {
  const path = indexPath(config);
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify([...new Set(keys)].sort(), null, 2)}\n`);
  renameSync(temporaryPath, path);
};
