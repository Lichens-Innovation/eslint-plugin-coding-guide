import type { LoadedConfig } from "../config/config.types.js";
import type { Finding } from "../finding.types.js";
import { resolveScope, type Scope, type ScopeMode } from "../scope/resolve-scope.js";
import { runSensors } from "../sensors/run-sensors.js";
import { runTransformers } from "../transformers/run-transformers.js";

interface CollectArgs {
  config: LoadedConfig;
  mode: ScopeMode;
  skipSnooze?: boolean;
}

interface Collected {
  scope: Scope;
  findings: Finding[];
}

export const collectFindings = async ({ config, mode, skipSnooze = false }: CollectArgs): Promise<Collected> => {
  const scope = resolveScope(mode, config);
  const sensed = await runSensors(config, scope);
  const context = { config, scopeMode: mode, skipSnooze: skipSnooze || mode.kind === "file" };
  const findings = await runTransformers(sensed, context);
  return { scope, findings };
};
