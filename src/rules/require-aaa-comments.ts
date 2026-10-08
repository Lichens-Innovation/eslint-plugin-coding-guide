import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const TEST_FUNCTIONS = new Set(["it", "test"]);
const SECTION_RE = /^\s*(arrange|act|assert)\b(?:\s*(?:&|and|\+|\/)\s*(act|assert)\b)?/i;
const REQUIRED_SECTIONS = ["act", "assert"];

type TestCallback = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const getRootIdentifierName = (node: TSESTree.Node): string | null => {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") return getRootIdentifierName(node.object);
  if (node.type === "CallExpression") return getRootIdentifierName(node.callee);
  if (node.type === "TaggedTemplateExpression") return getRootIdentifierName(node.tag);
  return null;
};

const isTestCallback = (node: TSESTree.CallExpressionArgument): node is TestCallback =>
  node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression";

const isExpectStatement = (statement: TSESTree.Statement): boolean => {
  if (statement.type !== "ExpressionStatement") return false;
  const expression =
    statement.expression.type === "AwaitExpression" ? statement.expression.argument : statement.expression;
  return expression.type === "CallExpression" && getRootIdentifierName(expression.callee) === "expect";
};

const toSections = (comment: TSESTree.Comment): string[] => {
  const match = SECTION_RE.exec(comment.value);
  if (!match) return [];
  return [match[1], match[2]].flatMap((section) => (section ? [section.toLowerCase()] : []));
};

export default createRule({
  name: "require-aaa-comments",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require `// arrange`, `// act` and `// assert` comments in multi-statement tests",
    },
    schema: [],
    messages: {
      missingSections:
        "Mark the phases of this test with `// arrange`, `// act` and `// assert` comments (missing: {{missing}}).",
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      CallExpression(node) {
        if (!TEST_FUNCTIONS.has(getRootIdentifierName(node.callee) ?? "")) return;

        const callback = node.arguments.find(isTestCallback);
        if (callback?.body.type !== "BlockStatement") return;

        const statements = callback.body.body;
        if (statements.length < 2 || statements.every(isExpectStatement)) return;

        const sections = new Set(sourceCode.getCommentsInside(callback.body).flatMap(toSections));
        const missing = REQUIRED_SECTIONS.filter((section) => !sections.has(section));
        if (missing.length === 0) return;

        context.report({
          node: callback,
          messageId: "missingSections",
          data: { missing: missing.map((section) => `// ${section}`).join(", ") },
        });
      },
    };
  },
});
