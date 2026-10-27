import type { LoadedConfig, Severity } from "../config/config.types.js";
import { INCOMPLETE_RUN } from "../finding.types.js";

export const severityOf = (smell: string, config: LoadedConfig): Severity => {
  if (smell === INCOMPLETE_RUN) return "enforced";
  const declared = config.smells[smell]?.severity;
  if (declared) return declared;
  if (config.uncoached === "ignore") return "disabled";
  return config.uncoached === "enforce" ? "enforced" : "suggested";
};
