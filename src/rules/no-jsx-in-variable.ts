import { createRule } from "../create-rule.js";

export default createRule({
  name: "no-jsx-in-variable",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow storing a JSX element/fragment in a variable",
    },
    schema: [],
    messages: {
      declareComponent: "JSX stored in a variable — declare a small named component with explicit props instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (!node.init) return;
        if (node.init.type !== "JSXElement" && node.init.type !== "JSXFragment") return;

        context.report({ node, messageId: "declareComponent" });
      },
    };
  },
});
