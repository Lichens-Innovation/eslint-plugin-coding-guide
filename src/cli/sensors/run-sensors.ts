import { getErrorMessage } from "@lichens-innovation/ts-common";

import type { LoadedConfig } from "../config/config.types.js";
import { incompleteRunFinding, type Finding } from "../finding.types.js";
import type { Scope } from "../scope/resolve-scope.js";
import { commentSensor } from "./comment-sensor.js";
import { eslintSensor } from "./eslint-sensor.js";
import { jscpdSensor } from "./jscpd-sensor.js";
import { knipSensor } from "./knip-sensor.js";
import type { Sensor } from "./sensor.types.js";

const SENSORS: Sensor[] = [eslintSensor, knipSensor, commentSensor, jscpdSensor];

const keepScopedIssues = (findings: Finding[], scoped: Set<string>): Finding[] =>
  findings
    .map((finding) => ({
      ...finding,
      issues: finding.issues.filter((issue) => scoped.has(issue.details.file ?? issue.key)),
    }))
    .filter((finding) => finding.issues.length > 0);

const runSensor = async (sensor: Sensor, config: LoadedConfig, scope: Scope): Promise<Finding[]> => {
  try {
    const findings = await sensor.run({ config, files: scope.files });
    const narrowed = sensor.projectWide && scope.mode.kind !== "all";
    return narrowed ? keepScopedIssues(findings, new Set(scope.touched)) : findings;
  } catch (error: unknown) {
    return [incompleteRunFinding([`sensor "${sensor.name}" failed: ${getErrorMessage(error)}`])];
  }
};

export const runSensors = async (config: LoadedConfig, scope: Scope): Promise<Finding[]> => {
  if (scope.files.length === 0) return [];
  const enabled = SENSORS.filter((sensor) => !config.sensors[sensor.name]?.disabled);
  const outputs = await Promise.all(enabled.map((sensor) => runSensor(sensor, config, scope)));
  return outputs.flat();
};
