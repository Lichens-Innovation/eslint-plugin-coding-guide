import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const TESTID_QUERY_RE = /^(get|query|find)(All)?ByTestId$/;

interface CheckNameArgs {
  node: TSESTree.Node;
  name: string;
}

export default createRule({
  name: "prefer-role-query-over-testid",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer Testing Library's *ByRole queries over *ByTestId",
    },
    schema: [],
    messages: {
      preferRole: "'{{name}}' — prefer the equivalent `*ByRole` query for a semantic, accessible selector.",
    },
  },
  defaultOptions: [],
  create(context) {
    const checkName = ({ node, name }: CheckNameArgs): void => {
      if (!TESTID_QUERY_RE.test(name)) return;
      context.report({ node, messageId: "preferRole", data: { name } });
    };

    return {
      CallExpression(node) {
        if (node.callee.type === "Identifier") {
          checkName({ node, name: node.callee.name });
        } else if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
          checkName({ node: node.callee.property, name: node.callee.property.name });
        }
      },
    };
  },
});
