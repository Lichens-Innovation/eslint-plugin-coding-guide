import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { safeJsonParse } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";
import type { LoadedConfig } from "../config/config.types.js";

const INDEX_FILE = "snooze.json";

const indexPath = (config: LoadedConfig): string => join(config.configDir, INDEX_FILE);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((key) => typeof key === "string");

export const loadSnoozeIndex = (config: LoadedConfig): string[] => {
  const path = indexPath(config);
  if (!existsSync(path)) return [];
  const parsed = safeJsonParse<unknown>(readFileSync(path, "utf8"));
  if (!isStringList(parsed)) throw new CliError(`${path}: expected a JSON list of string keys`);
  return parsed;
};

export const saveSnoozeIndex = (config: LoadedConfig, keys: string[]): void => {
  const path = indexPath(config);
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify([...new Set(keys)].sort(), null, 2)}\n`);
  renameSync(temporaryPath, path);
};
