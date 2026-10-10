import type { Linter } from "eslint";

import { recommended } from "./configs/recommended.js";
import { rules } from "./rules/index.js";

export type { Options as MaxFilesPerFolderOptions } from "./rules/max-files-per-folder.js";
export type { Options as MaxParamsProjectOptions } from "./rules/max-params-project.js";
export type { Options as NoDoubleNegationOptions } from "./rules/no-double-negation.js";
export type { Options as RequireFallbackOnDeepChainOptions } from "./rules/require-fallback-on-deep-chain.js";
export type { Options as TodoTicketRefOptions } from "./rules/todo-ticket-ref.js";

const plugin = {
  meta: {
    name: "@lichens-innovation/eslint-plugin-coding-guide",
  },
  rules,
} as const;

interface PluginConfigs {
  recommended: Linter.Config;
}

export const configs: PluginConfigs = {
  recommended: recommended(plugin),
};

export default plugin;
