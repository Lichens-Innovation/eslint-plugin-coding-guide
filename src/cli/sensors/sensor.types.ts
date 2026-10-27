import type { LoadedConfig } from "../config/config.types.js";
import type { Finding, Issue } from "../finding.types.js";

interface SensorContext {
  config: LoadedConfig;
  files: string[];
}

export interface Sensor {
  name: "eslint" | "knip" | "comment" | "jscpd";
  projectWide: boolean;
  run: (context: SensorContext) => Promise<Finding[]>;
}

export interface SensorReport {
  smell: string;
  issue: Issue;
}

export const groupBySmell = (reports: SensorReport[]): Finding[] => {
  const bySmell = new Map<string, Finding>();
  reports.forEach(({ smell, issue }) => {
    const finding = bySmell.get(smell) ?? { smell, details: {}, issues: [] };
    finding.issues.push(issue);
    bySmell.set(smell, finding);
  });
  return [...bySmell.values()].sort((one, other) => one.smell.localeCompare(other.smell));
};
