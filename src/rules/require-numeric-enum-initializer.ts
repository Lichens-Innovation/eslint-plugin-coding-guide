import { createRule } from "../create-rule.js";

export default createRule({
  name: "require-numeric-enum-initializer",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require an explicit initializer on every enum member",
    },
    schema: [],
    messages: {
      missingInitializer: "Enum member '{{name}}' has no explicit initializer — assign an explicit value.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSEnumMember(node) {
        if (node.initializer) return;

        const name = node.id.type === "Identifier" ? node.id.name : context.sourceCode.getText(node.id);
        context.report({
          node,
          messageId: "missingInitializer",
          data: { name },
        });
      },
    };
  },
});
