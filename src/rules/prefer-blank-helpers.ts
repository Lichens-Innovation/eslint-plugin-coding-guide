import type { TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";

import { createRule } from "../create-rule.js";
import { isNegation } from "../utils/ast.utils.js";

// Mirrors the ts.TypeFlags bit values we need — avoids a runtime dependency on
// the "typescript" package just for these constants.
const TYPE_FLAG_UNDEFINED = 4;
const TYPE_FLAG_NULL = 8;
const TYPE_FLAG_VOID = 16;
const TYPE_FLAG_STRING = 32;
const TYPE_FLAG_STRING_LITERAL = 1024;
const TYPE_FLAG_TEMPLATE_LITERAL = 4194304;
const TYPE_FLAG_STRING_MAPPING = 8388608;
const STRING_FLAGS =
  TYPE_FLAG_STRING | TYPE_FLAG_STRING_LITERAL | TYPE_FLAG_TEMPLATE_LITERAL | TYPE_FLAG_STRING_MAPPING;
const NULLISH_FLAGS = TYPE_FLAG_UNDEFINED | TYPE_FLAG_NULL | TYPE_FLAG_VOID;

const EQUALITY_OPERATORS = ["===", "=="];
const INEQUALITY_OPERATORS = ["!==", "!="];

type MessageId = "preferIsBlank" | "preferIsNotBlank" | "preferBlankFallback";

const isStringType = (type: Type): boolean => (type.flags & STRING_FLAGS) !== 0;

/** True for `string`, string literals, and their unions with null/undefined (at least one string member). */
const isNullableStringType = (type?: Type): boolean => {
  if (!type) return false;
  if (isStringType(type)) return true;
  if (!type.isUnion()) return false;
  return (
    type.types.some(isStringType) &&
    type.types.every((member) => isStringType(member) || !!(member.flags & NULLISH_FLAGS))
  );
};

const isEmptyStringLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === "";

const isZeroLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === 0;

interface GetMemberObjectArgs {
  node: TSESTree.Node;
  propertyName: string;
}

const getMemberObject = ({ node, propertyName }: GetMemberObjectArgs): TSESTree.Expression | undefined => {
  if (node.type !== "MemberExpression" || node.computed) return undefined;
  if (node.property.type !== "Identifier" || node.property.name !== propertyName) return undefined;
  return node.object;
};

const getTrimSubject = (node: TSESTree.Node): TSESTree.Expression | undefined => {
  const inner = node.type === "ChainExpression" ? node.expression : node;
  if (inner.type !== "CallExpression" || inner.arguments.length > 0) return undefined;
  return getMemberObject({ node: inner.callee, propertyName: "trim" });
};

interface NegationParts {
  operand: TSESTree.Expression;
  isDoubleNegation: boolean;
}

const getNegationParts = (node: TSESTree.UnaryExpression): NegationParts => {
  if (isNegation(node.argument)) return { operand: node.argument.argument, isDoubleNegation: true };
  return { operand: node.argument, isDoubleNegation: false };
};

export default createRule({
  name: "prefer-blank-helpers",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer isBlank/isNotBlank over manual empty-string checks, falsy checks and `||` fallbacks on strings",
    },
    schema: [],
    messages: {
      preferIsBlank:
        "Manual empty-string check — use `isBlank({{expr}})` (handles null, undefined, empty and whitespace-only strings).",
      preferIsNotBlank:
        "Manual non-empty-string check — use `isNotBlank({{expr}})` (handles null, undefined, empty and whitespace-only strings).",
      preferBlankFallback:
        "`||` fallback on a string — use `isBlank({{expr}}) ? fallback : {{expr}}` to make the blank-string intent explicit.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

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

    const isStringExpression = (node: TSESTree.Node): boolean => isNullableStringType(getTypeAtNode(node));

    /** Without type information, assume the operand of `=== ""` is a string. */
    const isMaybeStringExpression = (node: TSESTree.Node): boolean => {
      const type = getTypeAtNode(node);
      return !type || isNullableStringType(type);
    };

    interface ReportArgs {
      node: TSESTree.Node;
      messageId: MessageId;
      subject: TSESTree.Node;
    }

    const report = ({ node, messageId, subject }: ReportArgs): void => {
      context.report({ node, messageId, data: { expr: sourceCode.getText(subject) } });
    };

    interface ComparisonSides {
      side: TSESTree.Node;
      other: TSESTree.Node;
    }

    const getEmptyStringComparisonSubject = (side: TSESTree.Node): TSESTree.Node | undefined => {
      const trimSubject = getTrimSubject(side);
      if (trimSubject) return trimSubject;
      return isMaybeStringExpression(side) ? side : undefined;
    };

    const getZeroLengthComparisonSubject = (side: TSESTree.Node): TSESTree.Node | undefined => {
      const lengthObject = getMemberObject({ node: side, propertyName: "length" });
      if (!lengthObject) return undefined;
      const trimSubject = getTrimSubject(lengthObject);
      if (trimSubject) return trimSubject;
      return isStringExpression(lengthObject) ? lengthObject : undefined;
    };

    const getBlankCheckSubject = ({ side, other }: ComparisonSides): TSESTree.Node | undefined => {
      if (isEmptyStringLiteral(other)) return getEmptyStringComparisonSubject(side);
      if (isZeroLiteral(other)) return getZeroLengthComparisonSubject(side);
      return undefined;
    };

    const getComparisonSubject = (node: TSESTree.BinaryExpression): TSESTree.Node | undefined =>
      getBlankCheckSubject({ side: node.left, other: node.right }) ??
      getBlankCheckSubject({ side: node.right, other: node.left });

    const getFalsyCheckSubject = (node: TSESTree.Node): TSESTree.Node | undefined => {
      const trimSubject = getTrimSubject(node);
      if (trimSubject) return trimSubject;
      return isStringExpression(node) ? node : undefined;
    };

    return {
      BinaryExpression(node) {
        const isEquality = EQUALITY_OPERATORS.includes(node.operator);
        if (!isEquality && !INEQUALITY_OPERATORS.includes(node.operator)) return;
        if (node.left.type === "PrivateIdentifier") return;

        const subject = getComparisonSubject(node);
        if (!subject) return;

        report({ node, messageId: isEquality ? "preferIsBlank" : "preferIsNotBlank", subject });
      },

      UnaryExpression(node) {
        if (!isNegation(node) || isNegation(node.parent)) return;

        const { operand, isDoubleNegation } = getNegationParts(node);
        const subject = getFalsyCheckSubject(operand);
        if (!subject) return;

        report({ node, messageId: isDoubleNegation ? "preferIsNotBlank" : "preferIsBlank", subject });
      },

      LogicalExpression(node) {
        if (node.operator !== "||") return;

        const subject = getFalsyCheckSubject(node.left);
        if (!subject) return;

        report({ node, messageId: "preferBlankFallback", subject });
      },
    };
  },
});
