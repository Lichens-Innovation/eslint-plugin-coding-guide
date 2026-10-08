import type { TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";

import { createRule } from "../create-rule.js";
import {
  flattenLogicalChain,
  isJsxNode,
  isNegation,
  isNullLiteral,
  isTypeWrapper,
  isUndefinedIdentifier,
} from "../utils/ast.utils.js";

// Mirrors the ts.TypeFlags bit values we need — avoids a runtime dependency on
// the "typescript" package just for these constants (the `Type` values themselves
// come from the consumer's own type-aware parser services at lint time).
const TYPE_FLAG_UNDEFINED = 4;
const TYPE_FLAG_NULL = 8;
const TYPE_FLAG_VOID = 16;
const TYPE_FLAG_BOOLEAN = 256;
const TYPE_FLAG_BOOLEAN_LITERAL = 8192;
const TYPE_FLAG_NEVER = 262144;
const BOOLEANISH_FLAGS =
  TYPE_FLAG_BOOLEAN |
  TYPE_FLAG_BOOLEAN_LITERAL |
  TYPE_FLAG_NULL |
  TYPE_FLAG_UNDEFINED |
  TYPE_FLAG_VOID |
  TYPE_FLAG_NEVER;

const unwrap = (node: TSESTree.Expression): TSESTree.Expression => {
  let current = node;
  while (isTypeWrapper(current) || current.type === "ChainExpression") {
    current = current.expression;
  }
  return current;
};

const isJsxChildExpression = (node: TSESTree.Node): boolean => {
  const container = node.parent;
  if (!container || container.type !== "JSXExpressionContainer") return false;
  return isJsxNode(container.parent);
};

const isDiscardedNode = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (inner.type === "Literal" && inner.value === false) return true;
  return isNullLiteral(inner) || isUndefinedIdentifier(inner);
};

const isLengthAccess = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  return (
    inner.type === "MemberExpression" &&
    !inner.computed &&
    inner.property.type === "Identifier" &&
    inner.property.name === "length"
  );
};

const isSyntacticallyBoolean = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (isNegation(inner)) return true;
  if (inner.type === "BinaryExpression") return true;
  if (inner.type === "CallExpression") return true;
  if (inner.type === "Literal" && typeof inner.value === "boolean") return true;
  if (inner.type === "LogicalExpression" && inner.operator === "&&") {
    return isSyntacticallyBoolean(inner.left) && isSyntacticallyBoolean(inner.right);
  }
  return false;
};

const needsCoerceWithoutType = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (inner.type === "Identifier") return false;
  if (inner.type === "Literal" && typeof inner.value === "boolean") return false;
  return !isJsxNode(inner);
};

const isOptionalJsxTernary = (node: TSESTree.ConditionalExpression): boolean =>
  isJsxNode(node.consequent) && isDiscardedNode(node.alternate);

const isBooleanishType = (type?: Type): boolean => {
  if (!type) return false;
  if (type.flags & BOOLEANISH_FLAGS) return true;
  if (type.isUnion()) return type.types.every(isBooleanishType);
  return false;
};

// The last `&&` operand is the rendered content (JSX, string, node...), not a guard —
// only the preceding operands can leak a falsy non-boolean value into the output.
const collectGuardLeaves = (node: TSESTree.Expression): TSESTree.Expression[] =>
  flattenLogicalChain({ node, operator: "&&" })
    .slice(0, -1)
    .filter((leaf) => !isJsxNode(leaf));

export default createRule({
  name: "prefer-jsx-short-circuit",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer && short-circuit for optional JSX, with a boolean left side",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferShortCircuit: "Use `&&` short-circuit instead of `cond ? jsx : null` for optional rendering.",
      requireBooleanGuard:
        "Left side of `&&` in JSX may leak a non-boolean value — use `!!value` or a boolean comparison.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const getTextPreservingParens = (node: TSESTree.Node): string => {
      const tokenBefore = sourceCode.getTokenBefore(node);
      const tokenAfter = sourceCode.getTokenAfter(node);
      if (tokenBefore?.value === "(" && tokenAfter?.value === ")") {
        return sourceCode.text.slice(tokenBefore.range[0], tokenAfter.range[1]);
      }
      return sourceCode.getText(node);
    };

    const getTypeAtNode = (node: TSESTree.Node): Type | undefined => {
      try {
        const services = sourceCode.parserServices;
        if (!services?.program || !services.esTreeNodeToTSNodeMap) return undefined;
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        if (!tsNode) return undefined;
        return services.program.getTypeChecker().getTypeAtLocation(tsNode);
      } catch {
        return undefined;
      }
    };

    const needsBooleanCoerce = (node: TSESTree.Expression): boolean => {
      if (isSyntacticallyBoolean(node)) return false;
      if (isLengthAccess(node)) return true;

      const type = getTypeAtNode(node);
      if (type) return !isBooleanishType(type);

      return needsCoerceWithoutType(node);
    };

    const coerceText = (node: TSESTree.Expression): string => {
      const text = sourceCode.getText(node);
      if (isLengthAccess(node)) return `${text} > 0`;
      const inner = unwrap(node);
      if (["Identifier", "MemberExpression", "ChainExpression"].includes(inner.type)) {
        return `!!${text}`;
      }
      return `!!(${text})`;
    };

    const formatBooleanTest = (node: TSESTree.Expression): string => {
      if (node.type === "LogicalExpression" && node.operator === "&&") {
        return `${formatBooleanTest(node.left)} && ${formatBooleanTest(node.right)}`;
      }
      if (needsBooleanCoerce(node)) return coerceText(node);
      return sourceCode.getText(node);
    };

    return {
      "JSXExpressionContainer > ConditionalExpression"(node: TSESTree.Node) {
        if (node.type !== "ConditionalExpression") return;
        if (!isJsxChildExpression(node)) return;
        if (!isOptionalJsxTernary(node)) return;

        context.report({
          node,
          messageId: "preferShortCircuit",
          fix: (fixer) => {
            const testText = formatBooleanTest(node.test);
            const consequentText = getTextPreservingParens(node.consequent);
            return fixer.replaceText(node, `${testText} && ${consequentText}`);
          },
        });
      },

      "JSXExpressionContainer > LogicalExpression[operator='&&']"(node: TSESTree.Node) {
        if (node.type !== "LogicalExpression") return;
        if (!isJsxChildExpression(node)) return;

        for (const leaf of collectGuardLeaves(node)) {
          if (!needsBooleanCoerce(leaf)) continue;

          context.report({
            node: leaf,
            messageId: "requireBooleanGuard",
            fix: (fixer) => fixer.replaceText(leaf, coerceText(leaf)),
          });
        }
      },
    };
  },
});
