import { createRule } from "../create-rule.js";

export default createRule({
  name: "no-tests-in-dunder-folder",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow test files inside a __tests__ folder",
    },
    schema: [],
    messages: {
      colocate: "This test lives in a `__tests__` folder — colocate it as `*.test.ts(x)` next to its source file.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const filename = context.filename.replaceAll("\\", "/");
        if (!filename.includes("/__tests__/")) return;

        context.report({ node, messageId: "colocate" });
      },
    };
  },
});
