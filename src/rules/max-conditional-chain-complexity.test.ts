import { ruleTester } from "../rule-tester.js";
import rule from "./max-conditional-chain-complexity.js";

ruleTester.run("max-conditional-chain-complexity", rule, {
  valid: [
    {
      name: "two-key comparator stays within the default max of 2",
      code: "const compare = (a, b) => a.rank - b.rank || a.name.localeCompare(b.name);",
    },
    {
      name: "arithmetic fallback to a constant",
      code: "const size = count - offset || DEFAULT_SIZE;",
    },
    {
      name: "boolean calls without any arithmetic anchor",
      code: "if (isA(x) || isB(y) || isC(z)) { run(); }",
    },
    {
      name: "plain comparisons",
      code: "if (a === 1 || b === 2 || c === 3) { run(); }",
    },
    {
      name: "simple member checks",
      code: "const canEdit = isReady && user.isAdmin && !user.isLocked;",
    },
    {
      name: "refactored comparator with explicit branches",
      code: `
        const compareNetworks = (a, b) => {
          const rankDiff = getNetworkRank(a) - getNetworkRank(b);
          if (rankDiff !== 0) {
            return rankDiff;
          }
          const qualityDiff = b.quality - a.quality;
          if (qualityDiff !== 0) {
            return qualityDiff;
          }
          return a.ssid.localeCompare(b.ssid);
        };
      `,
    },
    {
      name: "raised max",
      code: "const r = getRank(a) - getRank(b) || b.quality - a.quality || a.ssid.localeCompare(b.ssid);",
      options: [{ max: 3 }],
    },
  ],
  invalid: [
    {
      name: "three-key comparator mixing concepts",
      code: `
        const compareNetworks = (a: AvailableNetwork, b: AvailableNetwork): number =>
          getNetworkRank(a) - getNetworkRank(b) || b.quality - a.quality || a.ssid.localeCompare(b.ssid);
      `,
      errors: [{ messageId: "tooComplexChain", data: { count: 3, max: 2 } }],
    },
    {
      name: "mixed operators with a ternary and calls",
      code: "const v = (isEnabled(flag) && limit - used) ?? (strict ? 0 : 1) ?? computeFallback(config);",
      errors: [{ messageId: "tooComplexChain", data: { count: 4, max: 2 } }],
    },
    {
      name: "comparison on arithmetic counts as anchor, through await and type assertion",
      code: "async function f() { return (a - b > 0) && (await load(id)) && (parse(raw) as Data); }",
      errors: [{ messageId: "tooComplexChain", data: { count: 3, max: 2 } }],
    },
    {
      name: "lowered max",
      code: "const compare = (a, b) => a.rank - b.rank || a.name.localeCompare(b.name);",
      options: [{ max: 1 }],
      errors: [{ messageId: "tooComplexChain", data: { count: 2, max: 1 } }],
    },
  ],
});
