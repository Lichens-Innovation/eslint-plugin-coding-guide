import { isNullish } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";

type JsonObject = Record<string, unknown>;

const ROOT_KEYS = ["$schema", "files", "transformers", "scope", "sensors", "uncoached", "smells"];
const SCOPE_KEYS = ["branchBase"];
const SENSOR_KEYS: Record<string, string[]> = {
  eslint: ["disabled"],
  knip: ["disabled"],
  jscpd: ["disabled"],
  comment: ["disabled", "singleLineMinLength", "blockMinLength"],
};
const SMELL_KEYS = ["severity", "guide"];
const SEVERITIES = ["enforced", "suggested", "disabled"];
const UNCOACHED_POLICIES = ["suggest", "ignore", "enforce"];

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && !isNullish(value) && !Array.isArray(value);

const fail = (where: string, problem: string): never => {
  throw new CliError(`config ${where}: ${problem}`);
};

const requireObject = (value: unknown, where: string): JsonObject => {
  if (!isObject(value)) return fail(where, "expected an object");
  return value;
};

const rejectUnknownKeys = (value: JsonObject, allowed: string[], where: string): void => {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) fail(where, `unknown key(s) ${unknown.map((key) => `"${key}"`).join(", ")}`);
};

const requireStringList = (value: unknown, where: string): void => {
  const isStringList = Array.isArray(value) && value.every((item) => typeof item === "string");
  if (!isStringList) fail(where, "expected a list of strings");
};

const requireOneOf = (value: unknown, allowed: string[], where: string): void => {
  if (typeof value !== "string" || !allowed.includes(value)) fail(where, `expected one of ${allowed.join(", ")}`);
};

const validateSensors = (value: unknown): void => {
  const sensors = requireObject(value, "sensors");
  rejectUnknownKeys(sensors, Object.keys(SENSOR_KEYS), "sensors");
  Object.entries(sensors).forEach(([name, sensor]) => {
    rejectUnknownKeys(requireObject(sensor, `sensors.${name}`), SENSOR_KEYS[name] ?? [], `sensors.${name}`);
  });
};

const validateSmells = (value: unknown): void => {
  const smells = requireObject(value, "smells");
  Object.entries(smells).forEach(([name, smell]) => {
    const where = `smells["${name}"]`;
    const smellObject = requireObject(smell, where);
    rejectUnknownKeys(smellObject, SMELL_KEYS, where);
    if (!isNullish(smellObject.severity)) requireOneOf(smellObject.severity, SEVERITIES, `${where}.severity`);
    if (!isNullish(smellObject.guide) && typeof smellObject.guide !== "string")
      fail(`${where}.guide`, "expected a string");
  });
};

export const validateConfig = (raw: unknown): JsonObject => {
  const config = requireObject(raw, "root");
  rejectUnknownKeys(config, ROOT_KEYS, "root");
  if (!isNullish(config.files)) requireStringList(config.files, "files");
  if (!isNullish(config.transformers)) requireStringList(config.transformers, "transformers");
  if (!isNullish(config.scope)) rejectUnknownKeys(requireObject(config.scope, "scope"), SCOPE_KEYS, "scope");
  if (!isNullish(config.sensors)) validateSensors(config.sensors);
  if (!isNullish(config.uncoached)) requireOneOf(config.uncoached, UNCOACHED_POLICIES, "uncoached");
  if (!isNullish(config.smells)) validateSmells(config.smells);
  return config;
};
