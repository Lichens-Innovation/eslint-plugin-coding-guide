import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { collectFindings } from "../commands/collect-findings.js";
import { createTempProject, type TempProject } from "../test-utils/temp-project.js";

const JSCPD_ONLY_SENSORS = { eslint: { disabled: true }, knip: { disabled: true }, comment: { disabled: true } };

const DUPLICATED_BLOCK = [
  "export const describePoint = (x: number, y: number, z: number): string => {",
  "  const total = x + y + z;",
  "  const average = total / 3;",
  "  const spread = Math.max(x, y, z) - Math.min(x, y, z);",
  "  const label = `${total}|${average}|${spread}`;",
  "  return label.toUpperCase().trim().padStart(12, '-');",
  "};",
].join("\n");

describe("jscpdSensor", () => {
  let project: TempProject;

  beforeEach(() => {
    project = createTempProject();
    project.write("package.json", "{}");
    project.write(".jscpd.json", JSON.stringify({ path: ["src"], minLines: 5, minTokens: 50 }));
    project.write("src/feature/first.ts", DUPLICATED_BLOCK);
    project.write("src/feature/second.ts", DUPLICATED_BLOCK.replace("describePoint", "describeOther"));
  });

  afterEach(() => project.cleanup());

  it("keys issues by project-relative path when jscpd scans a sub-directory", async () => {
    // act
    const { findings } = await collectFindings({
      config: project.config({ sensors: JSCPD_ONLY_SENSORS }),
      mode: { kind: "all" },
    });

    // assert
    expect(findings.flatMap((finding) => finding.issues.map((issue) => issue.key)).sort()).toEqual([
      "src/feature/first.ts",
      "src/feature/second.ts",
    ]);
  });

  it("keeps duplicates touching staged files", async () => {
    // arrange
    project.git("add", "src/feature/first.ts");

    // act
    const { findings } = await collectFindings({
      config: project.config({ sensors: JSCPD_ONLY_SENSORS }),
      mode: { kind: "staged" },
    });

    // assert
    expect(findings.flatMap((finding) => finding.issues.map((issue) => issue.key))).toEqual(["src/feature/first.ts"]);
  });
});
