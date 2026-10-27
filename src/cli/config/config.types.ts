export type Severity = "enforced" | "suggested" | "disabled";

export type UncoachedPolicy = "suggest" | "ignore" | "enforce";

export interface SmellConfig {
  severity?: Severity;
  guide?: string;
}

interface SensorToggle {
  disabled?: boolean;
}

interface CommentSensorConfig extends SensorToggle {
  singleLineMinLength?: number;
  blockMinLength?: number;
}

interface SensorsConfig {
  eslint?: SensorToggle;
  knip?: SensorToggle;
  comment?: CommentSensorConfig;
  jscpd?: SensorToggle;
}

interface ScopeConfig {
  branchBase: string;
}

export interface CodingGuideConfig {
  files: string[];
  transformers: string[];
  scope: ScopeConfig;
  sensors: SensorsConfig;
  uncoached: UncoachedPolicy;
  smells: Record<string, SmellConfig>;
}

export interface LoadedConfig extends CodingGuideConfig {
  cwd: string;
  configDir: string;
}
