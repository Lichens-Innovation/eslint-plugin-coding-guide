import { createRule } from "../create-rule.js";

export default createRule({
  name: "no-exported-mutable-state",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow exporting a mutable (let/var) module-scoped binding",
    },
    schema: [],
    messages: {
      noMutableExport: "Do not export a mutable ({{kind}}) binding — export a const, or a getter/setter pair.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (!declaration || declaration.type !== "VariableDeclaration") return;
        if (declaration.kind === "const") return;

        context.report({
          node,
          messageId: "noMutableExport",
          data: { kind: declaration.kind },
        });
      },
    };
  },
});
