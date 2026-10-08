import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isNegation } from "../utils/ast.utils.js";
import { createTypeResolver, isNullableStringType } from "../utils/type.utils.js";

const EQUALITY_OPERATORS = ["===", "=="];
const INEQUALITY_OPERATORS = ["!==", "!="];

type MessageId = "preferIsBlank" | "preferIsNotBlank" | "preferBlankFallback" | "preferBlankFallbackExtract";

const isEmptyStringLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === "";

const isZeroLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === 0;

/** Identifiers and property chains (`a.b?.c`), which can be repeated in `isBlank(x) ? fallback : x` without side effects. */
const isSimpleReference = (node: TSESTree.Node): boolean => {
  if (node.type === "ChainExpression") return isSimpleReference(node.expression);
  if (node.type === "Identifier" || node.type === "ThisExpression") return true;
  if (node.type !== "MemberExpression") return false;
  const isStaticProperty = !node.computed || node.property.type === "Literal";
  return isStaticProperty && isSimpleReference(node.object);
};

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
      preferBlankFallbackExtract:
        "`||` fallback on a string — store `{{expr}}` in a local variable, then use `isBlank(variable) ? fallback : variable` so it is not evaluated twice.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const getTypeAtNode = createTypeResolver(sourceCode);

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

        const messageId = isSimpleReference(subject) ? "preferBlankFallback" : "preferBlankFallbackExtract";
        report({ node, messageId, subject });
      },
    };
  },
});
