import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { getErrorMessage } from "@lichens-innovation/ts-common";

import { CliError } from "../cli-error.js";
import { incompleteRunFinding, type Finding } from "../finding.types.js";
import { allowAaa } from "./allow-aaa.js";
import { disableComment } from "./disable-comment.js";
import { snooze } from "./snooze.js";
import type { Transformer, TransformerContext } from "./transformer.types.js";

const BUILT_IN_TRANSFORMERS: Record<string, Transformer> = {
  "allow-aaa": allowAaa,
  snooze,
  "habit-hooks-disable": disableComment,
  "coding-guide-disable": disableComment,
};

const isPath = (name: string): boolean => name.startsWith(".") || name.startsWith("/");

const loadTransformer = async (name: string, cwd: string): Promise<Transformer> => {
  const builtIn = BUILT_IN_TRANSFORMERS[name];
  if (builtIn) return builtIn;
  if (!isPath(name)) throw new CliError(`unknown transformer "${name}" (use a built-in name or a ./relative path)`);
  const loaded = (await import(pathToFileURL(resolve(cwd, name)).href)) as { default?: unknown };
  if (typeof loaded.default !== "function")
    throw new CliError(`transformer "${name}" has no default-exported function`);
  return loaded.default as Transformer;
};

export const runTransformers = async (findings: Finding[], context: TransformerContext): Promise<Finding[]> => {
  let current = findings;
  for (const name of context.config.transformers) {
    try {
      const transformer = await loadTransformer(name, context.config.cwd);
      current = await transformer(current, context);
    } catch (error: unknown) {
      return [...current, incompleteRunFinding([`transformer "${name}" failed: ${getErrorMessage(error)}`])];
    }
  }
  return current;
};
