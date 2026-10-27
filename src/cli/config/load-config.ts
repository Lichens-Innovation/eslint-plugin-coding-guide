import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { getErrorMessage } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";
import type { CodingGuideConfig, LoadedConfig, SmellConfig } from "./config.types.js";
import { DEFAULT_SMELLS } from "./default-smells.js";
import { validateConfig } from "./validate-config.js";

const CONFIG_DIR = ".coding-guide";
const CONFIG_FILE = "config.json";

const DEFAULT_CONFIG: CodingGuideConfig = {
  files: ["**/*.ts", "**/*.tsx", "!**/node_modules/**"],
  transformers: ["allow-aaa", "snooze", "habit-hooks-disable"],
  scope: { branchBase: "main" },
  sensors: {},
  uncoached: "suggest",
  smells: DEFAULT_SMELLS,
};

const readJson = (path: string): unknown => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error: unknown) {
    throw new CliError(`cannot read config ${path}: ${getErrorMessage(error)}`);
  }
};

const mergeSmells = (overrides: Record<string, SmellConfig> = {}): Record<string, SmellConfig> => {
  const merged = { ...DEFAULT_SMELLS };
  Object.entries(overrides).forEach(([smell, override]) => {
    merged[smell] = { ...merged[smell], ...override };
  });
  return merged;
};

const withDefaults = (project: Partial<CodingGuideConfig>): CodingGuideConfig => ({
  files: project.files ?? DEFAULT_CONFIG.files,
  transformers: project.transformers ?? DEFAULT_CONFIG.transformers,
  scope: { ...DEFAULT_CONFIG.scope, ...project.scope },
  sensors: project.sensors ?? DEFAULT_CONFIG.sensors,
  uncoached: project.uncoached ?? DEFAULT_CONFIG.uncoached,
  smells: mergeSmells(project.smells),
});

export const loadConfig = (cwd: string, configPath?: string): LoadedConfig => {
  const path = configPath ? resolve(cwd, configPath) : join(cwd, CONFIG_DIR, CONFIG_FILE);
  const configDir = configPath ? dirname(path) : join(cwd, CONFIG_DIR);
  if (!existsSync(path)) {
    if (configPath) throw new CliError(`config file not found: ${path}`);
    return { ...withDefaults({}), cwd, configDir };
  }
  const project = validateConfig(readJson(path)) as Partial<CodingGuideConfig>;
  return { ...withDefaults(project), cwd, configDir };
};
