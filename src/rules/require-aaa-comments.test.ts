import { ruleTester } from "../rule-tester.js";
import rule from "./require-aaa-comments.js";

ruleTester.run("require-aaa-comments", rule, {
  valid: [
    { code: "it('works', () => expect(sum(1, 2)).toBe(3));" },
    { code: "it('works', () => { expect(sum(1, 2)).toBe(3); });" },
    { code: "it('works', () => { expect(a).toBe(1); expect(b).toBe(2); });" },
    { code: "it('works', async () => { await expect(load()).resolves.toBe(1); expect(spy).toHaveBeenCalled(); });" },
    {
      code: `it("finds the entry", async () => {
  // act
  const exists = await opfsEntryExists({ root, path: "note.txt" });

  // assert
  expect(exists).toBe(true);
});`,
    },
    {
      code: `test("sums", function () {
  // Arrange
  const a = 1;
  const b = 2;

  // Act
  const result = sum(a, b);

  // Assert
  expect(result).toBe(3);
});`,
    },
    {
      code: `it("throws", () => {
  // arrange
  const input = "";

  // act & assert
  expect(() => parse(input)).toThrow();
});`,
    },
    { code: "describe('suite', () => { const a = 1; const b = 2; });" },
    { code: "foo('x', () => { const a = 1; run(a); });" },
  ],
  invalid: [
    {
      code: `it("finds the entry", async () => {
  const exists = await opfsEntryExists({ root, path: "note.txt" });
  expect(exists).toBe(true);
});`,
      errors: [{ messageId: "missingSections", data: { missing: "// act, // assert" } }],
    },
    {
      code: `it("sums", () => {
  // act
  const result = sum(1, 2);
  expect(result).toBe(3);
});`,
      errors: [{ messageId: "missingSections", data: { missing: "// assert" } }],
    },
    {
      code: `test.only("sums", () => {
  const result = sum(1, 2);
  // assert
  expect(result).toBe(3);
});`,
      errors: [{ messageId: "missingSections", data: { missing: "// act" } }],
    },
    {
      code: `it.each\`
  a    | expected
  \${1} | \${1}
\`("handles $a", ({ a, expected }) => {
  const result = identity(a);
  expect(result).toBe(expected);
});`,
      errors: [{ messageId: "missingSections", data: { missing: "// act, // assert" } }],
    },
  ],
});
