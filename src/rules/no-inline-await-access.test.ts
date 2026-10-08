import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-await-access.js";

ruleTester.run("no-inline-await-access", rule, {
  valid: [
    { code: "const response = await fetch(url);" },
    {
      code: `
        const response = await fetch(url);
        const data = response.json();
      `,
    },
    { code: "const items = await getItems(); const first = items[0];" },
    { code: "const result = await Promise.all([a, b]);" },
    { code: "await service.load(id);" },
    { code: "const value = (await getValue()) ?? fallback;" },
  ],
  invalid: [
    {
      code: "const data = (await fetch(url)).json();",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const name = (await getUser(id)).name;",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const first = (await getItems())[0];",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const name = (await getUser(id))?.name;",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const name = (await getUser(id))!.name;",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const name = ((await getUser(id)) as User).name;",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const result = (await loadHandler())();",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const data = await (await fetch(url)).json();",
      errors: [{ messageId: "inlineAwait" }],
    },
    {
      code: "const entries = (await listOpfsDirectoryEntries({ root, path })).sort(compareEntriesFoldersFirst);",
      errors: [{ messageId: "inlineAwait" }],
    },
  ],
});
