import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { isBlank, isNullish, safeJsonParse } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";

export interface ToolRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

interface PackageManifest {
  bin?: string | Record<string, string>;
}

const MAX_BUFFER = 512 * 1024 * 1024;

const requireFrom = (cwd: string): NodeJS.Require => createRequire(join(cwd, "package.json"));

const tryResolve = (resolver: NodeJS.Require, specifier: string): string | null => {
  try {
    return resolver.resolve(specifier);
  } catch {
    return null;
  }
};

const resolveFromProjectOrSelf = (cwd: string, specifier: string): string => {
  const resolved = tryResolve(requireFrom(cwd), specifier) ?? tryResolve(createRequire(import.meta.url), specifier);
  if (isNullish(resolved)) throw new CliError(`"${specifier}" is not installed in this project`);
  return resolved;
};

export const importFromProject = async <T>(cwd: string, specifier: string): Promise<T> => {
  const loaded = (await import(pathToFileURL(resolveFromProjectOrSelf(cwd, specifier)).href)) as { default?: T };
  return loaded.default ?? (loaded as T);
};

const findManifest = (tool: string, from: string): string | null => {
  const candidate = join(from, "node_modules", tool, "package.json");
  if (existsSync(candidate)) return candidate;
  const parent = dirname(from);
  return parent === from ? null : findManifest(tool, parent);
};

const toolManifestPath = (cwd: string, tool: string): string => {
  const manifestPath = findManifest(tool, cwd) ?? findManifest(tool, dirname(fileURLToPath(import.meta.url)));
  if (isNullish(manifestPath)) throw new CliError(`"${tool}" is not installed in this project`);
  return manifestPath;
};

const binScript = (cwd: string, tool: string): string => {
  const manifestPath = toolManifestPath(cwd, tool);
  const manifest = safeJsonParse<PackageManifest>(readFileSync(manifestPath, "utf8"));
  const entry = typeof manifest?.bin === "string" ? manifest.bin : manifest?.bin?.[tool];
  if (isNullish(entry) || isBlank(entry)) throw new CliError(`"${tool}" declares no executable`);
  return resolve(dirname(manifestPath), entry);
};

export const runProjectTool = (cwd: string, tool: string, args: string[]): ToolRun => {
  const result = spawnSync(process.execPath, [binScript(cwd, tool), ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
  if (result.error) throw new CliError(`${tool}: ${result.error.message}`);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

export const toolFailure = (tool: string, run: ToolRun): CliError => {
  const said = isBlank(run.stderr) ? run.stdout.trim().slice(0, 500) : run.stderr.trim();
  return new CliError(`${tool} exited ${run.status ?? "abnormally"}${isBlank(said) ? "" : `: ${said}`}`);
};
