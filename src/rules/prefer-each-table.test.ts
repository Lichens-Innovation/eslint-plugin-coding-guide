import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-each-table.js";

ruleTester.run("prefer-each-table", rule, {
  valid: [
    {
      code: `it.each\`
  line             | expected
  \${"PROGRESS: 0"} | \${0}
\`("reads $line", ({ line, expected }) => {});`,
    },
    { code: "it.each([1, 2, 3])('handles %d', (value) => {});" },
    { code: "it.each([{ a: 1, b: 2 }])('handles $a', ({ a, b }) => {});" },
    { code: "it.each(cases)('handles %s', (value) => {});" },
    { code: "foo.each([[1, 2]])('x', (a, b) => {});" },
    { code: "it.each([])('never', () => {});" },
  ],
  invalid: [
    {
      code: `describe("parse", () => {
  it.each([
    ["PROGRESS: 0", 0],
    ["PROGRESS: 42", 42],
  ])("reads %s", (line, expected) => {
    expect(parse(line)).toBe(expected);
  });
});`,
      output: `describe("parse", () => {
  it.each\`
    line              | expected
    \${"PROGRESS: 0"}  | \${0}
    \${"PROGRESS: 42"} | \${42}
  \`("reads $line", ({ line, expected }) => {
    expect(parse(line)).toBe(expected);
  });
});`,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "test.only.each([[1, 2, 3]])('%d + %d = %d', function (a, b, sum) {});",
      output: `test.only.each\`
  a    | b    | sum
  \${1} | \${2} | \${3}
\`('$a + $b = $sum', function ({ a, b, sum }) {});`,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "describe.each([['a', 1]])('%s is 100%%', (name, value) => {});",
      output: `describe.each\`
  name   | value
  \${'a'} | \${1}
\`('$name is 100%', ({ name, value }) => {});`,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "it.each([[1, 2]])('case %#', (a, b) => {});",
      output: null,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "it.each([[1, 2]])('case %s', (a: number, b: number) => {});",
      output: null,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "it.each([[1, 2], [3]])('case %s %s', (a, b) => {});",
      output: null,
      errors: [{ messageId: "preferTable" }],
    },
    {
      code: "it.each([[...base, 2]])('case %s', (a, b) => {});",
      output: null,
      errors: [{ messageId: "preferTable" }],
    },
  ],
});
