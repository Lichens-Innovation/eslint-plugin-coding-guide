# coding-guide/require-aaa-comments

Requires a multi-statement test to label its phases with `// arrange`, `// act` and `// assert` comments. Naming each step makes the test easy to scan: what is set up, what is exercised, what is checked.

This is a deliberate exception to the "no needless comments" guideline — here the comment adds value by marking the step.

Applies to callbacks of any chain rooted at `it` or `test` (e.g. `it.only`, `test.each`). `// act` and `// assert` are required; `// arrange` is optional since not every test has a setup step. A combined `// act & assert` (or `act and assert`) covers both, e.g. around `expect(() => fn()).toThrow()`. Matching is case-insensitive.

Not reported:

- one-liner tests (expression body or a single statement);
- tests made only of `expect(...)` statements.

## ❌ Incorrect

```ts
it("finds the entry", async () => {
  const exists = await opfsEntryExists({ root, path: "note.txt" });
  expect(exists).toBe(true);
});
```

## ✅ Correct

```ts
it("finds the entry", async () => {
  // act
  const exists = await opfsEntryExists({ root, path: "note.txt" });

  // assert
  expect(exists).toBe(true);
});

it("throws on empty input", () => {
  // arrange
  const input = "";

  // act & assert
  expect(() => parse(input)).toThrow();
});

it("sums", () => expect(sum(1, 2)).toBe(3));
```

## Options

This rule has no options.
